const {ImapFlow}=require('imapflow');
const {simpleParser}=require('mailparser');
const base='https://pmtwrbgjzcxtjdjygxps.supabase.co', key='sb_publishable_lyGr71TWY7VpI73wPeJdMg_U6knl2s_', mailbox='hello@hawthornedigital.co.uk';
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store'); let client,lock;
 const fail=(n,error)=>res.status(n).json({error});
 try{
 if(!['GET','POST'].includes(req.method))return fail(405,'Method not allowed');
 const authorization=req.headers.authorization||''; if(!authorization.startsWith('Bearer '))return fail(401,'Authentication required');
 const headers={apikey:key,Authorization:authorization};
 const u=await fetch(base+'/auth/v1/user',{headers});if(!u.ok)return fail(401,'Invalid session');const user=await u.json();
 async function rows(path){const r=await fetch(base+'/rest/v1/'+path,{headers});if(!r.ok)throw Error('Permission lookup failed');return r.json();}
 const id=encodeURIComponent(user.id);const [staff]=await rows('admin_staff?user_id=eq.'+id+'&select=active');
 const [p]=await rows('mailbox_permissions?user_id=eq.'+id+'&mailbox=eq.'+encodeURIComponent(mailbox)+'&select=read_access,delete_access');
 if(!staff?.active||!p?.read_access)return fail(403,'Mailbox access denied');
 const q=req.method==='POST'?(typeof req.body==='string'?JSON.parse(req.body):req.body||{}):req.query||{};
 const action=q.action||'list', folder=q.folder||'inbox';
 if(!['inbox','trash'].includes(folder)||!(req.method==='GET'?['list','read']:['delete','restore']).includes(action))return fail(400,'Invalid action');
 if(req.method==='POST'&&!p.delete_access)return fail(403,'Deletion permission required');
 if(action==='delete'&&folder!=='inbox'||action==='restore'&&folder!=='trash')return fail(400,'Invalid source folder');
 if(!process.env.IMAP_HOST||!process.env.IMAP_PASSWORD||process.env.IMAP_USER!==mailbox)return fail(500,'Mailbox configuration incomplete');
 client=new ImapFlow({host:process.env.IMAP_HOST,port:Number(process.env.IMAP_PORT||993),secure:true,auth:{user:mailbox,pass:process.env.IMAP_PASSWORD},tls:{rejectUnauthorized:true},connectionTimeout:8000,greetingTimeout:8000,socketTimeout:15000,logger:false});client.on('error',()=>{});await client.connect();
 const folders=await client.list();const trash=folders.find(f=>f.specialUse==='\\Trash')?.path||folders.find(f=>['trash','deleted items','deleted messages'].includes(f.path.toLowerCase()))?.path;
 if((folder==='trash'||action==='delete')&&!trash)return fail(409,'Trash folder not found; no messages changed');
 lock=await client.getMailboxLock(folder==='trash'?trash:'INBOX',{readOnly:req.method==='GET'});
 const uidValidity=String(client.mailbox.uidValidity);
 if(action==='list'){
 const total=client.mailbox.exists,emails=[];const page=Math.max(1,Math.min(10000,Number(q.page)||1));const end=total-(page-1)*20;
 if(end>0)for await(const m of client.fetch(`${Math.max(1,end-19)}:${end}`,{uid:true,envelope:true,flags:true,internalDate:true}))emails.push({uid:m.uid,subject:m.envelope?.subject||'(No subject)',from:m.envelope?.from||[],date:m.envelope?.date||m.internalDate,read:m.flags?.has('\\Seen')||false});
 return res.json({success:true,emails:emails.reverse(),total,uidValidity,canDelete:!!p.delete_access});}
 const uid=Number(q.uid);if(!Number.isSafeInteger(uid)||uid<1||String(q.uidValidity)!==uidValidity)return fail(409,'Mailbox changed; refresh and try again');
 if(action==='read'){
 const meta=await client.fetchOne(uid,{size:true},{uid:true});if(!meta)return fail(404,'Message not found');if(meta.size>10*1024*1024)return fail(413,'Message exceeds the 10 MB viewer limit');
 const m=await client.fetchOne(uid,{source:true},{uid:true});if(!m?.source)return fail(404,'Message not found');const parsed=await simpleParser(m.source,{skipImageLinks:true});
 return res.json({success:true,subject:parsed.subject||'(No subject)',from:parsed.from?.text||'',to:parsed.to?.text||'',date:parsed.date,text:parsed.text||'(No readable text body)',attachments:parsed.attachments.map(a=>({name:a.filename||'Attachment',size:a.size}))});}
 if(!client.capabilities.has('MOVE'))return fail(409,'Server does not support safe MOVE; no messages changed');
 const moved=await client.messageMove(uid,action==='delete'?trash:'INBOX',{uid:true});if(!moved)return fail(409,'Message could not be moved');return res.json({success:true});
 }catch(e){console.error('Inbox API failure',{code:e.code||'UNKNOWN'});return fail(500,'Unable to connect to or retrieve emails');}finally{if(lock)lock.release();if(client)client.close();}
};
