(function () {
  var WA = 'https://wa.me/919050294300';
  var faqs = [
    {
      id: 'admission', label: '📋 Admission Process',
      keys: ['admission', 'apply', 'enroll', 'join', 'register', 'seat', 'form'],
      ans: 'Admission 4 steps mein hoti hai:<br>1. Online enquiry ya campus visit<br>2. Documents verify (birth certificate, previous records, address proof)<br>3. Age-appropriate interaction/assessment<br>4. Fee payment se seat confirm<br><br>Admissions open hain 2026–27 batch ke liye.'
    },
    {
      id: 'fees', label: '💰 Fee Structure',
      keys: ['fee', 'fees', 'cost', 'price', 'charges', 'scholarship'],
      ans: 'Grade-wise fees ke liye school office se contact karein.<br><br>🎓 <b>Max Ultimate Scholarship Test</b> se 90% tak scholarship milti hai — Physics Wallah Vidyapeeth ke saath.'
    },
    {
      id: 'timing', label: '🕐 School Timings',
      keys: ['timing', 'time', 'hours', 'open', 'close', 'schedule'],
      ans: 'Current timings ke liye office se contact karein:<br>📞 9050294300 · 9050248300'
    },
    {
      id: 'transport', label: '🚌 Transport / Bus',
      keys: ['transport', 'bus', 'van', 'pickup', 'drop', 'route'],
      ans: 'Transport routes ke liye school office se poochhein:<br>📞 9050294300 · 9050248300'
    },
    {
      id: 'promax', label: '🏆 Pro Max / Competitive',
      keys: ['neet', 'jee', 'nda', 'competitive', 'coaching', 'promax', 'defense', 'defence'],
      ans: 'Pro-Max regular academics ke saath competitive coaching deta hai:<br>• <b>NEET / JEE Track</b> — test series & mentorship<br>• <b>Defense Wing (NDA Prep)</b> — NDA aspirants ke liye<br>• <b>Max Ultimate Scholarship Test</b> — 90% tak scholarship'
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

  // Answer + "back to menu" button, typing indicator ke saath
  function showAnswer(ansHtml) {
    addBotMsgWithTyping(
      ansHtml + '<br><br><button class="mx-qr mx-back">← Wapas menu pe</button>',
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
      addBotMsgWithTyping('Is sawaal ka jawab abhi mere paas nahi hai. WhatsApp pe seedha poochhein 👇<br><br><a class="mx-wa" href="' + WA + '" target="_blank" rel="noopener">💬 WhatsApp pe poochho</a>', 650);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var box = document.createElement('div');
    box.id = 'mx-box'; box.setAttribute('hidden', '');
    box.innerHTML =
      '<div id="mx-head"><span>Max International School</span><button id="mx-close" aria-label="Close">✕</button></div>' +
      '<div id="mx-msgs"></div>' +
      '<div id="mx-input-row"><input id="mx-input" type="text" placeholder="Apna sawaal likhein..." autocomplete="off"><button id="mx-send" aria-label="Send">➤</button></div>';

    document.body.appendChild(box);

    var opened = false;
    function openChat() {
      box.removeAttribute('hidden');
      if (!opened) {
        opened = true;
        addMsg('Namaste! 🙏 Max International School mein aapka swagat hai.<br>Main kaise madad kar sakta hoon?', true);
        showMenu();
      }
      var inp = document.getElementById('mx-input');
      if (inp) inp.focus();
    }
    function closeChat() { box.setAttribute('hidden', ''); }

    // Public API — menu.js ke "AI Assistant" button se open hota hai
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
