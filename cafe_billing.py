"""Local website billing API with automatic SelfHeal monitoring.

Run with ./testenv/Scripts/python.exe ./cafe_billing.py, then start Next.js.
"""
from __future__ import annotations

import argparse
from contextlib import ExitStack
from decimal import Decimal, InvalidOperation
import hmac
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import secrets

from backend import billing


def billing_health(module):
    """Trusted checks outside the function AI is permitted to edit."""
    from selfheal import HealthCheckResult, HealthReport

    cases = (
        ("sample bill", [("coffee", 2), ("cappuccino", 1)], "10", "5", ("420.00", "42.00", "18.90", "396.90")),
        ("no discount", [("coffee", 1)], "0", "5", ("120.00", "0.00", "6.00", "126.00")),
        ("no tax", [("latte", 1)], "10", "0", ("220.00", "22.00", "0.00", "198.00")),
        ("full discount", [("mocha", 1)], "100", "5", ("150.00", "150.00", "0.00", "0.00")),
        ("empty order", [], "0", "5", ("0.00", "0.00", "0.00", "0.00")),
        ("rounding", [("coffee", 1)], "0.0125", "0", ("120.00", "0.02", "0.00", "119.98")),
        ("all coffees", [(item["id"], 1) for item in billing.CATALOG], "0", "0", ("920.00", "0.00", "0.00", "920.00")),
    )
    checks = []
    for name, items, discount, tax, amounts in cases:
        expected = dict(zip(("subtotal", "discount", "tax", "total"), map(Decimal, amounts)))
        try:
            actual = module.calculate_bill(items, discount, tax)
            ok = actual == expected and all(type(value) is Decimal for value in actual.values())
            details = f"Expected {expected}; got {actual}"
        except Exception as exc:
            ok, details = False, f"Raised {type(exc).__name__}"
        checks.append(HealthCheckResult(name, ok, details))
    invalid_cases = (
        ([("unknown", 1)], "0", "5"), ([("coffee", 0)], "0", "5"),
        ([("coffee", True)], "0", "5"), ([("coffee", 101)], "0", "5"),
        ([("coffee", 1), ("coffee", 1)], "0", "5"),
        ([("coffee", 1)], "101", "5"), ([("coffee", 1)], "0", "-1"),
        ([("coffee", 1)], "NaN", "5"), ([("coffee", 1)], "0", "Infinity"),
    )
    for items, discount, tax in invalid_cases:
        try:
            module.calculate_bill(items, discount, tax)
        except ValueError:
            ok = True
        except Exception:
            ok = False
        else:
            ok = False
        checks.append(HealthCheckResult("reject invalid billing input", ok))
    return HealthReport(tuple(checks))


def validate_order(payload):
    """Reject ordinary user mistakes before notifying the healing agent."""
    if not isinstance(payload, dict) or set(payload) != {"items", "discount_percent", "tax_percent"}:
        raise ValueError("Invalid order format")
    if not isinstance(payload["items"], list) or len(payload["items"]) > len(billing.MENU):
        raise ValueError("Invalid cart")
    items, seen = [], set()
    for item in payload["items"]:
        if not isinstance(item, dict) or set(item) != {"id", "quantity"}:
            raise ValueError("Invalid cart item")
        name, quantity = item["id"], item["quantity"]
        if not isinstance(name, str) or name not in billing.MENU or name in seen:
            raise ValueError("Choose unique items from the menu")
        if type(quantity) is not int or not 1 <= quantity <= 100:
            raise ValueError("Quantity must be between 1 and 100")
        seen.add(name)
        items.append((name, quantity))
    rates = []
    for field in ("discount_percent", "tax_percent"):
        value = payload[field]
        if not isinstance(value, str) or not 1 <= len(value) <= 32:
            raise ValueError("Invalid percentage")
        try:
            number = Decimal(value)
        except InvalidOperation:
            raise ValueError("Enter a numeric percentage") from None
        if not number.is_finite() or not Decimal("0") <= number <= Decimal("100"):
            raise ValueError("Percentage must be between 0 and 100")
        rates.append(value)
    return items, *rates


