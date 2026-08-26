import React,{useEffect,useState} from 'react';
import{createRoot}from'react-dom/client';
import'./styles.css';
import { supabase } from './supabase';

type Candidate={name:string;title:string;company:string;location:string;linkedinUrl:string};
type StoredSession={accessToken:string;refreshToken:string};
const empty:Candidate={name:'',title:'',company:'',location:'',linkedinUrl:''};

async function detect():Promise<Candidate>{
  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
  if(!tab?.id||!tab.url?.includes('linkedin.com/in/')) return empty;
  const [r]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:()=>{
    const text=(s:string)=>document.querySelector(s)?.textContent?.trim()||'';
    const name=text('h1');
    const title=text('.text-body-medium.break-words');
    const locationText=text('.text-body-small.inline.t-black--light.break-words');
    return {name,title,company:'',location:locationText,linkedinUrl:window.location.href.split('?')[0]};
  }});
  return (r?.result as Candidate)||empty;
}

function App(){
  const[c,setC]=useState<Candidate>(empty);const[job,setJob]=useState('');const[notes,setNotes]=useState('');const[status,setStatus]=useState('Detecting profile…');const[connected,setConnected]=useState(false);const[saving,setSaving]=useState(false);
  useEffect(()=>{Promise.all([detect(),chrome.storage.local.get('recruitmergeSession')]).then(([v,stored])=>{setC(v);setConnected(Boolean(stored.recruitmergeSession));setStatus(v.name?'Candidate detected':'Open a LinkedIn profile')}).catch(()=>setStatus('Could not read this page'))},[]);

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
    if(error){setStatus(error.code==='23505'?'Already in your dashboard':error.message);setSaving(false);return;}
    setStatus('Saved to dashboard ✓');setSaving(false);
  };

  return <div className="wrap"><div className="top"><b>RecruitMerge</b><span className={connected?'connected':''}>{connected?'Cloud connected':status}</span></div>{!connected&&<div className="connect"><p>Connect your RecruitMerge account to sync candidates securely.</p><button onClick={connect}>Connect account</button></div>}<div className="person"><h1>{c.name||'No candidate detected'}</h1><p>{c.title||'Open a candidate profile to begin'}</p>{c.location&&<p>{c.location}</p>}</div><label>JOB</label><input value={job} onChange={e=>setJob(e.target.value)} placeholder="Senior Designer"/><label>NOTES</label><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Add a sourcing note"/><button disabled={!c.name||!connected||saving} onClick={save}>{saving?'Saving…':'Save to dashboard'}</button>{connected&&<p className="status">{status}</p>}</div>;
}
createRoot(document.getElementById('root')!).render(<App/>);
