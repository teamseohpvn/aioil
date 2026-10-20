/**
 * AI OIL - Gemini Particle Intro & Sequential Letter Convergence Engine
 * Generates an organic, slow-motion fluid particle field that converges
 * into glyphs A -> I -> O -> I -> L with chromatic glows and synthetic audio.
 */

class GeminiIntroController {
  constructor() {
    this.canvas = document.getElementById('intro-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.overlay = document.getElementById('intro-screen');
    this.mainSite = document.getElementById('main-site');
    this.progressBar = document.getElementById('intro-progress-fill');
    this.subMessage = document.getElementById('intro-sub-message');
    this.tagline = document.getElementById('intro-tagline');
    this.soundToggleBtn = document.getElementById('btn-sound-toggle');
    this.skipBtn = document.getElementById('btn-skip-intro');
    this.replayBtn = document.getElementById('btn-replay-intro');

    this.letterSlots = Array.from(document.querySelectorAll('.letter-slot'));

    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Particles config
    this.particleCount = window.innerWidth < 768 ? 320 : 650;
    this.particles = [];
    this.animationId = null;

    // Audio context for procedural ambient sound
    this.audioCtx = null;
    this.isMuted = false;

    // Timeline states: 'DRIFT' -> 'CONVERGE' -> 'CRYSTALLIZED' -> 'FINISH'
    this.state = 'DRIFT';
    this.startTime = performance.now();
    this.currentTime = 0;

    // Sequence for letters: A -> I -> O -> I -> L
    this.sequenceOrder = ['A', 'I', 'O', 'I', 'L'];
    this.currentLetterIndex = -1;
    this.letterTargets = []; // coordinate points extracted for letters

    this.init();
  }

  init() {
    if (!this.canvas || !this.ctx) return;
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Generate initial fluid particle pool
    this.createParticles();

    // Map letter target coordinates on the canvas
    this.generateLetterCoordinates();

    // Setup event listeners
    if (this.skipBtn) {
      this.skipBtn.addEventListener('click', () => this.skipIntro());
    }

    if (this.replayBtn) {
      this.replayBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.restartIntro();
      });
    }

    if (this.soundToggleBtn) {
      this.soundToggleBtn.addEventListener('click', () => this.toggleSound());
    }

