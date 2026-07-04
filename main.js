/* ═══════════════════════════════════════════════════════
   Bilge Kağan Özbay — main.js
   1) Arkaplan: "istatistik atlası" — ekranda kendini yavaşça
      çizen, sonra solup yenisiyle değişen hayalet grafikler
      (EKK saçılımı, logit, histogram, artıklar, fark-fark,
      katsayı grafiği, yoğunluklar — hepsi yatay kesit)
   2) Sekme geçişleri
   3) Kart tilt, fotoğraf yedeği
   ═══════════════════════════════════════════════════════ */

// ─── 1. Grafik atlası arkaplanı ───────────────────────
(function initChartAtlas() {
  const canvas = document.getElementById('bgCharts');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // açık çelik zemin üzerine koyu grafit çizgiler
  const SILVER = '62,80,100';
  const BRIGHT = '32,44,58';
  const TAU = Math.PI * 2;

  const rand = (a, b) => a + Math.random() * (b - a);
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 0.66;
  const clamp01 = (u) => Math.max(0.03, Math.min(0.97, u));
  const ease = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));

  // Grafik koordinatları: (0,0) sol-alt, (1,1) sağ-üst
  const X = (v, u) => v.x + u * v.w;
  const Y = (v, u) => v.y + v.h - u * v.h;

  function axes(v, a) {
    ctx.strokeStyle = `rgba(${SILVER},${a * 0.4})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(v.x, v.y);
    ctx.lineTo(v.x, v.y + v.h);
    ctx.lineTo(v.x + v.w, v.y + v.h);
    ctx.stroke();
  }

  function label(v, text, a) {
    ctx.fillStyle = `rgba(${SILVER},${a * 0.65})`;
    ctx.font = '10px Consolas, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(text, v.x + v.w, v.y + v.h + 15);
  }

  function polyline(v, f, from, to, steps = 60) {
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const u = from + (to - from) * (i / steps);
      const px = X(v, u), py = Y(v, f(u));
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  // ── Grafik türleri ──────────────────────────────────
  // Her tür: init(v) veriyi üretir, draw(v,t,a) t saniyede çizer.

  const scatterOLS = {
    init(v) {
      const a0 = rand(0.12, 0.26), b = rand(0.4, 0.62);
      v.d = {
        a0, b,
        pts: Array.from({ length: 26 }, () => {
          const px = Math.random();
          return { px, py: clamp01(a0 + b * px + gauss() * 0.13) };
        })
      };
    },
    draw(v, t, a) {
      axes(v, a); label(v, 'EKK', a);
      const { pts, a0, b } = v.d;
      const shown = Math.floor(ease(t / 6) * pts.length);
      ctx.fillStyle = `rgba(${SILVER},${a * 0.85})`;
      for (let i = 0; i < shown; i++) {
        ctx.beginPath();
        ctx.arc(X(v, pts[i].px), Y(v, pts[i].py), 2, 0, TAU);
        ctx.fill();
      }
      const lp = ease((t - 5.5) / 2.5);
      if (lp > 0) {
        ctx.strokeStyle = `rgba(${BRIGHT},${a})`;
        ctx.lineWidth = 1.4;
        polyline(v, (u) => a0 + b * u, 0, lp, 2);
      }
      const cp = ease((t - 8) / 2.5);
      if (cp > 0) {
        ctx.strokeStyle = `rgba(${SILVER},${a * 0.45 * cp})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        polyline(v, (u) => a0 + b * u + 0.08, 0, 1, 2);
        polyline(v, (u) => a0 + b * u - 0.08, 0, 1, 2);
        ctx.setLineDash([]);
      }
    }
  };

  const logitFit = {
    init(v) {
      const k = rand(7, 10);
      v.d = {
        k,
        pts: Array.from({ length: 28 }, () => {
          const px = Math.random();
          const cls = Math.random() < 1 / (1 + Math.exp(-k * (px - 0.5))) ? 1 : 0;
          return { px, py: cls ? rand(0.86, 0.97) : rand(0.03, 0.14), cls };
        })
      };
    },
    draw(v, t, a) {
      axes(v, a); label(v, 'logit', a);
      const { pts, k } = v.d;
      const shown = Math.floor(ease(t / 5.5) * pts.length);
      for (let i = 0; i < shown; i++) {
        const p = pts[i];
        ctx.beginPath();
        ctx.arc(X(v, p.px), Y(v, p.py), 2.2, 0, TAU);
        if (p.cls) {
          ctx.fillStyle = `rgba(${SILVER},${a * 0.85})`;
          ctx.fill();
        } else {
          ctx.strokeStyle = `rgba(${SILVER},${a * 0.7})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
      const lp = ease((t - 4.5) / 4);
      if (lp > 0) {
        ctx.strokeStyle = `rgba(${BRIGHT},${a})`;
        ctx.lineWidth = 1.4;
        polyline(v, (u) => 0.06 + 0.88 / (1 + Math.exp(-k * (u - 0.5))), 0, lp);
      }
    }
  };

  const histNormal = {
    init(v) {
      const m = 11, c = rand(4.2, 5.8), s = rand(1.8, 2.5);
      const bars = [];
      for (let i = 0; i < m; i++) {
        bars.push(Math.exp(-Math.pow((i - c) / s, 2)) * rand(0.8, 1.1) * 0.82);
      }
      v.d = { m, c, s, bars };
    },
    draw(v, t, a) {
      axes(v, a); label(v, 'dağılım', a);
      const { m, c, s, bars } = v.d;
      const bw = (v.w / m) * 0.7;
      for (let i = 0; i < m; i++) {
        const g = ease((t - 0.3 - i * 0.3) / 1.2);
        if (g <= 0) continue;
        const hh = bars[i] * g * v.h;
        const bx = v.x + (i + 0.15) * (v.w / m);
        ctx.fillStyle = `rgba(${SILVER},${a * 0.22})`;
        ctx.strokeStyle = `rgba(${SILVER},${a * 0.5})`;
        ctx.lineWidth = 1;
        ctx.fillRect(bx, v.y + v.h - hh, bw, hh);
        ctx.strokeRect(bx, v.y + v.h - hh, bw, hh);
      }
      const lp = ease((t - 5) / 3);
      if (lp > 0) {
        ctx.strokeStyle = `rgba(${BRIGHT},${a})`;
        ctx.lineWidth = 1.4;
        polyline(v, (u) => Math.exp(-Math.pow((u * (m - 1) + 0.5 - c) / s, 2)) * 0.82, 0, lp);
      }
    }
  };

  const residualPlot = {
    init(v) {
      v.d = { es: Array.from({ length: 22 }, () => gauss() * 0.55) };
    },
    draw(v, t, a) {
      axes(v, a); label(v, 'artıklar', a);
      const { es } = v.d;
      const zp = ease(t / 1.5);
      if (zp > 0) {
        ctx.strokeStyle = `rgba(${SILVER},${a * 0.5})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(X(v, 0), Y(v, 0.5));
        ctx.lineTo(X(v, zp), Y(v, 0.5));
        ctx.stroke();
        ctx.setLineDash([]);
      }
      const shown = Math.floor(ease((t - 1) / 6) * es.length);
      for (let i = 0; i < shown; i++) {
        const px = X(v, (i + 0.5) / es.length);
        const y0 = Y(v, 0.5), y1 = Y(v, 0.5 + es[i] * 0.45);
        ctx.strokeStyle = `rgba(${SILVER},${a * 0.4})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, y0);
        ctx.lineTo(px, y1);
        ctx.stroke();
        ctx.fillStyle = `rgba(${BRIGHT},${a * 0.85})`;
        ctx.beginPath();
        ctx.arc(px, y1, 2, 0, TAU);
        ctx.fill();
      }
    }
  };

  const didPlot = {
    init(v) {
      v.d = { bx: 0.55, c0: rand(0.24, 0.32), t0: rand(0.46, 0.54), s: 0.1, eff: rand(0.14, 0.2) };
    },
    draw(v, t, a) {
      axes(v, a); label(v, 'fark-fark', a);
      const { bx, c0, t0, s, eff } = v.d;
      const yCtrl = (u) => c0 + s * u;
      const yTreat = (u) => t0 + s * u + (u > bx ? eff * ease((u - bx) / (1 - bx) * 1.6) : 0);
      const yCf = (u) => t0 + s * u; // karşı-olgusal

      const p1 = ease(t / 3);
      if (p1 > 0) {
        ctx.strokeStyle = `rgba(${SILVER},${a * 0.7})`;
        ctx.lineWidth = 1.3;
        polyline(v, yCtrl, 0, p1, 8);
      }
      const p2 = ease((t - 1.5) / 3.5);
      if (p2 > 0) {
        ctx.strokeStyle = `rgba(${BRIGHT},${a})`;
        ctx.lineWidth = 1.5;
        polyline(v, yTreat, 0, p2, 40);
      }
      const p3 = ease((t - 4.5) / 1.2);
      if (p3 > 0) {
        ctx.strokeStyle = `rgba(${SILVER},${a * 0.45})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(X(v, bx), v.y + v.h);
        ctx.lineTo(X(v, bx), v.y + v.h - v.h * p3);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      const p4 = ease((t - 5.5) / 2.5);
      if (p4 > 0) {
        ctx.strokeStyle = `rgba(${SILVER},${a * 0.5})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        polyline(v, yCf, bx, bx + (1 - bx) * p4, 8);
        ctx.setLineDash([]);
      }
      const p5 = ease((t - 8) / 1.5);
      if (p5 > 0) {
        // etki oku: karşı-olgusal ile gözlenen arasındaki dikey fark
        const ux = 0.94;
        const ya = Y(v, yCf(ux)), yb = Y(v, yTreat(ux));
        ctx.strokeStyle = `rgba(${BRIGHT},${a * p5})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(X(v, ux), ya);
        ctx.lineTo(X(v, ux), yb);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(X(v, ux) - 3, yb + 5);
        ctx.lineTo(X(v, ux), yb);
        ctx.lineTo(X(v, ux) + 3, yb + 5);
        ctx.stroke();
      }
    }
  };

  const coefPlot = {
    init(v) {
      v.d = {
        rows: Array.from({ length: 6 }, () => ({
          beta: rand(-0.35, 0.75),
          se: rand(0.09, 0.22)
        }))
      };
    },
    draw(v, t, a) {
      axes(v, a); label(v, 'katsayılar', a);
      const { rows } = v.d;
      const xmin = -0.75, xmax = 1.05;
      const mapx = (val) => v.x + ((val - xmin) / (xmax - xmin)) * v.w;
      const zp = ease(t / 1.5);
      if (zp > 0) {
        ctx.strokeStyle = `rgba(${SILVER},${a * 0.4})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(mapx(0), v.y + v.h);
        ctx.lineTo(mapx(0), v.y + v.h - v.h * zp);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      rows.forEach((r, i) => {
        const g = ease((t - 1 - i * 0.7) / 1.1);
        if (g <= 0) return;
        const ry = v.y + ((i + 0.5) / rows.length) * v.h;
        const half = 1.96 * r.se * g;
        ctx.strokeStyle = `rgba(${SILVER},${a * 0.7})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(mapx(r.beta - half), ry);
        ctx.lineTo(mapx(r.beta + half), ry);
        ctx.stroke();
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(mapx(r.beta + s * half), ry - 3);
          ctx.lineTo(mapx(r.beta + s * half), ry + 3);
          ctx.stroke();
        }
        ctx.fillStyle = `rgba(${BRIGHT},${a * g})`;
        ctx.beginPath();
        ctx.arc(mapx(r.beta), ry, 2.6, 0, TAU);
        ctx.fill();
      });
    }
  };

  const densityPlot = {
    init(v) {
      v.d = {
        mu1: rand(0.3, 0.42), s1: rand(0.09, 0.13),
        mu2: rand(0.55, 0.7), s2: rand(0.11, 0.15), h2: rand(0.68, 0.9)
      };
    },
    draw(v, t, a) {
      axes(v, a); label(v, 'yoğunluk', a);
      const { mu1, s1, mu2, s2, h2 } = v.d;
      const p1 = ease(t / 4);
      if (p1 > 0) {
        ctx.strokeStyle = `rgba(${BRIGHT},${a})`;
        ctx.lineWidth = 1.4;
        polyline(v, (u) => Math.exp(-Math.pow((u - mu1) / s1, 2)) * 0.82, 0, p1);
      }
      const p2 = ease((t - 1.5) / 4);
      if (p2 > 0) {
        ctx.strokeStyle = `rgba(${SILVER},${a * 0.75})`;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([5, 4]);
        polyline(v, (u) => Math.exp(-Math.pow((u - mu2) / s2, 2)) * h2, 0, p2);
        ctx.setLineDash([]);
      }
    }
  };

  const TYPES = [scatterOLS, logitFit, histNormal, residualPlot, didPlot, coefPlot, densityPlot];

  // ── Yerleşim ve yaşam döngüsü ───────────────────────
  let W = 0, H = 0, cells = [], vignettes = [];

  function layout() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cols = W >= 1000 ? 3 : W >= 620 ? 2 : 1;
    const rows = H >= 620 ? 2 : 1;
    cells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        cells.push({ x: (c * W) / cols, y: (r * H) / rows, w: W / cols, h: H / rows });
      }
    }
    vignettes = [];
  }

  function spawn(cellIdx, startT) {
    const cell = cells[cellIdx];
    const type = TYPES[Math.floor(Math.random() * TYPES.length)];
    const w = Math.min(cell.w * 0.6, 300);
    const h = Math.min(cell.h * 0.45, 165);
    const v = {
      cell: cellIdx,
      type,
      w, h,
      x: cell.x + rand(cell.w * 0.12, Math.max(cell.w * 0.12, cell.w - w - cell.w * 0.12)),
      y: cell.y + rand(cell.h * 0.14, Math.max(cell.h * 0.14, cell.h - h - cell.h * 0.2)),
      t: startT,
      dur: rand(17, 24),
      bob: rand(0, TAU)
    };
    type.init(v);
    vignettes.push(v);
  }

  function drawVignette(v, now) {
    if (v.t < 0) return;
    // görünürlük zarfı: hızlı giriş, yumuşak çıkış
    const env = Math.min(ease(v.t / 1.1), ease((v.dur - v.t) / 3)) * 0.5;
    if (env <= 0.005) return;
    ctx.save();
    ctx.translate(0, Math.sin(now / 4200 + v.bob) * 5); // hafif salınım
    v.type.draw(v, v.t, env);
    ctx.restore();
  }

  if (reduced) {
    // hareket azaltılmış: tek statik kare
    layout();
    cells.forEach((_, i) => spawn(i, 12));
    ctx.clearRect(0, 0, W, H);
    vignettes.forEach((v) => {
      ctx.save();
      v.type.draw(v, 12, 0.4);
      ctx.restore();
    });
    return;
  }

  layout();
  cells.forEach((_, i) => spawn(i, -rand(0, 3.5))); // başlangıçta kademeli giriş

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layout, 150);
  });

  let last = performance.now();
  (function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    ctx.clearRect(0, 0, W, H);

    vignettes.forEach((v) => { v.t += dt; });
    // süresi dolanları yenileriyle değiştir
    for (let i = vignettes.length - 1; i >= 0; i--) {
      if (vignettes[i].t >= vignettes[i].dur) {
        const cellIdx = vignettes[i].cell;
        vignettes.splice(i, 1);
        spawn(cellIdx, -rand(0.5, 2.5));
      }
    }
    vignettes.forEach((v) => drawVignette(v, now));
    requestAnimationFrame(frame);
  })(last);
})();

