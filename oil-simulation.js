/**
 * AI OIL - Ambient Background & Molecular Rheology Simulator
 * Visualizes fluid dynamics, nano-molecular bonding under extreme shear stress,
 * and comparative hydraulic film stability.
 */

// ==================== 1. AMBIENT BACKGROUND CANVAS ====================
class AmbientOilCanvas {
  constructor() {
    this.canvas = document.getElementById('ambient-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.blobs = [];
    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Create large organic color energy fields (cyan & golden oil amber)
    this.blobs = [
      { x: this.width * 0.2, y: this.height * 0.3, vx: 0.2, vy: 0.15, radius: 380, color: 'rgba(64, 219, 255, 0.07)' },
      { x: this.width * 0.8, y: this.height * 0.4, vx: -0.15, vy: 0.2, radius: 420, color: 'rgba(245, 179, 1, 0.08)' },
      { x: this.width * 0.5, y: this.height * 0.8, vx: 0.1, vy: -0.18, radius: 450, color: 'rgba(138, 92, 255, 0.05)' }
    ];

    this.render();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.blobs.forEach(b => {
      b.x += b.vx;
      b.y += b.vy;

      if (b.x < -100 || b.x > this.width + 100) b.vx *= -1;
      if (b.y < -100 || b.y > this.height + 100) b.vy *= -1;

      const grad = this.ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius);
      grad.addColorStop(0, b.color);
      grad.addColorStop(1, 'transparent');

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });

    requestAnimationFrame(() => this.render());
  }
}

