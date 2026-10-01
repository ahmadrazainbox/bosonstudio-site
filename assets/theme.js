// Apply the saved or system theme before the stylesheet is painted.
(() => {
  const system = window.matchMedia('(prefers-color-scheme: light)');
  let saved;
  try { saved = localStorage.getItem('boson-theme'); } catch { /* Storage may be unavailable. */ }
  const theme = saved === 'light' || saved === 'dark' ? saved : system.matches ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
})();
