/* ==========================================================================
   Bancada — utilitários de interface
   Formatação (moeda, datas, CPF...), máscaras, validações, ícones,
   badges de status, modal, toast, paginação e exportação CSV.
   ========================================================================== */
(function () {
  'use strict';
  var B = window.Bancada;

  /* ---------- texto ---------- */
  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function norm(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }
  function digits(s) { return String(s || '').replace(/\D/g, ''); }
  function iniciais(nome) {
    var p = String(nome || '').trim().split(/\s+/).filter(function (w) { return w.length > 2 || /^[A-ZÁÉÍÓÚ]/.test(w); });
    if (!p.length) return '?';
    var a = p[0][0], b = p.length > 1 ? p[p.length - 1][0] : (p[0][1] || '');
    return (a + b).toUpperCase();
  }

  /* ---------- números e datas ---------- */
  var moneyFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  function moeda(v) { return moneyFmt.format(Number(v) || 0).replace(/ /g, ' '); }
  function numero(v) { return new Intl.NumberFormat('pt-BR').format(Number(v) || 0); }
  function km(v) { return (v || v === 0) ? numero(v) + ' km' : '—'; }
  function parseMoney(s) {
    if (typeof s === 'number') return s;
    var t = String(s || '').replace(/[^\d,.-]/g, '');
    if (t.indexOf(',') >= 0) t = t.replace(/\./g, '').replace(',', '.');
    var n = parseFloat(t);
    return isNaN(n) ? 0 : Math.round(n * 100) / 100;
  }
  function moneyInput(v) {
    return (Number(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function d(isoStr) { return isoStr ? new Date(isoStr) : null; }
  function data(isoStr) { var x = d(isoStr); return x ? pad(x.getDate()) + '/' + pad(x.getMonth() + 1) + '/' + x.getFullYear() : '—'; }
  function hora(isoStr) { var x = d(isoStr); return x ? pad(x.getHours()) + ':' + pad(x.getMinutes()) : '—'; }
  function dataHora(isoStr) { return isoStr ? data(isoStr) + ' ' + hora(isoStr) : '—'; }
  var MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  var MESES_LONGO = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  var DIAS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  function dataCurta(isoStr) { var x = d(isoStr); return x ? x.getDate() + ' ' + MESES[x.getMonth()] + ' ' + x.getFullYear() : '—'; }
  function mesAno(isoStr) { var x = d(isoStr); return x ? MESES_LONGO[x.getMonth()] + ' de ' + x.getFullYear() : '—'; }
  function dataExtenso(dt) {
    var x = dt || new Date();
    return DIAS[x.getDay()] + ', ' + x.getDate() + ' de ' + MESES_LONGO[x.getMonth()] + ' de ' + x.getFullYear();
  }
  function isoDate(x) { return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate()); }
  function minutosEntre(a, b) { return Math.max(0, Math.round(((b ? new Date(b) : new Date()) - new Date(a)) / 60000)); }
  function duracao(min) {
    if (min === null || min === undefined) return '—';
    if (min < 60) return min + ' min';
    var h = Math.floor(min / 60), m = min % 60;
    if (h < 24) return h + 'h ' + pad(m) + 'min';
    var dd = Math.floor(h / 24), hh = h % 24;
    return dd + ' d ' + hh + ' h';
  }
  function parada(min) {
    if (min < 60) return min + ' min';
    var h = Math.floor(min / 60);
    if (h < 24) return h + ' h';
    return Math.floor(h / 24) + ' d ' + (h % 24) + ' h';
  }
  function relativo(isoStr) {
    var m = minutosEntre(isoStr);
    if (m < 1) return 'agora';
    if (m < 60) return 'há ' + m + ' min';
    var h = Math.floor(m / 60);
    if (h < 24) return 'há ' + h + ' h';
    var dd = Math.floor(h / 24);
    return dd === 1 ? 'ontem' : 'há ' + dd + ' dias';
  }
  function mesmoDia(a, b) {
    var x = new Date(a), y = b ? new Date(b) : new Date();
    return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
  }
  function idade(nascIso) {
    if (!nascIso) return null;
    var n = new Date(nascIso + 'T12:00:00'), h = new Date();
    var a = h.getFullYear() - n.getFullYear();
    var m = h.getMonth() - n.getMonth();
    if (m < 0 || (m === 0 && h.getDate() < n.getDate())) a--;
    return a;
  }

  /* ---------- documentos ---------- */
  function fmtCPF(s) {
    var v = digits(s).slice(0, 11);
    return v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  function fmtCNPJ(s) {
    var v = digits(s).slice(0, 14);
    return v.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }
  function fmtTel(s) {
    var v = digits(s).slice(0, 11);
    if (v.length <= 2) return v.length ? '(' + v : '';
    if (v.length <= 6) return '(' + v.slice(0, 2) + ') ' + v.slice(2);
    if (v.length <= 10) return '(' + v.slice(0, 2) + ') ' + v.slice(2, 6) + '-' + v.slice(6);
    return '(' + v.slice(0, 2) + ') ' + v.slice(2, 7) + '-' + v.slice(7);
  }
  function fmtCEP(s) { var v = digits(s).slice(0, 8); return v.length > 5 ? v.slice(0, 5) + '-' + v.slice(5) : v; }
  function normPlaca(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7); }
  function fmtPlaca(s) {
    var p = normPlaca(s);
    return /^[A-Z]{3}\d{4}$/.test(p) ? p.slice(0, 3) + '-' + p.slice(3) : p;
  }
  function validCPF(s) {
    var c = digits(s);
    if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
    for (var t = 9; t < 11; t++) {
      var sum = 0;
      for (var i = 0; i < t; i++) sum += Number(c[i]) * (t + 1 - i);
      var dv = (sum * 10) % 11 % 10;
      if (dv !== Number(c[t])) return false;
    }
    return true;
  }
  function validCNPJ(s) {
    var c = digits(s);
    if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false;
    var w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2], w2 = [6].concat(w1);
    function dv(base, w) { var sum = 0; for (var i = 0; i < w.length; i++) sum += Number(base[i]) * w[i]; var r = sum % 11; return r < 2 ? 0 : 11 - r; }
    return dv(c, w1) === Number(c[12]) && dv(c, w2) === Number(c[13]);
  }
  function validEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || '').trim()); }
  function validPlaca(s) { return /^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(normPlaca(s)); }

  /* ---------- máscaras automáticas (data-mask) ---------- */
  function applyMasks(root) {
    (root || document).querySelectorAll('[data-mask]').forEach(function (el) {
      if (el._masked) return;
      el._masked = true;
      var type = el.getAttribute('data-mask');
      el.addEventListener('input', function () {
        var v = el.value, out = v;
        if (type === 'cpf') out = fmtCPF(v);
        else if (type === 'cnpj') out = fmtCNPJ(v);
        else if (type === 'tel') out = fmtTel(v);
        else if (type === 'cep') out = fmtCEP(v);
        else if (type === 'placa') out = normPlaca(v);
        else if (type === 'int') out = digits(v);
        else if (type === 'km') out = digits(v) ? numero(digits(v).slice(0, 7)) : '';
        else if (type === 'money') out = v.replace(/[^\d,.]/g, '');
        if (out !== v) el.value = out;
      });
      if (type === 'money') {
        el.addEventListener('blur', function () { if (el.value.trim()) el.value = moneyInput(parseMoney(el.value)); });
      }
    });
  }

  /* ---------- ícones ---------- */
  var ICONS = {
    search: '<circle cx="11" cy="11" r="7.5"/><path d="m20.5 20.5-4.2-4.2"/>',
    filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    plusCircle: '<circle cx="12" cy="12" r="9.5"/><path d="M12 8v8M8 12h8"/>',
    back: '<path d="m12 19-7-7 7-7M19 12H5"/>',
    chev: '<path d="m6 9 6 6 6-6"/>',
    chevR: '<path d="m9 18 6-6-6-6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    checkCircle: '<circle cx="12" cy="12" r="9.5"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.64-6.36L21 8"/><path d="M21 3v5h-5"/>',
    alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    clock: '<circle cx="12" cy="12" r="9.5"/><path d="M12 7v5l3 2"/>',
    calendar: '<rect x="3" y="4.5" width="18" height="17" rx="2"/><path d="M16 2.5v4M8 2.5v4M3 10h18"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    truck: '<path d="M10 17h4V5H2v12h3M20 17h2v-3.34a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14v9h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
    file: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
    box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>'
  };
  function icon(name, size, extra) {
    var s = size || 16;
    return '<svg class="ico-svg ' + (extra || '') + '" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }
  var PERSON_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="8.2" r="4.3"/><path d="M3.4 22.5c.7-4.9 4.2-8 8.6-8s7.9 3.1 8.6 8z"/></svg>';
  var CAR_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7.2 6.5h6.6c.9 0 1.7.5 2.1 1.3l1.5 2.7h1.6c1.4 0 2.5 1.1 2.5 2.5v2.5c0 .8-.6 1.5-1.4 1.5h-.5a2.6 2.6 0 0 1-5.1 0H9.5a2.6 2.6 0 0 1-5.1 0h-.5C3.1 17 2.5 16.3 2.5 15.5V13c0-1.4 1.1-2.5 2.5-2.5h.4l.7-2.6c.2-.8.9-1.4 1.1-1.4z"/></svg>';

  /* ---------- status ---------- */
  var ORC_STATUS = {
    aberta: { label: 'Aberta', cls: 'brand' },
    orcada: { label: 'Orçada', cls: 'info' },
    aprovada: { label: 'Aprovada', cls: 'vio' },
    recusada: { label: 'Recusado', cls: 'dgr' }
  };
  var OS_STATUS = {
    aprovada: { label: 'Aprovada', cls: 'ok' },
    execucao: { label: 'Em execução', cls: 'warn' },
    finalizada: { label: 'Finalizada', cls: 'vio' }
  };
  var PECA_STATUS = {
    disponivel: { label: 'Disponível', cls: 'ok' },
    baixo: { label: 'Estoque baixo', cls: 'warn' },
    esgotado: { label: 'Esgotado', cls: 'dgr' }
  };
  function badge(label, cls, extra) { return '<span class="badge ' + (cls || '') + ' ' + (extra || '') + '">' + esc(label) + '</span>'; }
  function orcBadge(st, extra) { var s = ORC_STATUS[st] || { label: st, cls: '' }; return badge(s.label, s.cls, extra); }
  function osBadge(st, extra) { var s = OS_STATUS[st] || { label: st, cls: '' }; return badge(s.label, s.cls, extra); }
  function pecaBadge(st) { var s = PECA_STATUS[st] || { label: st, cls: '' }; return badge(s.label, s.cls); }

  /* ---------- modal ---------- */
  var openModals = [];
  function modal(opts) {
    var back = document.createElement('div');
    back.className = 'modal-back';
    var iconHtml = opts.icon ? '<div class="modal-icon ' + opts.icon + '">' + (opts.icon === 'dgr' ? '!' : opts.icon === 'ok' ? icon('check', 18) : 'i') + '</div>' : '';
    var acts = (opts.actions || []).map(function (a, i) {
      return '<button type="button" class="btn ' + (a.cls || 'btn-outline') + '" data-act="' + i + '">' + a.label + '</button>';
    }).join('');
    back.innerHTML = '<div class="modal ' + (opts.wide ? 'wide' : '') + '" role="dialog" aria-modal="true" aria-labelledby="modal-title">' +
      iconHtml +
      (opts.title ? '<h2 class="modal-title" id="modal-title">' + esc(opts.title) + '</h2>' : '') +
      (opts.text ? '<p class="modal-text">' + opts.text + '</p>' : '') +
      (opts.body || '') +
      (acts ? '<div class="modal-actions">' + acts + '</div>' : '') +
      '</div>';
    document.body.appendChild(back);
    var m = { el: back.querySelector('.modal'), close: close };
    function close() {
      if (!back.parentNode) return;
      back.parentNode.removeChild(back);
      document.removeEventListener('keydown', onKey);
      openModals = openModals.filter(function (x) { return x !== m; });
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    back.addEventListener('mousedown', function (e) { if (e.target === back) close(); });
    (opts.actions || []).forEach(function (a, i) {
      back.querySelector('[data-act="' + i + '"]').addEventListener('click', function () {
        if (a.onClick) { var r = a.onClick(m); if (r === false) return; }
        close();
      });
    });
    openModals.push(m);
    if (opts.onMount) opts.onMount(m.el, m);
    var first = m.el.querySelector('input, select, textarea') || m.el.querySelector('.modal-actions .btn:last-child');
    if (first) setTimeout(function () { first.focus(); }, 30);
    return m;
  }
  function closeAllModals() { openModals.slice().forEach(function (m) { m.close(); }); }
  function confirmar(opts) {
    return modal({
      icon: opts.icon || 'dgr', title: opts.title, text: opts.text,
      actions: [
        { label: opts.cancel || 'Cancelar', cls: 'btn-outline' },
        { label: opts.ok || 'Confirmar', cls: opts.okCls || 'btn-stop', onClick: function () { opts.onConfirm(); } }
      ]
    });
  }

  /* ---------- toast ---------- */
  function toast(msg, type) {
    var host = document.querySelector('.toasts');
    if (!host) { host = document.createElement('div'); host.className = 'toasts'; host.setAttribute('role', 'status'); document.body.appendChild(host); }
    var t = document.createElement('div');
    t.className = 'toast ' + (type === 'err' ? 'err' : '');
    t.innerHTML = '<span class="t-ico">' + icon(type === 'err' ? 'alert' : 'checkCircle', 16) + '</span><span>' + esc(msg) + '</span>';
    host.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .25s'; }, 3200);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3500);
  }

  /* ---------- paginação ---------- */
  function paginate(arr, page, size) {
    var total = arr.length, pages = Math.max(1, Math.ceil(total / size));
    var p = Math.min(Math.max(1, page || 1), pages);
    var start = (p - 1) * size;
    return { items: arr.slice(start, start + size), page: p, pages: pages, from: total ? start + 1 : 0, to: Math.min(start + size, total), total: total };
  }
  function pagerHtml(pg, noun, opts) {
    opts = opts || {};
    var nums = '';
    if (opts.numbers && pg.pages > 1) {
      for (var i = 1; i <= pg.pages; i++) nums += '<button type="button" class="pg ' + (i === pg.page ? 'on' : '') + '" data-page="' + i + '">' + i + '</button>';
    }
    return '<div class="pager">' +
      (opts.infoFirst !== false ? '<span class="info">Mostrando ' + pg.from + '–' + pg.to + ' de ' + pg.total + ' ' + noun + '</span><span class="spacer"></span>' : '') +
      '<button type="button" class="btn btn-outline sm" data-page="' + (pg.page - 1) + '" ' + (pg.page <= 1 ? 'disabled' : '') + '>Anterior</button>' +
      nums +
      '<button type="button" class="btn ' + (pg.page < pg.pages ? 'btn-outline-brand' : 'btn-outline') + ' sm" data-page="' + (pg.page + 1) + '" ' + (pg.page >= pg.pages ? 'disabled' : '') + '>Próxima</button>' +
      '</div>';
  }

  /* ---------- dropdowns ---------- */
  function bindDropdown(root, btnSel, popSel) {
    var btn = root.querySelector(btnSel), pop = root.querySelector(popSel);
    if (!btn || !pop) return;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var willOpen = pop.hidden;
      root.querySelectorAll('.dropdown-pop').forEach(function (p) { p.hidden = true; });
      pop.hidden = !willOpen;
      btn.setAttribute('aria-expanded', String(willOpen));
    });
    pop.addEventListener('click', function (e) { e.stopPropagation(); });
  }
  document.addEventListener('click', function () {
    document.querySelectorAll('.dropdown-pop').forEach(function (p) { p.hidden = true; });
  });

  /* ---------- formulários ---------- */
  function formValues(form) {
    var out = {};
    form.querySelectorAll('[name]').forEach(function (el) {
      if (el.type === 'checkbox') out[el.name] = el.checked;
      else if (el.type === 'radio') { if (el.checked) out[el.name] = el.value; }
      else out[el.name] = el.value.trim();
    });
    return out;
  }
  function showErrors(form, errors) {
    form.querySelectorAll('.field').forEach(function (f) {
      f.classList.remove('invalid');
      var e = f.querySelector('.err'); if (e) e.remove();
    });
    var first = null;
    Object.keys(errors).forEach(function (k) {
      var el = form.querySelector('[name="' + k + '"]');
      if (!el) return;
      var f = el.closest('.field');
      if (!f) return;
      f.classList.add('invalid');
      var e = document.createElement('span');
      e.className = 'err';
      e.textContent = errors[k];
      f.appendChild(e);
      if (!first) first = el;
    });
    if (first) first.focus();
    return !first;
  }

  /* Dentro de um iframe (ex.: página publicada) downloads e consultas externas costumam ser bloqueados */
  var FRAMED = (function () { try { return window.self !== window.top; } catch (e) { return true; } })();
  /* Na página publicada no claude.ai, o download passa pela capacidade "downloads" do visualizador */
  var DL = null;
  try {
    if (window.claude && typeof window.claude.use === 'function') {
      window.claude.use('downloads').then(function (d) { DL = d; }, function () { DL = null; });
    }
  } catch (e) { DL = null; }

  /* ---------- CSV ---------- */
  function toCsv(rows) {
    return rows.map(function (r) {
      return r.map(function (c) {
        var s = c === null || c === undefined ? '' : String(c);
        return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(';');
    }).join('\n');
  }
  function exportCsv(titulo, filename, rows) {
    var csv = toCsv(rows);
    modal({
      wide: true, icon: 'info', title: titulo,
      text: rows.length - 1 + ' linhas, separadas por ponto e vírgula. Abra no Excel, LibreOffice ou Google Planilhas.',
      body: '<div class="csv-box" tabindex="0">' + esc(csv) + '</div>',
      actions: (FRAMED && !DL ? function (a) { return a.slice(0, 2); } : function (a) { return a; })([
        { label: 'Fechar', cls: 'btn-ghost' },
        { label: icon('copy', 14) + ' Copiar', cls: 'btn-outline', onClick: function (m) {
          var done = function () { toast('Conteúdo copiado. Cole numa planilha.'); };
          try {
            navigator.clipboard.writeText(csv).then(done, function () { selectBox(m); });
          } catch (e) { selectBox(m); }
          return false;
        } },
        { label: icon('download', 14) + ' Baixar .csv', cls: 'btn-primary', onClick: function () {
          if (DL) {
            DL.save({ filename: filename, data: '\ufeff' + csv }).then(function () { toast('Arquivo ' + filename + ' salvo.'); }, function (err) {
              if (err && err.code === 'declined') return;
              toast('Não foi possível baixar aqui. Use o botão Copiar.', 'err');
            });
            return false;
          }
          try {
            var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
          } catch (e) { toast('Não foi possível baixar. Use o botão Copiar.', 'err'); return false; }
          return false;
        } }
      ])
    });
    function selectBox(m) {
      var box = m.el.querySelector('.csv-box');
      var r = document.createRange(); r.selectNodeContents(box);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      toast('Texto selecionado. Use Ctrl+C para copiar.');
    }
  }

  /* ---------- CEP (ViaCEP com reserva local) ---------- */
  var CEP_LOCAL = {
    '76804120': { logradouro: 'Rua Duque de Caxias', bairro: 'Nossa Senhora das Graças', cidade: 'Porto Velho', uf: 'RO' },
    '76820408': { logradouro: 'Avenida Jorge Teixeira', bairro: 'Embratel', cidade: 'Porto Velho', uf: 'RO' },
    '76801059': { logradouro: 'Avenida Sete de Setembro', bairro: 'Centro', cidade: 'Porto Velho', uf: 'RO' },
    '76829500': { logradouro: 'Avenida Calama', bairro: 'Flodoaldo Pontes Pinto', cidade: 'Porto Velho', uf: 'RO' },
    '76980000': { logradouro: '', bairro: '', cidade: 'Vilhena', uf: 'RO' }
  };
  function buscarCep(cep) {
    var c = digits(cep);
    return new Promise(function (resolve) {
      if (c.length !== 8) return resolve(null);
      if (CEP_LOCAL[c]) return resolve(CEP_LOCAL[c]);
      if (FRAMED || !window.fetch) return resolve(null);
      var done = false;
      var timer = setTimeout(function () { if (!done) { done = true; resolve(null); } }, 4000);
      try {
        fetch('https://viacep.com.br/ws/' + c + '/json/').then(function (r) { return r.json(); }).then(function (j) {
          if (done) return; done = true; clearTimeout(timer);
          if (!j || j.erro) return resolve(null);
          resolve({ logradouro: j.logradouro, bairro: j.bairro, cidade: j.localidade, uf: j.uf });
        }).catch(function () { if (!done) { done = true; clearTimeout(timer); resolve(null); } });
      } catch (e) { done = true; clearTimeout(timer); resolve(null); }
    });
  }

  B.UI = {
    esc: esc, norm: norm, digits: digits, iniciais: iniciais,
    moeda: moeda, numero: numero, km: km, parseMoney: parseMoney, moneyInput: moneyInput,
    data: data, hora: hora, dataHora: dataHora, dataCurta: dataCurta, mesAno: mesAno, dataExtenso: dataExtenso,
    isoDate: isoDate, minutosEntre: minutosEntre, duracao: duracao, parada: parada, relativo: relativo, mesmoDia: mesmoDia, idade: idade,
    fmtCPF: fmtCPF, fmtCNPJ: fmtCNPJ, fmtTel: fmtTel, fmtCEP: fmtCEP, normPlaca: normPlaca, fmtPlaca: fmtPlaca,
    validCPF: validCPF, validCNPJ: validCNPJ, validEmail: validEmail, validPlaca: validPlaca,
    applyMasks: applyMasks, icon: icon, PERSON_SVG: PERSON_SVG, CAR_SVG: CAR_SVG,
    ORC_STATUS: ORC_STATUS, OS_STATUS: OS_STATUS, PECA_STATUS: PECA_STATUS,
    badge: badge, orcBadge: orcBadge, osBadge: osBadge, pecaBadge: pecaBadge,
    modal: modal, confirmar: confirmar, closeAllModals: closeAllModals, toast: toast,
    paginate: paginate, pagerHtml: pagerHtml, bindDropdown: bindDropdown,
    formValues: formValues, showErrors: showErrors, exportCsv: exportCsv, buscarCep: buscarCep
  };
})();
