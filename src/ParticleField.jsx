import React, { useEffect, useRef } from 'react';

/**
 * Анимированный «моховый» рельеф из частиц (canvas 2D) + парящие пылинки.
 * Используется на баннере коллекции, в карточке товара и на экране «Заказ оформлен».
 *
 * Параметры:
 *  cols, rows  — плотность сетки рельефа (0 — без рельефа, только пылинки)
 *  horizon     — где начинается рельеф (доля высоты)
 *  lift        — вертикальный масштаб рельефа
 *  dust        — количество пылинок
 *  dustTop     — выше этой линии пылинки гаснут (доля высоты)
 *  speed       — скорость «течения» рельефа
 */
const PALETTE_SIZE = 32;
const FAR = 6.2;

const STOPS = [
  [10, 14, 6],
  [52, 70, 28],
  [112, 140, 58],
  [168, 192, 98],
  [222, 236, 168],
];
const PALETTE = Array.from({ length: PALETTE_SIZE }, (_, i) => {
  const t = (i / (PALETTE_SIZE - 1)) * (STOPS.length - 1);
  const a = STOPS[Math.floor(t)];
  const b = STOPS[Math.min(STOPS.length - 1, Math.floor(t) + 1)];
  const f = t - Math.floor(t);
  const c = a.map((v, k) => Math.round(v + (b[k] - v) * f));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
});

function terrain(x, w, t) {
  return (
    0.24 * Math.sin(x * 1.9 + w * 0.9 + t * 0.32) +
    0.15 * Math.sin(x * 3.7 - w * 1.6 - t * 0.45 + 1.3) +
    0.08 * Math.sin((x + w * 0.6) * 7.5 + t * 0.7) +
    0.035 * Math.sin(x * 19 + w * 11 + t * 1.6)
  );
}

export default function ParticleField({
  cols = 110, rows = 90, horizon = 0.4, lift = 0.43, dust = 70, dustTop = 0.22, speed = 1, className = '',
}) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const N = cols * rows;
    const px = new Float32Array(N);
    const pd = new Float32Array(N);
    const seed = new Float32Array(N);
    for (let k = 0; k < N; k++) {
      const i = k % cols;
      const j = Math.floor(k / cols);
      // x — доля ширины экрана; глубина распределена равномерно на экране (по 1/d)
      px[k] = -0.53 + (1.06 * (i + Math.random())) / cols;
      const u = (j + Math.random()) / rows;
      pd[k] = 1 / (1 / FAR + u * (1 - 1 / FAR));
      seed[k] = Math.random();
    }

    let W = 0, H = 0, raf = 0, visible = true, running = false;
    const motes = [];

    function resetMote(d, anywhere) {
      d.x = Math.random() * W;
      d.y = anywhere ? H * (dustTop + Math.random() * (1 - dustTop)) : H * (0.9 + Math.random() * 0.15);
      d.vy = (0.1 + Math.random() * 0.3) * Math.max(0.5, H / 800);
      d.r = 0.5 + Math.random() * 1.3;
      d.ph = Math.random() * Math.PI * 2;
      d.amp = 0.2 + Math.random() * 0.5;
    }

    function resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      if (!W || !H) return;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      motes.length = 0;
      for (let i = 0; i < dust; i++) {
        const d = {};
        resetMote(d, true);
        motes.push(d);
      }
    }

    function draw(ms) {
      const t = (ms / 1000) * speed;
      ctx.clearRect(0, 0, W, H);

      if (N) {
        const hz = H * horizon;
        const spread = Math.max(W, 360) * 0.78;
        const paths = Array.from({ length: PALETTE_SIZE }, () => new Path2D());
        const scale = Math.min(1, H / 700) * 0.4 + 0.6; // на маленьких холстах частицы мельче

        for (let k = 0; k < N; k++) {
          const d = pd[k];
          const sx = W / 2 + px[k] * W;
          const x = (px[k] * W * d) / spread;
          const w = d - 1;
          const h = terrain(x, w, t);
          const sy = hz + ((1.2 - h) * H * lift) / d;
          if (sy < hz - 2) continue;

          const slope = h - terrain(x + 0.04, w, t);
          let light = 0.52 + h * 0.9 + slope * 7 + (seed[k] - 0.5) * 0.35;
          light *= Math.max(0, 1.18 - d * 0.16);
          const b = Math.max(0, Math.min(PALETTE_SIZE - 1, Math.round(light * (PALETTE_SIZE - 1))));
          if (b === 0) continue;

          const size = (1.9 / d + 0.35) * scale;
          const len = size * (1.4 + seed[k] * 2.6);
          if (sy - len > H) continue;
          const sway = Math.sin(t * 1.2 + seed[k] * 6.28 + x * 3) * size * 0.35;
          paths[b].rect(sx + sway, sy - len, Math.max(0.6, size * 0.62), len);
        }
        for (let b = 1; b < PALETTE_SIZE; b++) {
          ctx.fillStyle = PALETTE[b];
          ctx.fill(paths[b]);
        }
      }

      ctx.fillStyle = '#dbe8a6';
      for (const p of motes) {
        if (!reduceMotion) {
          p.y -= p.vy;
          p.x += Math.sin(t * 0.8 + p.ph) * p.amp * 0.3;
          if (p.y < H * dustTop) resetMote(p, false);
        }
        const fade = Math.min(1, (p.y - H * dustTop) / (H * 0.25));
        ctx.globalAlpha = Math.max(0, (0.3 + 0.7 * Math.abs(Math.sin(t * 1.5 + p.ph))) * fade);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (running) raf = requestAnimationFrame(draw);
    }

    function start() {
      if (running || reduceMotion) return;
      running = true;
      raf = requestAnimationFrame(draw);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    resize();
    if (reduceMotion) draw(0);
    else start();

    // Экономим батарею: не рисуем, когда холст вне экрана или вкладка скрыта
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      visible && !document.hidden ? start() : stop();
    });
    io.observe(canvas);
    const onVis = () => (visible && !document.hidden ? start() : stop());
    document.addEventListener('visibilitychange', onVis);
    const ro = new ResizeObserver(() => {
      resize();
      if (!running) draw(performance.now());
    });
    ro.observe(canvas);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [cols, rows, horizon, lift, dust, dustTop, speed]);

  return <canvas ref={ref} className={`particles ${className}`} aria-hidden="true" />;
}
