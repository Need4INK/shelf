/* Home: the animated scene — layout/fit, sky, castle, flyers, candle, wand, pumpkin, cat, ghost, sun, frame loop.
   Shares globals with home.js (classic scripts, loaded in order: store.js, book-frame.js, scene.js, home.js). */
const W=852,H=400,FW=150,FH=170,WICK={x:75,y:156}; // wick in flame-canvas coords
const stage=document.getElementById('stage'),sky=document.getElementById('sky'),fl=document.getElementById('flame');
const pkLight=document.getElementById('pkLight'),pkGlow=document.getElementById('pkGlow');
const glow=document.getElementById('glow');
const sx=sky.getContext('2d'),fx=fl.getContext('2d');
let S=1,SKYX=0;
// the stage starts below the iPhone's notch / Dynamic Island; the sky colour fills the strip above it
const probe=document.createElement('div');probe.style.cssText='position:fixed;top:0;height:env(safe-area-inset-top,0px);width:0;visibility:hidden';document.body.appendChild(probe);

/* the three cards share the space between the round-button bar and the tab bar, on any phone */
function layoutCards(){
  const tb=document.getElementById('tabbar'),img=tb&&tb.querySelector('img');
  if(!img||!img.offsetHeight||!S)return;
  const safeTop=probe.offsetHeight||0;
  const tabTop=img.getBoundingClientRect().top+img.offsetHeight*10/171;   // painted top edge of the tab bar
  const avail=(tabTop-safeTop)/S;
  const BAR=693;                                                          // bar's painted bottom
  let G=14,H=(avail-BAR-4*G)/3;
  if(H<210){G=8;H=(avail-BAR-4*G)/3}                                      // small phones (SE): tighter gaps
  H=Math.max(185,Math.min(330,H));
  const c1=BAR+G,c2=c1+H+G,c3=c2+H+G;
  const r=document.getElementById('reading'),hb=H*259/240;
  r.style.top=(c1-7*hb/259)+'px';r.style.height=hb+'px';r.style.setProperty('--bk',(143*hb/246)+'px');
  const n=document.getElementById('nook');n.style.top=c2+'px';n.style.height=H+'px';n.style.setProperty('--bk',(143*hb/246)+'px');
  const g=document.getElementById('genres'),f=.4014,he=H+27*f;
  g.style.top=(c3-10*f)+'px';g.style.height=he+'px';
  const band=he-6.8-50.2,tt=(band-146.9)/2,sc=Math.min(1,(band-12)/146.9);   // centre tiles; shrink a little on small phones
  g.querySelectorAll('.gc').forEach(c=>{c.style.top=tt+'px';c.style.transform=sc<1?`scale(${sc.toFixed(3)})`:''});
}
function fit(){
  const top=probe.offsetHeight||0,vw=innerWidth,vh=innerHeight-top;S=Math.max(vw/852,vh/1810);
  stage.style.transform=`translateX(-50%) scale(${S})`;document.documentElement.style.setProperty('--S',S);
  const d=Math.min(devicePixelRatio||1,3)*S;
  const ext=Math.max(0,(probe.offsetHeight||0)/S);SKYX=ext;
  sky.style.top=(-ext)+'px';sky.style.height=(H+ext)+'px';
  sky.width=Math.round(W*d);sky.height=Math.round((H+ext)*d);sx.setTransform(d,0,0,d,0,ext*d);
  fl.width=Math.round(FW*d);fl.height=Math.round(FH*d);fx.setTransform(d,0,0,d,0,0);
  if(window.__fxResize)window.__fxResize(d);
  layoutCards();
  const cn=document.getElementById('canopy');if(cn){const hh=Math.max(60,top/S);cn.style.top=(-hh)+'px';cn.style.height=(hh+80)+'px'}   // arch fills exactly the strip above the scene
}
addEventListener('resize',fit);addEventListener('orientationchange',()=>setTimeout(fit,300));addEventListener('pageshow',()=>{fit();setTimeout(fit,400)});
if(window.visualViewport)visualViewport.addEventListener('resize',fit);
fit();setTimeout(fit,500);setTimeout(fit,1500);   // iOS can settle the screen size a moment after launch

/* ---------- helpers ---------- */
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ss=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t)};
const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const rgb=(c,a=1)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const noise=t=>Math.sin(t*1.7)*.5+Math.sin(t*3.1+1.3)*.3+Math.sin(t*7.3+.4)*.2;

/* palette keyframes by hour: skyTop, skyBottom, far mountains, hills, castle, castle light, haze */
const K=[
 [0,  '#0c0422','#2e1150','#241047','#161430','#26103f','#3a1d5c','#3a1a60'],
 [4.6,'#130631','#3b1a5e','#2a1450','#1a0c34','#2a1244','#40205f','#432068'],
 [5.8,'#2d1652','#b4527c','#4b2a6c','#2c2a46','#3c2258','#9a4c78','#a04c7c'],
 [6.6,'#45418e','#f5a46a','#7a5a92','#4a5240','#5b4478','#f0a070','#e9a27c'],
 [8,  '#4f84cc','#f2d8b4','#8d9cc4','#5a8c46','#7d78a8','#f4dcb8','#d9d4e6'],
 [12, '#3f8ad6','#bfe2f6','#93acd2','#62a04a','#8a86b6','#ffffff','#cfe2f2'],
 [16.6,'#5384c6','#f1d2a6','#8f9cc2','#5a8e44','#7f76a6','#f8d8a8','#e4d2c4'],
 [18, '#6a4b9c','#ff9b58','#7a5a90','#5a6038','#5e4274','#ffa060','#f0a070'],
 [19, '#381c66','#c54e7a','#4d2c70','#2a2a40','#3a1f56','#a64a74','#a24a78'],
 [20.2,'#190a3a','#4a2369','#2c1652','#1b0d36','#2a1344','#432262','#43226a'],
 [22, '#0d0524','#30124f','#241047','#170a2e','#26103f','#3a1d5c','#3a1a60'],
 [24, '#0c0422','#2e1150','#241047','#170a2e','#26103f','#3a1d5c','#3a1a60']
].map(r=>[r[0],...r.slice(1).map(hex)]);
function pal(h){
  let i=0;while(K[i+1][0]<=h)i++;
  const a=K[i],b=K[i+1],t=ss(0,1,(h-a[0])/(b[0]-a[0]));
  return a.slice(1).map((c,j)=>mix(c,b[j+1],t));
}

/* ---------- static scene data ---------- */
const stars=[];for(let i=0;i<150;i++)stars.push({x:rnd()*W,y:rnd()*330,r:rnd()*1.3+.3,p:rnd()*6.3,s:.6+rnd()*2,g:rnd()<.12});
const clouds=[];for(let i=0;i<6;i++){const c={x:rnd()*1100-120,y:40+rnd()*140,v:3+rnd()*5,p:[]};const n=4+(rnd()*4|0);for(let j=0;j<n;j++)c.p.push([j*22-n*11+rnd()*10,rnd()*12-6,18+rnd()*20]);clouds.push(c)}
const ridge=(y0,amp,step,seedv)=>{seed=seedv;const p=[];for(let x=-20;x<=W+20;x+=step)p.push([x,y0-rnd()*amp]);return p};
const far=ridge(250,80,46,31);
// near hills: low in the middle so the castle stays clear, rising toward the right edge
const mid=[[-20,250],[100,256],[300,270],[420,281],[470,289],[520,295],[600,297],[680,292],[740,278],[800,264],[872,256]];
const ridgeY=x=>{for(let i=1;i<mid.length;i++)if(x<=mid[i][0]){const a=mid[i-1],b=mid[i],k=(x-a[0])/(b[0]-a[0]);return a[1]+(b[1]-a[1])*(k*k*(3-2*k))}return mid[mid.length-1][1]};
seed=91;const blades=[];for(let x=-10;x<=W+10;x+=2.2)blades.push({x:x+rnd()*1.5,h:4+rnd()*7,l:(rnd()-.5)*3,p:rnd()*6,d:rnd()<.5});
// castle: towers [x, width, top, roofHeight]
const towers=[[455,16,205,40],[488,24,150,58],[530,60,120,80],[612,26,140,58],[662,20,190,42],[702,15,215,34],[420,12,240,26]];
const wins=[[552,165],[568,165],[560,205],[497,190],[621,182],[505,230],[620,235],[560,245],[669,222],[462,232],[588,262],[532,262],[706,240]];
seed=11;const winP=wins.map(()=>rnd()*9);