// ─── 2. Sekmeler ──────────────────────────────────────
(function initTabs() {
  const tabs = Array.from(document.querySelectorAll('.tab'));
  const indicator = document.getElementById('tabIndicator');

  function moveIndicator(btn) {
    indicator.style.left = btn.offsetLeft + 'px';
    indicator.style.width = btn.offsetWidth + 'px';
  }

  function revealPanel(panel) {
    const items = panel.querySelectorAll('.reveal');
    items.forEach((el) => el.classList.remove('in'));
    // reflow — animasyonun yeniden tetiklenmesi için
    void panel.offsetWidth;
    items.forEach((el, i) => {
      setTimeout(() => el.classList.add('in'), 20 + i * 35);
    });
  }

  function activate(id, updateHash = true) {
    const btn = tabs.find((t) => t.dataset.tab === id) || tabs[0];
    id = btn.dataset.tab;

    tabs.forEach((t) => t.classList.toggle('active', t === btn));
    moveIndicator(btn);

    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
    const panel = document.getElementById('panel-' + id);
    panel.classList.add('active');
    revealPanel(panel);

    if (updateHash) history.replaceState(null, '', '#' + id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  tabs.forEach((btn) => btn.addEventListener('click', () => activate(btn.dataset.tab)));

  // Hero düğmeleri gibi sekmeye yönlendiren bağlantılar
  document.querySelectorAll('[data-goto]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      activate(a.dataset.goto);
    });
  });

  window.addEventListener('resize', () => {
    const active = tabs.find((t) => t.classList.contains('active'));
    if (active) moveIndicator(active);
  });

  // İlk yükleme: hash varsa oraya git
  const initial = location.hash.replace('#', '');
  activate(initial || 'ana', Boolean(initial));
})();

// ─── 3. Kart tilt (3B perspektif) ─────────────────────
(function initTilt() {
  const strength = 7; // derece
  document.querySelectorAll('.tilt').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform =
        `perspective(800px) rotateY(${px * strength}deg) rotateX(${-py * strength}deg) translateY(-3px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateY(0) rotateX(0)';
    });
  });
})();

// ─── 4. Fotoğraf yedeği: foto.jpg yoksa BKÖ rozeti ────
(function initPhoto() {
  const img = document.getElementById('photo');
  if (!img) return;
  img.addEventListener('error', () => img.classList.add('hidden'));
  if (img.complete && img.naturalWidth === 0) img.classList.add('hidden');
})();
