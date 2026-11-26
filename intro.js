/* Intro on app launch only (not when coming back from another screen). Words come from intro.txt
   (one per line, edited by the owner — don't change its contents). The last word waits for Home
   to be ready (html.ready), then floats away and the intro fades into Home. Never longer than ~6 s. */
(function(){
  const ov=document.getElementById('intro');
  let seen=false;try{seen=sessionStorage.getItem('intro.shown')==='1';sessionStorage.setItem('intro.shown','1')}catch(e){}
  if(seen||matchMedia('(prefers-reduced-motion: reduce)').matches){ov.remove();return}
  document.documentElement.classList.add('intro-on');
  const cv=ov.querySelector('canvas'),c=cv.getContext('2d'),D=Math.min(devicePixelRatio||1,2);
  let W=0,H=0;const size=()=>{W=innerWidth;H=innerHeight;cv.width=W*D;cv.height=H*D;c.setTransform(D,0,0,D,0,0)};size();addEventListener('resize',size);
  // words: last saved copy straight away; the file is checked quickly and remembered for next time
  const parse=t=>t.split(/\r?\n/).map(w=>w.trim()).filter(Boolean).slice(0,6);
  let words=null;try{words=JSON.parse(localStorage.getItem('intro.words')||'null')}catch(e){}
  if(!Array.isArray(words)||!words.length)words=['bibiddi','bobiddi','boo'];
  const fresh=fetch('intro.txt',{cache:'no-store'}).then(r=>r.ok?r.text():null).then(t=>{const w=t&&parse(t);if(w&&w.length){try{localStorage.setItem('intro.words',JSON.stringify(w))}catch(e){}return w}return null}).catch(()=>null);
  // a soft glowing dot, drawn once and reused for every wisp
  const dot=document.createElement('canvas');dot.width=dot.height=32;{const d=dot.getContext('2d'),g=d.createRadialGradient(16,16,0,16,16,16);g.addColorStop(0,'rgba(240,230,255,1)');g.addColorStop(.45,'rgba(215,195,255,.45)');g.addColorStop(1,'rgba(200,180,255,0)');d.fillStyle=g;d.fillRect(0,0,32,32)}
  /* Each word is made like the ghost's "Boo!": only soft smoke specks (no solid letters) plus a faint hazy
     glow. The specks drift together into the word, hold briefly, then float up and apart. */
  // letters drawn one by one with a little extra space, so neighbours don't merge in the smoke
  const GAP=.085;
  function spaced(x,word,cx,cy,fs){const ws=[...word].map(ch=>x.measureText(ch).width),tot=ws.reduce((a,b)=>a+b,0)+GAP*fs*(ws.length-1);
    let px=cx-tot/2;x.textAlign='left';[...word].forEach((ch,i)=>{x.fillText(ch,px,cy);px+=ws[i]+GAP*fs});return tot}
  function wisps(word,k){
    const oc=document.createElement('canvas'),o=oc.getContext('2d');
    let fs=Math.min(66,W*.165)*(k||1);const setF=x=>{x.font=`italic ${fs}px IntroFell, Georgia, serif`;x.textBaseline='middle'};   // smaller words read more like the ghost's Boo
    setF(o);const width=()=>[...word].reduce((a,ch)=>a+o.measureText(ch).width,0)+GAP*fs*([...word].length-1);
    let mw=width();if(mw>W*.8){fs*=W*.8/mw;setF(o);mw=width()}
    const w=Math.ceil(mw+fs*.8),h=Math.ceil(fs*1.6);oc.width=w;oc.height=h;
    setF(o);o.fillStyle='#fff';spaced(o,word,w/2,h/2+fs*.04,fs);
    const px=o.getImageData(0,0,w,h).data,pts=[],st=Math.max(2,Math.round(fs/31)),u=fs/64,E=1;
    const inside=(x,y)=>x>=0&&y>=0&&x<w&&y<h&&px[(y*w+x)*4+3]>110;
    // specks only well inside the strokes (not on their edges), so the holes in letters stay open
    // letters are made fatter towards the outside only: find the space around the letters (reachable from the
    // edge of the picture) so the holes inside letters keep their size
    const out=new Uint8Array(w*h),stack=[];
    for(let x=0;x<w;x++){stack.push(x,0,x,h-1)}for(let y=0;y<h;y++){stack.push(0,y,w-1,y)}
    while(stack.length){const y=stack.pop(),x=stack.pop(),i=y*w+x;if(x<0||y<0||x>=w||y>=h||out[i]||px[i*4+3]>110)continue;out[i]=1;stack.push(x+1,y,x-1,y,x,y+1,x,y-1)}
    const G=Math.max(2,Math.round(fs*.028)),dirs=[[1,0],[-1,0],[0,1],[0,-1],[.7,.7],[-.7,.7],[.7,-.7],[-.7,-.7]];
    const near=(x,y)=>dirs.some(([a,b])=>inside(Math.round(x+a*G),Math.round(y+b*G))||inside(Math.round(x+a*G/2),Math.round(y+b*G/2)));
    for(let y=0;y<h;y+=st)for(let x=0;x<w;x+=st)if((inside(x,y)&&inside(x-E,y)&&inside(x+E,y)&&inside(x,y-E)&&inside(x,y+E)||out[y*w+x]&&near(x,y))&&Math.random()<.85)
      pts.push({x:x-w/2,y:y-h/2,dx:0,dy:0,
        r:(1.1+Math.random()*1.0)*u,d:Math.random(),p:Math.random()*6.28,vx:(Math.random()-.5)*16*u,vy:-(8+Math.random()*18)*u,bx:0,by:0});
    // the puff out: every speck is thrown outward from the word's centre
    for(const q of pts){const L=Math.hypot(q.x,q.y*1.6)+1,sp=fs*(2.2+Math.random()*3.2),j=(Math.random()-.5)*.9,ca=Math.cos(j),sa=Math.sin(j),ux=q.x/L,uy=q.y*1.6/L;
      q.bx=(ux*ca-uy*sa)*sp;q.by=(ux*sa+uy*ca)*sp-fs*.6}
    // faint hazy glow of the word (shadow only, no solid letters), kept tight so it doesn't fill the holes
    const hc=document.createElement('canvas'),hx=hc.getContext('2d'),pad=Math.ceil(fs*.6);hc.width=w+pad*2;hc.height=h+pad*2;
    setF(hx);hx.shadowColor='rgba(205,185,255,1)';hx.shadowBlur=fs*.18;hx.shadowOffsetX=20000;hx.fillStyle='#fff';spaced(hx,word,hc.width/2-20000,hc.height/2+fs*.04,fs);
    return {pts,fs,halo:hc};
  }
  /* #slowintro in the address = test hook, plays 6x slower */
  const STEP=1.0,FORM=.6,HOLD=.3,SLOW=location.hash==='#slowintro'?6:1;let seq=[],t0=0,last=0,endAt=null,started=performance.now(),sparks=[];
  function begin(list){seq=list.map((w,i)=>({w,s:i*STEP,data:null,dx:(i%2?1:-1)*W*(.02+Math.random()*.045),dy:(i%2?-1:1)*H*(.025+Math.random()*.045),rot:(i%2?1:-1)*(5+Math.random()*6)*Math.PI/180}));t0=performance.now();last=t0;requestAnimationFrame(frame)}
  function puff(n,fs,it){for(let i=0;i<n;i++){const a=Math.random()*6.28,v=(70+Math.random()*170)*fs/64,ox=(Math.random()-.5)*fs*2.6,oy=(Math.random()-.5)*fs*.6;
    sparks.push({x:it.dx+ox*Math.cos(it.rot),y:it.dy+ox*Math.sin(it.rot)+oy,vx:Math.cos(a)*v,vy:Math.sin(a)*v-12,a:.9,r:(.7+Math.random()*1.1)*fs/64})}}
  function frame(now){
    const dt=Math.min(.05,(now-last)/1000)/SLOW;last=now;const T=(now-t0)/1000/SLOW;
    const ready=document.documentElement.classList.contains('ready'),lastI=seq.length-1;
    // the last word holds until Home is ready (with a hard limit), then floats away over Home
    if(endAt===null&&T>=seq[lastI].s+FORM+HOLD+.4&&(ready||(now-started)/1000/SLOW>4))endAt=T;
    c.clearRect(0,0,W,H);
    for(let i=0;i<seq.length;i++){
      const it=seq[i];if(T<it.s)continue;
      if(!it.data)it.data=wisps(it.w,i===lastI?2:1);   // the last word (boo) is 2x bigger
      const D=it.data,u=D.fs/64,lt=T-it.s;
      const dis=i===lastI?(endAt===null?null:endAt-it.s):FORM+HOLD-.1;    // start floating away just before the next word
      const kw=dis===null||lt<dis?0:lt-dis,form=Math.min(1,lt/FORM);
      if(kw>0&&!it.puffed){it.puffed=1;puff(40,D.fs,it)}                 // the little sparkle burst as it goes out in a puff
      c.save();c.translate(W/2+it.dx,H*.46+it.dy);c.rotate(it.rot);
      // hazy glow behind the specks
      const ha=Math.min(1,lt/FORM)**2*Math.max(0,1-kw/.7)*.12+(kw>0&&kw<.28?Math.sin(kw/.28*Math.PI)*.5:0);   // + soft flash as it puffs out
      if(ha>.01){c.globalAlpha=ha;c.drawImage(D.halo,-D.halo.width/2,-D.halo.height/2)}
      for(const q of D.pts){
        const uq=Math.max(0,Math.min(1,(lt-q.d*FORM*.5)/(FORM*.55))),e=uq*uq*(3-2*uq);   // each puff fades in on the spot, out of thin air
        const k=Math.max(0,kw-q.d*.12);                                                // ... and goes out in a puff, nearly all at once
        if(k>0){const f=Math.exp(-k*4.5);q.dx+=q.bx*f*dt;q.dy+=q.by*f*dt;                 // burst outward, slowing quickly
          q.dy+=dt*q.vy*k*1.4;q.dx+=dt*(q.vx*k+Math.sin(T*1.8+q.p+q.y*.06/u)*(3+k*8)*u)}   // then drift like the ghost's Boo
        const wob=Math.sin(T*1.9+q.p)*D.fs*.016,lift=-Math.max(0,lt-FORM*.6)*D.fs*.05*(.5+q.d);   // keeps drifting gently, like the ghost's Boo
        const a=e*(k>0?(k<.07?1+k/.07*.5:1.5*Math.max(0,1-(k-.07)/.62))/(1+k*1.8):1);if(a<=.01)continue;   // brief brightening, then fade
        const r=q.r*(1+k*2.6)*(k>0?3.1:2.4);      // smaller while the word is shown (open holes), puffier as it bursts
        c.globalAlpha=.42*a;c.drawImage(dot,q.x+q.dx+wob-r,q.y+q.dy+lift-r,r*2,r*2);
      }
      c.restore();
    }
    // a few faint sparkles around each word
    c.save();c.translate(W/2,H*.46);
    for(const s of sparks){s.x+=s.vx*dt;s.y+=s.vy*dt;s.vx*=.92;s.vy=s.vy*.92+20*dt;s.a-=dt*1.1;if(s.a<=0)continue;c.globalAlpha=s.a;c.drawImage(dot,s.x-s.r*3,s.y-s.r*3,s.r*6,s.r*6)}
    c.restore();sparks=sparks.filter(s=>s.a>0);c.globalAlpha=1;
    // the dark slowly clears as the last word bursts; the word keeps puffing at its own speed over Home
    if(endAt!==null&&T>endAt+.25&&!ov.classList.contains('out')){ov.classList.add('out');document.documentElement.classList.remove('intro-on')}
    if(endAt!==null&&T>endAt+2.2&&!sparks.length){ov.remove();return}
    requestAnimationFrame(frame);
  }
  // start as soon as the lettering is ready (it's saved in the app, so this is quick), with the freshest words
  const font=document.fonts?document.fonts.load('italic 64px IntroFell').catch(()=>{}):null;
  Promise.race([Promise.all([font,Promise.race([fresh,new Promise(r=>setTimeout(r,350))])]),new Promise(r=>setTimeout(r,500))])
    .then(([,w]=[])=>begin(Array.isArray(w)&&w.length?w:words));
})();
