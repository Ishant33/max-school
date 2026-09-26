(() => {
  // Must match the nav breakpoint in style.css, or dropdown taps break in the gap.
  const mobileBreakpoint = 1259;
  const nav = document.querySelector('nav.menu');
  const burger = document.querySelector('.burger');
  const header = document.querySelector('header.main-nav');
  const navInner = header?.querySelector('.nav-inner');
  const logo = navInner?.querySelector('.logo-wrap');
  const navCta = navInner?.querySelector('.nav-cta');

  // Keep branding and its actions above the sticky navigation, as two
  // independent rows. This also avoids duplicating the header on every page.
  if (header && navInner && logo && navCta && !document.querySelector('.brand-bar')) {
    const brandBar = document.createElement('div');
    const brandInner = document.createElement('div');
    const brandActions = document.createElement('div');
    const login = navCta.querySelector('.login-pill');

    brandBar.className = 'brand-bar';
    brandInner.className = 'container brand-inner';
    brandActions.className = 'brand-actions';
    brandInner.appendChild(logo);
    if (login) {
      login.href = 'admin.html';
      login.textContent = 'Log In';
      brandActions.appendChild(login);
    }

    // Keep Apply Now on the navy sticky navigation row.
    // If a subpage has the legacy button class, normalize it to the orange pill button with arrow circle:
    const legacyApply = navCta.querySelector('.btn:not(.gc-btn-pill)');
    if (legacyApply) {
      legacyApply.className = 'gc-btn-pill';
      legacyApply.innerHTML = '<span>Apply Now</span><span class="btn-arrow-circle">→</span>';
    }

    brandInner.appendChild(brandActions);
    brandBar.appendChild(brandInner);
    header.before(brandBar);
  }

  if (!nav || !burger) return;

  const menuItems = [...nav.querySelectorAll('li')].filter(item => item.querySelector(':scope > .dropdown'));
  burger.setAttribute('role', 'button');
  burger.setAttribute('tabindex', '0');
  burger.setAttribute('aria-label', 'Open navigation menu');
  burger.setAttribute('aria-expanded', 'false');

  const closeMenu = () => {
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open navigation menu');
    menuItems.forEach(item => item.classList.remove('is-expanded'));
  };

  const toggleMenu = () => {
    const open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  };

  burger.addEventListener('click', toggleMenu);
  burger.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleMenu();
    }
  });

  menuItems.forEach(item => {
    const link = item.querySelector(':scope > a');
    link.setAttribute('aria-haspopup', 'true');
    link.addEventListener('click', event => {
      if (window.innerWidth > mobileBreakpoint) return;
      event.preventDefault();
      const expanded = item.classList.toggle('is-expanded');
      menuItems.filter(other => other !== item).forEach(other => other.classList.remove('is-expanded'));
      link.setAttribute('aria-expanded', String(expanded));
    });
  });

  document.addEventListener('click', event => {
    if (window.innerWidth <= mobileBreakpoint && !event.target.closest('.main-nav')) closeMenu();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  window.addEventListener('resize', () => { if (window.innerWidth > mobileBreakpoint) closeMenu(); });

  const createChatWidget = () => {
    const widget = document.createElement('div');
    widget.className = 'chat-widget';
    widget.innerHTML = `
      <button type="button" class="chat-widget-toggle" aria-expanded="false" aria-label="Open chat options">
        Chat
      </button>
      <div class="chat-widget-actions" role="menu" aria-label="Chat options">
        <a class="chat-widget-action" href="https://wa.me/919050294300" target="_blank" rel="noopener noreferrer" role="menuitem">
          WhatsApp
        </a>
        <a class="chat-widget-action chat-widget-ai" href="javascript:void(0)" role="menuitem">
          AI Assistant
        </a>
      </div>
    `;
    document.body.appendChild(widget);
    return widget;
  };

  const chatWidget = createChatWidget();
  const toggleButton = chatWidget.querySelector('.chat-widget-toggle');
  const actions = chatWidget.querySelector('.chat-widget-actions');
  const aiButton = chatWidget.querySelector('.chat-widget-ai');

  const closeChatMenu = () => {
    chatWidget.classList.remove('is-open');
    toggleButton.setAttribute('aria-expanded', 'false');
  };

  const openChatMenu = () => {
    chatWidget.classList.add('is-open');
    toggleButton.setAttribute('aria-expanded', 'true');
  };

  toggleButton.addEventListener('click', () => {
    const open = chatWidget.classList.toggle('is-open');
    toggleButton.setAttribute('aria-expanded', String(open));
  });

  chatWidget.addEventListener('mouseenter', openChatMenu);
  chatWidget.addEventListener('mouseleave', closeChatMenu);

  document.addEventListener('click', event => {
    if (!chatWidget.contains(event.target) && chatWidget.classList.contains('is-open')) {
      closeChatMenu();
    }
  });

  aiButton.addEventListener('click', () => {
    if (window.MaxChatbot) window.MaxChatbot.open();
    closeChatMenu();
  });

  // Live Animated Number Counters (Grand Columbus Style)
  const counterElements = document.querySelectorAll('.gc-counter-val');
  if (counterElements.length > 0) {
    const animateNumber = (element, target, duration, isDecimal) => {
      if (element.dataset.animated === 'true') return;
      element.dataset.animated = 'true';
      let startTimestamp = null;
      const startValue = 0;
      function step(timestamp) {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
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
    };

    if ('IntersectionObserver' in window) {
      const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const raw = el.getAttribute('data-target') || '';
            const target = parseFloat(raw);
            if (!isNaN(target)) {
              animateNumber(el, target, 1800, raw.includes('.'));
            }
            observer.unobserve(el);
          }
        });
      }, { threshold: 0.15 });

      counterElements.forEach(el => counterObserver.observe(el));

      // Safety timeout: trigger animation after 2.5s if observer didn't fire
      setTimeout(() => {
        counterElements.forEach(el => {
          const raw = el.getAttribute('data-target') || '';
          const target = parseFloat(raw);
          if (!isNaN(target)) {
            animateNumber(el, target, 1800, raw.includes('.'));
          }
        });
      }, 2500);
    } else {
      counterElements.forEach(el => {
        el.textContent = el.getAttribute('data-target');
      });
    }
  }

  // Academic Wings Interactive Hover Highlight
  const wingItems = document.querySelectorAll('.gc-wing-item');
  wingItems.forEach(item => {
    item.addEventListener('mouseenter', () => {
      wingItems.forEach(w => w.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // Quick Admission Enquiry Form Submission
  const enquiryForm = document.getElementById('gcEnquiryForm');
  const formFeedback = document.getElementById('gcFormFeedback');

  // Check URL query parameters for feedback after traditional POST redirect
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('enquiry') === 'sent' && formFeedback) {
    formFeedback.style.display = 'block';
    formFeedback.style.background = 'rgba(241, 121, 30, 0.2)';
    formFeedback.style.borderLeftColor = 'var(--orange, #f1791e)';
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
          submitBtn.style.background = 'var(--orange, #f1791e)';

          if (formFeedback) {
            formFeedback.style.display = 'block';
            formFeedback.style.background = 'rgba(241, 121, 30, 0.2)';
            formFeedback.style.borderLeftColor = 'var(--orange, #f1791e)';
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
})();

