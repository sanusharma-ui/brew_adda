"""Pure website billing logic watched by SelfHeal."""
from __future__ import annotations

from decimal import Decimal, InvalidOperation, ROUND_HALF_UP


CATALOG = (
    {"id": "coffee", "name": "House coffee", "description": "Our everyday favourite. Smooth, warm, familiar.", "price": "120.00", "tag": "House favourite", "style": "house"},
    {"id": "espresso", "name": "Espresso", "description": "A small cup with a bold, rich finish.", "price": "90.00", "tag": "Bold & classic", "style": "espresso"},
    {"id": "cappuccino", "name": "Cappuccino", "description": "Espresso, steamed milk and a soft cloud of foam.", "price": "180.00", "tag": "Soft & balanced", "style": "cappuccino"},
    {"id": "latte", "name": "Vanilla latte", "description": "Silky milk with a little vanilla sweetness.", "price": "220.00", "tag": "Something sweet", "style": "latte"},
    {"id": "mocha", "name": "Mocha", "description": "Coffee meets chocolate. A little indulgence.", "price": "150.00", "tag": "Chocolate notes", "style": "mocha"},
    {"id": "coldbrew", "name": "Cold brew", "description": "Slow steeped, poured over ice, easy to love.", "price": "160.00", "tag": "Chilled & mellow", "style": "coldbrew"},
)
MENU = {item["id"]: Decimal(item["price"]) for item in CATALOG}
CENT = Decimal("0.01")


def calculate_bill(items: list[tuple[str, int]], discount_percent: str = "0",
                   tax_percent: str = "5") -> dict[str, Decimal]:
    """Discount subtotal first, then apply demo tax. All amounts use INR.

    Round each monetary stage to two decimals with ROUND_HALF_UP.
    Empty orders cost zero; invalid input raises ValueError. No side effects.
    """
    if not isinstance(items, list) or len(items) > len(MENU):
        raise ValueError("Choose at most one line per menu item")
    try:
        discount_rate = Decimal(str(discount_percent))
        tax_rate = Decimal(str(tax_percent))
    except (InvalidOperation, ValueError):
        raise ValueError("Discount and tax must be valid percentages") from None
    if (not discount_rate.is_finite() or not tax_rate.is_finite()
            or not Decimal("0") <= discount_rate <= Decimal("100")
            or not Decimal("0") <= tax_rate <= Decimal("100")):
        raise ValueError("Discount and tax must be between 0 and 100")
    subtotal = Decimal("0.00")
    seen = set()
    for item in items:
        if not isinstance(item, (tuple, list)) or len(item) != 2:
            raise ValueError("Each item needs a menu name and quantity")
        name, quantity = item
        if not isinstance(name, str) or name not in MENU or name in seen:
            raise ValueError("Choose unique items from the coffee menu")
        if type(quantity) is not int or not 1 <= quantity <= 100:
            raise ValueError("Quantity must be an integer between 1 and 100")
        seen.add(name)
        subtotal += MENU[name] * quantity
    subtotal = subtotal.quantize(CENT, rounding=ROUND_HALF_UP)
    discount = (subtotal * discount_rate / Decimal("100")).quantize(CENT, rounding=ROUND_HALF_UP)
    taxable = subtotal - discount
    tax = (taxable * tax_rate / Decimal("100")).quantize(CENT, rounding=ROUND_HALF_UP)
    return {"subtotal": subtotal, "discount": discount, "tax": tax, "total": taxable + tax}
