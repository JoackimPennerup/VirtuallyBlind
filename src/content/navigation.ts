import type { CursorTarget } from '../shared/types';

export type QuickNavCategory = 'heading' | 'link' | 'button' | 'field' | 'landmark';

export function orderedTargets(targets: CursorTarget[]): CursorTarget[] {
  return [...targets].sort((a, b) => {
    if (a.element === b.element) return 0;
    const pos = a.element.compareDocumentPosition(b.element);
    if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  });
}

export function nextIndex(current: number, size: number, delta: 1 | -1, wrap: boolean): number {
  if (size === 0) return -1;
  const candidate = current + delta;
  if (candidate >= 0 && candidate < size) return candidate;
  if (!wrap) return current;
  return candidate < 0 ? size - 1 : 0;
}

export function findQuickNavIndex(
  targets: CursorTarget[],
  currentIndex: number,
  category: QuickNavCategory,
  direction: 1 | -1,
  wrap: boolean
): number {
  if (!targets.length) return -1;
  let cursor = currentIndex;
  const visited = new Set<number>();

  while (true) {
    cursor = nextIndex(cursor, targets.length, direction, wrap);
    if (cursor === currentIndex || visited.has(cursor)) return currentIndex;
    visited.add(cursor);
    if (targets[cursor].category === category) return cursor;
  }
}
