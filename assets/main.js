const menuButton = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('#mobile-menu');
function closeMenu(returnFocus = false) {
  mobileMenu.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.querySelector('span').textContent = '＋';
  if (returnFocus) menuButton.focus();
}
menuButton.addEventListener('click', () => {
  const opening = mobileMenu.hidden;
  mobileMenu.hidden = !opening;
  menuButton.setAttribute('aria-expanded', String(opening));
  menuButton.querySelector('span').textContent = opening ? '−' : '＋';
});
mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !mobileMenu.hidden) closeMenu(true);
});
window.matchMedia('(min-width: 768px)').addEventListener('change', event => {
  if (event.matches) closeMenu();
});
document.querySelector('#year').textContent = new Date().getFullYear();

const themeButton = document.querySelector('.theme-toggle');
const systemTheme = window.matchMedia('(prefers-color-scheme: light)');
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const label = `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`;
  themeButton.setAttribute('aria-label', label);
  themeButton.title = label;
  document.querySelector('meta[name="theme-color"]').content = theme === 'light' ? '#eef3f1' : '#050e12';
}
applyTheme(document.documentElement.dataset.theme || 'dark');
themeButton.hidden = false;
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

const contactForm = document.querySelector('#contact-form');
if (contactForm) contactForm.querySelector('button[type=submit]').disabled = false;
if (contactForm) contactForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!contactForm.reportValidity()) return;
  const fields = new FormData(contactForm);
  const name = String(fields.get('name')).trim();
  const email = String(fields.get('email')).trim();
  const message = String(fields.get('message')).trim();
  if (!name || message.length < 10) {
    document.querySelector('#form-status').textContent = 'Please enter your name and at least 10 characters about your project.';
    return;
  }
  const subject = encodeURIComponent(`Project enquiry from ${name}`);
  const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
  window.location.href = `mailto:contact@bosonstudio.com?subject=${subject}&body=${body}`;
  document.querySelector('#form-status').textContent = 'Your email draft is ready to open. Send it from your email app. If no app opens, email contact@bosonstudio.com directly.';
});
