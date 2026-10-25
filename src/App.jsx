import { useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowDownRight, ArrowUpRight, BarChart3, BrainCircuit,
  CircleHelp, ExternalLink, Eye, LayoutDashboard, RefreshCw,
  ShieldCheck, Sparkles, TrendingUp, Wallet, X
} from 'lucide-react';

const STARTING_CASH = 100000;
const CANDIDATES = [
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Semiconductors', price: 182.42, change: 2.34, score: 88, signal: 'Momentum', reason: 'Illustrative positive momentum with elevated activity.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Software', price: 521.18, change: 0.86, score: 82, signal: 'Trend strength', reason: 'Illustrative trend strength and relative stability.' },
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Consumer technology', price: 257.61, change: -0.42, score: 76, signal: 'Watch', reason: 'Mixed short-term movement; monitor for confirmation.' },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.', sector: 'E-commerce & cloud', price: 226.73, change: 1.15, score: 79, signal: 'Momentum', reason: 'Illustrative positive price movement in the sample set.' },
  { symbol: 'META', name: 'Meta Platforms, Inc.', sector: 'Digital platforms', price: 715.34, change: -0.73, score: 72, signal: 'Watch', reason: 'Illustrative pullback; no confirmed live signal.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', price: 243.88, change: 0.61, score: 74, signal: 'Watch', reason: 'Sample candidate for comparison against the daily shortlist.' },
  { symbol: 'TSLA', name: 'Tesla, Inc.', sector: 'Automotive', price: 341.27, change: -1.24, score: 68, signal: 'Volatile', reason: 'Illustrative higher-volatility candidate.' }
];