/* ---------- painted castle (falls back to the drawn one until loaded) ---------- */
const CX=401,CY=28,CW=328,CH=320;
const PICS=[];const img=src=>{const i=new Image();i.src=src;PICS.push(i);return i};
const cShape=img('img/castle_shape.png'),cDay=img('img/castle_day.webp'),cLa=img('img/castle_lights_a.png'),cLb=img('img/castle_lights_b.png');
const ready=i=>i.complete&&i.naturalWidth>0;
const oc=document.createElement('canvas');oc.width=CW*2;oc.height=CH*2;const o=oc.getContext('2d');
function drawCastleImg(c,P,day,night,warm,t){
  const w=oc.width,h=oc.height;
  o.globalAlpha=1;o.globalCompositeOperation='source-over';o.clearRect(0,0,w,h);
  o.drawImage(cShape,0,0,w,h);o.globalCompositeOperation='source-in';o.fillStyle=rgb(P[4]);o.fillRect(0,0,w,h); // night silhouette in scene colour
  o.globalCompositeOperation='source-over';
  if(day>0&&ready(cDay)){o.globalAlpha=day;o.drawImage(cDay,0,0,w,h);o.globalAlpha=1}
  o.globalCompositeOperation='source-atop';
  if(day>0){o.fillStyle=rgb(P[5],.38*warm*day);o.fillRect(0,0,w,h)} // golden-hour warmth
  o.fillStyle=rgb(P[6],.16);o.fillRect(0,0,w,h);                      // a touch of distance haze
  o.globalCompositeOperation='source-over';
  c.drawImage(oc,CX,CY,CW,CH);
  if(night>.01){
    c.globalAlpha=night*clamp(.78+.22*noise(t*2.1));if(ready(cLa))c.drawImage(cLa,CX,CY,CW,CH);
    c.globalAlpha=night*clamp(.78+.22*noise(t*2.6+5));if(ready(cLb))c.drawImage(cLb,CX,CY,CW,CH);
    c.globalAlpha=1;
  }
}
/* ---------- drawing ---------- */
function smoothRidge(c,pts,base){c.beginPath();c.moveTo(pts[0][0],base);c.lineTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i];c.quadraticCurveTo(a[0],a[1],(a[0]+b[0])/2,(a[1]+b[1])/2)}
  c.lineTo(pts[pts.length-1][0],base);c.closePath()}
