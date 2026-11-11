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
  {label:'1 Min',interval:'1min',bars:60,description:'One-minute candles'},
  {label:'5 Min',interval:'5min',bars:60,description:'Five-minute candles'},
  {label:'15 Min',interval:'15min',bars:60,description:'Fifteen-minute candles'},
  {label:'1 Hour',interval:'1h',bars:60,description:'Hourly candles'},
  {label:'3 Hour',interval:'1h',bars:100,aggregate:3,description:'Three-hour view, grouped from hourly candles'}
];

const fmt=(v)=>Number.isFinite(Number(v))?Number(v).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}):'—';
const pct=(v)=>Number.isFinite(Number(v))?(Number(v)>=0?'+':'')+Number(v).toFixed(2)+'%':'—';

const emaSeries=(values,period)=>{
  if(values.length<period)return [];
  const alpha=2/(period+1);
  let current=values.slice(0,period).reduce((sum,v)=>sum+v,0)/period;
  const output=Array(period-1).fill(null);
  output.push(current);
  for(let i=period;i<values.length;i++){current=(values[i]*alpha)+(current*(1-alpha));output.push(current);}
  return output;
};
const rsiValue=(values,period=14)=>{
  if(values.length<=period)return null;
  let gains=0,losses=0;
  for(let i=1;i<=period;i++){const change=values[i]-values[i-1];gains+=Math.max(change,0);losses+=Math.max(-change,0);}
  let avgGain=gains/period,avgLoss=losses/period;
  for(let i=period+1;i<values.length;i++){const change=values[i]-values[i-1];avgGain=((avgGain*(period-1))+Math.max(change,0))/period;avgLoss=((avgLoss*(period-1))+Math.max(-change,0))/period;}
  if(avgLoss===0)return 100;
  return 100-(100/(1+(avgGain/avgLoss)));
};
const aggregateCandles=(candles,size)=>{
  const groups=[];
  for(let i=0;i+size<=candles.length;i+=size){
    const rows=candles.slice(i,i+size),first=rows[0],last=rows.at(-1);
    groups.push({datetime:last.datetime,open:Number(first.open),high:Math.max(...rows.map(r=>Number(r.high))),low:Math.min(...rows.map(r=>Number(r.low))),close:Number(last.close),volume:rows.every(r=>r.volume!=null)?rows.reduce((sum,r)=>sum+Number(r.volume),0):null});
  }
  return groups;
};
const calculateIndicators=(candles)=>{
  const closes=candles.map(row=>Number(row.close));
  const ema9=emaSeries(closes,9),ema21=emaSeries(closes,21);
  const fast=emaSeries(closes,12),slow=emaSeries(closes,26);
  const macd=closes.map((_,i)=>fast[i]!=null&&slow[i]!=null?fast[i]-slow[i]:null);
  const macdValues=macd.filter(value=>value!=null);
  const signalValues=emaSeries(macdValues,9);
  const macdSignal=signalValues.length?signalValues.at(-1):null;
  const macdLine=macd.at(-1)??null;
  const volumes=candles.map(row=>row.volume==null?null:Number(row.volume));
  const recentVolumes=volumes.slice(-21,-1).filter(value=>value!=null&&Number.isFinite(value));
  const latestVolume=volumes.at(-1);
  const averageVolume=recentVolumes.length?recentVolumes.reduce((sum,value)=>sum+value,0)/recentVolumes.length:null;
  const lastFive=closes.length>=6?((closes.at(-1)-closes.at(-6))/closes.at(-6))*100:null;
  const priorFive=closes.length>=11?((closes.at(-6)-closes.at(-11))/closes.at(-11))*100:null;
  return {
    rsi14:rsiValue(closes),ema9:ema9.at(-1)??null,ema21:ema21.at(-1)??null,
    macdLine,macdSignal,macdHistogram:macdLine!=null&&macdSignal!=null?macdLine-macdSignal:null,
    latestVolume,averageVolume,relativeVolume:latestVolume!=null&&averageVolume>0?latestVolume/averageVolume:null,
    lastFive,priorFive,candleCount:candles.length,
    macdReady:macdValues.length>=34
  };
};

