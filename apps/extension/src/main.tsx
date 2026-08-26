import React,{useEffect,useState} from 'react';
import{createRoot}from'react-dom/client';
import'./styles.css';
import { supabase } from './supabase';

type Candidate={name:string;title:string;company:string;location:string;linkedinUrl:string};
type StoredSession={accessToken:string;refreshToken:string};
const empty:Candidate={name:'',title:'',company:'',location:'',linkedinUrl:''};

async function detect():Promise<Candidate>{
  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
  if(!tab?.id||!/^https:\/\/(?:[a-z]{2}\.)?(?:www\.)?linkedin\.com\/in\//i.test(tab.url||'')) return empty;
  const [r]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:()=>{
    const text=(s:string)=>document.querySelector(s)?.textContent?.trim()||'';
    const clean=(value:string)=>value.replace(/\s+/g,' ').trim();
    const pageName=clean(document.title.replace(/\s*\|\s*LinkedIn.*$/i,''));
    const name=clean(text('h1'))||pageName;
    const lines=(document.body?.innerText||'').split('\n').map(clean).filter(Boolean);
    const firstNameIndex=lines.findIndex((line)=>line===name);
    const ignored=/^(?:connect|follow|message|more|home|my network|jobs|messaging|notifications|me|for business)$/i;
    const headerLines=firstNameIndex>=0?lines.slice(firstNameIndex+1,firstNameIndex+12):[];
    const selectorHeadline=clean(text('.text-body-medium.break-words'));
    const headline=selectorHeadline||headerLines.find((line)=>
      line!==name&&!ignored.test(line)&&!/^·/.test(line)&&!/^\d[\d,]* followers?$/i.test(line)
    )||'';
    const secondNameIndex=lines.findIndex((line,index)=>index>firstNameIndex&&line===name);
    const mainHeader=secondNameIndex>=0?lines.slice(secondNameIndex+1,secondNameIndex+16):headerLines;
    const headlineIndex=mainHeader.findIndex((line)=>line===headline);
    const locationFallback=headlineIndex>=0?mainHeader.slice(headlineIndex+1).find((line)=>
      !ignored.test(line)&&!/^·/.test(line)&&!/^contact info$/i.test(line)&&!/^\d[\d,]* followers?$/i.test(line)
    )||'':'';
    const locationText=clean(text('.text-body-small.inline.t-black--light.break-words'))||locationFallback;
    const companyMatch=headline.match(/\s(?:at|@)\s(.+)$/i);
    const company=companyMatch?.[1]?.trim()||'';
    const title=companyMatch?headline.slice(0,companyMatch.index).trim():headline;
    return {name,title,company,location:locationText,linkedinUrl:window.location.href.split(/[?#]/)[0]};
  }});
  return (r?.result as Candidate)||empty;
}

function App(){
  const[c,setC]=useState<Candidate>(empty);const[job,setJob]=useState('');const[notes,setNotes]=useState('');const[status,setStatus]=useState('Detecting profile…');const[connected,setConnected]=useState(false);const[saving,setSaving]=useState(false);const[detecting,setDetecting]=useState(true);

  const refresh=async()=>{
    setDetecting(true);setStatus('Detecting profile…');
    try{
      const v=await detect();setC(v);
      setStatus(v.name?'Candidate detected':'No profile data yet — wait for LinkedIn to finish loading, then retry.');
    }catch(error){
      setC(empty);setStatus(error instanceof Error&&error.message.includes('Cannot access')?'LinkedIn blocked page access — refresh the tab and retry.':'Could not read this page — refresh LinkedIn and retry.');
    }finally{setDetecting(false);}
  };

  useEffect(()=>{Promise.all([detect(),chrome.storage.local.get('recruitmergeSession')]).then(([v,stored])=>{setC(v);setConnected(Boolean(stored.recruitmergeSession));setStatus(v.name?'Candidate detected':'No profile data yet — wait for LinkedIn to finish loading, then retry.')}).catch(()=>setStatus('Could not read this page — refresh LinkedIn and retry.')).finally(()=>setDetecting(false))},[]);

  const connect=()=>chrome.tabs.create({url:`https://recruitmerge.vercel.app/extension/connect?extensionId=${encodeURIComponent(chrome.runtime.id)}`});

  const save=async()=>{
    if(!c.name||saving)return;
    setSaving(true);
    const stored=await chrome.storage.local.get('recruitmergeSession');
    const savedSession=stored.recruitmergeSession as StoredSession|undefined;
    if(!savedSession){setConnected(false);setStatus('Connect your account first');setSaving(false);return;}

    const {data:sessionData,error:sessionError}=await supabase.auth.setSession({access_token:savedSession.accessToken,refresh_token:savedSession.refreshToken});
    if(sessionError||!sessionData.user||!sessionData.session){
      await chrome.storage.local.remove('recruitmergeSession');
      setConnected(false);setStatus('Session expired — reconnect');setSaving(false);return;
    }
    await chrome.storage.local.set({recruitmergeSession:{accessToken:sessionData.session.access_token,refreshToken:sessionData.session.refresh_token}});

    const linkedinUrl=c.linkedinUrl.split('?')[0].replace(/\/$/,'');
    const {error}=await supabase.from('candidates').insert({user_id:sessionData.user.id,name:c.name,title:c.title||null,company:c.company||null,location:c.location||null,linkedin_url:linkedinUrl,job:job||null,notes:notes||null});
    if(error){setStatus(error.code==='23505'?'Already saved — this profile is in your dashboard.':error.hint||error.message);setSaving(false);return;}
    setStatus('Saved to dashboard ✓');setSaving(false);
  };

  return <div className="wrap"><div className="top"><div className="extension-brand"><span className="brand-mark" aria-hidden="true"><i/><i/></span><b>RecruitMerge</b></div><span className={connected?'connection connected':'connection'}><i/>{connected?'Cloud connected':'Not connected'}</span></div>{!connected&&<div className="connect"><div className="connect-icon">⌁</div><div><strong>Connect your workspace</strong><p>Sync candidates securely to RecruitMerge.</p></div><button onClick={connect}>Connect <span>→</span></button></div>}<div className={`person ${c.name?'detected':''}`}><div className="profile-state"><span>{c.name?'Profile detected':'Candidate capture'}</span>{c.name&&<i>✓</i>}</div><div className="person-row"><div className="avatar">{c.name?c.name.split(' ').slice(0,2).map(part=>part[0]).join('').toUpperCase():'?'}</div><div><h1>{c.name||'No candidate detected'}</h1><p>{c.title||'Open a LinkedIn profile to begin'}</p>{c.company&&<p className="company">{c.company}</p>}{c.location&&<small>{c.location}</small>}</div></div></div><div className="form-area"><label>Pipeline</label><input value={job} onChange={e=>setJob(e.target.value)} placeholder="e.g. Senior Designer"/><label>Sourcing note</label><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Add context for your team…"/><button className="save-button" disabled={!c.name||!connected||saving} onClick={save}><span>{saving?'Saving…':'Save to workspace'}</span><span aria-hidden="true">→</span></button><p className="status" role="status">{status}</p><div className="popup-links">{!c.name&&<button className="text-button" disabled={detecting} onClick={refresh}>{detecting?'Checking…':'Try again'}</button>}<button className="text-button" onClick={()=>chrome.tabs.create({url:'https://recruitmerge.vercel.app/dashboard'})}>Open dashboard ↗</button></div></div></div>;
}
createRoot(document.getElementById('root')!).render(<App/>);