function body(c,y,col,litCol,lit){
  const g=c.createLinearGradient(0,40,0,300);g.addColorStop(0,rgb(mix(col,litCol,lit*.55)));g.addColorStop(1,rgb(col));return g;
}
function drawCastle(c,P,lit,night,t){
  const col=P[4],lc=P[5];c.fillStyle=body(c,0,col,lc,lit);
  // walls with crenellations
  c.beginPath();c.rect(415,250,315,80);
  for(let x=417;x<728;x+=12)c.rect(x,243,7,8);
  c.rect(520,210,100,45);for(let x=522;x<618;x+=11)c.rect(x,203,6,8);
  c.fill();
  for(const [x,w,top,rh] of towers){
    c.beginPath();c.rect(x,top,w,330-top);c.fill();
    c.beginPath();c.moveTo(x-4,top+2);c.lineTo(x+w/2,top-rh);c.lineTo(x+w+4,top+2);c.closePath();c.fill();
    c.fillRect(x+w/2-.6,top-rh-12,1.2,12);
    // little pennant
    const f=Math.sin(t*3+x)*2;c.beginPath();c.moveTo(x+w/2,top-rh-12);c.lineTo(x+w/2+9,top-rh-9+f*.3);c.lineTo(x+w/2,top-rh-6);c.fill();
  }
  // shaded side of towers
  c.fillStyle=rgb([10,2,24],.18+.1*night);
  for(const [x,w,top] of towers)c.fillRect(x+w*.62,top,w*.38,330-top);
  // windows
  for(let i=0;i<wins.length;i++){
    const [x,y]=wins[i],on=night*clamp(.75+.25*noise(t*2+winP[i]));
    c.fillStyle=on>.05?rgb([255,205,110],on):rgb(mix(col,[0,0,0],.4));
    c.beginPath();c.moveTo(x-2.5,y+8);c.lineTo(x-2.5,y+2);c.arc(x,y+2,2.5,Math.PI,0);c.lineTo(x+2.5,y+8);c.fill();
    if(on>.05){const g=c.createRadialGradient(x,y+4,0,x,y+4,12);g.addColorStop(0,rgb([255,190,90],.35*on));g.addColorStop(1,'rgba(255,190,90,0)');c.fillStyle=g;c.fillRect(x-12,y-8,24,24)}
  }
}
/* real moon phase: age in days since a known new moon (6 Jan 2000, 18:14 UTC) */
const SYNODIC=29.530588853,NEW0=Date.UTC(2000,0,6,18,14);
function moonPhase(when){const age=(((when-NEW0)/864e5)%SYNODIC+SYNODIC)%SYNODIC;const ph=age/SYNODIC*2*Math.PI;return {age,ph,lit:(1-Math.cos(ph))/2}}
window.__moon=()=>moonPhase(Date.now());
function drawMoon(c,x,y,a,P){
  if(a<=0)return;const m=moonPhase(Date.now());
  c.save();c.globalAlpha=a;c.translate(x,y);c.scale(1.25,1.25);c.translate(-x,-y);
  let g=c.createRadialGradient(x,y,40,x,y,150);g.addColorStop(0,`rgba(255,220,150,${(.08+.27*m.lit).toFixed(3)})`);g.addColorStop(1,'rgba(255,220,150,0)');c.fillStyle=g;c.fillRect(x-150,y-150,300,300);
  g=c.createRadialGradient(x-14,y-14,6,x,y,52);g.addColorStop(0,'#fff3c4');g.addColorStop(.7,'#f6d58c');g.addColorStop(1,'#e2b265');
  c.fillStyle=g;c.beginPath();c.arc(x,y,50,0,7);c.fill();
  c.fillStyle='rgba(190,140,80,.28)';for(const [dx,dy,r] of [[-14,-10,9],[12,6,12],[-4,20,6],[20,-18,5],[-24,12,5]]){c.beginPath();c.arc(x+dx,y+dy,r,0,7);c.fill()}
  // shadow over the unlit part (lit on the right while waxing, on the left while waning)
  // the terminator is never drawn as a straight line: near a half moon it keeps a gentle curve,
  // and its edge is softened by layering a few slightly different shadows
  const R=50.5,wax=m.ph<Math.PI,N=40;let k=Math.cos(m.ph);
  const crescentSide=wax?m.ph<Math.PI/2:m.ph>Math.PI*1.5;           // less than half lit
  if(Math.abs(k)<.28)k=crescentSide?.28:-.28;
  if(m.lit<.995){
    c.save();c.beginPath();c.arc(x,y,R,0,7);c.clip();
    const col=mix(P[0],[20,10,40],.35);
    for(let j=0;j<9;j++){
      const kk=k+(j-4)*.035,L=[],Rt=[];
      for(let i=0;i<=N;i++){const yy=-R+2*R*i/N,w=Math.sqrt(Math.max(0,R*R-yy*yy));
        if(wax){L.push([-w-2,yy]);Rt.push([kk*w,yy])}else{L.push([-kk*w,yy]);Rt.push([w+2,yy])}}
      c.beginPath();L.forEach(([px,py],i)=>i?c.lineTo(x+px,y+py):c.moveTo(x+px,y+py));for(let i=N;i>=0;i--)c.lineTo(x+Rt[i][0],y+Rt[i][1]);c.closePath();
      c.fillStyle=rgb(col,.23);c.fill();            // nine layers build up to a soft, faintly see-through shadow
    }
    c.restore();
  }
  c.restore();
}
function drawSun(c,x,y,a,warm,t){
  if(a<=0)return;c.save();c.globalAlpha=a;c.translate(x,y);c.scale(1.25,1.25);
  const core=mix([255,250,225],[255,170,90],warm),ray=mix([255,240,190],[255,150,70],warm);
  let g=c.createRadialGradient(0,0,10,0,0,170);g.addColorStop(0,rgb(core,.55));g.addColorStop(1,rgb(core,0));c.fillStyle=g;c.fillRect(-170,-170,340,340);
  // slowly turning rays, two layers turning opposite ways, gently pulsing
  c.globalCompositeOperation='lighter';
  for(const [n,len,wid,spd,al0] of [[12,150,.13,.13,.085],[8,110,.2,-.19,.07]]){
    c.save();c.rotate(t*spd);
    for(let i=0;i<n;i++){const L=len*(.72+.28*Math.sin(t*1.5+i*1.7)),al=al0*(.55+.45*Math.sin(t*1.9+i*2.3));
      const rg=c.createRadialGradient(0,0,0,0,0,L);rg.addColorStop(0,rgb(ray,0));const r0=Math.min(.4,42/L),r1=Math.min(.6,78/L);rg.addColorStop(r0,rgb(ray,0));rg.addColorStop(r1,rgb(ray,al));rg.addColorStop(Math.max(r1+.05,.75),rgb(ray,al*.4));rg.addColorStop(1,rgb(ray,0));c.fillStyle=rg;
      for(const k of [1,.62,.3]){c.beginPath();c.moveTo(0,0);c.arc(0,0,L*(.85+.15*k),-wid*k,wid*k);c.closePath();c.fill()} // stacked wedges = feathered edges
      c.rotate(Math.PI*2/n)}
    c.restore()}
  // soft corona over the ray roots so nothing sharp meets the disc
  const br=1+.08*Math.sin(t*1.3);g=c.createRadialGradient(0,0,30,0,0,85*br);g.addColorStop(0,rgb(core,.5+.08*Math.sin(t*1.3)));g.addColorStop(.45,rgb(core,.22));g.addColorStop(1,rgb(core,0));c.fillStyle=g;c.beginPath();c.arc(0,0,85*br,0,7);c.fill();
  c.globalCompositeOperation='source-over';
  g=c.createRadialGradient(-8,-8,4,0,0,32);g.addColorStop(0,'#ffffff');g.addColorStop(.6,rgb(mix([255,250,220],[255,205,130],warm)));g.addColorStop(1,rgb(mix([255,225,150],[255,150,70],warm)));
  c.fillStyle=g;c.beginPath();c.arc(0,0,32,0,7);c.fill();
  c.strokeStyle=rgb(mix([255,255,235],[255,190,110],warm),.25);c.lineWidth=4;c.beginPath();c.arc(0,0,36,0,7);c.stroke();
  c.restore();
}
function drawHills(c,P,t,day){
  c.beginPath();c.moveTo(-20,H);for(let x=-20;x<=W+20;x+=6)c.lineTo(x,ridgeY(x));c.lineTo(W+20,H);c.closePath();
  const g=c.createLinearGradient(0,255,0,330);g.addColorStop(0,rgb(mix(P[3],[190,255,140],.22*day+.05)));g.addColorStop(.3,rgb(P[3]));g.addColorStop(1,rgb(mix(P[3],[8,4,16],.92)));
  c.fillStyle=g;c.fill();
  const dk=rgb(mix(P[3],[0,0,0],.3)),lt=rgb(mix(P[3],[230,255,180],.18*day+.04));
  c.lineWidth=1.1;c.lineCap='round';
  for(const b of blades){const y=ridgeY(b.x)+2.5,sw=Math.sin(t*1.3+b.p)*1.2;
    c.strokeStyle=b.d?dk:lt;c.beginPath();c.moveTo(b.x,y);c.quadraticCurveTo(b.x+b.l*.5,y-b.h*.6,b.x+b.l+sw,y-b.h);c.stroke()}
  // shadow toward the edges so the grass sinks into the dark frame
  c.save();c.beginPath();c.moveTo(-20,H);for(let x=-20;x<=W+20;x+=6)c.lineTo(x,ridgeY(x)-14);c.lineTo(W+20,H);c.closePath();c.clip();
  const sh=c.createLinearGradient(0,0,W,0);sh.addColorStop(0,'rgba(8,4,16,.7)');sh.addColorStop(.35,'rgba(8,4,16,0)');sh.addColorStop(.72,'rgba(8,4,16,0)');sh.addColorStop(.9,'rgba(8,4,16,.6)');sh.addColorStop(1,'rgba(8,4,16,.8)');
  c.fillStyle=sh;c.fillRect(0,200,W,H);c.restore();
}
/* flyers */
const fly=[];let nextSpawn=2;
function spawn(night,day,now){
  if(day>.5){const n=3+(Math.random()*4|0),dir=Math.random()<.5?1:-1,y=50+Math.random()*150,v=(45+Math.random()*25)*dir;
    for(let i=0;i<n;i++)fly.push({k:'b',x:dir>0?-30-i*18-Math.random()*20:W+30+i*18+Math.random()*20,y:y+(i%2?1:-1)*i*7,v,s:.8+Math.random()*.4,ph:Math.random()*6});
  }else if(night>.6){const dir=Math.random()<.5?1:-1,s=.55+Math.random()*.6;
    fly.push({k:'d',x:dir>0?-80:W+80,y:40+Math.random()*170,v:(22+Math.random()*22)*dir*s,s,ph:Math.random()*6,fire:Math.random()<.45?.3+Math.random()*.4:-1,ft:0});
  }
  nextSpawn=now+(day>.5?5+Math.random()*7:8+Math.random()*10);
}
function drawBird(c,b,t,col){
  const f=Math.sin(t*11+b.ph);c.save();c.translate(b.x,b.y+Math.sin(t*1.5+b.ph)*3);c.scale(b.s,b.s);
  c.strokeStyle=col;c.lineWidth=1.6;c.lineCap='round';c.beginPath();
  c.moveTo(-8,-f*4);c.quadraticCurveTo(-3,-3-f*2,0,0);c.quadraticCurveTo(3,-3-f*2,8,-f*4);c.stroke();c.restore();
}
function wing(c,f,shade){
  c.fillStyle=shade;c.beginPath();c.moveTo(4,-3);
  c.quadraticCurveTo(0,-14*f,-6,-26*f);c.lineTo(-30,-20*f);
  c.quadraticCurveTo(-24,-12*f,-26,-8*f);c.quadraticCurveTo(-18,-6*f,-18,-3*f);c.quadraticCurveTo(-10,-3,-8,0);c.closePath();c.fill();
}
function drawDragon(c,d,t,dt,P){
  const f=Math.sin(t*4.2+d.ph),wf=.25+.95*(f*.5+.5);
  const y=d.y+Math.sin(t*1.1+d.ph)*6-f*2;
  c.save();c.translate(d.x,y);c.scale(d.s*(d.v>0?1:-1),d.s);
  const dark='#0f0420',rim=rgb(mix(P[6],[0,0,0],.4));
  wing(c,-wf*.8+.25,rim);                   // far wing
  c.fillStyle=dark;c.beginPath();           // tail, body, neck, head
  c.moveTo(-46,6+Math.sin(t*2+d.ph)*4);c.quadraticCurveTo(-30,-2,-14,-2);
  c.quadraticCurveTo(0,-6,10,-4);c.quadraticCurveTo(16,-8,20,-13);
  c.lineTo(28,-14);c.lineTo(33,-11);c.lineTo(27,-9);c.lineTo(22,-8);
  c.quadraticCurveTo(16,0,10,4);c.quadraticCurveTo(-4,7,-14,4);c.quadraticCurveTo(-30,6,-46,6+Math.sin(t*2+d.ph)*4);c.fill();
  c.beginPath();c.moveTo(-46,6+Math.sin(t*2+d.ph)*4);c.lineTo(-54,2);c.lineTo(-50,9);c.fill();     // tail spade
  c.beginPath();c.moveTo(22,-13);c.lineTo(18,-19);c.lineTo(24,-14);c.fill();                       // horn
  c.fillRect(0,2,3,6);c.fillRect(-10,3,3,6);                                                        // legs
  wing(c,wf,dark);                                                                                  // near wing
  // fire breath
  if(d.fire>0){const pos=d.v>0?d.x/W:1-d.x/W;
    if(Math.abs(pos-d.fire)<.06){d.ft=Math.min(1,d.ft+dt*3)}else d.ft=Math.max(0,d.ft-dt*2);
    if(d.ft>0){c.globalCompositeOperation='lighter';
      for(let i=0;i<9;i++){const k=i/9,r=(3+k*9)*d.ft,xx=34+k*38*d.ft,yy=-10+Math.sin(t*20+i)*2*k+k*6;
        const g=c.createRadialGradient(xx,yy,0,xx,yy,r);g.addColorStop(0,`rgba(255,${230-k*120|0},120,${.9*(1-k)*d.ft})`);g.addColorStop(1,'rgba(255,80,20,0)');
        c.fillStyle=g;c.beginPath();c.arc(xx,yy,r,0,7);c.fill()}}
  }
  c.restore();
}

