const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('#mobile-menu');
function setMenu(open, returnFocus = false) {
  mobileMenu.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.querySelector('.menu-label').textContent = open ? 'Close' : 'Menu';
  document.body.classList.toggle('menu-open', open);
  if (!open && returnFocus) menuButton.focus();
}
menuButton.addEventListener('click', () => setMenu(mobileMenu.hidden));
mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !mobileMenu.hidden) setMenu(false, true);
});
window.matchMedia('(min-width: 900px)').addEventListener('change', event => {
  if (event.matches) setMenu(false);
});
document.querySelector('#year').textContent = new Date().getFullYear();

// Hairline under the header once the page moves.
const markScrolled = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
markScrolled();
window.addEventListener('scroll', markScrolled, { passive: true });

// Highlight the homepage section currently in view.
const spyLinks = [...document.querySelectorAll('.desktop-nav a[href^="#"]')];
const spyTargets = spyLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
if (spyTargets.length && 'IntersectionObserver' in window) {
  const visible = new Map();
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => visible.set(entry.target.id, entry.isIntersecting));
    const current = spyTargets.find(target => visible.get(target.id));
    spyLinks.forEach(link => link.setAttribute('aria-current', String(!!current && link.getAttribute('href') === `#${current.id}`)));
  }, { rootMargin: '-45% 0px -50% 0px' });
  spyTargets.forEach(target => observer.observe(target));
}

// Studio clock: real time in Phalia and the visitor's offset from it.
const clocks = document.querySelectorAll('[data-clock]');
if (clocks.length) {
  const zone = 'Asia/Karachi';
  const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: zone });
  const hourIn = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: zone });
  const daypart = document.querySelector('[data-daypart]');
  const offset = document.querySelector('[data-offset]');
  const tick = () => {
    const now = new Date();
    clocks.forEach(el => { el.textContent = time.format(now); el.dateTime = now.toISOString(); });
    const hour = Number(hourIn.format(now));
    if (daypart) daypart.textContent = hour < 5 ? '· night' : hour < 12 ? '· morning' : hour < 17 ? '· afternoon' : hour < 21 ? '· evening' : '· night';
    if (offset) {
      const diff = (-now.getTimezoneOffset() - 300) / 60;
      const hours = Math.abs(diff);
      const label = `${Number.isInteger(hours) ? hours : hours.toFixed(1)} h`;
      offset.textContent = diff === 0 ? 'Same time zone as the studio' : `${label} ${diff < 0 ? 'behind' : 'ahead of'} Phalia`;
    }
  };
  tick();
  setInterval(tick, 15000);
}

const themeButton = document.querySelector('.theme-toggle');
const systemTheme = window.matchMedia('(prefers-color-scheme: light)');
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const label = `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`;
  themeButton.setAttribute('aria-label', label);
  themeButton.title = label;
  document.querySelector('meta[name="theme-color"]').content = theme === 'light' ? '#eef3f1' : '#050e12';
  document.dispatchEvent(new CustomEvent('boson:theme', { detail: theme }));
}
applyTheme(document.documentElement.dataset.theme || 'dark');
themeButton.hidden = false;
window.bosonTheme = { apply: applyTheme, system: () => (systemTheme.matches ? 'light' : 'dark') };
themeButton.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(theme);
  try { localStorage.setItem('boson-theme', theme); } catch { /* The toggle still works for this visit. */ }
});
systemTheme.addEventListener('change', event => {
  let saved;
  try { saved = localStorage.getItem('boson-theme'); } catch { /* Use the system preference. */ }
  if (saved !== 'light' && saved !== 'dark') applyTheme(event.matches ? 'light' : 'dark');
});
window.addEventListener('storage', event => {
  if (event.key === 'boson-theme' || event.key === null) {
    const theme = event.newValue === 'light' || event.newValue === 'dark'
      ? event.newValue : systemTheme.matches ? 'light' : 'dark';
    applyTheme(theme);
  }
});

// Site root, derived from the stylesheet so it works on nested pages too.
const siteRoot = new URL('../', document.querySelector('link[rel=stylesheet][href*="assets/styles.css"]').href);

