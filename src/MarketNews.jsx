import { useEffect, useState } from 'react';

function age(value) {
  if (!value) return 'Time unavailable';
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return minutes + 'm ago';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + 'h ago';
  return Math.floor(hours / 24) + 'd ago';
}

export default function MarketNews() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('Loading market headlines…');
  const [updated, setUpdated] = useState(null);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch('/api/market-news');
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'News feed unavailable');
        if (!active) return;
        setItems(payload.articles || []);
        setUpdated(payload.fetchedAt || new Date().toISOString());
        setStatus(payload.articles?.length ? 'Market headlines updated' : 'No matching headlines returned');
      } catch (error) {
        if (active) setStatus(error.message || 'News feed unavailable');
      }
    }
    load();
    const timer = setInterval(load, 5 * 60 * 1000);
    return () => { active = false; clearInterval(timer); };
  }, []);
  return (
    <section className="market-news-panel">
      <div className="market-news-heading">
        <div><small>MARKET INTELLIGENCE · MARKETAUX</small><h2>Live market headlines</h2></div>
        <span>{updated ? 'Updated ' + age(updated) : status}</span>
      </div>
      {items.length ? <div className="market-news-list">
        {items.map(item => <article className="market-news-item" key={item.id || item.url}>
          <div className="market-news-meta"><span>{item.source}</span><span>{age(item.publishedAt)}</span></div>
          <a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a>
          {item.description && <p>{item.description}</p>}
          <div className="market-news-tags">{(item.entities || []).slice(0, 4).map(entity =>
            <span key={entity.symbol || entity.name}>{entity.symbol || entity.name}{Number.isFinite(Number(entity.sentiment)) ? ' · sentiment ' + Number(entity.sentiment).toFixed(2) : ''}</span>
          )}</div>
        </article>)}
      </div> : <p className="market-news-status">{status}</p>}
      <p className="market-news-note">Headlines and sentiment are context only, not verified signals. Open the source article to read the full report.</p>
    </section>
  );
}