/* ---------- candle ---------- */
let lit=0,want=0,smoke=[],override=null,autoPrev=null,pkLit=0,pkWant=0,pkOverride=null;
function drawFlame(t,dt){
  fx.clearRect(0,0,FW,FH);
  for(const s of smoke){s.y-=dt*18;s.x+=Math.sin(t*2+s.p)*dt*8;s.a-=dt*.28;s.r+=dt*5}
  smoke=smoke.filter(s=>s.a>0);
  for(const s of smoke){const g=fx.createRadialGradient(s.x,s.y,0,s.x,s.y,s.r);g.addColorStop(0,`rgba(200,190,210,${s.a*.35})`);g.addColorStop(1,'rgba(200,190,210,0)');fx.fillStyle=g;fx.beginPath();fx.arc(s.x,s.y,s.r,0,7);fx.fill()}
  if(lit<=.01)return 0;
  const n=noise(t*6),n2=noise(t*9+4),h=(42+n*5+n2*3)*lit,w=(9+n2*1.2)*Math.min(1,lit*1.4),sw=noise(t*2.4+9)*4*lit;
  const x=WICK.x,y=WICK.y;
  fx.globalCompositeOperation='lighter';
  let g=fx.createRadialGradient(x,y-h*.45,0,x,y-h*.45,h*1.4);g.addColorStop(0,`rgba(255,180,80,${.45*lit})`);g.addColorStop(1,'rgba(255,120,40,0)');
  fx.fillStyle=g;fx.fillRect(0,0,FW,FH);
  const shape=(sc,col)=>{fx.fillStyle=col;fx.beginPath();fx.moveTo(x,y+2);
    fx.bezierCurveTo(x-w*sc*1.3,y-h*sc*.15,x-w*sc*.7,y-h*sc*.7,x+sw*sc,y-h*sc);
    fx.bezierCurveTo(x+w*sc*.7,y-h*sc*.7,x+w*sc*1.3,y-h*sc*.15,x,y+2);fx.fill()};
  g=fx.createLinearGradient(0,y-h,0,y);g.addColorStop(0,'rgba(255,110,30,.0)');g.addColorStop(.3,'rgba(255,140,40,.85)');g.addColorStop(1,'rgba(255,190,80,.9)');
  shape(1,g);
  g=fx.createLinearGradient(0,y-h*.7,0,y);g.addColorStop(0,'rgba(255,230,150,.6)');g.addColorStop(1,'rgba(255,250,220,1)');
  shape(.62,g);
  fx.fillStyle='rgba(120,160,255,.45)';fx.beginPath();fx.ellipse(x,y-1,w*.45,4,0,0,7);fx.fill();
  fx.globalCompositeOperation='source-over';
  return .78+.22*clamp(n*.6+n2*.4+.5);
}

/* ---------- magic wand ---------- */
const fxc=document.getElementById('fx'),gx=fxc.getContext('2d'),FXW=852,FXH=620;
window.__fxResize=d=>{fxc.width=Math.round(FXW*d);fxc.height=Math.round(FXH*d);gx.setTransform(d,0,0,d,0,0)};window.__fxResize(Math.min(devicePixelRatio||1,3)*S);
const wAnim=document.getElementById('wandAnim'),wShadow=document.getElementById('wandShadow');
const wGlows=[...document.querySelectorAll('#wandAnim circle')].filter(c=>c.getAttribute('fill')==='url(#glowP)');
const wGlowR=wGlows.map(c=>+c.getAttribute('r'));
const PIV=[640,441];                       // grip, near the handle
const C4=Math.cos(4*Math.PI/180),S4=Math.sin(4*Math.PI/180);
const TIP0=[680-226*C4,441-226*S4];        // crystal in stage coords at rest
let wand=null,parts=[],wandCycle=false,cycleLeft=0,lastNight=0,lastAlt=1,ghost=null,boo=null;
const gEl=document.getElementById('ghost'),gHeart=document.getElementById('gHeart'),gHeartGlow=document.getElementById('gHeartGlow');
const easeOut=u=>1-(1-u)**3,easeInOut=u=>u<.5?4*u*u*u:1-(-2*u+2)**3/2;
const easeBack=u=>{const c=2.2;return 1+(c+1)*(u-1)**3+c*(u-1)**2};
// pose over time: [angle deg (clockwise lifts the tip), dx, dy, glow boost]
function pose(t){
  const T1=.45,T2=1.45,T3=1.68,T4=2.45;
  if(t<T1){const u=easeOut(t/T1);return [38*u,-18*u,-74*u,1+.6*u]}
  if(t<T2){const u=(t-T1)/(T2-T1),th=u*Math.PI*2*1.5,k=Math.sin(Math.PI*u);       // one and a half loops
    return [38+14*Math.sin(th)*k,-18+16*Math.cos(th)*k-16*k*0,-74-14*Math.sin(th+1.2)*k,1.6+.5*k]}
  if(t<T3){const u=easeBack((t-T2)/(T3-T2));return [38-30*u,-18-30*u,-74+26*u,2.1]}    // swift flick
  if(t<T4){const u=easeInOut((t-T3)/(T4-T3));return [8*(1-u),-48*(1-u),-48*(1-u),1+1.1*(1-u)]}
  return null;
}
function tipAt(p){const a=p[0]*Math.PI/180,x=TIP0[0]-PIV[0],y=TIP0[1]-PIV[1];
  return [PIV[0]+x*Math.cos(a)-y*Math.sin(a)+p[1],PIV[1]+x*Math.sin(a)+y*Math.cos(a)+p[2]]}
function sparkle(x,y,big){const a=Math.random()*6.28,v=big?60+Math.random()*120:8+Math.random()*28;
  parts.push({k:'s',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-(big?10:14),life:0,max:big?.7+Math.random()*.5:.5+Math.random()*.5,r:big?4+Math.random()*5:2.6+Math.random()*3,c:Math.random()<.55?[255,222,120]:[214,160,255],tw:Math.random()*6})}
