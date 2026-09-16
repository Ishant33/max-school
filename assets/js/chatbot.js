(function () {
  var WA = 'https://wa.me/919050294300';
  var faqs = [
    {
      id: 'admission', label: '📋 Admission Process',
      keys: ['admission', 'apply', 'enroll', 'join', 'register', 'seat', 'form'],
      ans: 'Admission is a 4-step process:<br>1. Online enquiry or campus visit<br>2. Document verification (birth certificate, previous records, address proof)<br>3. Age-appropriate interaction/assessment<br>4. Seat confirmed on fee payment<br><br>Admissions are open for the 2026–27 batch.'
    },
    {
      id: 'fees', label: '💰 Fee Structure',
      keys: ['fee', 'fees', 'cost', 'price', 'charges', 'scholarship'],
      ans: 'Please contact the school office for grade-wise fees.<br><br>🎓 The <b>Max Ultimate Scholarship Test</b> offers scholarships of up to 90% — in association with Physics Wallah Vidyapeeth.'
    },
    {
      id: 'timing', label: '🕐 School Timings',
      keys: ['timing', 'time', 'hours', 'open', 'close', 'schedule'],
      ans: 'Please contact the office for current timings:<br>📞 9050294300 · 9050248300'
    },
    {
      id: 'transport', label: '🚌 Transport / Bus',
      keys: ['transport', 'bus', 'van', 'pickup', 'drop', 'route'],
      ans: 'Please ask the school office about transport routes:<br>📞 9050294300 · 9050248300'
    },
    {
      id: 'promax', label: '🏆 Pro Max / Competitive',
      keys: ['neet', 'jee', 'nda', 'competitive', 'coaching', 'promax', 'defense', 'defence'],
      ans: 'Pro-Max offers competitive coaching alongside regular academics:<br>• <b>NEET / JEE Track</b> — test series &amp; mentorship<br>• <b>Defense Wing (NDA Prep)</b> — for NDA aspirants<br>• <b>Max Ultimate Scholarship Test</b> — scholarships up to 90%'
    },
    {
      id: 'contact', label: '📍 Contact & Location',
      keys: ['contact', 'address', 'location', 'visit', 'phone', 'email', 'where'],
      ans: '📍 Safidon Road, Assandh, District Karnal (HR)<br>📞 9050294300 · 9050248300<br>✉️ principal@maxinternationalschool.com<br>✉️ info@maxinternationalschool.com'
    }
  ];

  function addMsg(html, isBot) {
    var msgs = document.getElementById('mx-msgs');
    var d = document.createElement('div');
    d.className = 'mx-msg ' + (isBot ? 'mx-bot' : 'mx-user');
    d.innerHTML = html;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  }

  function addBotMsgWithTyping(html, delay, cb) {
    var msgs = document.getElementById('mx-msgs');
    var typing = document.createElement('div');
    typing.className = 'mx-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(typing);
    msgs.scrollTop = msgs.scrollHeight;
    setTimeout(function () {
      typing.remove();
      var d = addMsg(html, true);
      if (cb) cb(d);
    }, delay || 600);
  }

  // Answer + "back to menu" button, with typing indicator
  function showAnswer(ansHtml) {
    addBotMsgWithTyping(
      ansHtml + '<br><br><button class="mx-qr mx-back">← Back to menu</button>',
      650,
      function (d) {
        d.querySelector('.mx-back').addEventListener('click', function () {
          d.querySelector('.mx-back').remove();
          showMenu();
        });
      }
    );
  }

  function showMenu() {
    var msgs = document.getElementById('mx-msgs');
    var row = document.createElement('div');
    row.className = 'mx-qr-row';
    row.innerHTML = faqs.map(function (f) {
      return '<button class="mx-qr" data-id="' + f.id + '">' + f.label + '</button>';
    }).join('');
    msgs.appendChild(row);
    msgs.scrollTop = msgs.scrollHeight;
    row.querySelectorAll('.mx-qr').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var faq = faqs.filter(function (f) { return f.id === btn.getAttribute('data-id'); })[0];
        row.remove();
        addMsg(btn.textContent, false);
        showAnswer(faq.ans);
      });
    });
  }

  function handleInput(text) {
    if (!text.trim()) return;
    addMsg(text, false);
    var lower = text.toLowerCase();
    var matched = null;
    for (var i = 0; i < faqs.length && !matched; i++) {
      for (var j = 0; j < faqs[i].keys.length; j++) {
        if (lower.indexOf(faqs[i].keys[j]) !== -1) { matched = faqs[i]; break; }
      }
    }
    if (matched) {
      showAnswer(matched.ans);
    } else {
      addBotMsgWithTyping('I don\'t have an answer for that yet. Please ask us directly on WhatsApp 👇<br><br><a class="mx-wa" href="' + WA + '" target="_blank" rel="noopener">💬 Ask on WhatsApp</a>', 650);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var box = document.createElement('div');
    box.id = 'mx-box'; box.setAttribute('hidden', '');
    box.innerHTML =
      '<div id="mx-head"><span>Max International School</span><button id="mx-close" aria-label="Close">✕</button></div>' +
      '<div id="mx-msgs"></div>' +
      '<div id="mx-input-row"><input id="mx-input" type="text" placeholder="Type your question..." autocomplete="off"><button id="mx-send" aria-label="Send">➤</button></div>';

    document.body.appendChild(box);

    var opened = false;
    function openChat() {
      box.removeAttribute('hidden');
      if (!opened) {
        opened = true;
        addMsg('Welcome to Max International School! 🙏<br>How can I help you today?', true);
        showMenu();
      }
      var inp = document.getElementById('mx-input');
      if (inp) inp.focus();
    }
    function closeChat() { box.setAttribute('hidden', ''); }

    // Public API — opened by the "AI Assistant" button in menu.js
    window.MaxChatbot = { open: openChat, close: closeChat };

    document.getElementById('mx-close').addEventListener('click', closeChat);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeChat();
    });

    function send() {
      var inp = document.getElementById('mx-input');
      handleInput(inp.value); inp.value = '';
    }
    document.getElementById('mx-send').addEventListener('click', send);
    document.getElementById('mx-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') send();
    });
  });
})();
