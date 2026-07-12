import{useState,useEffect,useRef,useCallback}from"react";
import{LeadModal}from"./LeadModal.jsx";

const C={
  navy:"#071e30",navy2:"#0d2844",navy3:"#163452",navy4:"#1e4060",
  teal:"#00a8a8",tealD:"#007a7a",gold:"#E8B84B",goldD:"#C49A2E",
  white:"#ffffff",lgray:"#8a9bb0",dgray:"#334455",
  calma:"#1e4060",sueno:"#0a3050",rend:"#007a7a",
  base:"#163452",nariz:"#00a8a8",manana:"#005f5f",warn:"#c85a2a",
};

const BINAURAL={
  sueno:{hz:3,  label:"Delta · 3 Hz", desc:"Inducción al sueño profundo"},
  calma:{hz:8,  label:"Alpha · 8 Hz", desc:"Calma y relajación profunda"},
  base: {hz:6,  label:"Theta · 6 Hz", desc:"Meditación y conciencia"},
  rend: {hz:14, label:"Beta · 14 Hz", desc:"Foco y rendimiento"},
  nariz:{hz:10, label:"Alpha · 10 Hz",desc:"Conciencia nasal relajada"},
  activ:{hz:12, label:"Beta · 12 Hz", desc:"Activación suave"},
};

function createEngine(ctx){
  function binauralBeat(baseFreq,beatHz,vol=0.10){
    try{
      const merger=ctx.createChannelMerger(2),master=ctx.createGain();
      merger.connect(master);master.connect(ctx.destination);
      master.gain.setValueAtTime(0,ctx.currentTime);
      master.gain.linearRampToValueAtTime(vol,ctx.currentTime+3);
      const lO=ctx.createOscillator(),lG=ctx.createGain();
      lO.type="sine";lO.frequency.value=baseFreq;lG.gain.value=1;
      lO.connect(lG);lG.connect(merger,0,0);lO.start();
      const rO=ctx.createOscillator(),rG=ctx.createGain();
      rO.type="sine";rO.frequency.value=baseFreq+beatHz;rG.gain.value=1;
      rO.connect(rG);rG.connect(merger,0,1);rO.start();
      const hO=ctx.createOscillator(),hG=ctx.createGain();
      hO.type="sine";hO.frequency.value=baseFreq*2;hG.gain.value=0.012;
      hO.connect(hG);hG.connect(ctx.destination);hO.start();
      return{stop:()=>{try{master.gain.linearRampToValueAtTime(0,ctx.currentTime+1);setTimeout(()=>{try{lO.stop();rO.stop();hO.stop();}catch(e){}},1100);}catch(e){}}}
    }catch(e){return{stop:()=>{}};}
  }
  function ambientChord(rootFreq){
    const vol=0.004,freqs=[rootFreq,rootFreq*1.5,rootFreq*2];
    const nodes=freqs.map((f,i)=>{
      const osc=ctx.createOscillator(),g=ctx.createGain();
      const lfo=ctx.createOscillator(),lfoG=ctx.createGain();
      lfo.frequency.value=0.1+i*0.03;lfoG.gain.value=0.8;
      lfo.connect(lfoG);lfoG.connect(osc.frequency);
      osc.type="sine";osc.frequency.value=f;g.gain.value=vol/(i+1);
      osc.connect(g);g.connect(ctx.destination);lfo.start();osc.start();
      return{osc,lfo};
    });
    return{stop:()=>nodes.forEach(n=>{try{n.osc.stop();n.lfo.stop();}catch(e){}})};
  }
  function bowl(freq=528,vol=0.12){
    [1,2.756,5.404,8.933].forEach((h,i)=>{
      const osc=ctx.createOscillator(),g=ctx.createGain();
      osc.connect(g);g.connect(ctx.destination);
      osc.type="sine";osc.frequency.value=freq*h;
      const t=ctx.currentTime;
      g.gain.setValueAtTime(vol/(i+1),t);
      g.gain.exponentialRampToValueAtTime(0.001,t+3.2-i*0.4);
      osc.start(t);osc.stop(t+3.2);
    });
  }
  function chime(isIn){
    const freq=isIn?528:396,harms=isIn?[1,2,3]:[1,1.5];
    harms.forEach((h,i)=>{
      const osc=ctx.createOscillator(),g=ctx.createGain();
      osc.connect(g);g.connect(ctx.destination);
      osc.type="sine";osc.frequency.value=freq*h;
      const t=ctx.currentTime;
      g.gain.setValueAtTime(0,t);
      g.gain.linearRampToValueAtTime(0.18/(i+1),t+0.03);
      g.gain.exponentialRampToValueAtTime(0.001,t+0.8);
      osc.start(t);osc.stop(t+0.8);
    });
  }
  function startBowl(){bowl(528,0.1);}
  return{binauralBeat,ambientChord,bowl,chime,startBowl};
}

const FREQ_OPTIONS=[{v:432,l:"432 Hz"},{v:528,l:"528 Hz"},{v:741,l:"741 Hz"}];
const TIME_OPTIONS=[3,5,10];

