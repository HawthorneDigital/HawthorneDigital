// Vercel Node function. No additional npm dependencies required.
const URL = 'https://pmtwrbgjzcxtjdjygxps.supabase.co';
const KEY = 'sb_publishable_lyGr71TWY7VpI73wPeJdMg_U6knl2s_';
function signature(from){
 const sender=['hello','kai','no-reply'].map(x=>x+'@hawthornedigital.co.uk').includes(from)?from:'hello@hawthornedigital.co.uk';
 const name=sender.startsWith('kai@')?'Kai Isenschmid':'Hawthorne Digital';
 return `<table role="presentation" style="width:100%;max-width:520px;border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;color:#202b4c" border="0" cellspacing="0" cellpadding="0"><tbody>
<tr><td style="font-size:20px;line-height:26px;font-weight:bold;color:#202b4c">${name}</td></tr>
<tr><td style="font-size:12px;line-height:19px;color:#2856b1;padding:3px 0 14px">Premium Websites Without the Premium Price.</td></tr>
<tr><td style="border-top:2px solid #2856b1;padding:12px 0 2px;font-size:12px;line-height:19px;overflow-wrap:anywhere"><strong style="color:#2856b1">E&nbsp; </strong><a style="color:#202b4c;text-decoration:none" href="mailto:${sender}">${sender}</a></td></tr>
<tr><td style="padding:2px 0 12px;font-size:12px;line-height:19px"><strong style="color:#2856b1">W&nbsp; </strong><a style="color:#202b4c;text-decoration:none" href="https://www.hawthornedigital.co.uk">www.hawthornedigital.co.uk</a></td></tr>
${sender.startsWith('no-reply@')?'<tr><td style="padding:0 0 12px;font-size:11px;line-height:16px;color:#68738a">This mailbox is not monitored. Please contact <a style="color:#2856b1" href="mailto:hello@hawthornedigital.co.uk">hello@hawthornedigital.co.uk</a> for assistance.</td></tr>':''}
<tr><td style="border-top:1px solid #e6eaf1;padding-top:12px;font-size:10px;line-height:15px;color:#68738a"><strong>CONFIDENTIALITY NOTICE</strong><br>This email and any attachments are intended for the named recipient only and may contain confidential information. If received in error, please notify the sender and delete it. Unauthorised use, disclosure or distribution is prohibited.<br><br>Hawthorne Digital is a company registered in England and Wales.<br>Company Registration Number: 17495537<br>Registered Office: Office 21513, 182-184 High Street North, East Ham, London, E6 2JA.</td></tr></tbody></table>`;
}
const signatureText=(from)=> (from.startsWith('kai@')?'Kai Isenschmid':'Hawthorne Digital')+'\nPremium Websites Without the Premium Price.\n'+from+'\nwww.hawthornedigital.co.uk'+(from.startsWith('no-reply@')?'\nThis mailbox is not monitored. Please contact hello@hawthornedigital.co.uk for assistance.':'')+'\n\nCONFIDENTIALITY NOTICE\nThis email and any attachments are intended for the named recipient only and may contain confidential information. If received in error, please notify the sender and delete it. Unauthorised use, disclosure or distribution is prohibited.\n\nHawthorne Digital is a company registered in England and Wales.\nCompany Registration Number: 17495537\nRegistered Office: Office 21513, 182-184 High Street North, East Ham, London, E6 2JA.';
module.exports = async function(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
 const token=req.headers.authorization;
 if(!token?.startsWith('Bearer ')) return res.status(401).json({error:'Sign in required'});
 try {
 const headers={apikey:KEY,Authorization:token};
 const auth=await fetch(URL+'/auth/v1/user',{headers});
 if(!auth.ok) return res.status(401).json({error:'Session expired'});
 const user=await auth.json();
 const p=await fetch(URL+'/rest/v1/admin_staff?select=active,role,email_access&user_id=eq.'+encodeURIComponent(user.id),{headers});
 if(!p.ok) return res.status(403).json({error:'Permission check failed'});
 const [staff]=await p.json();
 if(!staff?.active || !(staff.role==='super_admin'||staff.email_access)) return res.status(403).json({error:'Email access denied'});
 const b=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
 const senders=['hello','kai','no-reply'].map(x=>x+'@hawthornedigital.co.uk');
 const valid=x=>typeof x==='string'&&x.length<=254&&/^[^\s@,<>]+@[^\s@,<>]+\.[^\s@,<>]+$/.test(x);
 const lists=[b.to,b.cc||[],b.bcc||[]];
 if(!senders.includes(b.from)||!lists.every(a=>Array.isArray(a)&&a.every(valid))||!b.to.length||lists.flat().length>10||typeof b.subject!=='string'||!b.subject.trim()||b.subject.length>200||/[\r\n]/.test(b.subject)||typeof b.message!=='string'||!b.message.trim()||b.message.length>30000) return res.status(400).json({error:'Check sender, recipients, subject and message'});
 const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const body=esc(b.message).replace(/\r?\n/g,'<br>');
 const html=b.branded===true?`<div style="font-family:Arial,sans-serif;color:#26324a;max-width:640px;margin:auto"><div style="background:#202b4c;color:white;padding:24px"><strong style="font-size:22px">Hawthorne Digital</strong></div><div style="padding:28px;line-height:1.7">${body}</div><div style="background:white;padding:0 28px 28px">${signature(b.from)}</div></div>`:`<div style="font-family:Arial,sans-serif;line-height:1.7">${body}</div>`;
 if(!process.env.RESEND_ADMIN_API_KEY) return res.status(503).json({error:'Email service not configured'});
 const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+process.env.RESEND_ADMIN_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:`Hawthorne Digital <${b.from}>`,to:b.to,...(lists[1].length?{cc:lists[1]}:{}),...(lists[2].length?{bcc:lists[2]}:{}),subject:b.subject,text:b.branded===true?b.message+"\n\n"+signatureText(b.from):b.message,html})});
 if(!r.ok) return res.status(502).json({error:'Resend rejected the request. Check Resend logs.'});
 const result=await r.json();return res.status(200).json({id:result.id});
 }catch(e){return res.status(500).json({error:'Unable to process email request'});}
};
