import sqlite3
from src.models import (
    PremisePrice,
    ItemMatch,
    BasketItemResult,
    BasketResult,
    StateRanking,
    StoreRanking,
)
from src.geo import premises_within_radius_with_coords
from src.routes_service import get_driving_distances_km


def _placeholders(n: int) -> str:
    return ",".join(["?"] * n)


def find_cheapest_item(
    item_code: int,
    db_path: str,
    state: str | None = None,
    premise_codes: list[int] | None = None,
    distances: dict[int, float] | None = None,
    coords: dict[int, tuple[float, float]] | None = None,
) -> PremisePrice | None:
    with sqlite3.connect(db_path) as conn:
        if premise_codes is not None:
            row = conn.execute(
                f"""
                SELECT prices.premise_code, premises.premise, premises.state, prices.price, premises.address
                FROM prices
                JOIN premises ON prices.premise_code = premises.premise_code
                WHERE prices.item_code = ? AND premises.premise_code IN ({_placeholders(len(premise_codes))})
                ORDER BY prices.price ASC
                LIMIT 1
                """,
                (item_code, *premise_codes),
            ).fetchone()
        elif state:
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

    store_coords = (coords or {}).get(row[0])
    row_distance = (distances or {}).get(row[0])
    return PremisePrice(
        premise_code=row[0],
        premise=row[1],
        state=row[2],
        price=row[3],
        address=row[4],
        distance_km=row_distance,
        distance_source="straight_line" if row_distance is not None else None,
        latitude=store_coords[0] if store_coords else None,
        longitude=store_coords[1] if store_coords else None,
    )


def get_premise_info(
    premise_code: int, db_path: str
) -> tuple[str, str, str | None] | None:
    with sqlite3.connect(db_path) as conn:
        row = conn.execute(
            "SELECT premise, state, address FROM premises WHERE premise_code = ? LIMIT 1",
            (premise_code,),
        ).fetchone()
    return (row[0], row[1], row[2]) if row else None


def get_item_price_at_store(
    item_code: int, premise_code: int, db_path: str
) -> float | None:
    with sqlite3.connect(db_path) as conn:
        row = conn.execute(
            "SELECT price FROM prices WHERE item_code = ? AND premise_code = ? LIMIT 1",
            (item_code, premise_code),
        ).fetchone()
    return row[0] if row else None


def get_item_prices_list(
    item_code: int, db_path: str, state: str | None = None, limit: int = 5
) -> list[dict]:
    with sqlite3.connect(db_path) as conn:
        if state:
            rows = conn.execute(
                """
                SELECT p.premise_code, pr.premise, pr.state, p.price, pr.address
                FROM prices p
                JOIN premises pr ON p.premise_code = pr.premise_code
                WHERE p.item_code = ? AND pr.state = ?
                ORDER BY p.price ASC
                LIMIT ?
                """,
                (item_code, state, limit),
            ).fetchall()
        else:
            rows = conn.execute(
                """
                SELECT p.premise_code, pr.premise, pr.state, p.price, pr.address
                FROM prices p
                JOIN premises pr ON p.premise_code = pr.premise_code
                WHERE p.item_code = ?
                ORDER BY p.price ASC
                LIMIT ?
                """,
                (item_code, limit),
            ).fetchall()

    return [
        {
            "premise_code": row[0],
            "premise": row[1],
            "state": row[2],
            "price": row[3],
            "address": row[4],
        }
        for row in rows
    ]


def find_cheapest_store(
    item_codes: list[int],
    db_path: str,
    state: str | None = None,
    premise_codes: list[int] | None = None,
) -> tuple[int, float] | None:
    with sqlite3.connect(db_path) as conn:
        if premise_codes is not None:
            row = conn.execute(
                f"""
                SELECT prices.premise_code, SUM(prices.price) AS total_price
                FROM prices
                JOIN premises ON prices.premise_code = premises.premise_code
                WHERE prices.item_code IN ({_placeholders(len(item_codes))})
                AND premises.premise_code IN ({_placeholders(len(premise_codes))})
                GROUP BY prices.premise_code
                HAVING COUNT(DISTINCT prices.item_code) = ?
                ORDER BY total_price ASC
                LIMIT 1
                """,
                (*item_codes, *premise_codes, len(item_codes)),
            ).fetchone()
        elif state:
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

        # Fallback: no state has a single store covering all items — rank by most items found
        if not rows:
            rows = conn.execute(
                f"""
                SELECT pr.state, MIN(store_total) AS total, MAX(items_found) AS items_found
                FROM (
                    SELECT pr.state, p.premise_code, SUM(p.price) AS store_total,
                           COUNT(DISTINCT p.item_code) AS items_found
                    FROM prices p
                    JOIN premises pr ON p.premise_code = pr.premise_code
                    WHERE p.item_code IN ({_placeholders(len(item_codes))})
                    GROUP BY pr.state, p.premise_code
                ) t
                JOIN premises pr ON t.premise_code = pr.premise_code
                GROUP BY pr.state
                ORDER BY items_found DESC, total ASC
                """,
                (*item_codes,),
            ).fetchall()

    seen: set[str] = set()
    result = []
    for row in rows:
        if row[0] not in seen:
            seen.add(row[0])
            result.append(
                StateRanking(state=row[0], total=round(row[1], 2), items_found=row[2])
            )
    return result


