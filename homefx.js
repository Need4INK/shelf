/* Home: small living touches on the cards.
   1. Next to Collect: the mug's steam is alive — soft warm wisps rise and sway; a finger stirs them, then they settle.
   2. Latest Addition: the reading pumpkin is ticklish — a tap makes him wiggle and giggle. */
(function(){
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. steam ---------- */
  /* three glowing ribbons, like the painted curls: a wave travels up each one; a finger pushes the ribbon
     aside (it springs back), and a quick swipe also scatters a few loose puffs */
  const cv=document.getElementById('steam');
  if(cv){
    // canvas units = pixels of the nook_fg picture (544×296), which the card shows at its full height on the right
    const c=cv.getContext('2d'),CW=260,CH=135,FX=238;     // canvas covers picture x 238…498, y 0…135
    const MX=112,MY=108,N=28,TOP=3;                        // mug opening centre x, just below the rim; points per ribbon; highest point
    const nook=cv.parentElement;
    function place(){const H=nook.offsetHeight,W=nook.offsetWidth,s=H/296,left=W-544*s;   // same as the card's background placement
      cv.style.left=(left+FX*s)+'px';cv.style.top='0px';cv.style.width=(CW*s)+'px';cv.style.height=(CH*s)+'px';size()}
    let k=1,last=0,on=false,raf=0,ptr=null,T=0,puffs=[];
    const R=[{x:-20,ph:0,sp:1.7,amp:17,f:.058,w:9.5,h:.9},{x:2,ph:2.3,sp:1.45,amp:19,f:.048,w:11,h:1},{x:21,ph:4.4,sp:1.9,amp:14,f:.066,w:9,h:.78}]
      .map(r=>({...r,ox:new Float32Array(N),oy:new Float32Array(N),vx:new Float32Array(N),vy:new Float32Array(N)}));
    const dot=document.createElement('canvas');dot.width=dot.height=48;
    {const d=dot.getContext('2d'),g=d.createRadialGradient(24,24,0,24,24,24);
      g.addColorStop(0,'rgba(255,220,160,.9)');g.addColorStop(.4,'rgba(250,160,70,.4)');g.addColorStop(1,'rgba(240,130,50,0)');d.fillStyle=g;d.fillRect(0,0,48,48)}
    function size(){
      const r=cv.getBoundingClientRect();k=r.width/CW||1;const D=Math.min(devicePixelRatio||1,2);
      cv.width=Math.max(1,Math.round(r.width*D));cv.height=Math.max(1,Math.round(r.height*D));c.setTransform(cv.width/CW,0,0,cv.height/CH,0,0)}
    // where point i of a ribbon is now (without the finger's push)
    function base(r,i){const u=i/(N-1),y=MY-(MY-TOP)*u*r.h,grow=Math.pow(u,.8);
      // the breathing: each ribbon slowly leans and its height swells a little
      const x=MX+r.x+Math.sin((MY-y)*r.f-T*r.sp+r.ph)*r.amp*grow+Math.sin(T*.4+r.ph)*8*u*u;
      return [x,y]}
    function step(dt){
      T+=dt;
      for(const r of R)for(let i=1;i<N;i++){     // the push springs back
        r.vx[i]+=(-r.ox[i]*14-r.vx[i]*3.2)*dt;r.vy[i]+=(-r.oy[i]*14-r.vy[i]*3.2)*dt;r.ox[i]+=r.vx[i]*dt;r.oy[i]+=r.vy[i]*dt}
      for(const p of puffs){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.pow(.3,dt);p.vy+=(-14-p.vy)*Math.min(1,dt*2);p.r+=dt*7}
      puffs=puffs.filter(p=>p.age<p.life)}
    function draw(){
      c.clearRect(0,0,CW,CH);c.lineCap='round';c.lineJoin='round';
      for(const r of R){
        const P=[];for(let i=0;i<N;i++){const [x,y]=base(r,i);P.push([x+r.ox[i],y+r.oy[i]])}
        for(let pass=0;pass<2;pass++){          // soft glow underneath, bright core on top
          for(let i=1;i<N;i++){const u=i/(N-1),fade=Math.min(1,u*14)*Math.pow(1-u,1.1);if(fade<.02)continue;
            const w=r.w*(1-u*.7)*(pass?1:2.4);
            c.strokeStyle=pass?`rgba(255,${172+Math.round(45*(1-u))},${82+Math.round(60*(1-u))},${.95*fade})`:`rgba(245,140,50,${.3*fade})`;
            c.lineWidth=w;c.beginPath();const a=P[i-1],b=P[i],m=P[Math.min(N-1,i+1)];
            c.moveTo(a[0],a[1]);c.quadraticCurveTo(b[0],b[1],(b[0]+m[0])/2,(b[1]+m[1])/2);c.stroke()}}
      }
      if(puffs.length){c.globalCompositeOperation='lighter';
        for(const p of puffs){const t=p.age/p.life;c.globalAlpha=Math.min(1,p.age*5)*(1-t)*.5;const s=p.r*2;c.drawImage(dot,p.x-s/2,p.y-s/2,s,s)}
        c.globalAlpha=1;c.globalCompositeOperation='source-over'}
    }
    function frame(now){const dt=Math.min(.05,(now-last)/1000||0);last=now;step(dt);draw();raf=on?requestAnimationFrame(frame):0}
    function start(){if(on||document.hidden||reduce)return;on=true;last=performance.now();raf=requestAnimationFrame(frame)}
    function stop(){on=false;if(raf)cancelAnimationFrame(raf);raf=0}
    const at=e=>{const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*CW,y:(e.clientY-r.top)/r.height*CH}};
    function stir(q,mvx,mvy,tap){
      const sp=Math.hypot(mvx,mvy);
      for(const r of R)for(let i=2;i<N;i++){const [bx,by]=base(r,i),x=bx+r.ox[i],y=by+r.oy[i],dx=x-q.x,dy=y-q.y,d=Math.hypot(dx,dy)||1;
        if(d>40)continue;const f=1-d/40;
        r.vx[i]+=(dx/d*(tap?160:70)+mvx*.5)*f;r.vy[i]+=(dy/d*(tap?60:30)+mvy*.3)*f*.6;
        if((tap||sp>120)&&Math.random()<.18*f)puffs.push({x,y,vx:dx/d*30+mvx*.3,vy:-10+mvy*.2,r:3,age:0,life:.9+Math.random()*.6})}
      if(!on&&!reduce)start()}
    cv.addEventListener('pointerdown',e=>{e.preventDefault();const q=at(e);ptr={...q,t:performance.now()};stir(q,0,0,true);try{cv.setPointerCapture(e.pointerId)}catch(err){}});
    cv.addEventListener('pointermove',e=>{if(!ptr)return;const q=at(e),now=performance.now(),dt=Math.max(.008,(now-ptr.t)/1000);
      stir(q,Math.max(-600,Math.min(600,(q.x-ptr.x)/dt)),Math.max(-600,Math.min(600,(q.y-ptr.y)/dt)),false);ptr={...q,t:now}});
    const up=()=>{ptr=null};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
    cv.addEventListener('click',e=>e.stopPropagation());   // stirring the steam never opens the book
    place();addEventListener('resize',place);if(window.ResizeObserver)new ResizeObserver(place).observe(nook);
    document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
    addEventListener('pagehide',stop);addEventListener('pageshow',start);
    draw();start();
  }

  /* ---------- 2. ticklish pumpkin ---------- */
  const pk=document.getElementById('pkReader'),card=document.getElementById('reading');
  if(pk&&card){
    let n=0;
    pk.addEventListener('click',e=>{
      e.stopPropagation();
      pk.classList.remove('tickle');void pk.offsetWidth;pk.classList.add('tickle');
      if(reduce)return;
      // a little giggle floats up beside him
      const words=['hee hee!','hehe!','tee hee!'],h=document.createElement('span');
      h.className='giggle';h.textContent=words[n++%words.length];h.style.setProperty('--dx',(n%2?-1:1)*(10+Math.random()*16)+'px');
      h.style.left=(n%2?62:88)+'%';card.appendChild(h);setTimeout(()=>h.remove(),1500);
    });
    pk.addEventListener('animationend',()=>pk.classList.remove('tickle'));
  }
})();
