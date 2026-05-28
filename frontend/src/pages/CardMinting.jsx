import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApplicants } from "../context/ApplicantContext";
import { mintingAPI, auditAPI, dagAPI, marketAPI } from "../services/api";
import { useMarket } from "../hooks/useMarket";
import { usePasscode } from "../hooks/usePasscode";
import PasscodeModal from "../components/shared/PasscodeModal";
import { formatINR } from "../utils/finance";
import toast from "react-hot-toast";

/* ─── helpers ──────────────────────────────────────────────── */
const scoreClass = (s) =>
  s >= 740 ? "score-pill score-excellent"
  : s >= 670 ? "score-pill score-good"
  : s >= 580 ? "score-pill score-fair"
  : "score-pill score-poor";

const statusBadge = {
  "Ready to Mint": "badge badge-ready",
  "Review Required": "badge badge-review",
  "Hold": "badge badge-hold",
  "Underwriting": "badge badge-underwriting",
  "Minted": "badge badge-minted",
};

const skinGrad = {
  purple:  "linear-gradient(135deg,#4f46e5 0%,#7c3aed 40%,#ec4899 100%)",
  obsidian:"linear-gradient(135deg,#1f2937 0%,#111827 50%,#030712 100%)",
  emerald: "linear-gradient(135deg,#064e3b 0%,#059669 55%,#10b981 100%)",
};

const DEFAULT_NODES = [
  {id:"n1",label:"In-Principle",icon:"📋",x:18, y:95, active:true},
  {id:"n2",label:"CIBIL Check", icon:"🛡️",x:130,y:44, active:true},
  {id:"n3",label:"KYC Biometric",icon:"👁️",x:130,y:148,active:true},
  {id:"n4",label:"Appraisal",   icon:"🏠",x:248,y:95, active:true},
  {id:"n5",label:"Legal Gate",  icon:"⚖️",x:358,y:95, active:false},
  {id:"n6",label:"Underwriting",icon:"✅",x:465,y:95, active:false},
  {id:"n7",label:"Disburse",    icon:"💳",x:560,y:95, active:false},
];
const DEFAULT_EDGES = [
  {from:"n1",to:"n2"},{from:"n1",to:"n3"},
  {from:"n2",to:"n4"},{from:"n3",to:"n4"},
  {from:"n4",to:"n5"},{from:"n5",to:"n6"},{from:"n6",to:"n7"},
];

