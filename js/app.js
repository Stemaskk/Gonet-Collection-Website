// ===== Language toggle (KR default) =====
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
    try { return localStorage.getItem('gonet-lang') === 'en' ? 'en' : 'kr'; }
    catch { return 'kr'; }
})());

toggle?.addEventListener('click', () =>
    setLang(root.getAttribute('data-lang') === 'kr' ? 'en' : 'kr')
);


// ===== Highlight current link (supports /page or /page.html) =====
(function highlightNav(){
    const norm = p => {
        let s = p.toLowerCase();
        s = s.replace(/index\.html$/,'').replace(/\.html$/,'').replace(/\/+$/,'');
        return s === '' ? '/' : s;
    };
    const current = norm(location.pathname);
    document.querySelectorAll('.nav-links a').forEach(a => {
        try{
            const href = norm(new URL(a.getAttribute('href'), location.origin).pathname);
            if (href === current) a.classList.add('active');
        }catch{}
    });
})();


// ===== Header fade/compact (DISABLED on Home) =====
const header = document.querySelector('.nav');
const isHome = document.body.classList.contains('home');

(function headerBehavior(){
    if (!header) return;

    const FADE_RANGE = 40;
    const IDLE_MS = 120;
    let idleTimer = null, isSnapping = false, lastFade = 0;

    const clamp=(n,min,max)=>Math.min(Math.max(n,min),max);
    function setFade(v){ lastFade=v; header.style.setProperty('--fade', v.toFixed(3)); }
    function animateFadeTo(target, dur=220, done){
        const start=performance.now(), from=lastFade||0, delta=target-from; isSnapping=true;
        function step(now){
            if(!isSnapping) return;
            const t=clamp((now-start)/dur,0,1);
            const eased=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
            setFade(from+delta*eased);
            if(t<1) requestAnimationFrame(step); else { isSnapping=false; done&&done(); }
        }
        requestAnimationFrame(step);
    }
    function onScrollIdle(){
        if(!header||isSnapping) return;
        const y = window.scrollY||0;
        animateFadeTo(y===0?0:1, 220, () => {
            if (y!==0) header.classList.add('is-compact'); else header.classList.remove('is-compact');
        });
    }
    function updateHeader(){
        if(!header) return; isSnapping=false;
        const y = window.scrollY||0;
        setFade(clamp(y/FADE_RANGE,0,1));
        if (y>0) header.classList.add('is-compact'); else header.classList.remove('is-compact');
        clearTimeout(idleTimer); idleTimer=setTimeout(onScrollIdle, IDLE_MS);
    }

    if (isHome){
        setFade(0);
        header.classList.remove('is-compact');
        return; // no listeners on Home
    }

    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive:true });
})();


// ===== Auto-collapse when header would overflow =====
(function autoCollapseWhenOverflow(){
    const nav=document.querySelector('.nav');
    const inner=nav?.querySelector('.nav-inner');
    const brand=inner?.querySelector('.brand');
    const links=inner?.querySelector('.nav-links');
    const actions=inner?.querySelector('.nav-actions');
    const SAFE=64;
    if(!nav||!inner||!brand||!links||!actions) return;

    function measure(){
        const was=nav.classList.contains('is-overflow');
        if(was) nav.classList.remove('is-overflow');
        inner.offsetWidth; // reflow
        const need=brand.offsetWidth+links.scrollWidth+actions.offsetWidth+SAFE;
        const have=inner.clientWidth;
        if(was) nav.classList.add('is-overflow');
        if(need>have) nav.classList.add('is-overflow'); else nav.classList.remove('is-overflow');
    }

    measure();
    window.addEventListener('resize', measure, { passive:true });
    window.addEventListener('pageshow', measure, { passive:true });
    if(document.fonts && document.fonts.ready){ document.fonts.ready.then(measure).catch(()=>{}); }
    if('ResizeObserver' in window){
        const ro=new ResizeObserver(measure);
        ro.observe(inner); ro.observe(links); ro.observe(actions);
    }
})();


// ===== Overlay menu toggles + animate hamburger =====
const menuBtn=document.getElementById('menuBtn');
const menuPanel=document.getElementById('menuPanel');
const menuClose=document.getElementById('menuClose');

function openMenu(){
    if(!menuPanel) return;
    menuPanel.hidden=false;
    requestAnimationFrame(()=>menuPanel.classList.add('is-open'));
    document.body.classList.add('no-scroll');
    menuBtn?.setAttribute('aria-expanded','true');
    menuBtn?.classList.add('is-open');
}
function closeMenu(){
    if(!menuPanel) return;
    menuPanel.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    menuBtn?.setAttribute('aria-expanded','false');
    menuBtn?.classList.remove('is-open');
    setTimeout(()=>menuPanel.hidden=true, 250);
}
menuBtn?.addEventListener('click', ()=>{ if(menuPanel?.hidden) openMenu(); else closeMenu(); });
menuClose?.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menuPanel?.hidden) closeMenu();
});


