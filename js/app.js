// Language toggle (KR default, button shows "KR" or "EN")
const root = document.body;
const toggle = document.getElementById('langToggle');

function setLang(next){
    root.setAttribute('data-lang', next);
    try { localStorage.setItem('gonet-lang', next); } catch {}
    if (toggle){
        toggle.setAttribute('aria-pressed', String(next === 'en'));
        toggle.textContent = next === 'en' ? 'EN' : 'KR';
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

// ===== Legacy-style fade + "follow-through", BUT expand only at top =====
const header = document.querySelector('.nav');
const FADE_RANGE = 40;   // px to fully fade contents
const IDLE_MS    = 120;  // how long after scroll to finish motion
let idleTimer = null;

let lastY = window.scrollY || 0;
let lastDir = 0;         // -1 up, +1 down, 0 unknown
let isSnapping = false;
let lastFade = 0;

function clamp(n,min,max){ return Math.min(Math.max(n,min),max); }
function setFade(v){
    lastFade = v;
    header?.style.setProperty('--fade', v.toFixed(3));
}

function animateFadeTo(target, duration = 220, onDone){
    const start = performance.now();
    const from  = lastFade || 0;
    const delta = target - from;
    isSnapping = true;

    function step(now){
        if (!isSnapping) return; // interrupted by user scroll
        const t = clamp((now - start) / duration, 0, 1);
        const eased = t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2)/2;
        setFade(from + delta * eased);
        if (t < 1) requestAnimationFrame(step);
        else { isSnapping = false; onDone && onDone(); }
    }
    requestAnimationFrame(step);
}

function onScrollIdle(){
    if (!header || isSnapping) return;
    const y = window.scrollY || 0;

    // NEW RULE: expand only at the very top (y === 0)
    const targetFade = (y === 0) ? 0 : 1;
    const makeCompact = (y !== 0);

    animateFadeTo(targetFade, 220, () => {
        if (makeCompact) header.classList.add('is-compact');
        else header.classList.remove('is-compact');
    });
}

function updateHeader(){
    if (!header) return;

    // Interrupt any snap if user is actively scrolling
    isSnapping = false;

    const y = window.scrollY || 0;
    const dir = Math.sign(y - lastY);
    if (dir !== 0) lastDir = dir;
    lastY = y;

    // Live fade mapping while scrolling
    const fade = clamp(y / FADE_RANGE, 0, 1);
    setFade(fade);

    // NEW RULE: compact whenever not at top
    if (y > 0) header.classList.add('is-compact');
    else header.classList.remove('is-compact');

    // After short idle, snap to full state (top=expanded, else=collapsed)
    clearTimeout(idleTimer);
    idleTimer = setTimeout(onScrollIdle, IDLE_MS);
}
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

// ===== Keep header spacing fixed; switch to hamburger when overflow =====
(function autoCollapseWhenOverflow(){
    const nav = document.querySelector('.nav');
    const inner = nav?.querySelector('.nav-inner');
    const brand = inner?.querySelector('.brand');
    const links = inner?.querySelector('.nav-links');
    const actions = inner?.querySelector('.nav-actions');
    const SAFE = 24;

    if (!nav || !inner || !brand || !links || !actions) return;

    function measureAndToggle(){
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

// ===== Full-width overlay menu toggles + animated hamburger =====
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