def top_stores_in_state(
    item_codes: list[int],
    db_path: str,
    state: str | None = None,
    limit: int = 5,
    premise_codes: list[int] | None = None,
    distances: dict[int, float] | None = None,
    coords: dict[int, tuple[float, float]] | None = None,
) -> list[StoreRanking]:

    with sqlite3.connect(db_path) as conn:
        if premise_codes is not None:
            rows = conn.execute(
                f"""
                SELECT pr.premise_code, pr.premise, pr.state, SUM(p.price) AS total, COUNT(DISTINCT p.item_code) AS items_found, pr.address
                FROM prices p
                JOIN premises pr ON p.premise_code = pr.premise_code
                WHERE p.item_code IN ({_placeholders(len(item_codes))})
                AND pr.premise_code IN ({_placeholders(len(premise_codes))})
                GROUP BY pr.premise_code, pr.premise, pr.state, pr.address
                HAVING COUNT(DISTINCT p.item_code) = ?
                ORDER BY total ASC
                LIMIT ?
                """,
                (*item_codes, *premise_codes, len(item_codes), limit),
            ).fetchall()

            # Fallback: stores with partial stock
            if not rows:
                rows = conn.execute(
                    f"""
                    SELECT pr.premise_code, pr.premise, pr.state, SUM(p.price) AS total, COUNT(DISTINCT p.item_code) AS items_found, pr.address
                    FROM prices p
                    JOIN premises pr ON p.premise_code = pr.premise_code
                    WHERE p.item_code IN ({_placeholders(len(item_codes))})
                    AND pr.premise_code IN ({_placeholders(len(premise_codes))})
                    GROUP BY pr.premise_code, pr.premise, pr.state, pr.address
                    ORDER BY items_found DESC, total ASC
                    LIMIT ?
                    """,
                    (*item_codes, *premise_codes, limit),
                ).fetchall()
        elif state:
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
        else:
            rows = conn.execute(
                f"""
                SELECT pr.premise_code, pr.premise, pr.state, SUM(p.price) AS total, COUNT(DISTINCT p.item_code) AS items_found, pr.address
                FROM prices p
                JOIN premises pr ON p.premise_code = pr.premise_code
                WHERE p.item_code IN ({_placeholders(len(item_codes))})
                GROUP BY pr.premise_code, pr.premise, pr.state, pr.address
                HAVING COUNT(DISTINCT p.item_code) = ?
                ORDER BY total ASC
                LIMIT ?
                """,
                (*item_codes, len(item_codes), limit),
            ).fetchall()

            # Fallback: stores with partial stock
            if not rows:
                rows = conn.execute(
                    f"""
                    SELECT pr.premise_code, pr.premise, pr.state, SUM(p.price) AS total, COUNT(DISTINCT p.item_code) AS items_found, pr.address
                    FROM prices p
                    JOIN premises pr ON p.premise_code = pr.premise_code
                    WHERE p.item_code IN ({_placeholders(len(item_codes))})
                    GROUP BY pr.premise_code, pr.premise, pr.state, pr.address
                    ORDER BY items_found DESC, total ASC
                    LIMIT ?
                    """,
                    (*item_codes, limit),
                ).fetchall()

    result = []
    for row in rows:
        row_distance = (distances or {}).get(row[0])
        result.append(
            StoreRanking(
                premise_code=row[0],
                premise=row[1],
                state=row[2],
                total=round(row[3], 2),
                items_found=row[4],
                address=row[5],
                distance_km=row_distance,
                distance_source="straight_line" if row_distance is not None else None,
                latitude=(coords or {}).get(row[0], (None, None))[0],
                longitude=(coords or {}).get(row[0], (None, None))[1],
            )
        )
    return result



def _average_total(
    item_codes: list[int],
    db_path: str,
    state: str | None = None,
    premise_codes: list[int] | None = None,
) -> float:
    with sqlite3.connect(db_path) as conn:
        if premise_codes is not None:
            row = conn.execute(
                f"""
                SELECT SUM(avg_price)
                FROM (
                    SELECT AVG(p.price) AS avg_price
                    FROM prices p
                    JOIN premises pr ON p.premise_code = pr.premise_code
                    WHERE p.item_code IN ({_placeholders(len(item_codes))})
                    AND pr.premise_code IN ({_placeholders(len(premise_codes))})
                    GROUP BY p.item_code
                )
                """,
                (*item_codes, *premise_codes),
            ).fetchone()
        elif state:
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


