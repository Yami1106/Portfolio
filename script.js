document.documentElement.classList.add("js");

// ---------- Helpers ----------
const $ = (q, el = document) => el.querySelector(q);
const $$ = (q, el = document) => [...el.querySelectorAll(q)];
const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- Header height CSS var (for proper spacing + anchor offset) ----------
const topbar = $("#topbar");
function setHeaderHeightVar() {
  if (!topbar) return;
  document.documentElement.style.setProperty("--header-h", topbar.offsetHeight + "px");
}
window.addEventListener("load", setHeaderHeightVar);
window.addEventListener("resize", setHeaderHeightVar);

// Add "scrolled" class so nav looks strong on all sections
function onScrollHeader() {
  if (!topbar) return;
  topbar.classList.toggle("scrolled", window.scrollY > 8);
}
window.addEventListener("scroll", onScrollHeader, { passive: true });
onScrollHeader();

// ---------- Mobile nav ----------
const navToggle = $("#navToggle");
const navMenu = $("#navMenu");

navToggle?.addEventListener("click", () => {
  const open = navMenu.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(open));
});

$$(".nav-link").forEach(a => {
  a.addEventListener("click", () => {
    navMenu.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");
  });
});

// ---------- Theme toggle - FIXED ----------
const themeToggle = $("#themeToggle");
const storedTheme = localStorage.getItem("theme");

// Initialize theme from localStorage or default to dark
if (storedTheme) {
  document.documentElement.setAttribute("data-theme", storedTheme);
} else {
  document.documentElement.setAttribute("data-theme", "dark");
}

function updateThemeButton() {
  const theme = document.documentElement.getAttribute("data-theme") || "dark";
  themeToggle?.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
  const icon = theme === "light" ? "☀" : "☾";
  const iconElement = $(".pill-icon", themeToggle);
  if (iconElement) {
    iconElement.textContent = icon;
  }
}
updateThemeButton();

themeToggle?.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  const next = current === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
  updateThemeButton();
});

// ---------- Reveal on scroll ----------
const revealEls = $$(".reveal");
if (!prefersReducedMotion()) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add("in");
    });
  }, { threshold: 0.12 });

  revealEls.forEach(el => io.observe(el));
} else {
  revealEls.forEach(el => el.classList.add("in"));
}

// ---------- Typewriter ----------
const typeTarget = $("#typeTarget");
if (typeTarget) {
  const words = (typeTarget.dataset.words || "").split(",").map(s => s.trim()).filter(Boolean);
  
  let w = 0, i = 0, deleting = false;

  function tick() {
    if (!words.length) return;

    const word = words[w];
    if (!deleting) {
      i++;
      typeTarget.textContent = word.slice(0, i);
      if (i >= word.length) {
        deleting = true;
        setTimeout(tick, 2000);
        return;
      }
    } else {
      i--;
      typeTarget.textContent = word.slice(0, i);
      if (i <= 0) {
        deleting = false;
        w = (w + 1) % words.length;
      }
    }

    setTimeout(tick, deleting ? 50 : 100);
  }
  
  tick();
}

// ---------- Count up metrics ----------
function animateCount(el, to) {
  const from = 0;
  const dur = 900;
  const start = performance.now();

  function step(t) {
    const p = Math.min(1, (t - start) / dur);
    const val = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)));
    el.textContent = String(val);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const metricEls = $$(".metric-k[data-count]");
if (!prefersReducedMotion()) {
  const mio = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const to = Number(el.getAttribute("data-count") || "0");
      if (!el.dataset.ran) {
        el.dataset.ran = "1";
        animateCount(el, to);
      }
    });
  }, { threshold: 0.5 });

  metricEls.forEach(el => mio.observe(el));
} else {
  metricEls.forEach(el => el.textContent = el.getAttribute("data-count"));
}

// ---------- Smooth scroll with header offset ----------
const navLinks = $$(".nav-link");
navLinks.forEach(link => {
  link.addEventListener("click", (e) => {
    const href = link.getAttribute("href");
    if (!href || !href.startsWith("#")) return;

    const target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();

    const headerH = topbar ? topbar.getBoundingClientRect().height : 0;
    const y = target.getBoundingClientRect().top + window.scrollY - headerH - 18;
    window.scrollTo({ top: y, behavior: "smooth" });
  });
});

// ---------- Scrollspy + moving nav indicator ----------
const navIndicator = $("#navIndicator");
const sections = navLinks
  .map(a => document.querySelector(a.getAttribute("href")))
  .filter(Boolean);