function ghostPuff(x,y){   // a softer lilac puff where the ghost appears
  for(let i=0;i<9;i++){const a=Math.random()*6.28,v=18+Math.random()*30;parts.push({k:'p',x:x+Math.cos(a)*10,y:y+Math.sin(a)*10,vx:Math.cos(a)*v,vy:Math.sin(a)*v-10,life:0,max:.7+Math.random()*.5,r:10+Math.random()*8})}
  for(let i=0;i<14;i++)sparkle(x,y,true);
}
function poof(x,y){
  for(let i=0;i<14;i++){const a=Math.random()*6.28,v=25+Math.random()*45;parts.push({k:'p',x:x+Math.cos(a)*6,y:y+Math.sin(a)*6,vx:Math.cos(a)*v,vy:Math.sin(a)*v-14,life:0,max:.9+Math.random()*.6,r:12+Math.random()*9})}
  for(let i=0;i<34;i++)sparkle(x,y,true);
  parts.push({k:'f',x,y,life:0,max:.45});
}
function starPath(c,x,y,r){c.beginPath();c.moveTo(x,y-r);c.quadraticCurveTo(x+r*.15,y-r*.15,x+r,y);c.quadraticCurveTo(x+r*.15,y+r*.15,x,y+r);c.quadraticCurveTo(x-r*.15,y+r*.15,x-r,y);c.quadraticCurveTo(x-r*.15,y-r*.15,x,y-r);c.fill()}
let emitAcc=0,fxDirty=false;
function wandFrame(dt){
  if(wand){
    wand.t+=dt;const p=pose(wand.t);
    if(!p){wand=null;wAnim.removeAttribute('transform');wShadow.setAttribute('opacity','.7');wGlows.forEach((c,i)=>c.setAttribute('r',wGlowR[i]))}
    else{
      wAnim.setAttribute('transform',`translate(${p[1].toFixed(2)} ${p[2].toFixed(2)}) rotate(${p[0].toFixed(2)} ${PIV[0]} ${PIV[1]})`);
      wShadow.setAttribute('opacity',(.7*Math.max(.15,1+p[2]/60)).toFixed(3));
      wGlows.forEach((c,i)=>c.setAttribute('r',(wGlowR[i]*p[3]).toFixed(1)));
      const tip=tipAt(p);wandTip=tip;
      if(wand.t>.3&&wand.t<1.68){emitAcc+=dt*70;while(emitAcc>1){emitAcc--;sparkle(tip[0]+(Math.random()-.5)*6,tip[1]+(Math.random()-.5)*6,false)}}
      if(!wand.poofed&&wand.t>=1.68&&wand.toggle){wand.poofed=true;
        if(wandCycle)scrubbing=!scrubbing;
        for(let i=0;i<26;i++)sparkle(tip[0]+(Math.random()-.5)*10,tip[1]+(Math.random()-.5)*10,i<10)}
      if(!wand.poofed&&wand.t>=1.68){wand.poofed=true;poof(tip[0],tip[1]);
        if(!wandCycle){setMode('demo');wandCycle=true;cycleLeft=24}}   // a running cycle just carries on to its end
    }
  }
  ghostFrame(dt);catFrame(dt);
  if(parts.length||fxDirty||boo){
    gx.clearRect(0,0,FXW,FXH);fxDirty=parts.length>0;
    for(const q of parts){q.life+=dt;if(q.k!=='f'){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=1-dt*2.2;q.vy=q.vy*(1-dt*2.2)+(q.k==='s'?14:-10)*dt}}
    parts=parts.filter(q=>q.life<q.max);fxDirty=fxDirty||!!boo;
    if(boo)drawBoo(dt);
    gx.globalCompositeOperation='lighter';
    for(const q of parts){const u=q.life/q.max;
      if(q.k==='f'){const r=25+95*Math.sqrt(u),g=gx.createRadialGradient(q.x,q.y,0,q.x,q.y,r);g.addColorStop(0,`rgba(255,245,255,${1-u})`);g.addColorStop(.35,`rgba(210,150,255,${.7*(1-u)})`);g.addColorStop(1,'rgba(160,90,255,0)');gx.fillStyle=g;gx.beginPath();gx.arc(q.x,q.y,r,0,7);gx.fill()}
      else if(q.k==='s'){const tw=.6+.4*Math.sin(q.life*22+q.tw),a=(1-u)*tw;gx.fillStyle=`rgba(${q.c[0]},${q.c[1]},${q.c[2]},${a})`;starPath(gx,q.x,q.y,q.r*(1-u*.4));
        gx.fillStyle=`rgba(255,255,255,${a*.8})`;gx.beginPath();gx.arc(q.x,q.y,q.r*.25,0,7);gx.fill()}}
    gx.globalCompositeOperation='source-over';
    for(const q of parts)if(q.k==='p'){const u=q.life/q.max,r=q.r*(1+2.2*u),g=gx.createRadialGradient(q.x,q.y,0,q.x,q.y,r);
      g.addColorStop(0,`rgba(240,228,255,${.8*(1-u)})`);g.addColorStop(.6,`rgba(180,150,225,${.45*(1-u)})`);g.addColorStop(1,'rgba(150,120,200,0)');gx.fillStyle=g;gx.beginPath();gx.arc(q.x,q.y,r,0,7);gx.fill()}
  }
}
// tapping the big "My Book Collection" book calls the ghost (sunset to sunrise)
document.getElementById('bookHit').addEventListener('click',()=>{if(!ghost&&lastAlt<0){ghost={t:0,x:510,y:346,booed:false};ghostPuff(510,262)}});
document.getElementById('wandHit').addEventListener('click',()=>{
  if(wand)return;
  // during the fast day the same lift-swirl-flick pauses it (or carries on) instead of poofing
  wand={t:0,poofed:false,toggle:wandCycle};emitAcc=0});

