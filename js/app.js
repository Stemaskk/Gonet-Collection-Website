// Language toggle (KR default)
const root = document.body;
const toggle = document.getElementById('langToggle');

function setLang(next){
    root.setAttribute('data-lang', next);
    try { localStorage.setItem('gonet-lang', next); } catch {}
    if (toggle){
        toggle.setAttribute('aria-pressed', String(next === 'en'));
        toggle.textContent = next === 'en' ? 'EN / KR' : 'KR / EN';
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
const SCROLL_Y = 16;
function updateHeader(){
    if (!header) return;
    if (window.scrollY > SCROLL_Y) header.classList.add('is-compact');
    else header.classList.remove('is-compact');
}
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

// Slide-over menu toggles
const menuBtn = document.getElementById('menuBtn');
const menuPanel = document.getElementById('menuPanel');
const menuClose = document.getElementById('menuClose');
const backdrop = menuPanel?.querySelector('[data-close]');

function openMenu(){
    if (!menuPanel) return;
    menuPanel.hidden = false;
    requestAnimationFrame(() => menuPanel.classList.add('is-open'));
    document.body.classList.add('no-scroll');
    menuBtn?.setAttribute('aria-expanded','true');
}
function closeMenu(){
    if (!menuPanel) return;
    menuPanel.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    menuBtn?.setAttribute('aria-expanded','false');
    setTimeout(() => (menuPanel.hidden = true), 280);
}
menuBtn?.addEventListener('click', openMenu);
menuClose?.addEventListener('click', closeMenu);
backdrop?.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menuPanel?.hidden) closeMenu();
});

// Optional: click-to-play YouTube if you use .yt-lazy boxes
document.querySelectorAll('.yt-lazy').forEach(box => {
    box.addEventListener('click', () => {
        const src = box.getAttribute('data-src');
        const iframe = document.createElement('iframe');
        iframe.className = 'video';
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('allow','accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
        iframe.src = src;
        box.replaceWith(iframe);
    }, { once: true });
});