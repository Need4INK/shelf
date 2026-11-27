/* Framed book: the book from the design, tinted with the cover's colour, cover in a gold frame.
   Use: <div class="bk"> markup (see bookFrameHTML) + setBook(el, book). Shared by every page. */
function bookFrameHTML(){return '<img class="bk-shadow" src="img/book.png" alt=""><div class="bk-tint"></div><img class="bk-shade" src="img/book_shade.png" alt=""><img class="bk-gold" src="img/book_gold.png" alt=""><div class="bk-frame"><img class="bk-cover" alt="" hidden><div class="bk-ph"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M24 6a14 14 0 1 0 10 24A11 11 0 1 1 24 6z" fill="#e9c873"/><path d="M31 9l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z" fill="#f6dc96"/></svg><span></span></div></div>'}
/* dominant colour of a cover: strongest hue family, weighted by how vivid it is */
function coverColor(img){
  const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d',{willReadFrequently:true});
  x.drawImage(img,0,0,32,32);const d=x.getImageData(0,0,32,32).data;
  const bins=Array.from({length:12},()=>({w:0,r:0,g:0,b:0}));let gr=0,gg=0,gb=0,n=0,vivid=0;
  for(let i=0;i<d.length;i+=4){const r=d[i],g=d[i+1],b=d[i+2],mx=Math.max(r,g,b),mn=Math.min(r,g,b),s=mx?(mx-mn)/mx:0,v=mx/255;
    gr+=r;gg+=g;gb+=b;n++;if(s<.25||v<.15)continue;vivid++;
    let h=mx===r?((g-b)/(mx-mn))%6:mx===g?(b-r)/(mx-mn)+2:(r-g)/(mx-mn)+4;h=(h*60+360)%360;
    const k=bins[Math.floor(h/30)],w=s*v;k.w+=w;k.r+=r*w;k.g+=g*w;k.b+=b*w}
  const best=bins.reduce((a,b)=>b.w>a.w?b:a);
  const hex=(r,g,b)=>'#'+[r,g,b].map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
  if(vivid<n*.12||!best.w)return hex(gr/n,gg/n,gb/n);         // mostly grey / black / white
  return hex(best.r/best.w,best.g/best.w,best.b/best.w);
}
/* the book's own colour: a deep, leather-like version of the cover's main colour */
function bookTint(hex){
  if(!hex)return null;
  const r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;
  const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;let h=0,s=0;
  if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?((g-b)/d+(g<b?6:0)):mx===g?(b-r)/d+2:(r-g)/d+4;h*=60}
  if(s<.12)return l>.6?'hsl(30 12% 70%)':'hsl(260 8% 24%)';      // white covers: pale cloth; grey/black: charcoal
  return `hsl(${Math.round(h)} ${Math.round(Math.min(.7,.3+s*.45)*100)}% ${l>.7?50:40}%)`;
}
function paintBook(el,hex){const t=bookTint(hex);if(t)el.style.setProperty('--tint',t);else el.style.removeProperty('--tint')}
/* store colour + metal on the book the first time we can read its cover */
function rememberLook(b,look){
  if(typeof Store==='undefined'||!b||!b.id)return;
  Store.get(b.id).then(k=>{if(k&&k.color!==look.color){k.color=look.color;return Store.put(k,false)}}).catch(()=>{});
}
function setBook(el,b){
  const im=el.querySelector('.bk-cover'),ph=el.querySelector('.bk-ph');
  ph.querySelector('span').textContent=b?(b.title||''):'';
  const look=c=>paintBook(el,c);
  const showPh=()=>{im.hidden=true;ph.hidden=false;look(null)};
  const key=b?(b.id||'')+'|'+(b.cover||''):'';el.dataset.cover=key;
  if(!(b&&b.cover)){im.removeAttribute('src');showPh();return}
  // saved colour first (instant)
  look(b.color||null);
  const show=url=>{
    if(el.dataset.cover!==key)return;
    im.onload=()=>{im.hidden=false;ph.hidden=true};
    // the cover saved on the phone failed: try the web address once
    im.onerror=()=>{if(url!==b.cover){show(b.cover)}else showPh()};
    if(im.getAttribute('src')!==url)im.src=url;else if(im.complete&&im.naturalWidth){im.hidden=false;ph.hidden=true}
    if(b.color)return;
    const probe=new Image();if(url===b.cover)probe.crossOrigin='anonymous';
    probe.onload=()=>{if(el.dataset.cover!==key)return;try{const c=coverColor(probe);look(c);rememberLook(b,{color:c})}catch(e){}};
    probe.src=url;
  };
  // the cover saved on the phone (works offline), else the web address
  if(typeof Store!=='undefined'&&b.id)Store.coverURL(b.id).then(u=>show(u||b.cover));else show(b.cover);
}
