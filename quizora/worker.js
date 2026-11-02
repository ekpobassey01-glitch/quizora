export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (url.pathname === "/api/health" || url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok", app: "Quizora CBT" }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>QUIZORA</title>
<style>body{margin:0;font-family:system-ui;background:#eef3ff;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}.card{background:#fff;padding:30px;border-radius:20px;box-shadow:0 10px 30px rgba(0,0,0,.1);max-width:420px;width:100%;text-align:center}h1{color:#0f6af0;font-size:32px}.btn{display:block;width:100%;padding:14px;background:#0f6af0;color:#fff;font-weight:700;border:none;border-radius:12px;margin-top:12px;cursor:pointer;text-decoration:none}.ok{margin-top:16px;color:#22a55e;font-weight:700}#quiz{margin-top:20px;text-align:left;display:none;background:#f5f7ff;padding:16px;border-radius:12px}</style>
</head><body><div class="card"><h1>QUIZORA</h1><p>CBT EXAMS PLATFORM - Live!</p>
<button class="btn" onclick="startExam()">Start Exam</button>
<a class="btn" style="background:#111" href="/api/health">Check API</a>
<div class="ok">✓ Deployed OK</div><div id="quiz"></div></div>
<script>
function startExam(){
 document.getElementById('quiz').style.display='block';
 document.getElementById('quiz').innerHTML='<h3>Sample Q: What is 2+2?</h3><button class=btn onclick="alert(\\'Correct!\\')">A) 4</button><button class=btn style=background:#444;margin-top:8px> B) 5</button>';
}
</script></body></html>`;
    return new Response(html, { headers: { "Content-Type": "text/html" } });
  }
}
