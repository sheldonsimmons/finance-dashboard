import { useState, useEffect } from "react";

const STORAGE_KEY = "sheldon_expenses";

export const CATEGORIES = [
  { key: "food",      label: "Food & Dining",       icon: "🍔", budget: 1200, color: "#ff8c42" },
  { key: "subs",      label: "Subscriptions",        icon: "📱", budget: 600,  color: "#00d4aa" },
  { key: "shopping",  label: "Shopping",             icon: "🛍️", budget: 300,  color: "#ffd166" },
  { key: "gas",       label: "Gas / Transport",      icon: "⛽", budget: 200,  color: "#4a9eff" },
  { key: "business",  label: "Business (Smokey ½)",  icon: "🤝", budget: 225,  color: "#f472b6" },
  { key: "p2p",       label: "Bobby + Luis",         icon: "💸", budget: 305,  color: "#a78bfa" },
  { key: "misc",      label: "Misc / Other",         icon: "🎲", budget: 200,  color: "#6b6b8a" },
];

export const TOTAL_MONTHLY_BUDGET = CATEGORIES.reduce((s, c) => s + c.budget, 0);

function loadExpenses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveExpenses(expenses) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses)); } catch {}
}

const C = {
  bg: "#080812", surface: "#10101e", surface2: "#16162a",
  border: "#1e1e35", muted: "#6b6b8a", green: "#00d4aa",
  red: "#ff5757", orange: "#ff8c42", text: "#f0ebe3", yellow: "#ffd166"
};

