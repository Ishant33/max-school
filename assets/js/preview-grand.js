/**
 * GRAND COLUMBUS STYLE PREVIEW JAVASCRIPT
 * Handles live counter animations, mega-dropdown portals, 
 * interactive academic stages, and quick enquiry form submissions.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Live Animated Number Counters (like Grand Columbus)
  const counterElements = document.querySelectorAll('.gc-counter-val');

  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.getAttribute('data-target'), 10);
          if (!isNaN(target)) {
            animateNumber(el, target, 1800);
          }
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.3 });

    counterElements.forEach(el => counterObserver.observe(el));
  } else {
    // Fallback for older browsers
    counterElements.forEach(el => {
      el.textContent = el.getAttribute('data-target');
    });
  }

  function animateNumber(element, target, duration) {
    let startTimestamp = null;
    const startValue = 0;

    function step(timestamp) {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease-out expo curve for smooth deceleration
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.floor(easeOut * (target - startValue) + startValue);
      element.textContent = current.toLocaleString();

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        element.textContent = target.toLocaleString();
      }
    }

    window.requestAnimationFrame(step);
  }

  // 2. Mega-Dropdown Portals (Read More / Quick Links Grid)
  const megaToggle = document.getElementById('gcMegaToggle');
  const megaDropdown = document.getElementById('gcMegaDropdown');

  if (megaToggle && megaDropdown) {
    megaToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      megaDropdown.classList.toggle('is-open');
    });

    document.addEventListener('click', (e) => {
      if (!megaDropdown.contains(e.target) && !megaToggle.contains(e.target)) {
        megaDropdown.classList.remove('is-open');
      }
    });
  }

  // 3. Mobile Navigation Menu Toggle
  const burgerBtn = document.getElementById('gcBurgerBtn');
  const navMenu = document.getElementById('gcNavMenu');

  if (burgerBtn && navMenu) {
    burgerBtn.addEventListener('click', () => {
      navMenu.classList.toggle('is-mobile-open');
      const isOpen = navMenu.classList.contains('is-mobile-open');
      burgerBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  // 4. Academic Wings Interactive Highlight
  const wingItems = document.querySelectorAll('.gc-wing-item');
  wingItems.forEach(item => {
    item.addEventListener('mouseenter', () => {
      wingItems.forEach(w => w.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // 5. Quick Admission Enquiry Form Submission
  const enquiryForm = document.getElementById('gcEnquiryForm');
  const formFeedback = document.getElementById('gcFormFeedback');

  if (enquiryForm) {
    enquiryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = enquiryForm.querySelector('.gc-submit-btn');
      const originalText = submitBtn.textContent;

      submitBtn.textContent = 'Submitting...';
      submitBtn.disabled = true;

      // Simulate instantaneous responsive feedback
      setTimeout(() => {
        enquiryForm.reset();
        submitBtn.textContent = 'Submitted Successfully!';
        submitBtn.style.background = '#019e89';

        if (formFeedback) {
          formFeedback.style.display = 'block';
          formFeedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        setTimeout(() => {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
          submitBtn.style.background = '';
        }, 4000);
      }, 700);
    });
  }
});