const contactForm = document.querySelector('#contact-form');
if (contactForm) {
  const status = contactForm.querySelector('#form-status');
  const submit = contactForm.querySelector('button[type=submit]');
  const label = submit.querySelector('.button-label');
  const required = [...contactForm.querySelectorAll('input[required], textarea[required]')];
  const loadedAt = performance.now();
  const mailto = data => {
    const needs = data.getAll('need');
    const body = `Name: ${data.get('name')}\nEmail: ${data.get('email')}${needs.length ? `\nLooking for: ${needs.join(', ')}` : ''}\n\n${data.get('message')}`;
    return `mailto:contact@bosonstudio.com?subject=${encodeURIComponent(`Project enquiry from ${data.get('name')}`)}&body=${encodeURIComponent(body)}`;
  };
  const showStatus = (text, tone, link) => {
    status.dataset.tone = tone;
    status.textContent = text;
    if (link) {
      const a = document.createElement('a');
      a.href = link; a.className = 'inline-link'; a.textContent = 'Send it from your email app instead';
      status.append(' ', a, '.');
    }
  };
  submit.disabled = false;
  required.forEach(field => field.addEventListener('input', () => { if (field.validity.valid) field.removeAttribute('aria-invalid'); }));
  contactForm.addEventListener('submit', async event => {
    event.preventDefault();
    const invalid = required.filter(field => !field.validity.valid || !field.value.trim());
    required.forEach(field => invalid.includes(field) ? field.setAttribute('aria-invalid', 'true') : field.removeAttribute('aria-invalid'));
    if (invalid.length) {
      showStatus('Please add your name, a valid email address, and a few words about the project.', 'error');
      invalid[0].focus();
      return;
    }
    const data = new FormData(contactForm);
    window.location.href = mailto(data);
    showStatus('Your email draft is ready. Review and send it in your email app.', 'info', mailto(data));

  });
}


// Project directory filter.
const filterBar = document.querySelector('.filter-bar');
if (filterBar) {
  const cards = [...document.querySelectorAll('.directory-grid .work-card')];
  filterBar.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    filterBar.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    const value = button.dataset.filter;
    cards.forEach(card => { card.hidden = value !== 'all' && !card.dataset.groups.split(' ').includes(value); });
  });
  filterBar.hidden = false;
}

// Sitemap search: filters the tree as you type, "/" focuses, Escape clears.
const mapQuery = document.querySelector('#map-query');
if (mapQuery) {
  const items = [...document.querySelectorAll('.map-item')];
  const branches = [...document.querySelectorAll('.map-branch')];
  const result = document.querySelector('#map-result');
  const empty = document.querySelector('.map-empty');
  const titles = new Map(items.map(item => [item, item.querySelector('strong').textContent]));
  const mark = (text, terms) => {
    const safe = text.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    if (!terms.length) return safe;
    const pattern = new RegExp(`(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    return safe.replace(pattern, '<mark>$1</mark>');
  };
  const filter = () => {
    const terms = mapQuery.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    items.forEach(item => {
      const match = terms.every(term => item.dataset.search.includes(term));
      item.hidden = !match;
      if (match) shown += 1;
      item.querySelector('strong').innerHTML = mark(titles.get(item), terms);
    });
    branches.forEach(branch => { branch.hidden = !branch.querySelector('.map-item:not([hidden])'); });
    document.querySelector('.map').classList.toggle('is-filtering', terms.length > 0);
    empty.hidden = shown > 0;
    result.textContent = terms.length ? `${shown} of ${items.length} ${shown === 1 ? 'entry matches' : 'entries match'} “${mapQuery.value.trim()}”` : '';
  };
  mapQuery.addEventListener('input', filter);
  mapQuery.addEventListener('keydown', event => {
    if (event.key === 'Escape') { mapQuery.value = ''; filter(); }
    if (event.key === 'Enter') document.querySelector('.map-item:not([hidden]) a')?.click();
  });
  document.addEventListener('keydown', event => {
    if (event.key === '/' && !event.target.closest('input, textarea, [contenteditable]')) { event.preventDefault(); mapQuery.focus(); }
  });
}

// Privacy notice contents: mark the section being read.
const tocLinks = [...document.querySelectorAll('.legal-toc a')];
if (tocLinks.length) {
  const headings = tocLinks.map(link => document.querySelector(link.getAttribute('href')));
  let frame = 0;
  const markCurrent = () => {
    frame = 0;
    const current = headings.filter(h => h.getBoundingClientRect().top < window.innerHeight * 0.35).pop() || headings[0];
    tocLinks.forEach((link, i) => link.setAttribute('aria-current', String(headings[i] === current)));
  };
  markCurrent();
  window.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(markCurrent); }, { passive: true });
}
