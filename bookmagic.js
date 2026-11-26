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
    bh=r.height;bw=r.width;H=bh*(1+UP);cv.style.height=H+'px';const cr=cv.getBoundingClientRect();W=cr.width;bx=r.left-cr.left;
    cv.width=Math.round(W*D);cv.height=Math.round(H*D);c.setTransform(D,0,0,D,0,0);SPR.clear()}
  size();addEventListener('resize',size);book.addEventListener('load',size);
  if(document.fonts)document.fonts.ready.then(()=>SPR.clear());
  const CH='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',P=[];let last=performance.now(),acc=0,run=true,boost=0;
  // touching the middle half of the book: a burst of letters, then it calms back down
  const hit=document.createElement('div');hit.className='bookhit';hit.setAttribute('role','button');hit.setAttribute('aria-label','Magic book');cv.after(hit);
  hit.addEventListener('pointerdown',e=>{e.preventDefault();boost=1;for(let i=0;i<18;i++)spawn()});
  function spawn(){
    const u=(Math.random()*2-1)*.9;                       // where along the pages: -0.9 (left end) … 0.9 (right end)
    const side=Math.sign(u)||1,a=Math.abs(u);
    P.push({ch:CH[Math.random()*CH.length|0],
      x:bx+bw*(.5+u*.42),y:H-bh*(.5+.22*a),                    // page surface rises toward the outer ends (the arch of the pages)
      vx:(side*(4+a*10)+(Math.random()-.5)*6)*(1+boost*.8),vy:-(12+Math.random()*9)*(1-a*.25)*(1+boost*1.3),
      s:(8+Math.random()*8)/B,r:(Math.random()-.5)*.5,vr:(Math.random()-.5)*.8,t:0,life:3.8+Math.random()*2,sw:Math.random()*6.28})}
  function frame(now){if(!run)return;
    const dt=Math.min(.05,(now-last)/1000);last=now;boost*=Math.exp(-dt*.9);acc+=dt*6*(1+boost*4);while(acc>1){acc--;spawn()}
    c.clearRect(0,0,W,H);c.globalCompositeOperation='lighter';
    // soft warm light over the open pages, breathing slowly
    const gx=bx+bw*.5,gy=H-bh*.55,gr=bh*(1.25+.1*Math.sin(now/900)+.35*boost);
    const g=c.createRadialGradient(gx,gy,0,gx,gy,gr);g.addColorStop(0,`rgba(255,220,150,${.6+.35*boost})`);g.addColorStop(.35,`rgba(255,170,80,${.2+.2*boost})`);g.addColorStop(1,'rgba(255,150,60,0)');
    c.globalAlpha=1;c.fillStyle=g;c.fillRect(gx-gr,gy-gr,gr*2,gr*2);
    for(let i=P.length-1;i>=0;i--){const p=P[i];p.t+=dt;if(p.t>=p.life){P.splice(i,1);continue}
      const k=p.t/p.life;
      p.vx*=.992;p.vy-=2.2*dt;                            // the arch: outward first, then curving up
      p.x+=(p.vx+Math.sin(p.t*1.3+p.sw)*4)*dt;p.y+=p.vy*dt;p.r+=p.vr*dt;
      const al=Math.min(1,p.t/.5)*(1-k)**1.3;if(al<=.01)continue;   // gentle appear, slow fade
      const sp=sprite(p.ch),z=p.s*(1+k*.45),w=B*2*z;
      c.globalAlpha=al;c.save();c.translate(p.x,p.y);c.rotate(p.r);c.drawImage(sp,-w/2,-w/2,w,w);c.restore()}
    c.globalCompositeOperation='source-over';requestAnimationFrame(frame)}
  requestAnimationFrame(frame);
  document.addEventListener('visibilitychange',()=>{run=!document.hidden;if(run){last=performance.now();requestAnimationFrame(frame)}});
})();
