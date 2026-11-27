/* Book storage on this phone (IndexedDB): the books, plus their covers downloaded as pictures.
   Shared by every page. Load before book-frame.js.
   Store.all() · get(id) · put(book[, mine]) · replaceAll(books) · remove(id) · unremove(book)
   Store.backup() · restore(data[, covers]) — newest edit wins (book.edited / removed-list time)
   Store.backupWithCovers() → { data, covers: Map id → Blob } (every cover on the phone, web ones too, for the .zip backup)
   Store.saveCover(book) · coverURL(id) · fetchMissingCovers() · onChange(fn)
   First run copies the old list (localStorage 'shelf.books.v1') in; the old copy is left untouched. */
/* the only genres (Home "Collections by Genre"); anything else counts as Other */
const GENRES = ['Wiccan Fantasy', 'Fantasy', 'Romance', 'Classic', 'Other'];
/* best guess from the book's online info (subjects, title, description, year) */
function guessGenre(b) {
  const subj = [].concat(b.subjects || [], b.categories || []).join(' ').toLowerCase();
  const t = [subj, b.title, b.subtitle, b.description].join(' ').toLowerCase();
  const yr = +(String(b.published || '').match(/\d{4}/) || [0])[0];
  if (/\b(witch|witches|witchcraft|wicca|wiccan|coven|grimoire|pagan|hex|hexes)\b/.test(t)) return 'Wiccan Fantasy';
  if (/\bclassics?\b/.test(subj) || (yr && yr < 1930)) return 'Classic';
  if (/\b(romance|romantic|love stor)/.test(t)) return 'Romance';
  if (/\b(fantasy|fantastic fiction|dragons?|magic|wizards?|fairies|faeries|fae|elves|sorcer\w*|mythical|fairy tales?)\b/.test(t)) return 'Fantasy';
  return 'Other';
}

