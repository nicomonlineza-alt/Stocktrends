import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, BrainCircuit, Clock3, Search, TrendingDown, TrendingUp } from 'lucide-react';
import { analyzeCandles, learnIndicatorWeights } from './strategy.js';
import './black.css';

const ASSETS = [
  ['NVDA','NVIDIA','Stock'],['MSFT','Microsoft','Stock'],['AAPL','Apple','Stock'],
  ['AMZN','Amazon','Stock'],['BTC/USD','Bitcoin','Crypto'],['ETH/USD','Ethereum','Crypto'],
  ['SOL/USD','Solana','Crypto'],['EUR/USD','Euro / US Dollar','Forex'],
  ['GBP/USD','British Pound / US Dollar','Forex'],['USD/ZAR','US Dollar / Rand','Forex']
];
const DURATIONS = [
  {label:'1 Min',minutes:1,interval:'1min'},
  {label:'5 Min',minutes:5,interval:'5min'},
  {label:'15 Min',minutes:15,interval:'15min'},
  {label:'1 Hour',minutes:60,interval:'1h'},
  {label:'3 Hour',minutes:180,interval:'1h'}
];
const KEY='stocktrends-black-paper-trades-v1';
const LEARNING_KEY='stocktrends-black-learning-v1';
const rand=n=>'R'+Math.abs(Number(n)||0).toFixed(2);
const pct=(entry,price,side)=>((price-entry)/entry*100)*(side==='DOWN'?-1:1);

