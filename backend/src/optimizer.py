import sqlite3
from src.models import PremisePrice, ItemMatch, BasketItemResult, BasketResult, StateRanking


def _placeholders(n: int) -> str:
    return ",".join(["?"] * n)


def find_cheapest_item(item_code: int, db_path: str) -> PremisePrice | None:
    with sqlite3.connect(db_path) as conn:
        row = conn.execute(
            """
            SELECT prices.premise_code, premises.premise, premises.state, prices.price
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

    return PremisePrice(premise_code=row[0], premise=row[1], state=row[2], price=row[3])


def find_cheapest_store(item_codes: list[int], db_path: str) -> tuple[int, float] | None:
    with sqlite3.connect(db_path) as conn:
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
            SELECT pr.state, SUM(min_price) AS total, COUNT(*) AS items_found
            FROM (
                SELECT pr2.state, MIN(p.price) AS min_price
                FROM prices p
                JOIN premises pr2 ON p.premise_code = pr2.premise_code
                WHERE p.item_code IN ({_placeholders(len(item_codes))})
                GROUP BY pr2.state, p.item_code
            ) t
            JOIN premises pr ON pr.state = t.state
            GROUP BY pr.state
            ORDER BY total ASC
            """,
            item_codes,
        ).fetchall()

    seen: set[str] = set()
    result = []
    for row in rows:
        if row[0] not in seen:
            seen.add(row[0])
            result.append(StateRanking(state=row[0], total=round(row[1], 2), items_found=row[2]))
    return result


def _expensive_total(item_codes: list[int], db_path: str) -> float:
    with sqlite3.connect(db_path) as conn:
        row = conn.execute(
            f"""
            SELECT SUM(max_price)
            FROM (
                SELECT MAX(price) AS max_price
                FROM prices
                WHERE item_code IN ({_placeholders(len(item_codes))})
                GROUP BY item_code
            )
            """,
            item_codes,
        ).fetchone()

    return row[0] or 0.0


def optimize(matches: list[ItemMatch], db_path: str) -> BasketResult:
    resolved = []
    unresolved = []
    items = []

    for match in matches:
        if not match.resolved:
            unresolved.append(match.query)
            continue

        resolved.append(match)
        try:
            cheapest = find_cheapest_item(match.item_code, db_path)
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
        cheapest_store = find_cheapest_store(item_codes, db_path)
        cheapest_total = sum(item.cheapest.price for item in items if item.cheapest)
        priciest_total = _expensive_total(item_codes, db_path)
        savings = round(priciest_total - cheapest_total, 2)
        ranking = state_ranking(item_codes, db_path)
    except sqlite3.Error as e:
        return BasketResult(
            matches=matches,
            items=items,
            unresolved=unresolved,
            error=f"Database error: {e}",
        )

    return BasketResult(
        matches=matches,
        items=items,
        state_ranking=ranking,
        total=round(cheapest_store[1], 2) if cheapest_store else round(cheapest_total, 2),
        savings=savings,
        unresolved=unresolved,
    )