const OBJECTIVES=[
  {id:"calma",label:"Calma",      icon:"◉",color:C.calma, desc:"Estrés y tensión"},
  {id:"sueno",label:"Sueño",       icon:"☽",color:C.gold,  desc:"Inicio del sueño",gold:true},
  {id:"rend", label:"Rendimiento",icon:"▲",color:C.rend,  desc:"Ejercicio y recuperación"},
  {id:"base", label:"Base",        icon:"◈",color:C.teal,  desc:"Práctica fundamental"},
  {id:"nariz",label:"Nariz",       icon:"⊕",color:C.nariz, desc:"Vía aérea nasal"},
  {id:"activ",label:"Activación",  icon:"☀",color:C.manana,desc:"Energía y mañana"},
];

const TECHNIQUES=[
  // BASE
  {id:"diafragmatica",name:"Respiración Diafragmática",subtitle:"4 · 6",
   pattern:{inhale:4,holdIn:0,exhale:6,holdOut:0},defaultMin:5,
   objectives:["base","rend","sueno"],color:C.teal,
   cuando:"Al despertar y antes de dormir. Base de todas las demás técnicas.",
   desc:"Reactiva el músculo principal de la respiración. Activa el nervio vago, reduce la frecuencia cardiaca y calma el sistema nervioso. Punto de partida de cualquier práctica respiratoria."},
  {id:"igual",name:"Sama Vritti (Igual)",subtitle:"4 · 4",
   pattern:{inhale:4,holdIn:0,exhale:4,holdOut:0},defaultMin:5,
   objectives:["base","calma"],color:C.teal,
   cuando:"Práctica base diaria, inicio de meditación, punto de partida para principiantes.",
   desc:"Sama Vritti significa 'respiración igual' en sánscrito. Estabiliza el sistema nervioso autónomo y es el punto de partida ideal para entrenar la respiración."},
  {id:"puente",name:"Respiración 4-6 (Puente)",subtitle:"4 · 6",
   pattern:{inhale:4,holdIn:0,exhale:6,holdOut:0},defaultMin:5,
   objectives:["base"],color:C.teal,
   cuando:"Cuando el 4-8 se siente largo. Puente entre básico y avanzado.",
   desc:"Exhala levemente más larga que la inhala para activar el parasimpático de forma suave. Ideal para comenzar si el 4-8 se siente forzado."},
  {id:"extendida",name:"Exhalación Extendida",subtitle:"4 · 8",
   pattern:{inhale:4,holdIn:0,exhale:8,holdOut:0},defaultMin:5,
   objectives:["base","calma","sueno"],color:C.calma,
   cuando:"Llegada a casa tras un día cargado, ansiedad nocturna, despertar a las 3am.",
   desc:"Inhalar activa el simpático. Exhalar lo apaga. Cuando la exhala dura el doble que la inhala, el sistema nervioso cambia de modo en segundos vía el nervio vago. Zaccaro et al., 2018."},
  // CALMA
  {id:"box",name:"Box Breathing",subtitle:"4 · 4 · 4 · 4",
   pattern:{inhale:4,holdIn:4,exhale:4,holdOut:4},defaultMin:5,
   objectives:["calma","rend"],color:C.calma,
   warning:"Es activante — no usar antes de dormir.",
   cuando:"Estrés agudo, antes de decisiones importantes, preparación para entrenamiento intenso.",
   desc:"Cuatro fases iguales regulan el CO2, activan el córtex prefrontal y reducen la respuesta de la amígdala. Protocolo de control de estrés agudo adoptado por operaciones especiales."},
  {id:"triangulo",name:"Respiración Triángulo",subtitle:"4 · 4 · 4",
   pattern:{inhale:4,holdIn:4,exhale:4,holdOut:0},defaultMin:5,
   objectives:["calma"],color:C.calma,
   cuando:"Ansiedad leve, necesidad de enfoque. Más suave que el Box Breathing.",
   desc:"Tres fases iguales regulan el CO2 y calman la respuesta de estrés de forma gradual."},
  {id:"medida",name:"Respiración Medida",subtitle:"4 · 1 · 7",
   pattern:{inhale:4,holdIn:1,exhale:7,holdOut:0},defaultMin:5,
   objectives:["calma","sueno"],color:C.calma,
   cuando:"En cualquier momento de tensión durante el día. Versión más accesible del 4-7-8.",
   desc:"Combina una retención breve con una exhala prolongada. Activa el parasimpático de forma suave."},
  {id:"vocal",name:"Sonido Vocal Vagal",subtitle:"4 · aaaaaah",
   pattern:{inhale:4,holdIn:0,exhale:8,holdOut:0},defaultMin:3,
   objectives:["calma","activ"],color:C.calma,exhaleLabel:"AAAAAAH",
   instruction:"Exhala vocalizando 'aaaaaah' u 'ooooh' en voz baja y continua. Siente la vibración en el pecho.",
   cuando:"Ansiedad crónica, alta carga emocional, alternativa al 4-7-8 antes de dormir.",
   desc:"El nervio vago innerva la laringe. Sonidos vocales bajos y sostenidos activan la rama ventral del vago — estado de calma profunda. Teoría polivagal de Stephen Porges."},
  // SUEÑO
  {id:"478",name:"Respiración 4-7-8",subtitle:"4 · 7 · 8",
   pattern:{inhale:4,holdIn:7,exhale:8,holdOut:0},defaultMin:3,
   objectives:["sueno"],color:C.gold,goldAccent:true,
   warning:"Solo antes de dormir — puede provocar somnolencia inmediata.",
   cuando:"Exclusivamente antes de dormir o en insomnio de inicio. No usar de día.",
   desc:"La retención de 7 segundos potencia el efecto vagal de la exhala extendida. El Dr. Andrew Weil la describe como el calmante natural más potente del sistema nervioso."},
  {id:"coherente",name:"Respiración Coherente",subtitle:"5.5 · 5.5",
   pattern:{inhale:5.5,holdIn:0,exhale:5.5,holdOut:0},defaultMin:5,
   objectives:["sueno","rend","base"],color:C.rend,
   cuando:"Después de entrenar, antes de dormir y en días de alta carga física o emocional.",
   desc:"El ritmo de 5.5 seg sincroniza el corazón con la respiración y maximiza la variabilidad cardiaca (HRV), reduciendo el cortisol y optimizando la recuperación. Lehrer & Gevirtz, 2014."},
  // RENDIMIENTO
  {id:"buteyko",name:"Buteyko — Desobstrucción",subtitle:"Exhala · Retén · Suelta",
   pattern:{inhale:3,holdIn:0,exhale:4,holdOut:10},defaultMin:3,
   objectives:["rend","nariz"],color:C.rend,
   instruction:"En la PAUSA: tapa la nariz con los dedos hasta necesidad moderada de respirar, luego suelta y respira suave. Repite.",
   cuando:"Antes de entrenar para abrir la nariz. Nariz congestionada. Alternativa al aerosol nasal.",
   desc:"La retención voluntaria eleva el CO2 y dilata los vasos de los cornetes nasales, abriendo la nariz en 2 minutos sin medicamento. Método Buteyko — Patrick McKeown."},
  {id:"nasal_ej",name:"Nasal en Ejercicio",subtitle:"Inhala · Exhala · Nariz",
   pattern:{inhale:4,holdIn:0,exhale:4,holdOut:0},defaultMin:10,
   objectives:["rend"],color:C.rend,
   instruction:"Mantén SIEMPRE la boca cerrada durante toda la práctica. Si sientes que te ahogas, reduce el ritmo pero no abras la boca.",
   cuando:"Durante cardio ligero o moderado. Implementación gradual semana a semana.",
   desc:"Respirar por nariz en ejercicio mantiene el óxido nítrico activo, fortalece el diafragma y mejora la eficiencia del O2 por el efecto Bohr. Dallam et al., Journal of Sports Sciences 2018."},
  {id:"recuperacion",name:"Recuperación Post-Entreno",subtitle:"5.5 · 5.5",
   pattern:{inhale:5.5,holdIn:0,exhale:5.5,holdOut:0},defaultMin:5,
   objectives:["rend"],color:C.rend,
   cuando:"Inmediatamente después del entrenamiento.",
   desc:"Después de entreno intenso el sistema nervioso queda activado. La respiración coherente lo lleva a modo parasimpático en 5 min, optimizando la recuperación y el sueño nocturno."},
  // NARIZ
  {id:"zumbido",name:"Zumbido Nasal",subtitle:"4 · mmmmm",
   pattern:{inhale:4,holdIn:0,exhale:7,holdOut:0},defaultMin:3,
   objectives:["nariz","activ"],color:C.nariz,exhaleLabel:"MMMM",
   instruction:"Exhala con labios cerrados haciendo 'mmmmm' continuo. Siente la vibración en el centro de la cara.",
   cuando:"Al despertar con nariz cargada y antes de dormir.",
   desc:"Tararear con la boca cerrada multiplica ×15 el óxido nítrico nasal, que dilata vasos pulmonares, abre bronquios y tiene efecto antimicrobiano local. Weitzberg & Lundberg, AJRCCM 2002."},
  {id:"alterna",name:"Respiración Alterna Nasal",subtitle:"Nadi Shodhana",
   pattern:{inhale:4,holdIn:0,exhale:4,holdOut:0},defaultMin:5,
   objectives:["nariz","calma"],color:C.nariz,
   instruction:"Tapa fosa derecha → inhala izquierda. Tapa izquierda → exhala derecha. Inhala derecha. Tapa derecha → exhala izquierda. Repite.",
   cuando:"Antes de meditar, transición día-noche, pre-evento de alta exigencia.",
   desc:"Cada fosa activa preferencialmente un hemisferio cerebral diferente. La alternancia regula el sistema nervioso autónomo. Shannahoff-Khalsa · Telles et al., 2013."},
  // ACTIVACIÓN
  {id:"despertar",name:"Respiración al Despertar",subtitle:"Diafragma · Zumbido",
   pattern:{inhale:4,holdIn:0,exhale:6,holdOut:0},defaultMin:3,
   objectives:["activ"],color:C.manana,
   instruction:"Primero: 10 respiraciones diafragmáticas. Luego activa el zumbido nasal mmmmm en las últimas 5 exhalas.",
   cuando:"Cada mañana antes de levantarte. Especialmente efectiva en brain fog matutino.",
   desc:"Al despertar el CO2 nocturno está elevado. Esta secuencia sube el óxido nítrico nasal, oxigena el córtex prefrontal y activa el sistema de alerta gradualmente."},
];