def main() -> int:
    from selfheal import (
        AgentConfig, ConfigurationError, LiveControlServer, LiveTarget,
        SelfHealAgent, SelfHealConfig, SelfHealRuntime, TerminalReporter,
    )
    from selfheal.providers import provider_from_env

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8090)
    args = parser.parse_args()
    if not 1 <= args.port <= 65535:
        parser.error("--port must be between 1 and 65535")
    root = Path(__file__).resolve().parent
    try:
        runtime = SelfHealRuntime(
            # Copy only backend source during repair; this demo uses health contracts.
            SelfHealConfig(project_root=root / "backend", run_tests=False, auto_apply=True),
            provider=provider_from_env(max_output_tokens=8192), event_sink=TerminalReporter(),
        )
    except ConfigurationError as exc:
        print(f"SelfHeal configuration error: {exc}")
        print("Configure your provider key/model in the working directory's .env, then restart.")
        return 2
    target = LiveTarget(
        name="billing", module_name="backend.billing", symbol_name="calculate_bill",
        health_check=billing_health, editable_symbols=("calculate_bill",), retry_safe=True,
        instructions=("Preserve the menu, function signature and Decimal dictionary contract. "
                      "Discount subtotal first, then tax the discounted amount. Round each monetary "
                      "stage to two decimals with ROUND_HALF_UP. Empty orders cost zero. "
                      "Reject invalid inputs and duplicate menu lines with ValueError. "
                      "Keep billing pure. Only edit calculate_bill's body."),
    )
    agent = SelfHealAgent(runtime, (target,), config=AgentConfig(
        interval_seconds=60, auto_apply=True, scan_when_healthy=False, run_on_start=True,
    ))
    calculate = agent.bind("billing")
    control = LiveControlServer(runtime, (target,), agent=agent, port=0,
                                session_file=root / ".selfheal/billing-live.json")
    token = secrets.token_urlsafe(32)
    api_session = root / ".selfheal/cafe-api.json"

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *unused):
            pass

        def setup(self):
            super().setup()
            self.connection.settimeout(10)

        def reply(self, status, payload):
            body = json.dumps(payload, allow_nan=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("Connection", "close")
            self.end_headers()
            self.wfile.write(body)

        def authenticated(self):
            supplied = self.headers.get("X-Cafe-Token", "")
            if self.headers.get("Origin") or not hmac.compare_digest(supplied.encode(), token.encode()):
                self.reply(403, {"error": "Use the website's billing API"})
                return False
            return True

        def do_GET(self):
            if not self.authenticated():
                return
            if self.path == "/menu":
                self.reply(200, {"items": billing.CATALOG, "currency": "INR", "tax_percent": "5"})
            elif self.path == "/status":
                self.reply(200, control.status())
            else:
                self.reply(404, {"error": "Not found"})

        def do_POST(self):
            if not self.authenticated():
                return
            if self.path != "/quote":
                self.reply(404, {"error": "Not found"})
                return
            try:
                if self.headers.get("Transfer-Encoding") or self.headers.get_content_type() != "application/json":
                    raise ValueError("Send a JSON order")
                size = int(self.headers.get("Content-Length", "0"))
                if not 0 < size <= 8192:
                    raise ValueError("Order is too large or empty")
                items, discount, tax = validate_order(json.loads(self.rfile.read(size)))
            except (ValueError, UnicodeError):
                self.reply(400, {"error": "Invalid order. Check the items, quantities and percentages."})
                return
            try:
                result = calculate(items, discount, tax)
                amounts = {name: format(result[name], ".2f") for name in ("subtotal", "discount", "tax", "total")}
                self.reply(200, {**amounts, "currency": "INR", "discount_percent": discount, "tax_percent": tax,
                                 "items": [{"id": name, "name": next(item["name"] for item in billing.CATALOG if item["id"] == name),
                                            "quantity": quantity, "unit_price": format(billing.MENU[name], ".2f"),
                                            "line_total": format(billing.MENU[name] * quantity, ".2f")}
                                           for name, quantity in items]})
            except Exception:
                self.reply(503, {"error": "Billing is temporarily unavailable. SelfHeal is monitoring; retry shortly."})

    session_owned = False
    try:
        with ExitStack() as stack:
            server = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
            stack.callback(server.server_close)
            stack.enter_context(control)
            stack.enter_context(agent)
            api_session.parent.mkdir(parents=True, exist_ok=True)
            try:
                descriptor = os.open(api_session, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            except FileExistsError:
                print("Cafe API session already exists. Stop the old cafe backend first.")
                return 2
            session_owned = True
            with os.fdopen(descriptor, "w", encoding="utf-8") as file:
                json.dump({"url": f"http://127.0.0.1:{args.port}", "token": token}, file)
            print(f"Cafe API ready on 127.0.0.1:{args.port} | open the website at /billing")
            print("SelfHeal: billing -> backend.billing.calculate_bill | automatic repair ON | checks every 60s")
            print("Keep this process running. Ctrl+C stops the backend and agent.")
            server.serve_forever()
    except KeyboardInterrupt:
        print("\nCafe backend stopped.")
    finally:
        if session_owned:
            try:
                if json.loads(api_session.read_text(encoding="utf-8")).get("token") == token:
                    api_session.unlink()
            except (OSError, ValueError):
                pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
