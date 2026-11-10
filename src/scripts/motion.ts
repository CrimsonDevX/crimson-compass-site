// All site motion lives here. Runs on every page load, including after view transitions.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;
let disposeHero: (() => void) | null = null;

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function startLenis() {
  if (lenis || reduced()) return;
  lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  (window as any).__lenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  // smooth in-page anchor links
  // Capture phase so this runs before Astro's router; otherwise the router jumps
  // natively and Lenis snaps the page back to where it was.
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest('a[href*="#"]') as HTMLAnchorElement | null;
    if (!a || !lenis || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || !url.hash) return; // other pages: let the router handle it
    const el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    history.pushState(history.state, '', url.hash);
    const target = el.querySelector<HTMLElement>('.sec-head') ?? el;
    lenis.scrollTo(target, { offset: -110, duration: 1.2 });
  }, true);
}

function logoIntro(svg: SVGSVGElement) {
  const arcs = svg.querySelectorAll<SVGPathElement>('.cc-arc');
  const star = svg.querySelector('.cc-star');
  const spark = svg.querySelector('.cc-spark');
  gsap.set([star, spark], { transformOrigin: '50% 50%' });
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.fromTo(arcs, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.4, stagger: 0.18, ease: 'power2.inOut' })
    .fromTo(star, { scale: 0.2, rotate: -135, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: 1.3, ease: 'expo.out' }, 0.35)
    .fromTo(spark, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(3)' }, 1.15);
  // gentle twinkle forever after
  gsap.to(spark, { scale: 0.7, opacity: 0.6, rotate: 45, duration: 1.6, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 2 });
}

function reveals() {
  // hero copy animates in right away; everything else waits for scroll
  gsap.utils.toArray<HTMLElement>('.hero [data-reveal]').forEach((el) => {
    gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.5 + Number(el.dataset.revealDelay || 0) });
  });
  gsap.utils.toArray<HTMLElement>('[data-reveal]').filter((el) => !el.closest('.hero')).forEach((el) => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
      delay: Number(el.dataset.revealDelay || 0),
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });
  // number count-up for stat tiles
  gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count);
    const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
    const obj = { v: 0 };
    gsap.to(obj, {
      v: end, duration: 1.6, ease: 'power2.out',
      onUpdate: () => (el.textContent = (el.dataset.prefix || '') + fmt(obj.v) + (el.dataset.suffix || '')),
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });
  // the retrieval pipeline steps light up in order as you scroll past
  const steps = gsap.utils.toArray<HTMLElement>('.pipeline li');
  if (steps.length) {
    ScrollTrigger.create({
      trigger: '.pipeline', start: 'top 75%', end: 'bottom 45%', scrub: true,
      onUpdate: (self) => {
        const lit = Math.ceil(self.progress * steps.length);
        steps.forEach((s, i) => s.classList.toggle('lit', i < lit));
      },
    });
  }
}