const Store = (() => {
  const OLD = 'shelf.books.v1', DONE = 'shelf.idb.migrated', GONE = 'shelf.removed', DEMO = 'shelf.demoCleaned';
  const chan = 'BroadcastChannel' in self ? new BroadcastChannel('shelf') : null;
  let dbp = null;

  const req = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  function tx(db, stores, mode, fn) {
    return new Promise((res, rej) => {
      const t = db.transaction(stores, mode); let out;
      Promise.resolve(fn(t)).then(v => { out = v; });
      t.oncomplete = () => res(out); t.onerror = t.onabort = () => rej(t.error);
    });
  }
  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  function oldBooks() { try { const a = JSON.parse(localStorage.getItem(OLD) || '[]'); return Array.isArray(a) ? a.filter(Boolean) : []; } catch (e) { return []; } }

  async function migrate(db) {
    let done = null; try { done = localStorage.getItem(DONE); } catch (e) {}
    if (done) return db;
    const old = oldBooks();
    await tx(db, 'books', 'readwrite', t => {
      const s = t.objectStore('books');
      for (const b of old) { if (!b.id) b.id = newId(); if (b.status !== 'wishlist') b.status = 'owned'; s.put(b); }
    });
    try { localStorage.setItem(DONE, String(Date.now())); } catch (e) {}
    return db;
  }
  function open() {
    if (!dbp) {
      dbp = new Promise((res, rej) => {
        const r = indexedDB.open('shelf', 1);
        r.onupgradeneeded = () => { const d = r.result; d.createObjectStore('books', { keyPath: 'id' }); d.createObjectStore('covers'); };
        r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
      }).then(migrate).then(cleanDemo);
      dbp.catch(() => { dbp = null; });
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});  // ask the phone not to clear it
    }
    return dbp;
  }

  /* removed books leave a note (id → when), so a backup saved before can't bring them back */
  function gone() { try { return JSON.parse(localStorage.getItem(GONE) || '{}') || {}; } catch (e) { return {}; } }
  function setGone(m) { try { localStorage.setItem(GONE, JSON.stringify(m)); } catch (e) {} }
  /* one time: take out the 25 sample books (demo-01…25) */
  async function cleanDemo(db) {
    let done = null; try { done = localStorage.getItem(DEMO); } catch (e) {}
    // she wants the sample books back via Restore (28 Nov): forget the automatic removal notes once
    let freed = null; try { freed = localStorage.getItem('shelf.demoFreed'); } catch (e) {}
    if (!freed) { const m = gone(); Object.keys(m).forEach(id => { if (/^demo-/.test(id)) delete m[id]; }); setGone(m);
      try { localStorage.setItem('shelf.demoFreed', '1'); localStorage.setItem(DEMO, String(Date.now())); } catch (e) {} return db; }
    if (done) return db;
    const ids = (await tx(db, 'books', 'readonly', t => req(t.objectStore('books').getAllKeys()))).filter(id => /^demo-/.test(id));
    if (ids.length) {
      await tx(db, ['books', 'covers'], 'readwrite', t => ids.forEach(id => { t.objectStore('books').delete(id); t.objectStore('covers').delete(id); }));
      const m = gone(), now = Date.now(); ids.forEach(id => m[id] = now); setGone(m);
    }
    try { localStorage.setItem(DEMO, String(Date.now())); } catch (e) {}
    if (ids.length) setTimeout(changed, 0);
    return db;
  }

  const listeners = [];
  function changed() { if (chan) chan.postMessage('changed'); }
  if (chan) chan.onmessage = () => listeners.forEach(f => f());

  async function all() {
    try { const db = await open(); return await tx(db, 'books', 'readonly', t => req(t.objectStore('books').getAll())); }
    catch (e) { return oldBooks(); }   // storage unavailable: show the old list read-only
  }
  async function get(id) { const db = await open(); return tx(db, 'books', 'readonly', t => req(t.objectStore('books').get(id))); }
  /* mine = an edit she made (stamps the time); false for the app's own tidy-ups (cover colour, guessed genre) */
  async function put(b, mine = true) {
    if (!b.id) b.id = newId(); if (mine) b.edited = Date.now();
    const db = await open(); await tx(db, 'books', 'readwrite', t => { t.objectStore('books').put(b); });
    const m = gone(); if (m[b.id]) { delete m[b.id]; setGone(m); }
    changed(); return b;
  }
  async function remove(id) {
    const db = await open(), was = await get(id).catch(() => null), keepPhoto = was && isOwn(was.cover);   // her own photo stays for Undo
    await tx(db, ['books', 'covers'], 'readwrite', t => { t.objectStore('books').delete(id); if (!keepPhoto) t.objectStore('covers').delete(id); });
    const m = gone(); m[id] = Date.now(); setGone(m);
    forget(id); changed();
  }
  /* Undo: put the removed book back exactly as it was */
  async function unremove(b) { await put(b, false); saveCover(b); }

  /* backup file: the books + the removed-list */
  async function backup() {
    const books = await all(), photos = {};
    // her own cover photos travel inside the backup (web covers are fetched again)
    for (const b of books) if (isOwn(b.cover)) { try { const bl = await getCoverBlob(b.id); if (bl) photos[b.id] = await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(bl); }); } catch (e) {} }
    return { app: 'shelf', saved: Date.now(), books, removed: gone(), photos };
  }
  /* the .zip backup: the books + every cover kept on the phone (her photos and the web covers), so a restore needs no internet */
  async function backupWithCovers() {
    await fetchMissingCovers();                 // web covers not downloaded yet: try once now
    const books = await all(), covers = new Map();
    for (const b of books) { try {
      let bl = await getCoverBlob(b.id); if (!bl) continue;
      // covers saved before covers were kept light: slim them once, here and on the phone
      if (bl.size > SLIM) { const s = await slim(bl); if (s !== bl) { bl = s; const db = await open(); await tx(db, 'covers', 'readwrite', t => { t.objectStore('covers').put(bl, b.id); }); forget(b.id); } }
      covers.set(b.id, bl);
    } catch (e) {} }
    return { data: { app: 'shelf', saved: Date.now(), books, removed: gone() }, covers };
  }
  /* restore: for each book the newest edit wins; books without an edit time lose to the phone's copy.
     covers (from a .zip backup): id → picture; used for the books taken from the backup, and for books here that have no cover saved */
  async function restore(data, covers) {
    const list = Array.isArray(data) ? data : data && Array.isArray(data.books) ? data.books : null;
    if (!list) throw new Error('not a backup');
    const theirGone = (!Array.isArray(data) && data.removed) || {};
    const mine = new Map((await all()).map(b => [b.id, b])), myGone = gone();
    const put_ = [], del = [], n = { added: 0, updated: 0, removed: 0, keptAway: 0 };
    for (const b of list) {
      if (!b || !b.id) continue;
      const have = mine.get(b.id), t = b.edited || 0;
      if (have) { if (t > (have.edited || 0)) { put_.push(b); n.updated++; } }
      else if (myGone[b.id] && myGone[b.id] >= t) n.keptAway++;
      else { put_.push(b); n.added++; delete myGone[b.id]; }
    }
    for (const id in theirGone) {
      const have = mine.get(id), when = +theirGone[id] || 0;
      if (have && (have.edited || 0) < when && !put_.some(b => b.id === id)) { del.push(id); n.removed++; }
      if (!have && !put_.some(b => b.id === id)) myGone[id] = Math.max(myGone[id] || 0, when);
    }
    put_.forEach(b => { if (b.status !== 'wishlist') b.status = 'owned'; if (!GENRES.includes(b.genre)) b.genre = guessGenre(b); });
    const db = await open();
    await tx(db, ['books', 'covers'], 'readwrite', t => {
      put_.forEach(b => t.objectStore('books').put(b));
      del.forEach(id => { t.objectStore('books').delete(id); t.objectStore('covers').delete(id); myGone[id] = +theirGone[id]; });
    });
    del.forEach(forget); setGone(myGone); changed();
    const photos = (!Array.isArray(data) && data.photos) || {}, taken = new Set(put_.map(b => b.id));
    for (const b of put_) {
      if (covers && covers.has(b.id)) { try { await setCover(b.id, covers.get(b.id)); } catch (e) {} }
      else if (isOwn(b.cover) && photos[b.id]) { try { await setCover(b.id, await (await fetch(photos[b.id])).blob()); } catch (e) {} }
      else saveCover(b);
    }
    // books kept from the phone that have no cover saved yet: fill it from the backup (only if it is the same cover)
    if (covers) for (const b of list) {
      if (!b || taken.has(b.id) || !covers.has(b.id)) continue;
      const have = mine.get(b.id); if (!have || (have.cover || '') !== (b.cover || '')) continue;
      try { if (!(await getCoverBlob(b.id))) await setCover(b.id, covers.get(b.id)); } catch (e) {}
    }
    return n;
  }
  /* save the whole list (Shelf page): also drops covers of books that are gone */
  async function replaceAll(books) {
    const db = await open(), keep = new Set(books.map(b => b.id));
    await tx(db, ['books', 'covers'], 'readwrite', t => {
      const bs = t.objectStore('books'), cs = t.objectStore('covers');
      books.forEach(b => bs.put(b));
      bs.getAllKeys().onsuccess = e => e.target.result.forEach(id => { if (!keep.has(id)) bs.delete(id); });
      cs.getAllKeys().onsuccess = e => e.target.result.forEach(id => { if (!keep.has(id)) { cs.delete(id); forget(id); } });
    });
    changed();
  }

  /* covers: downloaded once and kept on the phone (needs the cover site to allow it) */
  const urls = new Map(), failed = new Set();
  function forget(id) { const u = urls.get(id); if (u) URL.revokeObjectURL(u); urls.delete(id); }
  async function coverURL(id) {
    if (!id) return null;
    if (urls.has(id)) return urls.get(id);
    try {
      const db = await open(), blob = await tx(db, 'covers', 'readonly', t => req(t.objectStore('covers').get(id)));
      if (!blob) return null;
      if (urls.has(id)) return urls.get(id);
      const u = URL.createObjectURL(blob); urls.set(id, u); return u;
    } catch (e) { return null; }
  }
  /* her own cover photo (book.cover = 'own:<time>', the web cover kept in book.webCover) */
  const isOwn = u => /^own:/.test(u || '');
  async function setCover(id, blob) {
    const db = await open(); await tx(db, 'covers', 'readwrite', t => { t.objectStore('covers').put(blob, id); });
    forget(id); changed();
  }
  async function dropCover(id) {
    const db = await open(); await tx(db, 'covers', 'readwrite', t => { t.objectStore('covers').delete(id); });
    forget(id); changed();
  }
  /* keep covers light (hundreds of books): a big picture is redrawn at the app's cover size, 600×900 JPEG — the size her own photos have */
  const SLIM = 150 * 1024;
  async function slim(blob) {
    if (!blob || blob.size <= SLIM || typeof createImageBitmap === 'undefined') return blob;
    try {
      const im = await createImageBitmap(blob), k = Math.min(1, 600 / im.width, 900 / im.height);
      const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); if (im.close) im.close();
      const out = await new Promise(r => c.toBlob(r, 'image/jpeg', .86));
      return out && out.size < blob.size ? out : blob;
    } catch (e) { return blob; }
  }
  async function getCoverBlob(id) { const db = await open(); return tx(db, 'covers', 'readonly', t => req(t.objectStore('covers').get(id))); }
  async function saveCover(b) {
    if (!b || !b.id || !b.cover || isOwn(b.cover) || failed.has(b.cover)) return false;
    try {
      const r = await fetch(b.cover, { mode: 'cors' });
      if (!r.ok) throw 0;
      let blob = await r.blob();
      if (!blob.type.startsWith('image/') || blob.size < 200) throw 0;   // tiny = "no cover" placeholder
      blob = await slim(blob);
      const db = await open();
      await tx(db, 'covers', 'readwrite', t => { t.objectStore('covers').put(blob, b.id); });
      forget(b.id); changed(); return true;
    } catch (e) { failed.add(b.cover); return false; }
  }
  async function fetchMissingCovers() {
    if (!navigator.onLine) return;
    try {
      const db = await open(), have = new Set(await tx(db, 'covers', 'readonly', t => req(t.objectStore('covers').getAllKeys())));
      for (const b of await all()) if (b.cover && !isOwn(b.cover) && !have.has(b.id)) await saveCover(b);
    } catch (e) {}
  }

  return { all, get, put, remove, unremove, backup, backupWithCovers, restore, replaceAll, coverURL, saveCover, setCover, dropCover, isOwn, getCoverBlob, fetchMissingCovers, onChange: f => listeners.push(f) };
})();
