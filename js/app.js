// Language toggle (KR default)
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
setLang((() => { try { return localStorage.getItem('gonet-lang') === 'en' ? 'en' : 'kr'; } catch { return 'kr'; } })());
toggle?.addEventListener('click', () => setLang(root.getAttribute('data-lang') === 'kr' ? 'en' : 'kr'));

// Highlight current link (supports /page or /page.html)
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

    // Skip animation on Home
    if (isHome){
        setFade(0);
        header.classList.remove('is-compact');
        return; // no listeners
    }

    // Scrollable pages: enable animation
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
    menuBtn?.classList.add('is-open');     // morph bars → X
}
function closeMenu(){
    if(!menuPanel) return;
    menuPanel.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    menuBtn?.setAttribute('aria-expanded','false');
    menuBtn?.classList.remove('is-open');  // back to bars
    setTimeout(()=>menuPanel.hidden=true, 250);
}
menuBtn?.addEventListener('click', ()=>{ if(menuPanel?.hidden) openMenu(); else closeMenu(); });
menuClose?.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menuPanel?.hidden) closeMenu();
});

// --- Scene grid: image -> video on hover (desktop), tap-to-toggle (touch) ---
function initSceneGrid(){
    const items = document.querySelectorAll('.scene-item');
    if (!items.length) return;

    const isTouch = window.matchMedia('(hover: none)').matches;

    items.forEach((item) => {
        const videoEl = item.querySelector('video');
        const src = item.getAttribute('data-video');

        // Lazy-attach the video src the first time we try to play
        let loaded = false;
        const ensureLoaded = () => {
            if (!loaded && src) {
                videoEl.src = src;
                loaded = true;
            }
        };

        if (!isTouch){
            // Desktop: play on hover
            item.addEventListener('mouseenter', () => {
                ensureLoaded();
                if (videoEl.paused) { videoEl.play().catch(()=>{}); }
            });
            item.addEventListener('mouseleave', () => {
                videoEl.pause();
                // keep current frame hidden again via CSS opacity
            });
        } else {
            // Touch: tap toggles playback and visual state
            item.addEventListener('click', (e) => {
                e.preventDefault(); // keep the <a> from navigating
                ensureLoaded();
                if (videoEl.paused){
                    // pause any other playing tiles
                    document.querySelectorAll('.scene-item.is-playing').forEach(it => {
                        if (it !== item){
                            it.classList.remove('is-playing');
                            const v = it.querySelector('video');
                            if (v) v.pause();
                        }
                    });
                    videoEl.play().catch(()=>{});
                    item.classList.add('is-playing');
                } else {
                    videoEl.pause();
                    item.classList.remove('is-playing');
                }
            }, {passive:false});
        }
    });
}

// If you already have a DOMContentLoaded handler, just call initSceneGrid() inside it.
// Otherwise, this standalone listener is fine:
document.addEventListener('DOMContentLoaded', initSceneGrid);

// Contact AJAX submit (keeps the page in place and shows a status line)
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