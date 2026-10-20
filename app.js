/**
 * AI OIL - Main Application Controller
 * Handles scroll reveals, counter animations, ROI calculation,
 * form submission, and UI interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initCountersAndReveals();
  initRoiCalculator();
  initFormAndSampleButtons();
  initMobileMenu();
});

/* ---------------- 1. STICKY HEADER & ACTIVE LINKS ---------------- */
function initHeader() {
  const header = document.getElementById('site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

/* ---------------- 2. SCROLL REVEALS & NUMBER COUNTERS ---------------- */
function initCountersAndReveals() {
  const revealItems = document.querySelectorAll('.reveal-item');

  // Trigger hero entrance explicitly when intro ends
  window.triggerHeroEntrance = () => {
    revealItems.forEach((el, index) => {
      setTimeout(() => {
        el.classList.add('revealed');
      }, index * 120);
    });
    startNumberCounters();
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        // If element is a stat card container
        if (entry.target.classList.contains('hero-stats-strip')) {
          startNumberCounters();
        }
      }
    });
  }, { threshold: 0.15 });

  revealItems.forEach(item => observer.observe(item));
}

let countersStarted = false;
function startNumberCounters() {
  if (countersStarted) return;
  countersStarted = true;

  const statNums = document.querySelectorAll('.stat-num');
  statNums.forEach(num => {
    const target = parseFloat(num.dataset.target);
    const isDecimal = target % 1 !== 0;
    const duration = 1800;
    const startTime = performance.now();

    function updateCounter(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out expo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentVal = ease * target;

      num.textContent = isDecimal ? currentVal.toFixed(1) : Math.floor(currentVal);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        num.textContent = isDecimal ? target.toFixed(1) : target;
      }
    }
    requestAnimationFrame(updateCounter);
  });
}

/* ---------------- 3. ROI SAVINGS CALCULATOR ---------------- */
function initRoiCalculator() {
  const inputMachines = document.getElementById('calc-machines');
  const inputTank = document.getElementById('calc-tank');
  const inputElec = document.getElementById('calc-elec');

  const resOil = document.getElementById('roi-oil-savings');
  const resElec = document.getElementById('roi-elec-savings');
  const resTotal = document.getElementById('roi-total-savings');

  if (!inputMachines || !inputTank || !inputElec) return;

  function recalculate() {
    const machines = Math.max(1, parseInt(inputMachines.value, 10) || 1);
    const tank = Math.max(50, parseInt(inputTank.value, 10) || 100);
    const elecPrice = Math.max(500, parseInt(inputElec.value, 10) || 2000);

    // AI OIL extends drain interval 3X:
    // Traditional oil: changed 2 times/year
    // AI OIL: changed 0.67 times/year -> saves 1.33 oil changes/year
    const avgOilPricePerLiter = 45000; // 45,000 VND / liter
    const oilSavings = machines * tank * 1.33 * avgOilPricePerLiter;

    // Power savings: 6% hydraulic motor efficiency boost
    // Average 15kW motor running 4000h/year = 60,000 kWh * 6% = 3,600 kWh saved per machine
    const kwhSavedPerMachine = 3600;
    const totalElecSavings = machines * kwhSavedPerMachine * elecPrice;

    const total = oilSavings + totalElecSavings;

    function formatVND(val) {
      return new Intl.NumberFormat('vi-VN').format(Math.round(val)) + ' VNĐ';
    }

    resOil.textContent = formatVND(oilSavings) + ' / năm';
    resElec.textContent = formatVND(totalElecSavings) + ' / năm';
    resTotal.textContent = formatVND(total);
  }

  [inputMachines, inputTank, inputElec].forEach(input => {
    input.addEventListener('input', recalculate);
  });

  recalculate();
}

/* ---------------- 4. LEAD FORM & SAMPLE BUTTONS ---------------- */
function initFormAndSampleButtons() {
  const form = document.getElementById('lead-form');
  const successAlert = document.getElementById('form-success-msg');
  const gradeSelect = document.getElementById('lead-grade');
  const sampleButtons = document.querySelectorAll('.request-sample-btn');

  sampleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const productName = btn.dataset.product;
      if (gradeSelect) {
        for (let i = 0; i < gradeSelect.options.length; i++) {
          if (gradeSelect.options[i].text.includes(productName)) {
            gradeSelect.selectedIndex = i;
            break;
          }
        }
      }
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Đang xác thực thông tin...</span>';

      setTimeout(() => {
        form.reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        if (successAlert) {
          successAlert.classList.remove('hidden');
          setTimeout(() => {
            successAlert.classList.add('hidden');
          }, 8000);
        }
      }, 1000);
    });
  }
}

/* ---------------- 5. MOBILE DRAWER MENU ---------------- */
function initMobileMenu() {
  const toggle = document.getElementById('mobile-toggle');
  const drawer = document.getElementById('mobile-drawer');
  const links = document.querySelectorAll('.mob-link');

  if (!toggle || !drawer) return;

  toggle.addEventListener('click', () => {
    drawer.classList.toggle('open');
  });

  links.forEach(link => {
    link.addEventListener('click', () => {
      drawer.classList.remove('open');
    });
  });
}
