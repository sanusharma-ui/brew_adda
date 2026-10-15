# Website cafe billing

The existing Next.js website now has a `/billing` page, linked from the home navigation. Its menu, line totals, discount, tax and final bill come from the Python API. The initial billing function has no deliberate bugs. There is no payment processing or persistent order database in this demo.

## Run manually

Stop the old terminal cafe app with Ctrl+C if it is still running. Use the project directory in each terminal. Keep your configured provider key and model in the existing `.env`; no credentials are included or changed by this integration.

Terminal 1 — Python billing API and SelfHeal:

```powershell
cd D:\test\realease_test
.\testenv\Scripts\python.exe .\cafe_billing.py
```

Terminal 2 — website (skip starting another copy if Next.js is already running):

```powershell
cd D:\test\realease_test
npm.cmd run dev
```

Open `http://localhost:3000/billing`, or use the port printed by Next.js.

Terminal 3 — SelfHeal status:

```powershell
cd D:\test\realease_test
.\testenv\Scripts\python.exe -m selfheal status --session .\.selfheal\billing-live.json
.\testenv\Scripts\python.exe -m selfheal agent status --session .\.selfheal\billing-live.json
```

## Checks to perform yourself

- Add two House coffees and one Cappuccino. Enter a 10% discount. Expected subtotal: INR 420.00; discount: INR 42.00; demo tax at 5%: INR 18.90; total: INR 396.90.
- Change quantities rapidly, remove items, and start a new order. Totals should update from the backend; a pending or stale bill cannot be printed.
- Expand the SelfHeal monitor. After its initial checks, expect Healthy, Automatic repair On, and zero AI attempts for healthy code. Terminal status should show target `billing`, running=True and paused=False.
- Print a bill and check its items, quantities, rates, discount and total. Print or save as PDF through the browser dialog. No payment is collected.
- Check the page at 320px, 390px, 768px and desktop widths. Menu and order stack on smaller screens; controls remain usable.
- Stop the Python backend: the page should show Offline and disable printing. Restart it, then use Retry connection if the menu was unavailable.

## What SelfHeal watches

The website calls `agent.bind("billing")`, which dispatches to `backend/billing.py::calculate_bill()` in the owning Python process. A nonempty trusted `billing_health()` contract stays outside editable code in `cafe_billing.py`. SelfHeal checks it on startup and every 60 seconds, and queues inspections when routed calls raise exceptions. User input is validated before routing so ordinary input mistakes do not trigger AI repair.

`auto_apply=True` enables verified automatic repairs of this function body only. The signature, menu and other code remain protected by SDK policy. Healthy checks skip AI requests. Failing checks use your configured provider, syntax verification, candidate health checks, snapshots and live activation; activation failure triggers the SDK rollback flow. This standalone integration uses `run_tests=False`; it relies on syntax and the registered health contracts rather than pytest.

The page polls monitor status every 5 seconds and requotes open carts after monitor changes and every 15 seconds. A repair invalidates the previous bill so the website fetches the current function's result before printing.

Keep both processes running. SelfHeal monitors the loaded function; editing a `.py` file on disk is not a hot reload. Restart the Python backend to load a manual source edit. Neither frontend functions nor arbitrary functions are registered as repair targets.

The API is loopback-only. The Next.js server reads `.selfheal/cafe-api.json` to authenticate to it; the browser receives no session credential. CLI control uses `.selfheal/billing-live.json`. Source snapshots and audit records live under `backend/.selfheal/`.

If a forced stop leaves a session file, first confirm its previous process is no longer running before removing that specific stale file. Normal Ctrl+C shutdown cleans up owned session files.

No app, browser, build, test, or provider request was run while implementing this integration. Runtime behavior and responsive rendering await your manual checks.
