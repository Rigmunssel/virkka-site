/* GS1 UDI decoder: parses GS1 element strings used in medical device UDIs. */
(function (root) {
  'use strict';

  var GS = '\x1d';
  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  // fixed: length of the data; predefined: no separator needed after it (GS1 General Specifications, Figure 7.8.5-2)
  var AIS = {
    '01':   { name: 'GTIN', role: 'UDI-DI: identifies the device model and packaging level', fixed: 14, predefined: true, type: 'gtin' },
    '11':   { name: 'Production date', role: 'UDI-PI: production identifier', fixed: 6, predefined: true, type: 'date' },
    '17':   { name: 'Expiry date', role: 'UDI-PI: production identifier', fixed: 6, predefined: true, type: 'date' },
    '10':   { name: 'Batch or lot number', role: 'UDI-PI: production identifier', max: 20, type: 'text' },
    '21':   { name: 'Serial number', role: 'UDI-PI: production identifier', max: 20, type: 'text' },
    '240':  { name: 'Additional product identification', role: 'Supplementary data', max: 30, type: 'text' },
    '7003': { name: 'Expiry date and time', role: 'UDI-PI: production identifier', fixed: 10, type: 'datetime' }
  };
  var CSET82 = /^[!"%&'()*+,\-./0-9:;<=>?A-Z_a-z]+$/;

  function checkDigit(body) {
    var sum = 0;
    for (var i = body.length - 1, w = 3; i >= 0; i--, w = 4 - w) sum += (body.charCodeAt(i) - 48) * w;
    return (10 - sum % 10) % 10;
  }

  function fullYear(yy, now) {
    var cur = now.getFullYear(), curYY = cur % 100, century = cur - curYY, diff = yy - curYY;
    if (diff >= 51) century -= 100;        // 51 to 99 years ahead: previous century
    else if (diff <= -50) century += 100;  // 50 to 99 years behind: next century
    return century + yy;
  }
  function daysIn(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }
  function fmt(y, m, d) { return d + ' ' + MONTHS[m - 1] + ' ' + y; }

  function parseDate(v, now) {
    if (!/^\d{6}$/.test(v)) return { error: 'must be six digits (YYMMDD)' };
    var yy = +v.slice(0, 2), m = +v.slice(2, 4), d = +v.slice(4, 6), y = fullYear(yy, now);
    if (m < 1 || m > 12) return { error: 'month ' + v.slice(2, 4) + ' does not exist' };
    var dim = daysIn(y, m);
    if (d > dim) return { error: MONTHS[m - 1] + ' ' + y + ' has only ' + dim + ' days' };
    return { y: y, m: m, d: d, monthOnly: d === 0, last: new Date(Date.UTC(y, m - 1, d || dim)) };
  }

  function normalise(raw) {
    var s = raw.replace(/<\s*GS\s*>|\{GS\}|\\x1d|\\u001d|\[GS\]/gi, GS).replace(/[|^]/g, GS);
    s = s.replace(/[\s ]+/g, '');
    s = s.replace(/^\][A-Za-z][0-9]/, '');      // symbology identifier, e.g. ]d2, ]C1, ]Q3
    s = s.replace(/^\x1d+/, '').replace(/\x1d+$/, '');
    return s;
  }

  function splitBracketed(s, errors) {
    var out = [], re = /\((\d{2,4})\)([^(]*)/g, m, consumed = 0;
    while ((m = re.exec(s))) {
      if (m.index !== consumed) errors.push('Unexpected text "' + s.slice(consumed, m.index) + '" before (' + m[1] + ').');
      out.push({ ai: m[1], value: m[2].replace(/\x1d/g, '') });
      consumed = re.lastIndex;
    }
    if (consumed < s.length) errors.push('Unexpected text "' + s.slice(consumed) + '" at the end.');
    return out;
  }

  function matchAI(s, i) {
    for (var n = 4; n >= 2; n--) { var c = s.substr(i, n); if (AIS[c] && c.length === n) return c; }
    return null;
  }

  function splitRaw(s, errors) {
    var out = [], i = 0;
    while (i < s.length) {
      if (s[i] === GS) { i++; continue; }
      var ai = matchAI(s, i);
      if (!ai) {
        errors.push('Unrecognised application identifier at "' + s.slice(i, i + 8) + (s.length > i + 8 ? '…' : '') + '". Supported: (01), (10), (11), (17), (21), (240), (7003).');
        break;
      }
      var def = AIS[ai], start = i + ai.length, value;
      if (def.fixed) {
        value = s.substr(start, def.fixed);
        i = start + def.fixed;
        if (!def.predefined && i < s.length && s[i] !== GS) errors.push('(' + ai + ') must be followed by a separator (GS) when more data follows.');
      } else {
        var end = s.indexOf(GS, start); if (end < 0) end = s.length;
        value = s.slice(start, end);
        i = end;
      }
      out.push({ ai: ai, value: value });
    }
    return out;
  }

  function decode(raw, now) {
    now = now || new Date();
    var today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    var errors = [], fields = [], s = normalise(raw || '');
    var r = { kind: 'udi', errors: errors, fields: fields, summary: '' };

    if (!s) { errors.push('No data entered.'); return r; }
    if (/^\+/.test(s)) { errors.push('This looks like a HIBCC UDI (it starts with "+"). The decoder supports GS1 UDIs only.'); r.summary = 'Unsupported format'; return r; }
    if (/^[=&]/.test(s)) { errors.push('This looks like an ICCBBA UDI. The decoder supports GS1 UDIs only.'); r.summary = 'Unsupported format'; return r; }

    var parts;
    if (/^\d+$/.test(s) && [8, 12, 13, 14].indexOf(s.length) >= 0 && s.indexOf('(') < 0 && !(s.length > 14)) {
      // a bare GTIN, unless it is a complete (01) element string of 16 digits, which falls through below
      r.kind = 'gtin';
      parts = [{ ai: '01', value: ('00000000000000' + s).slice(-14) }];
    } else if (s.indexOf('(') >= 0) {
      parts = splitBracketed(s, errors);
    } else {
      parts = splitRaw(s, errors);
    }

    var seen = {};
    parts.forEach(function (p) {
      var def = AIS[p.ai];
      if (!def) { errors.push('(' + p.ai + ') is not an application identifier the decoder supports.'); return; }
      if (seen[p.ai]) errors.push('(' + p.ai + ') appears more than once.');
      seen[p.ai] = p;
      var f = { ai: p.ai, name: def.name, role: def.role, value: p.value };

      if (def.type === 'gtin') {
        if (!/^\d{14}$/.test(p.value)) { errors.push('The GTIN (01) must be 14 digits; found ' + p.value.length + ' characters.'); f.human = 'Invalid length'; f.state = 'err'; }
        else {
          var want = checkDigit(p.value.slice(0, 13)), got = +p.value[13];
          if (want === got) { f.human = 'Check digit ' + got + ' is correct'; f.state = 'ok'; }
          else { errors.push('The GTIN check digit is ' + got + ' but should be ' + want + '. The number is mistyped or misprinted.'); f.human = 'Check digit should be ' + want; f.state = 'err'; }
          if (r.kind === 'gtin' && raw.replace(/\D/g, '').length < 14) f.note = 'Shown as GTIN-14 with leading zeros.';
        }
      } else if (def.type === 'date' || def.type === 'datetime') {
        var dpart = def.type === 'datetime' ? p.value.slice(0, 6) : p.value;
        if (def.type === 'datetime' && !/^\d{10}$/.test(p.value)) { errors.push('(7003) must be 10 digits (YYMMDDhhmm).'); f.state = 'err'; f.human = 'Invalid'; }
        else {
          var d = parseDate(dpart, now);
          if (d.error) { errors.push(def.name + ' (' + p.ai + '): ' + d.error + '.'); f.human = 'Invalid date'; f.state = 'err'; }
          else {
            var txt = d.monthOnly ? MONTHS[d.m - 1] + ' ' + d.y : fmt(d.y, d.m, d.d);
            if (def.type === 'datetime') {
              var hh = +p.value.slice(6, 8), mi = +p.value.slice(8, 10);
              if (d.monthOnly || hh > 23 || mi > 59) { errors.push('(7003) has an invalid day or time.'); f.state = 'err'; }
              txt += ', ' + p.value.slice(6, 8) + ':' + p.value.slice(8, 10);
            }
            f.date = d;
            if (p.ai === '11') {
              f.human = d.monthOnly ? txt + ' (day not specified)' : txt;
              if (d.monthOnly) f.note = 'GS1 allows day 00, but the US FDA database (GUDID) rejects it in a UDI.';
              if (d.last > today && !d.monthOnly) { f.note = 'This production date is in the future.'; f.state = 'warnc'; }
            } else {
              var expired = d.last < today;
              f.human = (d.monthOnly ? 'End of ' : '') + txt + (expired ? ' · expired' : ' · not expired');
              f.state = expired ? 'err' : 'ok';
              if (d.monthOnly) { f.note = 'Day 00 means no day is given, so the date is the last day of the month. GS1 allows this, but the US FDA database (GUDID) rejects day 00 in a UDI.'; if (!expired) f.state = 'warnc'; }
            }
          }
        }
      } else {
        if (!p.value) { errors.push(def.name + ' (' + p.ai + ') is empty.'); f.state = 'err'; }
        else {
          if (p.value.length > def.max) errors.push(def.name + ' (' + p.ai + ') is ' + p.value.length + ' characters; the maximum is ' + def.max + '. A separator may be missing after it.');
          if (!CSET82.test(p.value)) errors.push(def.name + ' (' + p.ai + ') contains characters that GS1 does not allow.');
        }
      }
      fields.push(f);
    });

    if (fields.length && !seen['01']) errors.push('No device identifier (01) found. Every GS1 UDI starts from a GTIN.');
    if (seen['11'] && seen['17']) {
      var a = fields.filter(function (x) { return x.ai === '11'; })[0].date, b = fields.filter(function (x) { return x.ai === '17'; })[0].date;
      if (a && b && b.last < a.last) errors.push('The expiry date is before the production date.');
    }

    var bits = [], order = { '01': 1, '10': 2, '21': 3, '17': 4 };
    fields.slice().sort(function (x, y) { return (order[x.ai] || 9) - (order[y.ai] || 9); }).forEach(function (f) {
      if (f.ai === '01') bits.push('GTIN ' + f.value);
      if (f.ai === '10') bits.push('Lot ' + f.value);
      if (f.ai === '21') bits.push('Serial ' + f.value);
      if (f.ai === '17' && f.date) bits.push('Expiry ' + (f.date.monthOnly ? 'end of ' + MONTHS[f.date.m - 1] + ' ' + f.date.y : fmt(f.date.y, f.date.m, f.date.d)));
    });
    r.summary = bits.join(' · ') || (errors.length ? 'The data could not be decoded' : '');
    return r;
  }

  var api = { decode: decode, checkDigit: checkDigit, fullYear: fullYear };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.UDI = api;
})(this);
