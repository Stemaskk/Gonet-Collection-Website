/* ===== Language toggle: KR <-> EN ===== */
(function(){
    const btn = document.getElementById('langToggle');
    if (!btn) return;
    const get = () => document.body.getAttribute('data-lang') || 'kr';
    const set = (v) => document.body.setAttribute('data-lang', v);

    // Initialize label
    btn.textContent = get().toUpperCase();
    btn.addEventListener('click', () => {
        const next = get() === 'kr' ? 'en' : 'kr';
        set(next);
        btn.textContent = next.toUpperCase();
    });
})();

/* ===== Header: fade + compact (HAY-like) ===== */
(function(){
    const nav = document.querySelector('.nav');
    if (!nav) return;
    const root = document.documentElement;
    const menuBtn = document.getElementById('menuBtn');
    const menuPanel = document.getElementById('menuPanel');
    const menuClose = document.getElementById('menuClose');

    let lastY = 0;
    let ticking = false;

    function applyFade() {
        const y = window.scrollY || 0;
        // Fade range ~0..80px; compact snaps at ~120px
        const fade = Math.max(0, Math.min(1, y / 80));
        root.style.setProperty('--fade', fade.toFixed(3));

        const shouldCompact = y > 120;
        nav.classList.toggle('is-compact', shouldCompact);

        // Overflow check (nav-links too wide)
        const links = nav.querySelector('.nav-links');
        if (links) {
            const inner = nav.querySelector('.nav-inner');
            const room = inner ? inner.clientWidth : window.innerWidth;
            const need = links.scrollWidth + 360; // brand + actions approx
            nav.classList.toggle('is-overflow', need > room);
        }
    }

    function onScroll(){
        lastY = window.scrollY || 0;
        if (!ticking){
            window.requestAnimationFrame(() => {
                applyFade();
                ticking = false;
            });
            ticking = true;
        }
    }

    // Only expand when truly at top
    function onScrollEndSnap(){
        const y = window.scrollY || 0;
        if (y <= 2) {
            root.style.setProperty('--fade', '0');
            nav.classList.remove('is-compact');
        }
    }

    window.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('scrollend', onScrollEndSnap);
    window.addEventListener('resize', applyFade);
    applyFade();

    /* Menu open/close */
    function openMenu(){
        menuPanel.hidden = false;
        menuPanel.classList.add('is-open');
        menuBtn.classList.add('is-open');
        menuBtn.setAttribute('aria-expanded','true');
        document.body.classList.add('no-scroll');
    }
    function closeMenu(){
        menuPanel.classList.remove('is-open');
        menuBtn.classList.remove('is-open');
        menuBtn.setAttribute('aria-expanded','false');
        setTimeout(()=>{ menuPanel.hidden = true; }, 180);
        document.body.classList.remove('no-scroll');
    }
    if (menuBtn && menuPanel){
        menuBtn.addEventListener('click', () => {
            const open = menuPanel.classList.contains('is-open');
            open ? closeMenu() : openMenu();
        });
    }
    if (menuClose){
        menuClose.addEventListener('click', closeMenu);
    }
    menuPanel?.addEventListener('click', (e)=>{
        if (e.target === menuPanel) closeMenu();
    });
})();

/* ===== Scene (Film): hover to play video; tap toggle on touch ===== */
(function(){
    const items = Array.from(document.querySelectorAll('.scene-item'));
    if (!items.length) return;

    const isTouch = matchMedia('(hover: none)').matches;

    items.forEach((item) => {
        const video = item.querySelector('video');
        if (!video) return;

        if (!isTouch){
            item.addEventListener('mouseenter', ()=>{ video.currentTime = 0; video.play().catch(()=>{}); });
            item.addEventListener('mouseleave', ()=>{ video.pause(); video.currentTime = 0; });
        } else {
            item.addEventListener('click', ()=>{
                const active = item.classList.toggle('is-playing');
                if (active) video.play().catch(()=>{}); else video.pause();
            });
        }
    });
})();

/* ===== Contact AJAX submit status (works even without API) ===== */
(function(){
    const form = document.getElementById("contactForm");
    if (!form) return;

    const btn = document.getElementById("contactSubmit");
    const note = document.getElementById("contactNote");

    form.addEventListener("submit", async (e) => {
        // If action is /api/contact and JS exists, use fetch to avoid page nav
        if (form.action && form.action.endsWith('/api/contact')) {
            e.preventDefault();
            note.textContent = "";
            btn.disabled = true; btn.textContent = "Sending…";

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
                const out = await res.json().catch(()=>({}));
                if (out.ok) {
                    form.reset();
                    note.textContent = "Thanks! We received your message.";
                    note.style.color = "#1b7f4b";
                } else {
                    throw new Error(out.error || "Failed");
                }
            } catch {
                note.textContent = "Sorry, something went wrong. Please email us at gonet@goodonetable.com.";
                note.style.color = "#a11";
            } finally {
                btn.disabled = false; btn.textContent = "SUBMIT";
            }
        }
    });
})();