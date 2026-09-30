const MAILERLITE="https://connect.mailerlite.com/api";

export async function sendToMailerLite(record){
  const KEY=process.env.MAILERLITE_API_KEY;
  if(!KEY)throw new Error("MAILERLITE_API_KEY no configurada");
  const h={"Content-Type":"application/json","Authorization":`Bearer ${KEY}`,"Accept":"application/json"};
  const gr=await fetch(`${MAILERLITE}/groups?filter[name]=RESPIRA&limit=25`,{headers:h});
  const gd=await gr.json();
  const grp=gd?.data?.find(g=>g.name==="RESPIRA 21"||g.name==="RESPIRA21");
  const payload={email:record.email,status:"active",fields:{name:record.name,last_name:"",phone:record.phone}};
  if(grp?.id)payload.groups=[grp.id];
  const sr=await fetch(`${MAILERLITE}/subscribers`,{method:"POST",headers:h,body:JSON.stringify(payload)});
  if(!sr.ok)throw new Error(`${sr.status} ${(await sr.text()).slice(0,500)}`);
  return true;
}
