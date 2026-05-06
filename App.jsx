import { useState, useCallback } from "react";
import AIChat from "./AIChat.jsx";
import ExpenseTracker from "./ExpenseTracker.jsx";
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceLine, AreaChart, Area } from "recharts";

// ── COLORS ──────────────────────────────────────────────────────────
const C = {
  bg: "#080812", surface: "#10101e", surface2: "#16162a", border: "#1e1e35",
  text: "#f0ebe3", muted: "#6b6b8a",
  green: "#00d4aa", red: "#ff5757", orange: "#ff8c42",
  yellow: "#ffd166", blue: "#4a9eff", purple: "#a78bfa", pink: "#f472b6",
};

// ── DATA ─────────────────────────────────────────────────────────────
const INCOME = 14222;

const FIXED_BILLS = [
  { name:"Lakeview Mortgage", amount:2737.60, color:C.red,    icon:"🏠", cat:"Housing"    },
  { name:"Ally Car Note",     amount:1200.00, color:C.orange, icon:"🚗", cat:"Vehicle"    },
  { name:"USAA Insurance",    amount:358.00,  color:C.yellow, icon:"🛡️", cat:"Insurance"  },
  { name:"Spectrum Internet", amount:246.50,  color:C.blue,   icon:"📡", cat:"Work/Comms" },
  { name:"Spectrum Mobile",   amount:270.66,  color:C.blue,   icon:"📱", cat:"Work/Comms" },
  { name:"Constellation",     amount:229.32,  color:C.yellow, icon:"⚡", cat:"Utilities"  },
  { name:"Atmos Energy",      amount:96.39,   color:C.yellow, icon:"🔥", cat:"Utilities"  },
  { name:"Jonah Water",       amount:183.52,  color:C.green,  icon:"💧", cat:"Utilities"  },
  { name:"PNM/Aqua Finance",  amount:200.00,  color:C.green,  icon:"🚿", cat:"Utilities"  },
  { name:"CubeSmart Storage", amount:292.93,  color:C.purple, icon:"📦", cat:"Storage"    },
  { name:"Student Loan",      amount:98.44,   color:C.pink,   icon:"🎓", cat:"Loan"       },
  { name:"Apple Card",        amount:200.00,  color:C.muted,  icon:"💳", cat:"CC Payments"},
  { name:"Chase Card",        amount:250.00,  color:C.muted,  icon:"💳", cat:"CC Payments"},
  { name:"USAA Card",         amount:100.00,  color:C.muted,  icon:"💳", cat:"CC Payments"},
  { name:"Amex",              amount:100.00,  color:C.muted,  icon:"💳", cat:"CC Payments"},
  { name:"Capital One",       amount:45.61,   color:C.muted,  icon:"💳", cat:"CC Payments"},
];
const TOTAL_FIXED = FIXED_BILLS.reduce((s,b)=>s+b.amount,0);

const DEFAULT_FLEX = [
  { key:"food",     label:"Food & Dining",      icon:"🍔", suggested:1200, actual:1694, color:C.orange },
  { key:"subs",     label:"Subscriptions",       icon:"📱", suggested:600,  actual:750,  color:C.green  },
  { key:"shopping", label:"Shopping",            icon:"🛍️", suggested:300,  actual:520,  color:C.yellow },
  { key:"business", label:"Business (Smokey ½)", icon:"🤝", suggested:225,  actual:225,  color:C.pink   },
  { key:"p2p",      label:"Bobby + Luis",        icon:"💸", suggested:305,  actual:305,  color:C.purple },
  { key:"gas",      label:"Gas / Transport",     icon:"⛽", suggested:200,  actual:200,  color:C.blue   },
  { key:"misc",     label:"Misc / Buffer",       icon:"🎲", suggested:200,  actual:200,  color:C.muted  },
];

const MONTHS = [
  { label:"Jan/Feb", credits:23080, debits:16022, net:7058,
    food:1580, subs:890, shopping:480, p2p:530, gas:540, bills:5510, misc:492,
    notes:["✅ Best income month — $23,080","✅ Net positive $7,058","⚠️ Terrance $1,500 one-time (resolved)","☕ Starbucks $185 across 9 visits","🛒 H-E-B $1,050 across 14 visits"] },
  { label:"Feb/Mar", credits:16157, debits:20931, net:-4774,
    food:1820, subs:940, shopping:520, p2p:530, gas:620, bills:5890, misc:611,
    notes:["🚨 Deficit month — spent $4,774 more than earned","📉 Income dropped to $16,157 (paycheck timing)","⚠️ Zion $1,800 Zelle (one-time, resolved)","🍔 Food $1,820 — highest of 3 months","☕ Starbucks $218 — trending up"] },
  { label:"Mar/Apr", credits:18704, debits:16509, net:2195,
    food:1682, subs:870, shopping:560, p2p:530, gas:1490, bills:5913, misc:464,
    notes:["✅ Back to surplus — $2,195 net","✈️ NYC trip ~$1,200 one-time (Airbnb+flights)","🍔 Food $1,682 — near budget","☕ Starbucks $247 — still rising","💡 Without NYC trip, surplus ~$3,400"] },
];

