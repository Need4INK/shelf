/* Own cover photo: take a photo or pick one from the library, drag 4 gold corners onto the book's corners,
   and get a straight 600×900 JPEG (the corner-and-straighten idea comes from the Game Boy catalog app).
   CoverPhoto.pick() → Promise<Blob|null>. Needs nothing else; the page saves the Blob (Store.setCover). */
const CoverPhoto = (() => {
  const OW = 600, OH = 900, MAXSRC = 1600;
  let css = false;
  function addCSS() {
    if (css) return; css = true;
    const s = document.createElement('style');
    s.textContent = `#cph{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;background:radial-gradient(ellipse at 50% 0%,#3a1838 0%,#1a0a1e 55%,#0e0416 100%);
 padding:calc(env(safe-area-inset-top,0px) + 12px) 16px calc(env(safe-area-inset-bottom,0px) + 16px);color:#f3e3c3;font:17px/1.4 "EB Garamond",Georgia,serif;touch-action:none;-webkit-user-select:none;user-select:none}
#cph h2{margin:0;text-align:center;font:italic 32px/1.15 "IM Fell English",Georgia,serif;color:#f1cf7c;text-shadow:0 0 14px rgba(255,180,80,.3),0 2px 2px #000}
#cph p{margin:2px 0 10px;text-align:center;font-size:15px;opacity:.8}
#cph .cph-wrap{flex:1;min-height:0;position:relative}
#cph canvas{position:absolute;inset:0;width:100%;height:100%;touch-action:none}
#cph .cph-row{display:flex;gap:10px;margin-top:12px}
#cph button{flex:1;min-height:50px;border-radius:999px;font:600 18px "EB Garamond",Georgia,serif;border:1.5px solid rgba(232,190,140,.45);background:rgba(30,10,32,.7);color:#f1dcc0;cursor:pointer}
#cph button.go{background:linear-gradient(180deg,#f3d29a,#d9a066);color:#2a1410;border:0;box-shadow:0 3px 8px rgba(0,0,0,.5)}
#cph button:disabled{opacity:.5}`;
    document.head.appendChild(s);
  }
  function chooseFile() {
    return new Promise(res => {
      const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*';
      i.style.cssText = 'position:fixed;left:-99px;width:1px;height:1px;opacity:0';
      document.body.appendChild(i);
      let done = false; const end = f => { if (done) return; done = true; i.remove(); res(f); };
      i.onchange = () => end(i.files[0] || null);
      i.oncancel = () => end(null);
      // no cancel event on older iPhones: give up once the page has focus again without a file
      addEventListener('focus', () => setTimeout(() => { if (!i.files.length) end(null); }, 1500), { once: true });
      i.click();
    });
  }
  async function loadImage(f) {
    const url = URL.createObjectURL(f);
    try {
      const img = await new Promise((ok, no) => { const m = new Image(); m.onload = () => ok(m); m.onerror = no; m.src = url; });
      const s = Math.min(1, MAXSRC / Math.max(img.naturalWidth, img.naturalHeight));
      // shrink in halving steps (one big jump looks jagged in Safari)
      let im = img, w = img.naturalWidth, h = img.naturalHeight;
      const tw = Math.round(w * s), th = Math.round(h * s);
      while (w > tw * 2) { const t = document.createElement('canvas'); t.width = Math.ceil(w / 2); t.height = Math.ceil(h / 2);
        t.getContext('2d').drawImage(im, 0, 0, t.width, t.height); im = t; w = t.width; h = t.height; }
      const c = document.createElement('canvas'); c.width = tw; c.height = th; c.getContext('2d').drawImage(im, 0, 0, tw, th);
      return c;
    } finally { URL.revokeObjectURL(url); }
  }
  /* perspective: map the output rectangle onto the 4 corners */
  function homog(s, d) {
    const A = [], B = [];
    for (let i = 0; i < 4; i++) { const [x, y] = s[i], [u, v] = d[i];
      A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); B.push(u); A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); B.push(v); }
    for (let c = 0; c < 8; c++) { let p = c; for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      [A[c], A[p]] = [A[p], A[c]]; [B[c], B[p]] = [B[p], B[c]];
      for (let r = 0; r < 8; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let k = c; k < 8; k++) A[r][k] -= f * A[c][k]; B[r] -= f * B[c]; } }
    return B.map((b, i) => b / A[i][i]);
  }
  function straighten(src, Q) {
    const sw = src.width, sh = src.height, s = src.getContext('2d').getImageData(0, 0, sw, sh).data;
    const H = homog([[0, 0], [OW, 0], [OW, OH], [0, OH]], Q), out = new ImageData(OW, OH), o = out.data, off = [.25, .75];
    for (let v = 0; v < OH; v++) for (let u = 0; u < OW; u++) {
      let r = 0, g = 0, b = 0;
      for (const oy of off) for (const ox of off) {
        const U = u + ox, V = v + oy, z = H[6] * U + H[7] * V + 1;
        let x = (H[0] * U + H[1] * V + H[2]) / z - .5, y = (H[3] * U + H[4] * V + H[5]) / z - .5;
        x = Math.max(0, Math.min(sw - 1.001, x)); y = Math.max(0, Math.min(sh - 1.001, y));
        const x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0, i = (y0 * sw + x0) * 4, j = i + sw * 4;
        r += (s[i] * (1 - fx) + s[i + 4] * fx) * (1 - fy) + (s[j] * (1 - fx) + s[j + 4] * fx) * fy;
        g += (s[i + 1] * (1 - fx) + s[i + 5] * fx) * (1 - fy) + (s[j + 1] * (1 - fx) + s[j + 5] * fx) * fy;
        b += (s[i + 2] * (1 - fx) + s[i + 6] * fx) * (1 - fy) + (s[j + 2] * (1 - fx) + s[j + 6] * fx) * fy;
      }
      const k = (v * OW + u) * 4; o[k] = r / 4; o[k + 1] = g / 4; o[k + 2] = b / 4; o[k + 3] = 255;
    }
    const c = document.createElement('canvas'); c.width = OW; c.height = OH; c.getContext('2d').putImageData(out, 0, 0);
    return new Promise(r => c.toBlob(r, 'image/jpeg', .86));
  }

  /* find the cover: tell it apart from the background (colours along the photo's edge), take the biggest
     blob, and fit the 4-corner shape with the largest area inside its outline. null if unsure. */
  function detect(src) {
    const k = Math.min(1, 360 / Math.max(src.width, src.height)), w = Math.max(8, Math.round(src.width * k)), h = Math.max(8, Math.round(src.height * k));
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const cx = c.getContext('2d', { willReadFrequently: true }); cx.filter = 'blur(1.5px)'; cx.drawImage(src, 0, 0, w, h);
    const d = cx.getImageData(0, 0, w, h).data, N = w * h;
    // background colours: 4 clusters from a band along the edge
    const m = Math.max(2, Math.round(Math.min(w, h) * .04)), edge = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x < m || y < m || x >= w - m || y >= h - m) { const i = (y * w + x) * 4; edge.push([d[i], d[i + 1], d[i + 2]]); }
    let C = [0, .25, .5, .75].map(f => edge[Math.floor(f * (edge.length - 1))].slice());
    for (let it = 0; it < 8; it++) {
      const S = C.map(() => [0, 0, 0, 0]);
      for (const p of edge) { let b = 0, bd = 1e9; C.forEach((q, j) => { const dd = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2; if (dd < bd) { bd = dd; b = j; } }); const t = S[b]; t[0] += p[0]; t[1] += p[1]; t[2] += p[2]; t[3]++; }
      C = C.map((q, j) => S[j][3] ? [S[j][0] / S[j][3], S[j][1] / S[j][3], S[j][2] / S[j][3]] : q);
    }
    const dist = new Float32Array(N);
    for (let i = 0; i < N; i++) { const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2]; let bd = 1e9;
      for (const q of C) { const dd = (r - q[0]) ** 2 + (g - q[1]) ** 2 + (b - q[2]) ** 2; if (dd < bd) bd = dd; } dist[i] = Math.sqrt(bd); }
    // Otsu threshold on the distances
    const hist = new Float64Array(256); let mx = 0; for (let i = 0; i < N; i++) if (dist[i] > mx) mx = dist[i];
    if (mx < 20) return null;
    for (let i = 0; i < N; i++) hist[Math.min(255, Math.floor(dist[i] / mx * 255))]++;
    let sum = 0; for (let t = 0; t < 256; t++) sum += t * hist[t];
    let wB = 0, sB = 0, best = 0, th = 0;
    for (let t = 0; t < 256; t++) { wB += hist[t]; if (!wB) continue; const wF = N - wB; if (!wF) break; sB += t * hist[t];
      const v = wB * wF * (sB / wB - (sum - sB) / wF) ** 2; if (v > best) { best = v; th = t; } }
    const cut = Math.max(18, (th + .5) / 255 * mx);
    const byColour = new Uint8Array(N); for (let i = 0; i < N; i++) byColour[i] = dist[i] > cut ? 1 : 0;
    // second try for a cover close to the background's colour: its outline (strong brightness edges)
    const byEdges = () => { const e = new Uint8Array(N);
      const mag = new Float32Array(N); for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x;
        let m2 = 0; for (let ch = 0; ch < 3; ch++) { const gx = d[(i + 1) * 4 + ch] - d[(i - 1) * 4 + ch], g2 = d[(i + w) * 4 + ch] - d[(i - w) * 4 + ch]; m2 += gx * gx + g2 * g2; }
        mag[i] = Math.sqrt(m2); }
      const sorted = Array.from(mag).sort((p, q) => p - q), t = Math.max(10, sorted[Math.floor(N * .88)]);
      for (let i = 0; i < N; i++) e[i] = mag[i] > t ? 1 : 0; return e; };
    return fromMask(byColour, 2) || fromMask(byEdges(), 4);

    function fromMask(fg, close) {
    // close small gaps (text, pictures on the cover), then fill holes
    const grow = (a, v) => { const o = new Uint8Array(N); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let hit = !v;
      for (let dy = -1; dy <= 1 && hit !== v; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= w || Y >= h) continue; if (!!a[Y * w + X] === v) { hit = v; break; } }
      o[y * w + x] = hit ? 1 : 0; } return o; };
    for (let r = 0; r < close; r++) fg = grow(fg, true);
    // holes: anything the background can't reach from the photo's edge belongs to the cover
    { const out = new Uint8Array(N), st = []; for (let x = 0; x < w; x++) for (const y of [0, h - 1]) st.push(y * w + x); for (let y = 0; y < h; y++) for (const x of [0, w - 1]) st.push(y * w + x);
      while (st.length) { const j = st.pop(); if (out[j] || fg[j]) continue; out[j] = 1; const x = j % w, y = (j / w) | 0;
        if (x > 0) st.push(j - 1); if (x < w - 1) st.push(j + 1); if (y > 0) st.push(j - w); if (y < h - 1) st.push(j + w); }
      for (let i = 0; i < N; i++) if (!out[i]) fg[i] = 1; }
    for (let r = 0; r < close; r++) fg = grow(fg, false);
    // biggest blob
    const lab = new Int32Array(N), st = []; let L = 0, bigL = 0, bigN = 0;
    for (let i = 0; i < N; i++) if (fg[i] && !lab[i]) { L++; let n = 0; st.push(i); lab[i] = L;
      while (st.length) { const j = st.pop(); n++; const x = j % w, y = (j / w) | 0;
        for (const q of [x > 0 ? j - 1 : -1, x < w - 1 ? j + 1 : -1, y > 0 ? j - w : -1, y < h - 1 ? j + w : -1]) if (q >= 0 && fg[q] && !lab[q]) { lab[q] = L; st.push(q); } }
      if (n > bigN) { bigN = n; bigL = L; } }
    if (bigN < N * .06 || bigN > N * .97) return null;
    // outline points → convex hull
    const pts = [];
    for (let y = 0; y < h; y++) { let a = -1, b = -1; for (let x = 0; x < w; x++) if (lab[y * w + x] === bigL) { if (a < 0) a = x; b = x; } if (a >= 0) { pts.push([a, y], [b + 1, y + 1]); } }
    pts.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
    for (const p of pts) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    const hull = lo.slice(0, -1).concat(up.slice(0, -1)); if (hull.length < 4) return null;
    // largest 4-corner shape on the hull (start from the 4 diagonal extremes, then improve one corner at a time)
    const area = q => { let a = 0; for (let i = 0; i < 4; i++) { const p = q[i], r = q[(i + 1) % 4]; a += p[0] * r[1] - r[0] * p[1]; } return Math.abs(a) / 2; };
    const ext = f => hull.reduce((b, p) => f(p) > f(b) ? p : b, hull[0]);
    let q = [ext(p => -p[0] - p[1]), ext(p => p[0] - p[1]), ext(p => p[0] + p[1]), ext(p => p[1] - p[0])];
    for (let it = 0; it < 4; it++) for (let i = 0; i < 4; i++) { let bA = area(q), bp = q[i];
      for (const p of hull) { const t = q.slice(); t[i] = p; const A = area(t); if (A > bA) { bA = A; bp = p; } } q[i] = bp; }
    // order: top-left, top-right, bottom-right, bottom-left
    const mxc = q.reduce((a, p) => a + p[0], 0) / 4, myc = q.reduce((a, p) => a + p[1], 0) / 4;
    q.sort((a, b) => Math.atan2(a[1] - myc, a[0] - mxc) - Math.atan2(b[1] - myc, b[0] - mxc));   // clockwise from left
    let s0 = 0; q.forEach((p, i) => { if (p[0] + p[1] < q[s0][0] + q[s0][1]) s0 = i; }); q = [0, 1, 2, 3].map(i => q[(s0 + i) % 4]);
    // looks like a book? fills its outline, sane angles and sides
    if (area(q) < bigN * .82 || area(q) > bigN * 1.25) return null;
    for (let i = 0; i < 4; i++) { const a = q[(i + 3) % 4], b = q[i], e = q[(i + 1) % 4];
      const v1 = [a[0] - b[0], a[1] - b[1]], v2 = [e[0] - b[0], e[1] - b[1]];
      const ang = Math.acos((v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(...v1) * Math.hypot(...v2) || 1)) * 180 / Math.PI;
      if (ang < 55 || ang > 125) return null; }
    const sides = [0, 1, 2, 3].map(i => Math.hypot(q[(i + 1) % 4][0] - q[i][0], q[(i + 1) % 4][1] - q[i][1]));
    if (Math.max(sides[0], sides[2]) > 2.2 * Math.min(sides[0], sides[2]) || Math.max(sides[1], sides[3]) > 2.2 * Math.min(sides[1], sides[3])) return null;
    return q.map(p => [Math.min(src.width, Math.max(0, p[0] / k)), Math.min(src.height, Math.max(0, p[1] / k))]);
    }
  }
  /* the corner editor; resolves with the 4 corners (photo pixels) or null */
  function editor(src) {
    addCSS();
    return new Promise(res => {
      const box = document.createElement('div'); box.id = 'cph';
      box.innerHTML = `<h2>Fit the cover</h2><p>Drag the four gold corners onto the corners of the cover</p>
        <div class="cph-wrap"><canvas></canvas></div>
        <div class="cph-row"><button class="no">Cancel</button><button class="go">Use this cover</button></div>`;
      document.body.appendChild(box);
      const cv = box.querySelector('canvas'), wrap = box.querySelector('.cph-wrap'), ctx = cv.getContext('2d');
      const W = src.width, H = src.height;
      // start: the biggest 2:3 frame in the middle of the photo, a little inside
      let fw = Math.min(W * .8, H * .8 * 2 / 3), fh = fw * 1.5;
      let found = null; try { found = detect(src); } catch (e) {}
      let q = found || [[(W - fw) / 2, (H - fh) / 2], [(W + fw) / 2, (H - fh) / 2], [(W + fw) / 2, (H + fh) / 2], [(W - fw) / 2, (H + fh) / 2]];
      box.querySelector('p').textContent = found ? 'Found the cover — drag a gold corner if it’s a little off' : 'Drag the four gold corners onto the corners of the cover';
      let sc = 1, ox = 0, oy = 0, dpr = 1, drag = -1, grab = [0, 0], touchAt = null;
      const R = 13, HIT = 34;   // corner dot radius / finger reach, CSS px
      const fit = () => {
        const r = wrap.getBoundingClientRect(); dpr = devicePixelRatio || 1;
        cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
        const pad = 18; sc = Math.min((r.width - pad * 2) / W, (r.height - pad * 2) / H);
        ox = (r.width - W * sc) / 2; oy = (r.height - H * sc) / 2; draw();
      };
      const toS = p => [ox + p[0] * sc, oy + p[1] * sc];
      function draw() {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
        ctx.drawImage(src, ox, oy, W * sc, H * sc);
        const P = q.map(toS);
        // dim everything outside the cover
        ctx.save(); ctx.beginPath(); ctx.rect(ox, oy, W * sc, H * sc); ctx.moveTo(...P[0]); P.slice(1).forEach(p => ctx.lineTo(...p)); ctx.closePath();
        ctx.fillStyle = 'rgba(10,2,14,.55)'; ctx.fill('evenodd'); ctx.restore();
        ctx.beginPath(); ctx.moveTo(...P[0]); P.slice(1).forEach(p => ctx.lineTo(...p)); ctx.closePath();
        ctx.lineWidth = 2; ctx.strokeStyle = '#f1cf7c'; ctx.shadowColor = 'rgba(255,190,90,.8)'; ctx.shadowBlur = 6; ctx.stroke(); ctx.shadowBlur = 0;
        P.forEach((p, i) => {
          ctx.beginPath(); ctx.arc(p[0], p[1], drag === i ? R + 4 : R, 0, 7);
          ctx.fillStyle = 'rgba(241,207,124,.35)'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#f6dc96'; ctx.stroke();
          ctx.beginPath(); ctx.arc(p[0], p[1], 2.5, 0, 7); ctx.fillStyle = '#fff4c8'; ctx.fill();
        });
        if (drag >= 0 && touchAt) loupe(P[drag]);
      }
      // magnifier above the finger so she can see the exact corner
      function loupe(p) {
        const L = 54, z = 2.5, cx = Math.min(Math.max(p[0], L + 4), cv.width / dpr - L - 4), cy = p[1] - L - 46 < L ? p[1] + L + 46 : p[1] - L - 46;
        ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, L, 0, 7); ctx.clip();
        ctx.fillStyle = '#0e0416'; ctx.fillRect(cx - L, cy - L, L * 2, L * 2);
        ctx.translate(cx - p[0] * z, cy - p[1] * z); ctx.scale(z, z); ctx.drawImage(src, ox, oy, W * sc, H * sc);
        ctx.restore();
        ctx.beginPath(); ctx.arc(cx, cy, L, 0, 7); ctx.lineWidth = 2; ctx.strokeStyle = '#f1cf7c'; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - 9, cy); ctx.lineTo(cx + 9, cy); ctx.moveTo(cx, cy - 9); ctx.lineTo(cx, cy + 9); ctx.lineWidth = 1.5; ctx.strokeStyle = '#fff4c8'; ctx.stroke();
      }
      const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
      cv.addEventListener('pointerdown', e => {
        const m = pos(e); let best = -1, bd = HIT;
        q.map(toS).forEach((p, i) => { const d = Math.hypot(p[0] - m[0], p[1] - m[1]); if (d < bd) { bd = d; best = i; } });
        if (best < 0) return;
        drag = best; const p = toS(q[best]); grab = [p[0] - m[0], p[1] - m[1]]; touchAt = m;
        cv.setPointerCapture(e.pointerId); e.preventDefault(); draw();
      });
      cv.addEventListener('pointermove', e => {
        if (drag < 0) return; const m = pos(e); touchAt = m;
        const x = (m[0] + grab[0] - ox) / sc, y = (m[1] + grab[1] - oy) / sc;
        q[drag] = [Math.max(0, Math.min(W, x)), Math.max(0, Math.min(H, y))]; draw();
      });
      const up = () => { drag = -1; touchAt = null; draw(); };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
      const ro = new ResizeObserver(fit); ro.observe(wrap); fit();
      const close = v => { ro.disconnect(); box.remove(); res(v); };
      box.querySelector('.no').onclick = () => close(null);
      box.querySelector('.go').onclick = e => { e.target.disabled = true; e.target.textContent = 'Straightening…'; setTimeout(() => close(q.map(p => p.slice())), 30); };
    });
  }
  async function pick() {
    const f = await chooseFile(); if (!f) return null;
    let src; try { src = await loadImage(f); } catch (e) { return null; }
    const q = await editor(src); if (!q) return null;
    return straighten(src, q);
  }
  return { pick, editor, straighten, loadImage, detect };
})();
