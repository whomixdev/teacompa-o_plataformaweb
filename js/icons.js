const shapes = {
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    pin: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    near: '<path d="m21 3-7 18-3-8-8-3Z"/>', calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v5m10-5v5M3 11h18m-13 5h2m2 0h2"/>',
    center: '<path d="M3 21h18M5 21V6l7-3 7 3v15m-9 0v-4h4v4m-2-13v5m-2.5-2.5h5"/>',
    list: '<rect x="5" y="5" width="14" height="16" rx="2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m8 12 1 1 2-2m2 1h3m-8 5h8"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4.2 1.85c-1.1.8-1.7 1.1-1.7 2.6M12 17h.01"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', close: '<path d="m6 6 12 12M18 6 6 18"/>',
    person: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a7 7 0 0 1 7-6h2a7 7 0 0 1 7 6v2"/>', people: '<circle cx="9" cy="8" r="3.5"/><path d="M2 21v-2a7 7 0 0 1 14 0v2m0-16a3.5 3.5 0 0 1 0 7m2 3a5 5 0 0 1 4 5"/>',
    heart: '<path d="M20.8 4.6a5.3 5.3 0 0 0-7.5.1L12 6l-1.3-1.3a5.3 5.3 0 0 0-7.5 7.5L12 21l8.8-8.8a5.3 5.3 0 0 0 0-7.6Z"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>', tick: '<path d="m4 12 5 5L20 6"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
    chevron: '<path d="m8 10 4 4 4-4"/>', down: '<path d="m6 9 6 6 6-6"/>', flag: '<path d="M5 21V4m0 1c5-5 9 4 15-1v10c-6 5-10-4-15 1"/>',
    medal: '<path d="m12 2 8 4v6c0 4-5 8-8 10-3-2-8-6-8-10V6Z"/><path d="m8 12 3 3 5-6"/>',
    filter: '<path d="M3 6h18M6 12h12M9 18h6"/>', mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>', map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Zm6-3v15m6-12v15"/>',
    book: '<path d="M3 5c4-1.5 6-.5 9 2 3-2.5 5-3.5 9-2v15c-4-1.5-6-.5-9 1-3-1.5-5-2.5-9-1ZM12 7v14"/>'
};
export const icon = (name, size = 22) => '<svg aria-hidden="true" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">' + (shapes[name] || '') + '</svg>';
export function fillIcons(root = document) { for (const el of root.querySelectorAll('[data-icon]'))
    el.innerHTML = icon(el.dataset.icon, el.dataset.size || 22); }