const GOALS = [
  { name:"Emergency Fund", target:15000, current:2200, monthly:1000, color:C.green,  icon:"🏦" },
  { name:"Car Maintenance", target:1500,  current:0,    monthly:300,  color:C.red,    icon:"🔧" },
  { name:"Vacation Fund",   target:3000,  current:0,    monthly:400,  color:C.yellow, icon:"✈️" },
  { name:"Holiday/Gifts",   target:1000,  current:0,    monthly:200,  color:C.pink,   icon:"🎁" },
];

const INSIGHTS = [
  { icon:"💰", title:"Clean-slate position is strong", body:"After all real recurring obligations you have $5,604/mo free — $67,248/yr.", badge:"POSITIVE", bc:C.green },
  { icon:"🍔", title:"Food is your biggest flex leak", body:"Averaging $1,694/mo vs $1,200 budget. Cutting saves $494/mo = $5,928/yr.", badge:"ACTION", bc:C.yellow },
  { icon:"☕", title:"Starbucks growing every month", body:"$185 → $218 → $247. Up 33% in 3 months. At this pace = $3,200/yr.", badge:"WATCH", bc:C.yellow },
  { icon:"📱", title:"Subscriptions have room to cut", body:"Merivis $150 now done. Auditing streaming+AI duplicates could save another $200/mo.", badge:"REVIEW", bc:C.yellow },
  { icon:"🏦", title:"Emergency fund needs attention", body:"$2,200 saved of $15,000 target. At $1,000/mo you'll get there in 13 months.", badge:"PRIORITY", bc:C.orange },
  { icon:"📉", title:"Income variability is your main risk", body:"$7k swing between best/worst month due to bi-weekly timing. A 2-month buffer protects you.", badge:"RISK", bc:C.red },
];

// ── HELPERS ──────────────────────────────────────────────────────────
const fmt = (n) => `$${Math.abs(n).toLocaleString(undefined,{maximumFractionDigits:0})}`;
const fmtD = (n) => `$${Math.abs(n).toFixed(2)}`;

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px"}}>
      {label && <div style={{color:C.text,fontWeight:700,fontSize:12,marginBottom:4}}>{label}</div>}
      {payload.map((p,i) => (
        <div key={i} style={{color:p.color||p.fill||C.green,fontSize:12,fontWeight:600}}>
          {p.name}: {p.value < 0 ? "-" : ""}${Math.abs(p.value).toLocaleString(undefined,{maximumFractionDigits:0})}
        </div>
      ))}
    </div>
  );
};

// ── STYLE HELPERS ────────────────────────────────────────────────────
const S = {
  card: { background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:22, marginBottom:18 },
  cardTitle: { fontSize:11, letterSpacing:2, textTransform:"uppercase", color:C.muted, marginBottom:16, fontWeight:600 },
  stat: (accent) => ({ background:C.surface, border:`1px solid ${C.border}`, borderLeft:`3px solid ${accent||C.border}`, borderRadius:12, padding:"14px 16px" }),
  grid2: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 },
  grid3: { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 },
  grid4: { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:18 },
};

function StatCard({label, value, sub, color, accent}) {
  return (
    <div style={S.stat(accent||color)}>
      <div style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:C.muted,marginBottom:6}}>{label}</div>
      <div style={{fontSize:22,fontWeight:900,color:color||C.text}}>{value}</div>
      {sub && <div style={{fontSize:11,color:C.muted,marginTop:3}}>{sub}</div>}
    </div>
  );
}

// ── PAGES ────────────────────────────────────────────────────────────

