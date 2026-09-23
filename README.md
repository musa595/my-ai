# My AI — GitHub → Render

Upload this folder to a GitHub repository exactly as-is. **Do not rename any files.**

## Files

- `server.js`
- `package.json`
- `.gitignore`
- `.env.example`
- `README.md`
- `public/index.html`
- `public/style.css`
- `public/app.js`

There is intentionally **no real `.env` file** in this GitHub package. The Ollama API key must be stored in Render Environment Variables.

## Render

Create a Render Web Service connected to this GitHub repository.

Build Command:
```text
npm install
```

Start Command:
```text
npm start
```

Environment Variables:

```text
OLLAMA_API_KEY = YOUR_NEW_OLLAMA_KEY
OLLAMA_MODEL = darealgriddy/myai
OLLAMA_API_URL = https://ollama.com/api
```

The browser never receives `OLLAMA_API_KEY`; `server.js` reads it from the Render environment.

## Keyboard

- Enter = send
- Shift+Enter = new line
- Ctrl+N = new chat

## Security

Do not commit a real `.env` file or an API key to GitHub.
The API key previously shared in chat should be rotated before production use.