export default function BlackDashboard(){
  const [duration,setDuration]=useState(DURATIONS[0]);
  const [selected,setSelected]=useState(['NVDA','MSFT','AAPL']);
  const [search,setSearch]=useState('');
  const [observations,setObservations]=useState([]);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [updatedAt,setUpdatedAt]=useState(null);
  const [diagnostics,setDiagnostics]=useState([]);
  const [diagnosticsBusy,setDiagnosticsBusy]=useState(false);
  const filtered=useMemo(()=>ASSETS.filter(a=>(a.symbol+' '+a.name).toLowerCase().includes(search.toLowerCase())),[search]);

  function toggle(symbol){
    setSelected(old=>old.includes(symbol)?old.filter(s=>s!==symbol):old.length>=8?old:[...old,symbol]);
  }


  async function runDiagnostics(){
    if(diagnosticsBusy)return;
    setDiagnosticsBusy(true);
    setDiagnostics([]);
    const checks=[];
    for(const timeframe of DURATIONS){
      try{
        const response=await fetch('/api/market-data?symbol=AAPL&interval='+timeframe.interval+'&outputsize=21');
        const payload=await response.json();
        if(!response.ok||!Array.isArray(payload.candles)||payload.candles.length<21){
          throw new Error(payload.error||'Provider returned fewer than 21 valid candles.');
        }
        const latest=[...payload.candles].sort((x,y)=>String(x.datetime).localeCompare(String(y.datetime))).at(-1);
        checks.push({label:timeframe.label,ok:true,source:payload.source||'Market data provider',count:payload.candles.length,last:latest.datetime,detail:timeframe.aggregate?'Uses hourly candles grouped into a 3-hour view.':'21 historical candles received.'});
      }catch(error){
        checks.push({label:timeframe.label,ok:false,detail:error.message});
      }
      setDiagnostics([...checks]);
    }
    setDiagnosticsBusy(false);
  }

  async function loadObservations(){
    if(!selected.length||busy)return;
    setBusy(true);setMessage('Loading up to 60 historical candles per company for indicator calculations. This may take a moment…');
    const results=[];
    for(const symbol of selected){
      try{
        const response=await fetch('/api/market-data?symbol='+encodeURIComponent(symbol)+'&interval='+duration.interval+'&outputsize='+duration.bars);
        const payload=await response.json();
        if(!response.ok||!Array.isArray(payload.candles)||!payload.candles.length)throw new Error(payload.error||'No candle data returned');
        const all=[...payload.candles].sort((a,b)=>String(a.datetime).localeCompare(String(b.datetime)));
        const rows=duration.aggregate?aggregateCandles(all,duration.aggregate):all;
        if(rows.length<26)throw new Error('At least 26 complete candles are needed for the EMA and MACD calculations.');
        const first=rows[0],last=rows.at(-1);
        const open=Number(first.open),close=Number(last.close);
        const high=Math.max(...rows.map(r=>Number(r.high))),low=Math.min(...rows.map(r=>Number(r.low)));
        const movement=open?((close-open)/open)*100:null;
        const indicators=calculateIndicators(rows);
        results.push({symbol,name:ASSETS.find(a=>a.symbol===symbol)?.name||symbol,source:payload.source||'Market data provider',currency:payload.currency||'USD',interval:duration.label,candles:rows.length,open,high,low,close,movement,lastUpdated:last.datetime,volume:rows.reduce((sum,r)=>sum+(Number(r.volume)||0),0),indicators});
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


    <div className="black-diagnostics">
      <div className="black-diagnostics-head">
        <div><div className="eyebrow">SYSTEM CHECK · MARKET DATA</div><h2>Data connection health</h2><p>Test the server-side provider connection against AAPL across all five supported views. This makes five historical-candle requests.</p></div>
        <button className="black-diagnostic-button" onClick={runDiagnostics} disabled={diagnosticsBusy}>{diagnosticsBusy?'Checking providers…':'Run 5-timeframe check'}</button>
      </div>
      {diagnostics.length>0&&<div className="black-diagnostic-grid">{diagnostics.map(item=><article className="black-diagnostic-card" key={item.label}>
        <div><b>{item.label}</b><span className={item.ok?'diagnostic-ok':'diagnostic-fail'}>{item.ok?'CONNECTED':'UNAVAILABLE'}</span></div>
        {item.ok?<><small>{item.source} · {item.count} candles</small><small>Latest candle: {item.last}</small><small>{item.detail}</small></>:<p>{item.detail}</p>}
      </article>)}</div>}
      <p className="black-diagnostic-note">A successful check confirms historical candles can be retrieved; it does not guarantee real-time quotes, uninterrupted provider access, or forecast accuracy.</p>
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
          <div className="black-indicators">
            <div className="black-indicators-title"><b>Technical indicators</b><span>Descriptive · not trade signals</span></div>
            <div className="black-indicator-grid">
              <div><small>RSI (14)</small><b>{fmt(row.indicators.rsi14)}</b><em>{row.indicators.rsi14==null?'Needs more data':row.indicators.rsi14>=70?'Upper range':row.indicators.rsi14<=30?'Lower range':'Middle range'}</em></div>
              <div><small>EMA 9</small><b>{fmt(row.indicators.ema9)}</b><em>Shorter average</em></div>
              <div><small>EMA 21</small><b>{fmt(row.indicators.ema21)}</b><em>Longer average</em></div>
              <div><small>MACD line</small><b>{fmt(row.indicators.macdLine)}</b><em>{row.indicators.macdReady?'12/26 EMA spread':'Early history'}</em></div>
              <div><small>MACD signal</small><b>{fmt(row.indicators.macdSignal)}</b><em>{row.indicators.macdReady?'9-period signal average':'More candles needed'}</em></div>
              <div><small>MACD histogram</small><b>{fmt(row.indicators.macdHistogram)}</b><em>Line minus signal</em></div>
              <div><small>Relative volume</small><b>{row.indicators.relativeVolume==null?'—':fmt(row.indicators.relativeVolume)+'×'}</b><em>Latest vs prior 20</em></div>
              <div><small>Last 5 candles</small><b className={row.indicators.lastFive>=0?'neutral-positive':'neutral-negative'}>{pct(row.indicators.lastFive)}</b><em>Previous 5: {pct(row.indicators.priorFive)}</em></div>
            </div>
            <p className="black-indicator-note">These values describe the candles received from the provider. RSI ranges are context, not instructions; volume may be unavailable. The 3-hour view groups consecutive hourly candles and may not align to official exchange session boundaries.</p>
          </div>
        </>}
      </article>)}</div>}
    <p className="black-disclaimer">Educational observation only. Historical movement and technical indicators are descriptive, not predictions or buy/sell signals. Data availability and delays depend on the connected market-data provider. No trade-finding, simulated profit targets, or broker orders are included.</p>
  </section>;
}
