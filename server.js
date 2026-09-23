import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 10000);
const API = (process.env.OLLAMA_API_URL || "https://ollama.com/api").replace(/\/$/, "");
const KEY = process.env.OLLAMA_API_KEY || "";
const MODEL = process.env.OLLAMA_MODEL || "darealgriddy/myai";

app.use(express.json({limit:"2mb"}));
app.use(express.static(path.join(__dirname,"public")));

async function ollama(endpoint, body) {
  if (!KEY) throw new Error("OLLAMA_API_KEY is not configured on the server.");
  const r = await fetch(API + endpoint, {
    method:"POST",
    headers: {
      "Content-Type":"application/json",
      "Authorization":"Bearer " + KEY
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(90000)
  });
  const raw = await r.text();
  let data = {};
  try { data = JSON.parse(raw); } catch {}
  if (!r.ok) throw new Error(data.error || `Ollama returned HTTP ${r.status}`);
  return data;
}

app.get("/api/status", (_req,res) => {
  res.json({
    ok: Boolean(KEY),
    model: MODEL,
    cloud: true,
    webSearch: Boolean(KEY)
  });
});

app.post("/api/chat", async (req,res) => {
  try {
    const {messages=[], personalInstructions="", webSearch=false} = req.body || {};
    if (!Array.isArray(messages) || !messages.length)
      return res.status(400).json({error:"No messages supplied."});

    let sources = [];

    if (webSearch) {
      try {
        const lastUser = messages.filter(m=>m.role==="user").at(-1)?.content || "";
        const search = await ollama("/web_search", {
          query: lastUser,
          max_results: 8
        });
        sources = (search.results || []).map(x => ({
          title: x.title || x.url || "Source",
          url: x.url || "",
          snippet: x.content || x.snippet || ""
        }));
      } catch (e) {
        console.warn("Web search:", e.message);
      }
    }

    const research = sources.length
      ? "\n\nWEB RESEARCH:\n" + sources.map((s,i)=>
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
        {role:"system", content:system},
        ...messages.slice(-20).map(m=>({
          role:m.role === "assistant" ? "assistant" : "user",
          content:String(m.content || "")
        }))
      ],
      stream:false
    });

    res.json({
      text:data.message?.content || "No response generated.",
      sources
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({error:e.message || "AI request failed"});
  }
});

app.get("*", (_req,res) => {
  res.sendFile(path.join(__dirname,"public","index.html"));
});

app.listen(PORT,"0.0.0.0",()=> {
  console.log(`My AI listening on port ${PORT}`);
  console.log(`Model: ${MODEL}`);
});