export default function ExpenseTracker({ onExpensesChange }) {
  const [expenses, setExpenses] = useState(loadExpenses);
  const [form, setForm] = useState({ amount: "", category: "food", description: "", date: new Date().toISOString().split("T")[0] });
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    saveExpenses(expenses);
    onExpensesChange?.(expenses);
  }, [expenses]);

  const addExpense = () => {
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) return;
    const expense = {
      id: Date.now(),
      amount: Number(Number(form.amount).toFixed(2)),
      category: form.category,
      description: form.description || CATEGORIES.find(c => c.key === form.category)?.label,
      date: form.date,
      createdAt: new Date().toISOString()
    };
    if (editId) {
      setExpenses(prev => prev.map(e => e.id === editId ? { ...expense, id: editId } : e));
      setEditId(null);
    } else {
      setExpenses(prev => [expense, ...prev]);
    }
    setForm({ amount: "", category: "food", description: "", date: new Date().toISOString().split("T")[0] });
    setShowForm(false);
  };

  const deleteExpense = (id) => setExpenses(prev => prev.filter(e => e.id !== id));

  const startEdit = (expense) => {
    setForm({ amount: String(expense.amount), category: expense.category, description: expense.description, date: expense.date });
    setEditId(expense.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Totals by category
  const totals = {};
  CATEGORIES.forEach(c => { totals[c.key] = 0; });
  expenses.forEach(e => { if (totals[e.category] !== undefined) totals[e.category] += e.amount; });

  const totalSpent = Object.values(totals).reduce((s, v) => s + v, 0);
  const totalBudget = TOTAL_MONTHLY_BUDGET;
  const overallPct = Math.min(100, (totalSpent / totalBudget) * 100);
  const overallStatus = overallPct >= 100 ? "over" : overallPct >= 80 ? "warning" : "good";

  const filtered = filter === "all" ? expenses : expenses.filter(e => e.category === filter);

  const inputStyle = {
    background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8,
    color: C.text, padding: "9px 12px", fontSize: 13, outline: "none",
    fontFamily: "inherit", width: "100%", transition: "border-color 0.15s"
  };

  return (
    <div>
      <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 4, fontFamily: "Georgia, serif" }}>💳 Live Expense Tracker</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Log expenses in real time · AI tracks everything you add</div>

      {/* Overall status bar */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22, marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: C.muted, marginBottom: 4 }}>Monthly Flex Budget — Overall</div>
            <div style={{ display: "flex", gap: 20, alignItems: "baseline" }}>
              <span style={{ fontSize: 32, fontWeight: 900, color: overallStatus === "over" ? C.red : overallStatus === "warning" ? C.orange : C.green }}>${totalSpent.toFixed(2)}</span>
              <span style={{ fontSize: 16, color: C.muted }}>of ${totalBudget.toFixed(0)} budget</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: overallStatus === "over" ? C.red : C.green }}>
              {totalSpent <= totalBudget ? `$${(totalBudget - totalSpent).toFixed(2)} left` : `$${(totalSpent - totalBudget).toFixed(2)} OVER`}
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>{overallPct.toFixed(1)}% of budget used</div>
          </div>
        </div>
        <div style={{ background: C.border, borderRadius: 99, height: 10, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 99,
            background: overallStatus === "over" ? C.red : overallStatus === "warning" ? C.orange : C.green,
            width: `${overallPct}%`, transition: "width 0.4s"
          }} />
        </div>

        {/* Category mini bars */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginTop: 18 }}>
          {CATEGORIES.map(cat => {
            const spent = totals[cat.key];
            const pct = Math.min(100, (spent / cat.budget) * 100);
            const remaining = cat.budget - spent;
            const status = pct >= 100 ? "over" : pct >= 80 ? "warning" : "good";
            const statusColor = status === "over" ? C.red : status === "warning" ? C.orange : cat.color;
            return (
              <div key={cat.key} style={{ background: C.surface2, borderRadius: 10, padding: "12px 14px", borderLeft: `3px solid ${statusColor}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{cat.icon} {cat.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: statusColor }}>
                    {status === "over" ? `🔴 $${Math.abs(remaining).toFixed(0)} over` :
                     status === "warning" ? `⚠️ $${remaining.toFixed(0)} left` :
                     `✅ $${remaining.toFixed(0)} left`}
                  </span>
                </div>
                <div style={{ background: C.border, borderRadius: 99, height: 5 }}>
                  <div style={{ background: statusColor, width: `${pct}%`, height: "100%", borderRadius: 99, transition: "width 0.4s" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, marginTop: 4 }}>
                  <span>${spent.toFixed(2)} spent</span>
                  <span>${cat.budget} budget</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add expense button / form */}
      <div style={{ background: C.surface, border: `1px solid ${showForm ? C.green : C.border}`, borderRadius: 16, padding: 22, marginBottom: 18, transition: "border-color 0.2s" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showForm ? 20 : 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{editId ? "✏️ Edit Expense" : "➕ Add New Expense"}</div>
          <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ amount: "", category: "food", description: "", date: new Date().toISOString().split("T")[0] }); }}
            style={{ background: showForm ? "rgba(255,87,87,0.15)" : "rgba(0,212,170,0.15)", border: `1px solid ${showForm ? C.red : C.green}`, color: showForm ? C.red : C.green, borderRadius: 8, padding: "7px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            {showForm ? "✕ Cancel" : "+ Add Expense"}
          </button>
        </div>

        {showForm && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 5, letterSpacing: 1 }}>AMOUNT *</div>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 14 }}>$</span>
                  <input type="number" min="0" step="0.01" placeholder="0.00" value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && addExpense()}
                    style={{ ...inputStyle, paddingLeft: 24 }}
                    onFocus={e => e.target.style.borderColor = C.green}
                    onBlur={e => e.target.style.borderColor = C.border} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 5, letterSpacing: 1 }}>DESCRIPTION</div>
                <input type="text" placeholder="e.g. Starbucks, H-E-B, Netflix..." value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && addExpense()}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = C.green}
                  onBlur={e => e.target.style.borderColor = C.border} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 5, letterSpacing: 1 }}>CATEGORY *</div>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  style={{ ...inputStyle, cursor: "pointer" }}
                  onFocus={e => e.target.style.borderColor = C.green}
                  onBlur={e => e.target.style.borderColor = C.border}>
                  {CATEGORIES.map(c => (
                    <option key={c.key} value={c.key}>{c.icon} {c.label} — budget ${c.budget}</option>
                  ))}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 5, letterSpacing: 1 }}>DATE</div>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = C.green}
                  onBlur={e => e.target.style.borderColor = C.border} />
              </div>
            </div>

            {/* Preview impact */}
            {form.amount && !isNaN(Number(form.amount)) && Number(form.amount) > 0 && (
              <div style={{ background: C.surface2, borderRadius: 10, padding: "12px 14px", marginBottom: 14, fontSize: 12 }}>
                {(() => {
                  const cat = CATEGORIES.find(c => c.key === form.category);
                  const newSpent = totals[form.category] + Number(form.amount);
                  const newPct = (newSpent / cat.budget) * 100;
                  const over = newSpent > cat.budget;
                  return (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 16 }}>{over ? "⚠️" : "✅"}</span>
                      <span style={{ color: C.muted }}>Adding <strong style={{ color: C.text }}>${Number(form.amount).toFixed(2)}</strong> to {cat.label} →</span>
                      <span style={{ fontWeight: 700, color: over ? C.red : C.green }}>
                        {over
                          ? `$${(newSpent - cat.budget).toFixed(2)} over budget (${newPct.toFixed(0)}%)`
                          : `$${(cat.budget - newSpent).toFixed(2)} remaining (${newPct.toFixed(0)}% used)`}
                      </span>
                    </div>
                  );
                })()}
              </div>
            )}

            <button onClick={addExpense}
              disabled={!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0}
              style={{ background: "linear-gradient(135deg, #00d4aa, #4a9eff)", border: "none", borderRadius: 10, color: "#000", padding: "11px 28px", fontSize: 13, fontWeight: 700, cursor: "pointer", width: "100%" }}>
              {editId ? "✓ Save Changes" : "✓ Add Expense"}
            </button>
          </div>
        )}
      </div>

      {/* Expense log */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>📋 Expense Log ({filtered.length})</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[{ key: "all", label: "All" }, ...CATEGORIES.map(c => ({ key: c.key, label: c.icon }))].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                style={{ background: filter === f.key ? C.green : C.surface2, color: filter === f.key ? "#000" : C.muted, border: `1px solid ${filter === f.key ? C.green : C.border}`, borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                {f.label}
              </button>
            ))}
            {expenses.length > 0 && (
              <button onClick={() => { if (window.confirm("Clear all expenses?")) setExpenses([]); }}
                style={{ background: "rgba(255,87,87,0.1)", color: C.red, border: `1px solid rgba(255,87,87,0.3)`, borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                🗑️ Clear All
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: C.muted, fontSize: 14 }}>
            {expenses.length === 0 ? "No expenses logged yet. Add your first one above! 👆" : "No expenses in this category."}
          </div>
        ) : (
          <div>
            {filtered.map(e => {
              const cat = CATEGORIES.find(c => c.key === e.category);
              return (
                <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: `${cat?.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{cat?.icon}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{e.description}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{cat?.label} · {e.date}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: cat?.color }}>${e.amount.toFixed(2)}</span>
                    <button onClick={() => startEdit(e)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 14, padding: "2px 6px" }}>✏️</button>
                    <button onClick={() => deleteExpense(e.id)} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 14, padding: "2px 6px" }}>✕</button>
                  </div>
                </div>
              );
            })}
            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 12, fontSize: 13, color: C.muted }}>
              Total shown: <strong style={{ color: C.text, marginLeft: 6 }}>${filtered.reduce((s, e) => s + e.amount, 0).toFixed(2)}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