// ==================== 2. INTERACTIVE MOLECULAR LAB SIMULATOR ====================
class RheologySimulator {
  constructor() {
    this.canvas = document.getElementById('sim-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Controls
    this.inputPressure = document.getElementById('input-pressure');
    this.inputTemp = document.getElementById('input-temp');
    this.valPressure = document.getElementById('val-pressure');
    this.valTemp = document.getElementById('val-temp');
    this.metricFilm = document.getElementById('metric-film');
    this.metricFriction = document.getElementById('metric-friction');
    this.metricStatus = document.getElementById('metric-status');
    this.checkCompare = document.getElementById('check-compare');

    this.gradeButtons = document.querySelectorAll('.btn-grade');
    this.currentGrade = 32;

    this.width = this.canvas.parentElement.clientWidth || 600;
    this.height = 320;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Simulation particle lattices
    this.aiMolecules = [];
    this.normalMolecules = [];
    this.cavitationBubbles = [];

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Bind controls
    if (this.inputPressure) {
      this.inputPressure.addEventListener('input', () => this.updateSimulationParams());
    }
    if (this.inputTemp) {
      this.inputTemp.addEventListener('input', () => this.updateSimulationParams());
    }
    if (this.checkCompare) {
      this.checkCompare.addEventListener('change', () => this.resize());
    }

    this.gradeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.gradeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentGrade = parseInt(btn.dataset.grade, 10);
        this.updateSimulationParams();
      });
    });

    this.setupMolecules();
    this.updateSimulationParams();
    this.render();
  }

  resize() {
    const parent = this.canvas.parentElement;
    this.width = parent ? parent.clientWidth : 600;
    this.height = 320;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
    this.setupMolecules();
  }

  setupMolecules() {
    this.aiMolecules = [];
    this.normalMolecules = [];
    this.cavitationBubbles = [];

    const isSplit = this.checkCompare && this.checkCompare.checked;
    const splitWidth = isSplit ? this.width / 2 : this.width;

    // AI OIL Molecules (Golden amber lattice with cyan covalent bonds)
    const countAI = Math.floor(splitWidth / 14);
    for (let i = 0; i < countAI; i++) {
      this.aiMolecules.push({
        x: Math.random() * (splitWidth - 20) + 10,
        y: Math.random() * (this.height - 40) + 20,
        baseY: 0,
        radius: 4,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 0.5,
        bonded: true,
        phase: Math.random() * Math.PI * 2
      });
    }

    // Normal Hydraulic Oil Molecules (Prone to shearing apart at high pressure)
    if (isSplit) {
      const startX = splitWidth;
      const countNormal = Math.floor(splitWidth / 14);
      for (let i = 0; i < countNormal; i++) {
        this.normalMolecules.push({
          x: startX + Math.random() * (splitWidth - 20) + 10,
          y: Math.random() * (this.height - 40) + 20,
          radius: 3.5,
          vx: (Math.random() - 0.5) * 2.5,
          vy: (Math.random() - 0.5) * 1.5,
          broken: false
        });
      }
    }
  }

  updateSimulationParams() {
    const pressure = parseInt(this.inputPressure.value, 10);
    const temp = parseInt(this.inputTemp.value, 10);

    if (this.valPressure) this.valPressure.textContent = `${pressure} bar`;
    if (this.valTemp) this.valTemp.textContent = `${temp} °C`;

    // Dynamic AI Oil Film stability calculation based on real physics formula:
    // AI OIL has VI ~ 168 and nano-shearing resistance
    const tempFactor = Math.max(0, 1 - (temp - 60) * 0.0018);
    const pressureFactor = Math.max(0, 1 - (pressure - 250) * 0.0003);
    const gradeBoost = this.currentGrade === 68 ? 1.04 : (this.currentGrade === 46 ? 1.02 : 1.0);

    const aiFilmHealth = Math.min(99.9, (98.8 * tempFactor * pressureFactor * gradeBoost)).toFixed(1);
    const frictionDrop = (24 + (pressure / 500) * 12 + (temp > 80 ? 4 : 0)).toFixed(1);

    if (this.metricFilm) this.metricFilm.textContent = `${aiFilmHealth}%`;
    if (this.metricFriction) this.metricFriction.textContent = `-${frictionDrop}%`;

    if (this.metricStatus) {
      if (pressure > 420 && temp > 100) {
        this.metricStatus.textContent = "Kích Hoạt Nano Shield";
        this.metricStatus.className = "m-val highlight-gold";
      } else if (temp < 0) {
        this.metricStatus.textContent = "Lưu Động Lạnh Cực Tốt";
        this.metricStatus.className = "m-val highlight-cyan";
      } else {
        this.metricStatus.textContent = "Cực Kỳ Ổn Định";
        this.metricStatus.className = "m-val text-green";
      }
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    const pressure = parseInt(this.inputPressure ? this.inputPressure.value : 320, 10);
    const temp = parseInt(this.inputTemp ? this.inputTemp.value : 75, 10);
    const isSplit = this.checkCompare && this.checkCompare.checked;
    const splitX = isSplit ? this.width / 2 : this.width;

    // Background dividing line and headers if split
    if (isSplit) {
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      this.ctx.lineWidth = 1;
      this.ctx.setLineDash([4, 4]);
      this.ctx.beginPath();
      this.ctx.moveTo(splitX, 0);
      this.ctx.lineTo(splitX, this.height);
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      // Headers
      this.ctx.font = '700 11px "Space Grotesk", sans-serif';
      this.ctx.fillStyle = '#f5b301';
      this.ctx.fillText(`AI OIL VG ${this.currentGrade} (SMART-FILM)`, 20, 24);

      this.ctx.fillStyle = '#ff6b81';
      this.ctx.fillText('DẦU KHOÁNG TRUYỀN THỐNG (BỊ BẺ GÃY)', splitX + 20, 24);
    } else {
      this.ctx.font = '700 12px "Space Grotesk", sans-serif';
      this.ctx.fillStyle = '#f5b301';
      this.ctx.fillText(`CẤU TRÚC PHÂN TỬ AI OIL HYDRO-X ${this.currentGrade} ĐỘC QUYỀN`, 20, 24);
    }

    // Top and bottom metal friction plates (hydraulic piston surface)
    const plateHeight = 28;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.fillRect(0, 0, this.width, plateHeight);
    this.ctx.fillRect(0, this.height - plateHeight, this.width, plateHeight);

    // Plate labels
    this.ctx.font = '500 10px "Plus Jakarta Sans", sans-serif';
    this.ctx.fillStyle = '#8e9bb5';
    this.ctx.fillText('▲ BỀ MẶT THÉP BƠM PISTON / VAN SERVO (CHUYỂN ĐỘNG TRƯỢT)', 20, 18);
    this.ctx.fillText('▼ THÀNH ỐNG XILANH THỦY LỰC', 20, this.height - 10);

    const speedMod = 1 + (pressure / 250) * 0.8;

    // 1. RENDER AI OIL LATTICE
    // AI OIL forms cohesive molecular bonds (lines drawn between neighbor molecules)
    for (let i = 0; i < this.aiMolecules.length; i++) {
      for (let j = i + 1; j < this.aiMolecules.length; j++) {
        const dx = this.aiMolecules[i].x - this.aiMolecules[j].x;
        const dy = this.aiMolecules[i].y - this.aiMolecules[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 45) {
          this.ctx.beginPath();
          this.ctx.moveTo(this.aiMolecules[i].x, this.aiMolecules[i].y);
          this.ctx.lineTo(this.aiMolecules[j].x, this.aiMolecules[j].y);
          this.ctx.strokeStyle = `rgba(64, 219, 255, ${(1 - dist / 45) * 0.45})`;
          this.ctx.lineWidth = 1.2;
          this.ctx.stroke();
        }
      }
    }

    // Render AI particles
    this.aiMolecules.forEach(m => {
      m.x += m.vx * speedMod;
      m.y += Math.sin(m.phase) * 0.6;
      m.phase += 0.04;

      if (m.x < 15) m.vx = Math.abs(m.vx);
      if (m.x > splitX - 15) m.vx = -Math.abs(m.vx);
      if (m.y < plateHeight + 10) m.y = plateHeight + 10;
      if (m.y > this.height - plateHeight - 10) m.y = this.height - plateHeight - 10;

      this.ctx.beginPath();
      this.ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = '#f5b301';
      this.ctx.shadowColor = '#f5b301';
      this.ctx.shadowBlur = 8;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    });

    // 2. RENDER NORMAL OIL (If split)
    if (isSplit) {
      const breakThreshold = pressure > 280 || temp > 80;

      this.normalMolecules.forEach(m => {
        m.x += m.vx * speedMod * (breakThreshold ? 1.6 : 1);
        m.y += m.vy * (breakThreshold ? 1.8 : 0.8);

        if (m.x < splitX + 15) m.vx = Math.abs(m.vx);
        if (m.x > this.width - 15) m.vx = -Math.abs(m.vx);
        if (m.y < plateHeight + 10) { m.y = plateHeight + 10; m.vy *= -1; }
        if (m.y > this.height - plateHeight - 10) { m.y = this.height - plateHeight - 10; m.vy *= -1; }

        this.ctx.beginPath();
        this.ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = breakThreshold ? '#ff4757' : '#95a5a6';
        this.ctx.shadowColor = breakThreshold ? '#ff4757' : 'transparent';
        this.ctx.shadowBlur = breakThreshold ? 6 : 0;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
      });

      // Spawn cavitation bubbles in normal oil section under high pressure
      if (pressure > 300 && Math.random() < 0.15) {
        this.cavitationBubbles.push({
          x: splitX + Math.random() * (splitX - 30) + 15,
          y: this.height - plateHeight - 10,
          radius: Math.random() * 4 + 2,
          vy: -(Math.random() * 2 + 1),
          alpha: 0.8
        });
      }

      // Update cavitation bubbles
      for (let b = this.cavitationBubbles.length - 1; b >= 0; b--) {
        const bubble = this.cavitationBubbles[b];
        bubble.y += bubble.vy;
        bubble.alpha -= 0.015;

        this.ctx.beginPath();
        this.ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = `rgba(255, 71, 87, ${bubble.alpha})`;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        if (bubble.alpha <= 0 || bubble.y <= plateHeight + 15) {
          // Micro-pitting spark
          if (bubble.y <= plateHeight + 15) {
            this.ctx.fillStyle = '#fffa65';
            this.ctx.fillRect(bubble.x - 2, bubble.y - 2, 4, 4);
          }
          this.cavitationBubbles.splice(b, 1);
        }
      }
    }

    requestAnimationFrame(() => this.render());
  }
}

// Instantiate on load
window.addEventListener('DOMContentLoaded', () => {
  window.ambientCanvas = new AmbientOilCanvas();
  window.rheologySim = new RheologySimulator();
});
