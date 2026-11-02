export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/health") {
      return new Response(JSON.stringify({ ok: true, app: "Quizora" }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
    }
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>QUIZORA</title><style>body{margin:0;font-family:system-ui;background:#eef3ff;display:flex;align-items:center;justify-content:center;min-height:100vh}.card{background:#fff;padding:30px;border-radius:20px;box-shadow:0 10px 30px rgba(0,0,0,.1);max-width:400px;width:100%;text-align:center}h1{color:#0f6af0}.btn{display:block;padding:14px;background:#0f6af0;color:#fff;border-radius:12px;margin-top:12px;text-decoration:none;font-weight:700}</style></head><body><div class="card"><h1>QUIZORA</h1><p>CBT EXAMS PLATFORM - Live!</p><a class="btn" href="/api/health">API OK</a></div></body></html>`;
    return new Response(html, { headers: { "Content-Type": "text/html" } });
  }
}
