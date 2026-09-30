import { getStore, connectLambda } from "@netlify/blobs";
import { sendToMailerLite } from "../lib/mailerlite.js";

// Corre cada hora (ver netlify.toml): reenvía a MailerLite los registros con ml_ok=false.
export const handler=async(event)=>{
  connectLambda(event);
  const store=getStore("registros");
  const{blobs}=await store.list();
  let ok=0,pendientes=0;
  for(const{key}of blobs){
    const rec=await store.get(key,{type:"json"});
    if(!rec||rec.ml_ok)continue;
    if(rec.email==="wa@respira21.noemail"){await store.delete(key);continue;} // registro vacío de prueba
    try{await sendToMailerLite(rec);rec.ml_ok=true;rec.ml_error=null;ok++;}
    catch(e){rec.ml_error=e.message;pendientes++;if(/^403 /.test(e.message)){await store.setJSON(key,rec);break;}}
    await store.setJSON(key,rec);
  }
  console.log("Reintento:",ok,"enviados,",pendientes,"pendientes");
  return{statusCode:200};
};