/* ghost: pops out of the poof at night, then leaves a smoky "Boo!" */
function startBoo(x,y){
  const oc=document.createElement('canvas'),W2=220,H2=90;oc.width=W2;oc.height=H2;const o=oc.getContext('2d');
  o.fillStyle='#fff';o.font='italic 64px "IM Fell English SC", Georgia, serif';o.textAlign='center';o.textBaseline='middle';o.fillText('Boo!',W2/2,H2/2+4);
  const px=o.getImageData(0,0,W2,H2).data,pts=[];
  for(let yy=0;yy<H2;yy+=2)for(let xx=0;xx<W2;xx+=2)if(px[(yy*W2+xx)*4+3]>128&&Math.random()<.75)pts.push({x:x-W2/2+xx,y:y-H2/2+yy,ox:0,oy:0,r:1.5+Math.random()*1.1,d:.4+Math.random()*1.4,p:Math.random()*6.28,vx:(Math.random()-.5)*16,vy:-(8+Math.random()*18)});
  boo={t:0,pts,x,y};
}
function drawBoo(dt){
  boo.t+=dt;const t=boo.t;if(t>3.4){boo=null;return}
  gx.save();
  for(const q of boo.pts){
    const k=Math.max(0,t-q.d*.5);                     // each wisp starts drifting a little later
    q.oy+=dt*q.vy*k*1.4;q.ox+=dt*(q.vx*k+Math.sin(t*1.8+q.p+q.y*.06)*(3+k*8));
    const a=Math.max(0,1-Math.max(0,t-.6-q.d*.5)/1.3)/(1+k*1.8),r=q.r*(1+k*1.5);if(a<=.01)continue;
    const g=gx.createRadialGradient(q.x+q.ox,q.y+q.oy,0,q.x+q.ox,q.y+q.oy,r*2.2);
    g.addColorStop(0,`rgba(232,222,255,${.5*a})`);g.addColorStop(1,'rgba(200,180,255,0)');gx.fillStyle=g;
    gx.beginPath();gx.arc(q.x+q.ox,q.y+q.oy,r*2.2,0,7);gx.fill();
  }
  gx.restore();
}
const gBodyImg=img('img/ghost_body.png'),gBc=document.getElementById('gBody'),gb=gBc.getContext('2d');
function drawSheet(t){
  if(!ready(gBodyImg))return;const W2=324,H2=312,y0=H2*.5;
  gb.clearRect(0,0,W2,H2);gb.drawImage(gBodyImg,0,0,W2,y0,0,0,W2,y0);
  for(let y=y0;y<H2;y+=2){
    const k=((y-y0)/(H2-y0))**1.6;                            // more movement toward the hem
    const off=k*(9*Math.sin(t*3.2-y*.045)+4*Math.sin(t*5.1-y*.09+1.3));
    const st=1+k*.04*Math.sin(t*2.6-y*.03);                     // slight billow
    gb.drawImage(gBodyImg,0,y,W2,2,off-(st-1)*W2/2,y,W2*st,2.2);
  }
}
// mouth: closed "B" -> round "oo", as if saying Boo
function drawMouth(t){
  let o;
  if(t<.3)o=0;else if(t<.42)o=easeOut((t-.3)/.12)*1.1;else if(t<.55)o=1.1-.1*((t-.42)/.13);
  else if(t<1.05)o=1+.06*Math.sin((t-.55)*14);else o=Math.max(.55,1-(t-1.05)*1.2);
  const cx=152.4,cy=93,w=4+5.2*o,h=.9+11.5*o;
  gb.save();
  // soft puckered shading around the lips
  let g=gb.createRadialGradient(cx,cy,0,cx,cy,w*2.2+4);g.addColorStop(0,'rgba(60,80,120,.35)');g.addColorStop(1,'rgba(60,80,120,0)');
  gb.fillStyle=g;gb.beginPath();gb.ellipse(cx,cy,w*1.9+4,h*1.5+4,0,0,7);gb.fill();
  if(o<.05){gb.strokeStyle='#3a1a34';gb.lineWidth=1.8;gb.lineCap='round';gb.beginPath();gb.moveTo(cx-5,cy);gb.quadraticCurveTo(cx,cy+1.2,cx+5,cy);gb.stroke()}
  else{gb.fillStyle='#26101f';gb.beginPath();gb.ellipse(cx,cy,w,h,0,0,7);gb.fill();
    g=gb.createRadialGradient(cx,cy+h*.55,0,cx,cy+h*.55,w*1.1);g.addColorStop(0,'rgba(170,60,90,.95)');g.addColorStop(1,'rgba(120,40,62,0)');
    gb.fillStyle=g;gb.beginPath();gb.ellipse(cx,cy,w*.92,h*.94,0,0,7);gb.fill();
    gb.strokeStyle='rgba(255,255,255,.35)';gb.lineWidth=1;gb.beginPath();gb.ellipse(cx,cy,w+.6,h+.6,0,3.6,4.4);gb.stroke()}
  gb.restore();
}
/* ---------- the big pumpkin in the witch hat ---------- */
const bpC=document.getElementById('bpC'),bp=bpC.getContext('2d'),faceGlow=document.getElementById('faceGlow');
const EYE=[[197.5,163.5],[270,166.5]],CHEEK=[[180,177],[281,183]],HPIV=[190,150],BUCKLE=[218,80];
let bk={hop:-1,startle:-1,blush:9,wink:-1,winkEye:0,nextWink:5+Math.random()*6,glint:-1,nextGlint:3,eyeO:0,look:[0,0]};
let wandTip=null;
function bpFrame(dt,t){
  bk.hop>=0&&(bk.hop+=dt);bk.startle>=0&&(bk.startle+=dt);bk.blush+=dt;bk.wink>=0&&(bk.wink+=dt);bk.glint>=0&&(bk.glint+=dt);
  if(bk.hop>=0&&bk.hop>1.2)bk.hop=-1;if(bk.startle>=0&&bk.startle>1.6)bk.startle=-1;
  // eyes: open while the wand works, wide on Boo, an occasional wink
  let target=0,look=[0,0];
  const wandOn=wand&&wand.t<2.45,boo=bk.startle>=0&&bk.startle<1.5;
  if(boo){target=1.25;look=[2.6,1.2]}
  else if(wandOn&&wandTip){target=1;const ex=(EYE[0][0]+EYE[1][0])/2+90,ey=EYE[0][1];const vx=wandTip[0]-ex,vy=wandTip[1]-ey,l=Math.hypot(vx,vy)||1;look=[vx/l*2.6,vy/l*2.4]}
  if(t>bk.nextWink&&bk.wink<0&&!wandOn&&!boo){bk.wink=0;bk.winkEye=Math.random()<.5?0:1;bk.nextWink=t+7+Math.random()*9}
  let wo=0;if(bk.wink>=0){const u=bk.wink;wo=u<.12?u/.12:u<.55?1:u<.7?1-(u-.55)/.15:0;if(u>.7)bk.wink=-1}
  bk.eyeO+=(target-bk.eyeO)*Math.min(1,dt*14);bk.look[0]+=(look[0]-bk.look[0])*Math.min(1,dt*10);bk.look[1]+=(look[1]-bk.look[1])*Math.min(1,dt*10);
  if(t>bk.nextGlint&&bk.glint<0){bk.glint=0;bk.nextGlint=t+5+Math.random()*5}
  // ---- draw ----
  bp.setTransform(2,0,0,2,0,0);bp.clearRect(0,0,360,260);
  // blush
  const bl=bk.blush<1.4?.55*Math.sin(Math.PI*Math.min(1,bk.blush/1.4)):0;
  if(bl>.01)for(const [x,y] of CHEEK){const g=bp.createRadialGradient(x,y,0,x,y,17);g.addColorStop(0,`rgba(255,70,90,${bl})`);g.addColorStop(1,'rgba(255,70,90,0)');bp.fillStyle=g;bp.beginPath();bp.arc(x,y,17,0,7);bp.fill()}
  // eyes: dark and glossy with sparkles
  for(let i=0;i<2;i++){const o=Math.max(bk.eyeO,i===bk.winkEye?wo:0);if(o<.03)continue;
    const [x,y]=EYE[i],lk=bk.eyeO>wo?bk.look:[0,0],k=Math.min(1,o);
    let g=bp.createRadialGradient(x,y,0,x,y,17);g.addColorStop(0,`rgba(232,114,33,${k})`);g.addColorStop(.72,`rgba(230,112,32,${.95*k})`);g.addColorStop(1,'rgba(230,112,32,0)');
    bp.fillStyle=g;bp.beginPath();bp.ellipse(x,y,17,13,0,0,7);bp.fill();                        // cover the closed-eye line
    const rx=Math.max(.2,10.5*Math.min(1.12,o)),ry=Math.max(.2,12.5*o),cy=y-1;
    bp.fillStyle='#2b0f08';bp.beginPath();bp.ellipse(x,cy,rx,ry,0,0,7);bp.fill();
    bp.save();bp.beginPath();bp.ellipse(x,cy,rx,ry,0,0,7);bp.clip();
    bp.fillStyle='#140604';bp.beginPath();bp.ellipse(x+lk[0],cy+lk[1],rx*.62,ry*.62,0,0,7);bp.fill();
    bp.fillStyle='#fff';bp.beginPath();bp.arc(x-3.3+lk[0]*.6,cy-5.6*k+lk[1]*.6,3.4*k,0,7);bp.fill();
    bp.beginPath();bp.arc(x+3+lk[0]*.6,cy+2.3*k+lk[1]*.6,1.5*k,0,7);bp.fill();
    bp.restore();
  }
  // buckle glint (the hat itself stays painted in the picture)
  if(bk.glint>=0){const u=bk.glint/.6;if(u>=1)bk.glint=-1;else{const r=9*Math.sin(Math.PI*u),[gx2,gy2]=BUCKLE;
    bp.globalCompositeOperation='lighter';const gg=bp.createRadialGradient(gx2,gy2,0,gx2,gy2,r*1.6);gg.addColorStop(0,'rgba(255,250,210,.9)');gg.addColorStop(1,'rgba(255,220,120,0)');bp.fillStyle=gg;bp.beginPath();bp.arc(gx2,gy2,r*1.6,0,7);bp.fill();
    bp.fillStyle='rgba(255,255,235,.95)';starPath(bp,gx2,gy2,r);bp.globalCompositeOperation='source-over'}}
}
document.getElementById('bigPkHit').addEventListener('click',()=>{if(bk.hop<0&&bk.startle<0){bk.hop=0;bk.blush=0;if(bk.wink<0){bk.wink=0;bk.winkEye=Math.random()<.5?0:1}}});

