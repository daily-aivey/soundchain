"use client";

import AOS from "aos";

import Head from "next/head";
import { useEffect, useState } from "react";

function showToast({ title, message, icon }) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  const displayIcon = typeof icon === "string" ? icon : "🎉";
  toast.innerHTML = `
    <div class="toast-icon">${displayIcon}</div>
    <div>
      <div class="toast-title">${title}</div>
      <div class="toast-text">${message}</div>
    </div>
    <button type="button" class="toast-close" aria-label="Close">&times;</button>
    <div class="toast-progress"></div>
  `;
  document.body.appendChild(toast);

  // enable interactions (CSS base had pointer-events: none)
  toast.style.pointerEvents = 'auto';

  // start show animation
  // use rAF to ensure the element is in the DOM before toggling the class
  requestAnimationFrame(() => {
    toast.classList.add('show');
    const bar = toast.querySelector('.toast-progress');
    if (bar) bar.classList.add('run');
    // Set the progress bar animation duration to 6000ms
    if (bar) bar.style.setProperty('animation-duration', '6000ms');
  });

  // --- improved lifecycle so the toast never gets stuck ---
  const DURATION = 6000;
  let hideTimer;

  const pause = () => {
    const bar = toast.querySelector('.toast-progress');
    if (bar) bar.style.animationPlayState = 'paused';
    if (hideTimer) clearTimeout(hideTimer);
  };

  const resume = () => {
    const bar = toast.querySelector('.toast-progress');
    if (bar) bar.style.animationPlayState = 'running';
    // give the user ~1.5s to move the mouse away, then hide
    hideTimer = setTimeout(close, 1500);
  };

  const close = () => {
    // cleanup listeners & timers to avoid leaks
    toast.removeEventListener('mouseenter', pause);
    toast.removeEventListener('mouseleave', resume);
    if (hideTimer) clearTimeout(hideTimer);
    toast.classList.remove('show');
    toast.classList.add('hide'); // matches `.toast.hide` in CSS
    setTimeout(() => toast.remove(), 260);
  };

  const closeBtn = toast.querySelector('.toast-close');
  if (closeBtn) closeBtn.addEventListener('click', close);

  // auto-hide after DURATION (same as progress bar)
  hideTimer = setTimeout(close, DURATION);

  // pause on hover, resume on mouse leave
  toast.addEventListener('mouseenter', pause);
  toast.addEventListener('mouseleave', resume);

  // hard safety: if something pauses forever, force close later
  setTimeout(() => {
    if (document.body.contains(toast)) close();
  }, DURATION + 3000);
}

