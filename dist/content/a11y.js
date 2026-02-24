const LANDMARK_ROLES = new Set(['banner', 'main', 'navigation', 'contentinfo', 'complementary', 'region', 'search', 'form']);
function isHidden(el) {
    const htmlEl = el;
    if (htmlEl.hidden)
        return true;
    if (el.getAttribute('aria-hidden') === 'true')
        return true;
    const style = window.getComputedStyle(htmlEl);
    return style.display === 'none' || style.visibility === 'hidden';
}
function shortPath(el) {
    const id = el.id ? `#${el.id}` : '';
    const className = el.classList.length ? `.${el.classList[0]}` : '';
    return `${el.tagName.toLowerCase()}${id}${className}`;
}
function textFromIds(ids) {
    if (!ids)
        return '';
    return ids
        .split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent?.trim() || '')
        .filter(Boolean)
        .join(' ');
}
function getRole(el) {
    const explicitRole = el.getAttribute('role');
    if (explicitRole) {
        return { role: explicitRole, source: 'explicit' };
    }
    const tag = el.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag))
        return { role: 'heading', source: 'implicit', headingLevel: Number(tag[1]) };
    if (tag === 'a' && el.href)
        return { role: 'link', source: 'implicit' };
    if (tag === 'button')
        return { role: 'button', source: 'implicit' };
    if (tag === 'textarea')
        return { role: 'textbox', source: 'implicit' };
    if (tag === 'select')
        return { role: 'combobox', source: 'implicit' };
    if (tag === 'img')
        return { role: 'img', source: 'implicit' };
    if (tag === 'nav')
        return { role: 'navigation', source: 'implicit' };
    if (tag === 'main')
        return { role: 'main', source: 'implicit' };
    if (tag === 'header')
        return { role: 'banner', source: 'implicit' };
    if (tag === 'footer')
        return { role: 'contentinfo', source: 'implicit' };
    if (tag === 'aside')
        return { role: 'complementary', source: 'implicit' };
    if (tag === 'input') {
        const input = el;
        const type = input.type || 'text';
        if (['checkbox'].includes(type))
            return { role: 'checkbox', source: 'implicit' };
        if (['radio'].includes(type))
            return { role: 'radio', source: 'implicit' };
        if (['button', 'submit', 'reset'].includes(type))
            return { role: 'button', source: 'implicit' };
        return { role: 'textbox', source: 'implicit' };
    }
    return { role: 'generic', source: 'implicit' };
}
function getName(el) {
    const ariaLabel = el.getAttribute('aria-label')?.trim();
    if (ariaLabel)
        return { name: ariaLabel, source: 'aria-label' };
    const ariaLabelledBy = textFromIds(el.getAttribute('aria-labelledby'));
    if (ariaLabelledBy)
        return { name: ariaLabelledBy, source: 'aria-labelledby' };
    if (el.id) {
        const label = document.querySelector(`label[for="${el.id}"]`)?.textContent?.trim();
        if (label)
            return { name: label, source: 'label[for]' };
    }
    if (el.tagName.toLowerCase() === 'img') {
        const alt = el.alt?.trim();
        if (alt)
            return { name: alt, source: 'alt' };
    }
    const labelWrap = el.closest('label')?.textContent?.trim();
    if (labelWrap)
        return { name: labelWrap, source: 'label-wrap' };
    const text = el.textContent?.trim();
    if (text)
        return { name: text.slice(0, 120), source: 'text' };
    const title = el.getAttribute('title')?.trim();
    if (title)
        return { name: title, source: 'title' };
    return { name: '', source: 'unknown' };
}
function getStates(el) {
    const htmlEl = el;
    const states = {};
    states.disabled = htmlEl.matches(':disabled') || el.getAttribute('aria-disabled') === 'true';
    states.required = htmlEl.matches(':required') || el.getAttribute('aria-required') === 'true';
    states.invalid = htmlEl.matches(':invalid') || el.getAttribute('aria-invalid') === 'true';
    states.expanded = el.getAttribute('aria-expanded') === 'true' ? true : el.getAttribute('aria-expanded') === 'false' ? false : undefined;
    states.pressed = el.getAttribute('aria-pressed') === 'true' ? true : el.getAttribute('aria-pressed') === 'false' ? false : undefined;
    if (el instanceof HTMLInputElement) {
        if (el.type === 'checkbox' || el.type === 'radio')
            states.checked = el.checked;
    }
    if (el instanceof HTMLOptionElement)
        states.selected = el.selected;
    return states;
}
function getValueText(el) {
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)
        return el.value || undefined;
    if (el instanceof HTMLSelectElement)
        return el.selectedOptions[0]?.text || undefined;
    return undefined;
}
function getDescription(el) {
    const describedBy = textFromIds(el.getAttribute('aria-describedby'));
    if (describedBy)
        return { text: describedBy, source: 'aria-describedby' };
    const title = el.getAttribute('title');
    if (title)
        return { text: title, source: 'title' };
    return { source: 'unknown' };
}
function isNavigable(el) {
    if (isHidden(el))
        return false;
    const { role } = getRole(el);
    const tag = el.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag))
        return true;
    if (tag === 'a' && el.href)
        return true;
    if (tag === 'button')
        return true;
    if (tag === 'img' && Boolean(el.alt))
        return true;
    if (tag === 'input' || tag === 'textarea' || tag === 'select')
        return true;
    if (['nav', 'main', 'header', 'footer', 'aside'].includes(tag))
        return true;
    if (LANDMARK_ROLES.has(role))
        return true;
    return false;
}
function categoryFor(el, role) {
    const tag = el.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag) || role === 'heading')
        return 'heading';
    if (role === 'link')
        return 'link';
    if (role === 'button')
        return 'button';
    if (['input', 'textarea', 'select'].includes(tag) || ['textbox', 'combobox', 'checkbox', 'radio'].includes(role))
        return 'field';
    if (LANDMARK_ROLES.has(role))
        return 'landmark';
    if (role === 'img')
        return 'image';
    return 'other';
}
export function getCursorTargets(root = document) {
    const candidates = Array.from(root.querySelectorAll('*'));
    return candidates
        .filter(isNavigable)
        .map((el, index) => {
        const roleInfo = getRole(el);
        const nameInfo = getName(el);
        const description = getDescription(el);
        const valueText = getValueText(el);
        const rect = el.getBoundingClientRect();
        return {
            id: `target-${index}`,
            element: el,
            domPathShort: shortPath(el),
            tagName: el.tagName.toLowerCase(),
            role: roleInfo.role,
            name: nameInfo.name,
            states: getStates(el),
            valueText,
            contextText: roleInfo.headingLevel ? `Heading level ${roleInfo.headingLevel}` : undefined,
            descriptionText: description.text,
            debug: {
                nameSource: nameInfo.source,
                roleSource: roleInfo.source,
                descriptionSource: description.source
            },
            boundingRect: rect,
            headingLevel: roleInfo.headingLevel,
            category: categoryFor(el, roleInfo.role)
        };
    });
}
export function computeAnnouncement(target, reason) {
    const states = Object.entries(target.states)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => (typeof value === 'boolean' ? (value ? key : `not ${key}`) : `${key} ${value}`));
    const parts = [
        target.name,
        target.role,
        target.contextText,
        states.join(', '),
        target.valueText,
        target.descriptionText
    ].filter(Boolean);
    return {
        spokenText: parts.join('. '),
        reason,
        roleText: target.role,
        nameText: target.name,
        stateText: states.join(', '),
        valueText: target.valueText,
        contextText: target.contextText,
        debug: {
            nameSource: target.debug.nameSource,
            roleSource: target.debug.roleSource,
            descriptionText: target.descriptionText,
            descriptionSource: target.debug.descriptionSource
        }
    };
}
export function shouldAutoFocusMode(target) {
    const el = target.element;
    if (el.isContentEditable)
        return true;
    return ['textbox', 'combobox', 'listbox', 'spinbutton', 'slider'].includes(target.role);
}