function PageOverview({ flexVals }) {
  const totalFlex = flexVals.reduce((s,v)=>s+v,0);
  const leftover = Math.max(0, INCOME - TOTAL_FIXED - totalFlex);

  const pieData = [
    { name:"Fixed Bills", value:Math.round(TOTAL_FIXED), color:C.red },
    ...DEFAULT_FLEX.map((f,i) => ({ name:f.label, value:flexVals[i], color:f.color })),
    { name:"Left Over", value:Math.round(leftover), color:"rgba(0,212,170,0.5)" },
  ];

  const barData = MONTHS.map(m => ({ name:m.label, Income:m.credits, Spending:m.debits }));
  const netData = MONTHS.map(m => ({ name:m.label, Net:m.net, fill: m.net>=0?C.green:C.red }));

  return (
    <div>
      <div style={{marginBottom:8}}>
        <div style={{fontSize:28,fontWeight:900,color:C.text}}>Financial Overview</div>
        <div style={{fontSize:13,color:C.muted,marginBottom:24}}>Jan 27 – Apr 24, 2026 · 3 Statement Periods · Clean Slate</div>
      </div>

      <div style={S.grid4}>
        <StatCard label="Avg Monthly Income" value="$14,222" color={C.green} sub="Five9 + Slalom + VA" />
        <StatCard label="Total Fixed Bills" value={fmt(TOTAL_FIXED)} color={C.red} sub="Incl. Spectrum (WFH)" />
        <StatCard label="Clean Slate Surplus" value="$5,604" color={C.green} sub="After all bills + flex" />
        <StatCard label="3-Month Net" value="+$4,477" color={C.yellow} sub="Jan–Apr combined" />
      </div>

      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.cardTitle}>Every Dollar of $14,222 — Clean Slate</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={65} outerRadius={110}>
                {pieData.map((d,i) => <Cell key={i} fill={d.color} stroke={C.bg} strokeWidth={2} />)}
              </Pie>
              <Tooltip content={<TT />} />
              <Legend iconSize={10} wrapperStyle={{fontSize:11,color:C.muted}} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Income vs. Spending — 3 Months</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData}>
              <XAxis dataKey="name" tick={{fill:C.muted,fontSize:11}} />
              <YAxis tick={{fill:C.muted,fontSize:10}} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<TT />} />
              <Legend iconSize={10} wrapperStyle={{fontSize:11,color:C.muted}} />
              <Bar dataKey="Income" fill={C.green} radius={[4,4,0,0]} fillOpacity={0.8} />
              <Bar dataKey="Spending" fill={C.red} radius={[4,4,0,0]} fillOpacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Monthly Net Cash Flow</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={netData}>
            <XAxis dataKey="name" tick={{fill:C.muted,fontSize:11}} />
            <YAxis tick={{fill:C.muted,fontSize:10}} tickFormatter={v=>`$${v.toLocaleString()}`} />
            <Tooltip content={<TT />} />
            <ReferenceLine y={0} stroke={C.border} strokeWidth={2} />
            <Bar dataKey="Net" radius={[6,6,0,0]}>
              {netData.map((d,i) => <Cell key={i} fill={d.fill} fillOpacity={0.85} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{fontSize:11,color:C.muted,marginTop:8}}>Feb/Mar deficit was due to lower income + one-time Zion transfers — both resolved.</div>
      </div>

      <div style={S.grid3}>
        <StatCard label="Biggest Bill" value="Mortgage" color={C.red} sub="$2,737/mo · 19% of income" accent={C.red} />
        <StatCard label="Biggest Flex Spend" value="Food & Dining" color={C.orange} sub="Avg $1,694/mo · 12% of income" accent={C.orange} />
        <StatCard label="Savings Potential" value="$67,248/yr" color={C.green} sub="If $5,604 surplus saved monthly" accent={C.green} />
      </div>
    </div>
  );
}

