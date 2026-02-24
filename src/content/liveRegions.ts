import { SimulationEngine } from './engine';

export function setupLiveRegions(engine: SimulationEngine): MutationObserver {
  let timer: number | undefined;
  const queue: Array<{ text: string; assertive: boolean }> = [];

  const flush = () => {
    const items = queue.splice(0);
    for (const item of items) {
      engine.announceLiveRegion(item.text, item.assertive);
    }
  };

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const target = mutation.target instanceof Element ? mutation.target : mutation.target.parentElement;
      if (!target) continue;
      const liveNode = target.closest('[aria-live]');
      if (!liveNode) continue;
      const politeness = liveNode.getAttribute('aria-live') || 'polite';
      const text = liveNode.textContent?.trim();
      if (!text) continue;
      queue.push({ text, assertive: politeness === 'assertive' });
    }
    window.clearTimeout(timer);
    timer = window.setTimeout(flush, 120);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });

  return observer;
}
