/* Veículos — lista (US-011), cadastro (US-006), visualização (US-014), atualização (US-007) e histórico por placa (US-029) */
(function () {
  'use strict';
  var B = window.Bancada, Store = B.Store, UI = B.UI, H = B.H, App = B.App, esc = UI.esc, icon = UI.icon;
  var PAGE = 6;
  function ui() { return App.ui.vei || (App.ui.vei = { q: '', page: 1 }); }
  var CR = [{ label: 'Veículos', route: '/veiculos' }];

  /* ---------------- Lista ---------------- */
  App.route('/veiculos', function () {
    var f = ui();
    var n = UI.norm(f.q), pl = UI.normPlaca(f.q);
    var lista = Store.data.veiculos.filter(function (v) {
      if (!n) return true;
      var c = Store.cliente(v.clienteId);
      return (pl.length >= 2 && v.placa.indexOf(pl) >= 0) || UI.norm(v.marca + ' ' + v.modelo + ' ' + v.versao).indexOf(n) >= 0 || UI.norm(c && c.nome).indexOf(n) >= 0;
    }).sort(function (a, b) { return a.placa.localeCompare(b.placa); });
    var pg = UI.paginate(lista, f.page, PAGE); f.page = pg.page;
    var cards = pg.items.map(function (v) {
      var c = Store.cliente(v.clienteId);
      return '<article class="card entity-card">' + H.entityPic('car') +
        '<div class="entity-info"><h2 class="entity-name mono" style="font-family:var(--font)">' + esc(UI.fmtPlaca(v.placa)) + '</h2>' +
        '<span class="entity-line">Marca: ' + esc(v.marca) + '</span><span class="entity-line">Modelo: ' + esc(v.modelo + (v.versao ? ' ' + v.versao : '')) + '</span>' +
        '<span class="entity-meta">' + v.ano + ' · ' + esc(v.cor) + ' · ' + UI.km(v.km) + ' · Proprietário: ' + esc(c ? c.nome : '—') + '</span>' +
        '<button type="button" class="btn btn-soft" data-route="/veiculos/' + v.id + '">Acessar perfil</button></div>' +
        '<span class="corner">' + B.situacaoVeiculo(v) + '</span></article>';
    }).join('') || '<div class="card"><div class="tbl-empty"><strong>Nenhum veículo encontrado</strong>Confira a placa ou o modelo digitado.</div></div>';

    var html =
      '<div class="page-head"><div class="titles"><h1 class="page-title">Carros</h1><p class="page-sub">Lista de carros cadastrados</p></div></div>' +
      '<div class="toolbar"><form class="search-inline" id="vl-search"><label for="vl-q" style="font-size:13px">Buscar:</label><input id="vl-q" type="search" placeholder="Placa, modelo ou proprietário" value="' + esc(f.q) + '"><button class="btn btn-brand" type="submit">Buscar</button>' + (f.q ? '<button type="button" class="btn btn-ghost" id="vl-clear">Limpar</button>' : '') + '</form>' +
      '<span class="spacer"></span><button type="button" class="btn btn-outline" data-route="/veiculos/historico">' + icon('history', 14) + ' Histórico por placa</button><button type="button" class="btn btn-brand" data-route="/veiculos/novo">Novo veículo</button></div>' +
      '<div class="entity-list">' + cards + '</div>' +
      (pg.total > PAGE ? '<div id="vl-pager">' + UI.pagerHtml(pg, 'veículos') + '</div>' : '<p class="muted" style="font-size:12.5px">' + pg.total + (pg.total === 1 ? ' veículo' : ' veículos') + '</p>');

    return {
      nav: 'veiculos', crumbs: CR.concat([{ label: 'Cadastrados' }]), title: 'Veículos', html: html,
      mount: function (root) {
        root.querySelector('#vl-search').addEventListener('submit', function (e) { e.preventDefault(); f.q = root.querySelector('#vl-q').value.trim(); f.page = 1; App.refresh(); });
        var cl = root.querySelector('#vl-clear'); if (cl) cl.addEventListener('click', function () { f.q = ''; f.page = 1; App.refresh(); });
        var pgEl = root.querySelector('#vl-pager');
        if (pgEl) pgEl.addEventListener('click', function (e) { var b = e.target.closest('[data-page]'); if (b && !b.disabled) { f.page = Number(b.getAttribute('data-page')); App.render(); } });
      }
    };
  });

  /* ---------------- Formulário ---------------- */
  function anos() { var y = new Date().getFullYear() + 1, out = []; for (var i = y; i >= 1980; i--) out.push(String(i)); return out; }
  function veiculoForm(v, cpf) {
    v = v || {};
    var modelos = v.marca && H.marcas[v.marca] ? H.marcas[v.marca] : [];
    if (v.modelo && modelos.indexOf(v.modelo) < 0) modelos = modelos.concat([v.modelo]);
    return '<form id="vei-form" novalidate><section class="card"><div class="card-head"><div class="titles"><h2 class="card-title">Dados do veículo</h2><p class="card-sub">Preencha os campos abaixo para registrar o carro.</p></div></div><div class="card-body"><div class="form-grid">' +
      '<div class="field"><label for="vf-marca">Marca</label><select class="select" id="vf-marca" name="marca">' + H.options(Object.keys(H.marcas), v.marca, 'Selecione a marca') + '</select></div>' +
      '<div class="field"><label for="vf-modelo">Modelo</label><select class="select" id="vf-modelo" name="modelo" ' + (v.marca ? '' : 'disabled') + '>' + (v.marca ? H.options(modelos, v.modelo, 'Selecione o modelo') : '<option value="">Escolha a marca primeiro</option>') + '</select></div>' +
      '<div class="field"><label for="vf-versao">Versão <span class="opt">opcional</span></label><input class="input" id="vf-versao" name="versao" value="' + esc(v.versao || '') + '" placeholder="Ex.: Sedan LXS 1.8 16V"></div>' +
      '<div class="field"><label for="vf-km">Quilometragem atual</label><input class="input" id="vf-km" name="km" data-mask="km" inputmode="numeric" value="' + (v.km ? UI.numero(v.km) : '') + '" placeholder="Ex.: 45.000"></div>' +
      '<div class="field"><label for="vf-cor">Cor</label><select class="select" id="vf-cor" name="cor">' + H.options(H.cores, v.cor, 'Selecione a cor') + '</select></div>' +
      '<div class="field"><label for="vf-ano">Ano</label><select class="select" id="vf-ano" name="ano">' + H.options(anos(), v.ano, 'Selecione o ano') + '</select></div>' +
      '<div class="field"><label for="vf-placa">Número da placa do veículo</label><input class="input mono" id="vf-placa" name="placa" data-mask="placa" value="' + esc(v.placa || '') + '" placeholder="ABC1D23" autocapitalize="characters"><span class="help">Padrão antigo (ABC1234) ou Mercosul (ABC1D23).</span></div>' +
      '<div class="field"><label for="vf-cpf">CPF do cliente</label><input class="input mono" id="vf-cpf" name="cpf" data-mask="cpf" inputmode="numeric" value="' + esc(cpf || '') + '" placeholder="000.000.000-00"><span class="help" id="vf-cpf-help">O veículo fica vinculado ao cliente dono deste CPF.</span></div>' +
      '</div></div></section></form>';
  }
  function bindForm(root, atual, opts) {
    var form = root.querySelector('#vei-form');
    var marca = form.querySelector('#vf-marca'), modelo = form.querySelector('#vf-modelo'), cpf = form.querySelector('#vf-cpf');
    marca.addEventListener('change', function () {
      modelo.disabled = !marca.value;
      modelo.innerHTML = marca.value ? H.options(H.marcas[marca.value], '', 'Selecione o modelo') : '<option value="">Escolha a marca primeiro</option>';
    });
    function cpfHelp() {
      var h = form.querySelector('#vf-cpf-help'), d = UI.digits(cpf.value);
      if (d.length < 11) { h.textContent = 'O veículo fica vinculado ao cliente dono deste CPF.'; h.style.color = ''; return; }
      var c = Store.data.clientes.filter(function (x) { return UI.digits(x.cpf) === d; })[0];
      h.innerHTML = c ? 'Cliente: <strong>' + esc(c.nome) + '</strong>' : 'Nenhum cliente com este CPF. <a href="#/clientes/novo" data-route="/clientes/novo" style="text-decoration:underline">Cadastre o cliente primeiro</a>.';
      h.style.color = c ? 'var(--ok)' : 'var(--warn)';
    }
    cpf.addEventListener('input', cpfHelp);
    cpfHelp();
    var bar = root.querySelector('#vf-bar-msg');
    H.trackDirty(form, {
      message: opts.dirtyMsg,
      onChange: function (v, dirty) {
        if (!bar) return;
        var n = ['marca', 'modelo', 'versao', 'km', 'cor', 'ano', 'placa', 'cpf'].filter(function (k) { return atual ? String(v[k] || '') !== String(opts.orig[k] || '') : v[k]; }).length;
        bar.innerHTML = dirty && n ? '<strong>' + n + (n === 1 ? ' alteração não salva' : ' alterações não salvas') + '</strong><span>' + (faltando(v).length ? 'Pendente: ' + faltando(v).join(', ') + '.' : 'Nenhum campo obrigatório pendente.') + '</span>' : '';
      }
    });
    return form;
  }
  function faltando(v) {
    var nomes = { marca: 'marca', modelo: 'modelo', cor: 'cor', ano: 'ano', placa: 'placa', cpf: 'CPF do cliente', km: 'quilometragem' };
    return Object.keys(nomes).filter(function (k) { return !v[k]; }).map(function (k) { return nomes[k]; });
  }
  function validar(v, atual) {
    var err = {};
    if (!v.marca) err.marca = 'Selecione a marca.';
    if (!v.modelo) err.modelo = 'Selecione o modelo.';
    if (!v.cor) err.cor = 'Selecione a cor.';
    if (!v.ano) err.ano = 'Selecione o ano.';
    if (!UI.digits(v.km)) err.km = 'Informe a quilometragem atual.';
    var pl = UI.normPlaca(v.placa);
    if (!UI.validPlaca(pl)) err.placa = 'Placa inválida. Use ABC1234 ou ABC1D23.';
    else {
      var dup = Store.data.veiculos.filter(function (x) { return x.placa === pl && (!atual || x.id !== atual.id); })[0];
      if (dup) err.placa = 'Placa já cadastrada para ' + H.clienteNome(dup.clienteId) + '.';
    }
    var c = Store.data.clientes.filter(function (x) { return UI.digits(x.cpf) === UI.digits(v.cpf); })[0];
    if (UI.digits(v.cpf).length !== 11) err.cpf = 'Informe o CPF do cliente.';
    else if (!c) err.cpf = 'Nenhum cliente com este CPF. Cadastre o cliente primeiro.';
    return { err: err, cliente: c };
  }

  function novo(p) {
    var preCli = p && p.clienteId ? Store.cliente(p.clienteId) : null;
    var pre = App.ui.prefillVeiculo || {};
    App.ui.prefillVeiculo = null;
    var cpf = preCli ? preCli.cpf : (pre.cpf || '');
    var voltarOrc = pre.voltar === 'orcamento';
    return {
      nav: 'veiculos', crumbs: CR.concat([{ label: 'Cadastrar veículo' }]), title: 'Novo veículo',
      html: '<div class="page-head"><div class="titles"><h1 class="page-title">Carro</h1><p class="page-sub">Cadastro de carro' + (preCli ? ' para ' + esc(preCli.nome) : '') + '</p></div></div>' + veiculoForm(null, cpf),
      after: '<div class="form-bar"><div class="msg" id="vf-bar-msg"></div><span class="spacer"></span><button type="button" class="btn btn-ghost" data-route="' + (preCli ? '/clientes/' + preCli.id : '/veiculos') + '">Descartar</button><button type="submit" form="vei-form" class="btn btn-primary">Cadastrar</button></div>',
      mount: function (root) {
        var form = bindForm(root, null, { dirtyMsg: 'O cadastro do veículo ainda não foi concluído.' });
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var v = UI.formValues(form), r = validar(v, null);
          if (!UI.showErrors(form, r.err)) return;
          var veic = { id: Store.nextId('veiculo', 'v'), clienteId: r.cliente.id, marca: v.marca, modelo: v.modelo, versao: v.versao, ano: Number(v.ano), cor: v.cor, placa: UI.normPlaca(v.placa), km: parseInt(UI.digits(v.km), 10) };
          Store.data.veiculos.push(veic); Store.save(); App.dirty = null;
          App.ui.prefill = { clienteId: r.cliente.id, veiculoId: veic.id };
          var acts = [{ label: 'Abrir orçamento para este veículo', route: '/orcamentos/novo' }, { label: 'Ver veículo', route: '/veiculos/' + veic.id, cls: 'btn-outline' }, { label: 'Voltar à lista', route: '/veiculos', cls: 'btn-ghost' }];
          if (!voltarOrc) acts = [acts[1], acts[0], acts[2]].map(function (a, i) { return { label: a.label, route: a.route, cls: i === 0 ? 'btn-primary' : i === 1 ? 'btn-outline' : 'btn-ghost' }; });
          App.success({ nav: 'veiculos', crumbs: CR.concat([{ label: UI.fmtPlaca(veic.placa) }]), title: 'Veículo cadastrado com sucesso!', code: UI.fmtPlaca(veic.placa),
            msg: H.veiculoDesc(veic) + ' vinculado a ' + r.cliente.nome + '.', actions: acts });
        });
      }
    };
  }
  App.route('/veiculos/novo', function () { return novo(null); });
  App.route('/veiculos/novo/:clienteId', function (p) { return novo(p); });

  /* ---------------- Histórico por placa (US-029) ---------------- */
  function historico(p) {
    var placa = p && p.placa ? UI.normPlaca(p.placa) : '';
    var v = placa ? Store.data.veiculos.filter(function (x) { return x.placa === placa; })[0] : null;
    var crumbs = [{ label: 'Cadastros' }, { label: 'Veículos', route: '/veiculos' }, { label: placa ? UI.fmtPlaca(placa) : 'Histórico por placa' }];
    var html = '<div class="page-head"><div class="titles"><h1 class="page-title">Histórico do veículo</h1><p class="page-sub">Consulte pela placa para ver atendimentos, quilometragem, serviços e valores registrados na oficina.</p></div></div>' +
      '<section class="card"><div class="card-head"><h2 class="card-title">Consulta por placa</h2></div><div class="card-body">' +
        '<form id="hp-form" class="row" style="align-items:flex-end" novalidate><div class="field" style="width:260px;max-width:100%"><label for="hp-placa" style="font-weight:400;font-size:12px;color:var(--mutedfg)">Placa do veículo</label><input class="input mono" id="hp-placa" data-mask="placa" value="' + esc(placa) + '" placeholder="Ex.: RTA4C21" autocapitalize="characters"></div><button type="submit" class="btn btn-primary">Consultar</button></form>' +
      '</div></section>';

    if (!placa) {
      var recentes = Store.data.ordens.slice().sort(function (a, b) { return new Date(b.abertura) - new Date(a.abertura); }).map(function (o) { return Store.veiculo(o.veiculoId).placa; }).filter(function (x, i, arr) { return arr.indexOf(x) === i; }).slice(0, 5);
      html += '<div class="note">Digite a placa e clique em Consultar. Atendidos recentemente: ' + recentes.map(function (pl) { return '<button type="button" class="plate" style="cursor:pointer" data-route="/veiculos/historico/' + pl + '">' + esc(UI.fmtPlaca(pl)) + '</button>'; }).join(' ') + '</div>';
    } else if (!v) {
      html += '<div class="alert warn"><div><div class="a-title">Placa não encontrada</div>Nenhum veículo cadastrado com a placa ' + esc(UI.fmtPlaca(placa)) + '. Confira o número informado ou cadastre o veículo em Cadastros › Veículos.' +
        '<div style="margin-top:10px"><button type="button" class="btn btn-outline sm" data-route="/veiculos/novo">Cadastrar veículo</button></div></div></div>';
    } else {
      var c = Store.cliente(v.clienteId);
      var orcs = Store.orcamentosDoVeiculo(v.id).sort(function (a, b) { return new Date(b.criadoEm) - new Date(a.criadoEm); });
      var oss = Store.ordensDoVeiculo(v.id);
      var ult = orcs[0];
      html += '<section class="card"><div class="card-head"><h2 class="card-title">Veículo</h2><span class="spacer"></span><button type="button" class="btn btn-ghost sm" data-route="/veiculos/' + v.id + '">Abrir cadastro</button></div><div class="card-body"><div class="veh-summary">' +
        '<span class="plate dark">' + esc(UI.fmtPlaca(v.placa)) + '</span>' +
        '<div class="grow"><div style="font-weight:600;font-size:15px">' + esc(H.veiculoNome(v)) + ' · ' + v.ano + '</div><div class="muted" style="font-size:12.5px">' + esc(c ? c.nome : '—') + ' · cliente desde ' + (c ? new Date(c.criadoEm).getFullYear() : '—') + '</div></div>' +
        '<div class="veh-stats"><div><div class="v">' + UI.km(Math.max(v.km, ult ? ult.km : 0)) + '</div><div class="k">Última quilometragem</div></div><div><div class="v">' + oss.length + '</div><div class="k">Atendimentos</div></div><div><div class="v">' + (ult ? UI.dataCurta(ult.criadoEm) : '—') + '</div><div class="k">Último atendimento</div></div></div>' +
      '</div></div></section>';
      if (!orcs.length) {
        html += '<div class="alert info"><div><div class="a-title">Sem histórico na oficina</div>O veículo está cadastrado, mas ainda não tem orçamentos nem ordens de serviço registrados.' +
          '<div style="margin-top:10px"><button type="button" class="btn btn-outline sm" id="hp-orc">Abrir orçamento</button></div></div></div>';
      } else {
        html += '<section class="card"><div class="card-head"><div class="titles"><h2 class="card-title">Ordens de serviço vinculadas</h2><p class="card-sub">Clique em um atendimento para ver serviços, peças e mecânico.</p></div></div>' + orcs.map(function (o, i) {
          var os = o.osId ? Store.os(o.osId) : null;
          var badge = os ? (os.status === 'finalizada' ? UI.badge('Concluída', 'ok') : UI.osBadge(os.status)) : UI.orcBadge(o.status);
          var body = '<div class="kv-grid" style="grid-template-columns:repeat(4,minmax(0,1fr))">' +
            '<div class="kv"><span class="k">Data</span><span class="v">' + UI.dataCurta(o.criadoEm) + '</span></div>' +
            '<div class="kv"><span class="k">Quilometragem</span><span class="v">' + UI.km(o.km) + '</span></div>' +
            '<div class="kv"><span class="k">Box</span><span class="v">' + (os && os.box ? 'Box ' + os.box : '—') + '</span></div>' +
            '<div class="kv"><span class="k">Valor total</span><span class="v">' + (Store.orcTotal(o) ? UI.moeda(os ? os.valor : Store.orcTotal(o)) : 'a orçar') + '</span></div></div>' +
            '<div><div class="tl-title" style="margin-bottom:2px">Problema relatado</div><div style="font-size:13px">' + esc(o.obs || '—') + '</div></div>' +
            (o.servicos.length ? '<div><div class="tl-title" style="margin-bottom:4px">' + (os && os.fechamento ? 'Serviços executados' : 'Serviços orçados') + '</div><table class="tbl plain"><thead><tr><th>Serviço</th><th class="num">Valor</th></tr></thead><tbody>' + o.servicos.map(function (s) { return '<tr><td>' + esc(s.descricao) + '</td><td class="num">' + UI.moeda(s.valor) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '') +
            (o.pecas.length ? '<div><div class="tl-title" style="margin-bottom:4px">Peças utilizadas</div><table class="tbl plain"><thead><tr><th>Peça</th><th class="num">Qtd.</th><th class="num">Valor</th></tr></thead><tbody>' + o.pecas.map(function (s) { return '<tr><td>' + esc(s.nome) + '</td><td class="num">' + s.qtd + '</td><td class="num">' + UI.moeda(s.qtd * s.valor) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '') +
            '<div class="row" style="font-size:12.5px;color:var(--mutedfg)">' +
              ((os && os.mecanicoId) || o.mecanicoId ? '<span class="avatar" style="width:24px;height:24px;font-size:10px;background:var(--infobg);border-color:var(--infobd);color:var(--info)">' + esc(UI.iniciais(Store.mecanicoNome((os && os.mecanicoId) || o.mecanicoId))) + '</span><span>' + esc(Store.mecanicoNome((os && os.mecanicoId) || o.mecanicoId)) + ' · mecânico responsável</span>' : '') +
              (os && os.tempoBoxMin !== null ? '<span>· ' + UI.duracao(os.tempoBoxMin) + ' no box</span>' : '') +
              (os && os.retiradoEm ? '<span>· retirado em ' + UI.data(os.retiradoEm) + ' por ' + esc(os.retiradoPor) + '</span>' : '') +
              (o.motivoRecusa ? '<span>· recusado: ' + esc(o.motivoRecusa) + '</span>' : '') +
              '<span class="spacer"></span><button type="button" class="btn btn-ghost sm" data-route="' + (os ? '/ordens/' + os.id : '/orcamentos/' + o.id) + '">Abrir ' + (os ? os.id : o.id) + '</button>' +
            '</div>';
          return '<div class="os-acc"><button type="button" class="os-acc-head" aria-expanded="' + (i === 0) + '" data-acc="' + i + '">' +
            '<strong class="nowrap" style="font-weight:600">' + (os ? os.id : o.id) + '</strong><span class="muted nowrap" style="font-size:12.5px">' + UI.dataCurta(o.criadoEm) + '</span>' +
            '<span class="desc">' + esc(H.servicoPrincipal(o)) + '</span><span class="muted nowrap" style="font-size:12px">' + UI.km(o.km) + '</span>' +
            '<strong class="num nowrap">' + (Store.orcTotal(o) ? UI.moeda(os ? os.valor : Store.orcTotal(o)) : 'a orçar') + '</strong>' + badge + '</button>' +
            '<div class="os-acc-body" ' + (i === 0 ? '' : 'hidden') + '>' + body + '</div></div>';
        }).join('') + '</section>';
      }
    }
    return {
      nav: 'veiculos', crumbs: crumbs, title: 'Histórico do veículo', html: html,
      mount: function (root) {
        root.querySelector('#hp-form').addEventListener('submit', function (e) {
          e.preventDefault();
          var pl = UI.normPlaca(root.querySelector('#hp-placa').value);
          if (!pl) { root.querySelector('#hp-placa').focus(); return; }
          App.navigate('/veiculos/historico/' + pl);
        });
        root.querySelectorAll('[data-acc]').forEach(function (b) {
          b.addEventListener('click', function () { var body = b.nextElementSibling; body.hidden = !body.hidden; b.setAttribute('aria-expanded', String(!body.hidden)); });
        });
        var ho = root.querySelector('#hp-orc');
        if (ho) ho.addEventListener('click', function () { App.ui.prefill = { clienteId: v.clienteId, veiculoId: v.id }; App.navigate('/orcamentos/novo'); });
      }
    };
  }
  App.route('/veiculos/historico', function () { return historico(null); });
  App.route('/veiculos/historico/:placa', function (p) { return historico(p); });

  /* ---------------- Visualização (US-014) ---------------- */
  App.route('/veiculos/:id', function (p) {
    var v = Store.veiculo(p.id);
    if (!v) return { nav: 'veiculos', crumbs: CR, html: '<div class="alert warn"><div><div class="a-title">Veículo não encontrado</div><a href="#/veiculos" data-route="/veiculos" style="text-decoration:underline">Voltar à lista</a>.</div></div>' };
    var c = Store.cliente(v.clienteId);
    var orcs = Store.orcamentosDoVeiculo(v.id).sort(function (a, b) { return new Date(b.criadoEm) - new Date(a.criadoEm); });
    var rows = orcs.map(function (o) {
      var os = o.osId ? Store.os(o.osId) : null;
      return '<tr class="click" data-route="' + (os ? '/ordens/' + os.id : '/orcamentos/' + o.id) + '"><td class="nowrap">' + (os ? os.id : o.id) + '</td><td class="nowrap">' + UI.data(o.criadoEm) + '</td><td class="num nowrap">' + (Store.orcTotal(o) ? UI.moeda(os ? os.valor : Store.orcTotal(o)) : 'a orçar') + '</td>' +
        '<td class="nowrap">' + (os && os.retiradoEm ? UI.data(os.retiradoEm) : '—') + '</td><td>' + esc(os && os.retiradoPor || '—') + '</td><td>' + (os ? UI.osBadge(os.status) : UI.orcBadge(o.status)) + '</td></tr>';
    }).join('') || H.emptyRow(6, 'Nenhum atendimento registrado', 'Abra um orçamento para este veículo.');
    var html =
      '<div class="page-head"><div class="titles"><h1 class="page-title">Carro</h1><p class="page-sub">Informações do carro</p></div><span class="spacer"></span><div class="actions">' +
        '<button type="button" class="btn btn-outline" data-route="/veiculos/historico/' + v.placa + '">' + icon('history', 14) + ' Histórico completo</button>' +
        '<button type="button" class="btn btn-outline" id="vp-orc">Abrir orçamento</button>' +
        '<button type="button" class="btn btn-brand" data-route="/veiculos/' + v.id + '/editar">' + icon('edit', 14) + ' Editar informações</button></div></div>' +
      '<div class="split-left">' +
        '<section class="card"><div class="card-head"><h2 class="card-title">Informações do veículo</h2></div><div class="card-body" style="gap:10px">' +
          '<span class="section-label">Veículo</span>' +
          '<div class="kv"><span class="k">Marca</span><span class="v" style="font-weight:400">' + esc(v.marca) + '</span></div>' +
          '<div class="kv"><span class="k">Modelo</span><span class="v" style="font-weight:400">' + esc(v.modelo + (v.versao ? ' ' + v.versao : '')) + '</span></div>' +
          '<div class="kv"><span class="k">Cor</span><span class="v" style="font-weight:400">' + esc(v.cor) + '</span></div>' +
          '<div class="kv"><span class="k">Ano</span><span class="v" style="font-weight:400">' + v.ano + '</span></div>' +
          '<div class="kv"><span class="k">Quilometragem atual</span><span class="v" style="font-weight:400">' + UI.km(v.km) + '</span></div>' +
          '<span class="section-label" style="border-top:1px solid var(--border);padding-top:12px">Registro</span>' +
          '<div class="kv"><span class="k">Número da placa do veículo</span><span class="v mono" style="font-weight:500">' + esc(UI.fmtPlaca(v.placa)) + '</span></div>' +
          '<div class="kv"><span class="k">Cliente</span><span class="v" style="font-weight:400">' + (c ? '<a href="#/clientes/' + c.id + '" data-route="/clientes/' + c.id + '" style="text-decoration:underline">' + esc(c.nome) + '</a>' : '—') + '</span></div>' +
          '<span class="section-label" style="border-top:1px solid var(--border);padding-top:12px">Endereço</span>' +
          '<div class="kv"><span class="k">Bairro</span><span class="v" style="font-weight:400">' + esc(c ? c.bairro + ' · ' + c.cidade + '/' + c.uf : '—') + '</span></div>' +
        '</div></section>' +
        '<section class="card tbl-card"><div class="card-head"><div class="titles"><h2 class="card-title">Atendimentos</h2><p class="card-sub">Orçamentos e ordens de serviço deste veículo.</p></div></div><div class="table-wrap"><table class="tbl"><thead><tr><th>Protocolo</th><th>Data</th><th class="num">Valor</th><th>Retirado em</th><th>Retirado por</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table></div></section>' +
      '</div>';
    return {
      nav: 'veiculos', crumbs: CR.concat([{ label: 'Veículo', route: '/veiculos' }, { label: UI.fmtPlaca(v.placa) }]), title: UI.fmtPlaca(v.placa), html: html,
      mount: function (root) {
        root.querySelector('#vp-orc').addEventListener('click', function () { App.ui.prefill = { clienteId: v.clienteId, veiculoId: v.id }; App.navigate('/orcamentos/novo'); });
      }
    };
  });

  /* ---------------- Atualização cadastral (US-007) ---------------- */
  App.route('/veiculos/:id/editar', function (p) {
    var v = Store.veiculo(p.id);
    if (!v) return { redirect: '/veiculos' };
    var c = Store.cliente(v.clienteId);
    var orig = { marca: v.marca, modelo: v.modelo, versao: v.versao || '', km: UI.numero(v.km), cor: v.cor, ano: String(v.ano), placa: v.placa, cpf: c ? c.cpf : '' };
    return {
      nav: 'veiculos', crumbs: CR.concat([{ label: UI.fmtPlaca(v.placa), route: '/veiculos/' + v.id }, { label: 'Atualização cadastral do carro' }]), title: 'Editar ' + UI.fmtPlaca(v.placa),
      html: '<div class="page-head"><div class="titles"><h1 class="page-title">Carro</h1><p class="page-sub">Atualização cadastral de ' + esc(H.veiculoDesc(v)) + '</p></div></div>' + veiculoForm(v, orig.cpf),
      after: '<div class="form-bar"><div class="msg" id="vf-bar-msg"></div><span class="spacer"></span><button type="button" class="btn btn-ghost" data-route="/veiculos/' + v.id + '">Descartar</button><button type="submit" form="vei-form" class="btn btn-primary">Salvar alterações</button></div>',
      mount: function (root) {
        var form = bindForm(root, v, { orig: orig, dirtyMsg: 'As alterações do veículo ainda não foram salvas.' });
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var val = UI.formValues(form), r = validar(val, v);
          if (!UI.showErrors(form, r.err)) return;
          var trocouDono = r.cliente.id !== v.clienteId;
          v.marca = val.marca; v.modelo = val.modelo; v.versao = val.versao; v.ano = Number(val.ano); v.cor = val.cor;
          v.placa = UI.normPlaca(val.placa); v.km = parseInt(UI.digits(val.km), 10); v.clienteId = r.cliente.id;
          Store.save(); App.dirty = null;
          App.success({ nav: 'veiculos', crumbs: CR.concat([{ label: UI.fmtPlaca(v.placa) }]), title: 'Veículo atualizado com sucesso!', code: UI.fmtPlaca(v.placa),
            msg: trocouDono ? 'O veículo agora está vinculado a ' + r.cliente.nome + '.' : 'As informações do carro foram salvas.',
            actions: [{ label: 'Ver veículo', route: '/veiculos/' + v.id }, { label: 'Voltar à lista', route: '/veiculos', cls: 'btn-outline' }] });
        });
      }
    };
  });
})();
