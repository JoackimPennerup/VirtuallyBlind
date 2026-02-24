export function orderedTargets(targets) {
    return [...targets].sort((a, b) => {
        if (a.element === b.element)
            return 0;
        const pos = a.element.compareDocumentPosition(b.element);
        if (pos & Node.DOCUMENT_POSITION_FOLLOWING)
            return -1;
        if (pos & Node.DOCUMENT_POSITION_PRECEDING)
            return 1;
        return 0;
    });
}
export function nextIndex(current, size, delta, wrap) {
    if (size === 0)
        return -1;
    const candidate = current + delta;
    if (candidate >= 0 && candidate < size)
        return candidate;
    if (!wrap)
        return current;
    return candidate < 0 ? size - 1 : 0;
}
export function findQuickNavIndex(targets, currentIndex, category, direction, wrap) {
    if (!targets.length)
        return -1;
    let cursor = currentIndex;
    const visited = new Set();
    while (true) {
        cursor = nextIndex(cursor, targets.length, direction, wrap);
        if (cursor === currentIndex || visited.has(cursor))
            return currentIndex;
        visited.add(cursor);
        if (targets[cursor].category === category)
            return cursor;
    }
}
