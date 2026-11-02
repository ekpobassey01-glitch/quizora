const E={N:"quizora_exams",S:"quizora_subjects",Q:"quizora_questions",ST:"quizora_students",D:"quizora_devices",R:"quizora_results"};
async function sha256(s){const d=new TextEncoder().encode(s);const h=await crypto.subtle.digest("SHA-256",d);return [...new Uint8Array(h)].map(b=>b.toString(16).padStart(2,"0")).join("");}
function b64(s){return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");}
function un64(s){s=s.replace(/-/g,"+").replace(/_/g,"/");while(s.length%4)s+="=";return Uint8Array.from(atob(s),c=>c.charCodeAt(0));}
function enc(s){return new TextEncoder().encode(s);}
async function sign(p,secret){const k=await crypto.subtle.importKey("raw",enc(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const sig=await crypto.subtle.sign("HMAC",k,enc(p));return b64(String.fromCharCode(...new Uint8Array(sig)));}
async function checkPass(pass,hash){return (await sha256(pass))===hash || pass===hash;}
async function makeSession(v,secret){const p=b64(enc(JSON.stringify({...v,exp:Date.now()+28800000})));return p+"."+await sign(p,secret);}
async function getUser(req,env){try{const m=(req.headers.get("Cookie")||"").match(/quizora_session=([^;]+)/);if(!m)return null;const [p,s]=m[1].split(".");if(await sign(p,env.AUTH_SECRET)!==s)return null;const v=JSON.parse(new TextDecoder().decode(un64(p)));return v.exp>Date.now()?v:null;}catch{return null;}}
const out=(v,status=200,extra={})=>new Response(JSON.stringify(v),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store",...extra}});
const cookie=v=>`quizora_session=${v}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800`;
const page=s=>new Response(s,{headers:{"Content-Type":"text/html;charset=UTF-8"}});
async function read(req){try{return await req.json();}catch{return {};}}
const HTML=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>QUIZORA</title><style>*{box-sizing:border-box}body{margin:0;background:#f1f4fa;color:#17234a;font:15px Arial}header{background:#14275c;color:white;text-align:center;padding:18px}main{max-width:900px;margin:15px auto;padding:12px}.card{background:white;padding:16px;border-radius:12px;margin:12px 0;box-shadow:0 2px 8px #0001}input,select,button{width:100%;padding:11px;margin:5px 0;border:1px solid #ccd3df;border-radius:7px;font-size:15px}button{background:#183879;color:white;border:0;font-weight:bold;cursor:pointer}button.alt{background:#68748a}.hidden{display:none!important}.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:5px}.option{display:block;background:#f0f3f8;padding:10px;margin:7px 0;border-radius:7px}.small{font-size:12px;color:#65718a}.tabs{display:grid;grid-template-columns:1fr 1fr;gap:6px}.item{padding:9px;border-bottom:1px solid #ddd;overflow-wrap:anywhere}.danger{background:#a82735}.status{padding:10px;background:#eef3ff;border-radius:7px;margin:8px 0}</style></head><body><header><h1>QUIZORA</h1>Learn • Practise • Excel</header><main><section id="login" class="card"><h2>Student Login / Registration</h2><input id="fullname" placeholder="Full name"><input id="email" placeholder="Email (optional)"><input id="phone" placeholder="Phone number"><input id="password" type="password" placeholder="Password (minimum 6 characters)"><button id="studentLoginBtn">Continue as Student</button><hr><h3>Administrator Login</h3><input id="username" placeholder="Admin username"><input id="adminpassword" type="password" placeholder="Admin password"><button id="adminLoginBtn">Admin Login</button><p id="msg"></p></section><section id="student" class="hidden"><div class="card"><h2>Student Dashboard</h2><p id="welcome"></p><button class="alt" id="studentLogoutBtn">Logout</button></div><div class="card"><h3>Start CBT</h3><label>Examination</label><select id="exam"></select><label>Subject</label><select id="subject"></select><label>Number of questions</label><select id="count"><option>10</option><option>20</option><option>30</option><option>50</option><option>100</option></select><label>Duration in minutes</label><select id="duration"><option>15</option><option>30</option><option>45</option><option>60</option></select><button id="startBtn">Start Examination</button><p class="small">Questions 1-20 are free. Questions 21-1,000 require subscription.</p></div><div class="card"><h3>My Results</h3><div id="myresults"></div></div></section><section id="quiz" class="hidden"><div class="card"><div id="qmeta"></div><div id="qtext"></div><div id="opts"></div><div class="tabs"><button id="prevBtn" class="alt">Previous</button><button id="nextBtn">Next</button></div><button id="submitBtn" class="danger">Submit</button><div id="qgrid" class="grid"></div></div></section><section id="admin" class="hidden"><div class="card"><h2>Admin Dashboard</h2><button class="alt" id="adminLogoutBtn">Logout</button></div><div class="card"><h3>Exams</h3><input id="examName" placeholder="Exam name e.g. JAMB, WAEC"><button id="addExamBtn">Add Exam</button><div id="examList"></div></div><div class="card"><h3>Subjects</h3><select id="examForSubject"></select><input id="subjectName" placeholder="Subject name"><button id="addSubjectBtn">Add Subject</button><div id="subjectList"></div></div><div class="card"><h3>Questions</h3><select id="examForQuestion"></select><select id="subjectForQuestion"></select><textarea id="questionText" placeholder="Question text"></textarea><input id="optA" placeholder="Option A"><input id="optB" placeholder="Option B"><input id="optC" placeholder="Option C"><input id="optD" placeholder="Option D"><select id="correct"><option value="A">Correct: A</option><option value="B">Correct: B</option><option value="C">Correct: C</option><option value="D">Correct: D</option></select><button id="addQuestionBtn">Add Question</button><div id="questionList"></div></div><div class="card"><h3>Students & Devices</h3><div id="studentList"></div></div></section></main><script>
let USER=null,QUESTIONS=[],ANS=[],IDX=0,TIMER=null;
const $=id=>document.getElementById(id);
function show(s){['login','student','quiz','admin'].forEach(x=>$(x).classList.toggle('hidden',x!==s));}
async function api(p,m,b){const r=await fetch(p,{method:m||'GET',headers:{'Content-Type':'application/json'},body:b?JSON.stringify(b):undefined});return r.json();}
async function loadExams(){const d=await api('/api/exams');const o=d.exams||[];['exam','examForSubject','examForQuestion','examName'].forEach(id=>{const el=$(id);if(!el||el.tagName!=='SELECT')return;el.innerHTML=o.map(x=>`<option value="${x.id}">${x.name}</option>`).join('');});if(o.length)loadSubjects();}
async function loadSubjects(){const examId=$('exam').value||$('examForSubject').value||$('examForQuestion').value;if(!examId)return;const d=await api('/api/subjects?exam_id='+examId);const o=d.subjects||[];['subject','subjectForQuestion'].forEach(id=>{const el=$(id);if(!el)return;el.innerHTML=o.map(x=>`<option value="${x.id}">${x.name}</option>`).join('');});}
$('exam').addEventListener('change',loadSubjects);
$('examForSubject').addEventListener('change',loadSubjects);
$('examForQuestion').addEventListener('change',loadSubjects);
$('studentLoginBtn').onclick=async()=>{const fullname=$('fullname').value.trim(),phone=$('phone').value.trim(),password=$('password').value,email=$('email').value.trim();if(!fullname||!phone||!password){$('msg').textContent='Fill name, phone, password';return;}const dev=navigator.userAgent+'|'+screen.width;const r=await api('/api/student/login','POST',{fullname,phone,password,email,device_token:dev});$('msg').textContent=r.message||r.error||'';if(r.ok){USER=r.user; $('welcome').textContent='Welcome '+USER.fullname; show('student'); loadExams(); loadMyResults();}};
$('adminLoginBtn').onclick=async()=>{const username=$('username').value.trim(),password=$('adminpassword').value;const r=await api('/api/admin/login','POST',{username,password});$('msg').textContent=r.message||r.error||'';if(r.ok){USER=r.user; show('admin'); loadExams();}};
$('studentLogoutBtn').onclick=async()=>{await api('/api/logout','POST'); show('login');};
$('adminLogoutBtn').onclick=async()=>{await api('/api/logout','POST'); show('login');};
$('startBtn').onclick=async()=>{const exam_id=$('exam').value,subject_id=$('subject').value,count=parseInt($('count').value),duration=parseInt($('duration').value);if(!exam_id||!subject_id){alert('Select exam and subject');return;}const r=await api('/api/quiz/start','POST',{exam_id,subject_id,count});if(r.error){alert(r.error);return;}QUESTIONS=r.questions||[];ANS=new Array(QUESTIONS.length).fill(null);IDX=0;renderQ();show('quiz');let sec=duration*60;TIMER=setInterval(()=>{sec--; $('qmeta').textContent='Time left: '+Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0')+' | Q '+(IDX+1)+'/'+QUESTIONS.length; if(sec<=0){clearInterval(TIMER); submitQuiz();}},1000);};
function renderQ(){if(!QUESTIONS.length)return;const q=QUESTIONS[IDX];$('qtext').textContent=(IDX+1)+'. '+q.question_text;const opts=['A','B','C','D'];$('opts').innerHTML=opts.map(o=>`<label class="option"><input type="radio" name="opt" value="${o}" ${ANS[IDX]===o?'checked':''}> ${o}. ${q['option_'+o.toLowerCase()]}</label>`).join('');$('opts').querySelectorAll('input').forEach(i=>i.onchange=e=>ANS[IDX]=e.target.value);$('qgrid').innerHTML=QUESTIONS.map((_,i)=>`<button style="background:${ANS[i]?'#2e7d32':(i===IDX?'#183879':'#f0f3f8')};color:${ANS[i]||i===IDX?'white':'#17234a'};padding:6px" onclick="window.goQ(${i})">${i+1}</button>`).join('');}
window.goQ=i=>{IDX=i;renderQ();};
$('prevBtn').onclick=()=>{if(IDX>0){IDX--;renderQ();}};
$('nextBtn').onclick=()=>{if(IDX<QUESTIONS.length-1){IDX++;renderQ();}};
async function submitQuiz(){if(TIMER)clearInterval(TIMER);const exam_id=$('exam').value,subject_id=$('subject').value;const answers=QUESTIONS.map((q,i)=>({question_id:q.id,selected:ANS[i]}));const r=await api('/api/quiz/submit','POST',{exam_id,subject_id,answers});alert('Score: '+r.score+'/'+QUESTIONS.length); show('student'); loadMyResults();};
$('submitBtn').onclick=submitQuiz;
async function loadMyResults(){const d=await api('/api/my/results');$('myresults').innerHTML=(d.results||[]).map(r=>`<div class="item">${r.exam_name} - ${r.subject_name}: ${r.score}/${r.total} on ${r.created_at}</div>`).join('');}
$('addExamBtn').onclick=async()=>{const name=$('examName').value.trim();if(!name)return;await api('/api/admin/exams','POST',{name});$('examName').value='';loadExams();};
$('addSubjectBtn').onclick=async()=>{const exam_id=$('examForSubject').value,name=$('subjectName').value.trim();if(!name)return;await api('/api/admin/subjects','POST',{exam_id,name});$('subjectName').value='';loadSubjects();};
$('addQuestionBtn').onclick=async()=>{const exam_id=$('examForQuestion').value,subject_id=$('subjectForQuestion').value,question_text=$('questionText').value.trim(),option_a=$('optA').value.trim(),option_b=$('optB').value.trim(),option_c=$('optC').value.trim(),option_d=$('optD').value.trim(),correct_option=$('correct').value;if(!question_text)return;await api('/api/admin/questions','POST',{exam_id,subject_id,question_text,option_a,option_b,option_c,option_d,correct_option});$('questionText').value='';loadSubjects();};
(async()=>{const me=await api('/api/me');if(me.user){USER=me.user; if(USER.role==='admin'){show('admin');}else{$('welcome').textContent='Welcome '+USER.fullname; show('student'); loadMyResults();} loadExams();}else{show('login'); loadExams();}})();
</script></body></html>`;

export default {
async fetch(req,env){
const url=new URL(req.url);
const path=url.pathname;
if(path==="/"||path==="/index.html")return page(HTML);
if(path==="/api/me"){const u=await getUser(req,env);return out({user:u});}
if(path==="/api/logout"){return out({ok:true},{headers:{"Set-Cookie":`quizora_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`}});}
if(path==="/api/exams"){const {results}=await env.DB.prepare(`SELECT * FROM ${E.N} ORDER BY name`).all();return out({exams:results});}
if(path==="/api/subjects"){const exam_id=url.searchParams.get("exam_id");const {results}=await env.DB.prepare(`SELECT * FROM ${E.S} WHERE exam_id=? ORDER BY name`).bind(exam_id).all();return out({subjects:results});}
if(path==="/api/student/login"&&req.method==="POST"){
const {fullname,phone,password,email,device_token}=await read(req);
if(!fullname||!phone||!password)return out({error:"Missing fields"},400);
const dev=device_token||req.headers.get("User-Agent")||"unknown";
const dh=await sha256(dev);
let s=await env.DB.prepare(`SELECT * FROM ${E.ST} WHERE phone=?`).":cookie(sess)}});
}
}
if(path==="/api/admin/login"&&req.method==="POST"){
const {username,password}=await read(req);
const u=await env.DB.prepare("SELECT * FROM quizora_admins WHERE username=?").bind(username).first();
if(!u)return out({error:"Invalid admin"},401);
if(!(await checkPass(password,u.password_hash)))return out({error:"Invalid password"},401);
const sess=await makeSession({id:u.id,username:u.username,role:"admin"},env.AUTH_SECRET);
return out({ok:true,message:"Admin login successful",user:{username:u.username,role:"admin"}},{headers:{"Set-Cookie":cookie(sess)}});
}
if(path==="/api/quiz/start"&&req.method==="POST"){
const user=await getUser(req,env);if(!user)return out({error:"Not logged in"},401);
const {exam_id,subject_id,count}=await read(req);
let {results}=await env.DB.prepare(`SELECT * FROM ${E.Q} WHERE exam_id=? AND subject_id=? ORDER BY RANDOM() LIMIT ?`).bind(exam_id,subject_id,count||10).all();
if(!results.length){const r2=await env.DB.prepare(`SELECT * FROM ${E.Q} WHERE subject_id=? ORDER BY RANDOM() LIMIT ?`).bind(subject_id,count||10).all();results=r2.results;}
return out({questions:results});
}
if(path==="/api/quiz/submit"&&req.method==="POST"){
const user=await getUser(req,env);if(!user)return out({error
