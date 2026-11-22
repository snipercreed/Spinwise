/* Spinwise motion library: 11 categories x 5 options. Used by the app, the shop preview and the lookbook. */
(function (g) {
"use strict";
const EO = "cubic-bezier(.2,.8,.2,1)", SP = "cubic-bezier(.34,1.56,.64,1)";
const A = (el, kf, o) => el.animate(kf, Object.assign({ fill: "both", duration: 400, easing: EO }, o || {}));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [...(r || document).querySelectorAll(s)];
const COL = ["#e5484d", "#f76b15", "#e0a100", "#30a46c", "#3e63dd", "#8e4ec6"];
const haptic = () => { try { if (g.Android && g.Android.haptic) g.Android.haptic(); else if (navigator.vibrate) navigator.vibrate(8); } catch (e) {} };
const eo4 = p => 1 - Math.pow(1 - p, 4), eo5 = p => 1 - Math.pow(1 - p, 5);
const PRICES = [0, 0, 0, 0, 0], TIERS = ["", "", "", "", ""];

/* ---------- particle effects (layer = element to draw in) ---------- */
function origin(layer, pt) { const r = layer.getBoundingClientRect(); return { x: pt ? pt.x - r.left : r.width / 2, y: pt ? pt.y - r.top : r.height / 2, r }; }
function mk(layer, cls, txt, x, y) { const e = document.createElement("i"); e.className = cls; if (txt) e.textContent = txt; e.style.left = x + "px"; e.style.top = y + "px"; layer.appendChild(e); return e; }
const fx = {
  confetti(layer, pt, n) { const o = origin(layer, pt); for (let i = 0; i < (n || 28); i++) { const p = mk(layer, "m-conf", "", o.x, o.y); p.style.background = COL[i % 6];
      const a = Math.random() * 6.283, d = 60 + Math.random() * 110;
      const an = p.animate([{ transform: "translate(-50%,-50%) rotate(0)", opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px),calc(-50% + ${Math.sin(a) * d + 60}px)) rotate(${Math.random() * 720}deg)`, opacity: 0 }], { duration: 900 + Math.random() * 600, easing: "cubic-bezier(.15,.7,.3,1)" });
      an.onfinish = () => p.remove(); } },
  sparks(layer, pt) { const o = origin(layer, pt); for (let i = 0; i < 12; i++) { const p = mk(layer, "m-spark", "✦", o.x, o.y); const a = i / 12 * 6.283, d = 42 + Math.random() * 50;
      const an = p.animate([{ transform: "translate(-50%,-50%) scale(0)", opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px),calc(-50% + ${Math.sin(a) * d}px)) scale(1.3) rotate(90deg)`, opacity: 1, offset: .5 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d * 1.3}px),calc(-50% + ${Math.sin(a) * d * 1.3}px)) scale(0) rotate(180deg)`, opacity: 0 }], { duration: 800, delay: i * 14, easing: "ease-out" });
      an.onfinish = () => p.remove(); } },
  flames(layer, pt, target) { const o = origin(layer, pt); if (target) A(target, [{ transform: "scale(1)" }, { transform: "scale(1.25) rotate(-6deg)", offset: .3 }, { transform: "scale(.96) rotate(4deg)", offset: .6 }, { transform: "scale(1)" }], { duration: 700, easing: "ease-in-out" });
    for (let i = 0; i < 8; i++) { const p = mk(layer, "m-spark", "🔥", o.x + (Math.random() - .5) * 60, o.y); const dx = (Math.random() - .5) * 60;
      const an = p.animate([{ transform: "translate(-50%,-50%) scale(.4)", opacity: 0 }, { opacity: 1, offset: .2 }, { transform: `translate(calc(-50% + ${dx}px),calc(-50% - ${70 + Math.random() * 50}px)) scale(1.1)`, opacity: 0 }], { duration: 1000 + Math.random() * 400, delay: i * 70, easing: "ease-out" });
      an.onfinish = () => p.remove(); } },
  tick(layer, pt) { const o = origin(layer, pt), w = document.createElement("div"); w.style.cssText = `position:absolute;left:${o.x}px;top:${o.y}px;width:96px;height:96px;margin:-48px 0 0 -48px`;
    w.innerHTML = `<svg viewBox="0 0 80 80" width="96" height="96"><circle class="a" cx="40" cy="40" r="30" fill="none" stroke="var(--acc,#1f8a4c)" stroke-width="5" stroke-dasharray="189" stroke-dashoffset="189" transform="rotate(-90 40 40)" stroke-linecap="round"/><path class="b" d="M26 41l10 10 19-21" fill="none" stroke="var(--acc,#1f8a4c)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="48" stroke-dashoffset="48"/></svg>`;
    layer.appendChild(w); A($(".a", w), [{ strokeDashoffset: 189 }, { strokeDashoffset: 0 }], { duration: 480 }); A($(".b", w), [{ strokeDashoffset: 48 }, { strokeDashoffset: 0 }], { duration: 360, delay: 340 });
    const f = A(w, [{ opacity: 1, transform: "scale(1)" }, { opacity: 1, transform: "scale(1.12)", offset: .3 }, { opacity: 0, transform: "scale(1.3)" }], { duration: 1500, delay: 100, easing: "ease-out" }); f.onfinish = () => w.remove(); },
  coins(layer, pt, wallet) { const o = origin(layer, pt); let tx = o.r.width - 40, ty = 20; if (wallet) { const w = wallet.getBoundingClientRect(); tx = w.left + w.width / 2 - o.r.left; ty = w.top + w.height / 2 - o.r.top; }
    for (let i = 0; i < 10; i++) { const p = mk(layer, "m-coin", "", o.x, o.y), a = Math.random() * 6.283, d = 20 + Math.random() * 40;
      const an = p.animate([{ transform: "translate(-50%,-50%) scale(.3)", opacity: 0 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px),calc(-50% + ${Math.sin(a) * d}px)) scale(1)`, opacity: 1, offset: .3 }, { transform: `translate(calc(-50% + ${tx - o.x}px),calc(-50% + ${ty - o.y}px)) scale(.6)`, opacity: 1 }], { duration: 900, delay: i * 55, easing: "cubic-bezier(.5,0,.3,1)" });
      an.onfinish = () => { p.remove(); if (wallet) A(wallet, [{ transform: "scale(1)" }, { transform: "scale(1.16)" }, { transform: "scale(1)" }], { duration: 240 }); }; } }
};

/* ---------- wheel driver ---------- */
function drive(c, dur, fn, ticks) {
  return new Promise(res => { const t0 = performance.now(); let last = Math.floor(c.from / c.slice);
    (function f(now) { const p = Math.min(1, (now - t0) / dur), a = fn(p); c.set(a);
      if (ticks) { const s = Math.floor(a / c.slice); if (s !== last) { last = s; if (c.flick) c.flick(); } }
      if (p < 1) requestAnimationFrame(f); else { c.set(c.to); res(); } })(t0); });
}
const fade = (el, a, b, o) => A(el, [{ opacity: a }, { opacity: b }], o);
function toastRun(c, from, easing, dur, top) {
  c.place(!!top); const el = c.el;
  return A(el, [from, { opacity: 1, transform: "none" }], { duration: dur, easing }).finished.then(() => sleep(1100)).then(() => A(el, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: from.transform }], { duration: 240 }).finished);
}
function countTo(c, ms, v) { if (!c.label) return; const t0 = performance.now(); (function f(now) { const p = Math.min(1, (now - t0) / ms); c.label.textContent = Math.round(v * (1 - Math.pow(1 - p, 3))) + "%"; if (p < 1) requestAnimationFrame(f); })(t0); }
const lbl = (c) => { if (c.label) c.label.textContent = c.pct + "%"; };
const off = c => c.C * (1 - c.pct / 100);

/* ---------- the 55 options ---------- */
const FN = {
  trans: [
    c => { if (c.a) A(c.a, [{ opacity: 1 }, { opacity: 0 }], { duration: 160 }); A(c.b, [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], { duration: 300, delay: c.a ? 120 : 0 }); },
    c => { if (c.a) A(c.a, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: `translateX(${-30 * c.dir}%)` }], { duration: 320 }); A(c.b, [{ opacity: 0, transform: `translateX(${40 * c.dir}%)` }, { opacity: 1, transform: "none" }], { duration: 340 }); },
    c => { if (c.a) A(c.a, [{ opacity: 1 }, { opacity: 0, transform: "scale(1.04)", filter: "blur(5px)" }], { duration: 200 }); A(c.b, [{ opacity: 0, transform: "scale(.94)", filter: "blur(6px)" }, { opacity: 1, transform: "none", filter: "blur(0)" }], { duration: 340, delay: c.a ? 100 : 0 }); },
    c => { if (c.a) A(c.a, [{ opacity: 1, filter: "blur(0)" }, { opacity: 0, filter: "blur(12px)" }], { duration: 220 }); A(c.b, [{ opacity: 0, filter: "blur(14px)", transform: "scale(1.02)" }, { opacity: 1, filter: "blur(0)", transform: "none" }], { duration: 420, delay: c.a ? 80 : 0 }); },
    c => { if (c.a) A(c.a, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: `perspective(700px) rotateY(${-10 * c.dir}deg) translateX(${-20 * c.dir}px)` }], { duration: 200 }); A(c.b, [{ opacity: 0, transform: `perspective(700px) rotateY(${16 * c.dir}deg) translateX(${40 * c.dir}px)` }, { opacity: 1, transform: "perspective(700px) rotateY(0) translateX(0)" }], { duration: 460, delay: c.a ? 60 : 0, easing: SP }); }
  ],
  btn: [
    c => A(c.el, [{ transform: "scale(1)" }, { transform: "scale(.93)", offset: .3 }, { transform: "scale(1)" }], { duration: 420, easing: SP }),
    c => { const r = c.el.getBoundingClientRect(), x = c.pt ? c.pt.x - r.left : r.width / 2, y = c.pt ? c.pt.y - r.top : r.height / 2, d = document.createElement("span"); d.className = "m-rip"; d.style.left = (x - 20) + "px"; d.style.top = (y - 20) + "px"; c.el.appendChild(d);
      const a = d.animate([{ transform: "scale(0)", opacity: .6 }, { transform: "scale(9)", opacity: 0 }], { duration: 650, easing: "ease-out" }); a.onfinish = () => d.remove(); },
    c => A(c.el, [{ transform: "translateY(0)", boxShadow: "0 0 0 rgba(0,0,0,0)" }, { transform: "translateY(-5px)", boxShadow: "0 14px 28px var(--glow,rgba(31,138,76,.5))", offset: .4 }, { transform: "translateY(0)", boxShadow: "0 0 0 rgba(0,0,0,0)" }], { duration: 560, easing: "ease-in-out" }),
    c => { const s = document.createElement("span"); s.className = "m-shine"; c.el.appendChild(s); const a = s.animate([{ transform: "translateX(-130%)" }, { transform: "translateX(330%)" }], { duration: 650, easing: "ease-in-out" }); a.onfinish = () => s.remove(); },
    c => { haptic(); A(c.el, [{ transform: "rotate(0) scale(1)" }, { transform: "rotate(-2.2deg) scale(.97)", offset: .2 }, { transform: "rotate(2deg) scale(.97)", offset: .45 }, { transform: "rotate(-1deg) scale(1)", offset: .7 }, { transform: "rotate(0) scale(1)" }], { duration: 420 }); }
  ],
  wheel: [
    c => drive(c, 3800, p => c.from + (c.to - c.from) * eo4(p)),
    c => { const ov = c.to + 16; return drive(c, 3600, p => { if (p < .86) return c.from + (ov - c.from) * eo4(p / .86); const q = (p - .86) / .14, e = q < .5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2; return ov + (c.to - ov) * e; }); },
    c => drive(c, 3800, p => c.from + (c.to - c.from) * eo4(p), true).then(() => fx.confetti(c.layer, c.pt, 32)),
    c => drive(c, 4200, p => { const e = eo4(p); if (p < .7) return c.from + (c.to - c.from) * e; const e0 = eo4(.7), q = (p - .7) / .3, st = Math.floor(q * 6) / 6; return c.from + (c.to - c.from) * (e0 + (1 - e0) * st); }, true),
    c => drive(c, 4200, p => { if (p < .14) return c.from - 24 * Math.sin(p / .14 * Math.PI / 2); const s = c.from - 24, q = (p - .14) / .86; return s + (c.to - s) * eo5(q); }, true)
  ],
  reveal: [
    c => A(c.card, [{ opacity: 0, transform: "translateY(26px)" }, { opacity: 1, transform: "none" }], { duration: 480 }),
    c => { A(c.card, [{ opacity: 0 }, { opacity: 1 }], { duration: 240 }); const h = $(".m-hl", c.title) || c.title; A(h, [{ backgroundSize: "0% 100%" }, { backgroundSize: "100% 100%" }], { duration: 700, delay: 200, easing: "ease-out" }); },
    c => A(c.card, [{ opacity: 0, transform: "perspective(600px) rotateX(-80deg)" }, { opacity: 1, transform: "perspective(600px) rotateX(0)" }], { duration: 620, easing: SP }),
    c => { const el = c.title, full = el.dataset.full || el.textContent; el.dataset.full = full; el.textContent = ""; A(c.card, [{ opacity: 0 }, { opacity: 1 }], { duration: 200 }); let i = 0; const iv = setInterval(() => { i++; el.textContent = full.slice(0, i) + (i < full.length ? "▍" : ""); if (i >= full.length) clearInterval(iv); }, 32); },
    c => A(c.card, [{ opacity: 0, transform: "scale(.9)", filter: "blur(10px)", boxShadow: "0 0 0 rgba(0,0,0,0)" }, { opacity: 1, transform: "none", filter: "blur(0)", boxShadow: "0 0 34px var(--glow,rgba(31,138,76,.4))", offset: .6 }, { opacity: 1, transform: "none", filter: "blur(0)", boxShadow: "0 0 0 rgba(0,0,0,0)" }], { duration: 900 })
  ],
  ring: [
    c => { lbl(c); A(c.arc, [{ strokeDashoffset: c.C }, { strokeDashoffset: off(c) }], { duration: 1200 }); },
    c => { countTo(c, 1200, c.pct); A(c.arc, [{ strokeDashoffset: c.C }, { strokeDashoffset: off(c) }], { duration: 1200 }); },
    c => { countTo(c, 1400, c.pct); const o = p => c.C * (1 - p / 100); A(c.arc, [{ strokeDashoffset: c.C }, { strokeDashoffset: o(Math.min(100, c.pct + 10)), offset: .55 }, { strokeDashoffset: o(c.pct - 3), offset: .8 }, { strokeDashoffset: o(c.pct) }], { duration: 1500, easing: "ease-in-out" }); },
    c => { lbl(c); A(c.arc, [{ strokeDashoffset: c.C }, { strokeDashoffset: off(c) }], { duration: 1000 }); const s = c.arc.ownerSVGElement; if (s) A(s, [{ transform: "scale(1)" }, { transform: "scale(1.08)" }, { transform: "scale(1)" }], { duration: 460, delay: 950, easing: SP }); },
    c => { lbl(c); A(c.arc, [{ strokeDashoffset: c.C }, { strokeDashoffset: off(c) }], { duration: 1100 }); A(c.arc, [{ filter: "drop-shadow(0 0 0 transparent)" }, { filter: "drop-shadow(0 0 8px var(--ringglow,rgba(120,220,160,.95)))", offset: .5 }, { filter: "drop-shadow(0 0 0 transparent)" }], { duration: 1500 }); }
  ],
  list: [
    c => c.items.forEach((r, k) => A(r, [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], { duration: 380, delay: Math.min(k, 10) * 70 })),
    c => c.items.forEach((r, k) => A(r, [{ opacity: 0, transform: "translateX(-28px)" }, { opacity: 1, transform: "none" }], { duration: 380, delay: Math.min(k, 10) * 60 })),
    c => c.items.forEach((r, k) => A(r, [{ opacity: 0, transform: "scale(.88)" }, { opacity: 1, transform: "none" }], { duration: 480, delay: Math.min(k, 10) * 60, easing: SP })),
    c => c.items.forEach((r, k) => A(r, [{ opacity: 0, filter: "blur(8px)", transform: "translateY(8px)" }, { opacity: 1, filter: "blur(0)", transform: "none" }], { duration: 460, delay: Math.min(k, 10) * 65 })),
    c => { const mid = Math.min(c.items.length, 11) / 2; c.items.forEach((r, k) => A(r, [{ opacity: 0, transform: "scale(.9) translateY(10px)" }, { opacity: 1, transform: "none" }], { duration: 420, delay: Math.abs(Math.min(k, 10) - mid) * 80 })); }
  ],
  sheet: [
    c => { fade(c.scrim, 0, 1, { duration: 260 }); A(c.sheet, [{ transform: "translateY(100%)" }, { transform: "none" }], { duration: 340 }); },
    c => { fade(c.scrim, 0, 1, { duration: 260 }); A(c.sheet, [{ transform: "translateY(100%)" }, { transform: "none" }], { duration: 560, easing: "cubic-bezier(.34,1.35,.64,1)" }); },
    c => { fade(c.scrim, 0, 1, { duration: 260 }); A(c.sheet, [{ opacity: 0, transform: "translateY(34px) scale(.86)" }, { opacity: 1, transform: "none" }], { duration: 380, easing: SP }); },
    c => { fade(c.scrim, 0, 1, { duration: 260 }); A(c.sheet, [{ transform: "translateY(100%)" }, { transform: "none" }], { duration: 380 }); if (c.back) A(c.back, [{ transform: "none", filter: "brightness(1)" }, { transform: "scale(.94) translateY(8px)", filter: "brightness(.85)" }], { duration: 380 }); },
    c => { fade(c.scrim, 0, 1, { duration: 260 }); A(c.sheet, [{ clipPath: "inset(100% 0 0 0 round 24px)", transform: "translateY(18px)" }, { clipPath: "inset(0 0 0 0 round 24px)", transform: "none" }], { duration: 520 }); }
  ],
  heat: [
    c => c.cells.forEach(k => A(k.el, [{ opacity: 0, transform: "scale(.2)" }, { opacity: 1, transform: "scale(1)" }], { duration: 340, delay: k.col / c.cols * 520, easing: SP })),
    c => c.cells.forEach(k => A(k.el, [{ opacity: 0, transform: "scale(.2)" }, { opacity: 1, transform: "scale(1)" }], { duration: 340, delay: Math.random() * 520, easing: SP })),
    c => { const mx = Math.hypot(c.cols, 7); c.cells.forEach(k => A(k.el, [{ opacity: 0, transform: "scale(.2)" }, { opacity: 1, transform: "scale(1)" }], { duration: 340, delay: Math.hypot(c.cols - 1 - k.col, c.todayRow - k.row) / mx * 640, easing: SP })); },
    c => c.cells.forEach(k => A(k.el, [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 300, delay: k.row * 80 + k.col / c.cols * 120 })),
    c => c.cells.forEach(k => A(k.el, [{ opacity: 0, filter: "brightness(2.2)", transform: "scale(.5)" }, { opacity: 1, filter: "brightness(1.8)", transform: "scale(1.1)", offset: .5 }, { opacity: 1, filter: "brightness(1)", transform: "scale(1)" }], { duration: 520, delay: (k.col + k.row) / (c.cols + 7) * 600 }))
  ],
  celeb: [
    c => fx.confetti(c.layer, c.pt),
    c => fx.flames(c.layer, c.pt, c.target),
    c => fx.tick(c.layer, c.pt),
    c => fx.coins(c.layer, c.pt, c.wallet),
    c => fx.sparks(c.layer, c.pt)
  ],
  toast: [
    c => toastRun(c, { opacity: 0, transform: "translateY(30px)" }, EO, 380),
    c => toastRun(c, { opacity: 0, transform: "scale(.6)" }, SP, 520),
    c => toastRun(c, { opacity: 0, transform: "translateY(-30px)" }, EO, 380, true),
    c => toastRun(c, { opacity: 0, transform: "translateX(120px)" }, EO, 420),
    c => { c.place(false); const el = c.el; return A(el, [{ opacity: 0, transform: "translateY(50px)" }, { opacity: 1, transform: "translateY(-8px)", offset: .6 }, { opacity: 1, transform: "none" }], { duration: 520 }).finished.then(() => sleep(1100)).then(() => A(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 240 }).finished); }
  ],
  idle: [
    c => () => {},
    c => { if (!c.btn) return () => {}; const a = c.btn.animate([{ transform: "scale(1)", boxShadow: "0 0 0 0 var(--glow,rgba(31,138,76,.5))" }, { transform: "scale(1.04)", boxShadow: "0 0 0 12px rgba(0,0,0,0)" }], { duration: 1700, iterations: Infinity, easing: "ease-in-out" }); return () => a.cancel(); },
    c => { let on = true, last = performance.now(); (function f(n) { if (!on) return; if (c.rotate) c.rotate((n - last) / 1000 * 9); last = n; requestAnimationFrame(f); })(last); return () => { on = false; }; },
    c => { const bs = c.bg ? $$("i", c.bg) : []; const as = bs.map((b, k) => b.animate([{ transform: "translate(0,0) scale(1)" }, { transform: `translate(${k % 2 ? -50 : 50}px,${k % 2 ? 36 : -36}px) scale(1.2)` }], { duration: 7000 + k * 1500, iterations: Infinity, direction: "alternate", easing: "ease-in-out" })); return () => as.forEach(a => a.cancel()); },
    c => { if (!c.hero) return () => {}; const s = document.createElement("span"); s.style.cssText = "position:absolute;top:0;bottom:0;width:35%;left:0;background:linear-gradient(100deg,transparent,rgba(255,255,255,.38),transparent);pointer-events:none"; c.hero.appendChild(s);
      const a = s.animate([{ transform: "translateX(-130%)" }, { transform: "translateX(330%)", offset: .4 }, { transform: "translateX(330%)" }], { duration: 5200, iterations: Infinity, easing: "ease-in-out" }); return () => { a.cancel(); s.remove(); }; }
  ]
};

const CATS = [
  { id: "trans", title: "Tab transitions", note: "How a screen arrives when you switch tabs.", layer: false, opts: [["Fade up", "Rises gently as it fades in"], ["Slide", "Pages slide in the direction you're heading"], ["Soft zoom", "Fades in from a slight zoom"], ["Glass dissolve", "Blurs into focus like frosted glass"], ["Depth tilt", "A subtle 3D swing into place"]] },
  { id: "btn", title: "Button press", note: "Feedback under your thumb. Equip several and they stack.", layer: true, opts: [["Squish", "Springy squash and rebound"], ["Ripple", "Water ripple from the touch point"], ["Lift & glow", "Floats up with a coloured glow"], ["Glass shine", "A light streak sweeps across"], ["Haptic wobble", "Tiny wobble plus a haptic tap"]] },
  { id: "wheel", title: "Wheel spin", note: "How the wheel slows and lands.", layer: false, opts: [["Smooth glide", "Long graceful deceleration"], ["Overshoot & settle", "Slips past and eases back"], ["Ticks + confetti", "Pointer flicks, confetti on landing"], ["Ratchet", "Clicks into place step by step"], ["Slingshot", "Winds back, then launches"]] },
  { id: "reveal", title: "Topic reveal", note: "How today's topic appears.", layer: false, opts: [["Slide up", "Card rises into place"], ["Highlight sweep", "Marker sweeps across the title"], ["Flip in", "Flips up like a card"], ["Typewriter", "Types itself out"], ["Glass bloom", "Blooms from blur with a soft glow"]] },
  { id: "ring", title: "Progress ring", note: "The % revised ring on Today.", layer: false, opts: [["Sweep", "Smooth fill"], ["Sweep + count-up", "Fills while the number counts"], ["Springy overshoot", "Fills past, then settles"], ["Fill + pulse", "Fills then gives a heartbeat"], ["Glow trail", "Fills with a glowing edge"]] },
  { id: "list", title: "Lists & cards", note: "Cards and rows arriving on screen.", layer: false, opts: [["Stagger fade-up", "One after another, rising"], ["Slide from left", "Cascade from the edge"], ["Pop in", "Springy scale-in"], ["Blur cascade", "Focus in one by one"], ["Wave from centre", "Ripples out from the middle"]] },
  { id: "sheet", title: "Bottom sheets", note: "Logging, editing, confirmations.", layer: false, opts: [["Slide up", "Classic rise"], ["Springy pop-up", "Rises with a bounce"], ["Zoom rise", "Scales up while rising"], ["iOS depth", "The page behind shrinks away"], ["Unfurl", "Unrolls from the bottom"]] },
  { id: "heat", title: "Heatmap", note: "The days-tracked grid.", layer: false, opts: [["Column wave", "Sweeps left to right"], ["Random pop", "Squares pop in randomly"], ["Ripple from today", "Radiates from today"], ["Row sweep", "Rows drop in one by one"], ["Diagonal shimmer", "A bright wave across the grid"]] },
  { id: "celeb", title: "Celebrations", note: "When you log a revision. Equip several and they play together.", layer: true, opts: [["Confetti burst", "Classic party burst"], ["Flame rise", "Streak flames float up"], ["Tick draw", "A big tick draws itself"], ["Coin shower", "Coins fly to your wallet"], ["Sparkle burst", "Stars radiate outwards"]] },
  { id: "toast", title: "Toasts", note: "The little confirmations.", layer: false, opts: [["Slide up", "Rises from the bottom"], ["Pop", "Springy pop"], ["Drop from top", "Drops in from above"], ["Side swipe", "Slides in from the right"], ["Bounce", "Overshoots and bounces"]] },
  { id: "idle", title: "Idle life", note: "What the screen does while you look at it. Equip several to stack.", layer: true, opts: [["Still", "Calm and static"], ["Breathing button", "Spin button gently pulses"], ["Wheel drift", "The wheel slowly turns"], ["Aurora drift", "Background lights float"], ["Card shimmer", "Light glides across the hero card"]] }
];
CATS.forEach(c => { c.opts = c.opts.map((o, i) => ({ id: c.id + ":" + i, i, name: o[0], desc: o[1], price: PRICES[i], tier: TIERS[i] })); c.fn = FN[c.id]; });

/* ---------- demo stages (lookbook + shop preview) ---------- */
function wedges(id) { let h = ""; for (let k = 0; k < 8; k++) { const a0 = k / 8 * 6.2832 - 1.5708, a1 = (k + 1) / 8 * 6.2832 - 1.5708; h += `<path d="M0 0L${46 * Math.cos(a0)} ${46 * Math.sin(a0)}A46 46 0 0 1 ${46 * Math.cos(a1)} ${46 * Math.sin(a1)}Z" fill="${COL[k % 6]}" fill-opacity="${k % 2 ? .35 : .55}" stroke="var(--card,#fff)" stroke-width="1.5"/>`; } return h + `<circle r="6" fill="var(--card,#fff)" stroke="var(--line,#ddd)"/><circle r="2.2" fill="var(--acc,#1f8a4c)"/>`; }
const STAGE = {
  trans: () => `<div class="m-pane" data-p="1">Today<small>73% revised</small></div><div class="m-pane" data-p="2" style="opacity:0">Topics<small>20 topics</small></div>`,
  btn: () => `<button class="m-btn">Log revision</button>`,
  wheel: () => `<div class="m-wheel"><div class="m-ptr"></div><svg viewBox="-50 -50 100 100"><g class="m-wg">${wedges()}</g></svg></div>`,
  reveal: () => `<div class="m-topic"><small>Today's topic · Chemistry</small><div><span class="m-hl">Electron configuration</span></div></div>`,
  ring: () => `<div class="m-ring"><svg viewBox="0 0 104 104" width="104" height="104"><circle cx="52" cy="52" r="42" fill="none" stroke="var(--l0)" stroke-width="10"/><circle class="m-arc" cx="52" cy="52" r="42" fill="none" stroke="var(--acc)" stroke-width="10" stroke-linecap="round" stroke-dasharray="263.9" stroke-dashoffset="263.9" transform="rotate(-90 52 52)"/></svg><b class="m-n">72%</b></div>`,
  list: () => `<div class="m-rows">${["Atoms and isotopes", "Electron configuration", "Periodic trends", "Ionic bonding"].map((t, k) => `<div><i style="background:${COL[k]}"></i>${t}</div>`).join("")}</div>`,
  sheet: () => `<div class="m-phone"><div class="m-back">Topics · Chemistry<br><span style="font-weight:400;color:var(--mute)">Atoms and isotopes<br>Electron configuration<br>Periodic trends</span></div><div class="m-scrim"></div><div class="m-sheet"><i></i>Log revision · Ionic bonding</div></div>`,
  heat: () => `<div class="m-grid"></div>`,
  celeb: () => `<button class="m-sbtn">Log revision</button><div class="m-wallet">✦ <span>120</span></div><div class="m-wallet" style="top:auto;right:auto;left:10px;bottom:10px">🔥 6 days</div>`,
  toast: () => `<div class="m-toast">Revision logged</div>`,
  idle: () => `<div class="m-aurora"><i style="left:-20px;top:-10px;width:110px;height:110px;background:#3e63dd"></i><i style="right:-20px;top:30px;width:120px;height:120px;background:#30a46c"></i><i style="left:40%;bottom:-40px;width:110px;height:110px;background:#f76b15"></i></div><div style="position:relative;display:flex;align-items:center;gap:14px"><div class="m-wheel" style="width:78px;height:78px"><div class="m-ptr" style="border-width:6px;border-top-width:11px;margin-left:-6px;top:-6px"></div><svg viewBox="-50 -50 100 100"><g class="m-wg">${wedges()}</g></svg></div><div style="display:grid;gap:10px"><div class="m-hero" style="width:130px;height:58px;padding:9px;font-size:16px">72%<small>revised</small></div><button class="m-sbtn" style="padding:9px 14px;font-size:12px">Spin the wheel</button></div></div>`
};
function initStage(cat, st, i) {
  const id = cat.id;
  if (id === "btn") $(".m-btn", st).addEventListener("pointerdown", e => cat.fn[i]({ el: $(".m-btn", st), pt: { x: e.clientX, y: e.clientY } }));
  if (id === "heat") { let h = ""; for (let c = 0; c < 15; c++) for (let r = 0; r < 7; r++) { const v = (c * 7 + r * 3 + (c * r) % 5) % 9, l = v < 4 ? 0 : v < 6 ? 1 : v < 8 ? 2 : v === 8 ? 3 : 4; h += `<i style="grid-column:${c + 1};grid-row:${r + 1};background:var(--l${l})"></i>`; } $(".m-grid", st).innerHTML = h; }
}
function demoCtx(cat, st) {
  switch (cat.id) {
    case "trans": { st._f = !st._f; const a = $(st._f ? '[data-p="1"]' : '[data-p="2"]', st), b = $(st._f ? '[data-p="2"]' : '[data-p="1"]', st); return { a, b, dir: st._f ? 1 : -1 }; }
    case "btn": return { el: $(".m-btn", st), pt: null };
    case "wheel": { const gg = $(".m-wg", st), ptr = $(".m-ptr", st), idx = Math.floor(Math.random() * 8), cur = st._cur || 0, base = Math.ceil(cur / 360) * 360, to = base + 1800 + ((360 - (idx + .5) * 45) % 360);
      return { from: cur, to, slice: 45, layer: st, pt: null, set: a => { gg.style.transform = `rotate(${a}deg)`; }, flick: () => ptr.animate([{ transform: "rotate(-24deg)" }, { transform: "rotate(0)" }], { duration: 140 }) }; }
    case "reveal": { const t = $(".m-topic div", st); t.innerHTML = '<span class="m-hl">Electron configuration</span>'; delete t.dataset.full; return { card: $(".m-topic", st), title: t }; }
    case "ring": return { arc: $(".m-arc", st), label: $(".m-n", st), pct: 72, C: 263.9 };
    case "list": return { items: $$(".m-rows div", st) };
    case "sheet": return { sheet: $(".m-sheet", st), scrim: $(".m-scrim", st), back: $(".m-back", st) };
    case "heat": return { cells: $$(".m-grid i", st).map(el => ({ el, col: +el.style.gridColumn.split(" ")[0] - 1, row: +el.style.gridRow.split(" ")[0] - 1 })), cols: 15, todayRow: 6 };
    case "celeb": { const b = $(".m-sbtn", st).getBoundingClientRect(); return { layer: st, pt: { x: b.left + b.width / 2, y: b.top + b.height / 2 }, wallet: $(".m-wallet", st), target: $(".m-wallet:last-child", st) }; }
    case "toast": { const el = $(".m-toast", st); return { el, place: top => { el.style.top = top ? "14px" : "auto"; el.style.bottom = top ? "auto" : "14px"; } }; }
    case "idle": { const gg = $(".m-wg", st); st._rot = st._rot || 0; return { btn: $(".m-sbtn", st), hero: $(".m-hero", st), bg: $(".m-aurora", st), rotate: d => { st._rot += d; gg.style.transform = `rotate(${st._rot}deg)`; } }; }
  }
}
async function demoPlay(cat, st, i) {
  if (cat.id === "wheel") { if (st._busy) return; st._busy = true; const c = demoCtx(cat, st); await cat.fn[i](c); st._cur = c.to; st._busy = false; return; }
  if (cat.id === "idle") { if (st._stop) st._stop(); st.getAnimations && $$("*", st).forEach(e => e.getAnimations().forEach(a => a.cancel())); st._stop = cat.fn[i](demoCtx(cat, st)); return; }
  if (cat.id === "sheet") { const c = demoCtx(cat, st); cat.fn[i](c); await sleep(1700); fade(c.scrim, 1, 0, { duration: 240 }); if (i === 3 && c.back) A(c.back, [{ transform: "scale(.94) translateY(8px)", filter: "brightness(.85)" }, { transform: "none", filter: "brightness(1)" }], { duration: 260 }); A(c.sheet, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(100%)" }], { duration: 260, easing: "ease-in" }); return; }
  return cat.fn[i](demoCtx(cat, st));
}
function sheetOut(c, depth) {
  fade(c.scrim, 1, 0, { duration: 220 }); if (depth && c.back) A(c.back, [{ transform: "scale(.94) translateY(8px)", filter: "brightness(.85)" }, { transform: "none", filter: "brightness(1)" }], { duration: 240 });
  return A(c.sheet, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(100%)" }], { duration: 240, easing: "ease-in" }).finished;
}

g.MOTION = { cats: CATS, byId: id => CATS.find(c => c.id === id), stage: (cat) => STAGE[cat.id](), initStage, demoPlay, sheetOut, fx, haptic, sleep, PRICES, TIERS,
  RM: () => !!(g.matchMedia && g.matchMedia("(prefers-reduced-motion: reduce)").matches) };
})(window);
