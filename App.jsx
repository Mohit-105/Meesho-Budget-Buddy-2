import { useState, useMemo, useEffect } from "react";

const CATEGORIES = ["Fashion", "Electronics", "Home"];

const PRODUCTS = [
  { id: 1, name: "Women's Printed Kurta Set", price: 449, mrp: 999, rating: 4.1, emoji: "👗", bg: "#FCE4EC", category: "Fashion" },
  { id: 2, name: "Men's Running Sneakers", price: 699, mrp: 1499, rating: 4.0, emoji: "👟", bg: "#E3F2FD", category: "Fashion" },
  { id: 3, name: "Analog Wrist Watch", price: 299, mrp: 799, rating: 3.9, emoji: "⌚", bg: "#FFF3E0", category: "Fashion" },
  { id: 4, name: "Travel Backpack 30L", price: 549, mrp: 1299, rating: 4.3, emoji: "🎒", bg: "#E8F5E9", category: "Fashion" },
  { id: 5, name: "Bluetooth Earbuds", price: 799, mrp: 1999, rating: 4.2, emoji: "🎧", bg: "#F3E5F5", category: "Electronics" },
  { id: 6, name: "Phone Stand & Holder", price: 149, mrp: 349, rating: 3.9, emoji: "📱", bg: "#E1F5FE", category: "Electronics" },
  { id: 7, name: "Cotton Bedsheet Set", price: 399, mrp: 899, rating: 4.0, emoji: "🛏️", bg: "#FFFDE7", category: "Home" },
  { id: 8, name: "Kitchen Organizer Set", price: 249, mrp: 599, rating: 3.8, emoji: "🍽️", bg: "#E0F7FA", category: "Home" },
  { id: 9, name: "LED Study Lamp", price: 349, mrp: 799, rating: 4.1, emoji: "💡", bg: "#FFF8E1", category: "Home" },
  { id: 10, name: "Banarasi Saree", price: 899, mrp: 1999, rating: 4.4, emoji: "🥻", bg: "#FCE4EC", category: "Fashion" },
];

const PERIODS = ["Day", "Week", "Month", "Year"];
const AGING_MS = 45000; // shortened to 45s for demo purposes (real app: ~2 days)
const MOCK_HISTORY = [820, 1340, 990];
const MOCK_HISTORY_LABELS = ["3 ago", "2 ago", "Last"];

function rupee(n) {
  const sign = n < 0 ? "-" : "";
  return sign + "₹" + Math.round(Math.abs(n)).toLocaleString("en-IN");
}

function addPeriod(date, period) {
  const d = new Date(date);
  if (period === "Day") d.setDate(d.getDate() + 1);
  else if (period === "Week") d.setDate(d.getDate() + 7);
  else if (period === "Month") d.setMonth(d.getMonth() + 1);
  else if (period === "Year") d.setFullYear(d.getFullYear() + 1);
  return d;
}

