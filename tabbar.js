/* Bottom bar: same size as on Home on every page (Home's stage scale: max(width/852, (height - top safe area)/1810)). */
(function(){
  const p=document.createElement('div');p.style.cssText='position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top,0px);visibility:hidden;pointer-events:none';
  document.documentElement.appendChild(p);
  const fit=()=>document.documentElement.style.setProperty('--S',Math.max(innerWidth/852,(innerHeight-(p.offsetHeight||0))/1810));
  fit();addEventListener('resize',fit);
})();
