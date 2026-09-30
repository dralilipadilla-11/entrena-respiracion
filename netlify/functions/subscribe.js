import { getStore, connectLambda } from "@netlify/blobs";
import { sendToMailerLite } from "../lib/mailerlite.js";

const WA="https://chat.whatsapp.com/BC3ixtMLLaRFp2lNQ1HdFk";

// Cada registro se guarda primero en Netlify Blobs (store "registros") y después
// se manda a MailerLite. Si MailerLite falla, queda con ml_ok=false para reenviarlo.
export const handler=async(event)=>{
  if(event.httpMethod!=="POST")return{statusCode:405};
  let b;try{b=JSON.parse(event.body);}catch{return{statusCode:400};}
  const{name="",email="",phone="",lada="+52"}=b;
  if(!String(email).includes("@")&&!String(phone).replace(/\D/g,""))return{statusCode:400,body:JSON.stringify({success:false})};
  const wa=`${lada}${phone}`.replace(/\s/g,"");
  const em=(email&&email.includes("@"))?email.toLowerCase().trim():`wa${phone.replace(/\D/g,"")}@respira21.noemail`;
  const record={email:em,name:name.trim(),phone:wa,fecha:new Date().toISOString(),ml_ok:false,ml_error:null};
  const key=`${record.fecha.slice(0,10)}/${em}`;

  let store=null;
  try{connectLambda(event);store=getStore("registros");await store.setJSON(key,record);}
  catch(e){store=null;console.error("Blobs error:",e.message);}

  try{
    await sendToMailerLite(record);
    record.ml_ok=true;
    console.log("Added:",em);
  }catch(e){record.ml_error=e.message;console.error("ML error:",e.message);}

  if(store){try{await store.setJSON(key,record);}catch(e){console.error("Blobs update error:",e.message);}}
  return{statusCode:200,headers:{"Content-Type":"application/json"},body:JSON.stringify({success:true,waLink:WA})};
};