function buildPhases(tech){
  const p=tech.pattern,col=tech.goldAccent?C.gold:(tech.color||C.teal),colD=tech.goldAccent?C.goldD:C.tealD;
  const ph=[];
  if(p.inhale>0) ph.push({name:"inhale",dur:p.inhale,label:"INHALA",scale:1.0,col});
  if(p.holdIn>0) ph.push({name:"holdIn",dur:p.holdIn,label:"RETÉN",scale:1.0,col:colD||C.tealD});
  if(p.exhale>0) ph.push({name:"exhale",dur:p.exhale,label:tech.exhaleLabel||"EXHALA",scale:0.2,col:C.navy2});
  if(p.holdOut>0)ph.push({name:"holdOut",dur:p.holdOut,label:"PAUSA",scale:0.2,col:C.navy});
  return ph;
}
function fmt(s){return`${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,"0")}`;}

export default function App(){
  const[screen,setScreen]    =useState("home");
  const[selObj,setSelObj]    =useState(null);
  const[selTech,setSelTech]  =useState(null);
  const[selMin,setSelMin]    =useState(5);
  const[showSet,setShowSet]  =useState(false);
  const[showLead,setShowLead]=useState(false);
  const[leadDone,setLeadDone]=useState(false);
  const[audio,setAudio]      =useState({enabled:true,bell:true,tones:true,bgFreq:432,binaural:true});
  const[running,setRunning]  =useState(false);
  const[paused,setPaused]    =useState(false);
  const[phIdx,setPhIdx]      =useState(0);
  const[pCd,setPCd]          =useState(0);
  const[total,setTotal]      =useState(0);
  const[rounds,setRounds]    =useState(0);
  const[scale,setScale]      =useState(0.2);
  const[pDur,setPDur]        =useState(1);
  const[pCol,setPCol]        =useState(C.teal);
  const[pLabel,setPLabel]    =useState("INHALA");
  const[done,setDone]        =useState(false);
  const[activeBeat,setActiveBeat]=useState(null);

  const ctxRef=useRef(null),engRef=useRef(null),bgRef=useRef(null),stRef=useRef(null),tmrRef=useRef(null);

  const initAudio=useCallback(()=>{if(!ctxRef.current){ctxRef.current=new(window.AudioContext||window.webkitAudioContext)();engRef.current=createEngine(ctxRef.current);}},[]);
  const stopBg=useCallback(()=>{try{if(bgRef.current){bgRef.current.stop();bgRef.current=null;}}catch(e){}setActiveBeat(null);},[]);
  const goHome=useCallback(()=>{stopBg();setRunning(false);setDone(false);clearInterval(tmrRef.current);setScreen("home");},[stopBg]);

  const startPractice=useCallback((tech,minutes)=>{
    initAudio();
    const phases=buildPhases(tech),totalD=minutes*60;
    stRef.current={phases,phaseI:0,phaseEl:0,totalEl:0,totalD,round:0,last:Date.now()};
    const p0=phases[0];
    setPhIdx(0);setPCd(p0.dur);setTotal(totalD);setRounds(0);
    setScale(p0.scale);setPDur(p0.dur);setPCol(p0.col);setPLabel(p0.label);
    setRunning(true);setPaused(false);setDone(false);
    if(audio.enabled&&audio.bell&&engRef.current)engRef.current.startBowl();
    if(audio.enabled&&engRef.current)setTimeout(()=>{
      stopBg();
      const baseF=audio.bgFreq||432;
      if(audio.binaural){
        const beat=BINAURAL[tech.objectives[0]]||BINAURAL.base;
        setActiveBeat(beat);
        bgRef.current=engRef.current.binauralBeat(baseF,beat.hz);
      }else if(audio.bgFreq){
        bgRef.current=engRef.current.ambientChord(baseF);
      }
    },900);
  },[initAudio,audio,stopBg]);

  useEffect(()=>{
    if(!running||paused||!stRef.current)return;
    tmrRef.current=setInterval(()=>{
      const s=stRef.current;if(!s)return;
      const dt=(Date.now()-s.last)/1000;s.last=Date.now();
      s.phaseEl+=dt;s.totalEl+=dt;
      const cp=s.phases[s.phaseI];
      if(s.phaseEl>=cp.dur){
        s.phaseEl=0;s.phaseI++;
        if(s.phaseI>=s.phases.length){s.phaseI=0;s.round++;setRounds(s.round);}
        const np=s.phases[s.phaseI];
        setPhIdx(s.phaseI);setScale(np.scale);setPDur(np.dur);setPCol(np.col);setPLabel(np.label);
        if(audio.enabled&&audio.tones&&engRef.current)engRef.current.chime(np.name==="inhale");
      }
      setPCd(Math.ceil(Math.max(0,cp.dur-s.phaseEl)));
      const tl=Math.max(0,s.totalD-s.totalEl);setTotal(tl);
      if(tl<=0){setRunning(false);setDone(true);stopBg();clearInterval(tmrRef.current);if(audio.enabled&&audio.bell&&engRef.current)engRef.current.bowl(432,0.1);}
    },80);
    return()=>clearInterval(tmrRef.current);
  },[running,paused,audio,stopBg]);

  const ObjCard=({obj})=>{
    const ig=obj.gold||obj.color===C.gold;
    return(
      <button onClick={()=>{setSelObj(obj);setScreen("objective");}} style={{background:ig?`${C.gold}14`:`${obj.color}18`,border:`1.5px solid ${ig?C.gold+"55":obj.color+"44"}`,borderRadius:14,padding:"14px 8px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:6,transition:"all 0.2s"}}
        onMouseEnter={e=>{e.currentTarget.style.background=ig?`${C.gold}28`:`${obj.color}30`;e.currentTarget.style.borderColor=ig?C.gold:obj.color;}}
        onMouseLeave={e=>{e.currentTarget.style.background=ig?`${C.gold}14`:`${obj.color}18`;e.currentTarget.style.borderColor=ig?`${C.gold}55`:`${obj.color}44`;}}>
        <span style={{fontSize:20,color:ig?C.gold:obj.color}}>{obj.icon}</span>
        <span style={{fontSize:13,fontWeight:700,color:C.white,textAlign:"center"}}>{obj.label}</span>
        <span style={{fontSize:11,color:C.lgray,textAlign:"center",lineHeight:1.4}}>{obj.desc}</span>
      </button>
    );
  };

  const TechCard=({tech})=>{
    const ac=tech.goldAccent?C.gold:tech.color;
    return(
      <button onClick={()=>{setSelTech(tech);setSelMin(tech.defaultMin);setScreen("technique");}} style={{background:C.navy2,border:`1px solid ${ac}44`,borderRadius:14,padding:"14px",cursor:"pointer",textAlign:"left",width:"100%",transition:"all 0.2s"}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor=ac;e.currentTarget.style.background=`${ac}18`;}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor=`${ac}44`;e.currentTarget.style.background=C.navy2;}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:C.white,marginBottom:3}}>{tech.name}</div>
            <div style={{fontSize:13,color:ac,fontWeight:600}}>{tech.subtitle}</div>
          </div>
          <div style={{background:`${ac}22`,color:ac,fontSize:12,fontWeight:700,padding:"4px 10px",borderRadius:20,flexShrink:0,marginLeft:8}}>{tech.defaultMin} min</div>
        </div>
        <div style={{fontSize:13,color:C.lgray,lineHeight:1.6}}>{tech.desc.slice(0,90)}…</div>
        {tech.warning&&<div style={{marginTop:6,fontSize:11,color:C.warn,fontWeight:600}}>⚠ {tech.warning}</div>}
      </button>
    );
  };

  if(screen==="home")return(
    <div style={{background:C.navy,minHeight:"100vh",fontFamily:"'DM Sans',system-ui,sans-serif",color:C.white,paddingBottom:40}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0;}`}</style>
      <div style={{background:`linear-gradient(160deg,${C.navy3},${C.navy2})`,padding:"26px 20px 18px",borderBottom:`1px solid ${C.navy3}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
              <span style={{fontSize:11,color:C.teal,fontWeight:700,letterSpacing:"0.16em"}}>SER</span>
              <span style={{width:4,height:4,borderRadius:"50%",background:C.gold,display:"inline-block"}}/>
              <span style={{fontSize:11,color:C.lgray,letterSpacing:"0.05em"}}>SUEÑO · EQUILIBRIO · RESPIRACIÓN</span>
            </div>
            <div style={{fontSize:26,fontWeight:700,lineHeight:1.15}}>
              <span style={{color:C.white}}>Entrena tu </span><span style={{color:C.teal}}>Respiración</span>
            </div>
            <div style={{fontSize:13,color:C.lgray,marginTop:6}}>{TECHNIQUES.length} técnicas con evidencia · por objetivo</div>
          </div>
          <button onClick={()=>setShowSet(true)} style={{background:C.navy3,border:`1px solid ${C.navy3}`,borderRadius:10,padding:"8px 10px",cursor:"pointer",color:C.lgray,fontSize:17,flexShrink:0}}>⚙</button>
        </div>
      </div>
      {!leadDone?(
        <div style={{margin:"14px 20px 0",background:`linear-gradient(135deg,${C.gold}14,${C.teal}0a)`,border:`1px solid ${C.gold}40`,borderRadius:12,padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:C.white}}>🫁 Guía + Comunidad WhatsApp</div>
            <div style={{fontSize:11,color:C.lgray}}>{TECHNIQUES.length} herramientas en PDF · Gratis</div>
          </div>
          <button onClick={()=>setShowLead(true)} style={{background:C.gold,border:"none",borderRadius:8,padding:"8px 14px",cursor:"pointer",color:C.navy,fontSize:12,fontWeight:700,flexShrink:0}}>Quiero entrar</button>
        </div>
      ):(
        <div style={{margin:"14px 20px 0",background:`${C.gold}14`,border:`1px solid ${C.gold}44`,borderRadius:12,padding:"11px 14px",fontSize:13,color:C.gold,fontWeight:600,textAlign:"center"}}>✓ ¡Bienvenida! Revisa tu WhatsApp y correo</div>
      )}
      <div style={{padding:"22px 20px 10px"}}>
        <div style={{fontSize:12,color:C.lgray,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12}}>¿Cuál es tu objetivo hoy?</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:9}}>
          {OBJECTIVES.map(obj=><ObjCard key={obj.id} obj={obj}/>)}
        </div>
      </div>
      <div style={{padding:"14px 20px 0"}}>
        <div style={{fontSize:12,color:C.lgray,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12}}>Todas las técnicas</div>
        <div style={{display:"flex",flexDirection:"column",gap:9}}>
          {TECHNIQUES.map(t=><TechCard key={t.id} tech={t}/>)}
        </div>
      </div>
      <div style={{padding:"22px 20px 0",textAlign:"center"}}>
        <div style={{fontSize:11,color:`${C.lgray}77`,lineHeight:2}}>
          Dra. Lili Padilla · Medicina del Sueño · UNAM · @dra.lilipadilla<br/>
          Dr. Jorge Barbachano · Rinología Funcional · UNAM · @drjorgebarbachano
        </div>
      </div>
      {showSet&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.72)",zIndex:100,display:"flex",alignItems:"flex-end"}}>
          <div style={{background:C.navy2,borderRadius:"20px 20px 0 0",padding:"22px 20px 44px",width:"100%",maxHeight:"85vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <span style={{fontSize:16,fontWeight:700}}>Audio</span>
              <button onClick={()=>setShowSet(false)} style={{background:C.navy3,border:"none",borderRadius:8,padding:"6px 10px",cursor:"pointer",color:C.white,fontSize:14}}>✕</button>
            </div>
            {[
              {k:"enabled",l:"Audio activado",     s:"Todos los sonidos"},
              {k:"bell",   l:"Cuenco inicio / fin", s:"Sonido de cuenco tibetano"},
              {k:"tones",  l:"Tono de transición",  s:"Señal entre fases de respiración"},
            ].map(item=>(
              <div key={item.k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 0",borderBottom:`1px solid ${C.navy3}`}}>
                <div><div style={{fontSize:13,fontWeight:600}}>{item.l}</div><div style={{fontSize:11,color:C.lgray}}>{item.s}</div></div>
                <button onClick={()=>setAudio(a=>({...a,[item.k]:!a[item.k]}))} style={{width:46,height:26,borderRadius:13,border:"none",cursor:"pointer",background:audio[item.k]?C.teal:C.navy3,position:"relative",transition:"background 0.2s"}}>
                  <div style={{position:"absolute",top:3,left:audio[item.k]?22:3,width:20,height:20,borderRadius:"50%",background:C.white,transition:"left 0.2s"}}/>
                </button>
              </div>
            ))}
            <div style={{padding:"14px 0",borderBottom:`1px solid ${C.navy3}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:8}}>
                    Sonido Binaural
                    <span style={{background:`${C.gold}22`,color:C.gold,fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:10}}>🎧</span>
                  </div>
                  <div style={{fontSize:11,color:C.lgray,marginTop:2}}>Frecuencias distintas por oído · Requiere audífonos</div>
                </div>
                <button onClick={()=>setAudio(a=>({...a,binaural:!a.binaural}))} style={{width:46,height:26,borderRadius:13,border:"none",cursor:"pointer",background:audio.binaural?C.gold:C.navy3,position:"relative",transition:"background 0.2s"}}>
                  <div style={{position:"absolute",top:3,left:audio.binaural?22:3,width:20,height:20,borderRadius:"50%",background:audio.binaural?C.navy:C.white,transition:"left 0.2s"}}/>
                </button>
              </div>
              {audio.binaural&&(
                <div style={{marginTop:10,background:`${C.gold}10`,border:`1px solid ${C.gold}33`,borderRadius:10,padding:"10px 12px"}}>
                  <div style={{fontSize:11,color:C.gold,fontWeight:600,marginBottom:6}}>Frecuencia automática por objetivo:</div>
                  {Object.entries(BINAURAL).map(([k,b])=>(
                    <div key={k} style={{fontSize:11,color:C.lgray,marginBottom:3}}>
                      <span style={{color:C.white,fontWeight:600}}>{b.label}</span> — {b.desc}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{padding:"14px 0 6px"}}>
              <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>Frecuencia base</div>
              <div style={{fontSize:11,color:C.lgray,marginBottom:10}}>Frecuencia portadora para el binaural o tono de fondo</div>
              <div style={{display:"flex",gap:7}}>
                {FREQ_OPTIONS.map(f=>(
                  <button key={f.v} onClick={()=>setAudio(a=>({...a,bgFreq:f.v}))} style={{flex:1,padding:"10px 4px",borderRadius:8,border:`1.5px solid ${audio.bgFreq===f.v?C.teal:`${C.teal}25`}`,background:audio.bgFreq===f.v?`${C.teal}20`:"transparent",color:audio.bgFreq===f.v?C.teal:C.lgray,fontSize:11,fontWeight:700,cursor:"pointer"}}>{f.l}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {showLead&&<LeadModal onDone={()=>{setLeadDone(true);setShowLead(false);}} onSkip={()=>setShowLead(false)}/>}
    </div>
  );

  if(screen==="objective"&&selObj){
    const techs=TECHNIQUES.filter(t=>t.objectives.includes(selObj.id));
    const ig=selObj.gold||selObj.color===C.gold;
    const beat=BINAURAL[selObj.id];
    return(
      <div style={{background:C.navy,minHeight:"100vh",fontFamily:"'DM Sans',system-ui,sans-serif",color:C.white}}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0;}`}</style>
        <div style={{background:`linear-gradient(160deg,${ig?C.gold+"22":selObj.color+"28"},${C.navy2})`,padding:"18px 20px 16px",borderBottom:`1px solid ${ig?C.gold+"30":selObj.color+"28"}`}}>
          <button onClick={()=>setScreen("home")} style={{background:"transparent",border:"none",color:C.lgray,cursor:"pointer",fontSize:14,marginBottom:14,padding:0}}>← Volver</button>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:44,height:44,borderRadius:12,background:`${ig?C.gold:selObj.color}28`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:ig?C.gold:selObj.color}}>{selObj.icon}</div>
            <div>
              <div style={{fontSize:18,fontWeight:700}}>{selObj.label}</div>
              <div style={{fontSize:12,color:C.lgray}}>{techs.length} técnicas · {selObj.desc}</div>
            </div>
          </div>
          {audio.binaural&&beat&&(
            <div style={{marginTop:10,background:`${C.gold}14`,border:`1px solid ${C.gold}33`,borderRadius:8,padding:"7px 12px",display:"inline-flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:12}}>🎧</span>
              <span style={{fontSize:11,color:C.gold,fontWeight:600}}>{beat.label} — {beat.desc}</span>
            </div>
          )}
        </div>
        <div style={{padding:"16px 20px",display:"flex",flexDirection:"column",gap:9}}>
          {techs.map(t=><TechCard key={t.id} tech={t}/>)}
        </div>
      </div>
    );
  }

  if(screen==="technique"&&selTech){
    const phases=buildPhases(selTech),ac=selTech.goldAccent?C.gold:selTech.color;
    const beat=BINAURAL[selTech.objectives[0]];
    return(
      <div style={{background:C.navy,minHeight:"100vh",fontFamily:"'DM Sans',system-ui,sans-serif",color:C.white}}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0;}`}</style>
        <div style={{background:`linear-gradient(160deg,${ac}26,${C.navy2})`,padding:"18px 20px 20px",borderBottom:`1px solid ${ac}28`}}>
          <button onClick={()=>setScreen("home")} style={{background:"transparent",border:"none",color:C.lgray,cursor:"pointer",fontSize:14,marginBottom:14,padding:0}}>← Inicio</button>
          <div style={{fontSize:20,fontWeight:700,marginBottom:4}}>{selTech.name}</div>
          <div style={{fontSize:14,color:ac,fontWeight:600,marginBottom:12}}>{selTech.subtitle}</div>
          <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:10}}>
            {phases.map((p,i)=>(
              <div key={i} style={{background:`${ac}20`,border:`1px solid ${ac}44`,borderRadius:8,padding:"6px 10px",textAlign:"center"}}>
                <div style={{fontSize:10,color:C.lgray,textTransform:"uppercase",letterSpacing:"0.05em"}}>{p.label}</div>
                <div style={{fontSize:16,fontWeight:700,color:ac}}>{p.dur}s</div>
              </div>
            ))}
          </div>
          {audio.binaural&&beat&&(
            <div style={{background:`${C.gold}14`,border:`1px solid ${C.gold}33`,borderRadius:8,padding:"7px 12px",display:"inline-flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:12}}>🎧</span>
              <span style={{fontSize:11,color:C.gold,fontWeight:600}}>{beat.label} — {beat.desc}</span>
            </div>
          )}
        </div>
        <div style={{padding:"20px"}}>
          {selTech.warning&&<div style={{background:`${C.warn}15`,border:`1px solid ${C.warn}40`,borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:13,color:C.warn,fontWeight:600}}>⚠ {selTech.warning}</div>}
          <div style={{fontSize:11,color:ac,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8}}>Para qué sirve</div>
          <div style={{fontSize:14,color:C.lgray,lineHeight:1.75,marginBottom:20}}>{selTech.desc}</div>
          {selTech.instruction&&(<><div style={{fontSize:11,color:ac,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8}}>Instrucción especial</div><div style={{background:C.navy2,borderRadius:10,padding:"12px",fontSize:13,color:C.white,lineHeight:1.7,marginBottom:20,border:`1px solid ${ac}28`}}>{selTech.instruction}</div></>)}
          <div style={{fontSize:11,color:ac,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8}}>Cuándo usarla</div>
          <div style={{background:C.navy2,borderRadius:10,padding:"12px 14px",fontSize:13,color:C.white,lineHeight:1.7,marginBottom:24,border:`1px solid ${C.navy3}`}}>{selTech.cuando}</div>
          <div style={{fontSize:11,color:ac,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10}}>Duración</div>
          <div style={{display:"flex",gap:9,marginBottom:24}}>
            {TIME_OPTIONS.map(min=>(
              <button key={min} onClick={()=>setSelMin(min)} style={{flex:1,padding:"14px 6px",borderRadius:12,cursor:"pointer",fontFamily:"inherit",border:`2px solid ${selMin===min?ac:`${ac}30`}`,background:selMin===min?`${ac}22`:"transparent",transition:"all 0.2s"}}>
                <div style={{fontSize:22,fontWeight:700,color:selMin===min?ac:C.lgray}}>{min}</div>
                <div style={{fontSize:11,color:selMin===min?ac:C.lgray,marginTop:2}}>min</div>
              </button>
            ))}
          </div>
          <button onClick={()=>{startPractice(selTech,selMin);setScreen("practice");}} style={{width:"100%",padding:"16px",borderRadius:14,border:"none",background:`linear-gradient(135deg,${ac},${ac}aa)`,color:selTech.goldAccent?C.navy:C.white,fontSize:15,fontWeight:700,cursor:"pointer"}}>
            {audio.binaural?"🎧 ":""}Comenzar {selMin} minutos →
          </button>
        </div>
      </div>
    );
  }

  if(screen==="practice"&&selTech){
    const phases=buildPhases(selTech),progress=1-(total/(selMin*60)),ig=selTech.goldAccent;
    return(
      <div style={{background:C.navy,minHeight:"100vh",fontFamily:"'DM Sans',system-ui,sans-serif",color:C.white,display:"flex",flexDirection:"column",alignItems:"center"}}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0;}`}</style>
        <div style={{width:"100%",padding:"18px 20px 8px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <button onClick={goHome} style={{background:"transparent",border:"none",color:C.lgray,cursor:"pointer",fontSize:14,padding:0}}>← Salir</button>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:12,fontWeight:600,color:C.lgray}}>{selTech.name}</div>
            {activeBeat&&<div style={{fontSize:10,color:C.gold}}>🎧 {activeBeat.label}</div>}
          </div>
          <div style={{fontSize:13,color:ig?C.gold:C.teal,fontWeight:700}}>{fmt(total)}</div>
        </div>
        <div style={{width:"calc(100% - 40px)",height:3,background:C.navy3,borderRadius:2,marginBottom:6}}>
          <div style={{height:"100%",background:ig?C.gold:C.teal,borderRadius:2,width:`${progress*100}%`,transition:"width 0.5s linear"}}/>
        </div>
        {done?(
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:30,textAlign:"center",gap:18}}>
            <div style={{fontSize:56}}>🫁</div>
            <div style={{fontSize:22,fontWeight:700}}>Práctica completada</div>
            <div style={{fontSize:14,color:C.lgray}}>{selTech.name} · {selMin} min · {rounds} ciclos</div>
            <button onClick={()=>startPractice(selTech,selMin)} style={{padding:"14px 32px",borderRadius:12,border:"none",background:ig?C.gold:C.teal,color:C.navy,fontSize:15,fontWeight:700,cursor:"pointer"}}>Repetir</button>
            <button onClick={()=>setScreen("technique")} style={{padding:"14px 32px",borderRadius:12,border:`1.5px solid ${C.navy3}`,background:"transparent",color:C.white,fontSize:14,fontWeight:600,cursor:"pointer"}}>Cambiar duración</button>
            <button onClick={goHome} style={{padding:"10px",background:"transparent",border:"none",color:C.lgray,fontSize:13,cursor:"pointer"}}>Inicio</button>
          </div>
        ):(
          <>
            <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"16px 0",width:"100%"}}>
              <div style={{position:"relative",width:268,height:268,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:28}}>
                <div style={{position:"absolute",inset:0,borderRadius:"50%",background:`radial-gradient(circle,${pCol}14 0%,transparent 70%)`,transition:`all ${pDur}s ease-in-out`}}/>
                <div style={{position:"absolute",inset:12,borderRadius:"50%",border:`1px solid ${pCol}18`}}/>
                <div style={{width:248,height:248,borderRadius:"50%",background:`radial-gradient(circle at 38% 38%, ${pCol}3e 0%, ${pCol}0e 55%, transparent 100%)`,border:`2.5px solid ${pCol}`,transform:`scale(${scale})`,transition:`transform ${pDur}s ease-in-out, border-color ${pDur*0.4}s ease`,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",boxShadow:`0 0 50px ${pCol}16`}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.white,letterSpacing:"0.22em",opacity:0.9,marginBottom:4}}>{pLabel}</div>
                  <div style={{fontSize:42,fontWeight:300,color:pCol,lineHeight:1}}>{pCd}</div>
                </div>
              </div>
              <div style={{display:"flex",gap:7,marginBottom:16}}>
                {phases.map((p,i)=>(<div key={i} style={{width:i===phIdx?22:7,height:4,borderRadius:2,background:i===phIdx?(ig?C.gold:C.teal):C.navy3,transition:"width 0.3s"}}/>))}
              </div>
              {selTech.instruction&&pLabel!=="INHALA"&&(<div style={{fontSize:12,color:C.lgray,textAlign:"center",padding:"0 32px",marginBottom:10,lineHeight:1.6}}>{selTech.instruction}</div>)}
              <div style={{fontSize:12,color:C.lgray}}>Ciclo {rounds+1}</div>
            </div>
            <div style={{padding:"0 40px 44px",width:"100%",display:"flex",gap:14}}>
              <button onClick={()=>{setPaused(p=>{if(!p)clearInterval(tmrRef.current);else if(stRef.current)stRef.current.last=Date.now();return!p;});}} style={{flex:1,padding:"16px",borderRadius:14,border:`1.5px solid ${C.navy3}`,background:C.navy2,color:C.white,fontSize:22,cursor:"pointer"}}>{paused?"▶":"⏸"}</button>
              <button onClick={()=>{stopBg();setRunning(false);setScreen("technique");}} style={{flex:1,padding:"16px",borderRadius:14,border:`1.5px solid ${C.navy3}`,background:C.navy2,color:C.lgray,fontSize:14,fontWeight:600,cursor:"pointer"}}>Detener</button>
            </div>
          </>
        )}
      </div>
    );
  }
  return null;
}
