"use client";
import { useEffect, useState } from "react";
import { Catalog, Item, categories, money, photos } from "../../lib/catalog";
const blank = (): Item => ({
  id: crypto.randomUUID(),
  name: "",
  description: "",
  price: 200,
  category: "Coffee",
  available: true,
  featured: false,
  image: photos.latte,
});
async function api(path: string, options?: RequestInit) {
  const response = await fetch("/api/admin/" + path, {
    ...options,
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}
export default function Admin() {
  const [loading, setLoading] = useState(true),
    [signedIn, setSignedIn] = useState(false),
    [password, setPassword] = useState(""),
    [catalog, setCatalog] = useState<Catalog | null>(null),
    [editing, setEditing] = useState<Item | null>(null),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [dirty, setDirty] = useState(false),
    [itemDirty, setItemDirty] = useState(false);
  async function load() {
    const data = await api("catalog");
    setCatalog(data);
    setDirty(false);
  }
  useEffect(() => {
    api("session")
      .then(async (session) => {
        setSignedIn(session.authenticated);
        if (session.authenticated) await load();
        else if (!session.configured)
          setMessage(
            "Owner setup: add ADMIN_PASSWORD and SESSION_SECRET to .env.local using .env.example, then restart the server.",
          );
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty || itemDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, itemDirty]);
  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api("session", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      setPassword("");
      setSignedIn(true);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    if (
      (dirty || itemDirty) &&
      !confirm("Discard unsaved changes and sign out?")
    )
      return;
    setBusy(true);
    try {
      await api("session", { method: "DELETE" });
      setSignedIn(false);
      setCatalog(null);
      setDirty(false);
      setItemDirty(false);
      setEditing(null);
      setMessage("Signed out.");
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (!catalog) return;
    if (itemDirty) {
      setError("Apply the item changes first, then publish the menu.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const saved = await api("catalog", {
        method: "PUT",
        body: JSON.stringify(catalog),
      });
      setCatalog(saved);
      setDirty(false);
      setMessage("Published. Your menu and shop details are now live.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function edit(item: Item) {
    if (
      itemDirty &&
      !confirm("Discard the item changes currently being edited?")
    )
      return;
    setEditing({ ...item });
    setItemDirty(false);
  }
  function updateItem(patch: Partial<Item>) {
    if (editing) {
      setEditing({ ...editing, ...patch });
      setItemDirty(true);
    }
  }
  function applyItem(e: React.FormEvent) {
    e.preventDefault();
    if (!editing || !catalog) return;
    const exists = catalog.items.some((i) => i.id === editing.id);
    if (!exists && catalog.items.length >= 150) {
      setError("The menu supports up to 150 items.");
      return;
    }
    setCatalog({
      ...catalog,
      items: exists
        ? catalog.items.map((i) => (i.id === editing.id ? editing : i))
        : [...catalog.items, editing],
    });
    setEditing(null);
    setDirty(true);
    setItemDirty(false);
    setMessage("Item updated in your draft. Publish changes to make it live.");
    setError("");
  }
  function remove(item: Item) {
    if (
      !catalog ||
      !confirm(
        "Remove " +
          item.name +
          " from the menu? This takes effect when you publish.",
      )
    )
      return;
    setCatalog({
      ...catalog,
      items: catalog.items.filter((i) => i.id !== item.id),
    });
    if (editing?.id === item.id) {
      setEditing(null);
      setItemDirty(false);
    }
    setDirty(true);
  }
  if (loading)
    return (
      <main id="main" className="shell page-content loading-state">
        Opening your coffee house…
      </main>
    );
  return (
    <main id="main" className="shell page-content">
      {!signedIn ? (
        <div className="admin-login">
          <p className="eyebrow">BEHIND THE COUNTER</p>
          <h1>
            Welcome <em>back.</em>
          </h1>
          <p>Your coffee house, thoughtfully managed.</p>
          <form onSubmit={login}>
            <label htmlFor="password">Owner password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={256}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="button" disabled={busy}>
              {busy ? "Signing in…" : "Sign in →"}
            </button>
          </form>
          {message && (
            <p className="notice" role="status">
              {message}
            </p>
          )}
          {error && (
            <p className="notice error" role="alert">
              {error}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="admin-heading">
            <div>
              <p className="eyebrow">THE OWNER’S CORNER</p>
              <h1>
                Your coffee house.
                <br />
                <em>Your way.</em>
              </h1>
              <p>Keep the menu fresh and the details up to date.</p>
            </div>
            <div className="admin-actions">
              <a
                className="button outline"
                href="/menu"
                target="_blank"
                rel="noreferrer"
              >
                View menu ↗
              </a>
              <button
                className="button outline"
                disabled={busy}
                onClick={logout}
              >
                Sign out
              </button>
              <button
                className="button"
                disabled={busy || !catalog || !dirty}
                onClick={save}
              >
                {busy ? "Working…" : "Publish changes ↗"}
              </button>
            </div>
          </div>
          {message && (
            <p className="notice" role="status">
              {message}
            </p>
          )}
          {error && (
            <p className="notice error" role="alert">
              {error}
            </p>
          )}
          {!catalog ? (
            <button
              className="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  await load();
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Retry database connection
            </button>
          ) : (
            <>
              <p className="unsaved" aria-live="polite">
                {dirty || itemDirty
                  ? "● You have unpublished changes."
                  : "All changes are published."}
              </p>
              <div className="stats">
                <div className="stat">
                  <strong>{catalog.items.length}</strong>
                  <span>Menu items</span>
                </div>
                <div className="stat">
                  <strong>
                    {catalog.items.filter((i) => i.available).length}
                  </strong>
                  <span>Available today</span>
                </div>
                <div className="stat">
                  <strong>
                    {catalog.items.filter((i) => i.featured).length}
                  </strong>
                  <span>House favourites</span>
                </div>
              </div>
              <fieldset disabled={busy} className="admin-fieldset">
                <div className="section-heading">
                  <h2 className="admin-section-title">The menu</h2>
                  <button className="button" onClick={() => edit(blank())}>
                    + Add an item
                  </button>
                </div>
                <div className="admin-layout">
                  <div className="admin-list">
                    {catalog.items.map((item) => (
                      <div className="admin-row" key={item.id}>
                        <img
                          src={item.image || "/images/cafe-interior.png"}
                          alt=""
                        />
                        <div>
                          <h3>{item.name}</h3>
                          <p>
                            {money(item.price)} · {item.category} ·{" "}
                            {item.available ? "Available" : "Unavailable"}
                            {item.featured ? " · Featured" : ""}
                          </p>
                        </div>
                        <button
                          onClick={() => edit(item)}
                          aria-label={"Edit " + item.name}
                        >
                          Edit
                        </button>
                        <button
                          className="remove"
                          onClick={() => remove(item)}
                          aria-label={"Remove " + item.name}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {!catalog.items.length && (
                      <p>Your menu is empty. Add your first item.</p>
                    )}
                  </div>
                  {editing ? (
                    <form className="editor" onSubmit={applyItem}>
                      <h2>
                        {catalog.items.some((i) => i.id === editing.id)
                          ? "Make it yours."
                          : "Something new."}
                      </h2>
                      <label>
                        Name
                        <input
                          required
                          maxLength={80}
                          value={editing.name}
                          onChange={(e) => updateItem({ name: e.target.value })}
                        />
                      </label>
                      <label>
                        Description
                        <textarea
                          required
                          maxLength={300}
                          value={editing.description}
                          onChange={(e) =>
                            updateItem({ description: e.target.value })
                          }
                        />
                      </label>
                      <label>
                        Price (INR)
                        <input
                          required
                          type="number"
                          min={1}
                          max={100000}
                          step="0.01"
                          value={editing.price}
                          onChange={(e) =>
                            updateItem({ price: Number(e.target.value) })
                          }
                        />
                      </label>
                      <label>
                        Category
                        <select
                          value={editing.category}
                          onChange={(e) =>
                            updateItem({ category: e.target.value })
                          }
                        >
                          {categories.map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Image URL (HTTPS or /images/ filename)
                        <input
                          maxLength={1500}
                          value={editing.image}
                          onChange={(e) =>
                            updateItem({ image: e.target.value })
                          }
                        />
                      </label>
                      <label className="check">
                        <input
                          type="checkbox"
                          checked={editing.available}
                          onChange={(e) =>
                            updateItem({ available: e.target.checked })
                          }
                        />
                        Available to order
                      </label>
                      <label className="check">
                        <input
                          type="checkbox"
                          checked={editing.featured}
                          onChange={(e) =>
                            updateItem({ featured: e.target.checked })
                          }
                        />
                        Feature on the home page
                      </label>
                      <button className="button">Apply to draft</button>
                      <button
                        className="button outline"
                        type="button"
                        onClick={() => {
                          if (
                            !itemDirty ||
                            confirm("Discard these item edits?")
                          ) {
                            setEditing(null);
                            setItemDirty(false);
                          }
                        }}
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <aside className="editor">
                      <p className="eyebrow">A FRESH START</p>
                      <h2>
                        Small edits.
                        <br />
                        <em>Better experiences.</em>
                      </h2>
                      <p>
                        Select an item to update its details, or add something
                        new to the menu.
                      </p>
                      <p>
                        Only the first three available house favourites appear
                        on the home page.
                      </p>
                    </aside>
                  )}
                </div>
                <section className="settings-form">
                  <h2>The little details.</h2>
                  <p>
                    These details appear on your home and Visit pages. Leave
                    contact fields blank until verified.
                  </p>
                  <div className="settings-grid">
                    {(
                      [
                        ["tagline", "Home page tagline"],
                        ["address", "Full café address"],
                        ["hours", "Opening hours"],
                        ["email", "Contact email"],
                        ["phone", "Phone number"],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key}>
                        {label}
                        <input
                          type={
                            key === "email"
                              ? "email"
                              : key === "phone"
                                ? "tel"
                                : "text"
                          }
                          required={key === "tagline" || key === "hours"}
                          maxLength={300}
                          value={catalog.settings[key]}
                          onChange={(e) => {
                            setCatalog({
                              ...catalog,
                              settings: {
                                ...catalog.settings,
                                [key]: e.target.value,
                              },
                            });
                            setDirty(true);
                          }}
                        />
                      </label>
                    ))}
                  </div>
                  <button className="button" disabled={!dirty} onClick={save}>
                    Publish changes ↗
                  </button>
                </section>
              </fieldset>
            </>
          )}
        </>
      )}
    </main>
  );
}
