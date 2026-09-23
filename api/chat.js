
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
export const maxDuration = 60;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({error: "Method not allowed"});
  }

  try {
    const {messages = [], personalInstructions = "", webSearch = false} = req.body || {};
    if (!Array.isArray(messages) || !messages.length) {
      return res.status(400).json({error: "No messages supplied."});
    }

    const {MODEL} = config();
    let sources = [];

    if (webSearch) {
      try {
        const lastUser = messages.filter(m => m.role === "user").at(-1)?.content || "";
        const search = await ollama("/web_search", {
          query: lastUser,
          max_results: 8
        });
        sources = (search.results || []).map(x => ({
          title: x.title || x.url || "Source",
          url: x.url || "",
          snippet: x.content || x.snippet || ""
        })).filter(x => x.url);
      } catch (e) {
        console.warn("Web search failed:", e.message);
      }
    }

    const research = sources.length
      ? "\n\nWEB RESEARCH:\n" + sources.map((s,i) =>
          `[Source ${i+1}] ${s.title}\nURL: ${s.url}\n${s.snippet}`
        ).join("\n\n")
      : "";

    const system = `You are My AI, a friendly, natural, helpful assistant.
Be conversational rather than robotic.
Be accurate and say when you are uncertain.
Follow the user's Personal Instructions.
${research ? `Use the supplied web research as evidence. Compare sources where useful and never invent sources.${research}` : ""}

PERSONAL INSTRUCTIONS:
${personalInstructions || "(none)"}`;

    const data = await ollama("/chat", {
      model: MODEL,
      messages: [
        {role: "system", content: system},
        ...messages.slice(-20).map(m => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: String(m.content || "")
        }))
      ],
      stream: false
    });

    return res.status(200).json({
      text: data.message?.content || "No response generated.",
      sources
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({error: e.message || "AI request failed"});
  }
}
