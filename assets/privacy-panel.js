// Privacy panel: a small live view of what this site keeps on the device. The site
// sets no tracking cookies, so this is a notice, not a consent wall.
(() => {
  const keys = { theme: 'boson-theme', notice: 'boson-cookie-notice' };
  const store = {
    get: key => { try { return localStorage.getItem(key); } catch { return null; } },
    set: (key, value) => { try { localStorage.setItem(key, value); } catch { /* It shows again next visit. */ } },
    remove: key => { try { localStorage.removeItem(key); } catch { /* Nothing stored. */ } },
    list: () => { try { return Object.keys(localStorage).filter(key => key.startsWith('boson-')); } catch { return []; } },
  };
  const siteRoot = new URL('../', document.querySelector('link[rel=stylesheet][href*="assets/styles.css"]').href);

  const host = document.createElement('div');
  host.className = 'pp';
  host.innerHTML = `
<button type="button" class="pp-launcher" aria-expanded="false" aria-controls="pp-panel"><span class="status-dot" aria-hidden="true"></span><span><b>0</b> trackers</span></button>
<section class="pp-panel" id="pp-panel" role="dialog" aria-modal="false" aria-labelledby="pp-title" hidden>
  <header class="pp-head"><span class="pp-tab"><span class="pp-tab-dot" aria-hidden="true"></span>privacy.json</span><button type="button" class="pp-close" aria-label="Close privacy panel"><svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button></header>
  <p class="pp-intro" id="pp-title"><strong>No tracking here.</strong> No analytics, ads, or cookies of our own.</p>
  <ol class="pp-code" aria-label="What is stored, as JSON"></ol>
  <footer class="pp-foot"><button type="button" class="pp-clear">Clear data</button><a class="pp-link" href="${new URL('privacy.html', siteRoot).pathname}">Privacy</a><button type="button" class="pp-done">Got it</button></footer>
</section>`;
  document.body.append(host);

  const launcher = host.querySelector('.pp-launcher');
  const panel = host.querySelector('.pp-panel');
  const code = host.querySelector('.pp-code');
  const clear = host.querySelector('.pp-clear');
  let previous = null;
  let cleared = false;

  const render = () => {
    const stored = store.list().length;
    const state = { tracking: 0, advertising: 0, stored };
    const lines = Object.entries(state).map(([key, value], i, all) => {
      const changed = previous && previous[key] !== value;
      return `<li class="${changed ? 'is-changed' : ''}"><span>  <i>"${key}"</i>: <b>${value}</b>${i < all.length - 1 ? ',' : ''}</span>${key === 'stored' ? `<em>// ${stored ? 'on this device' : 'nothing'}</em>` : ''}</li>`;
    });
    code.innerHTML = ['<li><span>{</span></li>', ...lines, '<li><span>}</span></li>'].join('');
    previous = state;
    clear.disabled = stored === 0;
  };

  const open = () => {
    render();
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    host.classList.add('is-open');
    requestAnimationFrame(() => panel.classList.add('is-visible'));
  };
  const close = () => {
    if (!cleared) store.set(keys.notice, 'seen');
    panel.classList.remove('is-visible');
    launcher.setAttribute('aria-expanded', 'false');
    host.classList.remove('is-open');
    host.classList.add('is-seen');
    setTimeout(() => { if (!host.classList.contains('is-open')) panel.hidden = true; }, 260);
  };

  clear.addEventListener('click', () => {
    Object.values(keys).forEach(store.remove);
    window.bosonTheme?.apply(window.bosonTheme.system());
    cleared = true;
    render();
    clear.textContent = 'Cleared';
  });
  launcher.addEventListener('click', () => (panel.hidden ? open() : close()));
  host.querySelector('.pp-close').addEventListener('click', close);
  host.querySelector('.pp-done').addEventListener('click', close);
  panel.addEventListener('keydown', event => { if (event.key === 'Escape') { close(); launcher.focus({ preventScroll: true }); } });
  document.querySelectorAll('.cookie-reopen').forEach(button => button.addEventListener('click', () => {
    clear.textContent = 'Clear data';
    open();
    panel.querySelector('.pp-done').focus({ preventScroll: true });
  }));
  document.addEventListener('boson:theme', () => { if (!panel.hidden) render(); });

  render();
  if (store.get(keys.notice) === 'seen') host.classList.add('is-seen');
  else setTimeout(open, 1400);
})();
