import { useState, useRef, useEffect } from "react";
import { CATEGORIES, TOTAL_MONTHLY_BUDGET } from "./ExpenseTracker.jsx";

const BASE_CONTEXT = `
You are a personal financial advisor AI for Sheldon Simmons. You have complete access to his financial data. Answer every question with specific numbers, calculations, and actionable advice. Always show your math step by step. Be direct and friendly.

=== PERSONAL INFO ===
Name: Sheldon Simmons & Judith Ann Simmons | Round Rock TX 78665
USAA Classic Checking #0312210418 | Works from home (WFH)
Spectrum internet/phone are WFH essentials — NOT optional subscriptions

=== INCOME (Monthly Average) ===
Five9 Payroll: ~$2,910/paycheck bi-weekly | Slalom LLC: ~$3,634/paycheck bi-weekly
VA Benefits: $1,132.90/mo | Average monthly income: $14,222
Note: Varies due to bi-weekly timing — some months get 3 paychecks

=== 3-MONTH HISTORY ===
Jan/Feb (Jan 27–Feb 26): Credits $23,080 | Debits $16,022 | Net +$7,058
  Food $1,580 | Subs $890 | Shopping $480 | Transfers $2,215 | Transport $540 | Bills $5,510
  Starbucks $185 (9 visits) | HEB $1,050 (14 visits) | Ally $1,200 | Mortgage $2,737.60

Feb/Mar (Feb 27–Mar 26): Credits $16,157 | Debits $20,931 | Net -$4,774 DEFICIT
  Food $1,820 | Subs $940 | Shopping $520 | Transfers $2,540 | Transport $620 | Bills $5,890
  Starbucks $218 (12 visits) | HEB $1,120 (16 visits)
  Deficit caused by: income drop + Zion Simmons $1,800 one-time (RESOLVED)

Mar/Apr (Mar 27–Apr 24): Credits $18,704 | Debits $16,509 | Net +$2,195
  Food $1,682 | Subs $870 | Shopping $560 | Transfers $975 | Transport $1,490 | Bills $5,913
  Starbucks $247 (14 visits) | HEB $980 (15 visits)
  NYC trip one-time: Airbnb $846 + Spirit Airlines $176 (RESOLVED)

=== FIXED BILLS ($6,608/mo total) ===
Lakeview Mortgage $2,737.60 | Ally Car Note $1,200 | USAA Insurance $358
Spectrum Internet $246.50 (WFH) | Spectrum Mobile $270.66 (WFH)
Constellation Energy $229.32 | Atmos Energy $96.39 | Jonah Water $183.52 | PNM/Aqua $200
CubeSmart Storage $292.93 | Student Loan $98.44
CC Payments: Apple $200 + Chase $250 + USAA $100 + Amex $100 + Capital One $45.61

=== CLEAN SLATE MONTHLY BUDGET ===
Income $14,222 - Fixed $6,608 = $7,614 available
Flex budget: Food $1,200 + Subs $600 + Shopping $300 + Business/Smokey $225 + Bobby+Luis $305 + Gas $200 + Misc $200 = $3,030
SURPLUS: $5,604/mo | After $1,900 savings: $3,704 free cash

=== RESOLVED (No Longer Recurring) ===
Zion Simmons DONE | Terrance Moore DONE | BMW maintenance DONE | Merivis $150/mo DONE after Apr | NYC trip DONE

=== RECURRING P2P ===
Smokey Robinson Cash App: ~$450/mo total — YOU PAY HALF ($225) — business deal
Bobby Zelle: ~$250/mo | Luis Reyes Venmo: ~$55/mo

=== SAVINGS GOALS ===
USAA Savings balance: ~$2,200
Emergency Fund: $15k target | $2,200 saved | $1,000/mo → 13 months
Car Maintenance: $1,500 target | $0 | $300/mo → 5 months
Vacation Fund: $3,000 target | $0 | $400/mo → 7.5 months
Holiday/Gifts: $1,000 target | $0 | $200/mo → 5 months

=== KEY PATTERNS ===
Starbucks: $185→$218→$247 (up 33%, ~$3,200/yr at current pace)
HEB: 14-16 visits/month — consolidating trips would reduce impulse buys
Credit cards: multiple active, paying minimums — not in full
No overdraft fees — good cash management
`;