/* ═══════════════════════════════════════════════════════════ */
const CardMintingPage = () => {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const { applicants, fetchApplicants } = useApplicants();
  const { state: rs } = useLocation();
  const passcode  = usePasscode();
  const { data: mkt } = useMarket(4500);

  /* ── role ──────────────────────────────────────────────── */
  const [role, setRole] = useState("officer");

  /* ── card console ──────────────────────────────────────── */
  const [selId,      setSelId]     = useState("");
  const [limit,      setLimit]     = useState(500000);
  const [network,    setNetwork]   = useState("Visa Premium");
  const [skin,       setSkin]      = useState("purple");
  const [flipped,    setFlipped]   = useState(false);
  const [tilt,       setTilt]      = useState({x:0,y:0});
  const [mintSt,     setMintSt]    = useState("idle");

  /* ── officer pool ──────────────────────────────────────── */
  const [pool,       setPool]      = useState([]);
  const [filter,     setFilter]    = useState("all");
  const [search,     setSearch]    = useState("");
  const [showModal,  setShowModal] = useState(false);
  const [newApp,     setNewApp]    = useState({name:"",email:"",score:750,income:1200000,limit:500000,area:"Residential"});

  /* ── manager ───────────────────────────────────────────── */
  const [analytics,  setAnalytics] = useState(null);
  const [competitors,setCompetitors]=useState([]);

  /* ── admin ─────────────────────────────────────────────── */
  const [nodes,      setNodes]     = useState(DEFAULT_NODES.map(n=>({...n})));
  const [edges,      setEdges]     = useState(DEFAULT_EDGES.map(e=>({...e})));
  const [selNode,    setSelNode]   = useState(null);
  const [dragId,     setDragId]    = useState(null);
  const [dragOff,    setDragOff]   = useState({x:0,y:0});
  const [logs,       setLogs]      = useState([
    {t:"16:26:04",r:"admin",  m:"System initialized. Credit policies loaded."},
    {t:"16:25:58",r:"underwriter",m:"Switched dashboard role to underwriter."},
    {t:"16:25:37",r:"officer",m:"LAP transition: Sourav Negi (LAP-082) advanced. Card synced."},
  ]);
  const [settings,   setSettings]  = useState({autoUnderwrite:true,bioKYC:false,limitOverride:false,maxLimit:1000000});
  const dagRef = useRef(null);

  /* ── init ──────────────────────────────────────────────── */
  useEffect(() => {
    if (!applicants.length) fetchApplicants();
    loadPool(); loadAnalytics(); loadCompetitors(); loadDag();
  }, []);
  useEffect(() => { if (rs?.lapApplicantId) setSelId(rs.lapApplicantId); }, [rs]);
  useEffect(() => { if (applicants.length && !selId) setSelId(applicants[0]?._id || ""); }, [applicants]);

  /* ── loaders ───────────────────────────────────────────── */
  const loadPool = async () => {
    try { const r = await mintingAPI.getPool(); setPool(r.data||[]); } catch{}
  };
  const loadAnalytics = async () => {
    try { const r = await mintingAPI.getAnalytics(); setAnalytics(r.data); }
    catch { setAnalytics({totalMinted:14,totalPending:4,avgScore:724,totalLimitGranted:3900000,approvalRate:84.6}); }
  };
  const loadCompetitors = async () => {
    try { const r = await marketAPI.getCreditAnalysis(); setCompetitors(r.data); }
    catch { setCompetitors([
      {company:"HDFC Bank",  marketShare:28.4,growth:"+12.3%",avgTicket:485000,npaNpa:1.2,rating:"AAA"},
      {company:"ICICI Bank", marketShare:22.1,growth:"+9.8%", avgTicket:420000,npaNpa:1.5,rating:"AAA"},
      {company:"SBI",        marketShare:35.2,growth:"+7.2%", avgTicket:310000,npaNpa:2.1,rating:"AA+"},
      {company:"Axis Bank",  marketShare:8.9, growth:"+15.1%",avgTicket:560000,npaNpa:1.8,rating:"AA+"},
      {company:"Bajaj Fin",  marketShare:5.4, growth:"+22.4%",avgTicket:250000,npaNpa:1.1,rating:"AAA"},
    ]); }
  };
  const loadDag = async () => {
    try { const r = await dagAPI.getWorkflow(); if(r.data?.nodes?.length){setNodes(r.data.nodes);setEdges(r.data.edges);} } catch{}
  };

  /* ── derived ───────────────────────────────────────────── */
  const flatPool = pool.length
    ? pool
    : applicants.map(a=>({
        _id:a._id, name:a.name, email:a.email, score:a.cibil,
        income:a.monthlyIncome*12, area:a.propertyArea, lapAppNo:a.lapAppNo,
        limit:a.cardLimit||Math.max(50000,Math.round((a.loanAmount||0)*0.1)),
        status:a.cardIssued?"Minted":a.cibil>=750?"Ready to Mint":a.cibil>=650?"Review Required":"Hold",
      }));

  const filtered = flatPool.filter(a=>{
    const ms = filter==="all"||a.status===filter;
    const mq = a.name?.toLowerCase().includes(search.toLowerCase())||a.email?.toLowerCase().includes(search.toLowerCase());
    return ms&&mq;
  });

  const selApp = flatPool.find(a=>a._id===selId) || applicants.find(a=>a._id===selId) || {name:"SOURAV NEGI",cibil:760,ltv:65.3,lapAppNo:"LAP-082"};
  const last4  = (selApp?.lapAppNo||"LAP-082").replace(/[^0-9]/g,"").slice(-4)||"0082";

  /* ── role switch ───────────────────────────────────────── */
  const handleRole = async (r) => {
    if (r===role) return;
    const ok = await passcode.ask(`Switch to ${r}`,`Enter supervisor passcode to access the ${r} dashboard.`,r==="admin"?"⚙️":r==="underwriter"?"🛡️":"👤");
    if (!ok) return;
    setRole(r); addLog(r,`Switched role to ${r}.`);
    if (r==="underwriter"){loadAnalytics();loadCompetitors();}
  };

  /* ── log helper ────────────────────────────────────────── */
  const addLog = (r,m) => setLogs(p=>[{t:new Date().toLocaleTimeString(),r,m},...p.slice(0,49)]);

  /* ── decisions ─────────────────────────────────────────── */
  const handleDecision = async (id,dec) => {
    try {
      await mintingAPI.managerDecision({applicantId:id,decision:dec});
      setPool(p=>p.map(a=>a._id===id?{...a,status:dec==="approve"?"Ready to Mint":"Hold"}:a));
      addLog("underwriter",`${dec==="approve"?"Approved":"Rejected"}: ${flatPool.find(a=>a._id===id)?.name}`);
      toast.success(dec==="approve"?"Approved for minting":"Placed on hold");
    } catch { toast.error("Decision failed"); }
  };

  /* ── mint ──────────────────────────────────────────────── */
  const handleMint = async () => {
    if (!selId){toast.error("Select an applicant");return;}
    setMintSt("loading");
    try {
      await mintingAPI.mintCard({applicantId:selId,cardLimit:limit,cardNetwork:network,cardSkin:skin});
      setMintSt("success");
      addLog(role,`Card minted: ${selApp?.name} — ${formatINR(limit)}`);
      setPool(p=>p.map(a=>a._id===selId?{...a,status:"Minted"}:a));
      setTimeout(()=>setMintSt("idle"),3200);
    } catch(e){toast.error(e.message||"Minting failed");setMintSt("idle");}
  };

  /* ── add applicant ─────────────────────────────────────── */
  const handleAdd = () => {
    if(!newApp.name||!newApp.email){toast.error("Name & email required");return;}
    const status=newApp.score>=720&&newApp.income>=800000?"Ready to Mint":newApp.score<600?"Hold":newApp.limit>1500000?"Underwriting":"Review Required";
    setPool(p=>[{_id:`loc-${Date.now()}`,...newApp,status,lapAppNo:`LAP-${Math.floor(Math.random()*900+100)}`},...p]);
    addLog("officer",`Added: ${newApp.name} — ${status}`);
    toast.success(`${newApp.name} added`);
    setShowModal(false);
    setNewApp({name:"",email:"",score:750,income:1200000,limit:500000,area:"Residential"});
  };

  /* ── DAG ───────────────────────────────────────────────── */
  const dagMouseDown = (e,id) => {
    e.stopPropagation();
    const r=e.currentTarget.getBoundingClientRect();
    setDragId(id); setDragOff({x:e.clientX-r.left,y:e.clientY-r.top});
  };
  const dagMouseMove = useCallback((e)=>{
    if(!dragId||!dagRef.current)return;
    const cr=dagRef.current.getBoundingClientRect();
    const nx=Math.max(0,Math.min(cr.width-108,e.clientX-cr.left-dragOff.x));
    const ny=Math.max(0,Math.min(cr.height-54, e.clientY-cr.top-dragOff.y));
    setNodes(p=>p.map(n=>n.id===dragId?{...n,x:nx,y:ny}:n));
  },[dragId,dragOff]);
  const dagMouseUp = () => setDragId(null);
  const dagClick = (id) => {
    if(selNode&&selNode!==id){
      if(!edges.find(e=>e.from===selNode&&e.to===id)){
        setEdges(p=>[...p,{from:selNode,to:id}]);
        addLog("admin",`DAG: Connected ${nodes.find(n=>n.id===selNode)?.label} → ${nodes.find(n=>n.id===id)?.label}`);
      }
      setSelNode(null);
    } else { setSelNode(id); }
  };
  const dagRightClick = (e,id) => {
    e.preventDefault();
    setNodes(p=>p.filter(n=>n.id!==id));
    setEdges(p=>p.filter(e=>e.from!==id&&e.to!==id));
    setSelNode(null);
  };
  const addNode = (label,icon) => {
    const id=`n${Date.now()%10000}`;
    setNodes(p=>[...p,{id,label,icon,x:60+Math.random()*380,y:40+Math.random()*190,active:false}]);
    addLog("admin",`DAG: Added "${label}"`);
  };
  const resetDag = async () => {
    setNodes(DEFAULT_NODES.map(n=>({...n}))); setEdges(DEFAULT_EDGES.map(e=>({...e}))); setSelNode(null);
    try{await dagAPI.resetWorkflow();}catch{}
    addLog("admin","DAG workflow reset to default."); toast.success("Workflow reset");
  };
  const saveDag = async () => {
    try{await dagAPI.saveWorkflow({nodes,edges});toast.success("Workflow saved");}catch{toast.error("Save failed (local state preserved)");}
    addLog("admin",`DAG saved: ${nodes.length} nodes, ${edges.length} edges`);
  };

  /* ── card tilt ─────────────────────────────────────────── */
  const onTilt = (e) => {
    const r=e.currentTarget.getBoundingClientRect();
    setTilt({x:((e.clientX-r.left)/r.width-0.5)*28,y:((e.clientY-r.top)/r.height-0.5)*-28});
  };

  /* ── market fallback data ──────────────────────────────── */
  const cardRates = mkt?.cardRates||[
    {name:"HDFC Bank",rate:"3.49",change:"+0.10",trend:"up"},{name:"ICICI Bank",rate:"3.35",change:"-0.05",trend:"down"},
    {name:"SBI Cards",rate:"3.50",change:"+0.00",trend:"stable"},{name:"Axis Bank",rate:"3.40",change:"+0.15",trend:"up"},
    {name:"Kotak",rate:"3.25",change:"-0.10",trend:"down"},
  ];
  const lapRates = mkt?.lapRates||[
    {name:"HDFC",rate:"9.50",change:"-0.05",trend:"down"},{name:"ICICI",rate:"9.75",change:"+0.10",trend:"up"},
    {name:"SBI",rate:"9.25",change:"+0.00",trend:"stable"},{name:"PNB Housing",rate:"10.00",change:"+0.25",trend:"up"},
    {name:"LIC HFL",rate:"9.30",change:"-0.15",trend:"down"},
  ];
  const repoRates = mkt?.repoRates||[
    {name:"RBI",repo:"6.50",plr:"—",trend:"stable"},{name:"HDFC",repo:"6.50",plr:"17.15",trend:"up"},
    {name:"ICICI",repo:"6.50",plr:"17.50",trend:"up"},{name:"SBI",repo:"6.50",plr:"15.00",trend:"stable"},
    {name:"Axis",repo:"6.50",plr:"18.75",trend:"down"},{name:"Kotak",repo:"6.50",plr:"17.00",trend:"stable"},
  ];
  const usdInr   = mkt?.usdInr || {value:"83.42",change:"+0.08",trend:"up",history:[83.1,83.2,83.18,83.42,83.35,83.5,83.42]};

  /* ════════════════════ RENDER ═══════════════════════════ */
  return (
    <div style={{background:"#070a13",color:"#fff",minHeight:"100vh",padding:16,fontFamily:"var(--font-family,system-ui)",fontSize:13}}
         onMouseMove={dagMouseMove} onMouseUp={dagMouseUp}>

      <PasscodeModal isOpen={passcode.isOpen} config={passcode.config} error={passcode.error} onConfirm={passcode.confirm} onCancel={passcode.cancel}/>

      {/* ── ADD MODAL ──────────────────────────────────────── */}
      {showModal && (
        <div className="modal-backdrop active">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Submit Stage 1 Application</h3>
              <button className="close-btn" onClick={()=>setShowModal(false)}>×</button>
            </div>
            <div className="modal-form">
              {[["Full Name","text","name"],["Email","email","email"]].map(([l,t,k])=>(
                <div className="form-group" key={k}><label>{l}</label>
                  <input type={t} className="form-input-ctrl" value={newApp[k]} onChange={e=>setNewApp(p=>({...p,[k]:e.target.value}))}/>
                </div>
              ))}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div className="form-group"><label>CIBIL Score</label><input type="number" className="form-input-ctrl" value={newApp.score} onChange={e=>setNewApp(p=>({...p,score:+e.target.value}))}/></div>
                <div className="form-group"><label>Annual Income (₹)</label><input type="number" className="form-input-ctrl" value={newApp.income} onChange={e=>setNewApp(p=>({...p,income:+e.target.value}))}/></div>
                <div className="form-group"><label>Requested Limit (₹)</label><input type="number" className="form-input-ctrl" value={newApp.limit} onChange={e=>setNewApp(p=>({...p,limit:+e.target.value}))}/></div>
                <div className="form-group"><label>Property Area</label>
                  <select className="form-select" value={newApp.area} onChange={e=>setNewApp(p=>({...p,area:e.target.value}))}>
                    <option>Residential</option><option>Commercial</option><option>Industrial</option>
                  </select>
                </div>
              </div>
              <button className="btn-primary" style={{justifyContent:"center",width:"100%"}} onClick={handleAdd}>✔ Submit to Pool</button>
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ─────────────────────────────────────────── */}
      <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,background:"rgba(13,19,39,0.8)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"11px 20px",backdropFilter:"blur(14px)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:40,height:40,background:"linear-gradient(135deg,#ec4899,#8b5cf6)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:20,boxShadow:"0 0 18px rgba(99,102,241,0.4)"}}>J</div>
          <div>
            <div style={{fontSize:17,fontWeight:700,background:"linear-gradient(135deg,#fff,#a5b4fc)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Jetro Credit Hub</div>
            <div style={{fontSize:10,color:"#64748b"}}>Commercial Underwriting &amp; Card Generation Panel</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>navigate("/lap")} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:"#94a3b8",padding:"7px 14px",borderRadius:8,fontSize:11,cursor:"pointer",fontWeight:600}}>← Return to LAP Portal</button>
          <div style={{display:"flex",background:"rgba(255,255,255,0.04)",padding:4,borderRadius:10,border:"1px solid rgba(255,255,255,0.06)"}}>
            {[["officer","👤 Loan Officer"],["underwriter","🛡️ Manager / Underwriter"],["admin","⚙️ System Admin"]].map(([r,label])=>(
              <button key={r} onClick={()=>handleRole(r)} style={{padding:"7px 12px",borderRadius:7,border:"none",fontSize:11,cursor:"pointer",fontWeight:600,fontFamily:"inherit",
                background:role===r?(r==="officer"?"linear-gradient(135deg,#6366f1,#8b5cf6)":r==="underwriter"?"linear-gradient(135deg,#10b981,#059669)":"linear-gradient(135deg,#8b5cf6,#ec4899)"):"transparent",
                color:role===r?"#fff":"#94a3b8"}}>{label}</button>
            ))}
          </div>
        </div>
      </header>

      {/* ── LAP BANNER ────────────────────────────────────── */}
      <div style={{background:"rgba(6,182,212,0.05)",border:"1px solid rgba(6,182,212,0.18)",padding:"9px 14px",borderRadius:10,display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,fontSize:11}}>
        <div><span style={{color:"#06b6d4",fontWeight:700}}>🔗 Live LAP Data Feed Active:</span><span style={{color:"#94a3b8",marginLeft:6}}>Cardholder, approved limits &amp; property metrics auto-populated from LAP Portal.</span></div>
        <div style={{display:"flex",alignItems:"center",gap:8,whiteSpace:"nowrap"}}>
          <span style={{fontWeight:700}}>— {selApp?.name} ({selApp?.lapAppNo||"LAP-082"})</span>
          <span style={{background:"rgba(6,182,212,0.18)",color:"#06b6d4",padding:"2px 8px",borderRadius:20,fontSize:9,fontWeight:700,border:"1px solid rgba(6,182,212,0.3)"}}>CIBIL {selApp?.cibil||0} · LTV {selApp?.ltv||0}%</span>
        </div>
      </div>

      {/* ── STAT CARDS ────────────────────────────────────── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
        {[
          {lbl:"STAGE 1 APPLICANTS",     val:flatPool.filter(a=>a.status!=="Minted").length||4,       delta:"▲ 12% vs last week",up:true},
          {lbl:"CARDS MINTED TODAY",     val:analytics?.totalMinted||14,                               delta:"▲ 8% today",up:true},
          {lbl:"TOTAL LIMIT GRANTED",    val:formatINR(analytics?.totalLimitGranted||3900000),         delta:"▲ ₹45,000 this session",up:true},
          {lbl:role==="admin"?"SYSTEM LOAD":role==="underwriter"?"APPROVAL RATE":"AUTO-APPROVE RATE",
           val:role==="admin"?"0.08ms":`${analytics?.approvalRate||72}%`,
           delta:role==="admin"?"Active Nodes Healthy":"Optimal system load",up:true},
        ].map((s,i)=>(
          <div key={i} style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:14}}>
            <div style={{fontSize:9,fontWeight:600,color:"#64748b",letterSpacing:"0.5px",textTransform:"uppercase",marginBottom:4}}>{s.lbl}</div>
            <div style={{fontSize:20,fontWeight:700}}>{s.val}</div>
            <div style={{fontSize:9,color:s.up?"#10b981":"#f43f5e",marginTop:3}}>{s.delta}</div>
          </div>
        ))}
      </div>

      {/* ── MAIN GRID ─────────────────────────────────────── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:18}}>

        {/* ══════════ LEFT ══════════════════════════════════ */}
        <div>

          {/* ── LOAN OFFICER ─────────────────────────────── */}
          {role==="officer" && (
            <div style={{background:"rgba(13,19,39,0.8)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:20,backdropFilter:"blur(14px)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8,marginBottom:14}}>
                <h2 style={{fontSize:15,fontWeight:700,margin:0}}>Stage 1 Applicants Pool</h2>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {["all","Ready to Mint","Review Required","Underwriting","Hold"].map(s=>(
                    <button key={s} onClick={()=>setFilter(s)} style={{padding:"4px 8px",borderRadius:6,border:"1px solid rgba(255,255,255,0.08)",fontSize:9,fontWeight:600,cursor:"pointer",background:filter===s?"#6366f1":"rgba(255,255,255,0.03)",color:filter===s?"#fff":"#94a3b8"}}>{s==="all"?"All":s}</button>
                  ))}
                </div>
                <button className="btn-primary" style={{fontSize:11}} onClick={()=>setShowModal(true)}>➕ Add Applicant</button>
              </div>
              <div style={{position:"relative",marginBottom:12}}>
                <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:"#64748b",pointerEvents:"none"}}>🔍</span>
                <input placeholder="Search by name or email…" value={search} onChange={e=>setSearch(e.target.value)}
                  style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,padding:"7px 12px 7px 34px",color:"#fff",fontSize:11,outline:"none"}}/>
              </div>
              {/* area mini-cards */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:9,marginBottom:14}}>
                {[{l:"Residential",v:"₹1.2Cr",s:"42 apps · Avg LTV 62%"},{l:"Commercial",v:"₹3.8Cr",s:"18 apps · Avg LTV 55%"},{l:"Industrial",v:"₹6.4Cr",s:"11 apps · Avg LTV 48%"}].map(c=>(
                  <div key={c.l} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,padding:"10px 12px"}}>
                    <div style={{fontSize:9,fontWeight:600,color:"#64748b",textTransform:"uppercase"}}>{c.l}</div>
                    <div style={{fontSize:18,fontWeight:800,margin:"3px 0"}}>{c.v}</div>
                    <div style={{fontSize:9,color:"#64748b"}}>{c.s}</div>
                  </div>
                ))}
              </div>
              {/* table */}
              <div style={{overflowX:"auto",borderRadius:10,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(0,0,0,0.15)"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,textAlign:"left"}}>
                  <thead>
                    <tr>{["Applicant","Status","CIBIL Score","Income p.a.","Req. Limit","Area","Action"].map(h=>(
                      <th key={h} style={{background:"rgba(255,255,255,0.02)",color:"#64748b",fontWeight:600,padding:"9px 11px",borderBottom:"1px solid rgba(255,255,255,0.07)",textTransform:"uppercase",fontSize:9,letterSpacing:"0.4px"}}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {filtered.length===0
                      ? <tr><td colSpan={7} style={{textAlign:"center",color:"#64748b",padding:22,fontSize:12}}>No applicants match criteria.</td></tr>
                      : filtered.map(app=>(
                        <tr key={app._id} style={{cursor:"pointer"}} onClick={()=>{setSelId(app._id);if(app.limit)setLimit(app.limit);}}>
                          <td style={{padding:"9px 11px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                            <div style={{fontWeight:600,color:"#fff"}}>{app.name}</div>
                            <div style={{fontSize:9,color:"#64748b",marginTop:1}}>{app.email}</div>
                          </td>
                          <td style={{padding:"9px 11px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}><span className={statusBadge[app.status]||"badge"}>{app.status}</span></td>
                          <td style={{padding:"9px 11px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}><span className={scoreClass(app.score||0)}>{app.score||"—"}</span></td>
                          <td style={{padding:"9px 11px",borderBottom:"1px solid rgba(255,255,255,0.05)",color:"#fff"}}>₹{(app.income||0).toLocaleString("en-IN")}</td>
                          <td style={{padding:"9px 11px",borderBottom:"1px solid rgba(255,255,255,0.05)",fontWeight:600}}>₹{(app.limit||0).toLocaleString("en-IN")}</td>
                          <td style={{padding:"9px 11px",borderBottom:"1px solid rgba(255,255,255,0.05)",color:"#94a3b8"}}>{app.area||"—"}</td>
                          <td style={{padding:"9px 11px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                            {app.status==="Minted"
                              ? <span style={{fontSize:10,color:"#06b6d4",fontWeight:600}}>✔ Issued</span>
                              : <button onClick={e=>{e.stopPropagation();setSelId(app._id);if(app.limit)setLimit(app.limit);}} style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)",border:"none",borderRadius:6,padding:"4px 9px",color:"#fff",fontSize:10,fontWeight:600,cursor:"pointer"}}>⚡ Issue Card</button>
                            }
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── MANAGER / UNDERWRITER ───────────────────── */}
          {role==="underwriter" && (
            <div style={{background:"rgba(13,19,39,0.8)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:20,backdropFilter:"blur(14px)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <h2 style={{fontSize:15,fontWeight:700,margin:0}}>Manager Analytics &amp; Approvals</h2>
                <span style={{background:"rgba(139,92,246,0.1)",color:"#8b5cf6",border:"1px solid rgba(139,92,246,0.2)",padding:"3px 9px",borderRadius:6,fontSize:10,fontWeight:600}}>Requires Sign-off (&gt;₹10L)</span>
              </div>
              {/* analytics row */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
                {[
                  {l:"Avg. Approval Score",v:analytics?.avgScore||685,c:"#f59e0b"},
                  {l:"Conversion Rate",    v:`${analytics?.approvalRate||84.6}%`,c:"#10b981"},
                  {l:"Portfolio NPA Risk", v:"2.3%",c:"#f43f5e"},
                  {l:"High-Limit Queue",   v:flatPool.filter(a=>a.limit>1000000&&a.status!=="Minted").length||3,c:"#06b6d4"},
                ].map((c,i)=>(
                  <div key={i} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,padding:"11px 13px"}}>
                    <div style={{fontSize:9,fontWeight:600,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.4px",marginBottom:4}}>{c.l}</div>
                    <div style={{fontSize:20,fontWeight:800,color:c.c}}>{c.v}</div>
                  </div>
                ))}
              </div>

              {/* approval queue table */}
              <h3 style={{fontSize:12,fontWeight:700,marginBottom:8}}>High-Limit Approval Queue</h3>
              <div style={{overflowX:"auto",borderRadius:10,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(0,0,0,0.15)",marginBottom:16}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,textAlign:"left"}}>
                  <thead>
                    <tr>{["Applicant","Req. Limit","CIBIL","KYC Status","Decision"].map(h=>(
                      <th key={h} style={{background:"rgba(255,255,255,0.02)",color:"#64748b",fontWeight:600,padding:"8px 11px",borderBottom:"1px solid rgba(255,255,255,0.07)",textTransform:"uppercase",fontSize:9}}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {flatPool.filter(a=>a.status==="Review Required"||a.status==="Underwriting"||a.limit>1000000).length===0
                      ? <tr><td colSpan={5} style={{textAlign:"center",color:"#64748b",padding:18}}>Queue is clear!</td></tr>
                      : flatPool.filter(a=>a.status==="Review Required"||a.status==="Underwriting"||a.limit>1000000).map(app=>(
                        <tr key={app._id}>
                          <td style={{padding:"8px 11px",borderBottom:"1px solid rgba(255,255,255,0.05)",fontWeight:600,color:"#fff"}}>{app.name}</td>
                          <td style={{padding:"8px 11px",borderBottom:"1px solid rgba(255,255,255,0.05)",fontWeight:600,color:"#f43f5e"}}>₹{(app.limit||0).toLocaleString("en-IN")}</td>
                          <td style={{padding:"8px 11px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}><span className={scoreClass(app.score||0)}>{app.score||"—"}</span></td>
                          <td style={{padding:"8px 11px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}><span style={{background:"rgba(255,255,255,0.04)",color:"#fff",border:"1px solid rgba(255,255,255,0.09)",padding:"2px 7px",borderRadius:5,fontSize:9}}>KYC L2 Passed</span></td>
                          <td style={{padding:"8px 11px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                            <div style={{display:"flex",gap:5}}>
                              <button onClick={()=>handleDecision(app._id,"approve")} style={{background:"rgba(16,185,129,0.15)",color:"#10b981",border:"1px solid rgba(16,185,129,0.3)",borderRadius:5,padding:"4px 9px",fontSize:10,fontWeight:600,cursor:"pointer"}}>Approve</button>
                              <button onClick={()=>handleDecision(app._id,"reject")}  style={{background:"rgba(244,63,94,0.15)", color:"#f43f5e",border:"1px solid rgba(244,63,94,0.3)", borderRadius:5,padding:"4px 9px",fontSize:10,fontWeight:600,cursor:"pointer"}}>Reject</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>

              {/* live market data */}
              <h3 style={{fontSize:12,fontWeight:700,marginBottom:10}}>🏦 Credit Facility Market Analysis (Live)</h3>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
                {/* card rates */}
                <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,padding:12}}>
                  <div style={{fontSize:11,fontWeight:700,marginBottom:8,borderBottom:"1px solid rgba(255,255,255,0.05)",paddingBottom:5}}>Top Credit Cos. — Card Rate (%)</div>
                  {cardRates.map(r=>(
                    <div key={r.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,0.03)",fontSize:10}}>
                      <span style={{color:"#94a3b8"}}>{r.name}</span>
                      <span style={{display:"flex",alignItems:"center",gap:6}}>
                        <span style={{fontFamily:"monospace",fontWeight:700}} className={`live-value ${r.trend==="up"?"flash-up":r.trend==="down"?"flash-down":""}`}>{r.rate}%</span>
                        <span style={{fontSize:9,padding:"1px 5px",borderRadius:4,fontWeight:700,background:r.change?.startsWith("+")?"rgba(16,185,129,0.15)":"rgba(244,63,94,0.15)",color:r.change?.startsWith("+")?"#10b981":"#f43f5e"}}>{r.change}%</span>
                      </span>
                    </div>
                  ))}
                </div>
                {/* LAP rates */}
                <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,padding:12}}>
                  <div style={{fontSize:11,fontWeight:700,marginBottom:8,borderBottom:"1px solid rgba(255,255,255,0.05)",paddingBottom:5}}>LAP Interest Rates (% p.a.)</div>
                  {lapRates.map(r=>(
                    <div key={r.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,0.03)",fontSize:10}}>
                      <span style={{color:"#94a3b8"}}>{r.name}</span>
                      <span style={{display:"flex",alignItems:"center",gap:6}}>
                        <span style={{fontFamily:"monospace",fontWeight:700}} className={`live-value ${r.trend==="up"?"flash-up":r.trend==="down"?"flash-down":""}`}>{r.rate}%</span>
                        <span style={{fontSize:9,padding:"1px 5px",borderRadius:4,fontWeight:700,background:r.change?.startsWith("+")?"rgba(16,185,129,0.15)":"rgba(244,63,94,0.15)",color:r.change?.startsWith("+")?"#10b981":"#f43f5e"}}>{r.change}%</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {/* USD/INR + Repo */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
                <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,padding:12}}>
                  <div style={{fontSize:11,fontWeight:700,marginBottom:8}}>📈 ₹ / USD Exchange</div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                    <span style={{fontSize:10,color:"#94a3b8"}}>USD / INR</span>
                    <span style={{fontSize:22,fontWeight:800,fontFamily:"monospace"}} className="live-value">{usdInr.value}</span>
                    <span style={{fontSize:10,padding:"2px 6px",borderRadius:4,fontWeight:700,background:usdInr.trend==="up"?"rgba(16,185,129,0.15)":"rgba(244,63,94,0.15)",color:usdInr.trend==="up"?"#10b981":"#f43f5e"}}>{usdInr.change}</span>
                  </div>
                  <div style={{height:38,display:"flex",alignItems:"flex-end",gap:2}}>
                    {(usdInr.history||[]).map((v,i,arr)=>{const mn=Math.min(...arr),mx=Math.max(...arr),rng=mx-mn||0.1;return(
                      <div key={i} style={{flex:1,minWidth:5,borderRadius:"2px 2px 0 0",height:`${20+((v-mn)/rng)*60}%`,background:i===arr.length-1?"#10b981":"rgba(255,255,255,0.12)"}}/>
                    );})}
                  </div>
                </div>
                <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,padding:12}}>
                  <div style={{fontSize:11,fontWeight:700,marginBottom:8}}>RBI Repo Rates by Bank</div>
                  <div style={{overflowY:"auto",maxHeight:120}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
                      <thead><tr>{["Bank","Repo","PLR",""].map(h=><th key={h} style={{color:"#64748b",fontWeight:600,padding:"3px 6px",borderBottom:"1px solid rgba(255,255,255,0.07)",fontSize:8,textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
                      <tbody>
                        {repoRates.map(r=>(
                          <tr key={r.name}>
                            <td style={{padding:"4px 6px",borderBottom:"1px solid rgba(255,255,255,0.04)",fontWeight:600,color:"#fff"}}>{r.name}</td>
                            <td style={{padding:"4px 6px",borderBottom:"1px solid rgba(255,255,255,0.04)",fontFamily:"monospace"}}>{r.repo}%</td>
                            <td style={{padding:"4px 6px",borderBottom:"1px solid rgba(255,255,255,0.04)",fontFamily:"monospace"}}>{r.plr||"—"}</td>
                            <td style={{padding:"4px 6px",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                              <span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:r.trend==="up"?"#10b981":r.trend==="down"?"#f43f5e":"#f59e0b",animation:"ratePulse 1.5s ease-in-out infinite"}}/>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              {/* competitor analysis table */}
              <h3 style={{fontSize:12,fontWeight:700,marginBottom:8}}>📊 Competitor Credit Facility Analysis</h3>
              <div style={{overflowX:"auto",borderRadius:10,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(0,0,0,0.15)"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,textAlign:"left"}}>
                  <thead><tr>{["Company","Mkt Share","Growth","Avg Ticket","NPA%","Rating"].map(h=>(
                    <th key={h} style={{background:"rgba(255,255,255,0.02)",color:"#64748b",fontWeight:600,padding:"8px 11px",borderBottom:"1px solid rgba(255,255,255,0.07)",textTransform:"uppercase",fontSize:9}}>{h}</th>
                  ))}</tr></thead>
                  <tbody>
                    {competitors.map(c=>(
                      <tr key={c.company}>
                        <td style={{padding:"8px 11px",borderBottom:"1px solid rgba(255,255,255,0.05)",fontWeight:600,color:"#fff"}}>{c.company}</td>
                        <td style={{padding:"8px 11px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>{c.marketShare}%</td>
                        <td style={{padding:"8px 11px",borderBottom:"1px solid rgba(255,255,255,0.05)",fontWeight:700,color:c.growth.startsWith("+")?"#10b981":"#f43f5e"}}>{c.growth}</td>
                        <td style={{padding:"8px 11px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>₹{c.avgTicket.toLocaleString("en-IN")}</td>
                        <td style={{padding:"8px 11px",borderBottom:"1px solid rgba(255,255,255,0.05)",fontWeight:600,color:c.npaNpa>2?"#f43f5e":"#10b981"}}>{c.npaNpa}%</td>
                        <td style={{padding:"8px 11px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}><span style={{background:"rgba(16,185,129,0.1)",color:"#10b981",border:"1px solid rgba(16,185,129,0.2)",padding:"2px 7px",borderRadius:5,fontSize:9,fontWeight:700}}>{c.rating}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── SYSTEM ADMIN ─────────────────────────────── */}
          {role==="admin" && (
            <div style={{background:"rgba(13,19,39,0.8)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:20,backdropFilter:"blur(14px)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <h2 style={{fontSize:15,fontWeight:700,margin:0}}>System Administration — Low Code Platform</h2>
                <span style={{background:"rgba(236,72,153,0.1)",color:"#ec4899",border:"1px solid rgba(236,72,153,0.2)",padding:"3px 9px",borderRadius:6,fontSize:10,fontWeight:700}}>Root Node</span>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
                {/* credit settings */}
                <div>
                  <h3 style={{fontSize:12,fontWeight:700,marginBottom:12}}>Credit Core Parameters</h3>
                  {[
                    {title:"Enforce Auto-Underwrite",desc:"Approve without credit pull for >750 Score",key:"autoUnderwrite"},
                    {title:"Enable Biometric KYC",desc:"Requirement for virtual card display",key:"bioKYC"},
                    {title:"Limit Override Switch",desc:"Allow Loan Officers to exceed standard limits",key:"limitOverride"},
                  ].map(s=>(
                    <div key={s.key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
                      <div>
                        <div style={{fontSize:12,fontWeight:600}}>{s.title}</div>
                        <div style={{fontSize:10,color:"#64748b",marginTop:2}}>{s.desc}</div>
                      </div>
                      <label className="switch">
                        <input type="checkbox" checked={settings[s.key]} onChange={e=>{setSettings(p=>({...p,[s.key]:e.target.checked}));addLog("admin",`${s.title}: ${e.target.checked?"ON":"OFF"}`);}}/>
                        <span className="slider"/>
                      </label>
                    </div>
                  ))}
                  <div style={{marginTop:12}}>
                    <label style={{fontSize:10,color:"#64748b",display:"block",marginBottom:5}}>Maximum Default Auto-Approve Limit (₹)</label>
                    <input type="number" value={settings.maxLimit}
                      onChange={e=>{setSettings(p=>({...p,maxLimit:+e.target.value}));addLog("admin",`Max limit set to ₹${e.target.value}`);}}
                      style={{background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.08)",color:"#fff",padding:"7px 10px",borderRadius:6,width:"100%",maxWidth:200,fontSize:12,outline:"none"}}/>
                  </div>
                  {/* audit log */}
                  <div style={{marginTop:16}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <span style={{fontSize:11,fontWeight:700}}>Security Audit Log</span>
                      <button onClick={()=>{setLogs([]);addLog("admin","Audit log cleared.");}} style={{background:"transparent",border:"none",color:"#ec4899",fontSize:10,cursor:"pointer",fontWeight:600}}>CLEAR</button>
                    </div>
                    <div style={{background:"rgba(0,0,0,0.35)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:8,padding:12,height:165,overflowY:"auto",fontFamily:"monospace",fontSize:10,lineHeight:1.7}}>
                      {logs.map((l,i)=>(
                        <div key={i} style={{marginBottom:3,borderBottom:"1px solid rgba(255,255,255,0.025)",paddingBottom:2}}>
                          <span style={{color:"#6366f1",marginRight:6}}>[{l.t}]</span>
                          <span style={{fontWeight:700,marginRight:5,color:l.r==="admin"?"#ec4899":l.r==="underwriter"?"#8b5cf6":"#06b6d4"}}>{l.r.toUpperCase()}</span>
                          <span style={{color:"#cbd5e1"}}>{l.m}</span>
                        </div>
                      ))}
                      {logs.length===0 && <span style={{color:"#64748b"}}>No entries.</span>}
                    </div>
                  </div>
                </div>

                {/* DAG workflow */}
                <div>
                  <h3 style={{fontSize:12,fontWeight:700,marginBottom:8}}>🔗 DAG Workflow Designer</h3>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:7}}>
                    {[["Stage Gate","🚦"],["CIBIL Check","🛡️"],["Approval","✅"],["Disbursement","💳"]].map(([l,ic])=>(
                      <button key={l} onClick={()=>addNode(l,ic)} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:6,padding:"4px 9px",color:"#94a3b8",fontSize:9,fontWeight:600,cursor:"pointer"}}>+ {l}</button>
                    ))}
                    <button onClick={saveDag}  style={{background:"rgba(99,102,241,0.1)",border:"1px solid rgba(99,102,241,0.3)",borderRadius:6,padding:"4px 9px",color:"#6366f1",fontSize:9,fontWeight:600,cursor:"pointer"}}>💾 Save</button>
                    <button onClick={resetDag} style={{background:"rgba(244,63,94,0.08)",border:"1px solid rgba(244,63,94,0.25)",borderRadius:6,padding:"4px 9px",color:"#f43f5e",fontSize:9,fontWeight:600,cursor:"pointer"}}>↺ Reset</button>
                  </div>
                  <p style={{fontSize:9,color:"#64748b",marginBottom:4}}>Drag nodes · Click node then target to connect · Right-click to delete</p>
                  <p style={{fontSize:9,fontWeight:selNode?700:400,color:selNode?"#8b5cf6":"#64748b",marginBottom:6}}>
                    {selNode?`✦ "${nodes.find(n=>n.id===selNode)?.label}" selected — click target to connect`:"Click a node to select it."}
                  </p>
                  {/* canvas */}
                  <div ref={dagRef}
                    style={{background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,height:290,position:"relative",overflow:"hidden",cursor:"default"}}
                    onMouseMove={dagMouseMove} onMouseUp={dagMouseUp}>
                    {/* SVG edges */}
                    <svg style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none"}}>
                      <defs>
                        <marker id="ah" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                          <polygon points="0 0,8 3,0 6" fill="rgba(99,102,241,0.55)"/>
                        </marker>
                      </defs>
                      {edges.map((e,i)=>{
                        const fn=nodes.find(n=>n.id===e.from); const tn=nodes.find(n=>n.id===e.to);
                        if(!fn||!tn)return null;
                        const x1=fn.x+52,y1=fn.y+22,x2=tn.x,y2=tn.y+22,mx=(x1+x2)/2;
                        return <path key={i} d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`} stroke="rgba(99,102,241,0.45)" strokeWidth="1.5" fill="none" markerEnd="url(#ah)"/>;
                      })}
                    </svg>
                    {/* nodes */}
                    {nodes.map(n=>(
                      <div key={n.id}
                        style={{position:"absolute",left:n.x,top:n.y,
                          background:selNode===n.id?"rgba(139,92,246,0.22)":n.active?"rgba(16,185,129,0.12)":"rgba(13,19,39,0.9)",
                          border:`2px solid ${selNode===n.id?"#8b5cf6":n.active?"#10b981":"rgba(255,255,255,0.1)"}`,
                          borderRadius:9,padding:"7px 12px",fontSize:10,fontWeight:700,color:"#fff",cursor:"grab",
                          minWidth:100,textAlign:"center",zIndex:2,userSelect:"none",
                          boxShadow:selNode===n.id?"0 0 14px rgba(139,92,246,0.4)":n.active?"0 0 10px rgba(16,185,129,0.25)":"none"}}
                        onMouseDown={e=>dagMouseDown(e,n.id)}
                        onClick={()=>dagClick(n.id)}
                        onContextMenu={e=>dagRightClick(e,n.id)}>
                        <div style={{fontSize:14,marginBottom:2}}>{n.icon}</div>{n.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ══════════ RIGHT — VIRTUAL CARD CONSOLE ══════════ */}
        <div style={{background:"rgba(13,19,39,0.8)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:18,backdropFilter:"blur(14px)",position:"relative",overflow:"hidden",display:"flex",flexDirection:"column",gap:12}}>

          {/* mint overlay */}
          <div style={{position:"absolute",inset:0,background:"rgba(7,9,19,0.93)",borderRadius:16,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:10,opacity:mintSt!=="idle"?1:0,pointerEvents:mintSt!=="idle"?"all":"none",transition:"opacity 0.3s"}}>
            <div style={{position:"relative",width:68,height:68,marginBottom:14}}>
              <div style={{width:"100%",height:"100%",border:`4px solid ${mintSt==="success"?"#10b981":"rgba(99,102,241,0.15)"}`,borderTopColor:mintSt==="success"?"#10b981":"#6366f1",borderRadius:"50%",animation:mintSt==="loading"?"mintSpinner 1s linear infinite":"none",background:mintSt==="success"?"rgba(16,185,129,0.1)":"transparent"}}/>
              {mintSt==="success"&&<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:28,color:"#10b981"}}>✓</div>}
            </div>
            <div style={{fontSize:15,fontWeight:700,marginBottom:6}}>{mintSt==="success"?"Card Minted Successfully!":"Processing Mint..."}</div>
            <div style={{fontSize:11,color:"#64748b",textAlign:"center",maxWidth:200}}>
              {mintSt==="success"?`Virtual card issued for ${selApp?.name} — ${formatINR(limit)}.`:"Contacting bureau & provisioning..."}
            </div>
          </div>

          {/* title */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:13,fontWeight:700}}>Virtual Card Minting Console</div>
              <div style={{fontSize:9,color:"#64748b",marginTop:1}}>{role==="admin"?"Admin Override Enabled":role==="underwriter"?"Authorized Underwriter View":"Loan Officer View"}</div>
            </div>
          </div>

          {/* 3D card */}
          <div style={{height:192,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{perspective:1000,width:288,height:172,cursor:"pointer"}}
                 onMouseMove={onTilt} onMouseLeave={()=>setTilt({x:0,y:0})} onClick={()=>setFlipped(f=>!f)}>
              <div style={{width:"100%",height:"100%",position:"relative",transformStyle:"preserve-3d",borderRadius:14,
                            transform:flipped?`rotateY(180deg)`:`rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
                            transition:flipped||(tilt.x===0&&tilt.y===0)?"transform 0.8s cubic-bezier(0.175,0.885,0.32,1.275)":"transform 0.06s ease"}}>
                {/* front */}
                <div style={{position:"absolute",width:"100%",height:"100%",backfaceVisibility:"hidden",borderRadius:14,padding:17,display:"flex",flexDirection:"column",justifyContent:"space-between",background:skinGrad[skin],boxShadow:"0 16px 40px rgba(0,0,0,0.5)",border:"1px solid rgba(255,255,255,0.13)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:11,fontWeight:800,letterSpacing:1,color:"rgba(255,255,255,0.92)"}}>JETRO PLATINUM</span>
                    <span style={{fontSize:13,fontWeight:800,fontStyle:"italic",opacity:0.9}}>{network.split(" ")[0].toUpperCase()}</span>
                  </div>
                  <div style={{width:30,height:22,background:"linear-gradient(135deg,#fcd34d,#fbbf24)",borderRadius:4,marginTop:5}}/>
                  <div style={{fontSize:13,fontFamily:"monospace",letterSpacing:"2px",color:"#fff",margin:"7px 0"}}>•••• •••• •••• {last4}</div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
                    <div><div style={{fontSize:7,color:"rgba(255,255,255,0.55)",textTransform:"uppercase"}}>Cardholder Name</div>
                      <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase"}}>{(selApp?.name||"SOURAV NEGI").toUpperCase()}</div></div>
                    <div style={{textAlign:"right"}}><div style={{fontSize:7,color:"rgba(255,255,255,0.55)"}}>Expiry Date</div>
                      <div style={{fontSize:9,fontWeight:700}}>08 / 31</div></div>
                  </div>
                </div>
                {/* back */}
                <div style={{position:"absolute",width:"100%",height:"100%",backfaceVisibility:"hidden",transform:"rotateY(180deg)",borderRadius:14,background:"linear-gradient(135deg,#1e293b,#0f172a)",border:"1px solid rgba(255,255,255,0.09)",overflow:"hidden",display:"flex",flexDirection:"column"}}>
                  <div style={{width:"100%",height:32,background:"#000",marginTop:13}}/>
                  <div style={{margin:"9px 14px",height:24,background:"rgba(255,255,255,0.9)",borderRadius:3,display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:9}}>
                    <span style={{fontFamily:"monospace",fontWeight:700,fontSize:12,color:"#1e293b",letterSpacing:1}}>{Math.floor(100+Math.random()*900)}</span>
                  </div>
                  <p style={{fontSize:7,color:"#475569",padding:"0 14px",lineHeight:1.4}}>Issued via Jetro Credit Minting Engine. Subject to Jetro Bank terms.</p>
                </div>
              </div>
            </div>
          </div>
          <p style={{fontSize:9,color:"#64748b",textAlign:"center",margin:"-4px 0 0"}}>💡 Click to flip &amp; view CVV · Hover to tilt 3D</p>

          {/* controls */}
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div>
              <label style={{fontSize:10,color:"#64748b",display:"block",marginBottom:4}}>Select Target Applicant</label>
              <select value={selId} onChange={e=>{setSelId(e.target.value);const a=flatPool.find(x=>x._id===e.target.value);if(a?.limit)setLimit(a.limit);}}
                style={{width:"100%",background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.08)",color:"#fff",padding:"7px 10px",borderRadius:7,fontSize:11,outline:"none"}}>
                {flatPool.filter(a=>a.status!=="Minted"&&!a.cardIssued).map(a=>(
                  <option key={a._id} value={a._id}>{a.name} ({a.lapAppNo||a._id?.slice(-6)})</option>
                ))}
                {flatPool.filter(a=>a.status!=="Minted").length===0 && <option value="">No eligible applicants</option>}
              </select>
            </div>
            <div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:4}}>
                <span style={{color:"#64748b"}}>Credit Limit Selection</span>
                <span style={{color:"#10b981",fontWeight:700}}>₹{limit.toLocaleString("en-IN")}</span>
              </div>
              <input type="range" min={10000} max={3000000} step={10000} value={limit} onChange={e=>setLimit(+e.target.value)} style={{width:"100%",accentColor:"#6366f1"}}/>
            </div>
            <div>
              <label style={{fontSize:10,color:"#64748b",display:"block",marginBottom:4}}>Choose Network</label>
              <select value={network} onChange={e=>setNetwork(e.target.value)} style={{width:"100%",background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.08)",color:"#fff",padding:"7px 10px",borderRadius:7,fontSize:11,outline:"none"}}>
                <option>Visa Premium</option><option>Mastercard Elite</option><option>RuPay Platinum</option>
              </select>
            </div>
            <div>
              <label style={{fontSize:10,color:"#64748b",display:"block",marginBottom:5}}>Select Aesthetic Skin</label>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
                {[["purple","Cyber Neon","linear-gradient(135deg,#4f46e5,#ec4899)"],["obsidian","Obsidian","linear-gradient(135deg,#1f2937,#030712)"],["emerald","Emerald","linear-gradient(135deg,#064e3b,#10b981)"]].map(([k,l,bg])=>(
                  <button key={k} onClick={()=>setSkin(k)} style={{padding:5,borderRadius:7,fontSize:10,fontWeight:600,cursor:"pointer",color:"#fff",background:bg,border:skin===k?"1.5px solid #fff":"1.5px solid transparent",boxShadow:skin===k?"0 0 10px rgba(255,255,255,0.2)":"none"}}>{l}</button>
                ))}
              </div>
            </div>
            <button onClick={handleMint} disabled={mintSt!=="idle"}
              style={{width:"100%",padding:12,border:"none",borderRadius:8,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",marginTop:4,opacity:mintSt!=="idle"?0.7:1,
                background:role==="admin"?"linear-gradient(135deg,#ec4899,#f43f5e)":role==="underwriter"?"linear-gradient(135deg,#10b981,#059669)":"linear-gradient(135deg,#6366f1,#8b5cf6)",
                boxShadow:`0 4px 16px rgba(${role==="admin"?"236,72,153":role==="underwriter"?"16,185,129":"99,102,241"},0.35)`}}>
              {mintSt==="loading"?"⏳ PROVISIONING ENGINE...":role==="admin"?"⚙️ FORCE SYSTEM MINTER":role==="underwriter"?"🛡️ EXECUTE HIGH-LIMIT MINT":"⚙️ MINT VIRTUAL CARD"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardMintingPage;