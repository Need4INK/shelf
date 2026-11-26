/* Home: Latest Addition, ready-gate fade-in, banner sayings, offline + auto-update. Loaded after scene.js. */
/* ---------- latest addition card ---------- */
let BOOKS=[];
function newestBook(){return BOOKS.reduce((a,b)=>b&&(!a||(b.added||0)>(a.added||0))?b:a,null)}
function whenText(ms){
  if(!ms)return '';const d=new Date(ms),n=new Date(),day=864e5;
  const diff=Math.floor((new Date(n.getFullYear(),n.getMonth(),n.getDate())-new Date(d.getFullYear(),d.getMonth(),d.getDate()))/day);
  if(diff<=0)return 'Added today';if(diff===1)return 'Added yesterday';
  return 'Added '+d.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:d.getFullYear()===n.getFullYear()?undefined:'numeric'});
}
function renderGenres(){
  const n={};BOOKS.forEach(b=>{if(b.status==='wishlist')return;const g=GENRES.includes(b.genre)?b.genre:'Other';n[g]=(n[g]||0)+1});   // owned books only
  document.querySelectorAll('#genres .gc').forEach(c=>{const k=n[c.dataset.g]||0;c.querySelector('.gn').textContent=k;
    c.setAttribute('aria-label',c.dataset.g+', '+k+' book'+(k===1?'':'s'));
    const l=c.querySelector('.gl');l.style.fontSize='';let f=40;while(l.scrollWidth>111&&f>25){l.style.fontSize=--f+'px'}});
}
async function loadBooks(){
  BOOKS=await Store.all();
  // books from before genres: guess one once (she can change it on the book page)
  const todo=BOOKS.filter(b=>!GENRES.includes(b.genre));todo.forEach(b=>{b.genre=guessGenre(b)});
  renderLatest();renderWish();renderGenres();
  for(const b of todo)await Store.put(b).catch(()=>{});
}
function renderLatest(){
  const b=newestBook();
  const title=b?(b.title||'Untitled'):'No books yet';
  const tEl=document.getElementById('laTitle');tEl.textContent=title;
  tEl.style.fontSize='';let fs=35;while(tEl.scrollWidth>tEl.clientWidth&&fs>27){tEl.style.fontSize=--fs+'px'}   // long titles shrink a little, then …
  document.getElementById('laAuthor').textContent=b?((b.authors||[]).join(', ')||'Unknown author'):'Add your first book';
  document.getElementById('laWhen').textContent=b?whenText(b.added):'';
  setBook(document.getElementById('laBook'),b?{...b,title}:null);
}
/* ---------- Next to Collect: a random wishlist book, new each time Home opens ---------- */
let wishId=null,lastWish=null;
function pickWish(){const w=BOOKS.filter(b=>b.status==='wishlist');if(!w.length){wishId=null;return}
  const pool=w.length>1?w.filter(b=>b.id!==lastWish):w;wishId=pool[Math.floor(Math.random()*pool.length)].id;lastWish=wishId}
function renderWish(){
  let b=BOOKS.find(x=>x.id===wishId&&x.status==='wishlist');if(!b){pickWish();b=BOOKS.find(x=>x.id===wishId)}
  const title=b?(b.title||'Untitled'):'No wishes yet';
  const tEl=document.getElementById('wiTitle');tEl.textContent=title;
  tEl.style.fontSize='';let fs=35;while(tEl.scrollWidth>tEl.clientWidth&&fs>27){tEl.style.fontSize=--fs+'px'}
  document.getElementById('wiAuthor').textContent=b?((b.authors||[]).join(', ')||'Unknown author'):'Add a book to your wishlist';
  document.getElementById('wiNote').textContent=b?'On your wishlist':'';
  setBook(document.getElementById('wiBook'),b?{...b,title}:null);
}
document.querySelectorAll('#nook .cr-title,#nook .cr-author,#nook .la-when,#wiBook').forEach(e=>{e.style.cursor='pointer';e.addEventListener('click',()=>{
  if(wishId)location.href='book.html?id='+encodeURIComponent(wishId)})});
addEventListener('pageshow',()=>{wishId=null});   // coming back to Home: a new teaser
document.querySelectorAll('#reading .cr-title,#reading .cr-author,#reading .la-when,#laBook').forEach(e=>{e.style.cursor='pointer';e.addEventListener('click',()=>{
  const b=newestBook();if(b&&b.id)location.href='book.html?id='+encodeURIComponent(b.id)})});
const booksP=loadBooks();booksP.then(()=>Store.fetchMissingCovers());   // keep a copy of every cover on the phone
Store.onChange(loadBooks);{const ti=document.querySelector('#tabbar img');if(ti&&!ti.complete)ti.addEventListener('load',layoutCards);}layoutCards();if(document.fonts)document.fonts.ready.then(()=>{renderGenres();renderLatest();renderWish()});addEventListener('pageshow',loadBooks);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)loadBooks()});

/* ---------- show Home only when it's ready: pictures decoded, fonts, books (max 2.5 s) ---------- */
(function(){
  const urls=new Set(PICS.map(i=>i.src)),re=/url\(\s*['"]?([^'")]+)['"]?\s*\)/g;
  const add=t=>{let m;re.lastIndex=0;while((m=re.exec(t)))if(m[1].includes('img/'))urls.add(new URL(m[1],location.href).href)};
  document.querySelectorAll('img[src]').forEach(i=>{if(i.getAttribute('src'))urls.add(i.src)});
  for(const sh of document.styleSheets){try{for(const r of sh.cssRules)add(r.cssText)}catch(e){}}
  document.querySelectorAll('[style*="url("]').forEach(el=>add(el.getAttribute('style')));
  const pics=[...urls].map(u=>{const i=new Image();i.src=u;return (i.decode?i.decode():new Promise(r=>{i.onload=i.onerror=r})).catch(()=>{})});
  const fonts=document.fonts?document.fonts.ready.catch(()=>{}):null;
  const show=()=>requestAnimationFrame(()=>requestAnimationFrame(()=>document.documentElement.classList.add('ready')));
  Promise.race([Promise.all([...pics,fonts,booksP.catch(()=>{})]),new Promise(r=>setTimeout(r,2500))]).then(show);
})();

/* ---------- banner: a random magical saying (her list of 300, quotes.json) ---------- */
let QUOTES=null;
/* one line if it fits; otherwise two balanced lines, each with at least two words; shrinks the font only if needed */
const qCtx=document.createElement('canvas').getContext('2d');
function fitQuote(q){
  const text=(q.dataset.t||q.textContent).trim(),words=text.split(/\s+/),ff=getComputedStyle(q).fontFamily,maxW=584;
  const wd=t=>qCtx.measureText(t).width;let best=null,f=30;
  for(;f>=20;f--){qCtx.font=f+'px '+ff;
    if(wd(text)<=maxW){best=[text];break}
    let pick=null;for(let k=2;k<=words.length-2;k++){const a=words.slice(0,k).join(' '),b=words.slice(k).join(' '),m=Math.max(wd(a),wd(b));if(!pick||m<pick.m)pick={m,a,b}}
    if(pick&&pick.m<=maxW){best=[pick.a,pick.b];break}}
  if(!best){f=20;best=[text]}
  q.style.fontSize=f+'px';q.textContent='';
  best.forEach((t,i)=>{if(i)q.appendChild(document.createElement('br'));q.appendChild(document.createTextNode(t))});
}
function showQuote(){
  if(!QUOTES||!QUOTES.length)return;
  let last=-1;try{last=+(localStorage.getItem('home.quote')??-1)}catch(e){}
  let i;do{i=Math.floor(Math.random()*QUOTES.length)}while(QUOTES.length>1&&i===last);   // never the same one twice in a row
  try{localStorage.setItem('home.quote',i)}catch(e){}
  const q=document.getElementById('quote');q.style.opacity=0;
  setTimeout(()=>{q.dataset.t=QUOTES[i];fitQuote(q);q.style.opacity=1},q.textContent?350:0);
}
try{QUOTES=JSON.parse(localStorage.getItem('quotes.cache')||'null')}catch(e){}if(QUOTES)showQuote();   // saved copy: the saying is there at once
setTimeout(()=>fetch('quotes.json').then(r=>r.json()).then(a=>{const first=!QUOTES;QUOTES=a;try{localStorage.setItem('quotes.cache',JSON.stringify(a))}catch(e){}if(first)showQuote()}).catch(()=>{}),300);   // after the scene is up
// a new saying each time Home is entered: app opened, or back from another screen / app
addEventListener('pageshow',e=>{if(e.persisted)showQuote()});
if(document.fonts)document.fonts.ready.then(()=>{const q=document.getElementById('quote');if(q.dataset.t)fitQuote(q)});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)showQuote()});

/* ---------- offline + auto-update ---------- */
const APP_VERSION='home-63';
// a new version arrived: drop the saved pictures once so new art shows straight away
try{const v=localStorage.getItem('home.ver');
  if(v!==APP_VERSION){localStorage.setItem('home.ver',APP_VERSION);
    if(v&&'caches' in window)caches.open('shelf-v3').then(c=>c.keys().then(ks=>Promise.all(ks.filter(k=>/\.(png|jpe?g|webp|gif|svg)$/i.test(new URL(k.url).pathname)).map(k=>c.delete(k))))).then(d=>{if(d.length)location.reload()}).catch(()=>{})}}catch(e){}
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
async function checkUpdate(){
  try{
    const html=await (await fetch('./?check='+Date.now(),{cache:'no-store'})).text();
    const m=html.match(/name="app-version" content="([^"]+)"/);
    if(m&&m[1]!==APP_VERSION){let tried='';try{tried=sessionStorage.getItem('home.reloadFor')||''}catch(e){}
      if(tried!==m[1]){try{sessionStorage.setItem('home.reloadFor',m[1])}catch(e){}location.reload()}}
  }catch(e){}
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')checkUpdate()});
checkUpdate();
