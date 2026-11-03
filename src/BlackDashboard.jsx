import { useMemo, useState } from 'react';
import { Activity, Clock3, RefreshCw, Search, BarChart3 } from 'lucide-react';
import './black.css';

const ASSETS = [
  ['NVDA','NVIDIA'],['MSFT','Microsoft'],['AAPL','Apple'],['AMZN','Amazon'],['GOOGL','Alphabet'],
  ['META','Meta Platforms'],['TSLA','Tesla'],['AVGO','Broadcom'],['AMD','Advanced Micro Devices'],['NFLX','Netflix'],
  ['ORCL','Oracle'],['PLTR','Palantir'],['INTC','Intel'],['QCOM','Qualcomm'],['CRM','Salesforce'],
  ['JPM','JPMorgan Chase'],['WMT','Walmart'],['COST','Costco'],['COIN','Coinbase'],['UBER','Uber'],
  ['SHOP','Shopify'],['DIS','Walt Disney'],['BA','Boeing'],['CAT','Caterpillar'],['XOM','Exxon Mobil'],
  ['CVX','Chevron'],['JNJ','Johnson & Johnson'],['LLY','Eli Lilly'],['NKE','Nike'],['MCD','McDonald’s'],
  ['KO','Coca-Cola'],['BAC','Bank of America'],['GS','Goldman Sachs'],['PYPL','PayPal'],['TSM','Taiwan Semiconductor'],
  ['ARM','Arm Holdings'],['MU','Micron Technology'],['CSCO','Cisco'],['IBM','IBM'],['PANW','Palo Alto Networks']
].map(([symbol,name])=>({symbol,name}));

const DURATIONS = [
  {label:'1 Min',interval:'1min',bars:21,description:'One-minute candles'},
  {label:'5 Min',interval:'5min',bars:21,description:'Five-minute candles'},
  {label:'15 Min',interval:'15min',bars:21,description:'Fifteen-minute candles'},
  {label:'1 Hour',interval:'1h',bars:21,description:'Hourly candles'},
  {label:'3 Hour',interval:'1h',bars:21,aggregate:3,description:'Three-hour view, grouped from hourly candles'}
];

const fmt=(v)=>Number.isFinite(Number(v))?Number(v).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}):'—';
const pct=(v)=>Number.isFinite(Number(v))?(Number(v)>=0?'+':'')+Number(v).toFixed(2)+'%':'—';

