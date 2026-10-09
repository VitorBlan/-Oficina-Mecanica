/* Clientes — lista (cartões), cadastro (US-003), perfil e atualização cadastral (US-004) */
(function () {
  'use strict';
  var B = window.Bancada, Store = B.Store, UI = B.UI, H = B.H, App = B.App, esc = UI.esc, icon = UI.icon;
  var PAGE = 6;
  function ui() { return App.ui.cli || (App.ui.cli = { q: '', page: 1, tab: 'dados' }); }

  var LABELS = { nome: 'Nome completo', cpf: 'CPF', nascimento: 'Nascimento', telefone: 'Telefone', email: 'E-mail', contatoPreferido: 'Contato preferido', cep: 'CEP', numero: 'Número', logradouro: 'Logradouro', complemento: 'Complemento', bairro: 'Bairro', cidade: 'Cidade', uf: 'UF', observacoes: 'Observações do atendimento' };

  function ultimaVisita(c) {
    var datas = Store.orcamentosDoCliente(c.id).map(function (o) { return o.criadoEm; }).sort();
    return datas.length ? datas[datas.length - 1] : null;
  }
  function ativo(c) { var u = ultimaVisita(c); return u && UI.minutosEntre(u) < 365 * 1440; }

  function situacaoVeiculo(v) {
    var os = Store.ordensDoVeiculo(v.id).filter(function (o) { return o.status !== 'finalizada' || !o.retiradoEm; })[0];
    if (os) return os.status === 'finalizada' ? UI.badge(os.id + ' pronta p/ retirada', 'ok') : UI.badge(os.id + ' ' + UI.OS_STATUS[os.status].label.toLowerCase(), UI.OS_STATUS[os.status].cls);
    var orc = Store.orcamentosDoVeiculo(v.id).filter(function (o) { return o.status === 'aberta' || o.status === 'orcada'; })[0];
    if (orc) return UI.badge(orc.id + ' ' + (orc.status === 'orcada' ? 'orçada' : 'em aberto'), UI.ORC_STATUS[orc.status].cls);
    return UI.badge('Sem OS aberta', '');
  }
  B.situacaoVeiculo = situacaoVeiculo;

  /* ---------------- Lista ---------------- */
  App.route('/clientes', function () {
    var f = ui(), s = App.session() || {};
    var n = UI.norm(f.q), dg = UI.digits(f.q);
    var lista = Store.data.clientes.filter(function (c) {
      if (!n) return true;
      return UI.norm(c.nome).indexOf(n) >= 0 || (dg.length >= 3 && UI.digits(c.cpf).indexOf(dg) >= 0);
    }).sort(function (a, b) { return a.nome.localeCompare(b.nome); });
    var pg = UI.paginate(lista, f.page, PAGE); f.page = pg.page;
    var cards = pg.items.map(function (c) {
      var nv = Store.veiculosDoCliente(c.id).length, uv = ultimaVisita(c);
      return '<article class="card entity-card">' + H.entityPic('person') +
        '<div class="entity-info"><h2 class="entity-name">' + esc(c.nome) + '</h2>' +
        '<span class="entity-line">CPF: ' + esc(c.cpf) + '</span><span class="entity-line">Telefone: ' + esc(c.telefone) + '</span>' +
        '<span class="entity-meta">' + nv + (nv === 1 ? ' veículo cadastrado' : ' veículos cadastrados') + ' · Última visita: ' + (uv ? UI.data(uv) : 'nenhuma') + '</span>' +
        '<button type="button" class="btn btn-soft" data-route="/clientes/' + c.id + '">Acessar perfil</button></div>' +
        '<span class="corner">' + (ativo(c) ? UI.badge('Ativo', 'ok no-dot strong') : UI.badge('Inativo', 'no-dot')) + '</span></article>';
    }).join('') || '<div class="card"><div class="tbl-empty"><strong>Nenhum cliente encontrado</strong>Confira o nome ou CPF digitado, ou cadastre um novo cliente.</div></div>';

    var html =
      '<div class="page-head"><div class="titles"><h1 class="page-title">Clientes</h1><p class="page-sub">Olá, <span class="hl">' + esc((s.nome || '').split(' ')[0]) + '</span> — aqui está a lista de clientes cadastrados.</p></div></div>' +
      '<div class="toolbar"><form class="search-inline" id="cl-search"><label for="cl-q">Buscar:</label><input id="cl-q" type="search" placeholder="Nome ou CPF" value="' + esc(f.q) + '"><button class="btn btn-brand" type="submit">Buscar</button>' + (f.q ? '<button type="button" class="btn btn-ghost" id="cl-clear">Limpar</button>' : '') + '</form>' +
      '<span class="spacer"></span><button type="button" class="btn btn-brand" data-route="/clientes/novo">Novo cliente</button></div>' +
      '<div class="entity-list">' + cards + '</div>' +
      (pg.total > PAGE ? '<div id="cl-pager">' + UI.pagerHtml(pg, 'clientes') + '</div>' : '<p class="muted" style="font-size:12.5px">' + pg.total + (pg.total === 1 ? ' cliente' : ' clientes') + '</p>');

    return {
      nav: 'clientes', crumbs: [{ label: 'Clientes', route: '/clientes' }, { label: 'Cadastrados' }], title: 'Clientes', html: html,
      mount: function (root) {
        root.querySelector('#cl-search').addEventListener('submit', function (e) { e.preventDefault(); f.q = root.querySelector('#cl-q').value.trim(); f.page = 1; App.refresh(); });
        root.querySelector('#cl-q').addEventListener('search', function (e) { if (!e.target.value) { f.q = ''; f.page = 1; App.refresh(); } });
        var cl = root.querySelector('#cl-clear'); if (cl) cl.addEventListener('click', function () { f.q = ''; f.page = 1; App.refresh(); });
        var pgEl = root.querySelector('#cl-pager');
        if (pgEl) pgEl.addEventListener('click', function (e) { var b = e.target.closest('[data-page]'); if (b && !b.disabled) { f.page = Number(b.getAttribute('data-page')); App.render(); } });
      }
    };
  });

  /* ---------------- Formulário (cadastro e edição) ---------------- */
  function input(name, value, attrs) {
    return '<input class="input ' + (attrs && attrs.mono ? 'mono' : '') + '" id="cf-' + name + '" name="' + name + '" value="' + esc(value || '') + '" ' + ((attrs && attrs.extra) || '') + '>';
  }
  function field(name, label, control, help) {
    return '<div class="field" data-f="' + name + '"><label for="cf-' + name + '">' + label + ' <span class="tag-slot"></span></label>' + control + '<span class="help" data-help="' + name + '">' + (help || '') + '</span></div>';
  }
  function clienteForm(c, edit) {
    c = c || {};
    var semNumero = edit && c.numero === 'S/N';
    return '<form id="cli-form" novalidate><div class="grid grid-2" style="align-items:start">' +
      '<section class="card"><div class="card-head"><div class="titles"><h2 class="card-title">Identificação e contato</h2><p class="card-sub">' + (edit ? 'Nome e CPF exigem justificativa para alteração.' : 'Dados usados para identificar o cliente no balcão.') + '</p></div></div><div class="card-body">' +
        field('nome', 'Nome completo', input('nome', c.nome, { extra: 'autocomplete="off" placeholder="Como está no documento"' }), edit ? 'Divergência com o documento? Registre o motivo ao salvar.' : '') +
        '<div class="field" data-f="motivo" id="cf-motivo-wrap" hidden><label for="cf-motivo">Motivo da alteração do nome</label><input class="input" id="cf-motivo" name="motivo" placeholder="Ex.: Correção conforme RG apresentado"></div>' +
        '<div class="form-grid">' +
          field('cpf', 'CPF', edit ? '<input class="input mono" id="cf-cpf" value="' + esc(c.cpf) + '" disabled>' : input('cpf', c.cpf, { mono: true, extra: 'data-mask="cpf" inputmode="numeric" placeholder="000.000.000-00"' }), edit ? 'Bloqueado — o CPF identifica o cliente no sistema.' : '') +
          field('nascimento', 'Nascimento', '<input class="input mono" type="date" id="cf-nascimento" name="nascimento" value="' + esc(c.nascimento || '') + '" max="' + UI.isoDate(new Date()) + '">') +
        '</div>' +
        field('telefone', 'Telefone', input('telefone', c.telefone, { mono: true, extra: 'data-mask="tel" inputmode="tel" placeholder="(69) 90000-0000"' })) +
        field('email', 'E-mail <span class="opt">opcional</span>', input('email', c.email, { extra: 'type="email" placeholder="nome@email.com"' })) +
        field('contatoPreferido', 'Contato preferido', '<select class="select" id="cf-contatoPreferido" name="contatoPreferido">' + H.options(H.contatos, c.contatoPreferido || 'WhatsApp') + '</select>') +
      '</div></section>' +
      '<section class="card"><div class="card-head"><div class="titles"><h2 class="card-title">Endereço</h2><p class="card-sub">O CEP preenche logradouro, bairro e cidade.</p></div></div><div class="card-body">' +
        '<div class="form-grid">' +
          field('cep', 'CEP', input('cep', c.cep, { mono: true, extra: 'data-mask="cep" inputmode="numeric" placeholder="00000-000"' })) +
          '<div class="field" data-f="numero"><label for="cf-numero">Número <span class="tag-slot"></span></label>' + input('numero', semNumero ? '' : c.numero, { mono: true, extra: semNumero ? 'disabled' : '' }) +
            '<label class="check" style="font-size:12px"><input type="checkbox" name="semNumero" id="cf-semNumero" ' + (semNumero ? 'checked' : '') + '> Sem número</label><span class="help" data-help="numero">Obrigatório. Marque “sem número” quando o endereço não tiver.</span></div>' +
        '</div>' +
        field('logradouro', 'Logradouro', input('logradouro', c.logradouro, { extra: 'placeholder="Rua, avenida..."' })) +
        '<div class="form-grid">' + field('complemento', 'Complemento <span class="opt">opcional</span>', input('complemento', c.complemento)) + field('bairro', 'Bairro', input('bairro', c.bairro)) + '</div>' +
        '<div class="form-grid" style="grid-template-columns:minmax(0,1fr) 110px">' + field('cidade', 'Cidade', input('cidade', c.cidade || 'Porto Velho')) +
          field('uf', 'UF', '<select class="select" id="cf-uf" name="uf">' + H.options(H.ufs, c.uf || 'RO') + '</select>') + '</div>' +
        field('observacoes', 'Observações do atendimento <span class="opt">opcional</span>', '<textarea class="textarea" id="cf-observacoes" name="observacoes" rows="2" placeholder="Ex.: Prefere ser avisado depois das 17 h.">' + esc(c.observacoes || '') + '</textarea>') +
      '</div></section>' +
      '</div></form>';
  }

  function validar(v, atual) {
    var err = {}, outros = Store.data.clientes.filter(function (x) { return !atual || x.id !== atual.id; });
    if (!v.nome || v.nome.split(/\s+/).length < 2) err.nome = 'Informe nome e sobrenome.';
    if (!atual) {
      if (!UI.validCPF(v.cpf)) err.cpf = UI.digits(v.cpf).length === 11 ? 'CPF inválido. Confira os dígitos.' : 'Informe os 11 dígitos do CPF.';
      else if (outros.some(function (x) { return UI.digits(x.cpf) === UI.digits(v.cpf); })) err.cpf = 'CPF já cadastrado!';
    }
    if (!v.nascimento) err.nascimento = 'Informe a data de nascimento.';
    else if (new Date(v.nascimento) > new Date()) err.nascimento = 'A data não pode estar no futuro.';
    else if (UI.idade(v.nascimento) < 18) err.nascimento = 'O cliente é menor de idade!';
    var tel = UI.digits(v.telefone);
    if (tel.length < 10) err.telefone = 'Informe DDD e número.';
    else if (outros.some(function (x) { return UI.digits(x.telefone) === tel; })) err.telefone = 'Número de telefone já cadastrado!';
    if (v.email) {
      if (!UI.validEmail(v.email)) err.email = 'E-mail inválido.';
      else if (outros.some(function (x) { return (x.email || '').toLowerCase() === v.email.toLowerCase(); })) err.email = 'E-mail já cadastrado!';
    }
    if (UI.digits(v.cep).length !== 8) err.cep = 'Informe os 8 dígitos do CEP.';
    if (!v.semNumero && !v.numero) err.numero = 'Informe o número ou marque “sem número”.';
    if (!v.logradouro) err.logradouro = 'Informe o logradouro.';
    if (!v.bairro) err.bairro = 'Informe o bairro.';
    if (!v.cidade) err.cidade = 'Informe a cidade.';
    if (atual && v.nome !== atual.nome && !v.motivo) err.motivo = 'Informe o motivo da alteração do nome.';
    return err;
  }

  function bindEndereco(form) {
    var cep = form.querySelector('#cf-cep'), sn = form.querySelector('#cf-semNumero'), num = form.querySelector('#cf-numero');
    sn.addEventListener('change', function () { num.disabled = sn.checked; if (sn.checked) num.value = ''; else num.focus(); });
    var last = UI.digits(cep.value);
    cep.addEventListener('input', function () {
      var d = UI.digits(cep.value);
      if (d.length !== 8 || d === last) return;
      last = d;
      var help = cep.closest('.field').querySelector('.help');
      help.textContent = 'Consultando CEP…';
      UI.buscarCep(d).then(function (r) {
        if (!r) { help.textContent = 'CEP não encontrado automaticamente. Preencha o endereço.'; return; }
        help.textContent = 'Endereço preenchido pelo CEP.';
        [['logradouro', r.logradouro], ['bairro', r.bairro], ['cidade', r.cidade]].forEach(function (p) {
          var el = form.querySelector('#cf-' + p[0]); if (el && p[1]) el.value = p[1];
        });
        if (r.uf) form.querySelector('#cf-uf').value = r.uf;
        form.dispatchEvent(new Event('input'));
        (num.disabled ? form.querySelector('#cf-complemento') : num).focus();
      });
    });
  }

  function dadosDoForm(v) {
    return {
      nome: v.nome, nascimento: v.nascimento, telefone: UI.fmtTel(v.telefone), email: v.email,
      contatoPreferido: v.contatoPreferido, cep: UI.fmtCEP(v.cep), numero: v.semNumero ? 'S/N' : v.numero,
      logradouro: v.logradouro, complemento: v.complemento, bairro: v.bairro, cidade: v.cidade, uf: v.uf, observacoes: v.observacoes
    };
  }

  /* ---------------- Novo cliente ---------------- */
  App.route('/clientes/novo', function () {
    return {
      nav: 'clientes', crumbs: [{ label: 'Clientes', route: '/clientes' }, { label: 'Cadastro de cliente' }], title: 'Novo cliente',
      topRight: '<span class="pill-unsaved" id="cf-pill" hidden></span>',
      html: '<div class="page-head"><div class="titles"><h1 class="page-title">Clientes</h1><p class="page-sub">Cadastro de cliente</p></div></div>' + clienteForm(null, false),
      after: '<div class="form-bar"><span class="spacer"></span><button type="button" class="btn btn-ghost" data-route="/clientes">Descartar</button><button type="submit" form="cli-form" class="btn btn-primary">Cadastrar</button></div>',
      mount: function (root) {
        var form = root.querySelector('#cli-form'), pill = root.querySelector('#cf-pill');
        bindEndereco(form);
        H.trackDirty(form, {
          message: 'O cadastro do cliente ainda não foi concluído. Os dados preenchidos serão perdidos.',
          onChange: function (v) {
            var n = Object.keys(LABELS).filter(function (k) { return k !== 'cidade' && k !== 'uf' && k !== 'contatoPreferido' && v[k]; }).length;
            pill.hidden = !n; pill.textContent = n + (n === 1 ? ' alteração não salva' : ' alterações não salvas');
          }
        });
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var v = UI.formValues(form);
          if (!UI.showErrors(form, validar(v, null))) return;
          var c = dadosDoForm(v);
          c.id = Store.nextId('cliente', 'c'); c.cpf = UI.fmtCPF(v.cpf); c.criadoEm = new Date().toISOString(); c.historico = [];
          Store.data.clientes.push(c); Store.save();
          App.dirty = null;
          App.success({ nav: 'clientes', crumbs: [{ label: 'Clientes', route: '/clientes' }, { label: c.nome }], title: 'Cliente cadastrado com sucesso!', code: c.cpf,
            msg: c.nome + ' já pode receber orçamentos. Cadastre o veículo para abrir o primeiro atendimento.',
            actions: [{ label: 'Cadastrar veículo do cliente', route: '/veiculos/novo/' + c.id }, { label: 'Ver perfil do cliente', route: '/clientes/' + c.id, cls: 'btn-outline' }, { label: 'Voltar à lista', route: '/clientes', cls: 'btn-ghost' }] });
        });
      }
    };
  });

  /* ---------------- Perfil ---------------- */
  function band(c, title, meta, actions) {
    return '<div class="profile-band"><span class="avatar lg">' + esc(UI.iniciais(c.nome)) + '</span><div class="titles"><h1 class="name">' + esc(title) + '</h1><div class="meta">' + meta + '</div></div><span class="spacer"></span><div class="row">' + actions + '</div></div>';
  }

  function atendimentosRows(c, limite) {
    var orcs = Store.orcamentosDoCliente(c.id).sort(function (a, b) { return new Date(b.criadoEm) - new Date(a.criadoEm); });
    if (limite) orcs = orcs.slice(0, limite);
    return orcs.map(function (o) {
      var os = o.osId ? Store.os(o.osId) : null, v = Store.veiculo(o.veiculoId);
      var route = os ? '/ordens/' + os.id : '/orcamentos/' + o.id;
      return '<tr class="click" data-route="' + route + '"><td class="mono nowrap">' + (os ? os.id : o.id) + '</td><td>' + esc(H.veiculoNome(v)) + '</td><td>' + esc(H.servicoPrincipal(o)) + '</td><td class="nowrap">' + UI.data(o.criadoEm) + '</td><td class="num nowrap">' + (Store.orcTotal(o) ? UI.moeda(os ? os.valor : Store.orcTotal(o)) : 'a orçar') + '</td><td>' + (os ? UI.osBadge(os.status) : UI.orcBadge(o.status)) + '</td></tr>';
    }).join('');
  }

  App.route('/clientes/:id', function (p) {
    var c = Store.cliente(p.id);
    if (!c) return { nav: 'clientes', crumbs: [{ label: 'Clientes', route: '/clientes' }], html: '<div class="alert warn"><div><div class="a-title">Cliente não encontrado</div><a href="#/clientes" data-route="/clientes" style="text-decoration:underline">Voltar à lista</a>.</div></div>' };
    var f = ui();
    var vs = Store.veiculosDoCliente(c.id), orcs = Store.orcamentosDoCliente(c.id), oss = Store.ordensDoCliente(c.id);
    var tabs = [['dados', 'Dados cadastrais'], ['veiculos', 'Veículos (' + vs.length + ')'], ['ordens', 'Ordens de serviço (' + orcs.length + ')'], ['historico', 'Histórico de alterações (' + (c.historico || []).length + ')']];
    if (!tabs.some(function (t) { return t[0] === f.tab; })) f.tab = 'dados';
    var meta = '<span>CPF ' + esc(c.cpf) + '</span><span>Cliente desde ' + UI.mesAno(c.criadoEm) + '</span><span>' + vs.length + (vs.length === 1 ? ' veículo' : ' veículos') + '</span><span>' + oss.length + (oss.length === 1 ? ' ordem de serviço' : ' ordens de serviço') + '</span>';
    var pre = band(c, c.nome, meta, '<button type="button" class="btn btn-outline" id="cp-atender">Abrir atendimento</button><button type="button" class="btn btn-primary" data-route="/clientes/' + c.id + '/editar">Editar cadastro</button>') +
      '<div class="tabs" role="tablist">' + tabs.map(function (t) { return '<button type="button" role="tab" class="tab ' + (f.tab === t[0] ? 'on' : '') + '" aria-selected="' + (f.tab === t[0]) + '" data-tab="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';

    var veicTable = '<div class="table-wrap"><table class="tbl plain"><thead><tr><th>Placa</th><th>Modelo</th><th>Ano</th><th>Cor</th><th class="num">Km atual</th><th>Situação</th></tr></thead><tbody>' +
      (vs.map(function (v) {
        return '<tr class="click" data-route="/veiculos/' + v.id + '"><td><span class="plate">' + esc(UI.fmtPlaca(v.placa)) + '</span></td><td>' + esc(H.veiculoNome(v)) + '</td><td class="num" style="text-align:left">' + v.ano + '</td><td>' + esc(v.cor) + '</td><td class="num">' + UI.numero(v.km) + '</td><td>' + situacaoVeiculo(v) + '</td></tr>';
      }).join('') || H.emptyRow(6, 'Nenhum veículo cadastrado', 'Cadastre o veículo para abrir um orçamento.')) + '</tbody></table></div>';
    var atTable = function (lim) {
      return '<div class="table-wrap"><table class="tbl plain"><thead><tr><th>OS</th><th>Veículo</th><th>Serviço principal</th><th>Data</th><th class="num">Valor</th><th>Situação</th></tr></thead><tbody>' +
        (atendimentosRows(c, lim) || H.emptyRow(6, 'Nenhum atendimento registrado', '')) + '</tbody></table></div>';
    };

    var html = '';
    if (f.tab === 'dados') {
      var idade = UI.idade(c.nascimento);
      html = '<div class="grid grid-2" style="align-items:start">' +
        '<section class="card"><div class="card-head"><h2 class="card-title">Identificação e contato</h2></div><div class="card-body" style="padding-top:8px;padding-bottom:8px"><div class="dl">' +
          '<div class="k">Nome completo</div><div>' + esc(c.nome) + '</div>' +
          '<div class="k">CPF</div><div class="mono">' + esc(c.cpf) + '</div>' +
          '<div class="k">Nascimento</div><div class="mono">' + UI.data(c.nascimento + 'T12:00') + (idade !== null ? ' <span class="muted" style="font-family:var(--font)">(' + idade + ' anos)</span>' : '') + '</div>' +
          '<div class="k">Telefone</div><div class="mono">' + esc(c.telefone) + '</div>' +
          '<div class="k">E-mail</div><div>' + esc(c.email || '—') + '</div>' +
          '<div class="k">Contato preferido</div><div>' + esc(c.contatoPreferido) + '</div>' +
        '</div></div></section>' +
        '<section class="card"><div class="card-head"><h2 class="card-title">Endereço</h2></div><div class="card-body" style="padding-top:8px;padding-bottom:8px"><div class="dl">' +
          '<div class="k">CEP</div><div class="mono">' + esc(c.cep) + '</div>' +
          '<div class="k">Logradouro</div><div>' + esc(c.logradouro + (c.numero ? ', ' + c.numero : '')) + '</div>' +
          '<div class="k">Complemento</div><div>' + esc(c.complemento || '—') + '</div>' +
          '<div class="k">Bairro</div><div>' + esc(c.bairro) + '</div>' +
          '<div class="k">Cidade / UF</div><div>' + esc(c.cidade + ' / ' + c.uf) + '</div>' +
          '<div class="k">Observações</div><div class="muted">' + esc(c.observacoes || '—') + '</div>' +
        '</div></div></section></div>' +
        '<section class="card tbl-card"><div class="card-head"><div class="titles"><h2 class="card-title">Veículos do cliente</h2><p class="card-sub">Cada veículo carrega o próprio histórico de ordens de serviço.</p></div><span class="spacer"></span><button type="button" class="btn btn-outline sm" data-route="/veiculos/novo/' + c.id + '">' + icon('plus', 14) + ' Cadastrar veículo</button></div>' + veicTable + '</section>' +
        '<section class="card tbl-card"><div class="card-head"><h2 class="card-title">Últimas ordens de serviço</h2>' + (orcs.length > 5 ? '<span class="spacer"></span><button type="button" class="btn btn-ghost sm" data-tab="ordens">Ver todas</button>' : '') + '</div>' + atTable(5) + '</section>';
    } else if (f.tab === 'veiculos') {
      html = '<section class="card tbl-card"><div class="card-head"><div class="titles"><h2 class="card-title">Veículos do cliente</h2><p class="card-sub">Clique num veículo para ver o histórico completo.</p></div><span class="spacer"></span><button type="button" class="btn btn-brand sm" data-route="/veiculos/novo/' + c.id + '">' + icon('plus', 14) + ' Cadastrar veículo</button></div>' + veicTable + '</section>';
    } else if (f.tab === 'ordens') {
      html = '<section class="card tbl-card"><div class="card-head"><div class="titles"><h2 class="card-title">Orçamentos e ordens de serviço</h2><p class="card-sub">Todos os atendimentos do cliente, do mais recente ao mais antigo.</p></div></div>' + atTable(0) + '</section>';
    } else {
      var hist = (c.historico || []).slice().reverse();
      html = '<section class="card"><div class="card-head"><div class="titles"><h2 class="card-title">Histórico de alterações</h2><p class="card-sub">Quem alterou o cadastro, quando e o que mudou.</p></div></div><div class="card-body">' +
        (hist.length ? '<div class="timeline">' + hist.map(function (h) {
          return '<div class="tl-item"><span class="tl-dot t-info"></span><div style="min-width:0"><div class="tl-title">' + h.campos.length + (h.campos.length === 1 ? ' campo alterado' : ' campos alterados') + ' por ' + esc(h.por) + '</div>' +
            '<div class="tl-time">' + UI.dataHora(h.data) + '</div>' +
            (h.motivo ? '<div class="tl-sub">Motivo: ' + esc(h.motivo) + '</div>' : '') +
            '<ul style="margin:6px 0 0;padding-left:18px;font-size:12.5px;color:var(--secondaryfg)">' + h.campos.map(function (x) { return '<li><strong>' + esc(x.label) + ':</strong> <span class="muted" style="text-decoration:line-through">' + esc(x.de || 'vazio') + '</span> → ' + esc(x.para || 'vazio') + '</li>'; }).join('') + '</ul></div></div>';
        }).join('') + '</div>' : '<p class="muted">Nenhuma alteração registrada desde o cadastro em ' + UI.data(c.criadoEm) + '.</p>') + '</div></section>';
    }

    return {
      nav: 'clientes', crumbs: [{ label: 'Clientes', route: '/clientes' }, { label: c.nome }], title: c.nome, pre: pre, html: html,
      mount: function (root) {
        root.querySelectorAll('[data-tab]').forEach(function (t) { t.addEventListener('click', function () { f.tab = t.getAttribute('data-tab'); App.refresh(); }); });
        root.querySelector('#cp-atender').addEventListener('click', function () {
          if (!vs.length) { UI.toast('Cadastre um veículo para ' + c.nome.split(' ')[0] + ' antes de abrir o atendimento.', 'err'); App.navigate('/veiculos/novo/' + c.id); return; }
          App.ui.prefill = { clienteId: c.id, veiculoId: vs.length === 1 ? vs[0].id : '' };
          App.navigate('/orcamentos/novo');
        });
      }
    };
  });

  /* ---------------- Editar cadastro (US-004) ---------------- */
  App.route('/clientes/:id/editar', function (p) {
    var c = Store.cliente(p.id);
    if (!c) return { redirect: '/clientes' };
    var ult = (c.historico || [])[c.historico.length - 1];
    var meta = '<span>CPF ' + esc(c.cpf) + '</span><span>' + (ult ? 'Última alteração em ' + UI.data(ult.data) + ' por ' + esc(ult.por) : 'Sem alterações desde o cadastro') + '</span>';
    return {
      nav: 'clientes', crumbs: [{ label: 'Clientes', route: '/clientes' }, { label: 'Cliente', route: '/clientes' }, { label: c.nome, route: '/clientes/' + c.id }, { label: 'Editando' }],
      title: 'Editar ' + c.nome,
      topRight: '<span class="pill-unsaved" id="cf-pill" hidden></span>',
      pre: band(c, 'Editar cadastro', meta, ''),
      html: clienteForm(c, true),
      after: '<div class="form-bar"><span class="spacer"></span><button type="button" class="btn btn-ghost" data-route="/clientes/' + c.id + '">Descartar</button><button type="submit" form="cli-form" class="btn btn-primary" id="cf-save" disabled>Salvar alterações</button></div>',
      mount: function (root) {
        var form = root.querySelector('#cli-form'), pill = root.querySelector('#cf-pill'), save = root.querySelector('#cf-save');
        bindEndereco(form);
        var orig = {
          nome: c.nome, nascimento: c.nascimento, telefone: c.telefone, email: c.email || '', contatoPreferido: c.contatoPreferido,
          cep: c.cep, numero: c.numero === 'S/N' ? '' : c.numero, logradouro: c.logradouro, complemento: c.complemento || '', bairro: c.bairro,
          cidade: c.cidade, uf: c.uf, observacoes: c.observacoes || ''
        };
        var origSem = c.numero === 'S/N';
        function changed(v) {
          return Object.keys(orig).filter(function (k) {
            if (k === 'numero') return (v.semNumero !== origSem) || (!v.semNumero && v.numero !== orig.numero);
            return (v[k] || '') !== (orig[k] || '');
          });
        }
        H.trackDirty(form, {
          message: 'As alterações no cadastro de ' + c.nome + ' ainda não foram salvas.',
          onChange: function (v) {
            var ch = changed(v);
            form.querySelectorAll('.field[data-f]').forEach(function (fd) {
              var k = fd.getAttribute('data-f'), slot = fd.querySelector('.tag-slot');
              if (slot) slot.innerHTML = ch.indexOf(k) >= 0 ? '<span class="tag-changed">alterado</span>' : '';
            });
            ['telefone', 'email'].forEach(function (k) {
              var h = form.querySelector('[data-help="' + k + '"]');
              if (h) h.textContent = ch.indexOf(k) >= 0 && orig[k] ? 'Anterior: ' + orig[k] : '';
            });
            form.querySelector('#cf-motivo-wrap').hidden = ch.indexOf('nome') < 0;
            pill.hidden = !ch.length; pill.textContent = ch.length + (ch.length === 1 ? ' alteração não salva' : ' alterações não salvas');
            save.disabled = !ch.length;
          }
        });
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var v = UI.formValues(form);
          var ch = changed(v);
          if (!ch.length) return;
          if (!UI.showErrors(form, validar(v, c))) return;
          var novo = dadosDoForm(v);
          var campos = ch.map(function (k) { return { campo: k, label: LABELS[k], de: k === 'numero' ? c.numero : (c[k] || ''), para: novo[k] || '' }; });
          Object.keys(novo).forEach(function (k) { c[k] = novo[k]; });
          c.historico = c.historico || [];
          c.historico.push({ data: new Date().toISOString(), por: App.session().nome, motivo: v.motivo || '', campos: campos });
          Store.save();
          App.dirty = null;
          App.success({ nav: 'clientes', crumbs: [{ label: 'Clientes', route: '/clientes' }, { label: c.nome, route: '/clientes/' + c.id }, { label: 'Confirmação' }],
            title: 'Cadastro atualizado com sucesso!', code: c.nome,
            msg: campos.length + (campos.length === 1 ? ' alteração registrada' : ' alterações registradas') + ' no histórico do cliente: ' + campos.map(function (x) { return x.label.toLowerCase(); }).join(', ') + '.',
            actions: [{ label: 'Ver perfil do cliente', route: '/clientes/' + c.id }, { label: 'Voltar à lista', route: '/clientes', cls: 'btn-outline' }] });
        });
      }
    };
  });
})();
