// Original artwork is fetched when visible. Only its existing three line frames
// change: no character, pose, or scene is translated or redrawn.
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const art = [...document.querySelectorAll<HTMLElement>('[data-publisher-art]')];
const active = new Set<HTMLElement>();
const cache = new Map<string, Promise<string>>();
let frame = 0;
let timer: number | undefined;
function syncWordmark(node: HTMLElement) {
  if(node.classList.contains('brand-scene')) {
    const brand = node.closest<HTMLElement>('.brand');
    if(brand) brand.dataset.brandFrame = node.dataset.artFrame;
  }
}
function updateMotion() {
  if (timer) window.clearInterval(timer);
  timer = undefined;
  if (reduced.matches || document.hidden || !active.size) return;
  timer = window.setInterval(() => {
    frame = (frame + 1) % 3;
    active.forEach(node => { node.dataset.artFrame = String(frame); syncWordmark(node); });
  }, 180);
}
async function load(node: HTMLElement) {
  if (node.dataset.artLoaded) return;
  node.dataset.artLoaded = 'loading';
  const source = `/images/wind-story/live/${node.dataset.artName}.svg`;
  try {
    if (!cache.has(source)) cache.set(source, fetch(source).then(response => {
      if (!response.ok) throw new Error('Drawing unavailable');
      return response.text();
    }));
    const template = document.createElement('template');
    template.innerHTML = (await cache.get(source))!;
    const svg = template.content.querySelector('svg');
    if (!svg) throw new Error('Drawing unavailable');
    if (node.dataset.artCrop) svg.setAttribute('viewBox', node.dataset.artCrop);
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('aria-hidden', 'true');
    node.replaceChildren(svg);
    node.dataset.artLoaded = 'true';
    node.dataset.artFrame = reduced.matches ? 'static' : String(frame); syncWordmark(node);
  } catch {
    // The original lightweight image remains if a drawing cannot load.
    delete node.dataset.artLoaded;
    cache.delete(source);
  }
}
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    const node = entry.target as HTMLElement;
    if (entry.isIntersecting) { active.add(node); void load(node); }
    else active.delete(node);
  });
  updateMotion();
}, { rootMargin: '40px', threshold: 0.02 });
art.forEach(node => observer.observe(node));
reduced.addEventListener('change', () => {
  art.forEach(node => { node.dataset.artFrame = reduced.matches ? 'static' : String(frame); syncWordmark(node); });
  updateMotion();
});
document.addEventListener('visibilitychange', updateMotion);
