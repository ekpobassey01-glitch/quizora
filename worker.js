export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (url.pathname === "/api/health") {
      return new Response(JSON.stringify({ status: "ok", app: "Quizora CBT" }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>QUIZORA - CBT EXAMS PLATFORM</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:system-ui}
body{background:#0f172a;color:white;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.card{background:#1e293b;padding:32px;border-radius:16px;max-width:480px;width:100%;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.3)}
h1{font-size:28px;margin-bottom:8px;color:#38bdf8}
p{color:#94a3b8;margin-bottom:24px}
.btn{display:block;width:100%;padding:14px;background:#38bdf8;color:#0f172a;font-weight:700;border:none;border-radius:10px;font-size:16px;cursor:pointer;margin-bottom:12px;text-decoration:none}
.btn2{background:#334155;color:white}
.status{margin-top:16px;font-size:13px;color:#22c55e}
</style>
</head>
<body>
<div class="card">
<h1>QUIZORA</h1>
<p>CBT EXAMS PLATFORM - Now Live!</p>
<a class="btn" href="#" onclick="startExam()">Start CBT Exam</a>
<a class="btn btn2" href="/api/health">Check API Status</a>
<div class="status">✅ Worker Deployed Successfully - ${new Date().toLocaleString()}</div>
<div id="quiz" style="margin-top:20px;text-align:left;display:none"></div>
</div>
<script>
function startExam(){
  const q=document.getElementById('quiz');
  q.style.display='block';
  q.innerHTML='<h3 style=margin-bottom:12px>Sample Question:</h3><p>What is 2+2?</p><button class=btn onclick