function PageMonthly() {
  const [idx, setIdx] = useState(0);
  const m = MONTHS[idx];

  const pieData = [
    { name:"Fixed Bills", value:m.bills, color:C.red },
    { name:"Food & Dining", value:m.food, color:C.orange },
    { name:"Subscriptions", value:m.subs, color:C.green },
    { name:"Shopping", value:m.shopping, color:C.yellow },
    { name:"Transfers/P2P", value:m.p2p, color:C.purple },
    { name:"Transport", value:m.gas, color:C.blue },
    { name:"Misc", value:m.misc, color:C.muted },
  ];

  const budgetData = [
    { cat:"Food",     Budget:1200, Actual:m.food },
    { cat:"Subs",     Budget:600,  Actual:m.subs },
    { cat:"Shopping", Budget:300,  Actual:m.shopping },
    { cat:"Transport",Budget:200,  Actual:m.gas },
    { cat:"Misc",     Budget:200,  Actual:m.misc },
  ];

  const trendData = MONTHS.map(mo => ({
    name:mo.label, Food:mo.food, Subs:mo.subs, Shopping:mo.shopping, Transport:mo.gas
  }));

  const pct = Math.round((m.debits/m.credits)*100);

  return (
    <div>
      <div style={{fontSize:28,fontWeight:900,marginBottom:4}}>Monthly Breakdown</div>
      <div style={{fontSize:13,color:C.muted,marginBottom:20}}>Click a month to see the full picture</div>

      <div style={{display:"flex",gap:8,marginBottom:20}}>
        {MONTHS.map((mo,i) => (
          <button key={i} onClick={()=>setIdx(i)} style={{
            background: idx===i ? C.green : C.surface2,
            color: idx===i ? "#000" : C.muted,
            border:`1px solid ${idx===i ? C.green : C.border}`,
            borderRadius:8, padding:"8px 20px", fontSize:12, fontWeight:700, cursor:"pointer"
          }}>{mo.label}</button>
        ))}
      </div>

      <div style={S.grid4}>
        <StatCard label="Income" value={fmt(m.credits)} color={C.green} />
        <StatCard label="Total Spent" value={fmt(m.debits)} color={C.red} />
        <StatCard label="Net" value={`${m.net>=0?"+":"-"}${fmt(m.net)}`} color={m.net>=0?C.green:C.red} />
        <StatCard label="Spent of Income" value={`${pct}%`} color={pct>100?C.red:pct>85?C.orange:C.green} />
      </div>

      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.cardTitle}>Spending Breakdown — {m.label}</div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={110}>
                {pieData.map((d,i) => <Cell key={i} fill={d.color} stroke={C.bg} strokeWidth={2} />)}
              </Pie>
              <Tooltip content={<TT />} />
              <Legend iconSize={10} wrapperStyle={{fontSize:10,color:C.muted}} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Budget vs Actual — {m.label}</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={budgetData}>
              <XAxis dataKey="cat" tick={{fill:C.muted,fontSize:10}} />
              <YAxis tick={{fill:C.muted,fontSize:10}} tickFormatter={v=>`$${v}`} />
              <Tooltip content={<TT />} />
              <Legend iconSize={10} wrapperStyle={{fontSize:11,color:C.muted}} />
              <Bar dataKey="Budget" fill="rgba(0,212,170,0.3)" radius={[4,4,0,0]} />
              <Bar dataKey="Actual" fill={C.orange} fillOpacity={0.85} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Category Trends — All 3 Months</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trendData}>
            <XAxis dataKey="name" tick={{fill:C.muted,fontSize:11}} />
            <YAxis tick={{fill:C.muted,fontSize:10}} tickFormatter={v=>`$${v}`} />
            <Tooltip content={<TT />} />
            <Legend iconSize={10} wrapperStyle={{fontSize:11,color:C.muted}} />
            <Line type="monotone" dataKey="Food" stroke={C.orange} strokeWidth={2} dot={{r:5}} />
            <Line type="monotone" dataKey="Subs" stroke={C.green} strokeWidth={2} dot={{r:5}} />
            <Line type="monotone" dataKey="Shopping" stroke={C.yellow} strokeWidth={2} dot={{r:5}} />
            <Line type="monotone" dataKey="Transport" stroke={C.blue} strokeWidth={2} dot={{r:5}} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Month Analysis — {m.label}</div>
        {m.notes.map((n,i) => (
          <div key={i} style={{padding:"8px 0",borderBottom:`1px solid ${C.border}`,fontSize:13,color:"#ccc",lineHeight:1.6,display:"flex",gap:10}}>
            <span>{n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageBills() {
  // Group by category for pie
  const cats = {};
  FIXED_BILLS.forEach(b => {
    if (!cats[b.cat]) cats[b.cat] = { total:0, color:b.color };
    cats[b.cat].total += b.amount;
  });
  const pieData = Object.entries(cats).map(([name,v]) => ({ name, value:Math.round(v.total), color:v.color }));

  return (
    <div>
      <div style={{fontSize:28,fontWeight:900,marginBottom:4}}>Bills & Fixed Costs</div>
      <div style={{fontSize:13,color:C.muted,marginBottom:24}}>Everything that must be paid every month</div>

      <div style={S.grid3}>
        <StatCard label="Total Fixed Bills" value={fmtD(TOTAL_FIXED)} color={C.red} sub="16 items incl. CC payments" accent={C.red} />
        <StatCard label="% of Income" value="46.5%" color={C.orange} sub={`${fmt(TOTAL_FIXED)} of $14,222`} accent={C.orange} />
        <StatCard label="After Bills" value={fmt(INCOME-TOTAL_FIXED)} color={C.green} sub="Available for flex + savings" accent={C.green} />
      </div>

      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.cardTitle}>Bills by Category</div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={110}>
                {pieData.map((d,i) => <Cell key={i} fill={d.color} stroke={C.bg} strokeWidth={2} />)}
              </Pie>
              <Tooltip content={<TT />} />
              <Legend iconSize={10} wrapperStyle={{fontSize:11,color:C.muted}} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Every Fixed Bill</div>
          <div style={{maxHeight:320,overflowY:"auto"}}>
            {FIXED_BILLS.map(b => (
              <div key={b.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${C.border}`,fontSize:13}}>
                <div style={{display:"flex",alignItems:"center",gap:10,color:"#ccc"}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:b.color,flexShrink:0}} />
                  {b.icon} {b.name}
                </div>
                <span style={{fontWeight:700,color:b.color}}>${b.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:12,paddingTop:10,borderTop:`1px solid ${C.border}`}}>
            <span style={{fontWeight:900,fontSize:14}}>TOTAL</span>
            <span style={{fontWeight:900,fontSize:18,color:C.red}}>${TOTAL_FIXED.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div style={{...S.card,borderColor:"rgba(0,212,170,0.3)"}}>
        <div style={S.cardTitle}>💡 Bills Insight</div>
        <div style={S.grid3}>
          {[
            { label:"Housing (Mortgage)", value:"$2,737.60", sub:"19.3% of income — healthy ratio", color:C.red },
            { label:"Spectrum (WFH Essential)", value:"$517.16", sub:"Internet + Mobile — work necessity", color:C.blue },
            { label:"Utilities (All)", value:"$709.23", sub:"Energy + Gas + Water + Aqua Finance", color:C.yellow },
          ].map(i => (
            <div key={i.label}>
              <div style={{fontSize:12,color:C.muted,marginBottom:6}}>{i.label}</div>
              <div style={{fontSize:20,fontWeight:700,color:i.color}}>{i.value}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:2}}>{i.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PageBudget() {
  const [flexVals, setFlexVals] = useState(DEFAULT_FLEX.map(f => f.suggested));

  const totalFlex = flexVals.reduce((s,v)=>s+v,0);
  const leftover = INCOME - TOTAL_FIXED - totalFlex;

  const pieData = [
    { name:"Fixed Bills", value:Math.round(TOTAL_FIXED), color:C.red },
    ...DEFAULT_FLEX.map((f,i) => ({ name:f.label, value:flexVals[i], color:f.color })),
    { name:"Left Over", value:Math.max(0,Math.round(leftover)), color:"rgba(0,212,170,0.4)" },
  ];

  const updateFlex = (i, val) => {
    setFlexVals(prev => { const n=[...prev]; n[i]=Number(val); return n; });
  };

  return (
    <div>
      <div style={{fontSize:28,fontWeight:900,marginBottom:4}}>Forward Budget</div>
      <div style={{fontSize:13,color:C.muted,marginBottom:24}}>Clean slate — Zion/Terrance/BMW resolved · Merivis done · Smokey = your half only</div>

      <div style={S.grid4}>
        <StatCard label="Monthly Income" value="$14,222" color={C.green} />
        <StatCard label="Fixed Bills" value={fmt(TOTAL_FIXED)} color={C.red} />
        <StatCard label="Flex Budget" value={fmt(totalFlex)} color={C.yellow} />
        <StatCard label="Left Over" value={`${leftover>=0?"+":"-"}${fmt(leftover)}`} color={leftover>=0?C.green:C.red} accent={leftover>=0?C.green:C.red} />
      </div>

      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.cardTitle}>Budget Allocation — Live</div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={110}>
                {pieData.map((d,i) => <Cell key={i} fill={d.color} stroke={C.bg} strokeWidth={2} />)}
              </Pie>
              <Tooltip content={<TT />} />
              <Legend iconSize={10} wrapperStyle={{fontSize:10,color:C.muted}} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>Adjust Flex Budget</div>
          <div style={{maxHeight:320,overflowY:"auto",paddingRight:4}}>
            {DEFAULT_FLEX.map((f,i) => {
              const over = flexVals[i] > f.actual;
              const diff = flexVals[i] - f.actual;
              return (
                <div key={f.key} style={{marginBottom:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:13,fontWeight:600}}>{f.icon} {f.label}</span>
                    <div style={{display:"flex",gap:10,alignItems:"center"}}>
                      <span style={{fontSize:11,color:C.muted}}>avg ${f.actual}</span>
                      <span style={{fontSize:14,fontWeight:700,color:f.color}}>${flexVals[i]}</span>
                    </div>
                  </div>
                  <input type="range" min={0} max={2500} step={25} value={flexVals[i]}
                    style={{width:"100%",accentColor:f.color}}
                    onChange={e=>updateFlex(i,e.target.value)} />
                  <div style={{fontSize:10,color:over?C.red:C.green,marginTop:2}}>
                    {over ? `▲ $${diff} over avg` : `✓ $${Math.abs(diff)} under avg`}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{borderTop:`1px solid ${C.border}`,paddingTop:12,marginTop:4}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:13}}>
              <span style={{color:C.muted}}>Total flex budget</span>
              <span style={{fontWeight:700,color:C.yellow}}>{fmt(totalFlex)}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:15}}>
              <span style={{fontWeight:700}}>Monthly left over</span>
              <span style={{fontWeight:900,fontSize:20,color:leftover>=0?C.green:C.red}}>
                {leftover>=0?"+":"-"}{fmt(leftover)}
              </span>
            </div>
            {leftover >= 0 && (
              <div style={{fontSize:11,color:C.green,marginTop:6}}>
                ✅ Save this monthly = {fmt(leftover*12)}/yr
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Every Dollar of $14,222 Visualized</div>
        <div style={{display:"flex",height:32,borderRadius:8,overflow:"hidden",gap:2,marginBottom:12}}>
          {pieData.filter(d=>d.value>0).map((d,i) => (
            <div key={i} title={`${d.name}: ${fmt(d.value)}`}
              style={{flex:d.value,background:d.color,minWidth:2,transition:"flex 0.3s"}} />
          ))}
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:"6px 16px"}}>
          {pieData.map((d,i) => (
            <div key={i} style={{display:"flex",alignItems:"center",gap:5,fontSize:11}}>
              <div style={{width:8,height:8,borderRadius:2,background:d.color}} />
              <span style={{color:C.muted}}>{d.name} · {((d.value/INCOME)*100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PageSavings() {
  const [allocs, setAllocs] = useState(GOALS.map(g=>g.monthly));
  const totalAlloc = allocs.reduce((s,v)=>s+v,0);
  const surplus = 5604;
  const afterSavings = surplus - totalAlloc;

  const projMonths = 24;
  const projData = Array.from({length:projMonths+1},(_,i) => ({
    month: i === 0 ? "Now" : `Mo ${i}`,
    Balance: Math.round(2200 + totalAlloc * i),
  }));

  const goalPieData = GOALS.map((g,i) => ({ name:g.name, value:allocs[i], color:g.color }));
  const monthsData = GOALS.map((g,i) => ({
    name:g.name, months:allocs[i]>0?Math.ceil((g.target-g.current)/allocs[i]):99, color:g.color
  }));

  return (
    <div>
      <div style={{fontSize:28,fontWeight:900,marginBottom:4}}>Savings Plan</div>
      <div style={{fontSize:13,color:C.muted,marginBottom:24}}>$2,200 already saved · $5,604/mo clean-slate surplus</div>

      <div style={S.grid4}>
        <StatCard label="Monthly Surplus" value="$5,604" color={C.green} sub="After all bills + flex" />
        <StatCard label="Already Saved" value="$2,200" color={C.blue} sub="USAA Savings balance" />
        <StatCard label="Saving Monthly" value={fmt(totalAlloc)} color={C.yellow} sub="Across all goals" />
        <StatCard label="After Savings" value={`${afterSavings>=0?"+":"-"}${fmt(afterSavings)}`} color={afterSavings>=0?C.green:C.red} sub="Cash buffer" accent={afterSavings>=0?C.green:C.red} />
      </div>

      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.cardTitle}>Monthly Savings Allocation</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={goalPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={110}>
                {goalPieData.map((d,i) => <Cell key={i} fill={d.color} stroke={C.bg} strokeWidth={2} />)}
              </Pie>
              <Tooltip content={<TT />} />
              <Legend iconSize={10} wrapperStyle={{fontSize:11,color:C.muted}} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Months to Reach Each Goal</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthsData} layout="vertical">
              <XAxis type="number" tick={{fill:C.muted,fontSize:10}} />
              <YAxis type="category" dataKey="name" tick={{fill:C.muted,fontSize:10}} width={110} />
              <Tooltip content={<TT />} />
              <Bar dataKey="months" radius={[0,6,6,0]}>
                {monthsData.map((d,i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Goal cards with sliders */}
      {GOALS.map((g,i) => {
        const pct = Math.min(100, Math.round((g.current/g.target)*100));
        const months = allocs[i]>0 ? Math.ceil((g.target-g.current)/allocs[i]) : null;
        const doneDate = months ? new Date(2026,4+months,1).toLocaleDateString("en-US",{month:"short",year:"numeric"}) : "—";
        return (
          <div key={g.name} style={{...S.card,borderLeft:`4px solid ${g.color}`,marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div>
                <span style={{fontSize:18,marginRight:8}}>{g.icon}</span>
                <strong style={{fontSize:15}}>{g.name}</strong>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontWeight:900,fontSize:18,color:g.color}}>{pct}%</div>
                <div style={{fontSize:11,color:C.muted}}>{months ? `Done ${doneDate} (${months}mo)` : "Set amount"}</div>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.muted,marginBottom:8}}>
              <span>${g.current.toLocaleString()} of ${g.target.toLocaleString()}</span>
            </div>
            <div style={{background:C.border,borderRadius:99,height:7,marginBottom:12}}>
              <div style={{background:g.color,width:`${pct}%`,height:"100%",borderRadius:99,transition:"width 0.4s"}} />
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:12,color:C.muted,whiteSpace:"nowrap"}}>Monthly:</span>
              <input type="range" min={0} max={1200} step={25} value={allocs[i]}
                style={{flex:1,accentColor:g.color}}
                onChange={e=>setAllocs(prev=>{const n=[...prev];n[i]=Number(e.target.value);return n;})} />
              <span style={{fontWeight:700,color:g.color,fontSize:14,whiteSpace:"nowrap"}}>{fmt(allocs[i])}/mo</span>
            </div>
          </div>
        );
      })}

      <div style={{...S.card,borderColor:"rgba(0,212,170,0.3)"}}>
        <div style={S.cardTitle}>24-Month Savings Projection at {fmt(totalAlloc)}/mo</div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={projData}>
            <XAxis dataKey="month" tick={{fill:C.muted,fontSize:10}} interval={3} />
            <YAxis tick={{fill:C.muted,fontSize:10}} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<TT />} />
            <Area type="monotone" dataKey="Balance" stroke={C.green} fill="rgba(0,212,170,0.1)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function PageInsights() {
  const starbucksData = [{name:"Jan/Feb",val:185},{name:"Feb/Mar",val:218},{name:"Mar/Apr",val:247}];
  const hebData = [{name:"Jan/Feb",val:1050},{name:"Feb/Mar",val:1120},{name:"Mar/Apr",val:980}];

  const beforeAfter = [
    { name:"Jan/Feb", Before:7058, CleanSlate:5604 },
    { name:"Feb/Mar", Before:-4774, CleanSlate:5604 },
    { name:"Mar/Apr", Before:2195, CleanSlate:5604 },
  ];

  const topSpends = [
    { date:"Mar 27", desc:"BMW of Austin",          amount:2312.84, type:"Vehicle",        tc:C.orange },
    { date:"Mar 20", desc:"Lakeview Mortgage",       amount:2787.60, type:"Bill",            tc:C.red    },
    { date:"Apr 10", desc:"Airbnb (NYC Trip)",       amount:846.32,  type:"Travel (done)",   tc:C.yellow },
    { date:"Mar 9",  desc:"Zion Simmons (Zelle)",    amount:800.00,  type:"Transfer (done)", tc:C.yellow },
    { date:"Mar 17", desc:"Ally Car Note",           amount:844.43,  type:"Bill",            tc:C.red    },
    { date:"Mar 27", desc:"Cash App — Smokey",       amount:455.00,  type:"Business (½ = $227.50)", tc:C.pink },
    { date:"Apr 24", desc:"Cash App — Smokey",       amount:450.00,  type:"Business (½ = $225)", tc:C.pink },
    { date:"Mar 14", desc:"CubeSmart Storage",       amount:292.93,  type:"Bill",            tc:C.red    },
    { date:"Apr 1",  desc:"Spirit Airlines",         amount:172.00,  type:"Travel (done)",   tc:C.yellow },
    { date:"Mar 16", desc:"Twin Liquors",            amount:281.44,  type:"Entertainment",   tc:C.muted  },
  ];

  return (
    <div>
      <div style={{fontSize:28,fontWeight:900,marginBottom:4}}>Key Insights</div>
      <div style={{fontSize:13,color:C.muted,marginBottom:24}}>What the data actually says about your finances</div>

      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.cardTitle}>☕ Starbucks Spend — Trending Up</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={starbucksData}>
              <XAxis dataKey="name" tick={{fill:C.muted,fontSize:11}} />
              <YAxis tick={{fill:C.muted,fontSize:10}} tickFormatter={v=>`$${v}`} />
              <Tooltip content={<TT />} />
              <Bar dataKey="val" name="Starbucks" radius={[6,6,0,0]}>
                {starbucksData.map((_,i) => <Cell key={i} fill={C.orange} fillOpacity={0.5+i*0.2} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{fontSize:11,color:C.muted,marginTop:8}}>Up 33% in 3 months. $650 total. At this pace = $3,200/yr on coffee.</div>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>🛒 H-E-B Grocery — 15+ Visits/Month</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hebData}>
              <XAxis dataKey="name" tick={{fill:C.muted,fontSize:11}} />
              <YAxis tick={{fill:C.muted,fontSize:10}} tickFormatter={v=>`$${v}`} />
              <Tooltip content={<TT />} />
              <Bar dataKey="val" name="H-E-B" radius={[6,6,0,0]}>
                {hebData.map((_,i) => <Cell key={i} fill={C.green} fillOpacity={0.5+i*0.2} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{fontSize:11,color:C.muted,marginTop:8}}>Fewer trips = less impulse buying. Could save $200–300/mo.</div>
        </div>
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Top 10 Largest Individual Transactions</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead>
              <tr>{["Date","Description","Amount","Category"].map(h=>(
                <th key={h} style={{textAlign:"left",padding:"8px 12px",fontSize:10,letterSpacing:1.5,textTransform:"uppercase",color:C.muted,borderBottom:`1px solid ${C.border}`}}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {topSpends.map((t,i) => (
                <tr key={i} style={{borderBottom:`1px solid ${C.surface2}`}}>
                  <td style={{padding:"9px 12px",color:C.muted}}>{t.date}</td>
                  <td style={{padding:"9px 12px",fontWeight:600}}>{t.desc}</td>
                  <td style={{padding:"9px 12px",fontWeight:700,color:C.red}}>${t.amount.toLocaleString()}</td>
                  <td style={{padding:"9px 12px"}}><span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:99,background:`${t.tc}22`,color:t.tc}}>{t.type}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Before vs After Clean Slate — Monthly Surplus</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={beforeAfter}>
            <XAxis dataKey="name" tick={{fill:C.muted,fontSize:11}} />
            <YAxis tick={{fill:C.muted,fontSize:10}} tickFormatter={v=>`$${v.toLocaleString()}`} />
            <Tooltip content={<TT />} />
            <Legend iconSize={10} wrapperStyle={{fontSize:11,color:C.muted}} />
            <ReferenceLine y={0} stroke={C.border} strokeWidth={2} />
            <Bar dataKey="Before" name="Actual (with one-times)" fill={C.red} fillOpacity={0.6} radius={[4,4,0,0]} />
            <Bar dataKey="CleanSlate" name="Clean Slate (going forward)" fill={C.green} fillOpacity={0.7} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{fontSize:12,color:C.muted,marginTop:12}}>
          Removing one-time transfers (Zion $4,690 + Terrance $1,640), BMW maintenance ($185), Merivis ($450 done), and Smokey corrected to half — recovers <strong style={{color:C.green}}>$7,790</strong> of absorbed surplus going forward.
        </div>
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Key Financial Insights</div>
        {INSIGHTS.map((ins,i) => (
          <div key={i} style={{display:"flex",gap:14,padding:"14px 0",borderBottom:i<INSIGHTS.length-1?`1px solid ${C.border}`:"none"}}>
            <span style={{fontSize:22,flexShrink:0}}>{ins.icon}</span>
            <div>
              <div style={{fontWeight:700,fontSize:14,marginBottom:4,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                {ins.title}
                <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:99,background:`${ins.bc}22`,color:ins.bc}}>{ins.badge}</span>
              </div>
              <div style={{fontSize:12,color:C.muted,lineHeight:1.6}}>{ins.body}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────────
const TABS = [
  { id:"overview",  label:"📊 Overview"  },
  { id:"monthly",   label:"📅 Monthly"   },
  { id:"bills",     label:"🏠 Bills"     },
  { id:"budget",    label:"🎚️ Budget"    },
  { id:"savings",   label:"🎯 Savings"   },
  { id:"insights",  label:"💡 Insights"  },
  { id:"tracker",   label:"💳 Tracker"    },
  { id:"ai",        label:"🤖 AI Advisor" },
];

export default function FinancialDashboard() {
  const [tab, setTab] = useState("overview");
  const [flexVals] = useState(DEFAULT_FLEX.map(f => f.suggested));
  const [liveExpenses, setLiveExpenses] = useState([]);

  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:"system-ui,-apple-system,sans-serif"}}>
      {/* NAV */}
      <div style={{position:"sticky",top:0,zIndex:100,background:"rgba(8,8,18,0.97)",backdropFilter:"blur(12px)",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:2,overflowX:"auto",padding:"0 16px"}}>
        <div style={{fontFamily:"Georgia,serif",fontSize:14,fontWeight:700,color:C.text,marginRight:16,padding:"14px 0",paddingRight:20,borderRight:`1px solid ${C.border}`,whiteSpace:"nowrap",flexShrink:0}}>
          Sheldon Simmons
        </div>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            background:"none", border:"none",
            color: tab===t.id ? C.green : C.muted,
            padding:"14px 14px", fontSize:12, fontWeight:600,
            cursor:"pointer", whiteSpace:"nowrap",
            borderBottom: tab===t.id ? `2px solid ${C.green}` : "2px solid transparent",
            transition:"all 0.15s", letterSpacing:0.3
          }}>{t.label}</button>
        ))}
      </div>

      {/* CONTENT */}
      {(tab === "ai" || tab === "tracker") ? (
        tab === "ai"
          ? <AIChat liveExpenses={liveExpenses} />
          : <div style={{padding:"28px 24px 60px",maxWidth:1100,margin:"0 auto"}}><ExpenseTracker onExpensesChange={setLiveExpenses} /></div>
      ) : (
        <div style={{padding:"28px 24px 60px",maxWidth:1100,margin:"0 auto"}}>
          {tab === "overview"  && <PageOverview flexVals={flexVals} />}
          {tab === "monthly"   && <PageMonthly />}
          {tab === "bills"     && <PageBills />}
          {tab === "budget"    && <PageBudget />}
          {tab === "savings"   && <PageSavings />}
          {tab === "insights"  && <PageInsights />}
        </div>
      )}
    </div>
  );
}
