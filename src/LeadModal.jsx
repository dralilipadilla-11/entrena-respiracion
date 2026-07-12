import{useState}from"react";
const C={navy:"#071e30",navy2:"#0d2844",navy3:"#163452",teal:"#00a8a8",gold:"#E8B84B",white:"#ffffff",lgray:"#8a9bb0",warn:"#c85a2a"};
const LADAS=[{code:"+52",flag:"🇲🇽",name:"México"},{code:"+1",flag:"🇺🇸",name:"EUA / Canadá"},{code:"+34",flag:"🇪🇸",name:"España"},{code:"+54",flag:"🇦🇷",name:"Argentina"},{code:"+57",flag:"🇨🇴",name:"Colombia"},{code:"+56",flag:"🇨🇱",name:"Chile"},{code:"+55",flag:"🇧🇷",name:"Brasil"},{code:"+51",flag:"🇵🇪",name:"Perú"},{code:"+58",flag:"🇻🇪",name:"Venezuela"},{code:"+507",flag:"🇵🇦",name:"Panamá"}];
const WA="https://chat.whatsapp.com/BC3ixtMLLaRFp2lNQ1HdFk";
const PDF="/guia-entrena-tu-respiracion.pdf";
export function LeadModal({onDone,onSkip}){
  const[name,setName]=useState(""),[phone,setPhone]=useState(""),[lada,setLada]=useState("+52");
  const[email,setEmail]=useState(""),[showL,setShowL]=useState(false),[step,setStep]=useState(1);
  const[loading,setLoading]=useState(false),[done,setDone]=useState(false),[error,setError]=useState("");
  const sel=LADAS.find(l=>l.code===lada)||LADAS[0];
  const go2=()=>{if(!phone||phone.length<7){setError("Ingresa un número válido");return;}setError("");setStep(2);};
  const submit=async(skipEmail=false)=>{
    setLoading(true);
    try{
      const res=await fetch("/.netlify/functions/subscribe",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({name,phone,lada,email:skipEmail?"":email}),
      });
      await res.json();
    }catch(e){console.log("submit error",e);}
    setLoading(false);setDone(true);
  };
  const inp={width:"100%",background:"#163452",border:"1px solid #1e4060",borderRadius:10,padding:"13px 14px",color:"#fff",fontSize:15,marginBottom:10,outline:"none",fontFamily:"inherit"};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:200,display:"flex",alignItems:"flex-end",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <div style={{background:C.navy2,borderRadius:"20px 20px 0 0",padding:"28px 22px 48px",width:"100%",maxHeight:"92vh",overflowY:"auto"}}>
        {done?(
          <div style={{textAlign:"center",padding:"8px 0"}}>
            <div style={{fontSize:48,marginBottom:14}}>🫁</div>
            <div style={{color:C.gold,fontSize:18,fontWeight:700,marginBottom:8}}>¡Bienvenida a la comunidad!</div>
            <div style={{color:C.lgray,fontSize:14,marginBottom:28,lineHeight:1.7}}>Aquí están tus dos accesos.<br/>Úsalos ahora o guarda esta pantalla:</div>
            <a href={WA} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,background:"#25D366",color:"#fff",fontWeight:700,fontSize:15,padding:"16px",borderRadius:14,textDecoration:"none",marginBottom:12}}>
              <span style={{fontSize:22}}>📲</span><span>Entrar al grupo WhatsApp</span>
            </a>
            <a href={PDF} download="Guia_EntrenaTuRespiracion.pdf" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,background:`${C.gold}20`,border:`1.5px solid ${C.gold}66`,color:C.gold,fontWeight:700,fontSize:15,padding:"16px",borderRadius:14,textDecoration:"none",marginBottom:20}}>
              <span style={{fontSize:22}}>📥</span><span>Descargar guía PDF</span>
            </a>
            <div style={{background:C.navy3,borderRadius:12,padding:"14px",marginBottom:20}}>
              <div style={{fontSize:12,color:C.lgray,marginBottom:6}}>¿Cómo está tu sueño?</div>
              <a href="https://quiz-escueladesueno.netlify.app" target="_blank" rel="noopener noreferrer" style={{color:C.teal,fontWeight:700,fontSize:13,textDecoration:"none"}}>→ Quiz gratuito de Escuela de Sueño</a>
            </div>
            <button onClick={onDone} style={{background:"transparent",border:"none",color:C.lgray,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:"8px"}}>Continuar practicando</button>
          </div>
        ):step===1?(
          <>
            <div style={{width:44,height:3,background:C.gold,borderRadius:2,margin:"0 auto 22px"}}/>
            <div style={{fontSize:18,fontWeight:700,marginBottom:6,color:C.white}}>Únete a la comunidad 🫁</div>
            <div style={{fontSize:14,color:C.lgray,marginBottom:22,lineHeight:1.7}}>Recibes la guía completa en PDF <span style={{color:C.gold,fontWeight:600}}>+ acceso al grupo WhatsApp</span> con la Dra. Lili Padilla y el Dr. Jorge Barbachano.</div>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Tu nombre" style={inp}/>
            <div style={{display:"flex",gap:8,marginBottom:error?4:10,position:"relative"}}>
              <button onClick={()=>setShowL(s=>!s)} style={{background:"#163452",border:"1px solid #1e4060",borderRadius:10,padding:"13px 10px",cursor:"pointer",color:"#fff",fontSize:14,fontFamily:"inherit",display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap",flexShrink:0}}>
                <span style={{fontSize:16}}>{sel.flag}</span><span style={{color:C.lgray,fontSize:12}}>{lada}</span><span style={{fontSize:10,color:C.lgray}}>▾</span>
              </button>
              <input value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,""))} placeholder="Número de WhatsApp" type="tel" style={{...inp,marginBottom:0,flex:1}}/>
            </div>
            {showL&&(
              <div style={{background:C.navy3,borderRadius:12,padding:"8px 0",marginBottom:10,maxHeight:200,overflowY:"auto"}}>
                {LADAS.map(l=>(
                  <button key={l.code} onClick={()=>{setLada(l.code);setShowL(false);}} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"11px 16px",background:lada===l.code?`${C.teal}20`:"transparent",border:"none",cursor:"pointer",color:"#fff",fontSize:14,fontFamily:"inherit",textAlign:"left"}}>
                    <span style={{fontSize:16}}>{l.flag}</span><span style={{color:C.lgray,fontSize:12,width:42}}>{l.code}</span><span>{l.name}</span>
                    {lada===l.code&&<span style={{marginLeft:"auto",color:C.teal}}>✓</span>}
                  </button>
                ))}
              </div>
            )}
            {error&&<div style={{color:C.warn,fontSize:13,marginBottom:10}}>⚠ {error}</div>}
            <button onClick={go2} style={{width:"100%",padding:"16px",borderRadius:12,border:"none",background:C.gold,color:C.navy,fontSize:15,fontWeight:700,cursor:"pointer",marginTop:6,marginBottom:12,fontFamily:"inherit"}}>Continuar →</button>
            <button onClick={onSkip} style={{width:"100%",padding:"12px",borderRadius:12,border:"none",background:"transparent",color:C.lgray,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Ahora no</button>
          </>
        ):(
          <>
            <div style={{width:44,height:3,background:C.teal,borderRadius:2,margin:"0 auto 22px"}}/>
            <div style={{fontSize:18,fontWeight:700,marginBottom:6,color:C.white}}>Casi listo 🎉</div>
            <div style={{fontSize:14,color:C.lgray,marginBottom:6}}>WhatsApp: <span style={{color:C.gold,fontWeight:600}}>{lada} {phone}</span></div>
            <div style={{fontSize:14,color:C.lgray,marginBottom:22,lineHeight:1.7}}>Agrega tu correo para recibir contenido de <span style={{color:C.teal,fontWeight:600}}>Escuela de Sueño</span> y que te llegue la guía por email.</div>
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Tu correo electrónico" type="email" style={inp}/>
            <button onClick={()=>submit(false)} disabled={loading} style={{width:"100%",padding:"16px",borderRadius:12,border:"none",background:loading?`${C.teal}55`:C.teal,color:C.navy,fontSize:15,fontWeight:700,cursor:loading?"default":"pointer",marginBottom:12,fontFamily:"inherit"}}>{loading?"Enviando...":"¡Enviar y unirme!"}</button>
            <button onClick={()=>submit(true)} disabled={loading} style={{width:"100%",padding:"12px",borderRadius:12,border:"none",background:"transparent",color:C.lgray,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Continuar sin correo</button>
          </>
        )}
      </div>
    </div>
  );
}
