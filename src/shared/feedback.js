// Feedback dialog. Builds a prefilled GitHub issue (.github/ISSUE_TEMPLATE) from what the player types,
// then opens it on GitHub, where they check it and click Create. Needs no server.
// Usage: any element with a data-feedback attribute opens it, or call window.openFeedback().
// Pages can define window.feedbackContext = () => ({ key: value }) to attach extra details.
(() => {
  const REPO = '__REPO__';
  const TEXT = {
    en: {
      h: 'Send feedback', intro: 'Your message becomes a public issue on GitHub, where everyone can read along and help.',
      kinds: ['Something is broken', 'The puzzle is wrong', 'Idea or wish'], group: 'Type of feedback',
      ph: ['What did you do, and what went wrong?', 'Which clue or solution do you think is wrong?', 'What would you like to see?'],
      title: 'Short title', desc: 'Description', info: 'Include technical details (page, case, browser) so we can find the problem',
      preview: 'See what gets sent', cancel: 'Cancel', go: 'Continue on GitHub',
      foot: 'On GitHub you check everything and click <b>Create</b>. You need a free GitHub account. No account? <a href="#" class="cp">Copy your message</a> and send it to someone who has one.',
      copied: 'Copied', keys: ['Page', 'Browser', 'Screen']
    },
    nl: {
      h: 'Feedback geven', intro: 'Je bericht wordt een openbaar issue op GitHub, waar iedereen kan meelezen en meehelpen.',
      kinds: ['Er gaat iets mis', 'Puzzel klopt niet', 'Idee of wens'], group: 'Soort feedback',
      ph: ['Wat deed je en wat ging er mis?', 'Welke aanwijzing of oplossing klopt volgens jou niet?', 'Wat zou je graag zien?'],
      title: 'Korte titel', desc: 'Beschrijving', info: 'Technische gegevens meesturen (pagina, zaak, browser), zo kunnen we het probleem terugvinden',
      preview: 'Bekijk wat er wordt meegestuurd', cancel: 'Annuleren', go: 'Verder op GitHub',
      foot: 'Op GitHub controleer je alles en klik je op <b>Create</b>. Daarvoor heb je een gratis GitHub-account nodig. Geen account? <a href="#" class="cp">Kopieer je bericht</a> en stuur het naar iemand die er wel een heeft.',
      copied: 'Gekopieerd', keys: ['Pagina', 'Browser', 'Scherm']
    }
  };
  const L = TEXT[(document.documentElement.lang || 'en').slice(0, 2)] || TEXT.en;
  const KINDS = [
    { id: 'bug', icon: '🐞', template: 'bug.yml' },
    { id: 'puzzle', icon: '🧩', template: 'puzzle.yml' },
    { id: 'idea', icon: '💡', template: 'idea.yml' }
  ].map((k, i) => ({ ...k, label: L.kinds[i], ph: L.ph[i] }));
  const css = `
.fb-back{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(8,6,4,.55);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
.fb-back.on{display:flex}
.fb{width:min(440px,100%);max-height:calc(100dvh - 32px);overflow:auto;background:#1b1714;color:#f3eadb;border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:20px;box-shadow:0 24px 70px rgba(0,0,0,.5);font:15px/1.45 Inter,system-ui,-apple-system,"Segoe UI",sans-serif}
.fb h3{margin:0 0 4px;font-size:19px;font-weight:700}
.fb p{margin:0 0 14px;color:#c9bca8;font-size:13.5px}
.fb .k{display:grid;gap:8px;margin-bottom:12px}
.fb .k button{display:flex;align-items:center;gap:10px;text-align:left;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:inherit;font:inherit;cursor:pointer}
.fb .k button[aria-pressed=true]{border-color:#e0a84a;background:rgba(224,168,74,.14)}
.fb .k span{font-size:18px}
.fb label{display:block;font-size:13px;color:#c9bca8;margin:10px 0 6px}
.fb input[type=text],.fb textarea{width:100%;box-sizing:border-box;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.25);color:inherit;font:inherit}
.fb textarea{min-height:110px;resize:vertical}
.fb .chk{display:flex;gap:8px;align-items:flex-start;margin:12px 0 4px;font-size:13px;color:#c9bca8}
.fb .chk input{margin-top:3px}
.fb details{font-size:12px;color:#9d917f;margin-bottom:12px}
.fb pre{white-space:pre-wrap;word-break:break-word;margin:6px 0 0;font-size:11.5px}
.fb .row{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:6px}
.fb .row button{padding:10px 16px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:transparent;color:inherit;font:inherit;font-weight:600;cursor:pointer}
.fb .row .go{background:#e0a84a;border-color:#e0a84a;color:#22180c}
.fb .row .go:disabled{opacity:.5;cursor:default}
.fb small{display:block;margin-top:12px;color:#9d917f;font-size:12px}
.fb a{color:#e8bd6c}`;

  let el, kind = KINDS[0];
  const info = () => {
    const extra = (typeof window.feedbackContext === 'function' && window.feedbackContext()) || {};
    const [page, browser, screen] = L.keys;
    return Object.assign({
      [page]: location.origin + location.pathname + location.search + location.hash,
      [browser]: navigator.userAgent,
      [screen]: `${innerWidth}×${innerHeight} @${devicePixelRatio}x`
    }, extra);
  };
  const infoText = () => Object.entries(info()).map(([k, v]) => `- **${k}:** ${v}`).join('\n');

  function mount() {
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    el = document.createElement('div'); el.className = 'fb-back'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'fb-h');
    el.innerHTML = `<form class="fb" novalidate>
      <h3 id="fb-h">${L.h}</h3>
      <p>${L.intro}</p>
      <div class="k" role="group" aria-label="${L.group}">${KINDS.map(k => `<button type="button" data-k="${k.id}" aria-pressed="false"><span>${k.icon}</span>${k.label}</button>`).join('')}</div>
      <label for="fb-t">${L.title}</label><input id="fb-t" type="text" maxlength="90" autocomplete="off">
      <label for="fb-d">${L.desc}</label><textarea id="fb-d" maxlength="4000"></textarea>
      <div class="chk"><input id="fb-i" type="checkbox" checked><label for="fb-i" style="margin:0">${L.info}</label></div>
      <details><summary>${L.preview}</summary><pre id="fb-p"></pre></details>
      <div class="row"><button type="button" class="no">${L.cancel}</button><button type="submit" class="go">${L.go}</button></div>
      <small>${L.foot}</small>
    </form>`;
    document.body.appendChild(el);
    const $ = s => el.querySelector(s);
    const pick = id => { kind = KINDS.find(k => k.id === id) || KINDS[0]; el.querySelectorAll('.k button').forEach(b => b.setAttribute('aria-pressed', b.dataset.k === kind.id)); $('#fb-d').placeholder = kind.ph; sync() };
    const sync = () => { $('.go').disabled = $('#fb-d').value.trim().length < 5 };
    el.querySelectorAll('.k button').forEach(b => b.onclick = () => pick(b.dataset.k));
    $('#fb-d').oninput = sync;
    $('.no').onclick = close;
    el.addEventListener('click', e => { if (e.target === el) close() });
    el.addEventListener('keydown', e => { if (e.key === 'Escape') close(); e.stopPropagation() });
    $('details').ontoggle = () => { $('#fb-p').textContent = infoText() };
    const data = () => ({
      title: $('#fb-t').value.trim() || $('#fb-d').value.trim().split('\n')[0].slice(0, 70),
      description: $('#fb-d').value.trim(),
      context: $('#fb-i').checked ? infoText() : ''
    });
    $('.cp').onclick = e => {
      e.preventDefault(); const b = data();
      navigator.clipboard?.writeText(`${kind.icon} ${b.title}\n\n${b.description}${b.context ? '\n\n' + b.context : ''}`).then(() => { e.target.textContent = L.copied });
    };
    $('form').onsubmit = e => {
      e.preventDefault(); const b = data(); if (b.description.length < 5) return;
      const q = new URLSearchParams({ template: kind.template, title: b.title, description: b.description });
      if (b.context) q.set('context', b.context);
      window.open(`https://github.com/${REPO}/issues/new?${q}`, '_blank', 'noopener');
      close(); $('#fb-t').value = ''; $('#fb-d').value = ''; sync();
    };
    el._pick = pick;
  }
  let last;
  function open(k) {
    if (!el) mount();
    last = document.activeElement; el._pick(k || kind.id); el.classList.add('on');
    setTimeout(() => el.querySelector('#fb-d').focus(), 50);
  }
  function close() { el.classList.remove('on'); last?.focus?.() }
  window.openFeedback = open;
  document.addEventListener('click', e => { const t = e.target.closest('[data-feedback]'); if (t) { e.preventDefault(); open(t.dataset.feedback) } });
})();
