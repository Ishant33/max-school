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
    const apply = navCta.querySelector('.btn');

    brandBar.className = 'brand-bar';
    brandInner.className = 'container brand-inner';
    brandActions.className = 'brand-actions';
    brandInner.appendChild(logo);
    if (login) {
      login.href = 'admin.html';
      login.textContent = 'Log In';
      brandActions.appendChild(login);
    }
    if (apply) {
      apply.href = 'admission.html#apply';
      apply.classList.remove('btn-orange');
      apply.classList.add('btn-navy');
      brandActions.appendChild(apply);
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
    const animateNumber = (element, target, duration) => {
      let startTimestamp = null;
      const startValue = 0;
      function step(timestamp) {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
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
    };

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
  if (enquiryForm) {
    enquiryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = enquiryForm.querySelector('.gc-submit-btn');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Submitting...';
      submitBtn.disabled = true;

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
})();