export default function BlackDashboard(){
  const [duration,setDuration]=useState(null);
  const [trades,setTrades]=useState(()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}});
  const [learningRecords,setLearningRecords]=useState(()=>{try{return JSON.parse(localStorage.getItem(LEARNING_KEY)||'{}')}catch{return{}}});
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[review,setReview]=useState(null),[clock,setClock]=useState(Date.now());
  const polling=useRef(false);
  const active=trades.filter(t=>!t.closedAt),closed=trades.filter(t=>t.closedAt);
  const activeForDuration=duration?active.filter(t=>t.durationMins===duration.minutes):[];
  const latestRunForDuration=duration?trades.filter(t=>t.durationMins===duration.minutes).reduce((latest,t)=>Math.max(latest,new Date(t.startedAt).getTime()),0):0;
  const learnedAt=duration?new Date(learningRecords[duration.label]?.learnedAt||0).getTime():0;
  const needsLearning=Boolean(duration&&latestRunForDuration>learnedAt);
  const canFind=Boolean(duration&&!busy&&!activeForDuration.length&&!needsLearning);
  const weights=useMemo(()=>learnIndicatorWeights(closed.map(t=>({side:'SELL',realizedPnl:t.pnl,entryFeatures:t.entryFeatures}))),[closed]);
  useEffect(()=>{localStorage.setItem(KEY,JSON.stringify(trades))},[trades]);
  useEffect(()=>{localStorage.setItem(LEARNING_KEY,JSON.stringify(learningRecords))},[learningRecords]);
  useEffect(()=>{const id=setInterval(()=>setClock(Date.now()),1000);return()=>clearInterval(id)},[]);
  async function candles(symbol,interval){
    const r=await fetch('/api/market-data?symbol='+encodeURIComponent(symbol)+'&interval='+interval+'&outputsize=80');
    const p=await r.json();if(!r.ok||!p.candles?.length)throw new Error(p.error||'No verified candles');
    return [...p.candles].sort((a,b)=>String(a.datetime).localeCompare(String(b.datetime)));
  }
  async function findTrades(){
    if(!duration||busy||activeForDuration.length||needsLearning)return;setBusy(true);setMessage('Scanning verified market candles for '+duration.label+'…');
    const candidates=[];
    try{
      for(const asset of ASSETS){
        try{
          const rows=await candles(asset[0],duration.interval),a=analyzeCandles(rows,weights);
          const side=a.score>=62&&a.direction!=='SELL / EXIT'?'UP':(a.score<=38||a.direction==='SELL / EXIT'?'DOWN':null);
          if(!side)continue;
          const confidence=side==='UP'?a.score:100-a.score;if(confidence<62)continue;
          candidates.push({id:crypto.randomUUID?.()||String(Date.now())+asset[0],symbol:asset[0],name:asset[1],type:asset[2],direction:side,confidence,entryPrice:a.price,currentPrice:a.price,startedAt:new Date().toISOString(),endsAt:new Date(Date.now()+duration.minutes*60000).toISOString(),durationMins:duration.minutes,stake:100,pnl:0,status:'RUNNING',reason:a.reason,indicators:a.indicators,entryFeatures:a.signalFeatures,volumeRatio:a.indicators.volumeRatio});
        }catch(e){/* skip unavailable symbol */}
      }
      const picks=candidates.sort((a,b)=>b.confidence-a.confidence).slice(0,3);
      if(!picks.length)setMessage('No strong directional pattern met the research threshold. No trade was forced.');
      else{setTrades(old=>[...picks,...old]);setMessage('Found '+picks.length+' simulated research setup(s), each using an imaginary R100 stake.');}
    }finally{setBusy(false)}
  }
  async function closeTrade(t,price,reason){
    const change=pct(t.entryPrice,price,t.direction),pnl=t.stake*change/100;
    setTrades(old=>old.map(x=>x.id===t.id&&!x.closedAt?{...x,currentPrice:price,exitPrice:price,pnl,pnlPct:change,closedAt:new Date().toISOString(),exitReason:reason,result:pnl>=0?'PROFIT':'LOSS'}:x));
  }
  useEffect(()=>{
    if(!active.length)return;
    const id=setInterval(async()=>{
      if(polling.current)return;polling.current=true;
      try{for(const t of active){
        try{
          const rows=await candles(t.symbol,'1min'),last=rows.at(-1),price=Number(last.close);
          if(Date.now()>=new Date(t.endsAt).getTime()){await closeTrade(t,price,'Time limit reached');continue;}
          const a=analyzeCandles(rows,weights),opposite=t.direction==='UP'?(a.direction==='SELL / EXIT'&&a.score<42):(a.direction==='BUY SETUP'&&a.score>58);
          const change=pct(t.entryPrice,price,t.direction);
          setTrades(old=>old.map(x=>x.id===t.id&&!x.closedAt?{...x,currentPrice:price,pnl:x.stake*change/100,pnlPct:change}:x));
          if(opposite)await closeTrade(t,price,'Pattern reversal detected');
        }catch(e){/* retain last verified quote */}
      }}finally{polling.current=false}
    },30000);
    return()=>clearInterval(id);
  },[active.map(t=>t.id+':'+t.endsAt).join('|'),weights]);
  function learn(){
    if(!duration){setMessage('Select a time slot before saving its learning review.');return;}
    const slotClosed=closed.filter(t=>t.durationMins===duration.minutes);
    const rules=[
      ['EMA trend aligned',t=>(t.entryFeatures?.trend||0)>=65],
      ['Positive momentum',t=>(t.entryFeatures?.momentum||0)>=60],
      ['Positive MACD',t=>(t.entryFeatures?.macd||0)>=60],
      ['Supportive RSI',t=>(t.entryFeatures?.rsi||0)>=55],
      ['Above-average volume',t=>(t.entryFeatures?.volume||0)>=60]
    ];
    const patterns=rules.map(([name,test])=>{const rows=slotClosed.filter(test),wins=rows.filter(t=>t.pnl>0).length;return{name,samples:rows.length,rate:rows.length?wins/rows.length*100:null}});
    const record={duration:duration.label,learnedAt:new Date().toISOString(),patterns,samples:slotClosed.length,rate:slotClosed.length?slotClosed.filter(t=>t.pnl>0).length/slotClosed.length*100:null,summary:slotClosed.length>=5?'Saved pattern review for this time slot. Adaptive indicator weights also use completed Black paper sessions. Small samples remain unreliable.':'Learning saved. At least five completed sessions in this time slot are recommended before drawing reliable conclusions.'};
    setLearningRecords(old=>({...old,[duration.label]:record}));
    setReview(record);
    setMessage('Learning saved for '+duration.label+'. You can now select another time slot or run this slot again.');
  }
  const net=closed.reduce((s,t)=>s+(Number(t.pnl)||0),0),wins=closed.filter(t=>t.pnl>0).length;
  return <section className="panel black-dashboard">
    <div className="black-head"><div><div className="eyebrow">BLACK · PATTERN RESEARCH LAB</div><h2><BrainCircuit/> Black</h2><p>Observe market behaviour, test directional hypotheses and learn from every simulated result.</p></div><span className="black-label">PAPER RESEARCH ONLY</span></div>
    <div className="black-duration"><div className="eyebrow">1 · SELECT A TRADE DURATION</div><div className="black-options">{DURATIONS.map(d=><button key={d.label} className={duration?.label===d.label?'chosen':''} onClick={()=>{setDuration(d);setReview(learningRecords[d.label]||null);setMessage('');}}>{d.label}{learningRecords[d.label]?' ✓':''}</button>)}</div><button className="black-find" disabled={!canFind} onClick={findTrades}><Search size={16}/>{busy?'Scanning…':'Find Trades'}</button>{duration&&activeForDuration.length>0&&<small className="black-muted">This time slot has an active run. Other time slots remain available.</small>}{duration&&needsLearning&&<small className="black-muted">Press “Learn & save” for {duration.label} before starting its next run.</small>}{duration&&learningRecords[duration.label]&&!needsLearning&&<small className="black-muted">Learning saved for {duration.label} · last updated {new Date(learningRecords[duration.label].learnedAt).toLocaleString()}</small>}</div>
    {message&&<div className="black-message">{message}</div>}
    <div className="black-stats"><div><span>Active</span><b>{active.length}</b></div><div><span>Completed</span><b>{closed.length}</b></div><div><span>Win rate</span><b>{closed.length?Math.round(wins/closed.length*100)+'%':'—'}</b></div><div><span>Net simulated P/L</span><b className={net>=0?'positive-text':'negative-text'}>{net>=0?'+':'−'}{rand(net)}</b></div></div>
    <div className="black-section-head"><h3>Trade monitor</h3><span>{active.length} running</span></div>
    {!trades.length?<div className="empty-state"><Activity/><strong>Black is ready</strong><p>Select a duration and Find Trades. Black will not force a trade when the evidence is weak.</p></div>:
    <div className="black-list">{trades.slice(0,20).map(t=>{const secs=Math.max(0,Math.ceil((new Date(t.endsAt).getTime()-clock)/1000)),p=t.closedAt?t.pnl:t.stake*pct(t.entryPrice,t.currentPrice||t.entryPrice,t.direction)/100;return <article className="black-trade" key={t.id}><div className="black-trade-head"><div><b>{t.symbol}</b><small>{t.name} · {t.durationMins>=60?t.durationMins/60+' hour':t.durationMins+' min'}</small></div><span className={t.direction==='UP'?'black-up':'black-down'}>{t.direction==='UP'?<TrendingUp size={13}/>:<TrendingDown size={13}/>} {t.direction}</span></div><div className="black-trade-values"><span>Entry<b>{t.entryPrice}</b></span><span>Latest / exit<b>{t.closedAt?t.exitPrice:t.currentPrice}</b></span><span>{t.closedAt?'Result':'Time left'}<b className={t.closedAt?(p>=0?'positive-text':'negative-text'):''}>{t.closedAt?(p>=0?'+':'−')+rand(p):<><Clock3 size={12}/> {Math.floor(secs/60)}:{String(secs%60).padStart(2,'0')}</>}</b></span></div><small className="black-muted">{t.closedAt?t.exitReason:t.reason}</small>{t.closedAt&&<b className={p>=0?'black-win':'black-loss'}>{t.result}</b>}</article>})}</div>}
    <div className="black-learn"><div><div className="eyebrow">2 · PATTERN IDENTIFICATION</div><h3><BrainCircuit size={18}/> Learn from completed sessions</h3><p>Compare entry conditions with results to identify recurring signals. Learning uses recorded paper sessions, not private broker data.</p></div><button onClick={learn}>Learn &amp; save</button></div>
    {review&&<div className="black-review"><b>{review.samples} completed samples</b><span>{review.rate===null?'No measured win rate yet':'Historical paper-session win rate: '+review.rate.toFixed(1)+'%'}</span><p>{review.summary}</p><div className="black-patterns">{review.patterns.map(x=><div key={x.name}><b>{x.name}</b><small>{x.samples} samples</small><strong>{x.rate===null?'Not enough data':x.rate.toFixed(0)+'% profitable'}</strong></div>)}</div></div>}
    <p className="black-disclaimer">Black uses OHLCV candle data as a proxy for market pressure. It cannot see private broker positions; volume alone cannot identify whether buyers or sellers initiated every trade. All stakes and results are simulated. No broker orders are placed.</p>
  </section>;
}
