const MAILERLITE="https://connect.mailerlite.com/api";
const WA="https://chat.whatsapp.com/BC3ixtMLLaRFp2lNQ1HdFk";
exports.handler=async(event)=>{
  if(event.httpMethod!=="POST")return{statusCode:405};
  const KEY=process.env.MAILERLITE_API_KEY;
  if(!KEY){console.error("No API key");return{statusCode:200,body:JSON.stringify({success:true,waLink:WA})};}
  let b;try{b=JSON.parse(event.body);}catch{return{statusCode:400};}
  const{name="",email="",phone="",lada="+52"}=b;
  const h={"Content-Type":"application/json","Authorization":`Bearer ${KEY}`,"Accept":"application/json"};
  try{
    const gr=await fetch(`${MAILERLITE}/groups?filter[name]=RESPIRA&limit=25`,{headers:h});
    const gd=await gr.json();
    const grp=gd?.data?.find(g=>g.name==="RESPIRA 21"||g.name==="RESPIRA21");
    const wa=`${lada}${phone}`.replace(/\s/g,"");
    const em=(email&&email.includes("@"))?email.toLowerCase().trim():`wa${phone.replace(/\D/g,"")}@respira21.noemail`;
    const payload={email:em,status:"active",fields:{name:name.trim(),last_name:"",phone:wa}};
    if(grp?.id)payload.groups=[grp.id];
    const sr=await fetch(`${MAILERLITE}/subscribers`,{method:"POST",headers:h,body:JSON.stringify(payload)});
    const sd=await sr.json();
    if(!sr.ok)console.error("ML error:",sr.status,JSON.stringify(sd));
    else console.log("Added:",em,"group:",grp?.id);
  }catch(e){console.error(e.message);}
  return{statusCode:200,headers:{"Content-Type":"application/json"},body:JSON.stringify({success:true,waLink:WA})};
};