/* ---------- the cat: startled by the Boo, then back to sleep ---------- */
const catImg=img('img/cat.png'),catC=document.getElementById('catC'),cx2=catC.getContext('2d');
let cat=null,catDrawn=false,catIdle=0;
// iPhones can wipe a still canvas from memory (e.g. around an update reload), so the sleeping cat is re-drawn now and then
addEventListener('pageshow',()=>{catDrawn=false});document.addEventListener('visibilitychange',()=>{if(!document.hidden)catDrawn=false});
function drawCat(eye,look){
  cx2.setTransform(2,0,0,2,0,0);cx2.clearRect(0,0,264,108);
  if(ready(catImg))cx2.drawImage(catImg,0,0,264,108);
  if(eye<=.02)return;
  for(const [ex,ey] of [[54.3,74.8],[88.2,74]]){
    cx2.save();cx2.translate(ex,ey);
    const r=7.4,ry=r*eye;                                   // big round eyes
    cx2.fillStyle='#160a0a';cx2.beginPath();cx2.ellipse(0,0,r+1.3,ry+1.3,0,0,7);cx2.fill();
    cx2.save();cx2.beginPath();cx2.ellipse(0,0,r,ry,0,0,7);cx2.clip();
    const g=cx2.createRadialGradient(0,2,1,0,0,r);g.addColorStop(0,'#c8f08a');g.addColorStop(.7,'#8cc850');g.addColorStop(1,'#4f8a2a');
    cx2.fillStyle=g;cx2.fillRect(-r,-r,2*r,2*r);
    cx2.fillStyle='#120a10';cx2.beginPath();cx2.arc(look,.6,5.2,0,7);cx2.fill();          // large round pupil
    cx2.fillStyle='#fff';cx2.beginPath();cx2.arc(look-2.3,-2.4,2.3,0,7);cx2.fill();        // sparkles
    cx2.beginPath();cx2.arc(look+2,2,1,0,7);cx2.fill();
    cx2.restore();cx2.restore();
  }
}
function catFrame(dt){
  if(!cat){catIdle+=dt;if((!catDrawn||catIdle>2)&&ready(catImg)){drawCat(0,0);catDrawn=true;catIdle=0}return}
  cat.t+=dt;const t=cat.t;
  if(t>2.4){cat=null;catC.style.transform='';drawCat(0,0);return}
  let dy=0,sx=1,sy=1,rot=0;
  if(t<.14){const u=easeOut(t/.14);dy=-16*u;sy=1+.08*u;sx=1-.04*u}
  else if(t<.26){const u=(t-.14)/.12;dy=-16*(1-u*u);sy=1.08-.08*u;sx=.96+.04*u}
  else if(t<.4){const u=(t-.26)/.14,k=Math.sin(u*Math.PI);sy=1-.07*k;sx=1+.05*k}
  if(t>.26&&t<.7)rot=1.6*Math.sin(t*48)*(1-(t-.26)/.44);          // a little shiver
  const eye=t<.06?t/.06*1.15:t<1.85?1.15-.15*Math.min(1,(t-.06)/.2):Math.max(0,1-(t-1.85)/.45);
  const L0=cat.look,look=t<1.5?L0:L0*(1-(t-1.5)/.35);
  catC.style.transform=`translate(0,${dy.toFixed(2)}px) rotate(${rot.toFixed(2)}deg) scale(${sx.toFixed(3)},${sy.toFixed(3)})`;
  drawCat(eye,L0<0?Math.max(L0,look):look);
}
document.getElementById('catHit').addEventListener('click',()=>{if(!cat)cat={t:0,look:0}});
function ghostFrame(dt){
  if(!ghost)return;ghost.t+=dt;const t=ghost.t;
  const B=1;let sc,op,dy;
  if(t<.32){const u=t/.32;dy=60*(1-easeBack(u));sc=B*(.85+.15*u);op=Math.min(1,u*2.5)}          // pops up from behind the books
  else if(t<1.15){dy=-4*Math.sin((t-.32)*4);sc=B;op=1}
  else if(t<1.5){const u=(t-1.15)/.35;dy=-6*u;sc=B*(1+.12*u);op=1-u}
  else{gEl.style.opacity=0;ghost=null;return}
  if(!ghost.booed&&t>=.4){ghost.booed=true;startBoo(ghost.x+2,ghost.y-218)}
  if(!ghost.cat&&t>=.52){ghost.cat=true;cat={t:0,look:-1.8};bk.startle=0;bk.blush=0}      // the word appears as her mouth opens
  const wob=Math.sin(t*4.5)*3;
  gEl.style.opacity=op.toFixed(3);drawSheet(t);drawMouth(t);
  gEl.style.transform=`translate(${(ghost.x-105).toFixed(1)}px,${(ghost.y-203+dy).toFixed(1)}px) rotate(${wob.toFixed(1)}deg) scale(${sc.toFixed(3)})`;
  const hb=`scale(${(1+.12*Math.max(0,Math.sin(t*9))).toFixed(3)})`;gHeart.style.transform=hb;gHeartGlow.style.transform=hb;
  const cp=.5+.5*Math.sin(t*5);   // colour pulse: soft pink -> bright rose
  gHeart.style.filter=`brightness(${(.85+.5*cp).toFixed(2)}) saturate(${(.8+.7*cp).toFixed(2)}) hue-rotate(${(-12*cp).toFixed(1)}deg)`;
  gHeartGlow.style.opacity=(.4+.6*cp).toFixed(2);
}

/* ---------- real sunrise & sunset (Bucharest), SunCalc-style maths ---------- */
const LAT=44.43,LON=26.10;
function sunTimes(date){
  const rad=Math.PI/180,dayMs=864e5,J1970=2440588,J2000=2451545,J0=.0009,e=rad*23.4397;
  const noon=new Date(date.getFullYear(),date.getMonth(),date.getDate(),12);
  const d=noon/dayMs-.5+J1970-J2000,lw=rad*-LON,phi=rad*LAT;
  const n=Math.round(d-J0-lw/(2*Math.PI)),ds=J0+lw/(2*Math.PI)+n;
  const M=rad*(357.5291+.98560028*ds),C=rad*(1.9148*Math.sin(M)+.02*Math.sin(2*M)+.0003*Math.sin(3*M));
  const L=M+C+rad*102.9372+Math.PI,dec=Math.asin(Math.sin(L)*Math.sin(e));
  const Jnoon=J2000+ds+.0053*Math.sin(M)-.0069*Math.sin(2*L);
  const w=Math.acos((Math.sin(-.833*rad)-Math.sin(phi)*Math.sin(dec))/(Math.cos(phi)*Math.cos(dec)));
  const Jset=J2000+J0+(w+lw)/(2*Math.PI)+n+.0053*Math.sin(M)-.0069*Math.sin(2*L),Jrise=Jnoon-(Jset-Jnoon);
  const hrs=j=>{const t=new Date((j+.5-J1970)*dayMs);return t.getHours()+t.getMinutes()/60+t.getSeconds()/3600};
  return [hrs(Jrise),hrs(Jset)];
}
let sunKey='',RISE=6.5,SET=18.5;
// maps the real time of day onto the scene's 6:30-sunrise / 18:30-sunset timeline
function toScene(h){
  const now=new Date(),k=now.toDateString();
  if(k!==sunKey){sunKey=k;[RISE,SET]=sunTimes(now)}
  if(h>=RISE&&h<=SET)return 6.5+(h-RISE)/(SET-RISE)*12;
  const since=(h-SET+24)%24;return (18.5+since/(24-(SET-RISE))*12)%24;
}
window.__sun=()=>[RISE,SET];

