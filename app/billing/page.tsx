"use client";

import { useEffect, useMemo, useState } from "react";
import "./billing.css";

type Coffee = { id: string; name: string; description: string; price: string; tag: string; style: string };
type BillLine = { id: string; name: string; quantity: number; unit_price: string; line_total: string };
type Bill = { items: BillLine[]; subtotal: string; discount: string; tax: string; total: string; discount_percent: string; tax_percent: string; currency: string };
type Monitor = {
  pid: number; busy: boolean; healing_disabled: boolean;
  agent: { running: boolean; paused: boolean; active_target: string | null; suspended: string[];
    config: { auto_apply: boolean; max_attempts_per_hour: number }; attempts_last_hour: number;
    last_results: Record<string, { status: string; message: string }> };
};
type Receipt = { bill: Bill; number: string; date: string };
const money = (value: string) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value));

function CoffeeArt({ style }: { style: string }) {
  return (
    <div className={`coffee-art coffee-art-${style}`} aria-hidden="true">
      <span className="coffee-art-ring" />
      <svg viewBox="0 0 240 170" className="coffee-cup">
        <ellipse cx="117" cy="143" rx="69" ry="9" fill="#493326" opacity=".12" />
        {style === "coldbrew" ? <>
          <path d="M83 42h76l-9 94c-1 10-8 15-29 15s-29-5-30-15z" fill="#b87244" />
          <path d="M88 70h66l-6 64c-2 7-9 11-27 11s-25-4-27-11z" fill="#59392b" />
          <path d="M144 18l-15 91" stroke="#fff3d8" strokeWidth="7" strokeLinecap="round" />
          <rect x="99" y="78" width="21" height="20" rx="4" fill="#e8d2b4" opacity=".6" transform="rotate(12 109 88)" />
          <rect x="124" y="100" width="19" height="19" rx="4" fill="#e8d2b4" opacity=".5" transform="rotate(-15 133 109)" />
          <ellipse cx="121" cy="43" rx="38" ry="8" fill="#e3b383" />
        </> : <>
          <ellipse cx="115" cy="140" rx="64" ry="11" fill="#f4e8d4" />
          <path d="M159 73h10c29 0 27 44-6 44h-9" fill="none" stroke="#f6ead7" strokeWidth="12" />
          <path d="M66 68h95v40c0 25-19 36-47 36s-48-11-48-36z" fill={style === "espresso" ? "#ded6c6" : "#faf0dd"} />
          <ellipse cx="113" cy="69" rx="47" ry="13" fill="#ead7b9" />
          <ellipse cx="113" cy="68" rx="39" ry="10" fill={style === "espresso" || style === "house" ? "#633f2b" : "#bf8d59"} />
          {style !== "espresso" && style !== "house" && <>
            <path d="M112 73c-35-10-13-20 0-8 13-12 35-2 0 8" fill="#f7ead1" />
            <path d="M113 65v13" stroke="#f7ead1" strokeWidth="2" />
          </>}
          <path d="M96 46c-9-12 10-13 2-27M120 43c-9-12 10-13 2-27" fill="none" stroke="#f5e8d8" strokeWidth="3" strokeLinecap="round" opacity=".7" />
        </>}
      </svg>
    </div>
  );
}

function Quantity({ name, value, onChange }: { name: string; value: number; onChange: (quantity: number) => void }) {
  return <div className="coffee-quantity">
    <button type="button" aria-label={`Remove one ${name}`} onClick={() => onChange(value - 1)}>−</button>
    <span aria-label={`${value} in cart`}>{value}</span>
    <button type="button" aria-label={`Add one ${name}`} disabled={value >= 100} onClick={() => onChange(value + 1)}>+</button>
  </div>;
}

