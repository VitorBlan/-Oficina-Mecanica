/* ==========================================================================
   Bancada — aplicação: roteador, layout (barra lateral + topbar),
   busca global, login e tela de confirmação.
   ========================================================================== */
(function () {
  'use strict';
  var B = window.Bancada, Store = B.Store, UI = B.UI, esc = UI.esc, icon = UI.icon;

  var routes = [];
  var state = { path: '/painel', navOpen: false };

  var App = {
    state: state,
    dirty: null,      // { message } quando há formulário com alterações não salvas
    flash: null,      // dados para a tela de confirmação
    ui: {},           // filtros e preferências de cada tela (em memória)
    timers: [],

    route: function (pattern, handler) {
      var keys = [];
      var re = new RegExp('^' + pattern.replace(/:[a-zA-Z]+/g, function (k) { keys.push(k.slice(1)); return '([^/]+)'; }) + '/?$');
      routes.push({ re: re, keys: keys, handler: handler, pattern: pattern });
    },

    resolve: function (path) {
      for (var i = 0; i < routes.length; i++) {
        var m = path.match(routes[i].re);
        if (m) {
          var params = {};
          routes[i].keys.forEach(function (k, j) { params[k] = decodeURIComponent(m[j + 1]); });
          return { handler: routes[i].handler, params: params };
        }
      }
      return null;
    },

    navigate: function (path, opts) {
      opts = opts || {};
      if (App.dirty && path !== state.path && !opts.force) {
        UI.confirmar({
          title: 'Descartar alterações?',
          text: App.dirty.message || 'As alterações deste formulário ainda não foram salvas e serão perdidas.',
          ok: 'Descartar e sair', cancel: 'Continuar editando',
          onConfirm: function () { App.dirty = null; App.go(path, opts.replace); }
        });
        return;
      }
      App.go(path, opts.replace);
    },

    go: function (path, replace) {
      App.dirty = null;
      state.path = path;
      try {
        var h = '#' + path;
        if (window.location.hash !== h) {
          if (replace && window.history && window.history.replaceState) window.history.replaceState(null, '', h);
          else window.location.hash = path;
        }
      } catch (e) { /* ambiente sem histórico: segue só em memória */ }
      App.render();
    },

    refresh: function () { App.render({ keepScroll: true }); },

    success: function (payload) {
      App.flash = payload;
      App.navigate('/sucesso', { force: true });
    },

    session: function () { return Store.getSession(); },

    clearTimers: function () { App.timers.forEach(function (t) { clearInterval(t); }); App.timers = []; },

    render: function (opts) {
      opts = opts || {};
      App.clearTimers();
      UI.closeAllModals();
      var root = document.getElementById('app');
      var path = state.path;
      var session = Store.getSession();
      if (!session && path !== '/login') { state.path = '/login'; path = '/login'; }
      if (session && path === '/login') { state.path = '/painel'; path = '/painel'; }

      var match = App.resolve(path);
      if (!match) { match = App.resolve('/painel'); state.path = '/painel'; }
      var view = match.handler(match.params) || {};
      if (view.redirect) { App.go(view.redirect, true); return; }

      var scrollY = window.scrollY;
      if (view.full) {
        root.innerHTML = view.html;
        document.title = (view.title ? view.title + ' · ' : '') + 'Bancada';
      } else {
        root.innerHTML = shell(view);
        document.title = (view.title || (view.crumbs && view.crumbs.length ? view.crumbs[view.crumbs.length - 1].label : '')) + ' · Bancada';
        bindShell(root);
      }
      UI.applyMasks(root);
      if (view.mount) view.mount(root.querySelector('.main') || root, view);
      if (opts.keepScroll) window.scrollTo(0, scrollY); else window.scrollTo(0, 0);
    },

    start: function () {
      Store.load();
      var h = '';
      try { h = window.location.hash || ''; } catch (e) { h = ''; }
      state.path = h.indexOf('#/') === 0 ? h.slice(1) : '/painel';
      window.addEventListener('hashchange', function () {
        var p = (window.location.hash || '').slice(1) || '/painel';
        if (p.charAt(0) !== '/') return;
        if (p !== state.path) { App.dirty = null; state.path = p; App.render(); }
      });
      document.addEventListener('click', function () {
        var um = document.getElementById('user-menu'); if (um) um.hidden = true;
      });
      document.addEventListener('click', function (e) {
        var a = e.target.closest('[data-route]');
        if (!a || a.hasAttribute('disabled')) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        App.navigate(a.getAttribute('data-route'));
      });
      App.render();
    }
  };

  /* ---------- contadores do menu ---------- */
  function osAtivas() {
    return Store.data.ordens.filter(function (o) { return o.status === 'aprovada' || o.status === 'execucao'; }).length;
  }

  var NAV = [
    { label: 'Atendimento', items: [
      { id: 'painel', label: 'Painel', route: '/painel' },
      { id: 'orcamentos', label: 'Orçamento', route: '/orcamentos' },
      { id: 'ordens', label: 'Ordens de serviço', route: '/ordens', count: osAtivas }
    ] },
    { label: 'Cadastros', items: [
      { id: 'clientes', label: 'Clientes', route: '/clientes' },
      { id: 'veiculos', label: 'Veículos', route: '/veiculos' },
      { id: 'pecas', label: 'Peças e estoque', route: '/pecas' }
    ] },
    { label: 'Gestão', items: [
      { id: 'boxes', label: 'Agenda dos boxes', route: '/boxes' },
      { id: 'relatorios', label: 'Relatórios', route: '/relatorios' }
    ] }
  ];

  function crumbsHtml(crumbs) {
    return (crumbs || []).map(function (c, i) {
      var last = i === crumbs.length - 1;
      var el = last ? '<span class="current">' + esc(c.label) + '</span>'
        : (c.route ? '<a href="#' + c.route + '" data-route="' + c.route + '">' + esc(c.label) + '</a>' : '<span>' + esc(c.label) + '</span>');
      return (i ? '<span class="sep">/</span>' : '') + el;
    }).join('');
  }

  function shell(view) {
    var s = Store.getSession() || {};
    var nav = NAV.map(function (g) {
      return '<div class="nav-label">' + g.label + '</div>' + g.items.map(function (it) {
        var c = it.count ? it.count() : null;
        return '<a class="nav-item ' + (view.nav === it.id ? 'active' : '') + '" href="#' + it.route + '" data-route="' + it.route + '"' + (view.nav === it.id ? ' aria-current="page"' : '') + '>' +
          '<span>' + it.label + '</span><span class="spacer"></span>' + (c ? '<span class="nav-count">' + c + '</span>' : '') + '</a>';
      }).join('');
    }).join('');

    var top = view.topRight !== undefined ? view.topRight : '';
    var search = view.noSearch ? '' :
      '<div class="gsearch" role="search">' + '<span class="ico">' + icon('search', 14) + '</span>' +
      '<input id="gsearch" type="search" autocomplete="off" placeholder="Buscar cliente, placa ou OS" aria-label="Buscar cliente, placa ou OS">' +
      '<div class="gsearch-pop" id="gsearch-pop" hidden></div></div>';

    return '<div class="shell ' + (state.navOpen ? 'nav-open' : '') + '">' +
      '<aside class="sidebar" aria-label="Menu principal">' +
        '<div class="brand"><div class="brand-mark">B</div><div><div class="brand-name">Bancada</div><div class="brand-sub">Antônio Motores</div></div></div>' +
        '<nav style="display:flex;flex-direction:column;gap:4px">' + nav + '</nav>' +
        '<div class="grow"></div>' +
        '<div class="user-box">' +
          '<button type="button" class="user-btn" id="user-btn" aria-haspopup="menu">' +
            '<span class="avatar">' + esc(UI.iniciais(s.nome)) + '</span>' +
            '<span><span class="user-name" style="display:block">' + esc(s.nome) + '</span><span class="user-role">' + esc(s.cargo) + ' · ' + esc(s.matricula) + '</span></span>' +
          '</button>' +
          '<div class="user-menu" id="user-menu" role="menu" hidden>' +
            '<button type="button" class="menu-item" id="btn-reset" role="menuitem">' + icon('refresh', 14) + ' Restaurar dados de exemplo</button>' +
            '<button type="button" class="menu-item danger" id="btn-logout" role="menuitem">' + icon('logout', 14) + ' Sair do sistema</button>' +
          '</div>' +
        '</div>' +
      '</aside>' +
      '<div class="nav-scrim" id="nav-scrim"></div>' +
      '<div class="main">' +
        '<header class="topbar">' +
          '<button type="button" class="btn btn-ghost btn-icon menu-toggle" id="menu-toggle" aria-label="Abrir menu">' + icon('menu', 18) + '</button>' +
          '<nav class="crumbs" aria-label="Você está em">' + crumbsHtml(view.crumbs) + '</nav>' +
          '<span class="spacer"></span>' + top + search +
        '</header>' +
        (view.pre || '') +
        '<div class="body ' + (view.bodyClass || '') + '" id="view-body">' + (view.html || '') + '</div>' +
        (view.after || '') +
      '</div>' +
    '</div>';
  }

  function bindShell(root) {
    var shellEl = root.querySelector('.shell');
    function setNav(open) { state.navOpen = open; shellEl.classList.toggle('nav-open', open); }
    var toggle = root.querySelector('#menu-toggle');
    if (toggle) toggle.addEventListener('click', function () { setNav(!state.navOpen); });
    root.querySelector('#nav-scrim').addEventListener('click', function () { setNav(false); });
    root.querySelectorAll('.sidebar [data-route]').forEach(function (a) {
      a.addEventListener('click', function () { state.navOpen = false; });
    });

    var ub = root.querySelector('#user-btn'), um = root.querySelector('#user-menu');
    ub.addEventListener('click', function (e) { e.stopPropagation(); um.hidden = !um.hidden; });
    um.addEventListener('click', function (e) { e.stopPropagation(); });
    root.querySelector('#btn-logout').addEventListener('click', function () {
      Store.clearSession(); App.dirty = null; state.navOpen = false; App.go('/login');
    });
    root.querySelector('#btn-reset').addEventListener('click', function () {
      UI.confirmar({
        title: 'Restaurar dados de exemplo?',
        text: 'Todos os clientes, veículos, orçamentos, ordens de serviço e peças voltam ao estado inicial. O que foi cadastrado neste navegador será apagado.',
        ok: 'Restaurar dados',
        onConfirm: function () { Store.reset(); UI.toast('Dados de exemplo restaurados.'); App.go('/painel'); }
      });
    });
    bindGlobalSearch(root);
  }

  /* ---------- busca global ---------- */
  function searchAll(q) {
    var n = UI.norm(q), dg = UI.digits(q), pl = UI.normPlaca(q);
    var res = [];
    var cl = Store.data.clientes.filter(function (c) {
      return UI.norm(c.nome).indexOf(n) >= 0 || (dg.length >= 3 && UI.digits(c.cpf).indexOf(dg) >= 0) || (dg.length >= 4 && UI.digits(c.telefone).indexOf(dg) >= 0);
    }).slice(0, 4);
    if (cl.length) res.push({ g: 'Clientes', items: cl.map(function (c) { return { t: c.nome, s: 'CPF ' + c.cpf + ' · ' + c.telefone, r: '/clientes/' + c.id }; }) });
    var ve = Store.data.veiculos.filter(function (v) {
      return (pl.length >= 2 && v.placa.indexOf(pl) >= 0) || UI.norm(v.marca + ' ' + v.modelo + ' ' + v.versao).indexOf(n) >= 0;
    }).slice(0, 4);
    if (ve.length) res.push({ g: 'Veículos', items: ve.map(function (v) { var c = Store.cliente(v.clienteId); return { t: UI.fmtPlaca(v.placa) + ' · ' + v.marca + ' ' + v.modelo, s: (c ? c.nome : 'Sem proprietário') + ' · ' + v.ano, r: '/veiculos/' + v.id }; }) });
    var orc = Store.data.orcamentos.filter(function (o) { return UI.norm(o.id).indexOf(n) >= 0 || (dg.length >= 3 && o.id.indexOf(dg) >= 0 && /orc|^\d/.test(n)); }).slice(0, 4);
    if (orc.length) res.push({ g: 'Orçamentos', items: orc.map(function (o) { var c = Store.cliente(o.clienteId); return { t: o.id, s: (c ? c.nome : '') + ' · ' + UI.ORC_STATUS[o.status].label, r: '/orcamentos/' + o.id }; }) });
    var os = Store.data.ordens.filter(function (o) { return UI.norm(o.id).indexOf(n) >= 0 || (dg.length >= 3 && o.id.indexOf(dg) >= 0 && /os|^\d/.test(n)); }).slice(0, 4);
    if (os.length) res.push({ g: 'Ordens de serviço', items: os.map(function (o) { var c = Store.cliente(o.clienteId); return { t: o.id, s: (c ? c.nome : '') + ' · ' + UI.OS_STATUS[o.status].label, r: '/ordens/' + o.id }; }) });
    return res;
  }

  function bindGlobalSearch(root) {
    var input = root.querySelector('#gsearch'), pop = root.querySelector('#gsearch-pop');
    if (!input) return;
    var flat = [], sel = -1;
    function draw() {
      var q = input.value.trim();
      if (q.length < 2) { pop.hidden = true; return; }
      var res = searchAll(q);
      flat = [];
      if (!res.length) { pop.innerHTML = '<div class="gsearch-empty">Nada encontrado para “' + esc(q) + '”.</div>'; pop.hidden = false; return; }
      pop.innerHTML = res.map(function (g) {
        return '<div class="gsearch-group">' + g.g + '</div>' + g.items.map(function (it) {
          flat.push(it);
          return '<div class="gsearch-item" data-i="' + (flat.length - 1) + '"><span class="t">' + esc(it.t) + '</span><span class="s">' + esc(it.s) + '</span></div>';
        }).join('');
      }).join('');
      sel = -1;
      pop.hidden = false;
    }
    function mark() { pop.querySelectorAll('.gsearch-item').forEach(function (el, i) { el.classList.toggle('sel', i === sel); }); }
    input.addEventListener('input', draw);
    input.addEventListener('focus', draw);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(flat.length - 1, sel + 1); mark(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); mark(); }
      else if (e.key === 'Enter') { var it = flat[sel >= 0 ? sel : 0]; if (it) { pop.hidden = true; App.navigate(it.r); } }
      else if (e.key === 'Escape') { pop.hidden = true; input.blur(); }
    });
    pop.addEventListener('mousedown', function (e) {
      var el = e.target.closest('.gsearch-item'); if (!el) return;
      e.preventDefault();
      pop.hidden = true;
      App.navigate(flat[Number(el.getAttribute('data-i'))].r);
    });
    input.addEventListener('blur', function () { setTimeout(function () { pop.hidden = true; }, 150); });
  }

  /* ---------- Login ---------- */
  App.route('/login', function () {
    var d = Store.data;
    var naOficina = d.ordens.filter(function (o) { return o.status !== 'finalizada' || !o.retiradoEm; }).length +
      d.orcamentos.filter(function (o) { return o.status === 'aberta' || o.status === 'orcada'; }).length;
    var boxes = Object.keys(Store.boxOcupacao()).length;
    var html = '<div class="login">' +
      '<section class="login-brand">' +
        '<div class="brand" style="padding:0"><div class="brand-mark">B</div><div><div class="brand-name" style="font-size:16px;color:var(--primaryfg)">Bancada</div><div class="brand-sub" style="color:var(--subtle);font-size:11.5px">Oficina Antônio Motores · Porto Velho/RO</div></div></div>' +
        '<div class="grow"></div>' +
        '<div>' +
          '<p class="login-thesis">O balcão da oficina, registrado do primeiro contato à entrega da chave.</p>' +
          '<p class="login-lead">Cada ordem de serviço guarda quem registrou, quando e com qual autorização do cliente.</p>' +
          '<div class="login-stats">' +
            '<div><div class="v">' + naOficina + '</div><div class="k">veículos na oficina</div></div>' +
            '<div><div class="v">' + boxes + '</div><div class="k">boxes ativos</div></div>' +
            '<div><div class="v">' + d.mecanicos.length + '</div><div class="k">mecânicos hoje</div></div>' +
          '</div>' +
        '</div>' +
        '<p class="login-foot">Bancada v0.1 · Fábrica de Software I — IFRO</p>' +
      '</section>' +
      '<section class="login-form">' +
        '<form class="login-box" id="login-form" novalidate>' +
          '<div><h1>Entrar no sistema</h1><p class="lead">Informe a matrícula de funcionário e a senha.</p></div>' +
          '<div class="field"><label for="lg-mat">Matrícula</label><input class="input mono" id="lg-mat" name="matricula" value="FUNC-0142" autocomplete="username" autocapitalize="characters"></div>' +
          '<div class="field"><label for="lg-senha">Senha</label><input class="input" id="lg-senha" name="senha" type="password" autocomplete="current-password" placeholder="••••"></div>' +
          '<div id="lg-err" class="alert dgr" hidden><div><div class="a-title">Não foi possível entrar</div><div id="lg-err-msg"></div></div></div>' +
          '<div class="row-between"><label class="check"><input type="checkbox" id="lg-lembrar" name="lembrar"> Manter conectada neste terminal</label><button type="button" class="link-btn" id="lg-esqueci">Esqueci a senha</button></div>' +
          '<button class="btn btn-primary lg block" type="submit">Entrar</button>' +
          '<p class="login-demo">Acesso de demonstração: matrícula <code>FUNC-0142</code> e senha <code>1234</code>.</p>' +
          '<div class="login-note">Acesso restrito por perfil. O módulo de Atendimento só abre para funcionários cadastrados como Secretária. Mecânicos e administradores caem em outra tela inicial.</div>' +
        '</form>' +
      '</section>' +
    '</div>';

    return {
      full: true, title: 'Entrar', html: html,
      mount: function (root) {
        var f = root.querySelector('#login-form');
        var senha = root.querySelector('#lg-senha');
        setTimeout(function () { senha.focus(); }, 50);
        root.querySelector('#lg-esqueci').addEventListener('click', function () {
          UI.modal({ icon: 'info', title: 'Recuperar senha', text: 'Por segurança, a senha só pode ser redefinida pelo administrador da oficina. Procure o Antônio ou o responsável pelo sistema e informe sua matrícula.', actions: [{ label: 'Entendi', cls: 'btn-primary' }] });
        });
        f.addEventListener('submit', function (e) {
          e.preventDefault();
          var v = UI.formValues(f);
          var mat = v.matricula.toUpperCase();
          var fn = Store.data.funcionarios.filter(function (x) { return x.matricula === mat; })[0];
          var err = root.querySelector('#lg-err'), msg = root.querySelector('#lg-err-msg');
          root.querySelectorAll('.field').forEach(function (x) { x.classList.remove('invalid'); });
          if (!fn || fn.senha !== v.senha) {
            msg.textContent = 'Matrícula ou senha incorretas. Confira os dados e tente de novo.';
            err.hidden = false;
            senha.closest('.field').classList.add('invalid');
            senha.select();
            return;
          }
          if (fn.cargo !== 'Secretária') {
            msg.textContent = 'O perfil ' + fn.cargo + ' não tem acesso ao módulo de Atendimento. Entre com uma matrícula de Secretária.';
            err.hidden = false;
            return;
          }
          Store.setSession({ matricula: fn.matricula, nome: fn.nome, cargo: fn.cargo, inicio: new Date().toISOString() }, v.lembrar);
          App.go('/painel', true);
        });
      }
    };
  });

  /* ---------- Confirmação (telas de sucesso) ---------- */
  App.route('/sucesso', function () {
    var f = App.flash;
    if (!f) return { redirect: '/painel' };
    var btns = (f.actions || []).map(function (a, i) {
      return '<button type="button" class="btn ' + (a.cls || (i === 0 ? 'btn-primary' : 'btn-outline')) + ' block" data-route="' + a.route + '">' + esc(a.label) + '</button>';
    }).join('');
    return {
      nav: f.nav, crumbs: f.crumbs, title: f.title,
      html: '<div class="success-wrap"><div class="card success-card" role="status">' +
        '<div class="success-icon">' + icon('checkCircle', 24) + '</div>' +
        '<h1 class="success-title">' + esc(f.title) + '</h1>' +
        (f.code ? '<span class="code-chip">' + esc(f.code) + '</span>' : '') +
        (f.msg ? '<p class="msg">' + esc(f.msg) + '</p>' : '') +
        '<hr><div class="btns">' + btns + '</div>' +
      '</div></div>'
    };
  });

  B.App = App;
})();
