// Ported from bosonstudio-brand-guide/src/Manifesto.tsx and its cover motion.
(() => {
  const section = document.querySelector('#manifesto');
  if (!section) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(min-width: 768px) and (hover: hover)');
  const lines = [...section.querySelectorAll('.manifesto-line')];
  const dots = [...section.querySelectorAll('.manifesto-progress li')];
  const count = section.querySelector('.manifesto-count');
  const glow = section.querySelector('.field-glow');
  const finale = section.querySelector('.field-finale');
  const canvas = section.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const words = lines.map(line => [...line.querySelectorAll('p span')]);
  const smooth = x => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };
  let progress = 0, level = 0, scrollFrame = 0;
  const update = () => {
    scrollFrame = 0;
    if (motion.matches) return;
    const travel = section.offsetHeight - window.innerHeight;
    const t = travel > 0 ? Math.min(1, Math.max(0, -section.getBoundingClientRect().top / travel)) : 0;
    progress = Math.min(6, t * 6.45);
    level = progress / 6;
    section.style.setProperty('--lattice-dot', `rgba(0, 220, 95, ${(0.12 + 0.16 * level).toFixed(3)})`);
    const step = Math.round(progress);
    count.textContent = `${step + 1} / 7`;
    dots.forEach((dot, i) => { dot.classList.toggle('active', i === step); });
    glow.style.opacity = 0.35 + 0.65 * level;
    finale.style.opacity = smooth((0.8 - Math.abs(progress - 6)) / 0.6);
    lines.forEach((line, i) => {
      const d = progress - i;
      line.hidden = Math.abs(d) >= 1;
      if (line.hidden) return;
      line.style.transform = `translateY(calc(-50% + ${(-d * 72).toFixed(1)}px))`;
      words[i].forEach((word, k) => {
        const offset = k / Math.max(1, words[i].length - 1) * 0.34 - 0.17;
        const v = smooth((0.62 - Math.abs(d - offset)) / 0.42);
        word.style.opacity = v;
        word.style.filter = fine.matches && v < 0.98 ? `blur(${((1-v)*9).toFixed(2)}px)` : 'none';
        word.style.transform = `translateY(${((d-offset)*-22).toFixed(1)}px)`;
      });
      if (i === 6) {
        const v = smooth((0.7 - Math.abs(d)) / 0.5);
        const mark = line.querySelector('img');
        mark.style.opacity = v;
        mark.style.transform = `scale(${0.7+0.3*v}) rotate(${(1-v)*-40}deg)`;
        line.querySelector('small').style.opacity = smooth(v * 1.6 - 0.6);
      }
    });
  };
  const onScroll = () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(update); };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  // Same sparse, slow hex rain, frame budget and mobile resolution as the guide.
  const CELL = 22, GLYPHS = '0123456789ABCDEF';
  let cols = 0, rows = 0, firstCol = 0, dpr = 1, narrow = false, drops = [];
  let visible = false, raf = 0, last = 0;
  const glyph = seed => GLYPHS[Math.floor(Math.abs(Math.sin(seed)) * GLYPHS.length) % GLYPHS.length];
  const spawn = (anywhere = false) => ({ col: firstCol + Math.floor(Math.random() * (cols - firstCol)), y: anywhere ? Math.random() * rows : -Math.random() * rows * .6, speed: 1.2 + Math.random() * 1.8, len: 10 + Math.floor(Math.random() * 12), seed: Math.random() * 1000 });
  const paint = now => {
    if (!ctx) return;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);
    ctx.font = "12px 'JetBrains Mono', monospace";
    ctx.textBaseline = 'top';
    const gain = (.55 + .75 * level) * (narrow ? .7 : 1);
    const active = Math.min(drops.length, Math.max(3, Math.round(drops.length * (.6+.4*level))));
    for (let i=0;i<active;i++) {
      const d = drops[i], head = Math.floor(d.y);
      for(let k=0;k<d.len;k++) {
        const r = head-k;
        if(r<0 || r>=rows) continue;
        const fade=1-k/d.len;
        ctx.fillStyle=k===0?`rgba(216,237,160,${.6+.35*level})`:`rgba(0,220,95,${.5*gain*fade*fade})`;
        ctx.fillText(k===0?glyph(now*.01+d.seed):glyph(r*7.13+d.col*3.7+d.seed),d.col*CELL+5,r*CELL+4);
      }
    }
  };
  const resize = () => {
    narrow=canvas.clientWidth<700;
    dpr=Math.min(devicePixelRatio||1,narrow?1.25:2);
    canvas.width=Math.floor(canvas.clientWidth*dpr); canvas.height=Math.floor(canvas.clientHeight*dpr);
    cols=Math.ceil(canvas.clientWidth/CELL);rows=Math.ceil(canvas.clientHeight/CELL);firstCol=Math.floor(cols*(narrow?.55:.46));
    drops=Array.from({length:narrow?4:Math.max(5,Math.floor((cols-firstCol)/3))},()=>spawn(true));
    paint(performance.now());
  };
  const frame = now => {
    raf=0;
    if(!visible || motion.matches || document.hidden || !ctx) return;
    if(now-last>=1000/(narrow?15:20)) {
      const dt=Math.min(.1,(now-last)/1000);last=now;
      drops.forEach((d,i)=>{d.y+=d.speed*(.8+.6*level)*dt;if(Math.floor(d.y)-d.len>rows)drops[i]=spawn();});
      paint(now);
    }
    raf=requestAnimationFrame(frame);
  };
  const sync = () => {
    section.classList.toggle('motion-ready', !motion.matches);
    cancelAnimationFrame(raf);raf=0;
    resize();update();
    if(visible && !motion.matches && !document.hidden) raf=requestAnimationFrame(frame);
  };
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();}).observe(section);
  new ResizeObserver(resize).observe(canvas);
  motion.addEventListener('change',sync);fine.addEventListener('change',update);
  document.addEventListener('visibilitychange',sync);
  sync();
})();
