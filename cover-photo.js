/* Own cover photo: take a photo or pick one from the library, drag 4 gold corners onto the book's corners,
   and get a straight 600×900 JPEG (the corner-and-straighten idea comes from the Game Boy catalog app).
   CoverPhoto.pick() → Promise<Blob|null>. Needs nothing else; the page saves the Blob (Store.setCover). */
const CoverPhoto = (() => {
  const MAXSRC = 1600;
  let css = false;
  function addCSS() {
    if (css) return; css = true;
    const s = document.createElement('style');
    s.textContent = `#cph{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;background:radial-gradient(ellipse at 50% 0%,#3a1838 0%,#1a0a1e 55%,#0e0416 100%);
 padding:calc(env(safe-area-inset-top,0px) + 12px) 16px calc(env(safe-area-inset-bottom,0px) + 16px);color:#f3e3c3;font:17px/1.4 "EB Garamond",Georgia,serif;touch-action:none;-webkit-user-select:none;user-select:none}
#cph h2{margin:0;text-align:center;font:italic 32px/1.15 "IM Fell English",Georgia,serif;color:#f1cf7c;text-shadow:0 0 14px rgba(255,180,80,.3),0 2px 2px #000}
#cph p{margin:2px 0 10px;text-align:center;font-size:15px;opacity:.8}
/* the photo sits in the app's painted card: purple panel + gold rim with leaf sprigs (frame drawn over the photo's edge) */
#cph .cph-wrap{flex:1;min-height:0;position:relative;margin:4px 6px 0;border-radius:24px;
 background:linear-gradient(rgba(40,8,46,.25),rgba(20,4,26,.45)),url(img/panel.jpg) center/cover;box-shadow:0 10px 22px rgba(0,0,0,.5),inset 0 0 30px rgba(0,0,0,.4)}
#cph .cph-wrap::after{content:"";position:absolute;inset:0;pointer-events:none;border-style:solid;border-color:transparent;border-width:38px;border-image:url(img/card_frame.webp) 190 stretch}
#cph canvas{position:absolute;inset:10px;width:calc(100% - 20px);height:calc(100% - 20px);touch-action:none;border-radius:16px}
#cph .cph-row{display:flex;gap:10px;margin-top:12px}
#cph button{flex:1;min-height:50px;border-radius:999px;font:600 18px "EB Garamond",Georgia,serif;border:1.5px solid rgba(232,190,140,.45);background:rgba(30,10,32,.7);color:#f1dcc0;cursor:pointer}
#cph button.go{background:linear-gradient(180deg,#f3d29a,#d9a066);color:#2a1410;border:0;box-shadow:0 3px 8px rgba(0,0,0,.5)}
#cph button:disabled{opacity:.5}
#cph .cph-bot{display:flex;gap:18px;align-items:center;margin:14px 6px 0}
/* the two sliders sit within the height of the book preview */
#cph .cph-pv{width:118px;flex:none;cursor:default}
#cph .cph-ctl{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:space-around;align-self:stretch;padding:6px 0}
#cph .cph-lbl{display:flex;justify-content:space-between;align-items:baseline;font:400 15px/1.1 "IM Fell English SC",Georgia,serif;color:#f1cf7c;margin:0}
#cph .cph-lbl i{font:italic 14px "EB Garamond",Georgia,serif;color:#c4a2b4}
#cph .cph-sl{display:flex;align-items:center;gap:8px;height:34px;margin-top:2px}
#cph .cph-sl svg{flex:none}
#cph input[type=range]{-webkit-appearance:none;appearance:none;flex:1;min-width:0;height:6px;margin:0;border-radius:3px;background:linear-gradient(90deg,#3a2030,#f1cf7c);outline:none;touch-action:pan-x}
#cph input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:28px;height:28px;border-radius:50%;background:linear-gradient(#f6dc96,#c9a24e);box-shadow:0 2px 6px rgba(0,0,0,.6),inset 0 1px 0 #fff4c8}
#cph input[type=range]::-moz-range-thumb{width:28px;height:28px;border:0;border-radius:50%;background:#e0bb6a}
#cph .cph-cur{width:min(44vw,170px);margin:26px auto 8px;cursor:default}
#cph .cph-ch{flex:none;display:flex;align-items:center;gap:14px;width:100%;text-align:left;padding:14px 18px;border-radius:18px;margin-top:12px;min-height:76px;
 background:rgba(20,4,26,.62);border:1.5px solid rgba(232,190,140,.4);box-shadow:inset 0 0 18px rgba(0,0,0,.5);color:#f3e3c3}
#cph .cph-ch svg{width:38px;height:38px;flex:none;filter:drop-shadow(0 0 6px rgba(255,190,90,.45))}
#cph .cph-ch b{display:block;font-size:19px;color:#f6dcb4}
#cph .cph-ch small{display:block;font:400 14px/1.25 "EB Garamond",Georgia,serif;color:#c4a2b4}
#cph .cph-fill{flex:1}`;
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
  /* brightness/contrast in −50…+50 (%) → lookup table */
  function toneLUT(br = 0, ct = 0) {
    const t = new Uint8ClampedArray(256), B = 1 + br / 100, C = 1 + ct / 100;
    for (let i = 0; i < 256; i++) t[i] = (i * B - 128) * C + 128;
    return t;
  }
  let srcPx = null, srcFor = null;   // pixels of the photo, read once per photo
  function straighten(src, Q, opt = {}) {
    const OW = opt.w || 600, OH = opt.h || 900, sw = src.width, sh = src.height;
    if (srcFor !== src) { srcPx = src.getContext('2d').getImageData(0, 0, sw, sh).data; srcFor = src; }
    const s = srcPx, lut = toneLUT(opt.br, opt.ct);
    const H = homog([[0, 0], [OW, 0], [OW, OH], [0, OH]], Q), out = new ImageData(OW, OH), o = out.data, off = opt.fast ? [.5] : [.25, .75], nn = off.length * off.length;
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
      const k = (v * OW + u) * 4; o[k] = lut[Math.round(r / nn)]; o[k + 1] = lut[Math.round(g / nn)]; o[k + 2] = lut[Math.round(b / nn)]; o[k + 3] = 255;
    }
    const c = document.createElement('canvas'); c.width = OW; c.height = OH; c.getContext('2d').putImageData(out, 0, 0);
    if (opt.canvas) return c;
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
    // third try: split the photo into colour groups; groups found along the photo's edge are background,
    // everything else (the cover's own colours) is the cover
    const byGroups = () => { const K = 7, step = Math.max(1, Math.floor(N / 6000)), smp = [];
      for (let i = 0; i < N; i += step) smp.push([d[i * 4], d[i * 4 + 1], d[i * 4 + 2]]);
      smp.sort((p, q) => (p[0] + p[1] + p[2]) - (q[0] + q[1] + q[2]));
      let G = Array.from({ length: K }, (_, j) => smp[Math.floor((j + .5) / K * smp.length)].slice());
      const near = (r, g, b) => { let bj = 0, bd = 1e9; for (let j = 0; j < K; j++) { const q = G[j], dd = (r - q[0]) ** 2 + (g - q[1]) ** 2 + (b - q[2]) ** 2; if (dd < bd) { bd = dd; bj = j; } } return bj; };
      for (let it = 0; it < 10; it++) { const S = G.map(() => [0, 0, 0, 0]);
        for (const p of smp) { const t = S[near(p[0], p[1], p[2])]; t[0] += p[0]; t[1] += p[1]; t[2] += p[2]; t[3]++; }
        G = G.map((q, j) => S[j][3] ? [S[j][0] / S[j][3], S[j][1] / S[j][3], S[j][2] / S[j][3]] : q); }
      const lab = new Uint8Array(N); for (let i = 0; i < N; i++) lab[i] = near(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]);
      const onEdge = new Float64Array(K); let nE = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x < m || y < m || x >= w - m || y >= h - m) { onEdge[lab[y * w + x]]++; nE++; }
      const g = new Uint8Array(N); for (let i = 0; i < N; i++) g[i] = onEdge[lab[i]] / nE < .03 ? 1 : 0; return g; };
    // brightness gradients (Sobel) — used to check how well a 4-corner shape sits on real edges
    const Lm = new Float32Array(N); for (let i = 0; i < N; i++) Lm[i] = d[i * 4] * .3 + d[i * 4 + 1] * .59 + d[i * 4 + 2] * .11;
    const GX = new Float32Array(N), GY = new Float32Array(N), MAG = new Float32Array(N);
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x;
      const gx = Lm[i - w + 1] + 2 * Lm[i + 1] + Lm[i + w + 1] - Lm[i - w - 1] - 2 * Lm[i - 1] - Lm[i + w - 1];
      const gy = Lm[i + w - 1] + 2 * Lm[i + w] + Lm[i + w + 1] - Lm[i - w - 1] - 2 * Lm[i - w] - Lm[i - w + 1];
      GX[i] = gx; GY[i] = gy; MAG[i] = Math.hypot(gx, gy); }
    const thr = Math.max(24, Array.from(MAG).sort((p, q) => p - q)[Math.floor(N * .85)]);
    const areaOf = q => { let a = 0; for (let i = 0; i < 4; i++) { const p = q[i], r = q[(i + 1) % 4]; a += p[0] * r[1] - r[0] * p[1]; } return Math.abs(a) / 2; };
    // share of each side that lies on a matching edge (within 2 px, edge running along the side)
    function support(q) {
      const sides = [];
      for (let s = 0; s < 4; s++) { const A = q[s], B = q[(s + 1) % 4], L = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1, nx = -(B[1] - A[1]) / L, ny = (B[0] - A[0]) / L;
        let hit = 0; const n = 40;
        for (let t = 0; t < n; t++) { const f = (t + .5) / n, px = A[0] + (B[0] - A[0]) * f, py = A[1] + (B[1] - A[1]) * f;
          for (let o = -2; o <= 2; o++) { const X = Math.round(px + nx * o), Y = Math.round(py + ny * o); if (X < 1 || Y < 1 || X >= w - 1 || Y >= h - 1) continue;
            const i = Y * w + X; if (MAG[i] > thr && Math.abs(GX[i] * nx + GY[i] * ny) > .8 * MAG[i]) { hit++; break; } } }
        sides.push(hit / n); }
      return sides;
    }
    const order = q => { const mx = q.reduce((a, p) => a + p[0], 0) / 4, my = q.reduce((a, p) => a + p[1], 0) / 4;
      q = q.slice().sort((a, b) => Math.atan2(a[1] - my, a[0] - mx) - Math.atan2(b[1] - my, b[0] - mx));
      let s0 = 0; q.forEach((p, i) => { if (p[0] + p[1] < q[s0][0] + q[s0][1]) s0 = i; }); return [0, 1, 2, 3].map(i => q[(s0 + i) % 4]); };
    const sane = q => { const A = areaOf(q); if (A < N * .06 || A > N * .97) return false;
      for (const p of q) if (p[0] < -w * .03 || p[1] < -h * .03 || p[0] > w * 1.03 || p[1] > h * 1.03) return false;
      for (let i = 0; i < 4; i++) { const a = q[(i + 3) % 4], b = q[i], e = q[(i + 1) % 4];
        const v1 = [a[0] - b[0], a[1] - b[1]], v2 = [e[0] - b[0], e[1] - b[1]];
        const ang = Math.acos(Math.max(-1, Math.min(1, (v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(...v1) * Math.hypot(...v2) || 1)))) * 180 / Math.PI;
        if (ang < 55 || ang > 125) return false; }
      const sd = [0, 1, 2, 3].map(i => Math.hypot(q[(i + 1) % 4][0] - q[i][0], q[(i + 1) % 4][1] - q[i][1]));
      if (Math.max(sd[0], sd[2]) > 2.2 * Math.min(sd[0], sd[2]) || Math.max(sd[1], sd[3]) > 2.2 * Math.min(sd[1], sd[3])) return false;
      // a book cover stands upright: taller than wide, and not turned more than ~25°
      if (sd[1] + sd[3] < .95 * (sd[0] + sd[2])) return false;
      const tilt = Math.abs(Math.atan2(q[1][1] - q[0][1], q[1][0] - q[0][0])) * 180 / Math.PI;
      return tilt <= 25; };
    // straight lines (Hough, voting along each edge's own direction) → every 2 + 2 of them make a candidate
    function lines() {
      const D = Math.ceil(Math.hypot(w, h)), R = 2 * D + 1, V = new Float32Array(180 * R), COS = [], SIN = [];
      for (let t = 0; t < 180; t++) { COS[t] = Math.cos(t * Math.PI / 180); SIN[t] = Math.sin(t * Math.PI / 180); }
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x; if (MAG[i] <= thr) continue;
        let t0 = Math.round(Math.atan2(GY[i], GX[i]) * 180 / Math.PI); t0 = ((t0 % 180) + 180) % 180;
        for (let dt = -5; dt <= 5; dt++) { const t = (t0 + dt + 180) % 180, r = Math.round(x * COS[t] + y * SIN[t]) + D; V[t * R + r] += 1; } }
      const pk = [], minV = Math.min(w, h) * .2;
      for (let t = 0; t < 180; t++) for (let r = 1; r < R - 1; r++) { const v = V[t * R + r]; if (v < minV) continue; let top = true;
        for (let dt = -4; dt <= 4 && top; dt++) for (let dr = -6; dr <= 6; dr++) { const tt = t + dt, rr = r + dr; let u;
          if (tt < 0) u = V[(tt + 180) * R + (2 * D - rr)]; else if (tt >= 180) u = V[(tt - 180) * R + (2 * D - rr)]; else u = V[tt * R + rr];
          if (u > v || (u === v && (dt < 0 || (dt === 0 && dr < 0)))) { top = false; break; } }
        if (top) pk.push({ t, r: r - D, v }); }
      pk.sort((a, b) => b.v - a.v);
      return pk.slice(0, 18);
    }
    const cross = (a, b) => { const det = COSd(a.t) * SINd(b.t) - SINd(a.t) * COSd(b.t); if (Math.abs(det) < 1e-6) return null;
      return [(a.r * SINd(b.t) - b.r * SINd(a.t)) / det, (COSd(a.t) * b.r - COSd(b.t) * a.r) / det]; };
    function COSd(t) { return Math.cos(t * Math.PI / 180); } function SINd(t) { return Math.sin(t * Math.PI / 180); }
    const cands = [];
    try {
      const L = lines(), H = L.filter(l => l.t >= 45 && l.t < 135), Vv = L.filter(l => l.t < 45 || l.t >= 135);
      for (let a = 0; a < H.length; a++) for (let b = a + 1; b < H.length; b++) for (let c = 0; c < Vv.length; c++) for (let e = c + 1; e < Vv.length; e++) {
        const P = [cross(H[a], Vv[c]), cross(H[a], Vv[e]), cross(H[b], Vv[e]), cross(H[b], Vv[c])]; if (P.some(p => !p)) continue;
        const q = order(P); if (sane(q)) cands.push(q); }
    } catch (e) {}
    // plus the blob answers
    const blobs = [fromMask(byGroups(), 2), fromMask(byColour, 2), fromMask(byEdges(), 4)].filter(Boolean);
    const okBlobs = blobs.filter(r => sane(r.q.map(p => [p[0] * k, p[1] * k])));
    okBlobs.forEach(r => cands.push(r.q.map(p => [p[0] * k, p[1] * k])));
    // best: sits on edges all round (weakest side counts), then bigger
    let pick = null, bs = 0;
    for (const q of cands) { const sp = support(q), lo = Math.min(...sp), mean = sp.reduce((a, b) => a + b, 0) / 4;
      if (lo < .3 || mean < .5) continue; const sc = mean * (.5 + .5 * lo) * Math.pow(areaOf(q) / N, .35); if (sc > bs) { bs = sc; pick = q; } }
    if (pick) return pick.map(p => [Math.min(src.width, Math.max(0, p[0] / k)), Math.min(src.height, Math.max(0, p[1] / k))]);
    // no shape sits clearly on edges: the best-filled upright blob, if any
    if (!okBlobs.length) return null;
    okBlobs.sort((a, b) => b.fill - a.fill);
    return okBlobs[0].q;

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
    const fill = bigN / area(q);
    if (fill < .8 || fill > 1.22) return null;
    for (let i = 0; i < 4; i++) { const a = q[(i + 3) % 4], b = q[i], e = q[(i + 1) % 4];
      const v1 = [a[0] - b[0], a[1] - b[1]], v2 = [e[0] - b[0], e[1] - b[1]];
      const ang = Math.acos((v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(...v1) * Math.hypot(...v2) || 1)) * 180 / Math.PI;
      if (ang < 55 || ang > 125) return null; }
    const sides = [0, 1, 2, 3].map(i => Math.hypot(q[(i + 1) % 4][0] - q[i][0], q[(i + 1) % 4][1] - q[i][1]));
    if (Math.max(sides[0], sides[2]) > 2.2 * Math.min(sides[0], sides[2]) || Math.max(sides[1], sides[3]) > 2.2 * Math.min(sides[1], sides[3])) return null;
    return { fill: Math.min(fill, 1 / fill), q: q.map(p => [Math.min(src.width, Math.max(0, p[0] / k)), Math.min(src.height, Math.max(0, p[1] / k))]) };
    }
  }
  /* the corner editor; resolves with the 4 corners (photo pixels) or null */
  const sun = r => `<svg viewBox="0 0 24 24" width="${r}" height="${r}" fill="none" stroke="#f1cf7c" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/></svg>`;
  const half = r => `<svg viewBox="0 0 24 24" width="${r}" height="${r}"><circle cx="12" cy="12" r="8" fill="none" stroke="#f1cf7c" stroke-width="1.8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="#f1cf7c"/></svg>`;
  /* the corner editor with a live framed preview and brightness/contrast; resolves with {q, br, ct} or null.
     start: 'detect' (find the cover), 'full' (the picture's own edges) */
  function editor(src, start = 'detect') {
    addCSS();
    return new Promise(res => {
      const box = document.createElement('div'); box.id = 'cph';
      const pv = typeof bookFrameHTML === 'function';
      box.innerHTML = `<h2>Fit the cover</h2><p>&nbsp;</p>
        <div class="cph-wrap"><canvas></canvas></div>
        <div class="cph-bot">${pv ? `<div class="bk cph-pv">${bookFrameHTML()}</div>` : ''}
          <div class="cph-ctl">
            <div class="cph-lbl"><span>Brightness</span><i data-v="br">0%</i></div>
            <div class="cph-sl">${sun(16)}<input type="range" min="-50" max="50" step="1" value="0" data-k="br" aria-label="Brightness">${sun(24)}</div>
            <div class="cph-lbl"><span>Contrast</span><i data-v="ct">0%</i></div>
            <div class="cph-sl">${half(16)}<input type="range" min="-50" max="50" step="1" value="0" data-k="ct" aria-label="Contrast">${half(24)}</div>
          </div></div>
        <div class="cph-row"><button class="no">Cancel</button><button class="go">Use this cover</button></div>`;
      document.body.appendChild(box);
      const cv = box.querySelector('canvas'), wrap = box.querySelector('.cph-wrap'), ctx = cv.getContext('2d');
      const W = src.width, H = src.height;
      // start: the biggest 2:3 frame in the middle of the photo, a little inside
      let fw = Math.min(W * .8, H * .8 * 2 / 3), fh = fw * 1.5;
      let found = null;
      try { found = detect(src); } catch (e) {}
      // her own picture: if it is already a straight cover (nothing smaller found), start on its edges
      if (start === 'full') { const A = found ? Math.abs((found[2][0] - found[0][0]) * (found[3][1] - found[1][1]) - (found[3][0] - found[1][0]) * (found[2][1] - found[0][1])) / 2 : W * H;
        if (A > W * H * .85) found = [[0, 0], [W, 0], [W, H], [0, H]]; else start = 'detect'; }
      let q = found || [[(W - fw) / 2, (H - fh) / 2], [(W + fw) / 2, (H - fh) / 2], [(W + fw) / 2, (H + fh) / 2], [(W - fw) / 2, (H + fh) / 2]];
      box.querySelector('p').textContent = (start === 'full' ? 'Drag a corner to crop' : found ? 'Found it — drag a corner to adjust' : 'Drag the gold corners onto the cover') + ' · pinch to zoom';
      // live preview: a small straightened copy inside the standard book
      const tone = { br: 0, ct: 0 }, pvEl = box.querySelector('.cph-pv');
      let pvT = 0, pvURL = null;
      const preview = () => { if (!pvEl) return; clearTimeout(pvT); pvT = setTimeout(() => {
        const c = straighten(src, q, { w: 150, h: 225, fast: true, canvas: true, br: tone.br, ct: tone.ct });
        c.toBlob(bl => { if (!bl) return; if (pvURL) URL.revokeObjectURL(pvURL); pvURL = URL.createObjectURL(bl);
          setBook(pvEl, { title: '', cover: pvURL, color: null }); }, 'image/jpeg', .8); }, 60); };
      box.querySelectorAll('input[type=range]').forEach(r => {
        const show = () => { const v = +r.value; tone[r.dataset.k] = v; box.querySelector(`[data-v=${r.dataset.k}]`).textContent = (v > 0 ? '+' : '') + v + '%'; };
        r.addEventListener('input', () => { show(); preview(); });
        r.addEventListener('dblclick', () => { r.value = 0; show(); preview(); });   // double tap: back to 0
      });
      let sc = 1, ox = 0, oy = 0, dpr = 1, drag = -1, grab = [0, 0], touchAt = null;
      const R = 13, HIT = 34;   // corner dot radius / finger reach, CSS px
      let fitSc = 1, minSc = 1, vw = 0, vh = 0;
      const fit = () => {
        const r = cv.getBoundingClientRect(); dpr = devicePixelRatio || 1; vw = r.width; vh = r.height;
        cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
        // the photo fills the whole window (no empty bands); centred on the cover's corners
        sc = fitSc = Math.max(r.width / W, r.height / H); minSc = Math.min(r.width / W, r.height / H);   // pinch in to see it all
        const cx = q.reduce((a, p) => a + p[0], 0) / 4, cy = q.reduce((a, p) => a + p[1], 0) / 4;
        ox = r.width / 2 - cx * sc; oy = r.height / 2 - cy * sc; clampView(); draw();
      };
      // keep the photo on screen: centred when smaller than the window, else no empty gap at the sides
      const clampView = () => {
        const iw = W * sc, ih = H * sc;
        ox = iw <= vw ? (vw - iw) / 2 : Math.min(0, Math.max(vw - iw, ox)); oy = ih <= vh ? (vh - ih) / 2 : Math.min(0, Math.max(vh - ih, oy));
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
      // one finger on a corner moves the corner; one finger elsewhere moves the photo; two fingers zoom;
      // double tap fits the whole photo again
      const ptr = new Map(); let pan = null, pinch = null, lastTap = 0;
      const startGesture = () => {
        const P = [...ptr.values()];
        if (P.length >= 2) { const [a, b] = P; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, m: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], sc, ox, oy }; pan = null; }
        else if (P.length === 1) { pan = { m: P[0], ox, oy }; pinch = null; }
        else { pan = pinch = null; }
      };
      cv.addEventListener('pointerdown', e => {
        const m = pos(e); e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (err) {}
        if (!ptr.size && drag < 0) {
          let best = -1, bd = HIT;
          q.map(toS).forEach((p, i) => { const d = Math.hypot(p[0] - m[0], p[1] - m[1]); if (d < bd) { bd = d; best = i; } });
          if (best >= 0) { drag = best; const p = toS(q[best]); grab = [p[0] - m[0], p[1] - m[1]]; touchAt = m; draw(); return; }
          const now = Date.now(); if (now - lastTap < 300) { fit(); lastTap = 0; return; } lastTap = now;
        }
        if (drag >= 0) { drag = -1; touchAt = null; preview(); }   // a second finger: zoom instead
        ptr.set(e.pointerId, m); startGesture();
      });
      cv.addEventListener('pointermove', e => {
        const m = pos(e);
        if (drag >= 0) { touchAt = m;
          const x = (m[0] + grab[0] - ox) / sc, y = (m[1] + grab[1] - oy) / sc;
          q[drag] = [Math.max(0, Math.min(W, x)), Math.max(0, Math.min(H, y))]; draw(); return; }
        if (!ptr.has(e.pointerId)) return; ptr.set(e.pointerId, m);
        const P = [...ptr.values()];
        if (pinch && P.length >= 2) { const [a, b] = P, d = Math.hypot(a[0] - b[0], a[1] - b[1]), mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
          sc = Math.max(minSc, Math.min(fitSc * 6, pinch.sc * d / pinch.d));
          const ix = (pinch.m[0] - pinch.ox) / pinch.sc, iy = (pinch.m[1] - pinch.oy) / pinch.sc;   // photo point under the fingers
          ox = mid[0] - ix * sc; oy = mid[1] - iy * sc; clampView(); draw(); }
        else if (pan) { ox = pan.ox + m[0] - pan.m[0]; oy = pan.oy + m[1] - pan.m[1]; clampView(); draw(); }
      });
      const up = e => {
        if (drag >= 0) { drag = -1; touchAt = null; draw(); preview(); return; }
        ptr.delete(e.pointerId); startGesture(); };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
      const ro = new ResizeObserver(fit); ro.observe(wrap); fit(); preview();
      const close = v => { ro.disconnect(); clearTimeout(pvT); if (pvURL) URL.revokeObjectURL(pvURL); box.remove(); res(v); };
      box.querySelector('.no').onclick = () => close(null);
      box.querySelector('.go').onclick = e => { e.target.disabled = true; e.target.textContent = 'Straightening…'; setTimeout(() => close({ q: q.map(p => p.slice()), br: tone.br, ct: tone.ct }), 30); };
    });
  }
  const ICON_FIX = '<svg viewBox="0 0 24 24" fill="none" stroke="#f1cf7c" stroke-width="1.8" stroke-linecap="round"><path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4"/><path d="M8 8l8 1-1 7-8-1z" stroke-width="1.4"/></svg>';
  const ICON_CAM = '<svg viewBox="0 0 24 24" fill="none" stroke="#f1cf7c" stroke-width="1.8" stroke-linejoin="round"><path d="M3 8h4l2-3h6l2 3h4v12H3z"/><circle cx="12" cy="13.5" r="3.6"/></svg>';
  /* "Change cover": fix the current picture or take a new one; resolves 'fix' | 'new' | null */
  function chooser(curURL, title) {
    addCSS();
    return new Promise(res => {
      const box = document.createElement('div'); box.id = 'cph';
      box.innerHTML = `<h2>Change cover</h2><p></p>
        ${typeof bookFrameHTML === 'function' ? `<div class="bk cph-cur">${bookFrameHTML()}</div>` : ''}
        <button class="cph-ch" data-a="fix">${ICON_FIX}<span><b>Fix this cover</b><small>Straighten the current picture, crop it, make it lighter</small></span></button>
        <button class="cph-ch" data-a="new">${ICON_CAM}<span><b>New photo</b><small>Take a photo or choose one from your library</small></span></button>
        <div class="cph-fill"></div><div class="cph-row"><button class="no">Cancel</button></div>`;
      box.querySelector('p').textContent = title || '';
      document.body.appendChild(box);
      const cur = box.querySelector('.cph-cur'); if (cur) setBook(cur, { title: title || '', cover: curURL, color: null });
      const close = v => { box.remove(); res(v); };
      box.querySelector('.no').onclick = () => close(null);
      box.querySelectorAll('.cph-ch').forEach(b => b.onclick = () => close(b.dataset.a));
    });
  }
  async function edit(blobOrFile, start) {
    let src; try { src = await loadImage(blobOrFile); } catch (e) { return null; }
    const r = await editor(src, start); if (!r) return null;
    return straighten(src, r.q, { br: r.br, ct: r.ct });
  }
  /* current: { blob, own } of the cover now (null for the plain mushroom cover); title for the chooser */
  async function change(current, title) {
    if (current && current.blob) {
      const url = URL.createObjectURL(current.blob);
      let a; try { a = await chooser(url, title); } finally { URL.revokeObjectURL(url); }
      if (!a) return null;
      // fix: look for a cover inside the picture (a photo at an angle); if none is clearly smaller, start on its edges
      if (a === 'fix') return edit(current.blob, 'full');
    }
    const f = await chooseFile(); if (!f) return null;
    return edit(f, 'detect');
  }
  const pick = () => change(null);
  return { pick, change, editor, straighten, loadImage, detect };
})();
