const $=s=>document.querySelector(s);
let messages=[], forceWeb=false;
let instructions=localStorage.getItem("myai_instructions")||"";
let chats=JSON.parse(localStorage.getItem("myai_chats")||"[]");

function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function linkify(s){return esc(s).replace(/(https?:\/\/[^\s<]+)/g,'<a target="_blank" rel="noopener" href="$1">$1</a>');}

function render(role,text,sources=[]){
  const e=document.createElement("div");
  e.className="msg "+role;
  const src=sources.length?`<div class="sources">${sources.map(x=>`<a class="source" target="_blank" rel="noopener" href="${esc(x.url)}">↗ ${esc(x.title)}</a>`).join("")}</div>`:"";
  e.innerHTML=`<div class="avatar">${role==="user"?"You":"✦"}</div><div class="bubble">${linkify(text)}${src}</div>`;
  $("#chat").appendChild(e); $("#chat").scrollTop=$("#chat").scrollHeight;
  return e;
}
function saveChat(){
  if(!messages.length)return;
  const title=messages.find(x=>x.role==="user")?.content?.slice(0,45)||"New chat";
  chats=[{title,messages:[...messages]},...chats.filter(x=>x.title!==title)].slice(0,30);
  localStorage.setItem("myai_chats",JSON.stringify(chats)); renderHistory();
}
function renderHistory(){
  const h=$("#history");h.innerHTML="";
  chats.forEach((c,i)=>{const b=document.createElement("div");b.className="hitem";b.textContent=c.title;b.onclick=()=>loadChat(i);h.appendChild(b)});
}
function loadChat(i){
  messages=chats[i].messages;$("#chat").innerHTML="";
  messages.forEach(m=>render(m.role,m.content,m.sources||[]));
}
function newChat(){
  messages=[];$("#chat").innerHTML=`<div class="welcome" id="welcome"><div class="bigLogo">✦</div><h1>What can I help with?</h1><p>Powered by your Ollama Cloud model.</p></div>`;
}
async function status(){
  try{
    const r=await fetch("/api/status");
    const d=await r.json();
    $("#status").textContent=d.ok?`● Cloud ready • ${d.model}`:"● Server key missing";
    $("#status").className=d.ok?"":"bad";
  }catch{
    $("#status").textContent="● Server offline";
    $("#status").className="bad";
  }
}
async function ask(){
  const input=$("#input"),send=$("#send"),text=input.value.trim();
  if(!text||send.disabled)return;
  $("#welcome")?.remove();input.value="";input.style.height="auto";
  messages.push({role:"user",content:text});render("user",text);send.disabled=true;
  const typing=render("assistant",forceWeb?"🌐 Searching the web…":"🧠 Thinking…");
  try{
    const webSearch=forceWeb||/\b(latest|today|current|news|weather|price|score|schedule|release|version|recent|2026|search|look up|web|update)\b/i.test(text);
    const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages,personalInstructions:instructions,webSearch})});
    const d=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(d.error||`Server error ${r.status}`);
    typing.remove();
    messages.push({role:"assistant",content:d.text,sources:d.sources||[]});
    render("assistant",d.text,d.sources||[]);
    saveChat();
  }catch(e){
    typing.remove();
    render("assistant","⚠️ "+e.message);
  }finally{send.disabled=false;input.focus()}
}
$("#form").onsubmit=e=>{e.preventDefault();ask()};
$("#input").oninput=e=>{e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,180)+"px"};
$("#input").onkeydown=e=>{
  if(e.ctrlKey&&!e.shiftKey&&!e.altKey&&e.key.toLowerCase()==="n"){e.preventDefault();newChat();return}
  if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();ask()}
};
$("#newChat").onclick=newChat;$("#clear").onclick=newChat;
$("#web").onclick=()=>{forceWeb=!forceWeb;$("#web").classList.toggle("active",forceWeb)};
$("#menu").onclick=()=>$("#sidebar").classList.toggle("open");
$("#instructionsBtn").onclick=()=>{$("#inst").value=instructions;$("#modal").classList.remove("hidden")};
$("#close").onclick=()=>$("#modal").classList.add("hidden");
$("#save").onclick=()=>{instructions=$("#inst").value.trim();localStorage.setItem("myai_instructions",instructions);$("#modal").classList.add("hidden")};
renderHistory();status();
