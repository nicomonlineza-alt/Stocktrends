import { useCallback, useEffect, useRef, useState } from 'react';
import './part-two.css';

const STORAGE_KEY = 'stocktrends-part-two-loss-control-v1';
const STAKE_ZAR = 100;
const MAX_PAPER_LOSS_PCT = 0.5;
const DURATIONS = [{label:'1 minute',seconds:60},{label:'3 minutes',seconds:180},{label:'5 minutes',seconds:300}];
const UNIVERSE = {
 Stocks:[['AAPL','Apple'],['MSFT','Microsoft'],['NVDA','NVIDIA'],['AMZN','Amazon'],['GOOGL','Alphabet'],['META','Meta Platforms'],['BRK.B','Berkshire Hathaway'],['JPM','JPMorgan Chase'],['LLY','Eli Lilly'],['AVGO','Broadcom'],['WMT','Walmart'],['XOM','Exxon Mobil'],['ORCL','Oracle'],['COST','Costco'],['MA','Mastercard'],['V','Visa'],['JNJ','Johnson & Johnson'],['PG','Procter & Gamble'],['HD','Home Depot'],['ABBV','AbbVie'],['BAC','Bank of America'],['KO','Coca-Cola'],['NFLX','Netflix'],['CRM','Salesforce'],['CVX','Chevron'],['CSCO','Cisco'],['TMUS','T-Mobile'],['MRK','Merck'],['ACN','Accenture'],['AMD','AMD']],
 Crypto:[['BTC/USD','Bitcoin'],['ETH/USD','Ethereum'],['BNB/USD','BNB'],['XRP/USD','XRP'],['SOL/USD','Solana'],['DOGE/USD','Dogecoin'],['ADA/USD','Cardano'],['TRX/USD','TRON'],['AVAX/USD','Avalanche'],['LINK/USD','Chainlink'],['TON/USD','Toncoin'],['DOT/USD','Polkadot'],['BCH/USD','Bitcoin Cash'],['LTC/USD','Litecoin'],['NEAR/USD','NEAR'],['UNI/USD','Uniswap'],['ATOM/USD','Cosmos'],['ETC/USD','Ethereum Classic'],['XLM/USD','Stellar'],['FIL/USD','Filecoin'],['APT/USD','Aptos'],['ICP/USD','Internet Computer'],['HBAR/USD','Hedera'],['ARB/USD','Arbitrum'],['OP/USD','Optimism'],['INJ/USD','Injective'],['SUI/USD','Sui'],['AAVE/USD','Aave'],['MKR/USD','Maker'],['SHIB/USD','Shiba Inu']],
 Forex:[['EUR/USD','Euro / US Dollar'],['GBP/USD','British Pound / US Dollar'],['USD/JPY','US Dollar / Japanese Yen'],['USD/CHF','US Dollar / Swiss Franc'],['AUD/USD','Australian Dollar / US Dollar'],['USD/CAD','US Dollar / Canadian Dollar'],['NZD/USD','New Zealand Dollar / US Dollar'],['EUR/GBP','Euro / British Pound'],['EUR/JPY','Euro / Japanese Yen'],['GBP/JPY','British Pound / Japanese Yen'],['EUR/CHF','Euro / Swiss Franc'],['EUR/AUD','Euro / Australian Dollar'],['EUR/CAD','Euro / Canadian Dollar'],['EUR/NZD','Euro / New Zealand Dollar'],['GBP/CHF','British Pound / Swiss Franc'],['GBP/AUD','British Pound / Australian Dollar'],['GBP/CAD','British Pound / Canadian Dollar'],['AUD/JPY','Australian Dollar / Japanese Yen'],['AUD/NZD','Australian Dollar / New Zealand Dollar'],['AUD/CAD','Australian Dollar / Canadian Dollar'],['CAD/JPY','Canadian Dollar / Japanese Yen'],['CHF/JPY','Swiss Franc / Japanese Yen'],['NZD/JPY','New Zealand Dollar / Japanese Yen'],['NZD/CAD','New Zealand Dollar / Canadian Dollar'],['USD/SGD','US Dollar / Singapore Dollar'],['USD/ZAR','US Dollar / South African Rand'],['EUR/ZAR','Euro / South African Rand'],['GBP/ZAR','British Pound / South African Rand'],['USD/MXN','US Dollar / Mexican Peso'],['USD/CNH','US Dollar / Offshore Chinese Yuan']]
};
const blankStore=()=>({sessions:[],cumulativeLossZar:0,cumulativeProfitZar:0,cumulativeNetZar:0,peakNetZar:0,updatedAt:null});
function readStore(){try{const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');return raw&&Array.isArray(raw.sessions)?raw:blankStore()}catch{return blankStore()}}
const fmt=(v,d=4)=>Number.isFinite(Number(v))?Number(v).toLocaleString(undefined,{maximumFractionDigits:d}):'—';
const money=v=>(v<0?'-':'')+'R'+Math.abs(v).toFixed(2);
const safePct=v=>Number.isFinite(v)?(v>=0?'+':'')+v.toFixed(3)+'%':'—';
function assessCandles(asset,payload){
 const candles=[...(payload.candles||[])].filter(c=>[c.open,c.high,c.low,c.close].every(v=>Number.isFinite(Number(v))&&Number(v)>0)).sort((a,b)=>String(a.datetime).localeCompare(String(b.datetime)));
 if(candles.length<35)throw Error('Fewer than 35 valid candles');
 const closes=candles.map(c=>Number(c.close)),returns=[];
 for(let i=1;i<closes.length;i++)returns.push(Math.log(closes[i]/closes[i-1]));
 const mean=returns.reduce((a,b)=>a+b,0)/returns.length;
 const volatility=Math.sqrt(returns.reduce((s,r)=>s+(r-mean)**2,0)/returns.length)*100;
 let peak=closes[0],maxDrawdown=0;closes.forEach(p=>{peak=Math.max(peak,p);maxDrawdown=Math.max(maxDrawdown,(peak-p)/peak*100)});
 const ranges=candles.map(c=>(Number(c.high)-Number(c.low))/Number(c.close)*100);
 const atrPct=ranges.slice(-14).reduce((a,b)=>a+b,0)/Math.min(14,ranges.length);
 const latest=candles.at(-1),rawTime=String(latest.datetime);
 const stamp=Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(rawTime)?rawTime:rawTime.replace(' ','T')+'Z');
 const ageMinutes=Number.isFinite(stamp)?Math.max(0,(Date.now()-stamp)/60000):null;
 const isStale=ageMinutes==null||ageMinutes>5;
 const volumeValues=candles.slice(-20).map(c=>Number(c.volume)).filter(v=>Number.isFinite(v)&&v>0);
 const volumeCoverage=volumeValues.length/Math.min(20,candles.length);
 const riskRaw=volatility*.45+maxDrawdown*.30+atrPct*.25;
 return {...asset,price:Number(latest.close),candles:candles.length,lastCandle:latest.datetime,source:payload.source||'Market data provider',volatility,maxDrawdown,atrPct,volumeCoverage,riskRaw,isStale,ageMinutes};
}
function rankCandidates(rows){const sorted=[...rows].sort((a,b)=>a.riskRaw-b.riskRaw);const max=Math.max(...sorted.map(x=>x.riskRaw),.0001);return sorted.map((row,index)=>({...row,rank:index+1,riskScore:Math.round(100*(1-row.riskRaw/max))}))}
function buildSnapshot(row){return {symbol:row.symbol,name:row.name,kind:row.kind,price:row.price,source:row.source,lastCandle:row.lastCandle,riskRaw:row.riskRaw,volatility:row.volatility,maxDrawdown:row.maxDrawdown,atrPct:row.atrPct,riskScore:row.riskScore}}

export default function PartTwoLossLab(){
 const [category,setCategory]=useState(null),[candidates,setCandidates]=useState([]),[selected,setSelected]=useState([]);
 const [scanBusy,setScanBusy]=useState(false),[scanMessage,setScanMessage]=useState('Choose a market to rank its available instruments by observed historical risk.');
 const [phase,setPhase]=useState('home'),[session,setSession]=useState(null),[secondsLeft,setSecondsLeft]=useState(0);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[store,setStore]=useState(readStore);
 const intervalRef=useRef(null),finishingRef=useRef(false),sessionRef=useRef(null);
 useEffect(()=>{sessionRef.current=session},[session]);
 useEffect(()=>{if(!session||session.status!=='running')return;const tick=()=>setSecondsLeft(Math.max(0,Math.ceil((session.endsAt-Date.now())/1000)));tick();const id=setInterval(tick,500);return()=>clearInterval(id)},[session?.id,session?.status]);
 useEffect(()=>{if(session?.status==='running'&&secondsLeft===0&&!busy)finishSession('timer')},[secondsLeft,session?.status,busy]);
 useEffect(()=>{if(!session||session.status!=='running')return;intervalRef.current=setInterval(()=>refreshSession(session.id),25000);return()=>clearInterval(intervalRef.current)},[session?.id,session?.status]);
 const saveStore=useCallback(next=>{localStorage.setItem(STORAGE_KEY,JSON.stringify(next));setStore(next)},[]);
 async function fetchAsset(asset,requireFresh=true){const response=await fetch('/api/market-data?symbol='+encodeURIComponent(asset.symbol)+'&interval=1min&outputsize=60');const payload=await response.json();if(!response.ok||!Array.isArray(payload.candles))throw new Error(payload.error||'Market data unavailable');const result=assessCandles(asset,payload);if(requireFresh&&result.isStale)throw new Error('Latest candle is stale; live paper observation is paused.');return result}
 async function scanCategory(kind){
  if(scanBusy)return;setCategory(kind);setCandidates([]);setSelected([]);setPhase('category');setScanBusy(true);
  setScanMessage('Checking '+UNIVERSE[kind].length+' '+kind.toLowerCase()+' instruments. Missing or stale data will be excluded; this can take a little while.');
  const assets=UNIVERSE[kind].map(([symbol,name])=>({kind,symbol,name})),results=new Array(assets.length);let cursor=0;
  async function worker(){while(cursor<assets.length){const i=cursor++;try{results[i]=await fetchAsset(assets[i],false)}catch(error){results[i]={...assets[i],error:error.message}}}}
  await Promise.all(Array.from({length:4},worker));const valid=rankCandidates(results.filter(x=>!x.error));
  setCandidates(valid);setScanMessage(valid.length+' of 30 instruments returned enough historical data. Stale candidates remain visible for research but cannot be selected for a timed paper session. Rankings are not forecasts.');setScanBusy(false);
 }
 function toggleSelection(symbol){setSelected(old=>old.includes(symbol)?old.filter(x=>x!==symbol):old.length>=5?old:[...old,symbol])}
 async function refreshSession(id){
  const active=sessionRef.current;if(!active||active.id!==id||active.status!=='running'||finishingRef.current)return;
  const refreshed=[];for(const row of active.positions){try{const latest=await fetchAsset({kind:row.kind,symbol:row.symbol,name:row.name});refreshed.push({...row,currentPrice:latest.price,lastCandle:latest.lastCandle,source:latest.source,refreshError:null})}catch(error){refreshed.push({...row,refreshError:error.message})}}
  const updated={...active,positions:refreshed,lastCheckedAt:new Date().toISOString()};sessionRef.current=updated;setSession(updated);
  if(refreshed.some(row=>Number.isFinite(row.currentPrice)&&row.entryPrice&&(row.currentPrice/row.entryPrice-1)*100<=-MAX_PAPER_LOSS_PCT))finishSession('risk-limit',updated);
 }
 function beginDuration(duration){
  if(!session||busy)return;const startedAt=Date.now(),positions=session.positions.map(row=>({...row,currentPrice:row.entryPrice}));
  const running={...session,status:'running',durationSeconds:duration.seconds,startedAt,endsAt:startedAt+duration.seconds*1000,positions,exitReason:null};
  sessionRef.current=running;setSession(running);setSecondsLeft(duration.seconds);setPhase('running');
  setMessage('Paper session started. A simulated risk stop is monitored at '+MAX_PAPER_LOSS_PCT.toFixed(2)+'% below each entry; the timer is the maximum holding period.');
 }
 async function finishSession(reason,providedSession){
  const active=providedSession||sessionRef.current;if(!active||active.status!=='running'||finishingRef.current)return;
  finishingRef.current=true;setBusy(true);setMessage('Closing paper observations and recording results…');if(intervalRef.current)clearInterval(intervalRef.current);
  const finalRows=[];
  for(const row of active.positions){let current=row;try{const latest=await fetchAsset({kind:row.kind,symbol:row.symbol,name:row.name});current={...row,currentPrice:latest.price,lastCandle:latest.lastCandle,source:latest.source,refreshError:null}}catch(error){current={...row,refreshError:error.message}}
   const hasNewCandle=current.lastCandle&&current.lastCandle!==row.entryCandle;
   const hasQuote=hasNewCandle&&Number.isFinite(current.currentPrice)&&Number.isFinite(current.entryPrice)&&current.entryPrice>0;
   const resultPct=hasQuote?(current.currentPrice/current.entryPrice-1)*100:null,pnlZar=resultPct==null?null:STAKE_ZAR*resultPct/100;
   finalRows.push({...current,resultPct,pnlZar,exitReason:reason==='risk-limit'&&resultPct!=null&&resultPct<=-MAX_PAPER_LOSS_PCT?'risk-limit':reason});
  }
  const valid=finalRows.filter(row=>row.pnlZar!=null),losses=valid.filter(row=>row.pnlZar<0).reduce((sum,row)=>sum+Math.abs(row.pnlZar),0),profits=valid.filter(row=>row.pnlZar>0).reduce((sum,row)=>sum+row.pnlZar,0),net=profits-losses,completedAt=new Date().toISOString();
  const record={id:active.id,category:active.category,durationSeconds:active.durationSeconds,startedAt:new Date(active.startedAt).toISOString(),completedAt,exitReason:reason,positions:finalRows.map(({series,...row})=>row),grossLossZar:losses,grossProfitZar:profits,netZar:net,validCount:valid.length,methodVersion:'part-two-risk-v1'};
  const next={sessions:[record,...store.sessions].slice(0,500),cumulativeLossZar:store.cumulativeLossZar+losses,cumulativeProfitZar:store.cumulativeProfitZar+profits,cumulativeNetZar:store.cumulativeNetZar+net,peakNetZar:Math.max(store.peakNetZar,store.cumulativeNetZar+net),updatedAt:completedAt};
  saveStore(next);const completed={...active,status:'complete',completedAt,exitReason:reason,positions:finalRows,netZar:net,grossLossZar:losses,grossProfitZar:profits};
  sessionRef.current=completed;setSession(completed);setPhase('complete');setSecondsLeft(0);setMessage('Session recorded. Part Two has updated its cumulative loss ledger and pattern history on this device.');
  setBusy(false);finishingRef.current=false;
 }
 function startSelection(){
  if(selected.length!==5)return;const positions=candidates.filter(row=>selected.includes(row.symbol)&&!row.isStale).map(row=>({...buildSnapshot(row),entryPrice:row.price,currentPrice:row.price,entryCandle:row.lastCandle}));
  const draft={id:globalThis.crypto?.randomUUID?.()||String(Date.now()),category,positions,status:'ready'};
  sessionRef.current=draft;setSession(draft);setPhase('duration');
 }
 const lossGauge=Math.max(0,Math.min(100,store.cumulativeLossZar/10*100)),netColor=store.cumulativeNetZar>=0?'positive':'negative';
 return <section className="part-two-lab">
  <div className="pt-head"><div><div className="pt-eyebrow">BLACK · PART TWO</div><h1>Loss Control Observatory</h1><p>Preserve the Part One learning record. This separate experiment ranks observed market risk, limits simulated downside and learns from every completed paper session.</p></div><span className="pt-paper-pill">● PAPER ONLY</span></div>
  <section className="pt-ledger"><div className="pt-ledger-head"><div><small>PART TWO · CUMULATIVE LOSS LEDGER</small><h2>Loss pressure</h2></div><span>{store.sessions.length} completed sessions</span></div><div className="pt-gauge-row"><div className="pt-gauge"><div className="pt-gauge-track"><div className="pt-gauge-fill" style={{width:lossGauge+'%'}}/></div><div className="pt-gauge-labels"><span>LOW</span><b>{lossGauge.toFixed(0)} / 100</b><span>HIGH</span></div></div><div className="pt-ledger-stats"><div><small>Cumulative losses</small><b className="negative">{money(store.cumulativeLossZar)}</b></div><div><small>Cumulative simulated profit</small><b className="positive">{money(store.cumulativeProfitZar)}</b></div><div><small>Net paper result</small><b className={netColor}>{money(store.cumulativeNetZar)}</b></div></div></div><p className="pt-note">Gauge scale: R10 cumulative gross simulated losses = 100/100. It records all losing outcomes; later wins change net result but do not erase prior losses.</p></section>
  {phase==='home'&&<div className="pt-home"><div className="pt-section-intro"><small>CHOOSE A MARKET</small><h2>Where should we look?</h2><p>Each category is scanned independently. The 30 instruments are ranked by lower observed volatility, drawdown and candle-range risk, not by a promise of future performance.</p></div><div className="pt-category-grid">{Object.keys(UNIVERSE).map((kind,index)=><button key={kind} className={'pt-category-card pt-'+kind.toLowerCase()} onClick={()=>scanCategory(kind)} disabled={scanBusy}><span className="pt-category-number">0{index+1}</span><strong>{kind}</strong><small>Scan 30 instruments</small><span className="pt-arrow">↗</span></button>)}</div></div>}
  {phase==='category'&&<section className="pt-category-view"><div className="pt-toolbar"><button className="pt-back" onClick={()=>{setPhase('home');setCategory(null);setCandidates([]);setSelected([])}}>← Markets</button><div><small>PART TWO · RISK RANKING</small><h2>{category}</h2></div><span>{selected.length}/5 selected</span></div><p className="pt-message">{scanBusy?'◌ '+scanMessage:scanMessage}</p>{scanBusy&&<div className="pt-scan-progress"><span/></div>}
   {!scanBusy&&<><div className="pt-ranking-key"><span>LOWER OBSERVED RISK</span><span>Rank 30 = higher observed risk</span></div><div className="pt-candidate-grid">{candidates.map(row=><button key={row.symbol} onClick={()=>toggleSelection(row.symbol)} disabled={row.isStale||scanBusy} className={'pt-candidate '+(selected.includes(row.symbol)?'chosen':'')+(row.isStale?' stale':'')}><div className="pt-candidate-top"><span>#{row.rank}</span><span className="pt-risk-chip">{row.riskScore}/100</span></div><strong>{row.symbol}</strong><small>{row.name}</small><div className="pt-risk-details"><span>Volatility <b>{fmt(row.volatility,3)}%</b></span><span>Drawdown <b>{fmt(row.maxDrawdown,3)}%</b></span><span>Range <b>{fmt(row.atrPct,3)}%</b></span></div><em>{row.isStale?'STALE · RESEARCH ONLY':selected.includes(row.symbol)?'✓ SELECTED':'TAP TO SELECT'}</em></button>)}</div>{candidates.length===0&&<div className="pt-empty">No valid instruments were returned. Check provider access and try again later.</div>}<div className="pt-selection-footer"><span>Select exactly five. Missing or stale instruments are excluded rather than filled with sample data.</span><button onClick={startSelection} disabled={selected.length!==5}>Start →</button></div></>}</section>}
  {phase==='duration'&&session&&<section className="pt-duration-view"><button className="pt-back" onClick={()=>setPhase('category')}>← Change selection</button><small>FIVE SELECTED · {session.category.toUpperCase()}</small><h2>Choose observation window</h2><p>Each paper position uses a virtual R{STAKE_ZAR} stake. The automatic risk exit is monitored at a {MAX_PAPER_LOSS_PCT}% adverse move; any remaining observations close at the selected time.</p><div className="pt-selected-chips">{session.positions.map(row=><span key={row.symbol}>{row.symbol} · {fmt(row.entryPrice,5)}</span>)}</div><div className="pt-duration-grid">{DURATIONS.map(d=><button key={d.seconds} onClick={()=>beginDuration(d)}><strong>{d.label}</strong><small>Automatic close after {d.seconds} seconds</small></button>)}</div></section>}
  {(phase==='running'||phase==='complete')&&session&&<section className="pt-session-view"><div className="pt-toolbar"><div><small>{session.category.toUpperCase()} · FIVE PAPER POSITIONS</small><h2>{phase==='running'?'Session running':'Session complete'}</h2></div><span className="pt-countdown">{phase==='running'?Math.floor(secondsLeft/60)+':'+String(secondsLeft%60).padStart(2,'0'):'CLOSED'}</span></div><p className="pt-message">{message}</p><div className="pt-position-grid">{session.positions.map(row=>{const pct=row.entryPrice&&row.currentPrice?(row.currentPrice/row.entryPrice-1)*100:null;return <article className="pt-position" key={row.symbol}><div><strong>{row.symbol}</strong><small>{row.name}</small></div><b className={pct==null?'':pct>=0?'positive':'negative'}>{safePct(pct)}</b><div className="pt-position-meta"><span>Entry {fmt(row.entryPrice,5)}</span><span>Latest {fmt(row.currentPrice,5)}</span><span>{row.lastCandle||'Awaiting candle'}</span></div>{row.refreshError&&<small className="pt-error">{row.refreshError}</small>}{phase==='complete'&&<div className="pt-position-close"><span>{row.exitReason||session.exitReason}</span><b className={row.pnlZar>=0?'positive':'negative'}>{row.pnlZar==null?'UNAVAILABLE':money(row.pnlZar)}</b></div>}</article>})}</div>{phase==='running'&&<button className="pt-close-early" onClick={()=>finishSession('manual-close')} disabled={busy}>Close all early &amp; record results</button>}{phase==='complete'&&<div className="pt-session-summary"><div><small>SESSION NET</small><b className={session.netZar>=0?'positive':'negative'}>{money(session.netZar)}</b></div><div><small>GROSS LOSSES</small><b className="negative">{money(session.grossLossZar)}</b></div><div><small>EXIT REASON</small><b>{session.exitReason}</b></div><button onClick={()=>{setPhase('home');setCategory(null);setSession(null);setSelected([]);setCandidates([])}}>New session</button></div>}</section>}
  <section className="pt-learning"><div><small>CONTINUOUS LEARNING · PART TWO</small><h2>Observed outcomes</h2><p>Part Two records each candidate's risk features, selected instruments, duration, observed exit and result. The journal is stored separately from Part One on this device.</p></div><div className="pt-learning-stats"><span><b>{store.sessions.length}</b>Sessions</span><span><b>{store.sessions.reduce((s,x)=>s+(x.positions?.length||0),0)}</b>Observations</span><span><b>{store.sessions.filter(x=>x.exitReason==='risk-limit').length}</b>Risk exits</span></div>{store.sessions.length>0&&<div className="pt-history">{store.sessions.slice(0,8).map(row=><article key={row.id}><div><b>{row.category} · {row.positions.map(p=>p.symbol).join(', ')}</b><small>{new Date(row.completedAt).toLocaleString()} · {row.durationSeconds/60} min · {row.exitReason}</small></div><strong className={row.netZar>=0?'positive':'negative'}>{money(row.netZar)}</strong></article>)}</div>}</section>
  <p className="pt-disclaimer">All results are hypothetical paper observations, not executed trades or financial advice. Risk ranking is historical and relative to valid instruments returned at scan time; it cannot identify instruments certain not to lose money. One-minute candles may not update during a short session; missing or stale quotes are marked unavailable. Estimated spread, slippage, fees and gaps are not included, so results may overstate what a real transaction could achieve. Part One data and learning keys are not modified.</p>
 </section>;
}