// Language toggle (KR default)
const root = document.body;
const toggle = document.getElementById('langToggle');

function setLang(next){
    root.setAttribute('data-lang', next);
    localStorage.setItem('gonet-lang', next);
    if (toggle){
        toggle.setAttribute('aria-pressed', String(next === 'en'));
        toggle.textContent = next === 'en' ? 'EN / KR' : 'KR / EN';
    }
}
setLang(localStorage.getItem('gonet-lang') === 'en' ? 'en' : 'kr');
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

// Optional: click-to-play YouTube (if you use .yt-lazy)
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