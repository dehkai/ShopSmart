import sqlite3
from src.models import PremisePrice, ItemMatch, BasketItemResult, BasketResult, StateRanking, StoreRanking


def _placeholders(n: int) -> str:
    return ",".join(["?"] * n)


def find_cheapest_item(item_code: int, db_path: str, state: str | None = None) -> PremisePrice | None:
    with sqlite3.connect(db_path) as conn:
        if state:
            row = conn.execute(
                """
                SELECT prices.premise_code, premises.premise, premises.state, prices.price, premises.address
                FROM prices
                JOIN premises ON prices.premise_code = premises.premise_code
                WHERE prices.item_code = ? AND premises.state = ?
                ORDER BY prices.price ASC
                LIMIT 1
                """,
                (item_code, state),
            ).fetchone()
        else:
            row = conn.execute(
                """
                SELECT prices.premise_code, premises.premise, premises.state, prices.price, premises.address
                FROM prices
                JOIN premises ON prices.premise_code = premises.premise_code
                WHERE prices.item_code = ?
                ORDER BY prices.price ASC
                LIMIT 1
                """,
                (item_code,),
            ).fetchone()

    if row is None:
        return None

    return PremisePrice(premise_code=row[0], premise=row[1], state=row[2], price=row[3], address=row[4])


def get_premise_info(premise_code: int, db_path: str) -> tuple[str, str, str | None] | None:
    with sqlite3.connect(db_path) as conn:
        row = conn.execute(
            "SELECT premise, state, address FROM premises WHERE premise_code = ? LIMIT 1",
            (premise_code,),
        ).fetchone()
    return (row[0], row[1], row[2]) if row else None


def get_item_price_at_store(item_code: int, premise_code: int, db_path: str) -> float | None:
    with sqlite3.connect(db_path) as conn:
        row = conn.execute(
            "SELECT price FROM prices WHERE item_code = ? AND premise_code = ? LIMIT 1",
            (item_code, premise_code),
        ).fetchone()
    return row[0] if row else None


def find_cheapest_store(item_codes: list[int], db_path: str, state: str | None = None) -> tuple[int, float] | None:
    with sqlite3.connect(db_path) as conn:
        if state:
            row = conn.execute(
                f"""
                SELECT prices.premise_code, SUM(prices.price) AS total_price
                FROM prices
                JOIN premises ON prices.premise_code = premises.premise_code
                WHERE prices.item_code IN ({_placeholders(len(item_codes))})
                AND premises.state = ?
                GROUP BY prices.premise_code
                HAVING COUNT(DISTINCT prices.item_code) = ?
                ORDER BY total_price ASC
                LIMIT 1
                """,
                (*item_codes, state, len(item_codes)),
            ).fetchone()
        else:
            row = conn.execute(
                f"""
                SELECT prices.premise_code, SUM(prices.price) AS total_price
                FROM prices
                WHERE prices.item_code IN ({_placeholders(len(item_codes))})
                GROUP BY prices.premise_code
                HAVING COUNT(DISTINCT item_code) = ?
                ORDER BY total_price ASC
                LIMIT 1
                """,
                (*item_codes, len(item_codes)),
            ).fetchone()

    return (row[0], row[1]) if row else None


def state_ranking(item_codes: list[int], db_path: str) -> list[StateRanking]:
    with sqlite3.connect(db_path) as conn:
        rows = conn.execute(
            f"""
            SELECT pr.state, MIN(store_total) AS total, ? AS items_found
            FROM (
                SELECT pr.state, p.premise_code, SUM(p.price) AS store_total
                FROM prices p
                JOIN premises pr ON p.premise_code = pr.premise_code
                WHERE p.item_code IN ({_placeholders(len(item_codes))})
                GROUP BY pr.state, p.premise_code
                HAVING COUNT(DISTINCT p.item_code) = ?
            ) t
            JOIN premises pr ON t.premise_code = pr.premise_code
            GROUP BY pr.state
            ORDER BY total ASC
            """,
            (len(item_codes), *item_codes, len(item_codes)),
        ).fetchall()

    seen: set[str] = set()
    result = []
    for row in rows:
        if row[0] not in seen:
            seen.add(row[0])
            result.append(StateRanking(state=row[0], total=round(row[1], 2), items_found=row[2]))
    return result


