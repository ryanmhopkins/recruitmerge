import React,{useEffect,useState} from 'react';
import{createRoot}from'react-dom/client';
import'./styles.css';

type Candidate={name:string;title:string;company:string;location:string;linkedinUrl:string};
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
  const[c,setC]=useState<Candidate>(empty);const[job,setJob]=useState('');const[notes,setNotes]=useState('');const[status,setStatus]=useState('Detecting profile…');
  useEffect(()=>{detect().then(v=>{setC(v);setStatus(v.name?'Candidate detected':'Open a LinkedIn profile')}).catch(()=>setStatus('Could not read this page'))},[]);
  const save=async()=>{if(!c.name)return;const data=await chrome.storage.local.get({candidates:[]});const existing=(data.candidates as Candidate[]).some(x=>x.linkedinUrl===c.linkedinUrl);if(existing){setStatus('Already saved');return;}await chrome.storage.local.set({candidates:[...data.candidates,{...c,job,notes,createdAt:new Date().toISOString()}]});setStatus('Saved locally ✓')};
  return <div className="wrap"><div className="top"><b>RecruitMerge</b><span>{status}</span></div><div className="person"><h1>{c.name||'No candidate detected'}</h1><p>{c.title||'Open a candidate profile to begin'}</p>{c.location&&<p>{c.location}</p>}</div><label>JOB</label><input value={job} onChange={e=>setJob(e.target.value)} placeholder="Senior Designer"/><label>NOTES</label><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Add a sourcing note"/><button disabled={!c.name} onClick={save}>Save candidate</button></div>;
}
createRoot(document.getElementById('root')!).render(<App/>);
