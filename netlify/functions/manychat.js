import { getStore, connectLambda } from "@netlify/blobs";
import { sendToMailerLite, ROLES_MC } from "../lib/mailerlite.js";

// Recibe el "External Request" de ManyChat cuando alguien deja su correo en el DM.
// Igual que subscribe.js: primero Blobs (store "registros"), después MailerLite; reintentar.js reenvía lo que falle.
// La respuesta trae las ligas para que ManyChat las muestre en el DM según el rol.
const RECURSOS={
  adulto:{guia:"https://entrena-respiracion.netlify.app/guia-entrena-tu-respiracion.pdf",grupo:"https://chat.whatsapp.com/BC3ixtMLLaRFp2lNQ1HdFk"},
  papa:{guia:"https://respiragym.netlify.app/guia-miofuncional-ninos.pdf",grupo:"https://chat.whatsapp.com/E0dbnTGLvwm8tkBNOBm7mt"},
  profesional:{guia:"https://entrena-respiracion.netlify.app/guia-entrena-tu-respiracion.pdf",grupo:"https://chat.whatsapp.com/L3XaABeR7y489sFOiJErP6"},
};
const APP="https://entrena-respiracion.netlify.app";
const QUIZ="https://quiz-escueladesueno.netlify.app";

const json=(statusCode,body)=>({statusCode,headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
const limpio=(v)=>String(v??"").trim();
// ManyChat manda el nombre del campo entre llaves cuando la variable viene vacía.
const valor=(v)=>{const s=limpio(v);return/^\{\{.*\}\}$/.test(s)?"":s;};

export const handler=async(event)=>{
  if(event.httpMethod!=="POST")return{statusCode:405};
  const TOKEN=process.env.MANYCHAT_TOKEN;
  if(!TOKEN||event.headers["x-ser-token"]!==TOKEN)return json(401,{ok:false});
  let b;try{b=JSON.parse(event.body);}catch{return json(400,{ok:false});}

  const email=valor(b.email).toLowerCase();
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))return json(400,{ok:false,error:"email"});
  const rol=ROLES_MC[valor(b.rol)]?valor(b.rol):"adulto";
  const record={email,name:valor(b.nombre),rol,canal:valor(b.canal)||"instagram",palabra:valor(b.palabra).toUpperCase(),
    manychat_id:valor(b.subscriber_id),fuente:"manychat",fecha:new Date().toISOString(),ml_ok:false,ml_error:null};
  const key=`${record.fecha.slice(0,10)}/${email}`;

  let store=null;
  try{connectLambda(event);store=getStore("registros");await store.setJSON(key,record);}
  catch(e){store=null;console.error("Blobs error:",e.message);}

  try{await sendToMailerLite(record);record.ml_ok=true;console.log("ManyChat added:",email,rol,record.palabra);}
  catch(e){record.ml_error=e.message;console.error("ML error:",e.message);}

  if(store){try{await store.setJSON(key,record);}catch(e){console.error("Blobs update error:",e.message);}}
  const r=RECURSOS[rol];
  return json(200,{ok:true,guia_url:r.guia,grupo_url:r.grupo,app_url:APP,quiz_url:QUIZ});
};