export default function App() {
  const [limit, setLimit] = useState(null);
  const [draftAmount, setDraftAmount] = useState("2000");
  const [draftPeriod, setDraftPeriod] = useState("Month");
  const [draftSubLimits, setDraftSubLimits] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [editingLimit, setEditingLimit] = useState(true);
  const [cart, setCart] = useState([]);
  const [purchased, setPurchased] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [resetMsg, setResetMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [recommendMode, setRecommendMode] = useState(false);
  const [popup80Shown, setPopup80Shown] = useState(false);
  const [show80Modal, setShow80Modal] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 5000);
    return () => clearInterval(t);
  }, []);

  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);
  const purchasedTotal = useMemo(() => purchased.reduce((s, i) => s + i.price * i.qty, 0), [purchased]);

  const limitAmount = limit?.amount || 0;
  const remainingAfterCart = limitAmount - purchasedTotal - cartTotal;
  const remainingReal = limitAmount - purchasedTotal;

  const usedRatio = limitAmount ? (purchasedTotal + cartTotal) / limitAmount : 0;
  const cartPct = Math.min(100, usedRatio * 100);
  const purchasedPct = limitAmount ? Math.min(100, (purchasedTotal / limitAmount) * 100) : 0;

  const overWithCart = limitAmount > 0 && remainingAfterCart < 0;
  const overReal = limitAmount > 0 && remainingReal < 0;
  const nearLimit = limitAmount > 0 && usedRatio >= 0.8 && usedRatio < 1;

  useEffect(() => {
    if (limitAmount > 0 && usedRatio >= 0.8 && !popup80Shown) {
      setShow80Modal(true);
      setPopup80Shown(true);
    }
  }, [usedRatio, limitAmount, popup80Shown]);

  function categorySpent(cat) {
    return [...purchased, ...cart]
      .filter((i) => i.category === cat)
      .reduce((s, i) => s + i.price * i.qty, 0);
  }

  function flashSuccess(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 1800);
  }

  function resetForNewPeriod(currentLimit) {
    setCart([]);
    setPurchased([]);
    setPopup80Shown(false);
    setShow80Modal(false);
    setLimit({ ...currentLimit, periodEnd: addPeriod(new Date(), currentLimit.period) });
    setResetMsg(`New ${currentLimit.period.toLowerCase()}, fresh budget of ${rupee(currentLimit.amount)}!`);
    setTimeout(() => setResetMsg(""), 3000);
  }

  useEffect(() => {
    if (!limit?.periodEnd) return;
    const t = setInterval(() => {
      if (Date.now() >= new Date(limit.periodEnd).getTime()) resetForNewPeriod(limit);
    }, 1000);
    return () => clearInterval(t);
  }, [limit]);

  function addToCart(product) {
    setCart((c) => {
      const existing = c.find((i) => i.id === product.id);
      if (existing) return c.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      return [...c, { ...product, qty: 1, addedAt: Date.now() }];
    });
  }

  function removeFromCart(id) {
    setCart((c) => c.filter((i) => i.id !== id));
  }

  function buyDirect(product) {
    const willTotal = purchasedTotal + cartTotal + product.price;
    setPurchased((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { ...product, qty: 1 }];
    });
    if (limitAmount && willTotal <= limitAmount) flashSuccess("🎉 Nice — still within budget!");
  }

  function checkout() {
    if (cart.length === 0) return;
    const willTotal = purchasedTotal + cartTotal;
    setPurchased((p) => {
      const merged = [...p];
      cart.forEach((item) => {
        const existing = merged.find((i) => i.id === item.id);
        if (existing) existing.qty += item.qty;
        else merged.push({ ...item });
      });
      return merged;
    });
    setCart([]);
    setShowCart(false);
    if (limitAmount && willTotal <= limitAmount) flashSuccess("🎉✨ Checked out within budget!");
  }

  function openEditLimit() {
    setDraftSubLimits(limit?.subLimits || {});
    setShowAdvanced(!!(limit?.subLimits && Object.keys(limit.subLimits).length));
    setEditingLimit(true);
  }

  function saveLimit() {
    const amt = parseFloat(draftAmount);
    if (!amt || amt <= 0) return;
    const subLimits = {};
    CATEGORIES.forEach((c) => {
      const v = parseFloat(draftSubLimits[c]);
      if (v > 0) subLimits[c] = v;
    });
    setLimit({ amount: amt, period: draftPeriod, periodEnd: addPeriod(new Date(), draftPeriod), subLimits });
    setPopup80Shown(false);
    setEditingLimit(false);
  }

  const filteredProducts = useMemo(
    () => (selectedCategory === "All" ? PRODUCTS : PRODUCTS.filter((p) => p.category === selectedCategory)),
    [selectedCategory]
  );

  const sortedProducts = useMemo(() => {
    if (!recommendMode) return filteredProducts;
    return [...filteredProducts].sort((a, b) => {
      const aFits = limitAmount ? a.price <= remainingReal : true;
      const bFits = limitAmount ? b.price <= remainingReal : true;
      if (aFits === bFits) return b.rating - a.rating;
      return aFits ? -1 : 1;
    });
  }, [filteredProducts, recommendMode, remainingReal, limitAmount]);

  const historyBars = [
    ...MOCK_HISTORY.map((v, i) => ({ label: MOCK_HISTORY_LABELS[i], value: v, current: false })),
    { label: "Now", value: purchasedTotal, current: true },
  ];
  const historyMax = Math.max(limitAmount || 0, ...historyBars.map((b) => b.value), 1);

  return (
    <div className="ml-app">
      <style>{`
        .ml-app { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; background: #F6F6F6; min-height: 100vh; color: #2B2B2B; padding-bottom: 40px; }
        .ml-header { background: linear-gradient(135deg, #9F1268, #6B0A46); color: white; padding: 16px 20px 60px; position: relative; }
        .ml-header h1 { font-family: 'Poppins', ui-sans-serif, system-ui, sans-serif; font-size: 20px; font-weight: 700; margin: 0 0 2px; letter-spacing: -0.2px; }
        .ml-header p { margin: 0; font-size: 12.5px; opacity: 0.85; }
        .ml-cart-btn { position: absolute; top: 16px; right: 20px; background: rgba(255,255,255,0.18); border: none; color: white; border-radius: 20px; padding: 8px 14px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .ml-banners { margin: -46px 16px 0; display: flex; flex-direction: column; gap: 10px; position: relative; z-index: 2; }
        .ml-banner { background: white; border-radius: 14px; padding: 14px 16px; box-shadow: 0 4px 14px rgba(0,0,0,0.08); }
        .ml-banner-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
        .ml-banner-label { font-size: 12.5px; font-weight: 700; color: #7C7C7C; text-transform: uppercase; letter-spacing: 0.4px; }
        .ml-banner-value { font-family: 'Poppins', sans-serif; font-size: 18px; font-weight: 700; }
        .ml-track { height: 8px; background: #EEE; border-radius: 6px; overflow: hidden; margin-bottom: 8px; }
        .ml-fill { height: 100%; border-radius: 6px; transition: width 0.3s ease; }
        .ml-banner-sub { font-size: 12.5px; color: #555; }
        .ml-banner-sub b { font-weight: 700; }
        .ml-warn { color: #E4483C !important; }
        .ml-nudge { background: #FFF8E1; border: 1px solid #FFE082; border-radius: 10px; padding: 8px 12px; font-size: 12px; font-weight: 600; color: #8A6D00; margin-top: 4px; }
        .ml-setup { background: white; margin: -46px 16px 0; border-radius: 14px; padding: 18px 16px; box-shadow: 0 4px 14px rgba(0,0,0,0.08); position: relative; z-index: 2; }
        .ml-setup h2 { font-family: 'Poppins', sans-serif; font-size: 15px; margin: 0 0 12px; }
        .ml-setup-row { display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
        .ml-period-btn { border: 1.5px solid #E0AFC9; background: white; color: #9F1268; border-radius: 20px; padding: 6px 14px; font-size: 13px; font-weight: 600; cursor: pointer; }
        .ml-period-btn.active { background: #9F1268; color: white; border-color: #9F1268; }
        .ml-amount-input { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1.5px solid #DDD; font-size: 15px; font-weight: 600; margin-bottom: 12px; box-sizing: border-box; }
        .ml-save-btn { width: 100%; background: #9F1268; color: white; border: none; border-radius: 10px; padding: 11px; font-size: 14px; font-weight: 700; cursor: pointer; }
        .ml-edit-limit { text-align: center; margin-top: 6px; font-size: 12px; }
        .ml-edit-limit button { background: none; border: none; color: #9F1268; font-size: 12px; font-weight: 600; cursor: pointer; text-decoration: underline; }
        .ml-advanced-toggle { background: none; border: none; color: #9F1268; font-size: 12.5px; font-weight: 700; cursor: pointer; padding: 0; margin-bottom: 10px; }
        .ml-sublimit-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .ml-sublimit-row label { flex: 1; font-size: 12.5px; font-weight: 600; color: #555; }
        .ml-sublimit-row input { width: 90px; padding: 7px 8px; border-radius: 8px; border: 1.5px solid #DDD; font-size: 13px; box-sizing: border-box; }
        .ml-catbudget-panel { background: white; margin: 10px 16px 0; border-radius: 14px; padding: 14px 16px; box-shadow: 0 4px 14px rgba(0,0,0,0.08); }
        .ml-catbudget-panel h4 { margin: 0 0 10px; font-size: 12.5px; text-transform: uppercase; letter-spacing: 0.4px; color: #7C7C7C; }
        .ml-catbudget-row { margin-bottom: 10px; }
        .ml-catbudget-row:last-child { margin-bottom: 0; }
        .ml-catbudget-top { display: flex; justify-content: space-between; font-size: 12.5px; font-weight: 600; margin-bottom: 4px; }
        .ml-history-panel { background: white; margin: 10px 16px 0; border-radius: 14px; padding: 14px 16px; box-shadow: 0 4px 14px rgba(0,0,0,0.08); }
        .ml-history-panel h4 { margin: 0 0 12px; font-size: 12.5px; text-transform: uppercase; letter-spacing: 0.4px; color: #7C7C7C; }
        .ml-history-bars { display: flex; align-items: flex-end; gap: 10px; height: 70px; }
        .ml-history-bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; }
        .ml-history-bar { width: 100%; border-radius: 5px 5px 0 0; background: #E0AFC9; transition: height 0.3s ease; }
        .ml-history-bar.current { background: #9F1268; }
        .ml-history-label { font-size: 10.5px; color: #999; margin-top: 4px; font-weight: 600; }
        .ml-chips-row { display: flex; gap: 8px; padding: 18px 16px 0; overflow-x: auto; align-items: center; }
        .ml-chip { border: 1.5px solid #DDD; background: white; color: #555; border-radius: 20px; padding: 6px 14px; font-size: 12.5px; font-weight: 600; cursor: pointer; white-space: nowrap; }
        .ml-chip.active { background: #2B2B2B; color: white; border-color: #2B2B2B; }
        .ml-recommend-toggle { margin-left: auto; border: 1.5px solid #9F1268; background: white; color: #9F1268; border-radius: 20px; padding: 6px 12px; font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap; }
        .ml-recommend-toggle.active { background: #9F1268; color: white; }
        .ml-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 14px 16px 0; }
        .ml-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); position: relative; }
        .ml-card-img { height: 100px; display: flex; align-items: center; justify-content: center; font-size: 40px; }
        .ml-card-body { padding: 10px 10px 12px; }
        .ml-card-name { font-size: 12.5px; font-weight: 600; line-height: 1.3; margin-bottom: 6px; height: 32px; overflow: hidden; }
        .ml-price-row { display: flex; align-items: baseline; gap: 6px; margin-bottom: 3px; }
        .ml-price { font-weight: 700; font-size: 15px; }
        .ml-mrp { font-size: 11.5px; color: #999; text-decoration: line-through; }
        .ml-discount { font-size: 11px; color: #1BA672; font-weight: 700; margin-bottom: 6px; }
        .ml-rating { display: inline-flex; align-items: center; gap: 3px; background: #1BA672; color: white; font-size: 10.5px; font-weight: 700; padding: 1px 6px; border-radius: 4px; margin-bottom: 6px; }
        .ml-fit-badge { display: inline-block; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 5px; margin-bottom: 8px; }
        .ml-fit-badge.fits { background: #E3F6EC; color: #1BA672; }
        .ml-fit-badge.over { background: #FCE9E7; color: #E4483C; }
        .ml-btn-row { display: flex; gap: 6px; }
        .ml-add-btn, .ml-buy-btn { flex: 1; padding: 7px 4px; border-radius: 8px; font-size: 11.5px; font-weight: 700; cursor: pointer; border: 1.5px solid #9F1268; }
        .ml-add-btn { background: white; color: #9F1268; }
        .ml-buy-btn { background: #9F1268; color: white; }
        .ml-skeleton-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .ml-skeleton-img, .ml-skeleton-line { background: linear-gradient(90deg, #EEE 25%, #F7F7F7 50%, #EEE 75%); background-size: 200% 100%; animation: ml-shimmer 1.3s infinite; }
        .ml-skeleton-img { height: 100px; }
        .ml-skeleton-line { height: 10px; border-radius: 4px; margin: 10px 10px 0; }
        .ml-skeleton-line.short { width: 50%; }
        @keyframes ml-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .ml-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 10; display: flex; align-items: flex-end; }
        .ml-drawer { background: white; width: 100%; border-radius: 16px 16px 0 0; padding: 18px 16px 20px; max-height: 70vh; overflow-y: auto; }
        .ml-drawer h3 { font-family: 'Poppins', sans-serif; margin: 0 0 12px; font-size: 16px; display: flex; justify-content: space-between; align-items: center; }
        .ml-drawer h3 span { font-size: 13px; color: #9F1268; cursor: pointer; font-weight: 600; }
        .ml-cart-item { padding: 10px 0; border-bottom: 1px solid #F0F0F0; font-size: 13px; }
        .ml-cart-item-top { display: flex; justify-content: space-between; align-items: center; }
        .ml-cart-item button { background: #FCE4EC; color: #E4483C; border: none; border-radius: 6px; padding: 4px 10px; font-size: 11.5px; font-weight: 700; cursor: pointer; }
        .ml-aging-tag { display: inline-block; margin-top: 4px; font-size: 10.5px; font-weight: 700; color: #B8860B; background: #FFF8E1; padding: 2px 7px; border-radius: 5px; }
        .ml-checkout-btn { width: 100%; background: #1BA672; color: white; border: none; border-radius: 10px; padding: 12px; font-weight: 700; font-size: 14px; margin-top: 14px; cursor: pointer; }
        .ml-empty { text-align: center; color: #999; font-size: 13px; padding: 20px 0; }
        .ml-toast { position: fixed; bottom: 16px; left: 16px; right: 16px; background: #2B2B2B; color: white; padding: 12px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; text-align: center; z-index: 20; box-shadow: 0 4px 14px rgba(0,0,0,0.25); }
        .ml-success-toast { position: fixed; bottom: 16px; left: 16px; right: 16px; background: #1BA672; color: white; padding: 12px 16px; border-radius: 10px; font-size: 13px; font-weight: 700; text-align: center; z-index: 21; box-shadow: 0 4px 14px rgba(0,0,0,0.25); animation: ml-pop 0.3s ease; }
        @keyframes ml-pop { 0% { transform: scale(0.85); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .ml-empty-state { background: white; margin: 10px 16px 0; border-radius: 14px; padding: 22px 16px; text-align: center; box-shadow: 0 4px 14px rgba(0,0,0,0.08); }
        .ml-empty-state-emoji { font-size: 34px; margin-bottom: 8px; }
        .ml-empty-state h4 { font-family: 'Poppins', sans-serif; margin: 0 0 4px; font-size: 15px; }
        .ml-empty-state p { margin: 0; font-size: 12.5px; color: #777; }
        .ml-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 30; display: flex; align-items: center; justify-content: center; padding: 24px; }
        .ml-modal-card { background: white; border-radius: 16px; padding: 24px 20px; max-width: 320px; text-align: center; animation: ml-pop 0.25s ease; }
        .ml-modal-card .ml-modal-emoji { font-size: 38px; margin-bottom: 10px; }
        .ml-modal-card h3 { font-family: 'Poppins', sans-serif; margin: 0 0 8px; font-size: 16px; }
        .ml-modal-card p { margin: 0 0 16px; font-size: 13px; color: #666; line-height: 1.4; }
        .ml-modal-card button { background: #9F1268; color: white; border: none; border-radius: 10px; padding: 10px 22px; font-size: 13.5px; font-weight: 700; cursor: pointer; }
      `}</style>

      <div className="ml-header">
        <h1>Meesho Budget Buddy</h1>
        <p>Shop smart, stay within your limit</p>
        <button className="ml-cart-btn" onClick={() => setShowCart(true)}>🛒 Cart ({cart.length})</button>
      </div>

      {editingLimit || !limit ? (
        <div className="ml-setup">
          <h2>Set your shopping budget</h2>
          <div className="ml-setup-row">
            {PERIODS.map((p) => (
              <button key={p} className={"ml-period-btn" + (draftPeriod === p ? " active" : "")} onClick={() => setDraftPeriod(p)}>{p}</button>
            ))}
          </div>
          <input className="ml-amount-input" type="number" value={draftAmount} onChange={(e) => setDraftAmount(e.target.value)} placeholder="Enter amount in ₹" />
          <button className="ml-advanced-toggle" onClick={() => setShowAdvanced((v) => !v)}>
            {showAdvanced ? "− Hide" : "+ Add"} category limits (optional)
          </button>
          {showAdvanced && (
            <div style={{ marginBottom: 10 }}>
              {CATEGORIES.map((c) => (
                <div className="ml-sublimit-row" key={c}>
                  <label>{c}</label>
                  <input
                    type="number"
                    placeholder="₹ limit"
                    value={draftSubLimits[c] || ""}
                    onChange={(e) => setDraftSubLimits((s) => ({ ...s, [c]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          )}
          <button className="ml-save-btn" onClick={saveLimit}>Save budget</button>
        </div>
      ) : (
        <>
          <div className="ml-banners">
            <div className="ml-banner">
              <div className="ml-banner-top">
                <span className="ml-banner-label">🛒 In your cart</span>
                <span className="ml-banner-value">{rupee(cartTotal)}</span>
              </div>
              <div className="ml-track"><div className="ml-fill" style={{ width: cartPct + "%", background: overWithCart ? "#E4483C" : "#9F1268" }} /></div>
              <div className={"ml-banner-sub" + (overWithCart ? " ml-warn" : "")}>
                {overWithCart ? (<>Checking out everything in cart puts you <b>{rupee(Math.abs(remainingAfterCart))} over budget</b></>) : (<>If you check out everything in cart, remaining budget: <b>{rupee(remainingAfterCart)}</b></>)}
              </div>
              {nearLimit && !overWithCart && <div className="ml-nudge">⚠️ You're close to your limit — think before adding more</div>}
            </div>

            <div className="ml-banner">
              <div className="ml-banner-top">
                <span className="ml-banner-label">✅ Already purchased</span>
                <span className="ml-banner-value">{rupee(purchasedTotal)}</span>
              </div>
              <div className="ml-track"><div className="ml-fill" style={{ width: purchasedPct + "%", background: overReal ? "#E4483C" : "#1BA672" }} /></div>
              <div className={"ml-banner-sub" + (overReal ? " ml-warn" : "")}>
                {overReal ? (<>You've gone <b>{rupee(Math.abs(remainingReal))} over</b> your {limit.period.toLowerCase()}ly budget</>) : (<>Real remaining budget this {limit.period.toLowerCase()}: <b>{rupee(remainingReal)}</b></>)}
              </div>
            </div>
          </div>

          {overReal && (
            <div className="ml-empty-state">
              <div className="ml-empty-state-emoji">🧺</div>
              <h4>You're all spent up for this {limit.period.toLowerCase()}</h4>
              <p>New budget kicks in when this {limit.period.toLowerCase()} resets — or adjust your budget below.</p>
            </div>
          )}

          {limit.subLimits && Object.keys(limit.subLimits).length > 0 && (
            <div className="ml-catbudget-panel">
              <h4>Category budgets</h4>
              {Object.entries(limit.subLimits).map(([cat, subAmt]) => {
                const spent = categorySpent(cat);
                const pct = Math.min(100, (spent / subAmt) * 100);
                const over = spent > subAmt;
                return (
                  <div className="ml-catbudget-row" key={cat}>
                    <div className="ml-catbudget-top">
                      <span>{cat}</span>
                      <span className={over ? "ml-warn" : ""}>{rupee(spent)} / {rupee(subAmt)}</span>
                    </div>
                    <div className="ml-track"><div className="ml-fill" style={{ width: pct + "%", background: over ? "#E4483C" : "#9F1268" }} /></div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="ml-history-panel">
            <h4>Spending over recent periods</h4>
            <div className="ml-history-bars">
              {historyBars.map((b, idx) => (
                <div className="ml-history-bar-wrap" key={idx}>
                  <div className={"ml-history-bar" + (b.current ? " current" : "")} style={{ height: Math.max(4, (b.value / historyMax) * 100) + "%" }} />
                  <div className="ml-history-label">{b.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="ml-edit-limit">
            <button onClick={openEditLimit}>Change budget ({rupee(limitAmount)}/{limit.period})</button>
            {" · "}
            <button onClick={() => resetForNewPeriod(limit)}>Simulate period end (demo)</button>
          </div>
        </>
      )}

      <div className="ml-chips-row">
        {["All", ...CATEGORIES].map((c) => (
          <button key={c} className={"ml-chip" + (selectedCategory === c ? " active" : "")} onClick={() => setSelectedCategory(c)}>{c}</button>
        ))}
        <button className={"ml-recommend-toggle" + (recommendMode ? " active" : "")} onClick={() => setRecommendMode((v) => !v)}>🎯 Affordable first</button>
      </div>

      <div className="ml-grid">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div className="ml-skeleton-card" key={i}>
                <div className="ml-skeleton-img" />
                <div className="ml-skeleton-line" />
                <div className="ml-skeleton-line short" />
              </div>
            ))
          : sortedProducts.map((p) => {
              const discount = Math.round(((p.mrp - p.price) / p.mrp) * 100);
              const fits = !limitAmount || p.price <= remainingReal;
              return (
                <div className="ml-card" key={p.id}>
                  <div className="ml-card-img" style={{ background: p.bg }}>{p.emoji}</div>
                  <div className="ml-card-body">
                    <div className="ml-card-name">{p.name}</div>
                    <div className="ml-rating">{p.rating} ★</div>
                    <div className="ml-price-row">
                      <span className="ml-price">{rupee(p.price)}</span>
                      <span className="ml-mrp">{rupee(p.mrp)}</span>
                    </div>
                    <div className="ml-discount">{discount}% off</div>
                    {limitAmount > 0 && (
                      <div className={"ml-fit-badge " + (fits ? "fits" : "over")}>{fits ? "Fits your budget" : "Over remaining budget"}</div>
                    )}
                    <div className="ml-btn-row">
                      <button className="ml-add-btn" onClick={() => addToCart(p)}>Add to Cart</button>
                      <button className="ml-buy-btn" onClick={() => buyDirect(p)}>Buy Now</button>
                    </div>
                  </div>
                </div>
              );
            })}
      </div>

      {showCart && (
        <div className="ml-overlay" onClick={() => setShowCart(false)}>
          <div className="ml-drawer" onClick={(e) => e.stopPropagation()}>
            <h3>Your Cart<span onClick={() => setShowCart(false)}>Close</span></h3>
            {cart.length === 0 ? (
              <div className="ml-empty">Your cart is empty</div>
            ) : (
              <>
                {cart.map((i) => {
                  const isAging = Date.now() - i.addedAt > AGING_MS;
                  return (
                    <div className="ml-cart-item" key={i.id}>
                      <div className="ml-cart-item-top">
                        <span>{i.emoji} {i.name} x{i.qty}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {rupee(i.price * i.qty)}
                          <button onClick={() => removeFromCart(i.id)}>Remove</button>
                        </span>
                      </div>
                      {isAging && <div className="ml-aging-tag">🤔 Still deciding? Sitting in cart a while</div>}
                    </div>
                  );
                })}
                <button className="ml-checkout-btn" onClick={checkout}>Checkout · {rupee(cartTotal)}</button>
              </>
            )}
          </div>
        </div>
      )}

      {resetMsg && <div className="ml-toast">{resetMsg}</div>}
      {successMsg && <div className="ml-success-toast">{successMsg}</div>}

      {show80Modal && (
        <div className="ml-modal-overlay" onClick={() => setShow80Modal(false)}>
          <div className="ml-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="ml-modal-emoji">⚠️</div>
            <h3>You've used 80% of your budget</h3>
            <p>Between your cart and purchases, you're close to your {limit?.period?.toLowerCase()}ly limit of {rupee(limitAmount)}. Worth a second look before adding more.</p>
            <button onClick={() => setShow80Modal(false)}>Got it</button>
          </div>
        </div>
      )}
    </div>
  );
}