    // Interactive mouse gravitation during drift phase
    this.mouse = { x: this.width / 2, y: this.height / 2, active: false };
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.mouse.active = true;
    });

    // Start render loop
    this.startTime = performance.now();
    this.loop();

    // Schedule Convergence Timeline
    this.timelineTimer = setTimeout(() => {
      this.startLetterSequence();
    }, 2800); // 2.8s of dreamy fluid drift, then convergence
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
    this.generateLetterCoordinates();
  }

  createParticles() {
    this.particles = [];
    // Color palette: electric cyan, golden amber, deep cosmic purple, pure glow white
    const colors = [
      { r: 64, g: 219, b: 255 }, // Cyan
      { r: 108, g: 229, b: 255 }, // Bright cyan
      { r: 245, g: 179, b: 1 },  // Golden Oil Amber
      { r: 255, g: 213, b: 102 }, // Pale Gold
      { r: 138, g: 92, b: 255 }, // Gemini Violet
      { r: 255, g: 255, b: 255 }  // Stellar White
    ];

    for (let i = 0; i < this.particleCount; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        radius: Math.random() * 2.5 + 1.2,
        baseRadius: Math.random() * 2.5 + 1.2,
        color: color,
        alpha: Math.random() * 0.7 + 0.3,
        seed: Math.random() * 1000,
        flowSpeed: Math.random() * 0.001 + 0.0006,
        targetX: null,
        targetY: null,
        targetLetter: null,
        converged: false
      });
    }
  }

  /**
   * Samples visual anchor points on the screen for the 5 letters:
   * A (index 0), I (index 1), O (index 2), I (index 3), L (index 4)
   */
  generateLetterCoordinates() {
    this.letterTargets = [[], [], [], [], []];
    // Create an offscreen canvas to render letters and sample dense pixels
    const offCanvas = document.createElement('canvas');
    const offCtx = offCanvas.getContext('2d');
    const sampleWidth = this.width;
    const sampleHeight = this.height;
    offCanvas.width = sampleWidth;
    offCanvas.height = sampleHeight;

    const chars = ['A', 'I', 'O', 'I', 'L'];
    const letterRects = this.letterSlots.map(slot => slot.getBoundingClientRect());

    chars.forEach((char, index) => {
      offCtx.clearRect(0, 0, sampleWidth, sampleHeight);
      const rect = letterRects[index];
      if (!rect) return;

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2 + 10;
      const fontSize = Math.min(rect.width * 1.3, 90);

      offCtx.fillStyle = '#ffffff';
      offCtx.font = `800 ${fontSize}px "Space Grotesk", "Plus Jakarta Sans", sans-serif`;
      offCtx.textAlign = 'center';
      offCtx.textBaseline = 'middle';
      offCtx.fillText(char, centerX, centerY);

      // Read raster pixels
      const imgData = offCtx.getImageData(
        Math.max(0, rect.left - 10),
        Math.max(0, rect.top - 10),
        rect.width + 20,
        rect.height + 20
      );

      const pixels = imgData.data;
      const step = 4; // sampling density
      for (let y = 0; y < imgData.height; y += step) {
        for (let x = 0; x < imgData.width; x += step) {
          const pixelIndex = (y * imgData.width + x) * 4;
          const alpha = pixels[pixelIndex + 3];
          if (alpha > 140) {
            this.letterTargets[index].push({
              x: (rect.left - 10) + x,
              y: (rect.top - 10) + y
            });
          }
        }
      }
    });

    // Distribute particles across letters
    let targetIndex = 0;
    this.particles.forEach((p, i) => {
      const letterIndex = i % 5;
      const list = this.letterTargets[letterIndex];
      if (list && list.length > 0) {
        const pt = list[Math.floor(Math.random() * list.length)];
        p.targetX = pt.x;
        p.targetY = pt.y;
        p.targetLetter = letterIndex;
      }
    });
  }

  startLetterSequence() {
    this.state = 'CONVERGE';
    const stepDuration = 650; // time per letter in ms

    // Sequential triggering: A -> I -> O -> I -> L
    this.sequenceOrder.forEach((char, idx) => {
      setTimeout(() => {
        this.currentLetterIndex = idx;
        this.highlightLetterSlot(idx);
        this.playSynthesizedTone(idx);

        // Update progress bar
        if (this.progressBar) {
          const pct = ((idx + 1) / this.sequenceOrder.length) * 100;
          this.progressBar.style.width = `${pct}%`;
        }

        // When the final letter 'L' locks in
        if (idx === this.sequenceOrder.length - 1) {
          setTimeout(() => {
            this.onAllLettersCrystallized();
          }, 800);
        }
      }, idx * stepDuration);
    });
  }

  highlightLetterSlot(index) {
    if (this.letterSlots[index]) {
      this.letterSlots[index].classList.add('converging');
      setTimeout(() => {
        this.letterSlots[index].classList.remove('converging');
        this.letterSlots[index].classList.add('crystallized');
      }, 250);
    }
  }

  onAllLettersCrystallized() {
    this.state = 'CRYSTALLIZED';
    this.playChordFinale();

    if (this.subMessage) {
      this.subMessage.classList.add('show');
    }
    if (this.tagline) {
      this.tagline.innerHTML = '<span class="pulsing-dot" style="background:#10f49c;box-shadow:0 0 10px #10f49c"></span><span class="tag-text" style="color:#10f49c">FORMULA SYNTHESIS COMPLETE</span>';
    }

    // Particle flash shockwave
    this.particles.forEach(p => {
      const angle = Math.atan2(p.y - this.height / 2, p.x - this.width / 2);
      const force = Math.random() * 8 + 3;
      p.burstVx = Math.cos(angle) * force;
      p.burstVy = Math.sin(angle) * force;
    });

    // Auto transition to main site after celebrating the crystallized "AI OIL"
    setTimeout(() => {
      this.completeIntro();
    }, 2000);
  }

  completeIntro() {
    this.state = 'FINISH';
    if (this.overlay) {
      this.overlay.classList.add('fade-out');
    }
    if (this.mainSite) {
      this.mainSite.classList.remove('hidden-initially');
    }
    document.body.classList.remove('intro-active');

    // Trigger hero entrance reveals
    setTimeout(() => {
      if (window.triggerHeroEntrance) {
        window.triggerHeroEntrance();
      }
    }, 300);

    // Stop render loop to save CPU
    setTimeout(() => {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
      }
    }, 1300);
  }

  skipIntro() {
    clearTimeout(this.timelineTimer);
    this.completeIntro();
  }

  restartIntro() {
    if (this.overlay) {
      this.overlay.classList.remove('fade-out');
    }
    if (this.mainSite) {
      this.mainSite.classList.add('hidden-initially');
    }
    document.body.classList.add('intro-active');

    this.letterSlots.forEach(slot => {
      slot.classList.remove('converging', 'crystallized');
    });

    if (this.subMessage) {
      this.subMessage.classList.remove('show');
    }
    if (this.progressBar) {
      this.progressBar.style.width = '0%';
    }
    if (this.tagline) {
      this.tagline.innerHTML = '<span class="pulsing-dot"></span><span class="tag-text">SYNTHESIZING NEXT-GEN FORMULA</span>';
    }

    this.currentLetterIndex = -1;
    this.state = 'DRIFT';
    this.createParticles();
    this.generateLetterCoordinates();
    this.startTime = performance.now();

    window.scrollTo({ top: 0, behavior: 'instant' });

    this.loop();
    this.timelineTimer = setTimeout(() => {
      this.startLetterSequence();
    }, 2000);
  }

  /* ---------------- SOUND SYNTHESIS (WEB AUDIO API) ---------------- */
  initAudio() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  toggleSound() {
    this.isMuted = !this.isMuted;
    const soundOn = this.soundToggleBtn.querySelector('.icon-sound-on');
    const soundOff = this.soundToggleBtn.querySelector('.icon-sound-off');
    if (soundOn && soundOff) {
      soundOn.classList.toggle('hidden', this.isMuted);
      soundOff.classList.toggle('hidden', !this.isMuted);
    }
    if (!this.isMuted) {
      this.initAudio();
      this.playSynthesizedTone(0);
    }
  }

  playSynthesizedTone(step) {
    if (this.isMuted) return;
    this.initAudio();
    if (!this.audioCtx) return;

    // Harmonic musical scale (Pentatonic high-tech crystal chime: C5, D5, F5, G5, A5, C6)
    const freqs = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
    const freq = freqs[step % freqs.length];

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

    // Subtle pitch rise
    osc.frequency.exponentialRampToValueAtTime(freq * 1.05, this.audioCtx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.001, this.audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.18, this.audioCtx.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.55);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.6);
  }

  playChordFinale() {
    if (this.isMuted) return;
    this.initAudio();
    if (!this.audioCtx) return;

    // Rich triumphant resonance chord
    const chord = [523.25, 659.25, 783.99, 1046.50];
    chord.forEach((freq, i) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0.001, this.audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, this.audioCtx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 1.3);
    });
  }

  /* ---------------- PARTICLE RENDER & PHYSICS LOOP ---------------- */
  loop() {
    const now = performance.now();
    const elapsed = now - this.startTime;
    this.currentTime = elapsed;

    this.ctx.fillStyle = 'rgba(6, 8, 14, 0.28)'; // motion blur trail
    this.ctx.fillRect(0, 0, this.width, this.height);

    const time = elapsed * 0.0012;

    this.particles.forEach(p => {
      if (this.state === 'CRYSTALLIZED' && p.burstVx) {
        // Slow outward dissipation
        p.x += p.burstVx * 0.6;
        p.y += p.burstVy * 0.6;
        p.burstVx *= 0.94;
        p.burstVy *= 0.94;
        p.alpha = Math.max(0.1, p.alpha * 0.98);
      } else if (this.state === 'CONVERGE' && p.targetLetter !== null && p.targetLetter <= this.currentLetterIndex) {
        // Converge smoothly to designated letter target
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const ease = 0.085;
        p.x += dx * ease;
        p.y += dy * ease;

        if (dist < 4) {
          p.converged = true;
          // Shimmer jitter around letter contour
          p.x = p.targetX + (Math.random() - 0.5) * 1.5;
          p.y = p.targetY + (Math.random() - 0.5) * 1.5;
          p.radius = p.baseRadius * 1.25;
          p.alpha = 0.95;
        } else {
          p.radius = p.baseRadius * 1.1;
        }
      } else {
        // DRIFT PHASE: Organic Gemini-style curl flow
        const flowAngle = Math.sin(p.x * 0.003 + time) + Math.cos(p.y * 0.003 + time * 0.8);
        p.vx += Math.cos(flowAngle) * 0.08;
        p.vy += Math.sin(flowAngle) * 0.08;

        // Apply drag
        p.vx *= 0.96;
        p.vy *= 0.96;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around screen boundaries
        if (p.x < -20) p.x = this.width + 20;
        if (p.x > this.width + 20) p.x = -20;
        if (p.y < -20) p.y = this.height + 20;
        if (p.y > this.height + 20) p.y = -20;

        // Mouse light gravity
        if (this.mouse.active) {
          const mdx = this.mouse.x - p.x;
          const mdy = this.mouse.y - p.y;
          const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mDist < 180 && mDist > 5) {
            p.vx += (mdx / mDist) * 0.18;
            p.vy += (mdy / mDist) * 0.18;
          }
        }
      }

      // Draw particle glowing orb
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

      const grad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 2.5);
      grad.addColorStop(0, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.alpha})`);
      grad.addColorStop(0.5, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.alpha * 0.4})`);
      grad.addColorStop(1, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0)`);

      this.ctx.fillStyle = grad;
      this.ctx.fill();
    });

    if (this.state !== 'FINISH') {
      this.animationId = requestAnimationFrame(() => this.loop());
    }
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  window.geminiIntro = new GeminiIntroController();
});
