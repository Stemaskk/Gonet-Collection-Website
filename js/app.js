// Language toggle (KR default, button shows "KR" or "EN")
const root = document.body;
const toggle = document.getElementById('langToggle');

function setLang(next){
    root.setAttribute('data-lang', next);
    try { localStorage.setItem('gonet-lang', next); } catch {}
    if (toggle){
        toggle.setAttribute('aria-pressed', String(next === 'en'));
        toggle.textContent = next === 'en' ? 'EN' : 'KR';   // single label
    }
}
setLang((() => {
    try { return localStorage.getItem('gonet-lang') === 'en' ? 'en' : 'kr'; } catch { return 'kr'; }
})());
toggle?.addEventListener('click', () => {
    const current = root.getAttribute('data-lang') || 'kr';
    setLang(current === 'kr' ? 'en' : 'kr');
});

// Active nav state (works for "/", "/page", "/page/", "/page.html")
(function highlightNav(){
    const norm = p => {
        let s = p.toLowerCase();
        s = s.replace(/index\.html$/,'').replace(/\.html$/,'').replace(/\/+$/,'');
        return s === '' ? '/' : s;
    };
    const current = norm(location.pathname);
    document.querySelectorAll('.nav-links a').forEach(a => {
        try {
            const href = norm(new URL(a.getAttribute('href'), location.origin).pathname);
            if (href === current) a.classList.add('active');
        } catch {}
    });
})();

// Condense header on scroll
const header = document.querySelector('.nav');
const SCROLL_Y = 40; // stays full until you scroll a bit
function updateHeader(){
    if (!header) return;
    if (window.scrollY > SCROLL_Y) header.classList.add('is-compact');
    else header.classList.remove('is-compact');
}
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

// Auto-collapse when nav would overflow (prevents "mushing")
(function autoCollapseWhenOverflow(){
    const nav = document.querySelector('.nav');
    const inner = nav?.querySelector('.nav-inner');
    const brand = inner?.querySelector('.brand');
    const links = inner?.querySelector('.nav-links');
    const actions = inner?.querySelector('.nav-actions');
    const SAFE = 24; // px buffer so we don't get jitter

    if (!nav || !inner || !brand || !links || !actions) return;

    function measureAndToggle(){
        // Temporarily unhide links to measure real width
        const wasOverflow = nav.classList.contains('is-overflow');
        if (wasOverflow) nav.classList.remove('is-overflow');
        inner.offsetWidth; // reflow

        const need = brand.offsetWidth + links.scrollWidth + actions.offsetWidth + SAFE;
        const have = inner.clientWidth;

        if (wasOverflow) nav.classList.add('is-overflow');
        if (need > have) nav.classList.add('is-overflow');
        else nav.classList.remove('is-overflow');
    }

    measureAndToggle();
    window.addEventListener('resize', measureAndToggle, { passive: true });
    window.addEventListener('pageshow', measureAndToggle, { passive: true });
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(measureAndToggle).catch(()=>{});
    }
    if ('ResizeObserver' in window){
        const ro = new ResizeObserver(measureAndToggle);
        ro.observe(inner); ro.observe(links); ro.observe(actions);
    }
})();

// Full-width overlay menu toggles + animated hamburger
const menuBtn = document.getElementById('menuBtn');
const menuPanel = document.getElementById('menuPanel');
const menuClose = document.getElementById('menuClose');

function openMenu(){
    if (!menuPanel) return;
    menuPanel.hidden = false;
    requestAnimationFrame(() => menuPanel.classList.add('is-open'));
    document.body.classList.add('no-scroll');
    menuBtn?.setAttribute('aria-expanded','true');
    menuBtn?.classList.add('is-open');     // morph bars → X
}
function closeMenu(){
    if (!menuPanel) return;
    menuPanel.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    menuBtn?.setAttribute('aria-expanded','false');
    menuBtn?.classList.remove('is-open');  // back to bars
    setTimeout(() => (menuPanel.hidden = true), 250);
}
menuBtn?.addEventListener('click', () => {
    if (menuPanel?.hidden) openMenu(); else closeMenu();
});
menuClose?.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menuPanel?.hidden) closeMenu();
});