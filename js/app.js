// ===== Shared across all pages =====

// Language toggle
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

// Active nav state
(function highlightNav(){
    const path = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(a => {
        const href = a.getAttribute('href');
        if (!href) return;
        const file = href.split('/').pop();
        if ((path === '' && file === 'index.html') || path === file) a.classList.add('active');
        if (path === '' && file === './') a.classList.add('active');
    });
})();

// (Optional) YouTube privacy-enhanced embeds:
// Use https://www.youtube-nocookie.com/embed/... in your <iframe src>.