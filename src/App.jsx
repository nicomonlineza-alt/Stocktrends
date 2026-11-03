import BlackDashboard from './BlackDashboard.jsx';

export default function App() {
  return (
    <div className="app-shell black-only-shell">
      <header className="black-only-topbar">
        <a className="brand" href="#top" aria-label="Stocktrends Black home">
          <span className="brand-mark">◈</span>
          <span>stock<span className="brand-accent">trends</span><small>BLACK · MARKET OBSERVATORY</small></span>
        </a>
        <span className="black-only-badge"><i/> OBSERVATION MODE</span>
      </header>
      <main id="top" className="black-only-main">
        <BlackDashboard />
        <footer className="black-only-footer">STOCKTRENDS BLACK · Educational market observation · No trade recommendations or broker orders</footer>
      </main>
    </div>
  );
}