// ===== Scene grid (no lazy src): hover/tap play-pause only =====
function initSceneGrid(){
    const tiles = document.querySelectorAll('.scene-item, .scene-tile');
    if (!tiles.length) return;

    const isTouch = window.matchMedia('(hover: none)').matches;

    tiles.forEach((item) => {
        const v = item.querySelector('video');
        if (!v) return;

        if (!isTouch){
            item.addEventListener('mouseenter', () => { v.play().catch(()=>{}); });
            item.addEventListener('mouseleave', () => { v.pause(); });
        } else {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                if (v.paused){
                    document.querySelectorAll('.scene-item.is-playing, .scene-tile.is-playing').forEach(it => {
                        if (it !== item){
                            it.classList.remove('is-playing');
                            const ov = it.querySelector('video');
                            if (ov) ov.pause();
                        }
                    });
                    v.play().catch(()=>{});
                    item.classList.add('is-playing');
                } else {
                    v.pause();
                    item.classList.remove('is-playing');
                }
            }, { passive:false });
        }
    });
}
document.addEventListener('DOMContentLoaded', initSceneGrid);


// ===== Contact AJAX submit =====
(() => {
    const form = document.getElementById("contactForm");
    if (!form) return;

    const btn = document.getElementById("contactSubmit");
    const note = document.getElementById("contactNote");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        note.textContent = "";
        btn.disabled = true;
        btn.textContent = "Sending…";

        const data = {
            email: form.email.value.trim(),
            first_name: form.first_name.value.trim(),
            message: form.message.value.trim(),
            website: form.website?.value || "" // honeypot
        };

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(data)
            });
            const out = await res.json();
            if (out.ok) {
                form.reset();
                note.textContent = "Thanks! We received your message.";
                note.style.color = "#1b7f4b";
            } else {
                throw new Error(out.error || "Failed");
            }
        } catch (err) {
            note.textContent = "Sorry, something went wrong. Please email us at gonet@goodonetable.com.";
            note.style.color = "#a11";
        } finally {
            btn.disabled = false;
            btn.textContent = "SUBMIT";
        }
    });
})();

// --- Scene grid: hover on desktop; modal on touch ---
function initSceneGrid(){
    const items = document.querySelectorAll('.scene-item');
    if (!items.length) return;

    const isTouch = window.matchMedia('(hover: none)').matches;

    items.forEach((item) => {
        const videoEl = item.querySelector('video');
        const srcFromAttr = item.getAttribute('data-video');
        const src = srcFromAttr || videoEl?.getAttribute('data-src') || videoEl?.src || "";

        if (!isTouch){
            // Desktop: play inline on hover
            if (!videoEl) return;
            item.addEventListener('mouseenter', () => {
                if (videoEl.paused) videoEl.play().catch(()=>{});
            });
            item.addEventListener('mouseleave', () => {
                videoEl.pause();
            });
        } else {
            // Touch: open modal and play there
            item.addEventListener('click', (e) => {
                e.preventDefault();
                if (!src) return;
                openSceneModal(src);
            }, {passive:false});
        }
    });
}

document.addEventListener('DOMContentLoaded', initSceneGrid);

// --- Modal helpers (mobile only opened; safe on desktop) ---
const sceneModal = document.getElementById('sceneModal');
const sceneModalVideo = document.getElementById('sceneModalVideo');
const sceneModalClose = document.getElementById('sceneModalClose');

function openSceneModal(src){
    if (!sceneModal || !sceneModalVideo) return;
    sceneModalVideo.src = src;
    sceneModal.hidden = false;
    document.body.classList.add('no-scroll');
    // user tap → allowed to play
    sceneModalVideo.play().catch(()=>{});
}

function closeSceneModal(){
    if (!sceneModal || !sceneModalVideo) return;
    sceneModalVideo.pause();
    sceneModalVideo.removeAttribute('src');
    sceneModalVideo.load();
    sceneModal.hidden = true;
    document.body.classList.remove('no-scroll');
}

sceneModalClose?.addEventListener('click', closeSceneModal);
sceneModal?.addEventListener('click', (e) => {
    if (e.target === sceneModal || e.target.classList.contains('scene-modal__backdrop')) closeSceneModal();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !sceneModal?.hidden) closeSceneModal();
});

// OUR STORY — Mobile "book" popup on first load per session
(function storyBookMobileModal(){
    // Only run on Our Story page
    if (!document.body.classList.contains('story')) return;

    // Mobile only
    const isMobile = window.matchMedia('(max-width: 900px), (orientation: portrait)').matches;
    if (!isMobile) return;

    // Show only once per session (tab)
    if (sessionStorage.getItem('story-book-modal-dismissed') === '1') return;

    // Use the existing book image on the page if present
    const bookImg = document.querySelector('.story-book img');
    const src = bookImg?.getAttribute('src') || '/assets/story/book.jpg'; // <- fallback: adjust if needed

    // Build modal
    const modal = document.createElement('div');
    modal.className = 'storybook-modal';
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.setAttribute('aria-label','Book preview');
    modal.innerHTML = `
    <div class="storybook-modal__backdrop"></div>
    <div class="storybook-modal__dialog">
      <button class="storybook-modal__close" aria-label="Close">×</button>
      <img class="storybook-modal__img" src="${src}" alt="GONET book">
    </div>
  `;

    function close(){
        modal.remove();
        document.body.classList.remove('no-scroll');
        sessionStorage.setItem('story-book-modal-dismissed','1');
        document.removeEventListener('keydown', onEsc);
    }
    function onEsc(e){ if (e.key === 'Escape') close(); }

    modal.querySelector('.storybook-modal__backdrop').addEventListener('click', close);
    modal.querySelector('.storybook-modal__close').addEventListener('click', close);
    document.addEventListener('keydown', onEsc);

    // Show and lock background scroll (reuses your existing .no-scroll pattern)
    document.body.appendChild(modal);
    document.body.classList.add('no-scroll');
})();