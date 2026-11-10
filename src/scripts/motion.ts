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
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  // smooth in-page anchor links
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null;
    if (!a || !lenis) return;
    const el = document.querySelector(a.getAttribute('href')!);
    if (el) { e.preventDefault(); lenis.scrollTo(el as HTMLElement, { offset: -80 }); }
  });
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
    ScrollTrigger.refresh();
  } catch (err) {
    console.error(err);
    document.documentElement.classList.remove('js-motion');
  }

  // 3D constellation loads after the page is visible so it never delays first paint
  const canvas = document.querySelector<HTMLCanvasElement>('#constellation');
  if (canvas) {
    const idle = (cb: () => void) => ('requestIdleCallback' in window ? (window as any).requestIdleCallback(cb, { timeout: 1200 }) : setTimeout(cb, 300));
    idle(async () => {
      try {
        const { mountConstellation } = await import('./constellation');
        disposeHero = mountConstellation(canvas);
      } catch (err) { console.error(err); }
    });
  }
}