export default function Home() {
  const [progress, setProgress] = useState(0);
  const [progressVisible, setProgressVisible] = useState(false);
  const [segments, setSegments] = useState([]);
  const [email, setEmail] = useState("");
  const [joinedCount, setJoinedCount] = useState(0);
  const [targetProgress, setTargetProgress] = useState(0);
  const GOAL = 5000;

  useEffect(() => {
    AOS.init({
      duration: 600, // rychlejší animace
      once: true,
      offset: 150,   // spustí dřív
    });
  }, []);



  // Init: fetch counts, set up observer and canvases (one-time)
  useEffect(() => {
    let observer, revealObserver;

    const init = async () => {
      // initialize progress/count from API
      try {
        const r = await fetch('/api/send', {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          cache: 'no-store'
        });
        const j = await r.json();
        if (typeof j.count === 'number' && typeof j.goal === 'number') {
          setJoinedCount(j.count);
          const pct = Math.max(0, Math.min(100, (j.count / j.goal) * 100));
          setTargetProgress(pct);
        }
      } catch (e) {}

      const target = document.getElementById('progress-section');

      // Helper to check initial visibility and set progress if already visible
      const ensureInitialProgress = () => {
        if (!target) return;
        const rect = target.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        // earlier: show when section is mostly in view
        const topTrigger = vh * 0.90;   // earlier: show when section is mostly in view
        const bottomTrigger = vh * 0.10;
        const inView = rect.top < topTrigger && rect.bottom > bottomTrigger;
        if (inView) {
          setProgressVisible(true);
          setProgress(targetProgress);
        }
      };

      observer = new IntersectionObserver(
        (entries) => {
          const e = entries[0];
          if (e.isIntersecting) {
            setProgressVisible(true);
            setProgress(targetProgress);
            observer.disconnect();
          }
        },
        {
          threshold: [0.15, 0.5, 0.75, 1],
          rootMargin: '0px 0px -10% 0px'
        }
      );

      if (target) {
        observer.observe(target);
        // in case the section is already in view on first render
        ensureInitialProgress();
      }

      const backgroundCanvas = document.getElementById('particles-background');
      if (backgroundCanvas) {
        const ctxBg = backgroundCanvas.getContext('2d');
        const dprBg = Math.min(window.devicePixelRatio || 1, 1.5);
        backgroundCanvas.width = Math.floor(window.innerWidth * dprBg);
        backgroundCanvas.height = Math.floor(window.innerHeight * dprBg);
        ctxBg.setTransform(dprBg, 0, 0, dprBg, 0, 0);

        const bgParticles = [];
        for (let i = 0; i < 120; i++) {
          bgParticles.push({
            x: Math.random() * backgroundCanvas.width,
            y: Math.random() * backgroundCanvas.height,
            radius: Math.random() * 3 + 1,
            dx: (Math.random() - 0.5) * 0.2,
            dy: (Math.random() - 0.5) * 0.2,
          });
        }

        function animateBgParticles() {
          ctxBg.clearRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
          bgParticles.forEach((p) => {
            ctxBg.beginPath();
            ctxBg.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctxBg.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctxBg.shadowColor = '#fff';
            ctxBg.shadowBlur = 4;
            ctxBg.fill();

            p.x += p.dx;
            p.y += p.dy;

            if (p.x <= 0 || p.x >= backgroundCanvas.width) p.dx *= -1;
            if (p.y <= 0 || p.y >= backgroundCanvas.height) p.dy *= -1;
          });
          requestAnimationFrame(animateBgParticles);
        }
        animateBgParticles();

        window.addEventListener('resize', () => {
          const dprBg2 = Math.min(window.devicePixelRatio || 1, 1.5);
          backgroundCanvas.width = Math.floor(window.innerWidth * dprBg2);
          backgroundCanvas.height = Math.floor(window.innerHeight * dprBg2);
          ctxBg.setTransform(dprBg2, 0, 0, dprBg2, 0, 0);
        }, { passive: true });
      }

      const canvas = document.getElementById('particles');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = Math.floor(window.innerWidth * dpr);
        canvas.height = Math.floor(window.innerHeight * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const particlesArray = [];

        function getComputedParticleColor() {
          return (
            getComputedStyle(document.documentElement)
              .getPropertyValue('--particle-color')
              .trim() || '#FFFFFF'
          );
        }

        let mouse = { x: null, y: null };
        let mouseSuppressed = false; // when true, ignore mouse attraction until next real movement

        // --- idle release control (20s idle) ---
        let lastMouseTs = performance.now();
        let releaseActive = false;
        let releaseStart = 0;
        const IDLE_MS = 20000;          // user idle threshold
        const RELEASE_MS = 5000;        // time to smoothly fade out mouse influence

        function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

        function triggerRelease(force = false) {
          const now = performance.now();
          // prevent re-triggering too often unless forced
          if (!force && releaseActive) return;
          releaseActive = true;
          releaseStart = now;

          // add a small one‑time outward + tangential impulse to break the ring
          const maxR = 200;
          for (const p of particlesArray) {
            if (mouse.x == null || mouse.y == null) break;
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.hypot(dx, dy) || 1;
            if (dist < maxR) {
              const nx = dx / dist;
              const ny = dy / dist;
              // radial impulse + a little swirl to avoid a perfect circle
              const tangential = 0.3;
              p.vx += nx * 0.6 - ny * tangential * (Math.random() * 0.6);
              p.vy += ny * 0.6 + nx * tangential * (Math.random() * 0.6);
            }
          }
        }

        // also release when the tab loses focus (alt‑tab)
        window.addEventListener('blur', () => triggerRelease(true));

        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'hidden') triggerRelease(true);
        });

        window.addEventListener('mousemove', (e) => {
          mouse.x = e.clientX;
          mouse.y = e.clientY;
          lastMouseTs = performance.now();
          mouseSuppressed = false; // user interacted again -> enable influence
          if (releaseActive) releaseActive = false;
        }, { passive: true });

        for (let i = 0; i < 70; i++) {
          const x = Math.random() * canvas.width;
          const y = Math.random() * canvas.height;
          particlesArray.push({
            x,
            y,
            baseX: x,
            baseY: y,
            radius: Math.random() * 2 + 1,
            color: getComputedParticleColor(),
            dx: (Math.random() - 0.5) * 0.5,
            dy: (Math.random() - 0.5) * 0.5,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
          });
        }

        let currentParticleColor = getComputedParticleColor();
        let frameCount = 0;

        function animate() {
          frameCount++;
          if (frameCount % 10 === 0) {
            currentParticleColor = getComputedParticleColor();
          }
          ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // --- mouse influence and idle-release logic ---
          const now = performance.now();
          // smoothly fade mouse influence during release
          let influence = 1;
          if (releaseActive) {
            const t = Math.min(1, (now - releaseStart) / RELEASE_MS);
            influence = 1 - easeOutCubic(t);
            if (t >= 1) {
              releaseActive = false;
              mouseSuppressed = true; // keep attraction off until user moves again
            }
          } else if (mouseSuppressed) {
            influence = 0; // no attraction while suppressed
          }

          // trigger release when the user is idle and a sizeable cluster exists
          if (
            !releaseActive &&
            !mouseSuppressed &&
            now - lastMouseTs > IDLE_MS &&
            mouse.x != null && mouse.y != null &&
            frameCount % 20 === 0
          ) {
            let nearby = 0;
            const radius = 160;
            for (let i = 0; i < particlesArray.length; i++) {
              const dx = particlesArray[i].x - mouse.x;
              const dy = particlesArray[i].y - mouse.y;
              if (dx * dx + dy * dy < radius * radius) nearby++;
            }
            if (nearby > 18) triggerRelease();
          }

          particlesArray.forEach((p) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = currentParticleColor;
            ctx.shadowColor = currentParticleColor;
            ctx.shadowBlur = 4;
            ctx.fill();

            p.x += p.dx;
            p.y += p.dy;

            // --- mouse force, faded by influence, no hard ring ---
            if (!mouseSuppressed && mouse.x != null && mouse.y != null) {
              const dx = mouse.x - p.x;
              const dy = mouse.y - p.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const maxDistance = 400;
              if (distance < maxDistance) {
                let force = 0.005 * (1 - distance / maxDistance);
                force *= influence; // fade to zero while releasing
                p.x += dx * force;
                p.y += dy * force;
              }
            }

            p.x += p.vx;
            p.y += p.vy;

            // --- velocity damping and soft clamp ---
            const damp = releaseActive ? 0.98 : 0.995; // a touch more damping during release
            p.vx *= damp;
            p.vy *= damp;

            // soft clamp instead of flipping sign (prevents oscillations)
            if (Math.abs(p.vx) > 0.35) p.vx *= 0.9;
            if (Math.abs(p.vy) > 0.35) p.vy *= 0.9;

            // boundaries (unchanged)
            if (p.x <= 0 || p.x >= canvas.width) p.vx *= -1;
            if (p.y <= 0 || p.y >= canvas.height) p.vy *= -1;

            if (p.x < 0 || p.x > canvas.width) p.dx = -p.dx;
            if (p.y < 0 || p.y > canvas.height) p.dy = -p.dy;
          });

          for (let i = 0; i < particlesArray.length; i++) {
            let connections = 0;
            for (let j = i + 1; j < particlesArray.length && connections < 3; j++) {
              const dx = particlesArray[i].x - particlesArray[j].x;
              const dy = particlesArray[i].y - particlesArray[j].y;
              const distance = Math.sqrt(dx * dx + dy * dy);

              if (distance < 120) {
                const opacity = 1 - distance / 120; // fade with distance
                ctx.beginPath();
                ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.3})`;
                ctx.lineWidth = 1;
                ctx.moveTo(particlesArray[i].x, particlesArray[i].y);
                ctx.lineTo(particlesArray[j].x, particlesArray[j].y);
                ctx.stroke();
                connections++;
              }
            }
          }

          requestAnimationFrame(animate);
        }

        animate();

        window.addEventListener('resize', () => {
          const dpr2 = Math.min(window.devicePixelRatio || 1, 1.5);
          canvas.width = Math.floor(window.innerWidth * dpr2);
          canvas.height = Math.floor(window.innerHeight * dpr2);
          ctx.setTransform(dpr2, 0, 0, dpr2, 0, 0);
        }, { passive: true });
      }

      const extraCanvas = document.getElementById('extra-particles');
      if (extraCanvas) {
        const ctxExtra = extraCanvas.getContext('2d');
        const dprExtra = Math.min(window.devicePixelRatio || 1, 1.5);
        extraCanvas.width = Math.floor(window.innerWidth * dprExtra);
        extraCanvas.height = Math.floor(window.innerHeight * dprExtra);
        ctxExtra.setTransform(dprExtra, 0, 0, dprExtra, 0, 0);

        const extraParticles = [];
        for (let i = 0; i < 100; i++) {
          extraParticles.push({
            x: Math.random() * extraCanvas.width,
            y: Math.random() * extraCanvas.height,
            radius: Math.random() * 2 + 1,
            dx: (Math.random() - 0.5) * 0.3,
            dy: (Math.random() - 0.5) * 0.3,
          });
        }

        function animateExtra() {
          ctxExtra.clearRect(0, 0, extraCanvas.width, extraCanvas.height);
          extraParticles.forEach((p) => {
            ctxExtra.beginPath();
            ctxExtra.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctxExtra.fillStyle = 'rgba(255,255,255,0.5)';
            ctxExtra.fill();

            p.x += p.dx;
            p.y += p.dy;

            if (p.x <= 0 || p.x >= extraCanvas.width) p.dx *= -1;
            if (p.y <= 0 || p.y >= extraCanvas.height) p.dy *= -1;
          });
          requestAnimationFrame(animateExtra);
        }
        animateExtra();

        window.addEventListener('resize', () => {
          const dprExtra2 = Math.min(window.devicePixelRatio || 1, 1.5);
          extraCanvas.width = Math.floor(window.innerWidth * dprExtra2);
          extraCanvas.height = Math.floor(window.innerHeight * dprExtra2);
          ctxExtra.setTransform(dprExtra2, 0, 0, dprExtra2, 0, 0);
        }, { passive: true });
      }
    };

    init();


    return () => {
      if (observer) observer.disconnect();
    };
  }, []); // one-time init

  // Reveal hero text/CTA after first user scroll
  useEffect(() => {
    const reveal = () => {
      document.body.classList.add("hero-revealed");
      document.querySelectorAll(".gate").forEach(el => {
        el.classList.remove("gate");
      });
      AOS.refresh(); // restartuje AOS animace po odstranění .gate
    };
    window.addEventListener('scroll', reveal, { once: true, passive: true });
    window.addEventListener('wheel', reveal, { once: true, passive: true });
    window.addEventListener('keydown', reveal, { once: true });
    window.addEventListener('touchstart', reveal, { once: true, passive: true });
    return () => {
      window.removeEventListener('scroll', reveal);
      window.removeEventListener('wheel', reveal);
      window.removeEventListener('keydown', reveal);
      window.removeEventListener('touchstart', reveal);
    };
  }, []);

  // React to changes in targetProgress or visibility and push the width
  useEffect(() => {
    if (progressVisible) {
      setProgress(targetProgress);
    }
  }, [targetProgress, progressVisible]);


  return (
    <>
      <div className="relative min-h-screen text-white font-inter flex flex-col justify-between">
        <canvas
          id="extra-particles"
          className="fixed top-0 left-0 w-full h-full z-15"
          style={{
            opacity: 0.6,
            pointerEvents: 'none'
          }}
        ></canvas>
        <div className="animated-gradient"></div>
        <canvas
          id="particles-background"
          className="fixed top-0 left-0 w-full h-full z-10"
          style={{
            opacity: 0.5,
            mixBlendMode: 'soft-light',
            pointerEvents: 'none'
          }}
        ></canvas>
        <canvas
          id="particles"
          className="fixed top-0 left-0 w-full h-full z-10"
          style={{
            opacity: 0.8,
            mixBlendMode: 'overlay'
          }}
        ></canvas>
        <div className="content-wrapper relative z-20">
          <>
            <Head>
              <title>SoundChain – Web3 Music Platform</title>
              <meta
                name="description"
                content="Join the future of music with Web3. Get early access to SoundChain."
              />
            </Head>

            {/* Main Content */}
            <main className="flex-grow">
              {/* Hero Section */}
              <header className="max-w-4xl mx-auto text-center py-12 px-4 overflow-visible relative">
                <div id="hero-seq" className="hero-seq">
                  {/* Logo */}
                  <div className="flex justify-center mb-[-60px]" data-aos="fade-up">
                    <img
                      src="/logo.png"
                      alt="SoundChain Logo"
                      className="w-[630px] max-w-full ml-[-0px] logo-pulse"
                    />
                  </div>

                  {/* Title */}
                  <h1
                    className="text-4xl md:text-6xl font-bold mb-8 leading-[1.15] hero-gradient-text hero-glow gate"
                    data-aos="fade-up"
                    data-aos-delay="200"
                  >
                    SoundChain – Music, Ownership, Community.
                  </h1>

                  {/* Description */}
                  <div data-aos="fade-up" data-aos-delay="400" className="gate">
                    <p className="text-lg md:text-xl mt-8 mb-5 hero-subtitle">
                      Own the music you love. Discover the future of music with Web3.
                    </p>
                    <p className="text-md md:text-lg text-gray-300 max-w-2xl mx-auto mt-2 mb-8">
                      A new <span className="hero-highlight">music platform</span> that empowers artists, fans, and creators
                      through blockchain. <span className="hero-highlight">NFTs</span>, <span className="hero-highlight">rewards</span>, and <span className="hero-highlight">real-world perks</span> — all in
                      one ecosystem.
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="flex flex-col items-center mt-10 space-y-5 gate" data-aos="fade-up" data-aos-delay="600">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="px-4 py-3 rounded-xl w-96 text-white bg-transparent focus:outline-none border-2 border-[#8B5FFF] focus:border-[#a58fff] shadow-[0_0_10px_transparent] focus:shadow-[0_0_15px_#8B5FFF] transition duration-300"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                    <button
                      className="bg-[#8B5FFF] hover:bg-[#7a4fe0] hover:shadow-[0_0_20px_#8B5FFF] px-6 py-3 rounded-xl font-bold text-lg transition duration-300 transform hover:scale-105"
                      onClick={async () => {
                        if (!email) {
                          showToast({
                            title: "Email required",
                            message: "Please enter your email to join early access.",
                            icon: "❌"
                          });
                          return;
                        }
                        try {
                          const res = await fetch("/api/send", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              "Accept": "application/json"
                            },
                            cache: 'no-store',
                            body: JSON.stringify({ email })
                          });

                          let j;
                          try {
                            j = await res.json();
                          } catch (e) {
                            const txt = await res.text();
                            console.log("Non-JSON response from /api/send:", txt);
                          }

                          if (res.ok) {
                            setEmail("");
                            if (j && typeof j.count === 'number' && typeof j.goal === 'number') {
                              setJoinedCount(j.count);
                              const pct = Math.max(0, Math.min(100, (j.count / j.goal) * 100));
                              setTargetProgress(pct);
                              if (document.getElementById('progress-section')) {
                                setProgress(pct);
                              }
                            }
                            showToast({
                              title: "You're in!",
                              message: "Thanks for joining early access to SoundChain.",
                              icon: "🎉"
                            });
                          } else {
                            showToast({
                              title: "Oops!",
                              message: `There was an error (status ${res.status}). Please try again.`,
                              icon: "❌"
                            });
                          }
                        } catch (err) {
                          showToast({
                            title: "Oops!",
                            message: "There was an error. Please try again.",
                            icon: "❌"
                          });
                          console.error(err);
                        }
                      }}
                    >
                      Join Early Access
                    </button>
                  </div>
                </div>
              </header>

              {/* Progress Bar */}
              <section
                id="progress-section"
                className="max-w-4xl mx-auto px-4 mb-12 progress-reveal"
                data-visible={progressVisible ? 'true' : 'false'}
                data-aos="fade-up"
                data-aos-delay="300"
              >
                <div className="signup-progress mb-2" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(progress)}>
                  <div
                    className="signup-progress-fill"
                    style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }}
                  ></div>
                </div>
                <p className="text-center text-gray-400">{joinedCount.toLocaleString()} people joined</p>
              </section>

              {/* Benefits Section */}
              <section
                className="max-w-4xl mx-auto px-4 grid md:grid-cols-3 gap-8 text-center mb-16"
                data-aos="fade-up"
                data-aos-delay="500"
              >
                <div className="transition-transform duration-300 hover:scale-105">
                  <img src="/nft.png" alt="NFT Icon" className="w-14 h-14 mx-auto mb-4 animate-fade-in" />
                  <h3 className="font-bold text-xl mb-2">NFT Releases</h3>
                  <p className="text-gray-400">Own your favorite tracks</p>
                </div>
                <div className="transition-transform duration-300 hover:scale-105">
                  <img src="/community.png" alt="Community Icon" className="w-14 h-14 mx-auto mb-4 animate-fade-in" />
                  <h3 className="font-bold text-xl mb-2">Community Rewards</h3>
                  <p className="text-gray-400">Support artists, get perks</p>
                </div>
                <div className="transition-transform duration-300 hover:scale-105">
                  <img src="/creator.png" alt="Creator Icon" className="w-14 h-14 mx-auto mb-4 animate-fade-in" />
                  <h3 className="font-bold text-xl mb-2">Creator Economy</h3>
                  <p className="text-gray-400">Fair splits for artists & producers</p>
                </div>
              </section>
            </main>

            {/* Footer */}
            <footer
              className="text-center text-gray-500 py-6"
              data-aos="fade-up"
              data-aos-delay="300"
            >
              <div className="flex justify-center space-x-6 mb-4">
                <a
                  href="https://x.com/joinsoundchain"
                  aria-label="X (Twitter)"
                  className="social-icon-wrapper"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img src="/twitter-icon.svg" alt="X" className="social-icon-img" />
                </a>
                <a
                  href="https://www.instagram.com/joinsoundchain/?utm_source=ig_web_button_share_sheet"
                  aria-label="Instagram"
                  className="social-icon-wrapper"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img src="/instagram-icon.svg" alt="Instagram" className="social-icon-img" />
                </a>
              </div>
              <p>Coming soon — Powered by Web3</p>
            </footer>
          </>
        </div>
      </div>
    </>
  );
}