/* ---------- clock ---------- */
let mode='live',demoH=17.5,last=performance.now()/1000;
function setMode(m){const was=mode;mode=m;scrubbing=false;if(m==='demo'&&was!=='demo'){const d=new Date();demoH=d.getHours()+d.getMinutes()/60}}
let scrubbing=false;
window.__preview=(h,freeze=true)=>{mode='demo';demoH=h;scrubbing=freeze}; // for screenshots only
const DEMO_SPEED=24/60; // a full day in 1 minute

let lastFrame=0,raf=0,lastSkyTop='';
function frame(){
  lastFrame=Date.now();
  try{draw()}catch(e){console.error(e)}
  raf=requestAnimationFrame(frame);
}
function draw(){
  const t=performance.now()/1000,dt=Math.max(0,Math.min(.1,t-last));last=t;
  let h;
  if(mode==='live'){const d=new Date();h=d.getHours()+d.getMinutes()/60+d.getSeconds()/3600}
  else{const run=!scrubbing;if(run)demoH=(demoH+dt*DEMO_SPEED)%24;h=demoH;
    if(wandCycle&&run){cycleLeft-=dt*DEMO_SPEED;if(cycleLeft<=0){wandCycle=false;setMode('live')}}}
  wandFrame(dt);
  const vh=toScene(h);
  const P=pal(vh),skyTop=rgb(P[0]);if(skyTop!==lastSkyTop){lastSkyTop=skyTop;document.documentElement.style.setProperty('--skyTop',skyTop)}
  const alt=Math.sin(2*Math.PI*(vh-6.5)/24); // sun altitude, -1..1
  const day=ss(-.05,.15,alt),night=1-ss(-.2,.02,alt),warm=1-ss(.08,.45,Math.abs(alt));lastNight=night;lastAlt=alt;
  const c=sx;
  // sky
  let g=c.createLinearGradient(0,0,0,330);g.addColorStop(0,rgb(P[0]));g.addColorStop(1,rgb(P[1]));c.fillStyle=g;c.fillRect(0,-SKYX,W,H+SKYX);
  // stars
  if(night>0)for(const s of stars){const a=night*(.45+.55*Math.sin(t*s.s+s.p));if(a<=0)continue;
    c.fillStyle=s.g?`rgba(255,215,130,${a})`:`rgba(255,245,225,${a*.85})`;
    if(s.g){const r=s.r*2.6;c.beginPath();c.moveTo(s.x,s.y-r);c.lineTo(s.x+r*.25,s.y);c.lineTo(s.x,s.y+r);c.lineTo(s.x-r*.25,s.y);c.closePath();c.moveTo(s.x-r,s.y);c.lineTo(s.x,s.y+r*.25);c.lineTo(s.x+r,s.y);c.lineTo(s.x,s.y-r*.25);c.fill()}
    else{c.fillRect(s.x,s.y,s.r,s.r)}}
  // sun & moon on an arc; x 200→880, peak above the castle
  const sp=(vh-6.5)/12,mp=((vh+5.5)%24)/12;
  if(sp>-.1&&sp<1.1)drawSun(c,200+680*sp,320-248*Math.sin(Math.PI*clamp(sp,-.1,1.1)),ss(-.08,.02,alt),warm,t);
  if(mp>-.1&&mp<1.1)drawMoon(c,200+680*mp,320-234*Math.sin(Math.PI*clamp(mp,-.1,1.1)),ss(-.02,.12,-alt)*.98+.02*0,P);
  // clouds
  const cc=mix(mix([255,255,255],[255,180,170],warm),[90,60,130],night);
  for(const cl of clouds){cl.x+=cl.v*dt;if(cl.x>W+160)cl.x=-160;
    for(const [dx,dy,r] of cl.p){const gg=c.createRadialGradient(cl.x+dx,cl.y+dy,0,cl.x+dx,cl.y+dy,r);gg.addColorStop(0,rgb(cc,.5-.3*night));gg.addColorStop(1,rgb(cc,0));c.fillStyle=gg;c.beginPath();c.arc(cl.x+dx,cl.y+dy,r,0,7);c.fill()}}
  // far mountains + haze
  smoothRidge(c,far,H);c.fillStyle=rgb(P[2]);c.fill();
  g=c.createLinearGradient(0,170,0,330);g.addColorStop(0,rgb(P[6],0));g.addColorStop(1,rgb(P[6],.45));c.fillStyle=g;c.fillRect(0,170,W,H);
  // flyers (behind castle for depth)
  if(t>nextSpawn&&fly.length<9)spawn(night,day,t);
  for(const f of fly){f.x+=f.v*dt}
  for(let i=fly.length-1;i>=0;i--)if(fly[i].x<-140||fly[i].x>W+140)fly.splice(i,1);
  const birdCol=rgb(mix([40,30,60],[20,10,35],warm));
  for(const f of fly){if(f.k==='b')drawBird(c,f,t,birdCol);else drawDragon(c,f,t,dt,P)}
  // castle and hills
  if(ready(cShape))drawCastleImg(c,P,day,night,warm,t);else drawCastle(c,P,day*(.5+.5*warm)+.15,night,t);
  drawHills(c,P,t,day);
  // candle
  const auto=alt<.06?1:0;
  if(auto!==autoPrev){override=null;pkOverride=null;autoPrev=auto} // a manual choice lasts until the next sunset or sunrise
  want=override===null?auto:override;
  pkWant=pkOverride===null?auto:pkOverride;
  pkLit=pkWant?Math.min(1,pkLit+dt*.8):Math.max(0,pkLit-dt*1.4);
  if(want&&lit<1)lit=Math.min(1,lit+dt*.9);
  if(!want&&lit>0){lit=Math.max(0,lit-dt*1.6);if(lit===0)for(let i=0;i<10;i++)smoke.push({x:WICK.x+(Math.random()-.5)*3,y:WICK.y-4-i*6,r:3+i*.6,a:.9-i*.05,p:Math.random()*6})}
  const fk=drawFlame(t,dt);glow.style.opacity=(lit*fk).toFixed(3);faceGlow.style.opacity=(lit*fk*.55).toFixed(3);bpFrame(dt,t);
  // jack-o'-lantern: its own candle, lit together with the big one, flickering on its own rhythm
  const fl=clamp(noise(t*3.1+11)*.6+noise(t*5.3+3)*.4+.5),pulse=.5+.5*Math.sin(t*.9)*Math.sin(t*.31+1);
  pkLight.style.opacity=(pkLit*(.62+.25*pulse+.13*fl)).toFixed(3);pkGlow.style.opacity=(pkLit*(.12+.38*pulse)*(.85+.15*fl)).toFixed(3);
}
// keep the loop alive when the page is reopened, restored or woken
function kick(){if(Date.now()-lastFrame>700){last=performance.now()/1000;fit();cancelAnimationFrame(raf);raf=requestAnimationFrame(frame)}}
addEventListener('pageshow',kick);addEventListener('focus',kick);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)kick()});
setInterval(kick,1000);
document.getElementById('pumpkinHit').addEventListener('click',()=>{const v=pkWant?0:1;pkOverride=(v===autoPrev)?null:v});
document.getElementById('candleHit').addEventListener('click',()=>{const v=want?0:1;override=(v===autoPrev)?null:v});
raf=requestAnimationFrame(frame);

