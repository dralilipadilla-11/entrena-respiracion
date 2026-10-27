const MAILERLITE="https://connect.mailerlite.com/api";

// Registros que llegan de ManyChat (fuente "manychat"): entran a "ManyChat" + el grupo de su rol.
export const ROLES_MC={
  adulto:{label:"Para mí",group:"ManyChat · Adultos"},
  papa:{label:"Para mi hijo/a",group:"ManyChat · Papás"},
  profesional:{label:"Terapeuta o médico",group:"ManyChat · Profesionales"},
};
const CAMPOS_MC=["rol","fuente","palabra_clave"];

export async function sendToMailerLite(record){
  const KEY=process.env.MAILERLITE_API_KEY;
  if(!KEY)throw new Error("MAILERLITE_API_KEY no configurada");
  const h={"Content-Type":"application/json","Authorization":`Bearer ${KEY}`,"Accept":"application/json"};
  let payload;
  if(record.fuente==="manychat"){
    const rol=ROLES_MC[record.rol]||ROLES_MC.adulto;
    await ensureFields(h,CAMPOS_MC);
    const groups=[await findGroup(h,"ManyChat",true),await findGroup(h,rol.group,true)].filter(Boolean);
    payload={email:record.email,status:"active",groups,
      fields:{name:record.name,rol:rol.label,fuente:`ManyChat · ${record.canal}`,palabra_clave:record.palabra}};
  }else{
    const gr=await fetch(`${MAILERLITE}/groups?filter[name]=RESPIRA&limit=25`,{headers:h});
    const gd=await gr.json();
    const grp=gd?.data?.find(g=>g.name==="RESPIRA 21"||g.name==="RESPIRA21");
    payload={email:record.email,status:"active",fields:{name:record.name,last_name:"",phone:record.phone}};
    if(grp?.id)payload.groups=[grp.id];
  }
  const sr=await fetch(`${MAILERLITE}/subscribers`,{method:"POST",headers:h,body:JSON.stringify(payload)});
  if(!sr.ok)throw new Error(`${sr.status} ${(await sr.text()).slice(0,500)}`);
  return true;
}

async function findGroup(h,name,create){
  const gr=await fetch(`${MAILERLITE}/groups?filter[name]=${encodeURIComponent(name)}&limit=25`,{headers:h});
  const gd=await gr.json();
  const found=gd?.data?.find(g=>g.name===name);
  if(found)return found.id;
  if(!create)return null;
  const cr=await fetch(`${MAILERLITE}/groups`,{method:"POST",headers:h,body:JSON.stringify({name})});
  if(!cr.ok){console.error("No se pudo crear el grupo",name,cr.status);return null;}
  return(await cr.json())?.data?.id||null;
}

// MailerLite ignora los campos que no existen: se crean la primera vez.
async function ensureFields(h,keys){
  const fr=await fetch(`${MAILERLITE}/fields?limit=100`,{headers:h});
  const existing=new Set(((await fr.json())?.data||[]).map(f=>f.key));
  for(const k of keys){
    if(existing.has(k))continue;
    const cr=await fetch(`${MAILERLITE}/fields`,{method:"POST",headers:h,body:JSON.stringify({name:k,type:"text"})});
    if(!cr.ok)console.error("No se pudo crear el campo",k,cr.status);
  }
}
