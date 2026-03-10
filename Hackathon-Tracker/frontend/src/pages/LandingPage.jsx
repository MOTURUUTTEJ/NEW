import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();
    const gsapLoaded = useRef(false);

    useEffect(() => {
        // Dynamically inject Google Fonts if not already present
        if (!document.getElementById('lp-fonts')) {
            const link = document.createElement('link');
            link.id = 'lp-fonts';
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap';
            document.head.appendChild(link);
        }

        // Load GSAP scripts dynamically and safely for React StrictMode
        const loadScript = (src, checkFn) => new Promise((resolve, reject) => {
            if (checkFn()) { resolve(); return; }
            let s = document.querySelector(`script[src="${src}"]`);
            if (!s) {
                s = document.createElement('script');
                s.src = src;
                document.body.appendChild(s);
            }
            const checkInterval = setInterval(() => {
                if (checkFn()) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 50);
            s.addEventListener('error', (e) => {
                clearInterval(checkInterval);
                reject(e);
            });
        });

        const initAnimations = () => {
            const { gsap, ScrollTrigger, TextPlugin } = window;
            if (!gsap || !ScrollTrigger || !TextPlugin) return;

            // Kill existing ScrollTriggers to avoid duplicates on HMR
            ScrollTrigger.getAll().forEach(t => t.kill());

            gsap.registerPlugin(ScrollTrigger, TextPlugin);
            const isMobile = window.innerWidth <= 768;

            // ── 1. SCROLL PROGRESS ──
            const scrollBar = document.getElementById('lp-scrollBar');
            const onScroll = () => {
                if (!scrollBar) return;
                const pct = (document.documentElement.scrollTop / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
                scrollBar.style.width = pct + '%';
            };
            window.addEventListener('scroll', onScroll);

            // ── 2. FLOATING SHAPES ──
            if (!isMobile) {
                gsap.to('.lp-f-ring', { y: -80, x: 40, rotation: 360, duration: 22, repeat: -1, yoyo: true, ease: 'sine.inOut' });
                gsap.to('.lp-f-cross', { y: 50, x: -30, rotation: -180, duration: 18, repeat: -1, yoyo: true, ease: 'sine.inOut' });
                gsap.to('.lp-f-dot-1', { y: -40, x: 60, duration: 14, repeat: -1, yoyo: true, ease: 'sine.inOut' });
                gsap.to('.lp-f-dot-2', { y: 30, x: -20, duration: 11, repeat: -1, yoyo: true, ease: 'sine.inOut' });
                gsap.to('.lp-f-diamond', { y: -50, x: 30, rotation: 180, duration: 16, repeat: -1, yoyo: true, ease: 'sine.inOut' });
                gsap.to('.lp-f-circle', { y: 40, x: -25, duration: 13, repeat: -1, yoyo: true, ease: 'sine.inOut' });
                gsap.to('.lp-floaters', {
                    scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: 2 },
                    y: -350,
                });
            }

            // ── 3. HERO SEQUENCE ──
            const tl = gsap.timeline({ delay: 0.3 });

            function scramble(el, text) {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&';
                let i = 0;
                const iv = setInterval(() => {
                    el.textContent = text.split('').map((c, j) => j < i ? text[j] : chars[Math.floor(Math.random() * chars.length)]).join('');
                    i += 0.5;
                    if (i >= text.length) { el.textContent = text; clearInterval(iv); }
                }, 25);
            }

            tl.to('.lp-h1-word', { y: 0, opacity: 1, duration: 0.9, ease: 'power4.out', stagger: { amount: 0.6 } })
                .to('#lp-heroTag', { opacity: 1, duration: 0.4, onComplete: () => scramble(document.getElementById('lp-tagText'), 'HACKATHON MANAGEMENT, REIMAGINED') }, '-=0.3')
                .to('#lp-heroDesc', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.2')
                .to('#lp-heroMeta', { opacity: 1, duration: 0.5 }, '-=0.2')
                .to('#lp-heroBtns', { opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.7)' }, '-=0.1')
                .to('#lp-scrollCue', { opacity: 1, duration: 0.6 }, '-=0.2')
                .call(startTypewriter, null, '-=0.4');

            // ── 4. TYPEWRITER ──
            const words = ['Hackathon organizers', 'Event coordinators', 'Innovation leads', 'Community builders'];
            let wi = 0;

            function startTypewriter() {
                const el = document.getElementById('lp-typewriter');
                if (!el) return;
                function next() {
                    const w = words[wi % words.length];
                    gsap.to(el, {
                        duration: w.length * 0.06, text: { value: w }, ease: 'none',
                        onComplete: () => {
                            gsap.delayedCall(1.5, () => {
                                gsap.to(el, {
                                    duration: w.length * 0.03, text: { value: '' }, ease: 'none',
                                    onComplete: () => { wi++; gsap.delayedCall(0.3, next); },
                                });
                            });
                        },
                    });
                }
                next();
            }

            // ── 5. NAV ──
            const nav = document.getElementById('lp-nav');
            ScrollTrigger.create({
                trigger: '#lp-what',
                start: 'top 80%',
                onEnter: () => nav && nav.classList.add('show'),
                onLeaveBack: () => nav && nav.classList.remove('show'),
            });
            ScrollTrigger.create({
                trigger: '#lp-what', start: 'top 90%',
                onEnter: () => gsap.to('#lp-scrollCue', { opacity: 0, duration: 0.3 }),
                onLeaveBack: () => gsap.to('#lp-scrollCue', { opacity: 1, duration: 0.3 }),
            });

            // ── 6. SECTION TITLE REVEALS ──
            document.querySelectorAll('[data-lp-reveal]').forEach(el => {
                const text = el.textContent;
                el.innerHTML = text.split(' ').map(w => `<span class="word"><span class="w-i">${w}</span></span>`).join(' ');
                gsap.from(el.querySelectorAll('.w-i'), {
                    scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
                    y: '120%', rotateX: -60, opacity: 0,
                    duration: 0.8, ease: 'power4.out', stagger: 0.05,
                });
            });

            // ── 7. HORIZONTAL SCROLL — WHAT ──
            const whatRail = document.getElementById('lp-whatRail');
            if (whatRail) {
                const wCards = whatRail.querySelectorAll('.lp-w-card');
                const totalW = wCards.length * 340;
                gsap.to(whatRail, {
                    x: () => -(totalW - window.innerWidth + 200),
                    ease: 'none',
                    scrollTrigger: {
                        trigger: '.lp-pin-wrap-what',
                        start: 'top top',
                        end: () => `+=${totalW}`,
                        pin: '.lp-what-pin',
                        scrub: 1,
                        anticipatePin: 1,
                    },
                });
                wCards.forEach((card, i) => {
                    gsap.from(card, {
                        scrollTrigger: { trigger: '.lp-pin-wrap-what', start: () => `top+=${i * 180} top`, toggleActions: 'play none none none' },
                        opacity: 0, y: 50, scale: 0.92, duration: 0.8, ease: 'power3.out',
                    });
                });
            }

            // 3D tilt
            if (!isMobile) {
                document.querySelectorAll('.lp-w-card, .lp-s-card').forEach(card => {
                    card.addEventListener('mousemove', e => {
                        const r = card.getBoundingClientRect();
                        const x = ((e.clientX - r.left) / r.width - 0.5) * 8;
                        const y = ((e.clientY - r.top) / r.height - 0.5) * -8;
                        card.style.transform = `perspective(800px) rotateX(${y}deg) rotateY(${x}deg) translateY(-4px)`;
                    });
                    card.addEventListener('mouseleave', () => {
                        gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.5, ease: 'elastic.out(1, 0.6)', clearProps: 'transform' });
                    });
                });
            }

            // ── 8. WHY — SCROLL HIGHLIGHT ──
            const hlPara = document.getElementById('lp-hlPara');
            if (hlPara) {
                const txt = hlPara.textContent.trim();
                hlPara.innerHTML = txt.split(/\s+/).map(w => `<span class="hl-word">${w} </span>`).join('');
                const hlWords = hlPara.querySelectorAll('.hl-word');
                ScrollTrigger.create({
                    trigger: hlPara, start: 'top 85%', end: 'bottom 30%', scrub: 0.3,
                    onUpdate: (self) => {
                        const count = Math.floor(self.progress * hlWords.length);
                        hlWords.forEach((w, i) => w.classList.toggle('lit', i <= count));
                    },
                });
            }

            // Divider line draw
            const divLine = document.getElementById('lp-divLine');
            if (divLine) {
                ScrollTrigger.create({
                    trigger: divLine, start: 'top 85%',
                    onEnter: () => divLine.classList.add('drawn'),
                });
            }

            // Counters
            document.querySelectorAll('.lp-counter-val').forEach(c => {
                const target = parseInt(c.dataset.count);
                ScrollTrigger.create({
                    trigger: c, start: 'top 88%',
                    onEnter: () => {
                        gsap.to({ v: 0 }, {
                            v: target, duration: 1.5, ease: 'power2.out',
                            onUpdate() { c.textContent = Math.round(this.targets()[0].v); },
                        });
                    },
                    once: true,
                });
            });

            // ── 9. HOW — STACKING CARDS ──
            document.querySelectorAll('[data-lp-anim="stack"]').forEach(card => {
                ScrollTrigger.create({
                    trigger: card, start: 'top 92%',
                    onEnter: () => card.classList.add('vis'),
                    once: true,
                });
            });

            // Mantra words
            document.querySelectorAll('.lp-m-word').forEach((word, i) => {
                gsap.to(word, {
                    scrollTrigger: { trigger: word, start: 'top 90%', toggleActions: 'play none none none' },
                    opacity: 1, y: 0, duration: 0.8, delay: i * 0.1, ease: 'power4.out',
                });
            });

            // ── 10. POP ANIMATIONS ──
            document.querySelectorAll('[data-lp-anim="pop"]').forEach((el, i) => {
                gsap.to(el, {
                    scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none none' },
                    opacity: 1, y: 0, scale: 1,
                    duration: 0.6, delay: i * 0.05, ease: 'back.out(1.5)',
                });
            });

            // ── 11. CLOSING STATS COUNTERS ──
            document.querySelectorAll('.lp-ctr').forEach(c => {
                const target = parseInt(c.dataset.count);
                ScrollTrigger.create({
                    trigger: c, start: 'top 90%',
                    onEnter: () => {
                        gsap.to({ v: 0 }, {
                            v: target, duration: 1.5, ease: 'power2.out',
                            onUpdate() { c.textContent = Math.round(this.targets()[0].v); },
                        });
                    },
                    once: true,
                });
            });

            // ── 12. HALO PARALLAX ──
            gsap.to('.lp-halo-1', { scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: 2 }, y: -500, x: 200 });
            gsap.to('.lp-halo-2', { scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: 2 }, y: -700, x: -150 });
            gsap.to('.lp-halo-3', { scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: 2 }, y: -350 });

            // ── 13. SECTION GLOW ON ENTER ──
            document.querySelectorAll('.lp-sec').forEach(sec => {
                ScrollTrigger.create({
                    trigger: sec, start: 'top 90%',
                    onEnter: () => {
                        gsap.fromTo(sec,
                            { borderTopColor: 'rgba(31, 81, 255, 0.3)' },
                            { borderTopColor: 'rgba(255, 255, 255, 0.06)', duration: 1.5, ease: 'power2.out' }
                        );
                    },
                });
            });

            // ── 14. DRAGGABLE CARD STACK ──
            const cards = gsap.utils.toArray('.lp-deck-card');
            const stackEl = document.getElementById('lp-cardStack');
            const spFill = document.getElementById('lp-spFill');
            const spText = document.getElementById('lp-spText');
            const dragHint = document.getElementById('lp-dragHint');
            const TOTAL = cards.length;
            let current = 0, isDragging = false, startX = 0, currentX = 0;
            let velocity = 0, lastX = 0, lastTime = 0, rafId = null, hintHidden = false;
            let targetX = 0, smoothX = 0, smoothRot = 0;

            function layoutStack(animate = true) {
                cards.forEach((card, i) => {
                    const pos = (i - current + TOTAL) % TOTAL;
                    const isTop = pos === 0;
                    gsap.to(card, {
                        y: pos * 14, scale: 1 - pos * 0.045, zIndex: TOTAL - pos,
                        opacity: pos < 3 ? 1 - pos * 0.18 : 0,
                        rotateZ: 0, rotateY: 0, x: 0,
                        boxShadow: isTop ? '0 30px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)' : '0 10px 40px rgba(0,0,0,0.3)',
                        duration: animate ? 0.7 : 0, ease: 'power4.out', delay: animate ? pos * 0.06 : 0, overwrite: 'auto',
                    });
                    card.style.pointerEvents = isTop ? 'auto' : 'none';
                });
                const pct = ((current + 1) / TOTAL) * 100;
                if (spFill) gsap.to(spFill, { width: pct + '%', duration: 0.5, ease: 'power2.out' });
                if (spText) spText.textContent = `${current + 1} of ${TOTAL}`;
            }

            function throwCard(dir, throwVelocity) {
                const speed = Math.min(Math.max(Math.abs(throwVelocity || 0), 0.3), 2);
                const throwDist = 900 + speed * 200;
                const throwDur = Math.max(0.35, 0.6 - speed * 0.1);
                const topIdx = cards.findIndex((_, i) => (i - current + TOTAL) % TOTAL === 0);
                const topCard = cards[topIdx];
                gsap.to(topCard, {
                    x: dir * throwDist, rotateZ: dir * (15 + speed * 10), rotateY: dir * -8, scale: 0.8, opacity: 0,
                    duration: throwDur, ease: 'power2.in',
                    onComplete: () => {
                        current = (current + 1) % TOTAL;
                        layoutStack(true);
                        if (!hintHidden && dragHint) {
                            hintHidden = true;
                            gsap.to(dragHint, { opacity: 0, y: -10, duration: 0.4, ease: 'power2.in' });
                        }
                    }
                });
                cards.forEach((card, i) => {
                    const pos = (i - current + TOTAL) % TOTAL;
                    if (pos > 0 && pos < 3) gsap.to(card, { x: dir * -15 * (3 - pos), duration: 0.3, ease: 'power2.out' });
                });
            }

            function snapBack(card) {
                gsap.to(card, { x: 0, rotateZ: 0, rotateY: 0, scale: 1, boxShadow: '0 30px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)', duration: 0.8, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' });
                cards.forEach((c, i) => {
                    const pos = (i - current + TOTAL) % TOTAL;
                    if (pos > 0 && pos < 3) gsap.to(c, { x: 0, duration: 0.5, ease: 'power3.out' });
                });
            }

            function getTopCard() {
                return cards.find((_, i) => (i - current + TOTAL) % TOTAL === 0);
            }

            function dragLoop() {
                if (!isDragging) return;
                smoothX += (targetX - smoothX) * 0.25;
                smoothRot += (targetX * 0.06 - smoothRot) * 0.2;
                const topCard = getTopCard();
                const progress = Math.abs(smoothX) / 300;
                const opa = Math.max(0.5, 1 - progress * 0.5);
                const sc = Math.max(0.92, 1 - progress * 0.08);
                const shadowBlur = 30 + progress * 60;
                const shadowAlpha = 0.5 - progress * 0.2;
                gsap.set(topCard, { x: smoothX, rotateZ: smoothRot, rotateY: smoothX * -0.015, scale: sc, opacity: opa, boxShadow: `0 ${shadowBlur}px ${shadowBlur * 2}px rgba(0,0,0,${shadowAlpha})` });
                cards.forEach((card, i) => {
                    const pos = (i - current + TOTAL) % TOTAL;
                    if (pos === 1) gsap.set(card, { x: smoothX * -0.08 });
                    else if (pos === 2) gsap.set(card, { x: smoothX * -0.04 });
                });
                rafId = requestAnimationFrame(dragLoop);
            }

            function onPointerDown(e) {
                const topCard = getTopCard();
                if (e.target.closest('.lp-deck-card') !== topCard) return;
                isDragging = true;
                startX = e.clientX || 0;
                targetX = 0; smoothX = 0; smoothRot = 0; currentX = 0; velocity = 0;
                lastX = startX; lastTime = Date.now();
                topCard.style.cursor = 'grabbing';
                gsap.killTweensOf(topCard);
                dragLoop();
            }

            function onPointerMove(e) {
                if (!isDragging) return;
                const x = e.clientX || 0;
                const now = Date.now();
                const dt = Math.max(now - lastTime, 1);
                velocity = (x - lastX) / dt;
                lastX = x; lastTime = now;
                targetX = x - startX;
                currentX = targetX;
            }

            function onPointerUp() {
                if (!isDragging) return;
                isDragging = false;
                cancelAnimationFrame(rafId);
                const topCard = getTopCard();
                topCard.style.cursor = 'grab';
                if (Math.abs(currentX) > 80 || Math.abs(velocity) > 0.4) {
                    const dir = Math.abs(currentX) > 80 ? (currentX > 0 ? 1 : -1) : (velocity > 0 ? 1 : -1);
                    throwCard(dir, Math.abs(velocity));
                } else {
                    snapBack(topCard);
                }
                currentX = 0; velocity = 0;
            }

            if (stackEl) {
                stackEl.addEventListener('mousedown', onPointerDown);
                window.addEventListener('mousemove', onPointerMove);
                window.addEventListener('mouseup', onPointerUp);
                stackEl.addEventListener('touchstart', e => {
                    e.preventDefault();
                    const t = e.touches[0];
                    onPointerDown({ clientX: t.clientX, target: e.target, closest: sel => e.target.closest(sel) });
                }, { passive: false });
                window.addEventListener('touchmove', e => {
                    if (!isDragging) return;
                    e.preventDefault();
                    onPointerMove({ clientX: e.touches[0].clientX });
                }, { passive: false });
                window.addEventListener('touchend', onPointerUp);

                let autoPlay = setInterval(() => throwCard(-1, 0.5), 5000);
                stackEl.addEventListener('mouseenter', () => clearInterval(autoPlay));
                stackEl.addEventListener('mouseleave', () => { autoPlay = setInterval(() => throwCard(-1, 0.5), 5000); });
            }

            layoutStack(false);

            ScrollTrigger.create({
                trigger: '.lp-card-stack-area', start: 'top 85%', once: true,
                onEnter: () => {
                    cards.forEach((card, i) => {
                        const pos = (i - current + TOTAL) % TOTAL;
                        gsap.from(card, { y: 200, scale: 0.5, opacity: 0, rotateZ: (Math.random() - 0.5) * 20, duration: 1, delay: 0.1 + pos * 0.1, ease: 'power4.out' });
                    });
                    gsap.from('.lp-drag-hint', { opacity: 0, y: 20, duration: 0.6, delay: 0.9 });
                    gsap.from('.lp-stack-progress', { opacity: 0, y: 15, duration: 0.5, delay: 1.1 });
                },
            });

            // Cleanup scroll listener on unmount
            return () => {
                window.removeEventListener('scroll', onScroll);
                window.removeEventListener('mousemove', onPointerMove);
                window.removeEventListener('mouseup', onPointerUp);
                window.removeEventListener('touchend', onPointerUp);
                ScrollTrigger.getAll().forEach(t => t.kill());
            };
        };

        let cleanupFn = null;

        Promise.all([
            loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js', () => window.gsap),
        ]).then(() =>
            loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js', () => window.gsap && window.ScrollTrigger)
        ).then(() =>
            loadScript('https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/TextPlugin.min.js', () => window.gsap && window.TextPlugin)
        ).then(() => {
            // Need a tiny delay just to make sure the plugins finish registering themselves to window
            setTimeout(() => {
                cleanupFn = initAnimations();
            }, 50);
        }).catch(console.error);

        return () => {
            if (cleanupFn) cleanupFn();
            if (window.ScrollTrigger) window.ScrollTrigger.getAll().forEach(t => t.kill());
        };
    }, []);

    const handleGetStarted = (e) => {
        e.preventDefault();
        const curtain = document.getElementById('lp-curtain');
        const cTop = document.querySelector('.lp-curtain-top');
        const cBottom = document.querySelector('.lp-curtain-bottom');
        if (!curtain || !window.gsap) { navigate('/welcome'); return; }
        curtain.classList.add('active');
        window.gsap.to([cTop, cBottom], {
            height: '50%', duration: 0.8, ease: 'power4.inOut',
            onComplete: () => navigate('/welcome'),
        });
    };

    return (
        <div className="landing-root">
            {/* Split curtain */}
            <div className="lp-curtain" id="lp-curtain">
                <div className="lp-curtain-top"></div>
                <div className="lp-curtain-bottom"></div>
            </div>

            {/* Grain */}
            <div className="lp-grain"></div>

            {/* Halos */}
            <div className="lp-halo lp-halo-1"></div>
            <div className="lp-halo lp-halo-2"></div>
            <div className="lp-halo lp-halo-3"></div>

            {/* Floating shapes */}
            <div className="lp-floaters">
                <div className="lp-floater lp-f-ring"></div>
                <div className="lp-floater lp-f-cross"></div>
                <div className="lp-floater lp-f-dot lp-f-dot-1"></div>
                <div className="lp-floater lp-f-dot lp-f-dot-2"></div>
                <div className="lp-floater lp-f-diamond"></div>
                <div className="lp-floater lp-f-line lp-f-line-1"></div>
                <div className="lp-floater lp-f-line lp-f-line-2"></div>
                <div className="lp-floater lp-f-circle"></div>
            </div>

            {/* Scroll progress */}
            <div className="lp-scroll-bar" id="lp-scrollBar"></div>

            {/* Nav */}
            <nav className="lp-nav" id="lp-nav">
                <div className="lp-nav-logo">[HTM]</div>
                <div className="lp-nav-links">
                    <a href="#lp-what">What</a>
                    <a href="#lp-why">Why</a>
                    <a href="#lp-how">How</a>
                    <a href="#lp-who">Who</a>
                </div>
                <button className="lp-nav-btn" onClick={handleGetStarted}>Get Started →</button>
            </nav>

            <main>
                {/* ══════ HERO ══════ */}
                <section className="lp-hero" id="lp-hero">
                    <div className="lp-hero-inner">
                        <div className="lp-hero-tag" id="lp-heroTag">
                            <span className="lp-tag-pulse"></span>
                            <span id="lp-tagText">Hackathon Management, Reimagined</span>
                        </div>

                        <h1 className="lp-hero-h1" id="lp-heroH1">
                            <span className="lp-h1-line"><span className="lp-h1-word">Hackathon</span></span>
                            <span className="lp-h1-line"><span className="lp-h1-word">Team</span></span>
                            <span className="lp-h1-line"><span className="lp-h1-word lp-gradient-text">Management</span></span>
                            <span className="lp-h1-line"><span className="lp-h1-word lp-gradient-text">Platform</span></span>
                        </h1>

                        <p className="lp-hero-desc" id="lp-heroDesc">
                            A simple system to manage hackathon teams, track project<br />
                            progress, and run events — without spreadsheets.
                        </p>

                        <div className="lp-hero-meta" id="lp-heroMeta">
                            <div className="lp-meta-col">
                                <span className="lp-meta-label">BUILT FOR</span>
                                <span className="lp-meta-val"><span id="lp-typewriter"></span><span className="lp-tw-cursor">|</span></span>
                            </div>
                            <div className="lp-meta-sep"></div>
                            <div className="lp-meta-col">
                                <span className="lp-meta-label">DESIGNED FOR</span>
                                <span className="lp-meta-val">Fast-moving teams</span>
                            </div>
                        </div>

                        <div className="lp-hero-btns" id="lp-heroBtns">
                            <button className="lp-btn-primary" onClick={handleGetStarted}>
                                <span>Get Started</span>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>
                            <a href="#lp-what" className="lp-btn-outline">Learn More</a>
                        </div>
                    </div>

                    <div className="lp-scroll-cue" id="lp-scrollCue">
                        <div className="lp-cue-mouse"><div className="lp-cue-dot"></div></div>
                        <span>SCROLL</span>
                    </div>
                </section>

                {/* ══════ WHAT ══════ */}
                <section className="lp-sec lp-sec-what" id="lp-what">
                    <div className="lp-pin-wrap-what">
                        <div className="lp-what-pin" id="lp-whatPin">
                            <div className="lp-what-head">
                                <span className="lp-sec-num">01</span>
                                <h2 className="lp-sec-h2" data-lp-reveal="">What does this platform do?</h2>
                                <p className="lp-sec-sub">It gives you <strong>one place</strong> to run everything.</p>
                            </div>
                            <div className="lp-what-rail" id="lp-whatRail">
                                <article className="lp-w-card">
                                    <div className="lp-w-card-num">01</div>
                                    <div className="lp-w-card-icon">
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                        </svg>
                                    </div>
                                    <h3>Manage Teams</h3>
                                    <p>Create, organize, and manage teams and projects from a single dashboard.</p>
                                </article>
                                <article className="lp-w-card">
                                    <div className="lp-w-card-num">02</div>
                                    <div className="lp-w-card-icon">
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                        </svg>
                                    </div>
                                    <h3>Track Progress</h3>
                                    <p>Real-time progress tracking for every team. See who&apos;s ahead and who needs help.</p>
                                </article>
                                <article className="lp-w-card">
                                    <div className="lp-w-card-num">03</div>
                                    <div className="lp-w-card-icon">
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                                        </svg>
                                    </div>
                                    <h3>Collect Reports</h3>
                                    <p>Teams submit once. Organizers access everything cleanly and automatically.</p>
                                </article>
                                <article className="lp-w-card">
                                    <div className="lp-w-card-num">04</div>
                                    <div className="lp-w-card-icon">
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                                            <line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
                                        </svg>
                                    </div>
                                    <h3>Monitor Everything</h3>
                                    <p>One dashboard. Every team. Every project. The entire hackathon at a glance.</p>
                                </article>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ══════ WHY ══════ */}
                <section className="lp-sec lp-sec-why" id="lp-why">
                    <div className="lp-contain">
                        <span className="lp-sec-num">02</span>
                        <h2 className="lp-sec-h2" data-lp-reveal="">Why is this needed?</h2>
                        <p className="lp-highlight-para" id="lp-hlPara">
                            Hackathons usually fail at management, not ideas. Progress updates get scattered. Reports get lost.
                            Organizers keep asking for status. Judging becomes rushed and unclear.
                        </p>
                        <div className="lp-divider-line" id="lp-divLine"></div>
                        <p className="lp-resolve-text" data-lp-reveal="">This platform <span className="lp-gradient-text">removes that friction</span>.</p>
                        <div className="lp-counters">
                            <div className="lp-counter-box" data-lp-anim="pop">
                                <div className="lp-counter-val" data-count="1">0</div>
                                <span>update from teams</span>
                            </div>
                            <div className="lp-counter-box" data-lp-anim="pop">
                                <div className="lp-counter-val" data-count="100">0</div>
                                <span>% visibility for organizers</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ══════ HOW ══════ */}
                <section className="lp-sec lp-sec-how" id="lp-how">
                    <div className="lp-contain">
                        <span className="lp-sec-num">03</span>
                        <h2 className="lp-sec-h2" data-lp-reveal="">How it changes a hackathon</h2>
                        <div className="lp-stack-cards">
                            <div className="lp-s-card" data-lp-anim="stack">
                                <div className="lp-s-card-inner">
                                    <span className="lp-s-icon">⚡</span>
                                    <h3>Focus on Building</h3>
                                    <p>Teams focus on building, not reporting.</p>
                                </div>
                            </div>
                            <div className="lp-s-card" data-lp-anim="stack">
                                <div className="lp-s-card-inner">
                                    <span className="lp-s-icon">🎯</span>
                                    <h3>Stop Chasing</h3>
                                    <p>Organizers stop chasing updates.</p>
                                </div>
                            </div>
                            <div className="lp-s-card" data-lp-anim="stack">
                                <div className="lp-s-card-inner">
                                    <span className="lp-s-icon">📊</span>
                                    <h3>Visible Progress</h3>
                                    <p>Progress becomes visible, not guessed.</p>
                                </div>
                            </div>
                            <div className="lp-s-card" data-lp-anim="stack">
                                <div className="lp-s-card-inner">
                                    <span className="lp-s-icon">🏆</span>
                                    <h3>Fair Events</h3>
                                    <p>Events run smoother and fairer.</p>
                                </div>
                            </div>
                        </div>
                        <div className="lp-mantra" id="lp-mantra">
                            <span className="lp-m-word">Less</span>
                            <span className="lp-m-word">chaos.</span>
                            <span className="lp-m-word lp-gradient-text">More</span>
                            <span className="lp-m-word lp-gradient-text">momentum.</span>
                        </div>
                    </div>
                </section>

                {/* ══════ WHO ══════ */}
                <section className="lp-sec lp-sec-who" id="lp-who">
                    <div className="lp-contain lp-who-contain">
                        <span className="lp-sec-num">04</span>
                        <h2 className="lp-sec-h2" data-lp-reveal="">Who should use this?</h2>
                        <div className="lp-card-stack-area">
                            <div className="lp-card-stack" id="lp-cardStack">
                                <div className="lp-deck-card" data-idx="3">
                                    <div className="lp-dc-tag"><span className="lp-dc-dot"></span>Events</div>
                                    <div className="lp-dc-body">Why can&apos;t multi-team event managers see all projects, deadlines, and submissions in one place?</div>
                                    <div className="lp-dc-footer"><span className="lp-dc-num">04</span><span className="lp-dc-label">/ 04</span></div>
                                </div>
                                <div className="lp-deck-card" data-idx="2">
                                    <div className="lp-dc-tag"><span className="lp-dc-dot"></span>Innovation</div>
                                    <div className="lp-dc-body">Why is it so hard for innovation challenge organizers to track real-time team progress?</div>
                                    <div className="lp-dc-footer"><span className="lp-dc-num">03</span><span className="lp-dc-label">/ 04</span></div>
                                </div>
                                <div className="lp-deck-card" data-idx="1">
                                    <div className="lp-dc-tag"><span className="lp-dc-dot"></span>Enterprise</div>
                                    <div className="lp-dc-body">Why do internal company hackathons still rely on email chains and manual status updates?</div>
                                    <div className="lp-dc-footer"><span className="lp-dc-num">02</span><span className="lp-dc-label">/ 04</span></div>
                                </div>
                                <div className="lp-deck-card" data-idx="0">
                                    <div className="lp-dc-tag"><span className="lp-dc-dot"></span>College</div>
                                    <div className="lp-dc-body">Why can&apos;t college hackathon organizers manage 50+ teams without drowning in spreadsheets?</div>
                                    <div className="lp-dc-footer"><span className="lp-dc-num">01</span><span className="lp-dc-label">/ 04</span></div>
                                </div>
                            </div>
                            <div className="lp-drag-hint" id="lp-dragHint">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 12H5M5 12l7-7M5 12l7 7" /></svg>
                                <span>DRAG TO SWIPE</span>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                            </div>
                            <div className="lp-stack-progress" id="lp-stackProgress">
                                <div className="lp-sp-bar"><div className="lp-sp-fill" id="lp-spFill"></div></div>
                                <span className="lp-sp-text" id="lp-spText">1 of 4</span>
                            </div>
                        </div>
                        <p className="lp-who-end" data-lp-anim="pop">
                            If you manage teams building in parallel, <strong>this fits</strong>.
                        </p>
                    </div>
                </section>

                {/* ══════ CLOSING ══════ */}
                <section className="lp-sec lp-sec-closing" id="lp-closing">
                    <div className="lp-closing-inner">
                        <span className="lp-closing-label" data-lp-anim="pop">A Better Way to Run Hackathons</span>
                        <h2 className="lp-closing-h2">
                            <span className="lp-cl-line" data-lp-anim="pop">Stop managing chaos.</span>
                            <span className="lp-cl-line" data-lp-anim="pop">Start running events with <span className="lp-gradient-text">clarity</span>.</span>
                        </h2>
                        <div className="lp-closing-cta" data-lp-anim="pop">
                            <button className="lp-btn-primary lp-btn-big lp-pulse-btn" id="lp-finalBtn" onClick={handleGetStarted}>
                                <span>Get Started Now</span>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                        <div className="lp-closing-stats" data-lp-anim="pop">
                            <div className="lp-c-stat">
                                <div className="lp-c-stat-val lp-ctr" data-count="0">0</div>
                                <div className="lp-c-stat-lbl">Spreadsheets needed</div>
                            </div>
                            <div className="lp-c-stat">
                                <div className="lp-c-stat-val lp-ctr" data-count="1">0</div>
                                <div className="lp-c-stat-lbl">Dashboard for everything</div>
                            </div>
                            <div className="lp-c-stat">
                                <div className="lp-c-stat-val">∞</div>
                                <div className="lp-c-stat-lbl">Less chaos</div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="lp-footer">Built with clarity. Designed for momentum.</footer>
        </div>
    );
};

export default LandingPage;
