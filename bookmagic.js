/* Letters steaming out of the open book on the bottom bar: they rise slowly from along both pages, drift outward
   in a gentle arch, turn a little, then fade away. Light on the phone: each glowing letter is drawn once into a
   small picture and reused; about 6 letters a second; paused when the app is hidden. */
(function(){
  const book=document.querySelector('#tabbar .barbook');if(!book||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const cv=document.createElement('canvas');cv.className='bookmagic';book.after(cv);
  const c=cv.getContext('2d'),UP=3;             // the canvas spans the whole bar width and 3 book-heights above the book,
  let W=0,H=0,D=1,bh=0,bx=0,bw=0;               // so letters drifting outward are never cut off
  // glowing letter pictures, made once
  const SPR=new Map(),B=22;
  function sprite(ch){let s=SPR.get(ch);if(s)return s;
    const o=document.createElement('canvas'),n=Math.ceil(B*2*D);o.width=o.height=n;const x=o.getContext('2d');x.scale(D,D);
    x.font=`italic ${B}px "IM Fell English",Georgia,serif`;x.textAlign='center';x.textBaseline='middle';
    x.shadowColor='rgba(255,190,90,.95)';x.shadowBlur=9;x.fillStyle='#fff0c4';x.fillText(ch,B,B);x.shadowBlur=3;x.fillText(ch,B,B);
    SPR.set(ch,o);return o}
  function size(){const r=book.getBoundingClientRect();if(!r.width)return;D=Math.min(devicePixelRatio||1,3);
    bw=r.width;bh=bw*213/900;H=bh*(1+UP);cv.style.height=H+'px';const cr=cv.getBoundingClientRect();W=cr.width;bx=r.left-cr.left;
    cv.width=Math.round(W*D);cv.height=Math.round(H*D);c.setTransform(D,0,0,D,0,0);SPR.clear()}
  size();addEventListener('resize',size);book.addEventListener('load',size);
  if(document.fonts)document.fonts.ready.then(()=>SPR.clear());
  const CH='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',P=[];let last=performance.now(),acc=0,run=true,boost=0;
  // touching the middle half of the book: a burst of letters, then it calms back down
  const hit=document.createElement('div');hit.className='bookhit';hit.setAttribute('role','button');hit.setAttribute('aria-label','Magic book');cv.after(hit);
  hit.addEventListener('pointerdown',e=>{e.preventDefault();boost=1;for(let i=0;i<18;i++)spawn();say()});
  /* the tap: six steam letters n,o,i,d,o,i are born from the pages and move exactly like all the others (nothing steers
     them). Their start points, speeds and tilts are worked out backwards, so their ordinary paths happen to cross
     the line "noi doi" at the same moment, upright and moving up together; then they slowly part and fade. */
  const WORDS=['noi doi','forever'],LAM=-Math.log(.992)*60,SZ=15/B,VM=-20;let Wd=[],wMeet=-1e9;   // wMeet: when the latest word lines up
  // steam motion in closed form (same as move(): drag on vx, rise speeding up, side sway, steady spin)
  const sway=(t,sw)=>-4/1.3*(Math.cos(t*1.3+sw)-Math.cos(sw));
  function say(){const T0=performance.now();if(T0<wMeet+500)return;   // a new word only once the last one has lined up
    // the words take turns, tap after tap (remembered across pages)
    let wi=0;try{wi=+(sessionStorage.getItem('bookmagic.word')||0)%WORDS.length;sessionStorage.setItem('bookmagic.word',(wi+1)%WORDS.length)}catch(e){}
    const WORD=WORDS[wi];const fs=B*SZ*1.15;c.font=`italic ${fs}px "IM Fell English",Georgia,serif`;
    const ws=[...WORD].map(ch=>c.measureText(ch).width*(ch===' '?1.7:1.05)),tot=ws.reduce((a,b)=>a+b,0),mid=bx+bw/2;
    let x=mid-tot/2;const ty=H-bh*1.55,L=[];
    [...WORD].forEach((ch,i)=>{const tx=x+ws[i]/2;x+=ws[i];if(ch===' ')return;
      const vm=-(19+Math.random()*7),sw=Math.random()*6.28,side=Math.sign(tx-mid)||1;let a=0,T=3,x0=tx,y0=H,vx0=0;
      for(let k=0;k<4;k++){y0=H-bh*(.5+.22*a);const D=y0-ty;T=(-vm-Math.sqrt(vm*vm-4.4*D))/2.2;   // y0+v0·T−1.1T² = ty with speed vm at T
        vx0=side*(4+a*10)+(Math.random()-.5)*4;x0=tx-vx0*(1-Math.exp(-LAM*T))/LAM-sway(T,sw);a=Math.min(.9,Math.abs((x0-mid)/(bw*.42)))}
      const vr=(Math.random()-.5)*.12;
      L.push({i:L.length,ch,x0,y0,vx0,vy0:vm+2.2*T,T,sw,vr,r0:-vr*T,life:T/.3})});
    const Tm=Math.max(...L.map(q=>q.T))+.05;L.forEach(q=>{q.d=Tm-q.T;q.t0=T0});Wd.push(...L);wMeet=T0+Tm*1000}
  function drawWord(){if(!Wd.length)return;const now=performance.now();
    for(let n=Wd.length-1;n>=0;n--){const q=Wd[n],t=(now-q.t0)/1000-q.d;if(t<0)continue;if(t>=q.life){Wd.splice(n,1);continue}
      const x=q.x0+q.vx0*(1-Math.exp(-LAM*t))/LAM+sway(t,q.sw),y=q.y0+q.vy0*t-1.1*t*t,r=q.r0+q.vr*t,k=t/q.life;
      // the eye-catcher: as the word lines up, a warm shimmer runs once along it, left to right
      const g=Math.exp(-((((t-q.T)-.1-q.i*.09)/.42)**2));
      const al=Math.min(1,Math.min(1,t/.5)*(1-k)**1.3+.55*g);if(al<=.01)continue;
      const w=B*2*SZ*(1+k*.45+.08*g);c.save();c.translate(x,y);
      if(g>.02){c.globalAlpha=.5*g;c.drawImage(HALO,-w*.75,-w*.75,w*1.5,w*1.5)}
      c.rotate(r);c.globalAlpha=al;c.drawImage(sprite(q.ch),-w/2,-w/2,w,w);
      if(g>.02){c.globalAlpha=.6*g;c.drawImage(sprite(q.ch),-w/2,-w/2,w,w)}c.restore()}}
  const HALO=document.createElement('canvas');HALO.width=HALO.height=64;
  {const x=HALO.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,210,130,.75)');g.addColorStop(.45,'rgba(255,170,80,.28)');g.addColorStop(1,'rgba(255,150,60,0)');x.fillStyle=g;x.fillRect(0,0,64,64);}
  function spawn(){
    const u=(Math.random()*2-1)*.9;                       // where along the pages: -0.9 (left end) … 0.9 (right end)
    const side=Math.sign(u)||1,a=Math.abs(u);
    P.push({ch:CH[Math.random()*CH.length|0],
      x:bx+bw*(.5+u*.42),y:H-bh*(.5+.22*a),                    // page surface rises toward the outer ends (the arch of the pages)
      vx:(side*(4+a*10)+(Math.random()-.5)*6)*(1+boost*.8),vy:-(12+Math.random()*9)*(1-a*.25)*(1+boost*1.3),
      s:(8+Math.random()*8)/B,r:(Math.random()-.5)*.5,vr:(Math.random()-.5)*.8,t:0,life:3.8+Math.random()*2,sw:Math.random()*6.28})}
  function move(p,dt){p.t+=dt;if(p.t>=p.life)return false;
    p.vx*=.992;p.vy-=2.2*dt;                              // the arch: outward first, then curving up
    p.x+=(p.vx+Math.sin(p.t*1.3+p.sw)*4)*dt;p.y+=p.vy*dt;p.r+=p.vr*dt;return true}
  // carry on from where the last page left off (the bar is the same on every page), instead of starting over
  try{const sv=JSON.parse(sessionStorage.getItem('bookmagic')||'null'),gone=sv?(Date.now()-sv.t)/1000:9;
    if(sv&&gone<4&&W){boost=sv.boost*Math.exp(-gone*.9);
      for(const q of sv.P){const p={...q,x:q.x+bx+bw/2,y:q.y+H};let g=gone,ok=true;while(g>0&&ok){const d=Math.min(.05,g);ok=move(p,d);g-=d}if(ok)P.push(p)}
      acc=sv.acc||0}}catch(e){}
  addEventListener('pagehide',()=>{try{sessionStorage.setItem('bookmagic',JSON.stringify({t:Date.now(),boost,acc,P:P.map(p=>({...p,x:p.x-bx-bw/2,y:p.y-H}))}))}catch(e){}});
  function frame(now){if(!run)return;
    const dt=Math.min(.05,(now-last)/1000);last=now;boost*=Math.exp(-dt*.9);acc+=dt*6*(1+boost*4);while(acc>1){acc--;spawn()}
    c.clearRect(0,0,W,H);c.globalCompositeOperation='lighter';
    // soft warm light over the open pages, breathing slowly
    const gx=bx+bw*.5,gy=H-bh*.55,gr=bh*(1.25+.1*Math.sin(Date.now()/900)+.35*boost);
    const g=c.createRadialGradient(gx,gy,0,gx,gy,gr);g.addColorStop(0,`rgba(255,220,150,${.6+.35*boost})`);g.addColorStop(.35,`rgba(255,170,80,${.2+.2*boost})`);g.addColorStop(1,'rgba(255,150,60,0)');
    c.globalAlpha=1;c.fillStyle=g;c.fillRect(gx-gr,gy-gr,gr*2,gr*2);
    for(let i=P.length-1;i>=0;i--){const p=P[i];if(!move(p,dt)){P.splice(i,1);continue}
      const k=p.t/p.life;
      const al=Math.min(1,p.t/.5)*(1-k)**1.3;if(al<=.01)continue;   // gentle appear, slow fade
      const sp=sprite(p.ch),z=p.s*(1+k*.45),w=B*2*z;
      c.globalAlpha=al;c.save();c.translate(p.x,p.y);c.rotate(p.r);c.drawImage(sp,-w/2,-w/2,w,w);c.restore()}
    drawWord();
    c.globalCompositeOperation='source-over';requestAnimationFrame(frame)}
  requestAnimationFrame(frame);
  document.addEventListener('visibilitychange',()=>{run=!document.hidden;if(run){last=performance.now();requestAnimationFrame(frame)}});
})();
