(function () {
  'use strict';

  /* ---------- questions ----------
     Step 1 picks one need; step 2 asks only the questions for that need.
     type: one (single choice), many (multiple choice), text, long (textarea). */
  var SOURCES = ['Excel or spreadsheets', 'Email', 'PDF or scanned documents', 'ERP or accounting system', 'CRM', 'Web portals', 'Other'];

  var NEEDS = [
    { id: 'automation', icon: 'automation', title: 'Automate a manual workflow', hint: 'Repetitive work your team does by hand',
      q: [
        { id: 'process', type: 'long', req: true, label: 'Which process do you want to automate?', ph: 'For example: invoices arrive by email and are typed into our accounting system by hand.' },
        { id: 'frequency', type: 'one', req: true, label: 'How often is it done?', opts: ['Daily', 'Weekly', 'Monthly', 'Less often', 'It varies'], noOther: true },
        { id: 'effort', type: 'one', label: 'Roughly how much work does it take today?', opts: ['Under 10 h / month', '10–40 h / month', '40–160 h / month', 'Over 160 h / month', 'Not sure'], noOther: true },
        { id: 'sources', type: 'many', label: 'Where does the data come from?', opts: SOURCES }
      ] },
    { id: 'regulatory', icon: 'regulatory', title: 'Regulatory documents and reporting', hint: 'Forms, declarations and filings to authorities',
      q: [
        { id: 'regulation', type: 'text', req: true, label: 'Which regulation, authority or form is it about?', ph: 'For example: EU MDR, customs declarations, supervisory reporting' },
        { id: 'volume', type: 'one', req: true, label: 'How many documents or filings per year?', opts: ['1–10', '11–100', '101–1 000', 'Over 1 000', 'Not sure'], noOther: true },
        { id: 'today', type: 'one', label: 'Who prepares them today?', opts: ['Our own staff', 'An external consultant', 'Not done yet'] },
        { id: 'sources', type: 'many', label: 'Where does the required data come from?', opts: SOURCES }
      ] },
    { id: 'ai', icon: 'ai', title: 'AI assistant or agent', hint: 'A tool that answers, drafts or acts for your team',
      q: [
        { id: 'task', type: 'long', req: true, label: 'What should the AI tool do?', ph: 'For example: answer customer questions using our product manuals, and hand over to a person when unsure.' },
        { id: 'users', type: 'one', req: true, label: 'Who will use it?', opts: ['Our employees', 'Our customers', 'Both'] },
        { id: 'aisources', type: 'many', label: 'Which information should it use?', opts: ['Documents and manuals', 'Databases', 'Email', 'Website content', 'Other systems'] },
        { id: 'personal', type: 'one', label: 'Does that information include personal data?', opts: ['Yes', 'No', 'Not sure'], noOther: true }
      ] },
    { id: 'documents', icon: 'documents', title: 'Document processing and search', hint: 'Extract, search, sort or check documents',
      q: [
        { id: 'doctypes', type: 'many', req: true, label: 'What kind of documents?', opts: ['PDF files', 'Scanned paper', 'Word or Excel files', 'Emails', 'Images'] },
        { id: 'goal', type: 'many', req: true, label: 'What should happen with them?', opts: ['Extract data into a system', 'Search and answer questions', 'Sort and route them', 'Check them against rules'] },
        { id: 'docvolume', type: 'one', label: 'How many documents per month?', opts: ['Under 100', '100–1 000', '1 000–10 000', 'Over 10 000', 'Not sure'], noOther: true }
      ] },
    { id: 'forecast', icon: 'forecast', title: 'Forecasting and optimisation', hint: 'Models for planning and decisions based on your data',
      q: [
        { id: 'target', type: 'text', req: true, label: 'What do you want to forecast or optimise?', ph: 'For example: weekly demand per product, staff scheduling, purchase volumes' },
        { id: 'history', type: 'one', req: true, label: 'How much historical data do you have?', opts: ['Under 1 year', '1–3 years', 'Over 3 years', 'Not sure'], noOther: true },
        { id: 'where', type: 'many', label: 'Where is the data stored?', opts: ['Spreadsheets', 'Database or data warehouse', 'ERP system', 'Other'] },
        { id: 'decision', type: 'text', label: 'Which decision will the result support?', ph: 'Optional' }
      ] },
    { id: 'modernise', icon: 'modernise', title: 'Modernise an existing system or website', hint: 'Rebuild or improve something you already have',
      q: [
        { id: 'what', type: 'text', req: true, label: 'Which system or website?', ph: 'Name or web address' },
        { id: 'problems', type: 'many', req: true, label: 'What are the main problems?', opts: ['Slow', 'Hard to update', 'Outdated design', 'Does not work well on phones', 'Security concerns', 'Hard to connect to other systems'] },
        { id: 'stack', type: 'text', label: 'Technology used, if you know it', ph: 'Optional' }
      ] },
    { id: 'other', icon: 'other', title: 'Not sure yet', hint: 'Describe the problem and we will suggest an approach',
      q: [
        { id: 'problem', type: 'long', req: true, label: 'What problem would you like to solve?', ph: 'For example: our sales team spends hours each week preparing quotes from supplier price lists.' },
        { id: 'result', type: 'text', label: 'What would a good result look like?', ph: 'Optional' }
      ] }
  ];

  var INDUSTRY = [
    { id: 'industry', type: 'one', req: true, label: 'Choose the closest match', opts: ['Healthcare and medical devices', 'Manufacturing and industry', 'Energy and utilities', 'Logistics and transport',
      'Construction and real estate', 'Retail and e-commerce', 'Professional services', 'Public sector', 'Software and technology', 'Other'] },
    { id: 'industryOther', type: 'text', label: 'Tell us more about your business', ph: 'For example: we make industrial pumps and sell them across Europe' }
  ];

  var SCOPE = [
    { id: 'timeline', type: 'one', req: true, label: 'When would you like to start?', opts: ['As soon as possible', 'Within 3 months', 'Within 6 months', 'Not decided'], noOther: true },
    { id: 'budget', type: 'one', label: 'Indicative budget', opts: ['Under €10 000', '€10 000–30 000', '€30 000–100 000', 'Over €100 000', 'Not sure yet'], noOther: true },
    { id: 'size', type: 'one', req: true, label: 'Company size (employees)', opts: ['1–10', '11–50', '51–250', 'Over 250'], noOther: true }
  ];

  var CONTACT = [
    { id: 'name', type: 'text', req: true, label: 'Name', ac: 'name', half: true },
    { id: 'company', type: 'text', req: true, label: 'Company', ac: 'organization', half: true },
    { id: 'email', type: 'text', req: true, label: 'Work email', ac: 'email', kind: 'email', half: true },
    { id: 'role', type: 'text', label: 'Role', ac: 'organization-title', half: true },
    { id: 'phone', type: 'text', label: 'Phone', ac: 'tel', kind: 'tel', half: true },
    { id: 'notes', type: 'long', label: 'Anything else we should know?', ph: 'Optional' }
  ];

  var TITLES = ['Which industry is your company in?', 'What would you like help with?', 'Tell us a little more', 'Timing and contact details'];

  /* ---------- state ---------- */
  var step = 0, need = null, ans = {};
  var body = document.getElementById('wiz-body'), form = document.getElementById('wiz');
  var back = document.getElementById('wiz-back'), next = document.getElementById('wiz-next'), err = document.getElementById('wiz-err');
  var iconBase = '../img/icons/';

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  function field(q) {
    var wrap = el('div', 'q' + (q.half ? ' half' : ''));
    var lid = 'q-' + q.id;
    if (q.type === 'one' || q.type === 'many') {
      var fs = el('fieldset', 'q-set');
      var lg = el('legend', 'q-label', q.label);
      if (!q.req) lg.appendChild(el('span', 'q-opt', q.type === 'many' ? ' (optional, choose any)' : ' (optional)'));
      else if (q.type === 'many') lg.appendChild(el('span', 'q-opt', ' (choose any)'));
      fs.appendChild(lg);
      var grid = el('div', 'opts');
      var opts = q.noOther || q.opts.indexOf('Other') >= 0 ? q.opts.slice() : q.opts.concat('Other');
      var hasOther = opts.indexOf('Other') >= 0;
      var other = null;
      opts.forEach(function (o) {
        var lab = el('label', 'opt');
        var inp = el('input'); inp.type = q.type === 'one' ? 'radio' : 'checkbox'; inp.name = q.id; inp.value = o;
        var cur = ans[q.id];
        inp.checked = q.type === 'one' ? cur === o : Array.isArray(cur) && cur.indexOf(o) >= 0;
        inp.addEventListener('change', function () {
          if (q.type === 'one') ans[q.id] = o;
          else ans[q.id] = Array.prototype.map.call(form.querySelectorAll('input[name="' + q.id + '"]:checked'), function (i) { return i.value; });
          if (other) toggleOther();
          clearErr();
        });
        lab.appendChild(inp); lab.appendChild(el('span', 'opt-mark')); lab.appendChild(el('span', 'opt-text', o));
        grid.appendChild(lab);
      });
      fs.appendChild(grid);
      if (hasOther) {
        other = el('input', 'q-input q-other'); other.type = 'text'; other.name = q.id + '_other';
        other.placeholder = 'Please describe (optional)'; other.setAttribute('aria-label', q.label + ' (other, please describe)');
        other.value = ans[q.id + '_other'] || '';
        other.addEventListener('input', function () { ans[q.id + '_other'] = other.value; });
        var toggleOther = function () {
          var v = ans[q.id], on = Array.isArray(v) ? v.indexOf('Other') >= 0 : v === 'Other';
          other.hidden = !on; if (on && document.activeElement && document.activeElement.value === 'Other') other.focus({ preventScroll: true });
        };
        fs.appendChild(other);
        other.hidden = true; var cur0 = ans[q.id]; other.hidden = !(Array.isArray(cur0) ? cur0.indexOf('Other') >= 0 : cur0 === 'Other');
      }
      wrap.appendChild(fs);
    } else {
      var l = el('label', 'q-label', q.label); l.htmlFor = lid;
      if (!q.req) l.appendChild(el('span', 'q-opt', ' (optional)'));
      wrap.appendChild(l);
      var f = el(q.type === 'long' ? 'textarea' : 'input', 'q-input');
      f.id = lid; f.name = q.id;
      if (q.type !== 'long') f.type = q.kind || 'text'; else f.rows = 4;
      if (q.ph && q.ph !== 'Optional') f.placeholder = q.ph;
      if (q.ac) f.autocomplete = q.ac;
      f.value = ans[q.id] || '';
      f.addEventListener('input', function () { ans[q.id] = f.value; clearErr(); });
      wrap.appendChild(f);
    }
    return wrap;
  }

  function needTiles() {
    var grid = el('div', 'needs');
    NEEDS.forEach(function (n) {
      var lab = el('label', 'need');
      var inp = el('input'); inp.type = 'radio'; inp.name = 'need'; inp.value = n.id; inp.checked = need === n.id;
      inp.addEventListener('change', function () {
        if (need !== n.id) { var keep = {}; ['industry', 'industry_other', 'industryOther', 'timeline', 'budget', 'size', 'name', 'company', 'email', 'role', 'phone', 'notes'].forEach(function (k) { if (k in ans) keep[k] = ans[k]; }); ans = keep; }
        need = n.id; clearErr();
      });
      var img = el('img'); img.src = iconBase + n.icon + '.svg'; img.alt = ''; img.width = 44; img.height = 44;
      var txt = el('span', 'need-text'); txt.appendChild(el('b', null, n.title)); txt.appendChild(el('span', null, n.hint));
      lab.appendChild(inp); lab.appendChild(img); lab.appendChild(txt); lab.appendChild(el('span', 'need-check'));
      grid.appendChild(lab);
    });
    return grid;
  }

  function current() { return NEEDS.filter(function (n) { return n.id === need; })[0]; }
  function questions() { return step === 0 ? INDUSTRY : step === 2 ? current().q : step === 3 ? SCOPE.concat(CONTACT) : []; }

  function render(dir) {
    body.textContent = '';
    var pane = el('div', 'pane' + (dir ? ' in-' + dir : ''));
    var h = el('h3', 'pane-title', TITLES[step]);
    pane.appendChild(h);
    if (step === 1) {
      pane.appendChild(el('p', 'pane-sub', 'Choose the option closest to your case. The next questions depend on it.'));
      pane.appendChild(needTiles());
    } else {
      if (step === 0) pane.appendChild(el('p', 'pane-sub', 'Our work is tailored to each company, so we start with your field.'));
      if (step === 2) {
        var n = current();
        var chip = el('p', 'pane-sub picked');
        var im = el('img'); im.src = iconBase + n.icon + '.svg'; im.alt = ''; im.width = 22; im.height = 22;
        chip.appendChild(im); chip.appendChild(el('span', null, n.title));
        pane.appendChild(chip);
      }
      var grid = el('div', 'qgrid');
      questions().forEach(function (q) { grid.appendChild(field(q)); });
      pane.appendChild(grid);
    }
    body.appendChild(pane);
    var lis = document.querySelectorAll('#wiz-steps li');
    lis.forEach(function (li, i) { li.className = i < step ? 'done' : i === step ? 'on' : ''; });
    document.getElementById('wiz-bar').style.width = ((step + 1) / 4 * 100) + '%';
    back.hidden = step === 0;
    next.innerHTML = step === 3 ? 'Send enquiry <span aria-hidden="true">→</span>' : 'Continue <span aria-hidden="true">→</span>';
    clearErr();
  }

  function clearErr() { err.hidden = true; form.querySelectorAll('.q.bad').forEach(function (q) { q.classList.remove('bad'); }); }

  function validate() {
    if (step === 1) { if (!need) { showErr('Choose an option to continue.'); return false; } return true; }
    var bad = null;
    questions().forEach(function (q) {
      var v = ans[q.id], ok = true;
      if (q.req) ok = Array.isArray(v) ? v.length > 0 : !!(v && String(v).trim());
      if (ok && q.kind === 'email' && v) ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());
      if (!ok) {
        var node = form.querySelector('[name="' + q.id + '"]').closest('.q'); node.classList.add('bad');
        if (!bad) bad = node;
      }
    });
    if (bad) {
      showErr('Please complete the highlighted ' + (form.querySelectorAll('.q.bad').length > 1 ? 'fields.' : 'field.'));
      var f = bad.querySelector('input, textarea'); if (f) f.focus();
      return false;
    }
    return true;
  }
  function showErr(m) { err.textContent = m; err.hidden = false; }

  function compose() {
    var n = current(), L = [];
    function add(list) {
      list.forEach(function (q) {
        var v = ans[q.id], extra = (ans[q.id + '_other'] || '').trim();
        if (Array.isArray(v)) v = v.map(function (x) { return x === 'Other' && extra ? 'Other (' + extra + ')' : x; }).join(', ');
        else if (v === 'Other' && extra) v = 'Other (' + extra + ')';
        if (v && String(v).trim()) L.push(q.label.replace(/\?$/, '') + ': ' + String(v).trim());
      });
    }
    L.push('INDUSTRY'); if (ans.industry) L.push('Industry: ' + (ans.industry === 'Other' && (ans.industry_other || '').trim() ? 'Other (' + ans.industry_other.trim() + ')' : ans.industry)); if (ans.industryOther) L.push('About the business: ' + ans.industryOther); L.push('');
    L.push('NEED: ' + n.title);
    add(n.q); L.push('');
    L.push('SCOPE'); add(SCOPE); L.push('');
    L.push('CONTACT'); add(CONTACT);
    return { subject: 'Enquiry: ' + n.title + ' (' + (ans.company || '').trim() + ')', body: L.join('\n') };
  }

  function done() {
    var m = compose();
    body.textContent = '';
    var pane = el('div', 'pane in-fwd sent-pane');
    var tick = el('div', 'sent-tick'); tick.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
    pane.appendChild(tick);
    pane.appendChild(el('h3', 'pane-title', 'Your enquiry is ready'));
    var p = el('p', 'pane-sub'); p.textContent = 'Your email program should now open with the enquiry addressed to sales@virkka.com. Press send there to deliver it. If nothing opened, copy the text below and email it to us.';
    pane.appendChild(p);
    var ta = el('textarea', 'q-input sent-text'); ta.readOnly = true; ta.rows = 10; ta.value = 'To: sales@virkka.com\nSubject: ' + m.subject + '\n\n' + m.body;
    pane.appendChild(ta);
    var row = el('div', 'sent-row');
    var copy = el('button', 'wiz-ghost', 'Copy text'); copy.type = 'button';
    copy.addEventListener('click', function () {
      (navigator.clipboard ? navigator.clipboard.writeText(ta.value) : Promise.reject()).then(function () { copy.textContent = 'Copied'; })
        .catch(function () { ta.select(); copy.textContent = 'Selected'; });
      setTimeout(function () { copy.textContent = 'Copy text'; }, 2500);
    });
    var again = el('a', 'wiz-ghost', 'Open email again'); again.href = mailto(m);
    row.appendChild(copy); row.appendChild(again); pane.appendChild(row);
    body.appendChild(pane);
    document.getElementById('wiz-nav').hidden = true;
    document.querySelectorAll('#wiz-steps li').forEach(function (li) { li.className = 'done'; });
    document.getElementById('wiz-bar').style.width = '100%';
    window.location.href = mailto(m);
  }
  function mailto(m) { return 'mailto:sales@virkka.com?subject=' + encodeURIComponent(m.subject) + '&body=' + encodeURIComponent(m.body); }

  function scrollTop() {
    var r = form.getBoundingClientRect();
    if (r.top < 70) window.scrollTo({ top: window.scrollY + r.top - 96, behavior: 'smooth' });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;
    if (step === 3) { done(); return; }
    step++; render('fwd'); scrollTop();
    var first = body.querySelector('input:not([type=radio]):not([type=checkbox]), textarea'); if (first && step === 2) first.focus({ preventScroll: true });
  });
  back.addEventListener('click', function () { if (step > 0) { step--; render('back'); scrollTop(); } });

  render();
})();