function buildContext(liveExpenses) {
  if (!liveExpenses || liveExpenses.length === 0) return BASE_CONTEXT;
  const totals = {};
  CATEGORIES.forEach(c => { totals[c.key] = 0; });
  liveExpenses.forEach(e => { if (totals[e.category] !== undefined) totals[e.category] += e.amount; });
  const totalSpent = Object.values(totals).reduce((s, v) => s + v, 0);
  const lines = CATEGORIES.map(cat => {
    const spent = totals[cat.key];
    const rem = cat.budget - spent;
    const pct = ((spent / cat.budget) * 100).toFixed(1);
    return `  ${cat.label}: $${spent.toFixed(2)} spent / $${cat.budget} budget (${pct}%) — ${rem >= 0 ? `$${rem.toFixed(2)} left` : `$${Math.abs(rem).toFixed(2)} OVER`}`;
  }).join("\n");
  const recent = liveExpenses.slice(0, 15).map(e => {
    const cat = CATEGORIES.find(c => c.key === e.category);
    return `  [${e.date}] ${e.description}: $${e.amount.toFixed(2)} (${cat?.label})`;
  }).join("\n");
  return BASE_CONTEXT + `\n=== LIVE EXPENSES THIS SESSION ===\nTotal: $${totalSpent.toFixed(2)} of $${TOTAL_MONTHLY_BUDGET} flex budget\n${totalSpent > TOTAL_MONTHLY_BUDGET ? `OVER BUDGET by $${(totalSpent - TOTAL_MONTHLY_BUDGET).toFixed(2)}` : `$${(TOTAL_MONTHLY_BUDGET - totalSpent).toFixed(2)} remaining`}\n\nBy category:\n${lines}\n\nRecent entries:\n${recent}\n\nAlways use these live figures when answering current spending questions.`;
}

const SUGGESTIONS = [
  "How am I doing vs my budget right now?",
  "Which category am I closest to going over?",
  "If I save $1,500/mo for 12 months, how much will I have?",
  "How much total did I spend on food across all 3 months?",
  "What's my Starbucks cost per year at current pace?",
  "How long until my emergency fund hits $15,000?",
  "What if my car note ended next month?",
  "Top 3 places I should cut spending?",
];

const C = { bg:"#080812", surface:"#10101e", surface2:"#16162a", border:"#1e1e35", muted:"#6b6b8a", green:"#00d4aa", red:"#ff5757", orange:"#ff8c42", text:"#f0ebe3", blue:"#4a9eff" };