export default function BlackDashboard(){
  const [duration,setDuration]=useState(DURATIONS[0]);
  const [selected,setSelected]=useState(['NVDA','MSFT','AAPL']);
  const [search,setSearch]=useState('');
  const [observations,setObservations]=useState([]);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [updatedAt,setUpdatedAt]=useState(null);
  const filtered=useMemo(()=>ASSETS.filter(a=>(a.symbol+' '+a.name).toLowerCase().includes(search.toLowerCase())),[search]);

  function toggle(symbol){
    setSelected(old=>old.includes(symbol)?old.filter(s=>s!==symbol):old.length>=8?old:[...old,symbol]);
  }

  async function loadObservations(){
    if(!selected.length||busy)return;
    setBusy(true);setMessage('Loading verified historical candles. This may take a moment…');
    const results=[];
    for(const symbol of selected){
      try{
        const response=await fetch('/api/market-data?symbol='+encodeURIComponent(symbol)+'&interval='+duration.interval+'&outputsize='+duration.bars);
        const payload=await response.json();
        if(!response.ok||!Array.isArray(payload.candles)||!payload.candles.length)throw new Error(payload.error||'No candle data returned');
        const all=[...payload.candles].sort((a,b)=>String(a.datetime).localeCompare(String(b.datetime)));
        const rows=duration.aggregate?all.slice(-duration.aggregate):all;
        const first=rows[0],last=rows.at(-1);
        const open=Number(first.open),close=Number(last.close);
        const high=Math.max(...rows.map(r=>Number(r.high))),low=Math.min(...rows.map(r=>Number(r.low)));
        const movement=open?((close-open)/open)*100:null;
        results.push({symbol,name:ASSETS.find(a=>a.symbol===symbol)?.name||symbol,source:payload.source||'Market data provider',currency:payload.currency||'USD',interval:duration.label,candles:rows.length,open,high,low,close,movement,lastUpdated:last.datetime,volume:rows.reduce((sum,r)=>sum+(Number(r.volume)||0),0)});
      }catch(error){results.push({symbol,name:ASSETS.find(a=>a.symbol===symbol)?.name||symbol,error:error.message});}
    }
    setObservations(results);setUpdatedAt(new Date().toISOString());
    const successful=results.filter(r=>!r.error).length;
    setMessage('Loaded '+successful+' of '+selected.length+' requested market observations. Missing provider data is shown as unavailable; no values are estimated.');
    setBusy(false);
  }

  return <section className="black-dashboard">
    <div className="black-head">
      <div><div className="eyebrow">BLACK · MARKET OBSERVATORY</div><h1><Activity/> Black</h1>
      <p>Explore a wider range of listed companies across five chart timeframes. This workspace displays historical market data for learning and comparison only.</p></div>
      <span className="black-label">40 STOCKS · 5 TIMEFRAMES</span>
    </div>

    <div className="black-duration">
      <div className="eyebrow">01 · CHOOSE A TIMEFRAME</div>
      <div className="black-options">{DURATIONS.map(d=><button key={d.label} className={duration.label===d.label?'chosen':''} onClick={()=>setDuration(d)}>{d.label}</button>)}</div>
      <p className="black-hint">{duration.description}. The same 40-stock catalogue is available in every timeframe.</p>
    </div>

    <div className="black-picker">
      <div className="black-picker-head"><div><div className="eyebrow">02 · BUILD YOUR WATCHLIST</div><h2>Choose stocks to observe</h2><p>Select up to 8 companies for one market-data refresh.</p></div><strong className="black-count">{selected.length} / 8 selected</strong></div>
      <label className="black-search"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search 40 stocks by name or ticker…"/></label>
      <div className="black-stock-grid">{filtered.map(asset=><button key={asset.symbol} className={'black-stock-option '+(selected.includes(asset.symbol)?'selected':'')} onClick={()=>toggle(asset.symbol)} aria-pressed={selected.includes(asset.symbol)}><span className="stock-check">{selected.includes(asset.symbol)?'✓':'+'}</span><span><b>{asset.symbol}</b><small>{asset.name}</small></span></button>)}</div>
      <div className="black-picker-actions"><span className="black-hint">A maximum of 8 symbols per refresh helps manage market-data API usage.</span><button className="black-load" disabled={!selected.length||busy} onClick={loadObservations}><RefreshCw size={16} className={busy?'spinning':''}/>{busy?'Loading observations…':'Load market observations'}</button></div>
    </div>

    {message&&<div className="black-message" role="status">{message}</div>}
    <div className="black-section-head"><div><div className="eyebrow">03 · HISTORICAL MARKET DATA</div><h2>Observation results</h2></div><span>{updatedAt?'Updated '+new Date(updatedAt).toLocaleTimeString():'Not loaded yet'}</span></div>
    {!observations.length?<div className="black-empty"><BarChart3 size={25}/><b>Your observation panel is ready</b><p>Choose a timeframe and a few stocks, then load their historical candles to compare recorded price movement.</p></div>:
      <div className="black-results">{observations.map(row=><article className="black-result" key={row.symbol}>
        <div className="black-result-top"><div><b>{row.symbol}</b><small>{row.name}</small></div><span className="black-time-chip">{row.interval}</span></div>
        {row.error?<p className="black-error">Data unavailable: {row.error}</p>:<>
          <div className="black-price">{row.currency} {fmt(row.close)}</div>
          <div className="black-data-grid"><div><small>Open</small><b>{fmt(row.open)}</b></div><div><small>High</small><b>{fmt(row.high)}</b></div><div><small>Low</small><b>{fmt(row.low)}</b></div><div><small>Change in sample</small><b className={row.movement>=0?'neutral-positive':'neutral-negative'}>{pct(row.movement)}</b></div></div>
          <div className="black-result-foot"><span>{row.candles} candle(s) · {row.source}</span><span>{row.lastUpdated}</span></div>
        </>}
      </article>)}</div>}
    <p className="black-disclaimer">Educational observation only. Historical movement is not a prediction or a buy/sell signal. Data availability and delays depend on the connected market-data provider. No trade-finding, simulated profit targets, or broker orders are included.</p>
  </section>;
}