def top_stores_in_state(
    item_codes: list[int], db_path: str, state: str, limit: int = 5
) -> list[StoreRanking]:

    with sqlite3.connect(db_path) as conn:
        rows = conn.execute(
            f"""
            SELECT pr.premise_code, pr.premise, pr.state, SUM(p.price) AS total, COUNT(DISTINCT p.item_code) AS items_found, pr.address
            FROM prices p
            JOIN premises pr ON p.premise_code = pr.premise_code
            WHERE p.item_code IN ({_placeholders(len(item_codes))})
            AND pr.state = ?
            GROUP BY pr.premise_code, pr.premise, pr.state, pr.address
            HAVING COUNT(DISTINCT p.item_code) = ?
            ORDER BY total ASC
            LIMIT ?
            """,
            (*item_codes, state, len(item_codes), limit),
        ).fetchall()

        # Fallback: stores with partial stock
        if not rows:
            rows = conn.execute(
                f"""
                SELECT pr.premise_code, pr.premise, pr.state, SUM(p.price) AS total, COUNT(DISTINCT p.item_code) AS items_found, pr.address
                FROM prices p
                JOIN premises pr ON p.premise_code = pr.premise_code
                WHERE p.item_code IN ({_placeholders(len(item_codes))})
                AND pr.state = ?
                GROUP BY pr.premise_code, pr.premise, pr.state, pr.address
                ORDER BY items_found DESC, total ASC
                LIMIT ?
                """,
                (*item_codes, state, limit),
            ).fetchall()

    return [
        StoreRanking(
            premise_code=row[0],
            premise=row[1],
            state=row[2],
            total=round(row[3], 2),
            items_found=row[4],
            address=row[5],
        )
        for row in rows
    ]


def _average_total(item_codes: list[int], db_path: str, state: str | None = None) -> float:
    with sqlite3.connect(db_path) as conn:
        if state:
            row = conn.execute(
                f"""
                SELECT SUM(avg_price)
                FROM (
                    SELECT AVG(p.price) AS avg_price
                    FROM prices p
                    JOIN premises pr ON p.premise_code = pr.premise_code
                    WHERE p.item_code IN ({_placeholders(len(item_codes))})
                    AND pr.state = ?
                    GROUP BY p.item_code
                )
                """,
                (*item_codes, state),
            ).fetchone()
        else:
            row = conn.execute(
                f"""
                SELECT SUM(avg_price)
                FROM (
                    SELECT AVG(price) AS avg_price
                    FROM prices
                    WHERE item_code IN ({_placeholders(len(item_codes))})
                    GROUP BY item_code
                )
                """,
                item_codes,
            ).fetchone()

    return row[0] or 0.0


def optimize(matches: list[ItemMatch], db_path: str, state: str | None = None) -> BasketResult:
    resolved = []
    unresolved = []
    items = []

    for match in matches:
        if not match.resolved:
            unresolved.append(match.query)
            continue

        resolved.append(match)
        try:
            cheapest = find_cheapest_item(match.item_code, db_path, state=state)
        except sqlite3.Error:
            unresolved.append(match.query)
            continue
        if cheapest:
            items.append(BasketItemResult(
                item_code=match.item_code,
                item_name=match.item_name,
                cheapest=cheapest,
            ))
        else:
            unresolved.append(match.query)

    item_codes = [m.item_code for m in resolved]
    if not item_codes:
        return BasketResult(matches=matches, items=[], total=0.0, savings=0.0, unresolved=unresolved)

    try:
        cheapest_store = find_cheapest_store(item_codes, db_path, state=state)
        cheapest_total = sum(item.cheapest.price for item in items if item.cheapest)
        average_total = _average_total(item_codes, db_path, state=state)
        ranking = state_ranking(item_codes, db_path)
        if state:
            store_rank = top_stores_in_state(item_codes, db_path, state)
        elif cheapest_store:
            info = get_premise_info(cheapest_store[0], db_path)
            store_rank = [StoreRanking(
                premise_code=cheapest_store[0],
                premise=info[0] if info else f"Store {cheapest_store[0]}",
                state=info[1] if info else None,
                total=round(cheapest_store[1], 2),
                items_found=len(item_codes),
                address=info[2] if info else None,
            )] if info else []
        else:
            store_rank = []
    except sqlite3.Error as e:
        return BasketResult(
            matches=matches,
            items=items,
            unresolved=unresolved,
            error=f"Database error: {e}",
        )

    if cheapest_store:
        best_total = round(cheapest_store[1], 2)
        is_single_store = True
        best_premise_code = cheapest_store[0]
    elif store_rank:
        # No store stocks all items — use best partial store total
        best_total = store_rank[0].total
        is_single_store = False
        best_premise_code = store_rank[0].premise_code
    else:
        # Theoretical cross-store minimum
        best_total = round(cheapest_total, 2)
        is_single_store = False
        best_premise_code = None

    # Populate store_price: price of each item at the recommended basket store
    if best_premise_code is not None:
        for item in items:
            item.store_price = get_item_price_at_store(item.item_code, best_premise_code, db_path)

    savings = round(average_total - best_total, 2)

    return BasketResult(
        matches=matches,
        items=items,
        state_ranking=ranking,
        store_ranking=store_rank,
        total=best_total,
        savings=savings,
        is_single_store=is_single_store,
        unresolved=unresolved,
    )