def optimize(
    matches: list[ItemMatch],
    db_path: str,
    state: str | None = None,
    lat: float | None = None,
    lng: float | None = None,
    radius_km: float | None = None,
    ors_api_key: str | None = None,
) -> BasketResult:
    # GPS coords take priority over the state filter — radius crosses state
    # lines by design (see plan: state/district become display metadata).
    premise_codes: list[int] | None = None
    distances: dict[int, float] = {}
    coords: dict[int, tuple[float, float]] = {}
    radius_km_used: float | None = None
    no_stores_in_radius = False

    if lat is not None and lng is not None:
        radius = radius_km or 10.0
        within = premises_within_radius_with_coords(db_path, lat, lng, radius)
        radius_km_used = radius
        if not within and radius < 25.0:
            within = premises_within_radius_with_coords(db_path, lat, lng, 25.0)
            radius_km_used = 25.0
        if within:
            distances = {code: d for code, (d, _, _) in within.items()}
            coords = {code: (la, ln) for code, (_, la, ln) in within.items()}
            premise_codes = list(within.keys())
        else:
            # No stores geocoded within range even after expansion — fall
            # back to whatever `state` filter was supplied (None = national).
            no_stores_in_radius = True

    resolved = []
    unresolved = []
    items = []

    for match in matches:
        if not match.resolved:
            unresolved.append(match.query)
            continue

        resolved.append(match)
        try:
            cheapest = find_cheapest_item(
                match.item_code,
                db_path,
                state=state,
                premise_codes=premise_codes,
                distances=distances,
                coords=coords,
            )
        except sqlite3.Error as e:
            item_codes_in_items = {it.item_code for it in items}
            unres = [m.query for m in matches if not m.resolved or m.item_code not in item_codes_in_items]
            return BasketResult(
                matches=matches,
                items=items,
                unresolved=unres,
                error=f"Database error: {e}",
            )
        if cheapest:
            items.append(
                BasketItemResult(
                    item_code=match.item_code,
                    item_name=match.item_name,
                    cheapest=cheapest,
                )
            )
        else:
            unresolved.append(match.query)

    item_codes = [item.item_code for item in items]
    if not item_codes:
        return BasketResult(
            matches=matches, items=[], total=0.0, savings=0.0, unresolved=unresolved
        )

    try:
        cheapest_store = find_cheapest_store(
            item_codes, db_path, state=state, premise_codes=premise_codes
        )
        cheapest_total = sum(item.cheapest.price for item in items if item.cheapest)
        average_total = _average_total(
            item_codes, db_path, state=state, premise_codes=premise_codes
        )
        ranking = state_ranking(item_codes, db_path)
        store_rank = top_stores_in_state(
            item_codes,
            db_path,
            state,
            premise_codes=premise_codes,
            distances=distances,
            coords=coords,
        )
    except sqlite3.Error as e:
        return BasketResult(
            matches=matches,
            items=items,
            unresolved=unresolved,
            error=f"Database error: {e}",
        )

    # Upgrade straight-line distance to real driving distance for the small
    # set of stores actually shown to the user (never the whole radius
    # candidate set — keeps this well within ORS's free tier). Best-effort:
    # on any failure the haversine distance/label from above stays as-is.
    if ors_api_key and lat is not None and lng is not None:
        shown_coords: dict[int, tuple[float, float]] = {}
        for store in store_rank:
            if store.latitude is not None and store.longitude is not None:
                shown_coords[store.premise_code] = (store.latitude, store.longitude)
        for item in items:
            if (
                item.cheapest
                and item.cheapest.latitude is not None
                and item.cheapest.longitude is not None
            ):
                shown_coords[item.cheapest.premise_code] = (
                    item.cheapest.latitude,
                    item.cheapest.longitude,
                )

        if shown_coords:
            destinations = [
                (code, coord[0], coord[1]) for code, coord in shown_coords.items()
            ]
            driving_km = get_driving_distances_km((lat, lng), destinations, ors_api_key)
            for store in store_rank:
                if store.premise_code in driving_km:
                    store.distance_km = driving_km[store.premise_code]
                    store.distance_source = "driving"
            for item in items:
                if item.cheapest and item.cheapest.premise_code in driving_km:
                    item.cheapest.distance_km = driving_km[item.cheapest.premise_code]
                    item.cheapest.distance_source = "driving"

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
            item.store_price = get_item_price_at_store(
                item.item_code, best_premise_code, db_path
            )

    savings = round(average_total - best_total, 2)
    national_avg = round(_average_total(item_codes, db_path, state=None), 2)

    return BasketResult(
        matches=matches,
        items=items,
        state_ranking=ranking,
        store_ranking=store_rank,
        total=best_total,
        savings=savings,
        national_average=national_avg,
        is_single_store=is_single_store,
        unresolved=unresolved,
        radius_km_used=radius_km_used,
        no_stores_in_radius=no_stores_in_radius,
    )