export default function BillingPage() {
  const [menu, setMenu] = useState<Coffee[]>([]);
  const [menuError, setMenuError] = useState("");
  const [menuLoading, setMenuLoading] = useState(true);
  const [reconnect, setReconnect] = useState(0);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [discount, setDiscount] = useState("0");
  const [tax, setTax] = useState("5");
  const [quoted, setQuoted] = useState<{ key: string; revision: string; bill: Bill } | null>(null);
  const [quoteError, setQuoteError] = useState("");
  const [quoting, setQuoting] = useState(false);
  const [quoteRefresh, setQuoteRefresh] = useState(0);
  const [monitor, setMonitor] = useState<Monitor | null>(null);
  const [monitorOffline, setMonitorOffline] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setMenuLoading(true);
    setMenuError("");
    fetch("/api/cafe/menu", { cache: "no-store", signal: controller.signal })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load the coffee menu.");
        if (!controller.signal.aborted) {
          setMenu(data.items);
          setTax(data.tax_percent);
        }
      }).catch(error => {
        if (!controller.signal.aborted) setMenuError(error.message || "Could not load the coffee menu.");
      }).finally(() => { if (!controller.signal.aborted) setMenuLoading(false); });
    return () => controller.abort();
  }, [reconnect]);

  useEffect(() => {
    let stopped = false;
    let controller: AbortController | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function poll() {
      controller = new AbortController();
      try {
        const response = await fetch("/api/cafe/status", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Offline");
        const data: Monitor = await response.json();
        if (!stopped) { setMonitor(data); setMonitorOffline(false); }
      } catch { if (!stopped) setMonitorOffline(true); }
      if (!stopped) timer = setTimeout(poll, 5000);
    }
    void poll();
    return () => { stopped = true; controller?.abort(); clearTimeout(timer); };
  }, [reconnect]);

  const orderKey = useMemo(() => JSON.stringify({
    items: menu.filter(item => cart[item.id] > 0).map(item => ({ id: item.id, quantity: cart[item.id] })),
    discount_percent: discount.trim() || "0", tax_percent: tax,
  }), [menu, cart, discount, tax]);
  const discountValue = Number(discount.trim() || "0");
  const validDiscount = Number.isFinite(discountValue) && discountValue >= 0 && discountValue <= 100 && discount.length <= 32;
  const itemCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const selected = menu.filter(item => cart[item.id] > 0);
  const last = monitor?.agent.last_results.billing;
  const repairing = !!(monitor?.busy || monitor?.agent.active_target);
  const billingRevision = `${monitor?.agent.attempts_last_hour ?? 0}:${last?.status ?? "pending"}:${repairing}`;
  const bill = quoted?.key === orderKey && quoted.revision === billingRevision ? quoted.bill : null;
  const billingReady = !!monitor && !monitorOffline && monitor.agent.running && !monitor.healing_disabled &&
    !repairing && !monitor.agent.suspended.includes("billing") && (last?.status === "healthy" || last?.status === "applied");

  useEffect(() => {
    if (!menu.length || !validDiscount) { setQuoting(false); return; }
    const controller = new AbortController();
    setQuoting(true);
    setQuoteError("");
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/cafe/quote", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: orderKey, signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not calculate your bill.");
        if (!controller.signal.aborted) setQuoted({ key: orderKey, revision: billingRevision, bill: data });
      } catch (error) {
        if (!controller.signal.aborted) {
          setQuoted(null);
          setQuoteError(error instanceof Error ? error.message : "Could not calculate your bill.");
        }
      } finally { if (!controller.signal.aborted) setQuoting(false); }
    }, 220);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [orderKey, menu.length, validDiscount, quoteRefresh, billingRevision]);

  // Requote unchanged carts too, so an automatic repair reaches the open UI.
  useEffect(() => {
    const timer = setInterval(() => setQuoteRefresh(value => value + 1), 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { if (receipt) window.print(); }, [receipt]);

  function setQuantity(id: string, quantity: number) {
    setCart(current => {
      const next = { ...current };
      if (quantity <= 0) delete next[id];
      else next[id] = Math.min(100, quantity);
      return next;
    });
    setReceipt(null);
  }

  let monitorLabel = "Connecting";
  let monitorTone = "waiting";
  if (monitorOffline) { monitorLabel = "Offline"; monitorTone = "attention"; }
  else if (monitor) {
    if (monitor.healing_disabled) { monitorLabel = "Restart needed"; monitorTone = "attention"; }
    else if (monitor.agent.suspended.includes("billing")) { monitorLabel = "Needs attention"; monitorTone = "attention"; }
    else if (monitor.busy || monitor.agent.active_target) { monitorLabel = "Repairing"; }
    else if (monitor.agent.paused) { monitorLabel = "Paused"; }
    else if (!monitor.agent.running) { monitorLabel = "Stopped"; monitorTone = "attention"; }
    else if (last?.status === "healthy" || last?.status === "applied") { monitorLabel = "Healthy"; monitorTone = "healthy"; }
    else if (last && last.status !== "no_change") { monitorLabel = "Needs attention"; monitorTone = "attention"; }
    else monitorLabel = "Checking";
  }

  return <>
    <main className="cafe-page">
      <header className="cafe-nav shell">
        <a href="/" className="logo" aria-label="Lumea home">lume<span>a</span></a>
        <span className="cafe-nav-divider" />
        <span className="cafe-nav-label">The coffee counter</span>
        <a href="/" className="cafe-back">Back to Lumea <span aria-hidden="true">↗</span></a>
      </header>

      <section className="cafe-intro shell">
        <div><p className="eyebrow"><span className="eyebrow-dot" /> A little pause, a good cup</p>
          <h1>Your daily dose<br />of <em>something good.</em></h1>
          <p className="cafe-intro-copy">Pick your coffee. Make yourself comfortable.<br className="cafe-desktop-break" /> We&apos;ll take care of the little details.</p>
        </div>
        <div className="cafe-intro-note"><span aria-hidden="true">✳</span><p>Freshly made.<br />Slowly enjoyed.</p><small>Demo coffee menu · INR</small></div>
      </section>

      <div className="cafe-workspace shell">
        <section className="cafe-menu" aria-labelledby="coffee-menu-title">
          <div className="cafe-section-top"><h2 id="coffee-menu-title">On the menu</h2><span>Six little reasons to stay</span></div>
          {menuError && <div className="cafe-alert" role="alert"><p>{menuError}</p><button onClick={() => setReconnect(value => value + 1)}>Retry connection</button></div>}
          {menuLoading && <p className="cafe-loading" role="status">Getting the coffee menu ready…</p>}
          <div className="coffee-grid">
            {menu.map(coffee => <article className="coffee-card" key={coffee.id}>
              <CoffeeArt style={coffee.style} />
              <div className="coffee-card-body"><span className="coffee-tag">{coffee.tag}</span>
                <h3>{coffee.name}</h3><p>{coffee.description}</p>
                <div className="coffee-card-bottom"><strong>{money(coffee.price)}</strong>
                  {cart[coffee.id] ? <Quantity name={coffee.name} value={cart[coffee.id]} onChange={quantity => setQuantity(coffee.id, quantity)} />
                    : <button className="coffee-add" onClick={() => setQuantity(coffee.id, 1)} aria-label={`Add ${coffee.name} to order`}>Add <span aria-hidden="true">+</span></button>}
                </div>
              </div>
            </article>)}
          </div>
          <p className="cafe-menu-footnote">A sample menu for your coffee break. No payment is collected.</p>
        </section>

        <aside className="cafe-order-column" aria-label="Your bill and billing monitor">
          <section className="cafe-order" aria-labelledby="order-title">
            <div className="cafe-order-title"><h2 id="order-title">Your order</h2><span>{itemCount} {itemCount === 1 ? "cup" : "cups"}</span></div>
            {selected.length === 0 ? <div className="cafe-empty"><span aria-hidden="true">☕</span><h3>Room for a good coffee.</h3><p>Add a cup from the menu<br />and your bill will appear here.</p></div>
              : <div className="cafe-cart-lines">{selected.map(coffee => {
                const line = bill?.items.find(item => item.id === coffee.id);
                return <div className="cafe-cart-line" key={coffee.id}>
                  <div className="cafe-cart-line-top"><strong>{coffee.name}</strong><button onClick={() => setQuantity(coffee.id, 0)} aria-label={`Remove ${coffee.name} from order`}>×</button></div>
                  <div className="cafe-cart-line-bottom"><Quantity name={coffee.name} value={cart[coffee.id]} onChange={quantity => setQuantity(coffee.id, quantity)} /><span>{line ? money(line.line_total) : "…"}</span></div>
                </div>;
              })}</div>}
            <div className="cafe-discount"><label htmlFor="cafe-discount">A little off the bill</label><div><input id="cafe-discount" type="number" min="0" max="100" step="any" inputMode="decimal" value={discount} onChange={event => { setDiscount(event.target.value); setReceipt(null); }} aria-invalid={!validDiscount} aria-describedby="cafe-discount-note" /><span>%</span></div></div>
            <small id="cafe-discount-note" className={validDiscount ? "cafe-field-note" : "cafe-field-error"}>{validDiscount ? "Optional discount, from 0 to 100%." : "Enter a discount between 0 and 100%."}</small>
            <div className="cafe-bill-summary" aria-live="polite" aria-busy={quoting}>
              <div><span>Subtotal</span><span>{bill && validDiscount ? money(bill.subtotal) : "—"}</span></div>
              <div><span>Discount</span><span>{bill && validDiscount ? `−${money(bill.discount)}` : "—"}</span></div>
              <div><span>Demo tax ({tax}%)</span><span>{bill && validDiscount ? money(bill.tax) : "—"}</span></div>
              <div className="cafe-total"><span>Total</span><strong>{bill && validDiscount ? money(bill.total) : "—"}</strong></div>
            </div>
            {quoteError && <div className="cafe-quote-error" role="alert"><p>{quoteError}</p><button onClick={() => setQuoteRefresh(value => value + 1)}>Recalculate bill</button></div>}
            <button className="cafe-print" disabled={!bill || !selected.length || !validDiscount || quoting || !billingReady}
              onClick={() => { if (bill) setReceipt({ bill, number: `LM-${Date.now().toString(36).toUpperCase()}`, date: new Date().toLocaleString("en-IN") }); }}>
              {quoting && selected.length ? "Updating your bill…" : "Print bill"}<span aria-hidden="true">↗</span>
            </button>
            <button className="cafe-reset" disabled={!selected.length} onClick={() => { setCart({}); setDiscount("0"); setReceipt(null); }}>Start a new order</button>
          </section>

          <details className="cafe-monitor"><summary><span className={`cafe-monitor-dot ${monitorTone}`} /><span>SelfHeal monitor</span><strong>{monitorLabel}</strong></summary>
            <div className="cafe-monitor-body"><p>{monitorOffline ? "Start the cafe backend to reconnect." : last?.message || "Waiting for the first local health check."}</p>
              <dl><div><dt>Automatic repair</dt><dd>{monitor && !monitorOffline ? monitor.agent.config.auto_apply ? "On" : "Off" : "—"}</dd></div>
                <div><dt>Health checks</dt><dd>Every 60 seconds</dd></div>
                <div><dt>AI attempts this hour</dt><dd>{monitor && !monitorOffline ? `${monitor.agent.attempts_last_hour}/${monitor.agent.config.max_attempts_per_hour}` : "—"}</dd></div></dl>
              <small>Watching <code>calculate_bill()</code>. Healthy checks skip AI requests; verified repairs apply automatically.</small>
            </div>
          </details>
        </aside>
      </div>
      <footer className="cafe-footer shell"><a href="/" className="logo">lume<span>a</span></a><p>Good coffee. A little light in your day.</p><span>Made for the pause.</span></footer>
    </main>

    {receipt && <section className="cafe-receipt" aria-label="Printable cafe bill">
      <h1>Lumea Coffee Counter</h1><p>Demo bill · No payment collected</p><p>{receipt.number}<br />{receipt.date}</p>
      <table><thead><tr><th>Item</th><th>Qty</th><th>Rate (INR)</th><th>Amount (INR)</th></tr></thead><tbody>{receipt.bill.items.map(item => <tr key={item.id}><td>{item.name}</td><td>{item.quantity}</td><td>{item.unit_price}</td><td>{item.line_total}</td></tr>)}</tbody></table>
      <dl><div><dt>Subtotal</dt><dd>{money(receipt.bill.subtotal)}</dd></div><div><dt>Discount ({receipt.bill.discount_percent}%)</dt><dd>−{money(receipt.bill.discount)}</dd></div><div><dt>Demo tax ({receipt.bill.tax_percent}%)</dt><dd>{money(receipt.bill.tax)}</dd></div><div><dt>Total</dt><dd>{money(receipt.bill.total)}</dd></div></dl>
      <p>Thank you. Take your time, enjoy your coffee.</p>
    </section>}
  </>;
}
