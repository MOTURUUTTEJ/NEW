/* ═══════════════════════════════════════════════
   RAZORPAY-STYLE ANIMATION ENGINE
   ═══════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", () => {
    gsap.registerPlugin(ScrollTrigger, TextPlugin);
    const isMobile = window.innerWidth <= 768;

    // ── 1. SCROLL PROGRESS ──
    const scrollBar = document.getElementById("scrollBar");
    window.addEventListener("scroll", () => {
        const pct = (document.documentElement.scrollTop / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        scrollBar.style.width = pct + "%";
    });

    // ── 2. FLOATING SHAPES — PARALLAX ──
    if (!isMobile) {
        gsap.to(".f-ring", { y: -80, x: 40, rotation: 360, duration: 22, repeat: -1, yoyo: true, ease: "sine.inOut" });
        gsap.to(".f-cross", { y: 50, x: -30, rotation: -180, duration: 18, repeat: -1, yoyo: true, ease: "sine.inOut" });
        gsap.to(".f-dot-1", { y: -40, x: 60, duration: 14, repeat: -1, yoyo: true, ease: "sine.inOut" });
        gsap.to(".f-dot-2", { y: 30, x: -20, duration: 11, repeat: -1, yoyo: true, ease: "sine.inOut" });
        gsap.to(".f-diamond", { y: -50, x: 30, rotation: 180, duration: 16, repeat: -1, yoyo: true, ease: "sine.inOut" });
        gsap.to(".f-circle", { y: 40, x: -25, duration: 13, repeat: -1, yoyo: true, ease: "sine.inOut" });

        // Parallax on scroll
        gsap.to(".floaters", {
            scrollTrigger: { trigger: "body", start: "top top", end: "bottom bottom", scrub: 2 },
            y: -350,
        });
    }

    // ── 3. HERO SEQUENCE ──
    const tl = gsap.timeline({ delay: 0.3 });

    // Text scramble on badge
    function scramble(el, text) {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&";
        let i = 0;
        const iv = setInterval(() => {
            el.textContent = text.split("").map((c, j) => j < i ? text[j] : chars[Math.floor(Math.random() * chars.length)]).join("");
            i += 0.5;
            if (i >= text.length) { el.textContent = text; clearInterval(iv); }
        }, 25);
    }

    tl.to(".h1-word", {
        y: 0, opacity: 1,
        duration: 0.9, ease: "power4.out",
        stagger: { amount: 0.6 },
    })
        .to("#heroTag", {
            opacity: 1, duration: 0.4,
            onComplete: () => scramble(document.getElementById("tagText"), "HACKATHON MANAGEMENT, REIMAGINED"),
        }, "-=0.3")
        .to("#heroDesc", { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, "-=0.2")
        .to("#heroMeta", { opacity: 1, duration: 0.5 }, "-=0.2")
        .to("#heroBtns", { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.7)" }, "-=0.1")
        .to("#scrollCue", { opacity: 1, duration: 0.6 }, "-=0.2")
        .call(startTypewriter, null, "-=0.4");

    // ── 4. TYPEWRITER ──
    const words = ["Hackathon organizers", "Event coordinators", "Innovation leads", "Community builders"];
    let wi = 0;

    function startTypewriter() {
        const el = document.getElementById("typewriter");
        function next() {
            const w = words[wi % words.length];
            gsap.to(el, {
                duration: w.length * 0.06,
                text: { value: w }, ease: "none",
                onComplete: () => {
                    gsap.delayedCall(1.5, () => {
                        gsap.to(el, {
                            duration: w.length * 0.03,
                            text: { value: "" }, ease: "none",
                            onComplete: () => { wi++; gsap.delayedCall(0.3, next); },
                        });
                    });
                },
            });
        }
        next();
    }

    // ── 5. NAV ──
    const nav = document.getElementById("nav");
    ScrollTrigger.create({
        trigger: "#what",
        start: "top 80%",
        onEnter: () => nav.classList.add("show"),
        onLeaveBack: () => nav.classList.remove("show"),
    });

    ScrollTrigger.create({
        trigger: "#what", start: "top 90%",
        onEnter: () => gsap.to("#scrollCue", { opacity: 0, duration: 0.3 }),
        onLeaveBack: () => gsap.to("#scrollCue", { opacity: 1, duration: 0.3 }),
    });

    // ── 6. SECTION TITLE REVEALS ──
    document.querySelectorAll("[data-reveal]").forEach(el => {
        const text = el.textContent;
        el.innerHTML = text.split(" ").map(w => `<span class="word"><span class="w-i">${w}</span></span>`).join(" ");

        gsap.from(el.querySelectorAll(".w-i"), {
            scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" },
            y: "120%", rotateX: -60, opacity: 0,
            duration: 0.8, ease: "power4.out", stagger: 0.05,
        });
    });

    // ── 7. HORIZONTAL SCROLL — WHAT ──
    const whatRail = document.getElementById("whatRail");
    const wCards = whatRail.querySelectorAll(".w-card");
    const totalW = wCards.length * 340;

    gsap.to(whatRail, {
        x: () => -(totalW - window.innerWidth + 200),
        ease: "none",
        scrollTrigger: {
            trigger: ".pin-wrap-what",
            start: "top top",
            end: () => `+=${totalW}`,
            pin: ".what-pin",
            scrub: 1,
            anticipatePin: 1,
        },
    });

    wCards.forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: ".pin-wrap-what",
                start: () => `top+=${i * 180} top`,
                toggleActions: "play none none none",
            },
            opacity: 0, y: 50, scale: 0.92,
            duration: 0.8, ease: "power3.out",
        });
    });

    // 3D tilt
    if (!isMobile) {
        document.querySelectorAll(".w-card, .s-card").forEach(card => {
            card.addEventListener("mousemove", e => {
                const r = card.getBoundingClientRect();
                const x = ((e.clientX - r.left) / r.width - 0.5) * 8;
                const y = ((e.clientY - r.top) / r.height - 0.5) * -8;
                card.style.transform = `perspective(800px) rotateX(${y}deg) rotateY(${x}deg) translateY(-4px)`;
            });
            card.addEventListener("mouseleave", () => {
                gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.5, ease: "elastic.out(1, 0.6)", clearProps: "transform" });
            });
        });
    }

    // ── 8. WHY — SCROLL HIGHLIGHT ──
    const hlPara = document.getElementById("hlPara");
    if (hlPara) {
        const txt = hlPara.textContent.trim();
        hlPara.innerHTML = txt.split(/\s+/).map(w => `<span class="hl-word">${w} </span>`).join("");

        const hlWords = hlPara.querySelectorAll(".hl-word");
        ScrollTrigger.create({
            trigger: hlPara,
            start: "top 85%",
            end: "bottom 30%",
            scrub: 0.3,
            onUpdate: (self) => {
                const count = Math.floor(self.progress * hlWords.length);
                hlWords.forEach((w, i) => w.classList.toggle("lit", i <= count));
            },
        });
    }

    // Divider line draw
    const divLine = document.getElementById("divLine");
    if (divLine) {
        ScrollTrigger.create({
            trigger: divLine, start: "top 85%",
            onEnter: () => divLine.classList.add("drawn"),
        });
    }

    // Counters
    document.querySelectorAll(".counter-val").forEach(c => {
        const target = parseInt(c.dataset.count);
        ScrollTrigger.create({
            trigger: c, start: "top 88%",
            onEnter: () => {
                gsap.to({ v: 0 }, {
                    v: target, duration: 1.5, ease: "power2.out",
                    onUpdate() { c.textContent = Math.round(this.targets()[0].v); },
                });
            },
            once: true,
        });
    });

    // ── 9. HOW — STACKING CARDS ──
    document.querySelectorAll('[data-anim="stack"]').forEach(card => {
        ScrollTrigger.create({
            trigger: card, start: "top 92%",
            onEnter: () => card.classList.add("vis"),
            once: true,
        });
    });

    // Mantra words
    document.querySelectorAll(".m-word").forEach((word, i) => {
        gsap.to(word, {
            scrollTrigger: { trigger: word, start: "top 90%", toggleActions: "play none none none" },
            opacity: 1, y: 0,
            duration: 0.8, delay: i * 0.1, ease: "power4.out",
        });
    });

    // ── 10. POP ANIMATIONS ──
    document.querySelectorAll('[data-anim="pop"]').forEach((el, i) => {
        gsap.to(el, {
            scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "play none none none" },
            opacity: 1, y: 0, scale: 1,
            duration: 0.6, delay: i * 0.05, ease: "back.out(1.5)",
        });
    });

    // ── 11. CLOSING STATS COUNTERS ──
    document.querySelectorAll(".ctr").forEach(c => {
        const target = parseInt(c.dataset.count);
        ScrollTrigger.create({
            trigger: c, start: "top 90%",
            onEnter: () => {
                gsap.to({ v: 0 }, {
                    v: target, duration: 1.5, ease: "power2.out",
                    onUpdate() { c.textContent = Math.round(this.targets()[0].v); },
                });
            },
            once: true,
        });
    });

    // ── 12. HALO PARALLAX ──
    gsap.to(".halo-1", {
        scrollTrigger: { trigger: "body", start: "top top", end: "bottom bottom", scrub: 2 },
        y: -500, x: 200,
    });
    gsap.to(".halo-2", {
        scrollTrigger: { trigger: "body", start: "top top", end: "bottom bottom", scrub: 2 },
        y: -700, x: -150,
    });
    gsap.to(".halo-3", {
        scrollTrigger: { trigger: "body", start: "top top", end: "bottom bottom", scrub: 2 },
        y: -350,
    });

    // ── 13. SECTION GLOW ON ENTER ──
    document.querySelectorAll(".sec").forEach(sec => {
        ScrollTrigger.create({
            trigger: sec, start: "top 90%",
            onEnter: () => {
                gsap.fromTo(sec,
                    { borderTopColor: "rgba(31, 81, 255, 0.3)" },
                    { borderTopColor: "rgba(255, 255, 255, 0.06)", duration: 1.5, ease: "power2.out" }
                );
            },
        });
    });

    // ── 14. DRAGGABLE CARD STACK (ULTRA SMOOTH) ──
    const cards = gsap.utils.toArray(".deck-card");
    const stack = document.getElementById("cardStack");
    const spFill = document.getElementById("spFill");
    const spText = document.getElementById("spText");
    const dragHint = document.getElementById("dragHint");
    const TOTAL = cards.length;
    let current = 0;
    let isDragging = false;
    let startX = 0;
    let currentX = 0;
    let velocity = 0;
    let lastX = 0;
    let lastTime = 0;
    let rafId = null;
    let hintHidden = false;

    // Smooth lerp for drag
    let targetX = 0;
    let smoothX = 0;
    let smoothRot = 0;

    function layoutStack(animate = true) {
        cards.forEach((card, i) => {
            const pos = (i - current + TOTAL) % TOTAL;
            const isTop = pos === 0;

            gsap.to(card, {
                y: pos * 14,
                scale: 1 - pos * 0.045,
                zIndex: TOTAL - pos,
                opacity: pos < 3 ? 1 - pos * 0.18 : 0,
                rotateZ: 0,
                rotateY: 0,
                x: 0,
                boxShadow: isTop
                    ? "0 30px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)"
                    : "0 10px 40px rgba(0,0,0,0.3)",
                duration: animate ? 0.7 : 0,
                ease: "power4.out",
                delay: animate ? pos * 0.06 : 0,
                overwrite: "auto",
            });

            card.style.pointerEvents = isTop ? "auto" : "none";
        });

        const pct = ((current + 1) / TOTAL) * 100;
        if (spFill) gsap.to(spFill, { width: pct + "%", duration: 0.5, ease: "power2.out" });
        if (spText) spText.textContent = `${current + 1} of ${TOTAL}`;
    }

    function throwCard(dir, throwVelocity) {
        const speed = Math.min(Math.max(Math.abs(throwVelocity || 0), 0.3), 2);
        const throwDist = 900 + speed * 200;
        const throwDur = Math.max(0.35, 0.6 - speed * 0.1);

        const topIdx = cards.findIndex((_, i) => (i - current + TOTAL) % TOTAL === 0);
        const topCard = cards[topIdx];

        // Throw with velocity-based duration
        gsap.to(topCard, {
            x: dir * throwDist,
            rotateZ: dir * (15 + speed * 10),
            rotateY: dir * -8,
            scale: 0.8,
            opacity: 0,
            duration: throwDur,
            ease: "power2.in",
            onComplete: () => {
                current = (current + 1) % TOTAL;
                layoutStack(true);

                if (!hintHidden && dragHint) {
                    hintHidden = true;
                    gsap.to(dragHint, { opacity: 0, y: -10, duration: 0.4, ease: "power2.in" });
                }
            }
        });

        // Parallax: push cards behind slightly opposite
        cards.forEach((card, i) => {
            const pos = (i - current + TOTAL) % TOTAL;
            if (pos > 0 && pos < 3) {
                gsap.to(card, {
                    x: dir * -15 * (3 - pos),
                    duration: 0.3,
                    ease: "power2.out",
                });
            }
        });
    }

    function snapBack(card) {
        gsap.to(card, {
            x: 0, rotateZ: 0, rotateY: 0, scale: 1,
            boxShadow: "0 30px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
            duration: 0.8,
            ease: "elastic.out(1, 0.4)",
            overwrite: "auto",
        });

        // Reset behind cards
        cards.forEach((card, i) => {
            const pos = (i - current + TOTAL) % TOTAL;
            if (pos > 0 && pos < 3) {
                gsap.to(card, { x: 0, duration: 0.5, ease: "power3.out" });
            }
        });
    }

    function getTopCard() {
        return cards.find((_, i) => (i - current + TOTAL) % TOTAL === 0);
    }

    // Smooth drag loop (60fps interpolation)
    function dragLoop() {
        if (!isDragging) return;

        smoothX += (targetX - smoothX) * 0.25;
        smoothRot += (targetX * 0.06 - smoothRot) * 0.2;

        const topCard = getTopCard();
        const progress = Math.abs(smoothX) / 300; // 0 → 1
        const opa = Math.max(0.5, 1 - progress * 0.5);
        const sc = Math.max(0.92, 1 - progress * 0.08);
        const shadowBlur = 30 + progress * 60;
        const shadowAlpha = 0.5 - progress * 0.2;

        gsap.set(topCard, {
            x: smoothX,
            rotateZ: smoothRot,
            rotateY: smoothX * -0.015,
            scale: sc,
            opacity: opa,
            boxShadow: `0 ${shadowBlur}px ${shadowBlur * 2}px rgba(0,0,0,${shadowAlpha})`,
        });

        // Subtle parallax on behind cards
        cards.forEach((card, i) => {
            const pos = (i - current + TOTAL) % TOTAL;
            if (pos === 1) {
                gsap.set(card, { x: smoothX * -0.08 });
            } else if (pos === 2) {
                gsap.set(card, { x: smoothX * -0.04 });
            }
        });

        rafId = requestAnimationFrame(dragLoop);
    }

    function onPointerDown(e) {
        const topCard = getTopCard();
        if (e.target.closest(".deck-card") !== topCard) return;
        isDragging = true;
        startX = e.clientX || 0;
        targetX = 0;
        smoothX = 0;
        smoothRot = 0;
        currentX = 0;
        velocity = 0;
        lastX = startX;
        lastTime = Date.now();
        topCard.style.cursor = "grabbing";

        gsap.killTweensOf(topCard);
        dragLoop();
    }

    function onPointerMove(e) {
        if (!isDragging) return;
        const x = e.clientX || 0;
        const now = Date.now();
        const dt = Math.max(now - lastTime, 1);

        velocity = (x - lastX) / dt;
        lastX = x;
        lastTime = now;

        targetX = x - startX;
        currentX = targetX;
    }

    function onPointerUp() {
        if (!isDragging) return;
        isDragging = false;
        cancelAnimationFrame(rafId);

        const topCard = getTopCard();
        topCard.style.cursor = "grab";

        const throwThreshold = 80;
        const velocityThreshold = 0.4;

        if (Math.abs(currentX) > throwThreshold || Math.abs(velocity) > velocityThreshold) {
            const dir = (Math.abs(currentX) > throwThreshold)
                ? (currentX > 0 ? 1 : -1)
                : (velocity > 0 ? 1 : -1);
            throwCard(dir, Math.abs(velocity));
        } else {
            snapBack(topCard);
        }

        currentX = 0;
        velocity = 0;
    }

    // Events
    stack.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);

    stack.addEventListener("touchstart", e => {
        e.preventDefault();
        const t = e.touches[0];
        onPointerDown({ clientX: t.clientX, target: e.target, closest: sel => e.target.closest(sel) });
    }, { passive: false });

    window.addEventListener("touchmove", e => {
        if (!isDragging) return;
        e.preventDefault();
        onPointerMove({ clientX: e.touches[0].clientX });
    }, { passive: false });

    window.addEventListener("touchend", onPointerUp);

    // Auto-play
    let autoPlay = setInterval(() => throwCard(-1, 0.5), 5000);
    stack.addEventListener("mouseenter", () => clearInterval(autoPlay));
    stack.addEventListener("mouseleave", () => { autoPlay = setInterval(() => throwCard(-1, 0.5), 5000); });

    // Initial layout
    layoutStack(false);

    // Entrance
    ScrollTrigger.create({
        trigger: ".card-stack-area",
        start: "top 85%",
        once: true,
        onEnter: () => {
            cards.forEach((card, i) => {
                const pos = (i - current + TOTAL) % TOTAL;
                gsap.from(card, {
                    y: 200, scale: 0.5, opacity: 0, rotateZ: (Math.random() - 0.5) * 20,
                    duration: 1, delay: 0.1 + pos * 0.1,
                    ease: "power4.out",
                });
            });
            gsap.from(".drag-hint", { opacity: 0, y: 20, duration: 0.6, delay: 0.9 });
            gsap.from(".stack-progress", { opacity: 0, y: 15, duration: 0.5, delay: 1.1 });
        },
    });

    // ── 15. SPLIT CURTAIN TRANSITION (GET STARTED) ──
    const getStartedBtns = document.querySelectorAll('.nav-btn, .hero-btns .btn-primary, #finalBtn');
    const curtain = document.getElementById('curtain');
    const cTop = document.querySelector('.curtain-top');
    const cBottom = document.querySelector('.curtain-bottom');

    getStartedBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default anchor jump

            curtain.classList.add('active');

            // Animate curtains opening from the middle to cover the screen
            gsap.to([cTop, cBottom], {
                height: "50%",
                duration: 0.8,
                ease: "power4.inOut",
                onComplete: () => {
                    // Here you can redirect the user to the next page
                    window.location.href = "/welcome";

                    // For now, let's just hold it there.
                    console.log("Curtain closed. Transitioning to app...");
                }
            });
        });
    });
});
