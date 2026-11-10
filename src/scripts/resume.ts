import { gsap } from 'gsap';

const modal = () => document.querySelector<HTMLDialogElement>('.resume-modal');
const smallScreen = () => matchMedia('(max-width: 700px), (hover: none) and (pointer: coarse)').matches;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function openResume() {
  const dlg = modal();
  if (!dlg) return;
  const pdf = dlg.dataset.pdf!;
  if (smallScreen()) { window.open(pdf, '_blank', 'noopener'); return; } // phones: new tab, page stays put

  const frame = dlg.querySelector('iframe')!;
  if (!frame.src) frame.src = `${pdf}#view=FitH&toolbar=0`;
  dlg.showModal();
  (window as any).__lenis?.stop();
  if (!reduced()) {
    gsap.fromTo(dlg.querySelector('.sheet'), { y: 40, scale: 0.96, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.55, ease: 'expo.out' });
  }
  dlg.addEventListener('close', () => (window as any).__lenis?.start(), { once: true });
}

export function closeResume() {
  const dlg = modal();
  if (!dlg?.open) return;
  if (reduced()) return dlg.close();
  gsap.to(dlg.querySelector('.sheet'), { y: 24, scale: 0.97, opacity: 0, duration: 0.25, ease: 'power2.in', onComplete: () => dlg.close() });
}