const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);
const signedPercent = value => `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
const readStore = (key, fallback) => {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; }
  catch { return fallback; }
};

export default function App() {
  const [watchlist, setWatchlist] = useState(() => readStore('stocktrends-watchlist', CANDIDATES.slice(0, 5)));
  const [cash, setCash] = useState(() => readStore('stocktrends-cash', STARTING_CASH));
  const [positions, setPositions] = useState(() => readStore('stocktrends-positions', {}));
  const [trades, setTrades] = useState(() => readStore('stocktrends-trades', []));
  const [activeTab, setActiveTab] = useState('Overview');
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => { localStorage.setItem('stocktrends-watchlist', JSON.stringify(watchlist)); }, [watchlist]);
  useEffect(() => { localStorage.setItem('stocktrends-cash', JSON.stringify(cash)); }, [cash]);
  useEffect(() => { localStorage.setItem('stocktrends-positions', JSON.stringify(positions)); }, [positions]);
  useEffect(() => { localStorage.setItem('stocktrends-trades', JSON.stringify(trades)); }, [trades]);

  const marketValue = useMemo(() => Object.entries(positions).reduce((sum, [symbol, position]) => {
    const stock = CANDIDATES.find(item => item.symbol === symbol);
    return sum + (stock ? stock.price * position.shares : 0);
  }, 0), [positions]);
  const portfolioValue = cash + marketValue;
  const pnl = portfolioValue - STARTING_CASH;
  const pnlPercent = (pnl / STARTING_CASH) * 100;
  const openPositions = Object.entries(positions).filter(([, p]) => p.shares > 0).length;

  function buy(stock) {
    const shares = 1;
    if (cash < stock.price) { setNotice('Not enough simulated cash for this paper trade.'); return; }
    setCash(previous => previous - stock.price);
    setPositions(previous => ({ ...previous, [stock.symbol]: { shares: (previous[stock.symbol]?.shares || 0) + shares } }));
    setTrades(previous => [{ id: Date.now(), symbol: stock.symbol, side: 'BUY', shares, price: stock.price, time: new Date().toISOString() }, ...previous]);
    setNotice(`Paper buy recorded: 1 share of ${stock.symbol}. No real order was placed.`);
  }

  function sell(stock) {
    const current = positions[stock.symbol]?.shares || 0;
    if (current < 1) { setNotice(`No simulated ${stock.symbol} shares to sell.`); return; }
    setCash(previous => previous + stock.price);
    setPositions(previous => {
      const remaining = (previous[stock.symbol]?.shares || 0) - 1;
      const next = { ...previous };
      if (remaining <= 0) delete next[stock.symbol];
      else next[stock.symbol] = { shares: remaining };
      return next;
    });
    setTrades(previous => [{ id: Date.now(), symbol: stock.symbol, side: 'SELL', shares: 1, price: stock.price, time: new Date().toISOString() }, ...previous]);
    setNotice(`Paper sell recorded: 1 share of ${stock.symbol}. No real order was placed.`);
  }

  function refreshPicks() {
    const sorted = [...CANDIDATES].sort((a, b) => b.score - a.score);
    const offset = Math.floor(Math.random() * 3);
    const picks = [...sorted.slice(offset, offset + 5)];
    while (picks.length < 5) picks.push(...sorted.filter(item => !picks.some(pick => pick.symbol === item.symbol)).slice(0, 5 - picks.length));
    setWatchlist(picks);
    setNotice('Five sample candidates refreshed using illustrative scores. Live AI analysis is not connected yet.');
  }

  function resetPaperAccount() {
    if (!window.confirm('Reset your paper-trading account, positions and trade history?')) return;
    setCash(STARTING_CASH);
    setPositions({});
    setTrades([]);
    setNotice('Paper-trading account reset to $100,000 simulated cash.');
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="Stocktrends home">
          <span className="brand-mark"><TrendingUp size={23} /></span>
          <span>stock<span className="brand-accent">trends</span><small>MARKET INTELLIGENCE</small></span>
        </a>
        <div className="nav-label">WORKSPACE</div>
        {[
          { name: 'Overview', icon: LayoutDashboard },
          { name: 'Watchlist', icon: Eye },
          { name: 'Paper trading', icon: Wallet },
          { name: 'Performance', icon: BarChart3 }
        ].map(({ name, icon: Icon }) => (
          <button key={name} className={`nav-item ${activeTab === name ? 'active' : ''}`} onClick={() => setActiveTab(name)}>
            <Icon size={18} /> {name}
          </button>
        ))}
        <div className="sidebar-bottom">
          <div className="status-dot" />
          <span>Research mode</span>
          <span className="version">v0.1</span>
        </div>
      </aside>

      <main className="main-content" id="top">
        <header className="topbar">
          <div><div className="eyebrow">MONDAY — MARKET WORKSPACE</div><h1>{activeTab}</h1></div>
          <div className="topbar-actions"><span className="demo-badge"><span /> DEMO DATA</span><button className="icon-button" title="About demo data" onClick={() => setSelected({ name: 'About Stocktrends data', reason: 'This first version uses illustrative sample prices and signals. Live quotes, model-based picks, and verified market timestamps have not been connected yet. Do not use this sample data to make investment decisions.' })}><CircleHelp size={18} /></button></div>
        </header>

        <div className="notice-bar"><ShieldCheck size={17} /><span><strong>Paper trading only.</strong> Prices and AI scores below are sample data, not live market quotes or investment advice.</span></div>
        {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss notification"><X size={16} /></button></div>}

        <section className="welcome-row">
          <div><div className="eyebrow">YOUR DAILY BRIEFING</div><h2>Make every market move <span>measurable.</span></h2><p>Five candidates to study. Every simulated decision tracked.</p></div>
          <button className="primary-button" onClick={refreshPicks}><RefreshCw size={16} /> Refresh 5 picks</button>
        </section>

        <section className="stats-grid">
          <StatCard label="Paper portfolio value" value={money(portfolioValue)} detail="Starting balance: $100,000" icon={<Wallet size={18} />} />
          <StatCard label="Simulated P/L" value={`${pnl >= 0 ? '+' : '−'}${money(Math.abs(pnl))}`} detail={`${signedPercent(pnlPercent)} since start`} positive={pnl >= 0} icon={<Activity size={18} />} />
          <StatCard label="Open positions" value={String(openPositions).padStart(2, '0')} detail="Simulated holdings" icon={<BarChart3 size={18} />} />
          <StatCard label="Paper trades" value={String(trades.length).padStart(2, '0')} detail="Buys and sells recorded" icon={<BrainCircuit size={18} />} />
        </section>

        {(activeTab === 'Overview' || activeTab === 'Watchlist') && <section className="panel">
          <div className="panel-heading"><div><div className="eyebrow">AI CANDIDATE WATCHLIST</div><h3>Today's five to watch <span className="count-pill">05</span></h3></div><span className="subtle-label">Ranked by sample score</span></div>
          <div className="table-wrap"><table><thead><tr><th>STOCK</th><th>DEMO PRICE</th><th>DAY CHANGE</th><th>SAMPLE SCORE</th><th>SIGNAL</th><th>ACTION</th></tr></thead>
            <tbody>{watchlist.map((stock, index) => <tr key={stock.symbol}>
              <td><div className="stock-cell"><span className="stock-rank">{String(index + 1).padStart(2, '0')}</span><div><strong>{stock.symbol}</strong><small>{stock.name}</small></div></div></td>
              <td className="price-cell">{money(stock.price)}</td>
              <td><span className={`change ${stock.change >= 0 ? 'up' : 'down'}`}>{stock.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{signedPercent(stock.change)}</span></td>
              <td><div className="score-cell"><div className="score-track"><span style={{ width: `${stock.score}%` }} /></div><strong>{stock.score}</strong></div></td>
              <td><span className={`signal signal-${stock.signal.toLowerCase().replace(' ', '-')}`}>{stock.signal}</span></td>
              <td><div className="row-actions"><button className="small-button buy" onClick={() => buy(stock)}>Buy</button><button className="small-button sell" onClick={() => sell(stock)}>Sell</button><button className="link-button" title={`More information about ${stock.symbol}`} onClick={() => setSelected(stock)}><ExternalLink size={16} /></button></div></td>
            </tr>)}</tbody>
          </table></div>
          <div className="panel-footer"><span><Sparkles size={15} /> Scores are illustrative placeholders, not predictions.</span><button className="text-button" onClick={() => setActiveTab('Paper trading')}>View paper trades <span>→</span></button></div>
        </section>}

        {(activeTab === 'Overview' || activeTab === 'Performance') && <section className="bottom-grid">
          <div className="panel performance-panel"><div className="panel-heading"><div><div className="eyebrow">PERFORMANCE TRACKER</div><h3>Paper account summary</h3></div><BarChart3 size={19} className="muted-icon" /></div>
            <div className="performance-number">{pnl >= 0 ? '+' : '−'}{money(Math.abs(pnl))}<span className={pnl >= 0 ? 'positive-text' : 'negative-text'}>{signedPercent(pnlPercent)}</span></div>
            <div className="empty-chart"><div className="chart-grid"><span /><span /><span /><span /></div><div className="chart-placeholder"><TrendingUp size={22} /><span>Your verified performance chart will appear after price history is connected.</span></div></div>
            <div className="mini-legend"><span><i className="legend-dot" /> Portfolio value</span><span>Chart awaiting historical data</span></div>
          </div>
          <div className="panel activity-panel"><div className="panel-heading"><div><div className="eyebrow">LATEST ACTIVITY</div><h3>Trade ledger</h3></div><span className="count-pill">{trades.length}</span></div>
            {trades.length === 0 ? <div className="empty-state"><div className="empty-icon"><Wallet size={22} /></div><strong>No paper trades yet</strong><p>Use Buy or Sell on a stock above to record a simulated trade.</p></div> :
              <div className="trade-list">{trades.slice(0, 5).map(trade => <div className="trade-row" key={trade.id}><span className={`trade-icon ${trade.side.toLowerCase()}`}>{trade.side === 'BUY' ? <ArrowDownRight size={17} /> : <ArrowUpRight size={17} />}</span><div className="trade-description"><strong>{trade.side} {trade.symbol}</strong><small>{new Date(trade.time).toLocaleString()}</small></div><div className="trade-price"><strong>{money(trade.price)}</strong><small>{trade.shares} share</small></div></div>)}</div>}
            <button className="reset-button" onClick={resetPaperAccount}>Reset paper account</button>
          </div>
        </section>}

        {activeTab === 'Paper trading' && <section className="panel info-panel"><div className="panel-heading"><div><div className="eyebrow">SIMULATED PORTFOLIO</div><h3>Open positions</h3></div></div>
          {openPositions === 0 ? <div className="empty-state"><div className="empty-icon"><Wallet size={22} /></div><strong>No open positions</strong><p>Return to Overview and record a paper buy to start tracking a simulated position.</p><button className="primary-button" onClick={() => setActiveTab('Overview')}>Browse watchlist</button></div> :
            <div className="table-wrap"><table><thead><tr><th>STOCK</th><th>SHARES</th><th>SAMPLE PRICE</th><th>MARKET VALUE</th><th>ACTION</th></tr></thead><tbody>{Object.entries(positions).map(([symbol, position]) => { const stock = CANDIDATES.find(item => item.symbol === symbol); if (!stock) return null; return <tr key={symbol}><td><strong>{symbol}</strong></td><td>{position.shares}</td><td>{money(stock.price)}</td><td>{money(stock.price * position.shares)}</td><td><button className="small-button sell" onClick={() => sell(stock)}>Sell 1</button></td></tr>; })}</tbody></table></div>}
          <div className="panel-footer"><span>Trades are stored locally in this browser.</span><button className="text-button" onClick={resetPaperAccount}>Reset account ↺</button></div>
        </section>}

        <footer className="footer"><span>STOCKTRENDS <span className="footer-separator">/</span> EDUCATIONAL RESEARCH TOOL</span><span><ShieldCheck size={14} /> No real trades. No broker connection.</span></footer>
      </main>

      {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><div className="detail-modal" role="dialog" aria-modal="true" aria-label="Stock details" onClick={event => event.stopPropagation()}><button className="modal-close" onClick={() => setSelected(null)} aria-label="Close"><X size={18} /></button><div className="eyebrow">STOCK DETAILS</div><h2>{selected.symbol || selected.name}</h2><p className="modal-company">{selected.name}{selected.sector ? ` · ${selected.sector}` : ''}</p><p>{selected.reason}</p>{selected.price && <div className="modal-metrics"><div><small>Sample price</small><strong>{money(selected.price)}</strong></div><div><small>Sample day move</small><strong className={selected.change >= 0 ? 'positive-text' : 'negative-text'}>{signedPercent(selected.change)}</strong></div><div><small>Sample score</small><strong>{selected.score}/100</strong></div></div>}{selected.symbol && <a className="primary-button modal-link" href={`https://finance.yahoo.com/quote/${selected.symbol}/`} target="_blank" rel="noreferrer">More market information <ExternalLink size={15} /></a>}<div className="modal-note">Market information opens an external website. Stocktrends sample figures are not live quotes.</div></div></div>}
    </div>
  );
}

function StatCard({ label, value, detail, icon, positive }) {
  return <div className="stat-card"><div className="stat-top"><span>{label}</span><span className="stat-icon">{icon}</span></div><strong className="stat-value">{value}</strong><div className={`stat-detail ${positive === undefined ? '' : positive ? 'positive-text' : 'negative-text'}`}>{detail}</div></div>;
}