// hero: parallax background, twinkling sparkles, floating portrait
function heroLife(): (() => void) | null {
  const hero = document.querySelector<HTMLElement>('.hero');
  if (!hero) return null;
  const bg = hero.querySelector<HTMLElement>('.hero-bg');
  const frame = hero.querySelector<HTMLElement>('.portrait .frame');

  gsap.utils.toArray<SVGElement>('.sparkle').forEach((el) => {
    const loop = () => {
      gsap.timeline({ onComplete: loop, delay: gsap.utils.random(0.2, 3.5) })
        .to(el, { opacity: 1, scale: gsap.utils.random(0.8, 1.25), rotate: '+=45', duration: 0.7, ease: 'power2.out' })
        .to(el, { opacity: 0, scale: 0.4, duration: 1.1, ease: 'power2.in' });
    };
    loop();
  });

  if (bg) {
    gsap.to(bg, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  }
  // portrait: reveals with a wipe, then tilts toward the cursor with a soft light glare
  let onTilt: ((e: PointerEvent) => void) | null = null;
  let onLeave: (() => void) | null = null;
  const portrait = hero.querySelector<HTMLElement>('.portrait');
  if (frame && portrait && matchMedia('(hover: hover)').matches) {
    gsap.fromTo(frame, { clipPath: 'inset(100% 0 0 0 round 26px)' }, { clipPath: 'inset(0% 0 0 0 round 26px)', duration: 1.3, ease: 'expo.out', delay: 0.5 });
    const rx = gsap.quickTo(frame, 'rotationX', { duration: 0.6, ease: 'power3.out' });
    const ry = gsap.quickTo(frame, 'rotationY', { duration: 0.6, ease: 'power3.out' });
    onTilt = (e) => {
      const r = frame.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      ry((px - 0.5) * 10); rx((0.5 - py) * 8);
      frame.style.setProperty('--gx', `${px * 100}%`);
      frame.style.setProperty('--gy', `${py * 100}%`);
    };
    onLeave = () => { rx(0); ry(0); };
    portrait.addEventListener('pointermove', onTilt);
    portrait.addEventListener('pointerleave', onLeave);
  }

  const xTo = bg ? gsap.quickTo(bg, 'x', { duration: 1.2, ease: 'power3.out' }) : null;
  const onMove = (e: PointerEvent) => xTo?.((e.clientX / innerWidth - 0.5) * -24);
  window.addEventListener('pointermove', onMove, { passive: true });
  return () => {
    window.removeEventListener('pointermove', onMove);
    if (portrait && onTilt) portrait.removeEventListener('pointermove', onTilt);
    if (portrait && onLeave) portrait.removeEventListener('pointerleave', onLeave);
  };
}

// background layer: drifting graticule, moving glows, twinkling nodes, progress bar
let ambientTwinkle = false;
function ambientLife() {
  const page = { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 1.2 };
  gsap.to('.progress span', { scaleX: 1, ease: 'none', scrollTrigger: { ...page, scrub: true } });
  gsap.fromTo('.graticule', { yPercent: 0, rotate: 0 }, { yPercent: -8, rotate: 6, ease: 'none', scrollTrigger: page });
  gsap.fromTo('.g1', { y: 0, x: 0 }, { y: -500, x: 160, ease: 'none', scrollTrigger: page });
  gsap.fromTo('.g2', { y: 0, x: 0 }, { y: 700, x: -260, ease: 'none', scrollTrigger: page });
  gsap.fromTo('.g3', { y: 0 }, { y: -600, ease: 'none', scrollTrigger: page });
  if (!ambientTwinkle) {
    ambientTwinkle = true;
    gsap.utils.toArray<SVGCircleElement>('.ambient .node').forEach((n) => {
      gsap.to(n, { opacity: 0.9, duration: gsap.utils.random(1.4, 2.6), repeat: -1, yoyo: true, ease: 'sine.inOut', delay: gsap.utils.random(0, 3) });
    });
  }
}

// section headings: the number badge pops and a gold rule draws under the title
function sectionHeads() {
  gsap.utils.toArray<HTMLElement>('.sec-head').forEach((h) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: h, start: 'top 85%', once: true } });
    tl.fromTo(h.querySelector('.bearing'), { scale: 0, rotate: -90 }, { scale: 1, rotate: 0, duration: 0.7, ease: 'back.out(2.2)' })
      .fromTo(h.querySelector('.rule'), { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: 'power3.inOut' }, 0.15);
  });
}

// highlight the nav link for the section on screen
function scrollSpy() {
  const links = [...document.querySelectorAll<HTMLAnchorElement>('.links a[href*="#"]')];
  links.forEach((l) => l.classList.remove('active'));
  links.forEach((link) => {
    const id = link.getAttribute('href')!.split('#')[1];
    const section = document.getElementById(id);
    if (!section) return;
    ScrollTrigger.create({
      trigger: section, start: 'top 45%', end: 'bottom 45%',
      onToggle: (self) => link.classList.toggle('active', self.isActive),
    });
  });
}

export async function initMotion() {
  ScrollTrigger.getAll().forEach((t) => t.kill());
  disposeHero?.(); disposeHero = null;
  document.documentElement.classList.add('motion-on');

  if (reduced()) return;
  try {
    startLenis();
    const heroLogo = document.querySelector<SVGSVGElement>('.hero-mark .cc-logo');
    if (heroLogo) logoIntro(heroLogo);
    reveals();
    disposeHero = heroLife();
    scrollSpy();
    ambientLife();
    sectionHeads();
    ScrollTrigger.refresh();
  } catch (err) {
    console.error(err);
    document.documentElement.classList.remove('js-motion');
  }
}
