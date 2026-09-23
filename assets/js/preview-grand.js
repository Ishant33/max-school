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
          const rawTarget = el.getAttribute('data-target') || '';
          const target = parseFloat(rawTarget);
          if (!isNaN(target)) {
            animateNumber(el, target, 1800, rawTarget.includes('.'));
          }
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.15 });

    counterElements.forEach(el => counterObserver.observe(el));

    // Safety timeout: trigger animation after 2.5s if observer didn't fire
    setTimeout(() => {
      counterElements.forEach(el => {
        const rawTarget = el.getAttribute('data-target') || '';
        const target = parseFloat(rawTarget);
        if (!isNaN(target)) {
          animateNumber(el, target, 1800, rawTarget.includes('.'));
        }
      });
    }, 2500);
  } else {
    // Fallback for older browsers
    counterElements.forEach(el => {
      el.textContent = el.getAttribute('data-target');
    });
  }

  function animateNumber(element, target, duration, isDecimal = false) {
    if (element.dataset.animated === 'true') return;
    element.dataset.animated = 'true';
    let startTimestamp = null;
    const startValue = 0;

    function step(timestamp) {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease-out expo curve for smooth deceleration
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = easeOut * (target - startValue) + startValue;
      element.textContent = isDecimal ? current.toFixed(1) : Math.floor(current).toLocaleString();

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        element.textContent = isDecimal ? target.toFixed(1) : target.toLocaleString();
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

  // Check URL query parameters for feedback after traditional POST redirect
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('enquiry') === 'sent' && formFeedback) {
    formFeedback.style.display = 'block';
    formFeedback.style.background = 'rgba(241, 121, 30, 0.2)';
    formFeedback.style.borderLeftColor = 'var(--gc-orange, #f1791e)';
    formFeedback.innerHTML = '✅ <strong>Thank you!</strong> Your admission enquiry has been successfully recorded. Our admissions counselor will contact you shortly.';
    formFeedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  if (enquiryForm) {
    enquiryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = enquiryForm.querySelector('.gc-submit-btn');
      const originalText = submitBtn.textContent;

      submitBtn.textContent = 'Submitting Enquiry...';
      submitBtn.disabled = true;

      const formData = new FormData(enquiryForm);
      formData.append('ajax', '1');

      fetch('backend/form_submit.php', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData
      })
      .then(res => {
        if (!res.ok) throw new Error('Network error ' + res.status);
        return res.json();
      })
      .then(data => {
        if (data.ok || data.status === 'sent') {
          enquiryForm.reset();
          submitBtn.textContent = 'Submitted Successfully! ✓';
          submitBtn.style.background = 'var(--gc-orange, #f1791e)';

          if (formFeedback) {
            formFeedback.style.display = 'block';
            formFeedback.style.background = 'rgba(241, 121, 30, 0.2)';
            formFeedback.style.borderLeftColor = 'var(--gc-orange, #f1791e)';
            formFeedback.innerHTML = '✅ <strong>Thank you!</strong> Your admission enquiry has been successfully recorded. Our admissions counselor will contact you shortly.';
            formFeedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }

          setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            submitBtn.style.background = '';
          }, 5000);
        } else {
          throw new Error(data.message || 'Submission error');
        }
      })
      .catch(err => {
        console.warn('AJAX submit failed, falling back to standard submit:', err);
        // Fallback: standard form submit so enquiry is never lost
        enquiryForm.submit();
      });
    });
  }
});
