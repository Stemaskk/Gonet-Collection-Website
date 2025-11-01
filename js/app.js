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

// Highlight current link (supports /page or /page.html)
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

// ===== Fade + snap header (expand only at top) =====
const header = document.querySelector('.nav');
const FADE_RANGE = 40;
const IDLE_MS    = 120;
let idleTimer = null;
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
        if (!isSnapping) return;
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
    const targetFade = (y === 0) ? 0 : 1;
    const makeCompact = (y !== 0);
    animateFadeTo(targetFade, 220, () => {
        if (makeCompact) header.classList.add('is-compact');
        else header.classList.remove('is-compact');
    });
}

function updateHeader(){
    if (!header) return;
    isSnapping = false;

    const y = window.scrollY || 0;
    const fade = clamp(y / FADE_RANGE, 0, 1);
    setFade(fade);

    if (y > 0) header.classList.add('is-compact');
    else header.classList.remove('is-compact');

    clearTimeout(idleTimer);
    idleTimer = setTimeout(onScrollIdle, IDLE_MS);
}
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

// ===== Auto-collapse when header would overflow =====
(function autoCollapseWhenOverflow(){
    const nav = document.querySelector('.nav');
    const inner = nav?.querySelector('.nav-inner');
    const brand = inner?.querySelector('.brand');
    const links = inner?.querySelector('.nav-links');
    const actions = inner?.querySelector('.nav-actions');
    const SAFE = 64;

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

// ===== Overlay menu toggles + animate hamburger =====
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

// ===== Adaptive hero fit: crop sides in tall view, fit width on ultra-wide =====
(function adaptiveHero(){
    const hero = document.querySelector('.hero-visual');
    const imgEl = hero?.querySelector('.hero-img');
    if (!hero || !imgEl) return;

    function update(){
        const vw = hero.clientWidth;
        const vh = hero.clientHeight || window.innerHeight;
        const viewRatio = vw / vh;

        const iw = imgEl.naturalWidth;
        const ih = imgEl.naturalHeight;
        if (!iw || !ih) return;

        const imgRatio = iw / ih;

        // If viewport is significantly wider than image, fit width (contain)
        if (viewRatio > imgRatio + 0.02) hero.classList.add('is-wide');
        else hero.classList.remove('is-wide');
    }

    if (imgEl.complete && imgEl.naturalWidth) update();
    else imgEl.addEventListener('load', update, { once:true });

    window.addEventListener('resize', update, { passive:true });
    window.addEventListener('orientationchange', update);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(update).catch(()=>{});
    setTimeout(update, 0);
})();