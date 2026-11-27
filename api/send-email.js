// Vercel Node function. No additional npm dependencies required.
const URL = 'https://pmtwrbgjzcxtjdjygxps.supabase.co';
const KEY = 'sb_publishable_lyGr71TWY7VpI73wPeJdMg_U6knl2s_';
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
 const html=b.branded===true?`<div style="font-family:Arial,sans-serif;color:#26324a;max-width:640px;margin:auto"><div style="background:#202b4c;color:white;padding:24px"><strong style="font-size:22px">Hawthorne Digital</strong></div><div style="padding:28px;line-height:1.7">${body}</div><div style="background:#eef3fc;padding:20px;font-size:13px">Hawthorne Digital<br><a href="https://www.hawthornedigital.co.uk">www.hawthornedigital.co.uk</a></div></div>`:`<div style="font-family:Arial,sans-serif;line-height:1.7">${body}</div>`;
 if(!process.env.RESEND_ADMIN_API_KEY) return res.status(503).json({error:'Email service not configured'});
 const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+process.env.RESEND_ADMIN_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:`Hawthorne Digital <${b.from}>`,to:b.to,...(lists[1].length?{cc:lists[1]}:{}),...(lists[2].length?{bcc:lists[2]}:{}),subject:b.subject,text:b.message,html})});
 if(!r.ok) return res.status(502).json({error:'Resend rejected the request. Check Resend logs.'});
 const result=await r.json();return res.status(200).json({id:result.id});
 }catch(e){return res.status(500).json({error:'Unable to process email request'});}
};
