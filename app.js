// Language toggle (default KR)
const root = document.body;
const toggle = document.getElementById('langToggle');

function setLang(next) {
    root.setAttribute('data-lang', next);
    localStorage.setItem('gonet-lang', next);
    toggle.setAttribute('aria-pressed', String(next === 'en'));
    toggle.textContent = next === 'en' ? 'EN / KR' : 'KR / EN';
}

// init
const saved = localStorage.getItem('gonet-lang');
setLang(saved === 'en' ? 'en' : 'kr');

// toggle on click
toggle.addEventListener('click', () => {
    const current = root.getAttribute('data-lang') || 'kr';
    setLang(current === 'kr' ? 'en' : 'kr');
});

// Smooth-scroll for internal links
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const id = a.getAttribute('href');
        if (!id || id === '#') return;
        const el = document.querySelector(id);
        if (!el) return;
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.pushState(null, '', id);
    });
});

// Basic contact form handler (no backend yet)
document.getElementById('contactForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Thanks! We will get back to you shortly. (Form wiring pending)');
});