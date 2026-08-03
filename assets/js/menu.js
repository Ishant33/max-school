(() => {
  const mobileBreakpoint = 980;
  const nav = document.querySelector('nav.menu');
  const burger = document.querySelector('.burger');

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
})();
