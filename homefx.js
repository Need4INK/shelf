/* Home: small living touches on the cards.
   1. Next to Collect: the mug's steam is alive — soft warm wisps rise and sway; a finger stirs them, then they settle.
   2. Latest Addition: the reading pumpkin is ticklish — a tap makes him wiggle and giggle. */
(function(){
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. steam ---------- */
  /* soft, puffy steam: cloudy puffs rise from the cup, swell, curl in a gentle draught and thin out.
     A finger pushes and swirls them; new puffs keep coming, so it always settles back. */
  const cv=document.getElementById('steam');
  if(cv){
    // the canvas covers the whole card (so stirred puffs are only cut off by the card's own edge);
    // drawing units = pixels of the nook_fg picture (544×296), which the card shows at its full height on the right
    const c=cv.getContext('2d'),CH=296;
    const MX=350,MY=104,MW=30;                             // cup opening: centre x, just under the rim, half width
    const ZONE={x0:228,x1:490,y0:0,y1:138};               // where a finger stirs the steam (elsewhere taps open the book as before)
    const nook=cv.parentElement;
    let last=0,on=false,raf=0,ptr=null,T=0,acc=0,parts=[],CW=544,X0=0,stirAt=0;
    function place(){const H=nook.offsetHeight,W=nook.offsetWidth,s=H/296;   // same as the card's background placement
      CW=W/s;X0=544-CW;cv.style.left='0px';cv.style.top='0px';cv.style.width=W+'px';cv.style.height=H+'px';
      const r=cv.getBoundingClientRect(),D=Math.min(devicePixelRatio||1,2);
      cv.width=Math.max(1,Math.round(r.width*D));cv.height=Math.max(1,Math.round(r.height*D));
      const sx=cv.width/CW,sy=cv.height/CH;c.setTransform(sx,0,0,sy,-X0*sx,0)}
    // a few cloudy puff pictures (lumpy, not perfect circles), made once
    const SPR=[];for(let n=0;n<5;n++){const e=document.createElement('canvas');e.width=e.height=96;const d=e.getContext('2d');
      for(let i=0;i<9;i++){const a=Math.random()*6.28,r=Math.random()*18,x=48+Math.cos(a)*r,y=48+Math.sin(a)*r,R=16+Math.random()*16,
        g=d.createRadialGradient(x,y,0,x,y,R);g.addColorStop(0,'rgba(255,255,255,.55)');g.addColorStop(.5,'rgba(255,255,255,.22)');g.addColorStop(1,'rgba(255,255,255,0)');
        d.fillStyle=g;d.fillRect(0,0,96,96)}
      d.globalCompositeOperation='source-in';d.fillStyle='#fff3e4';d.fillRect(0,0,96,96);SPR.push(e)}
    function emit(){const u=Math.random()*2-1;
      parts.push({x:MX+u*MW*.8,y:MY-2-Math.random()*4,vx:u*3,vy:-(12+Math.random()*7),age:0,life:3.2+Math.random()*1.8,
        r:7+Math.random()*5,g:1.0+Math.random()*.8,rot:Math.random()*6.28,vr:(Math.random()-.5)*.6,s:SPR[(Math.random()*SPR.length)|0],
        k:.55+Math.random()*.45,sd:Math.random()*100})}
    // a slow, lazy draught: the puffs curl left and right as they rise
    const draft=(x,y,sd)=>Math.sin(y*.045+T*.55+sd)*7+Math.sin(x*.03-T*.4+sd*.7)*4+Math.sin(T*.23)*3;
    function step(dt){
      T+=dt;acc+=dt*13;while(acc>1){acc--;if(parts.length<90)emit()}
      for(const p of parts){p.age+=dt;
        p.vx+=(draft(p.x,p.y,p.sd)-p.vx)*Math.min(1,dt*.9);p.vy+=(-(13+p.age*2)-p.vy)*Math.min(1,dt*.8);
        p.x+=p.vx*dt;p.y+=p.vy*dt;p.r+=p.g*dt*7;p.rot+=p.vr*dt}
      parts=parts.filter(p=>p.age<p.life&&p.y>-p.r*1.3)}
    function draw(){
      c.clearRect(X0,0,CW,CH);c.globalCompositeOperation='screen';
      for(const p of parts){const t=p.age/p.life,h=Math.max(0,Math.min(1,(MY-p.y)/MY));
        // thick and bright just above the cup, thinning out higher up
        const a=Math.min(1,p.age*2.2)*Math.pow(1-t,1.6)*(1-h*.55)*.5*p.k;if(a<.01)continue;
        c.globalAlpha=a;const S=p.r*2.4;c.save();c.translate(p.x,p.y);c.rotate(p.rot);c.drawImage(p.s,-S/2,-S/2,S,S);c.restore()}
      c.globalAlpha=1;c.globalCompositeOperation='source-over'}
    function frame(now){const dt=Math.min(.05,(now-last)/1000||0);last=now;step(dt);draw();raf=on?requestAnimationFrame(frame):0}
    function start(){if(on||document.hidden||reduce)return;on=true;last=performance.now();raf=requestAnimationFrame(frame)}
    function stop(){on=false;if(raf)cancelAnimationFrame(raf);raf=0}
    // a finger in the steam: nearby puffs are pushed away and swirled, and dragged along with a swipe
    const at=e=>{const r=cv.getBoundingClientRect();return{x:X0+(e.clientX-r.left)/r.width*CW,y:(e.clientY-r.top)/r.height*CH}};
    const inZone=q=>q.x>=ZONE.x0&&q.x<=ZONE.x1&&q.y>=ZONE.y0&&q.y<=ZONE.y1;
    function stir(q,mvx,mvy,tap){for(const p of parts){const dx=p.x-q.x,dy=p.y-q.y,d=Math.hypot(dx,dy)||1,R=p.r+26;if(d>R)continue;const f=1-d/R;
      p.vx+=(dx/d*(tap?55:25)-dy/d*20+mvx*.45)*f;p.vy+=(dy/d*(tap?55:25)+dx/d*20+mvy*.45)*f;p.vr+=(Math.random()-.5)*2*f;p.r+=tap?4*f:1.5*f}}
    // the canvas lets touches through; the card listens, and only touches that start in the steam stir it
    nook.addEventListener('pointerdown',e=>{const q=at(e);if(!inZone(q))return;e.preventDefault();stirAt=performance.now();
      ptr={...q,t:stirAt};stir(q,0,0,true);try{nook.setPointerCapture(e.pointerId)}catch(err){}});
    nook.addEventListener('pointermove',e=>{if(!ptr)return;const q=at(e),now=performance.now(),dt=Math.max(.008,(now-ptr.t)/1000);
      stir(q,Math.max(-400,Math.min(400,(q.x-ptr.x)/dt)),Math.max(-400,Math.min(400,(q.y-ptr.y)/dt)),false);ptr={...q,t:now};stirAt=now});
    const up=()=>{ptr=null};nook.addEventListener('pointerup',up);nook.addEventListener('pointercancel',up);
    // stirring the steam never opens the book
    nook.addEventListener('click',e=>{if(performance.now()-stirAt<600){e.stopPropagation();e.preventDefault()}},true);
    place();addEventListener('resize',place);if(window.ResizeObserver)new ResizeObserver(place).observe(nook);
    for(let i=0;i<300;i++)step(1/60);                       // already steaming when Home appears
    document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
    addEventListener('pagehide',stop);addEventListener('pageshow',start);
    draw();start();
  }

  /* ---------- 2. ticklish pumpkin ---------- */
  const pk=document.getElementById('pkReader'),card=document.getElementById('reading');
  if(pk&&card){
    pk.addEventListener('click',e=>{
      e.stopPropagation();
      pk.classList.remove('tickle');void pk.offsetWidth;pk.classList.add('tickle');
      if(reduce)return;
      // "ha ha ha" to his left: each "ha" pops in and fades, one after another, a little further from him each time
      card.querySelectorAll('.giggle').forEach(g=>g.remove());
      const g=document.createElement('div');g.className='giggle';g.setAttribute('aria-hidden','true');
      g.innerHTML='<span>ha</span><span>ha</span><span>ha</span>';card.appendChild(g);setTimeout(()=>g.remove(),1700);
    });
    pk.addEventListener('animationend',()=>pk.classList.remove('tickle'));
  }
})();
