/* "Removed · Undo" note, shown for a few seconds on the page she lands on after removing a book (Home, Library).
   The Book page leaves {book, at} in sessionStorage 'shelf.undo'. Needs store.js. */
(() => {
  const KEY = 'shelf.undo', SHOW = 6000;
  const css = document.createElement('style');
  css.textContent = `#undo{position:fixed;left:50%;bottom:calc(171px / 851 * 824 * var(--S,.4577) + env(safe-area-inset-bottom,0px) + 14px);z-index:20;
 transform:translate(-50%,12px);opacity:0;transition:opacity .25s,transform .25s;display:flex;align-items:center;gap:14px;max-width:calc(100% - 32px);
 padding:8px 8px 8px 18px;border-radius:999px;background:rgba(26,8,30,.96);border:1.5px solid rgba(232,190,140,.55);box-shadow:0 8px 20px rgba(0,0,0,.6);
 font:400 16px "EB Garamond",Georgia,serif;color:#f3e3c3}
#undo.on{opacity:1;transform:translate(-50%,0)}
#undo span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#undo button{flex:none;min-height:36px;padding:0 16px;border:0;border-radius:999px;background:linear-gradient(180deg,#f3d29a,#d9a066);color:#2a1410;font:600 16px "EB Garamond",Georgia,serif;cursor:pointer}`;
  document.head.appendChild(css);
  function check() {
    let u = null; try { u = JSON.parse(sessionStorage.getItem(KEY) || 'null'); sessionStorage.removeItem(KEY); } catch (e) {}
    if (!u || !u.book || Date.now() - u.at > 15000) return;
    const el = document.createElement('div'); el.id = 'undo'; el.setAttribute('role', 'status');
    const t = document.createElement('span'); t.textContent = `Removed “${u.book.title || 'book'}”`;
    const b = document.createElement('button'); b.textContent = 'Undo';
    el.append(t, b); document.body.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('on')));
    const close = () => { el.classList.remove('on'); setTimeout(() => el.remove(), 300); };
    const timer = setTimeout(close, SHOW);
    b.onclick = async () => { clearTimeout(timer); b.disabled = true;
      try { await Store.unremove(u.book); t.textContent = 'Back on the shelf'; b.remove(); setTimeout(close, 1400);
        dispatchEvent(new Event('shelf-undo')); } catch (e) { close(); } };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', check); else check();
  addEventListener('pageshow', e => { if (e.persisted) check(); });
})();
