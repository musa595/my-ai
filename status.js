
function config() {
  const API = (process.env.OLLAMA_API_URL || "https://ollama.com/api").replace(/\/$/, "");
  const KEY = process.env.OLLAMA_API_KEY || "";
  const MODEL = process.env.OLLAMA_MODEL || "darealgriddy/myai";
  return { API, KEY, MODEL };
}

async function ollama(endpoint, body) {
  const {API, KEY} = config();
  if (!KEY) throw new Error("OLLAMA_API_KEY is not configured in Vercel.");
  const response = await fetch(API + endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + KEY
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(90000)
  });
  const raw = await response.text();
  let data = {};
  try { data = JSON.parse(raw); } catch {}
  if (!response.ok) throw new Error(data.error || `Ollama returned HTTP ${response.status}`);
  return data;
}
export default function handler(req, res) {
  const {KEY, MODEL} = config();
  res.status(200).json({
    ok: Boolean(KEY),
    model: MODEL,
    cloud: true,
    webSearch: Boolean(KEY)
  });
}
