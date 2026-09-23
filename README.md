# My AI — Vercel + Ollama Cloud

Vercel-ready version of My AI.

## GitHub / Vercel

Upload the contents of this folder to the GitHub repository connected to Vercel.

Keep these files/folders exactly:
- index.html
- style.css
- app.js
- api/chat.js
- api/status.js
- package.json
- .gitignore
- .env.example

Vercel environment variables:
- OLLAMA_API_KEY = your NEW Ollama Cloud key
- OLLAMA_MODEL = darealgriddy/myai
- OLLAMA_API_URL = https://ollama.com/api

Do not upload a real .env file or an API key to GitHub.

The browser talks to /api/chat and /api/status. Those Vercel Functions call Ollama Cloud server-side.