export default function AIChat({ liveExpenses = [] }) {
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "Hey Sheldon! 👋 I have all 3 months of your financial history loaded, and I can see every expense you log in the Tracker tab in real time.\n\nAsk me anything — budget status, savings projections, spending analysis — or upload a new bank statement and I'll compare it to your history."
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const processFile = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    if (file.type === "application/pdf") {
      reader.onload = (e) => resolve({ type:"pdf", name:file.name, base64:e.target.result.split(",")[1], mediaType:"application/pdf" });
      reader.readAsDataURL(file);
    } else {
      reader.onload = (e) => resolve({ type:"text", name:file.name, content:e.target.result });
      reader.readAsText(file);
    }
  });

  const handleFile = async (file) => {
    if (!file) return;
    const valid = ["application/pdf","text/csv","text/plain"].includes(file.type) || file.name.endsWith(".csv") || file.name.endsWith(".pdf");
    if (!valid) { alert("Please upload a PDF or CSV file."); return; }
    const doc = await processFile(file);
    setUploadedDocs(prev => [...prev, doc]);
    setMessages(prev => [...prev, { role:"assistant", content:`📄 **${file.name}** uploaded! Ask me to analyze it — I'll compare it against your 3 months of history and your live tracked expenses.` }]);
  };

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText) return;
    setInput("");
    setMessages(prev => [...prev, { role:"user", content:userText }]);
    setLoading(true);
    try {
      const userContent = [];
      uploadedDocs.forEach(doc => {
        if (doc.type === "pdf") userContent.push({ type:"document", source:{ type:"base64", media_type:doc.mediaType, data:doc.base64 } });
        else userContent.push({ type:"text", text:`[FILE: ${doc.name}]\n${doc.content}\n[END]` });
      });
      userContent.push({ type:"text", text:userText });

      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      if (!apiKey) {
        setMessages(prev => [...prev, { role:"assistant", content:"⚠️ **API key missing.** Add `VITE_ANTHROPIC_API_KEY` to Netlify → Site Settings → Environment Variables, then redeploy." }]);
        setLoading(false);
        return;
      }

      const history = messages.slice(-16).map(m => ({ role:m.role, content:m.content }));
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json", "x-api-key":apiKey, "anthropic-version":"2023-06-01", "anthropic-dangerous-direct-browser-access":"true" },
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system:buildContext(liveExpenses), messages:[...history,{ role:"user", content:userContent }] })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const reply = data.content?.find(b => b.type === "text")?.text || "Couldn't process that. Try again.";
      setMessages(prev => [...prev, { role:"assistant", content:reply }]);
      if (uploadedDocs.length > 0) setUploadedDocs([]);
    } catch (err) {
      setMessages(prev => [...prev, { role:"assistant", content:`⚠️ Error: ${err.message}` }]);
    }
    setLoading(false);
  };

  const fmt = (line) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, j) => p.startsWith("**") ? <strong key={j} style={{ color:C.text }}>{p.slice(2,-2)}</strong> : p);
  };

  const formatMessage = (text) => text.split("\n").map((line, i) => {
    if (!line.trim()) return <div key={i} style={{ height:5 }} />;
    if (line.startsWith("# ")) return <div key={i} style={{ fontWeight:700, fontSize:15, color:C.green, margin:"10px 0 4px" }}>{line.slice(2)}</div>;
    if (line.startsWith("## ")) return <div key={i} style={{ fontWeight:700, fontSize:13, color:"#aaa", margin:"8px 0 3px" }}>{line.slice(3)}</div>;
    if (line.startsWith("- ") || line.startsWith("• ")) return <div key={i} style={{ paddingLeft:14, marginBottom:3, color:"#ccc", display:"flex", gap:6 }}><span style={{ color:C.muted, flexShrink:0 }}>•</span><span>{fmt(line.slice(2))}</span></div>;
    if (line.match(/^\d+\./)) return <div key={i} style={{ paddingLeft:14, marginBottom:3, color:"#ccc" }}>{fmt(line)}</div>;
    return <div key={i} style={{ marginBottom:3, color:"#ccc", lineHeight:1.6 }}>{fmt(line)}</div>;
  });

  // Sidebar totals
  const totals = {};
  CATEGORIES.forEach(c => { totals[c.key] = 0; });
  liveExpenses.forEach(e => { if (totals[e.category] !== undefined) totals[e.category] += e.amount; });
  const totalSpent = Object.values(totals).reduce((s,v) => s+v, 0);
  const overCats = CATEGORIES.filter(c => totals[c.key] > c.budget);
  const warnCats = CATEGORIES.filter(c => totals[c.key] > c.budget * 0.8 && totals[c.key] <= c.budget);

  return (
    <div style={{ display:"flex", height:"calc(100vh - 52px)", background:C.bg, overflow:"hidden" }}>

      {/* Sidebar — live snapshot */}
      <div style={{ width:230, flexShrink:0, borderRight:`1px solid ${C.border}`, background:C.surface, overflowY:"auto", padding:14 }}>
        <div style={{ fontSize:10, letterSpacing:2, textTransform:"uppercase", color:C.muted, marginBottom:10 }}>Live Budget Snapshot</div>
        {liveExpenses.length === 0 ? (
          <div style={{ fontSize:11, color:C.muted, textAlign:"center", padding:"24px 0", lineHeight:1.6 }}>No expenses yet.<br/>Log some in the<br/>Tracker tab! 👆</div>
        ) : (
          <>
            <div style={{ background:C.surface2, borderRadius:10, padding:"10px 12px", marginBottom:10 }}>
              <div style={{ fontSize:10, color:C.muted, marginBottom:3 }}>Flex Spent</div>
              <div style={{ fontSize:20, fontWeight:900, color:totalSpent > TOTAL_MONTHLY_BUDGET ? C.red : C.green }}>${totalSpent.toFixed(2)}</div>
              <div style={{ fontSize:10, color:C.muted }}>of ${TOTAL_MONTHLY_BUDGET} budget</div>
              <div style={{ background:C.border, borderRadius:99, height:5, marginTop:7 }}>
                <div style={{ background:totalSpent > TOTAL_MONTHLY_BUDGET ? C.red : C.green, width:`${Math.min(100,(totalSpent/TOTAL_MONTHLY_BUDGET)*100)}%`, height:"100%", borderRadius:99 }} />
              </div>
            </div>
            {overCats.length > 0 && <div style={{ background:"rgba(255,87,87,0.1)", border:"1px solid rgba(255,87,87,0.3)", borderRadius:7, padding:"7px 10px", marginBottom:8, fontSize:10, color:C.red }}>🔴 Over: {overCats.map(c=>c.label).join(", ")}</div>}
            {warnCats.length > 0 && <div style={{ background:"rgba(255,140,66,0.1)", border:"1px solid rgba(255,140,66,0.3)", borderRadius:7, padding:"7px 10px", marginBottom:8, fontSize:10, color:C.orange }}>⚠️ Near limit: {warnCats.map(c=>c.label).join(", ")}</div>}
            {CATEGORIES.map(cat => {
              const spent = totals[cat.key];
              if (spent === 0) return null;
              const pct = Math.min(100,(spent/cat.budget)*100);
              const over = spent > cat.budget;
              return (
                <div key={cat.key} style={{ marginBottom:9 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, marginBottom:3 }}>
                    <span style={{ color:"#ccc" }}>{cat.icon} {cat.label}</span>
                    <span style={{ color:over?C.red:cat.color, fontWeight:700 }}>${spent.toFixed(0)}</span>
                  </div>
                  <div style={{ background:C.border, borderRadius:99, height:4 }}>
                    <div style={{ background:over?C.red:cat.color, width:`${pct}%`, height:"100%", borderRadius:99 }} />
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Chat area */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ padding:"13px 20px", borderBottom:`1px solid ${C.border}`, flexShrink:0, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
          <div>
            <div style={{ fontFamily:"Georgia,serif", fontSize:18, fontWeight:700 }}>🤖 AI Financial Advisor</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>3-month history loaded · {liveExpenses.length} live expense{liveExpenses.length!==1?"s":""} tracked</div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {uploadedDocs.length > 0 && <span style={{ fontSize:11, color:C.green, background:"rgba(0,212,170,0.1)", padding:"3px 10px", borderRadius:99 }}>📄 {uploadedDocs.length} ready</span>}
            <button onClick={() => fileRef.current?.click()} style={{ background:"rgba(0,212,170,0.1)", border:`1px solid ${C.green}`, color:C.green, borderRadius:7, padding:"6px 13px", fontSize:11, fontWeight:700, cursor:"pointer" }}>📤 Upload Statement</button>
            <input ref={fileRef} type="file" accept=".pdf,.csv,.txt" style={{ display:"none" }} onChange={e => handleFile(e.target.files[0])} />
          </div>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"18px 20px", position:"relative" }}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}>
          {dragOver && <div style={{ position:"absolute", inset:0, background:"rgba(0,212,170,0.08)", border:`2px dashed ${C.green}`, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", zIndex:10, fontSize:18, color:C.green, fontWeight:700 }}>Drop statement here</div>}

          {messages.map((m, i) => (
            <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start", marginBottom:14 }}>
              {m.role==="assistant" && <div style={{ width:26, height:26, borderRadius:"50%", background:"linear-gradient(135deg,#00d4aa,#4a9eff)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, flexShrink:0, marginRight:8, marginTop:3 }}>🤖</div>}
              <div style={{ maxWidth:"78%", background:m.role==="user"?"rgba(0,212,170,0.12)":C.surface2, border:`1px solid ${m.role==="user"?"rgba(0,212,170,0.25)":C.border}`, borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px", padding:"10px 14px", fontSize:13, lineHeight:1.6 }}>
                {m.role==="user" ? <span style={{ color:C.text }}>{m.content}</span> : <div>{formatMessage(m.content)}</div>}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              <div style={{ width:26, height:26, borderRadius:"50%", background:"linear-gradient(135deg,#00d4aa,#4a9eff)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12 }}>🤖</div>
              <div style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:"16px 16px 16px 4px", padding:"10px 14px", display:"flex", gap:5 }}>
                {[0,1,2].map(j => <div key={j} style={{ width:6, height:6, borderRadius:"50%", background:C.green, animation:"bounce 1.2s ease-in-out infinite", animationDelay:`${j*0.2}s` }} />)}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {messages.length <= 1 && (
          <div style={{ padding:"0 20px 10px", flexShrink:0 }}>
            <div style={{ fontSize:10, color:C.muted, marginBottom:6, letterSpacing:1 }}>SUGGESTED QUESTIONS</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {SUGGESTIONS.map((s,i) => (
                <button key={i} onClick={() => sendMessage(s)} style={{ background:C.surface2, border:`1px solid ${C.border}`, color:"#aaa", borderRadius:20, padding:"5px 12px", fontSize:11, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" }}
                  onMouseEnter={e => { e.target.style.borderColor=C.green; e.target.style.color=C.green; }}
                  onMouseLeave={e => { e.target.style.borderColor=C.border; e.target.style.color="#aaa"; }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ padding:"10px 20px 16px", borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
          <div style={{ display:"flex", gap:10, alignItems:"flex-end" }}>
            <textarea value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Ask anything about your budget, spending, savings..." rows={2}
              style={{ flex:1, background:C.surface2, border:`1px solid ${C.border}`, borderRadius:12, color:C.text, padding:"9px 13px", fontSize:13, resize:"none", outline:"none", fontFamily:"inherit", lineHeight:1.5 }}
              onFocus={e => e.target.style.borderColor=C.green} onBlur={e => e.target.style.borderColor=C.border} />
            <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
              style={{ background:loading?C.surface2:"linear-gradient(135deg,#00d4aa,#4a9eff)", border:"none", borderRadius:12, color:loading?C.muted:"#000", padding:"11px 18px", fontSize:13, fontWeight:700, cursor:loading?"not-allowed":"pointer", whiteSpace:"nowrap" }}>
              {loading?"...":"Send ↑"}
            </button>
          </div>
          <div style={{ fontSize:10, color:C.muted, marginTop:4 }}>Enter to send · Shift+Enter new line · Drag & drop PDF/CSV to upload</div>
        </div>
      </div>
      <style>{`@keyframes bounce{0%,80%,100%{opacity:.3;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}
