/* Intro on app launch only (not when coming back from another screen). Words come from intro.txt
   (one per line, edited by the owner — don't change its contents). The last word waits for Home
   to be ready (html.ready), then floats away and the intro fades into Home. Never longer than ~4.5 s. */
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
  if(!Array.isArray(words)||!words.length)words=['Bibbidi','Bobbidi','Boo'];
  const fresh=fetch('intro.txt',{cache:'no-store'}).then(r=>r.ok?r.text():null).then(t=>{const w=t&&parse(t);if(w&&w.length){try{localStorage.setItem('intro.words',JSON.stringify(w))}catch(e){}return w}return null}).catch(()=>null);
  /* Each word is EXACTLY the ghost's "Boo!" (scene.js startBoo/drawBoo): same 64px lettering, same specks,
     drift, fade and 3.4 s life, drawn in Home's stage units and scaled to the screen like Home (W/852).
     The intro only adds a tilt, a position per word and one word per second. */
  const gdot=document.createElement('canvas');gdot.width=gdot.height=64;
  {const d=gdot.getContext('2d'),g=d.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(232,222,255,1)');g.addColorStop(1,'rgba(200,180,255,0)');d.fillStyle=g;d.fillRect(0,0,64,64)}
  function wisps(word){
    const oc=document.createElement('canvas'),o=oc.getContext('2d'),F='italic 64px IntroFell, Georgia, serif';
    o.font=F;const W2=Math.ceil(o.measureText(word).width+40),H2=90;oc.width=W2;oc.height=H2;
    o.fillStyle='#fff';o.font=F;o.textAlign='center';o.textBaseline='middle';o.fillText(word,W2/2,H2/2+4);
    const px=o.getImageData(0,0,W2,H2).data,pts=[];
    for(let yy=0;yy<H2;yy+=2)for(let xx=0;xx<W2;xx+=2)if(px[(yy*W2+xx)*4+3]>128&&Math.random()<.75)
      pts.push({x:xx-W2/2,y:yy-H2/2,ox:0,oy:0,r:1.5+Math.random()*1.1,d:.4+Math.random()*1.4,p:Math.random()*6.28,vx:(Math.random()-.5)*16,vy:-(8+Math.random()*18)});
    return pts;
  }
  /* #slowintro in the address = test hook, plays 6x slower */
  const STEP=1.0,LIFE=3.4,SLOW=location.hash==='#slowintro'?6:1;let seq=[],t0=0,last=0,cleared=false,started=performance.now();
  function begin(list){seq=list.map((w,i)=>({w,s:i*STEP,pts:null,dx:(i%2?1:-1)*W*(.02+Math.random()*.045),dy:(i%2?-1:1)*H*(.025+Math.random()*.045),rot:(i%2?1:-1)*(5+Math.random()*6)*Math.PI/180}));t0=performance.now();last=t0;requestAnimationFrame(frame)}
  function frame(now){
    const dt=Math.min(.05,(now-last)/1000)/SLOW;last=now;const T=(now-t0)/1000/SLOW,S=W/852;
    const lastS=seq[seq.length-1].s;
    // once the last word has shown and Home is ready (or ~4 s passed), the dark fades and the smoke drifts off over Home
    if(!cleared&&T>=lastS+.6&&(document.documentElement.classList.contains('ready')||(now-started)/1000/SLOW>4)){
      cleared=true;ov.classList.add('clear');document.documentElement.classList.remove('intro-on')}
    c.clearRect(0,0,W,H);
    for(const it of seq){
      const t=T-it.s;if(t<0||t>LIFE)continue;
      if(!it.pts)it.pts=wisps(it.w);
      c.save();c.translate(W/2+it.dx,H*.46+it.dy);c.rotate(it.rot);c.scale(S,S);
      for(const q of it.pts){                                   // drawBoo, line for line
        const k=Math.max(0,t-q.d*.5);
        q.oy+=dt*q.vy*k*1.4;q.ox+=dt*(q.vx*k+Math.sin(t*1.8+q.p+q.y*.06)*(3+k*8));
        const a=Math.max(0,1-Math.max(0,t-.6-q.d*.5)/1.3)/(1+k*1.8),r=q.r*(1+k*1.5);if(a<=.01)continue;
        const R=r*2.2;c.globalAlpha=.5*a;c.drawImage(gdot,q.x+q.ox-R,q.y+q.oy-R,R*2,R*2);
      }
      c.restore();
    }
    c.globalAlpha=1;
    if(cleared&&T>lastS+LIFE){ov.remove();return}
    requestAnimationFrame(frame);
  }
  // start as soon as the lettering is ready (it's saved in the app, so this is quick), with the freshest words
  const font=document.fonts?document.fonts.load('italic 64px IntroFell').catch(()=>{}):null;
  Promise.race([Promise.all([font,Promise.race([fresh,new Promise(r=>setTimeout(r,350))])]),new Promise(r=>setTimeout(r,500))])
    .then(([,w]=[])=>begin(Array.isArray(w)&&w.length?w:words));
})();