function moveIndicatorTo(el) {
  if (!navIndicator || !el || !navMenu) return;

  const menuRect = navMenu.getBoundingClientRect();
  const r = el.getBoundingClientRect();

  navIndicator.style.left = (r.left - menuRect.left) + "px";
  navIndicator.style.top = (r.top - menuRect.top) + "px";
  navIndicator.style.width = r.width + "px";
  navIndicator.style.height = r.height + "px";
  navIndicator.style.opacity = "1";
}

function setActiveLink(id) {
  const active = navLinks.find(a => a.getAttribute("href") === "#" + id);
  if (!active) return;

  navLinks.forEach(a => a.classList.remove("active"));
  active.classList.add("active");
  moveIndicatorTo(active);
}

if (sections.length) {
  const spy = new IntersectionObserver((entries) => {
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible?.target?.id) setActiveLink(visible.target.id);
  }, { threshold: [0.25, 0.4, 0.55, 0.7] });

  sections.forEach(sec => spy.observe(sec));

  window.addEventListener("load", () => {
    setTimeout(() => {
      const first = navLinks[0];
      if (first) moveIndicatorTo(first);
    }, 50);
  });

  window.addEventListener("resize", () => {
    const active = $(".nav-link.active");
    if (active) moveIndicatorTo(active);
  });
}

// ---------- Project filtering ----------
const filters = $$(".filter");
const projectCards = $$(".cardx");
filters.forEach(btn => {
  btn.addEventListener("click", () => {
    filters.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const f = btn.dataset.filter;
    projectCards.forEach(card => {
      const tags = (card.dataset.tags || "").split(" ");
      const show = f === "all" || tags.includes(f);
      card.style.display = show ? "" : "none";
    });
  });
});

// ---------- Modal ----------
const modal = $("#modal");
const modalTitle = $("#modalTitle");
const modalBody = $("#modalBody");
const modalClose = $("#modalClose");

function openModal(title, body) {
  modalTitle.textContent = title || "Details";
  modalBody.textContent = body || "";
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

$$(".openModal").forEach(btn => {
  btn.addEventListener("click", () => openModal(btn.dataset.title, btn.dataset.body));
});

modalClose?.addEventListener("click", closeModal);
modal?.addEventListener("click", (e) => {
  if (e.target?.dataset?.close === "true") closeModal();
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.classList.contains("show")) closeModal();
});

// ---------- Contact form demo ----------
const toast = $("#toast");
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 2400);
}

$("#contactForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  showToast("Message captured! This is a demo form. Email integration coming soon.");
  e.target.reset();
});

// ---------- Footer year ----------
$("#year").textContent = String(new Date().getFullYear());

// ---------- Starfield ----------
const canvas = $("#stars");
const ctx = canvas.getContext("2d", { alpha: true });

let W = 0, H = 0, DPR = Math.min(2, window.devicePixelRatio || 1);
let stars = [];

function resize() {
  W = Math.floor(window.innerWidth);
  H = Math.floor(window.innerHeight);
  DPR = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(W * DPR);
  canvas.height = Math.floor(H * DPR);
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  const count = Math.floor((W * H) / 14000);
  stars = new Array(count).fill(0).map(() => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 1.6 + 0.2,
    a: Math.random() * 0.75 + 0.15,
    vx: (Math.random() - 0.5) * 0.15,
    vy: (Math.random() - 0.5) * 0.15,
  }));
}
resize();
window.addEventListener("resize", resize);

let mx = W / 2, my = H / 2;
window.addEventListener("pointermove", (e) => { mx = e.clientX; my = e.clientY; });

function draw() {
  ctx.clearRect(0, 0, W, H);

  const g = ctx.createRadialGradient(W*0.5, H*0.35, 0, W*0.5, H*0.5, Math.max(W,H)*0.75);
  g.addColorStop(0, "rgba(255,255,255,0.02)");
  g.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const px = (mx / W - 0.5) * 10;
  const py = (my / H - 0.5) * 10;

  for (const s of stars) {
    s.x += s.vx;
    s.y += s.vy;
    if (s.x < -20) s.x = W + 20;
    if (s.x > W + 20) s.x = -20;
    if (s.y < -20) s.y = H + 20;
    if (s.y > H + 20) s.y = -20;

    ctx.beginPath();
    ctx.fillStyle = `rgba(255,255,255,${s.a})`;
    ctx.arc(s.x + px, s.y + py, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  requestAnimationFrame(draw);
}
if (!prefersReducedMotion()) draw();