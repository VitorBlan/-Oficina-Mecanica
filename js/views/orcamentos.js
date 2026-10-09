/* Orçamentos — histórico (US-018), montar orçamento (US-016) e ciclo aberta → orçada → aprovada/recusada */
(function () {
  'use strict';
  var B = window.Bancada, Store = B.Store, UI = B.UI, H = B.H, App = B.App, esc = UI.esc, icon = UI.icon;

  var PAGE = 8;
  var STATUS_OPC = [
    { v: '', label: 'Todos', dot: 'var(--subtle)', titulo: 'Histórico de orçamentos', btn: 'Filtrar status' },
    { v: 'aberta', label: 'Em aberto', dot: 'var(--brand)', titulo: 'Histórico de orçamentos em aberto', btn: 'Status: em aberto' },
    { v: 'orcada', label: 'Orçada', dot: 'var(--info)', titulo: 'Orçamentos orçados', btn: 'Status: orçada' },
    { v: 'aprovada', label: 'Aprovada', dot: 'var(--vio)', titulo: 'Orçamentos aprovados', btn: 'Status: aprovada' },
    { v: 'recusada', label: 'Recusado', dot: 'var(--dgr)', titulo: 'Orçamentos recusados', btn: 'Status: recusado' }
  ];
  function ui() { return App.ui.orc || (App.ui.orc = { q: '', status: '', de: '', ate: '', page: 1 }); }
  var CRUMBS = [{ label: 'Orçamento', route: '/orcamentos' }, { label: 'Histórico de orçamentos', route: '/orcamentos' }];

  /* ---------------- Lista ---------------- */
  function filtrar() {
    var f = ui(), n = UI.norm(f.q), pl = UI.normPlaca(f.q);
    return Store.data.orcamentos.filter(function (o) {
      if (f.status && o.status !== f.status) return false;
      if (!H.inRange(o.criadoEm, f)) return false;
      if (!n) return true;
      var c = Store.cliente(o.clienteId), v = Store.veiculo(o.veiculoId);
      return UI.norm(o.id).indexOf(n) >= 0 || UI.norm(c && c.nome).indexOf(n) >= 0 ||
        UI.norm(H.veiculoNome(v)).indexOf(n) >= 0 || (pl.length >= 2 && v && v.placa.indexOf(pl) >= 0);
    }).sort(function (a, b) { return new Date(b.criadoEm) - new Date(a.criadoEm); });
  }

  function tabela() {
    var f = ui(), lista = filtrar(), pg = UI.paginate(lista, f.page, PAGE);
    f.page = pg.page;
    var rows = pg.items.map(function (o) {
      var c = Store.cliente(o.clienteId), v = Store.veiculo(o.veiculoId), tot = Store.orcTotal(o);
      return '<tr class="click" data-route="/orcamentos/' + o.id + '" tabindex="0">' +
        '<td class="mono nowrap">' + o.id + '</td>' +
        '<td class="t-main" style="font-size:13px">' + esc(c ? c.nome : '—') + '</td>' +
        '<td class="muted">' + esc(H.veiculoLista(v)) + '</td>' +
        '<td><span class="plate">' + esc(UI.fmtPlaca(v ? v.placa : '')) + '</span></td>' +
        '<td class="muted nowrap">' + UI.data(o.criadoEm) + '</td>' +
        '<td class="num mono nowrap ' + (!tot ? 'muted' : '') + '">' + (tot ? UI.moeda(tot) : 'a orçar') + '</td>' +
        '<td>' + UI.orcBadge(o.status) + '</td></tr>';
    }).join('') || H.emptyRow(7, 'Nenhum orçamento encontrado', 'Ajuste a busca ou os filtros de status e data.');
    return {
      table: '<table class="tbl zebra"><thead><tr><th>Nº Orçamento</th><th>Cliente</th><th>Veículo</th><th>Placa</th><th>Data</th><th class="num">Valor total</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table>',
      pager: UI.pagerHtml(pg, 'orçamentos')
    };
  }

  App.route('/orcamentos', function () {
    var f = ui();
    var st = STATUS_OPC.filter(function (s) { return s.v === f.status; })[0] || STATUS_OPC[0];
    var t = tabela();
    var html =
      '<div class="page-head"><div class="titles"><h1 class="page-title">' + st.titulo + '</h1><p class="page-sub">Visualize e gerencie os orçamentos ativos na oficina.</p></div></div>' +
      '<div class="toolbar">' +
        '<label class="search"><span class="ico">' + icon('search', 14) + '</span><span class="sr-only">Buscar</span><input id="orc-q" type="search" placeholder="Buscar por orçamento, cliente, veículo ou placa..." value="' + esc(f.q) + '"></label>' +
        '<div class="dropdown"><button type="button" class="btn btn-outline btn-filter" id="orc-st-btn" aria-haspopup="true">' + icon('filter', 14) + st.btn + (f.status ? ' <span class="chev">' + icon('chev', 14) + '</span>' : '') + '</button>' +
          '<div class="dropdown-pop" id="orc-st-pop" hidden>' + STATUS_OPC.map(function (s) {
            return '<button type="button" class="dd-item ' + (s.v === f.status ? 'on' : '') + '" data-st="' + s.v + '"><span class="dot" style="background:' + s.dot + '"></span>' + s.label + '</button>';
          }).join('') + '</div></div>' +
        H.dateFilterHtml('orc-dt', f) +
        '<button type="button" class="btn btn-primary" data-route="/orcamentos/novo">Novo orçamento</button>' +
      '</div>' +
      '<div class="card tbl-card"><div class="table-wrap" id="orc-table">' + t.table + '</div></div>' +
      '<div id="orc-pager">' + t.pager + '</div>';

    return {
      nav: 'orcamentos', crumbs: [{ label: 'Orçamento', route: '/orcamentos' }, { label: 'Histórico de orçamentos' }], title: 'Orçamentos', html: html,
      mount: function (root) {
        function redraw() { var t2 = tabela(); root.querySelector('#orc-table').innerHTML = t2.table; root.querySelector('#orc-pager').innerHTML = t2.pager; }
        root.querySelector('#orc-q').addEventListener('input', function (e) { f.q = e.target.value; f.page = 1; redraw(); });
        UI.bindDropdown(root, '#orc-st-btn', '#orc-st-pop');
        root.querySelectorAll('[data-st]').forEach(function (b) { b.addEventListener('click', function () { f.status = b.getAttribute('data-st'); f.page = 1; App.refresh(); }); });
        H.bindDateFilter(root, 'orc-dt', f, function () { f.page = 1; App.refresh(); });
        root.querySelector('#orc-pager').addEventListener('click', function (e) { var b = e.target.closest('[data-page]'); if (b && !b.disabled) { f.page = Number(b.getAttribute('data-page')); redraw(); } });
        root.querySelector('#orc-table').addEventListener('keydown', function (e) { var tr = e.target.closest('tr.click'); if (tr && e.key === 'Enter') App.navigate(tr.getAttribute('data-route')); });
      }
    };
  });

  /* ---------------- Novo orçamento (US-016) ---------------- */
  App.route('/orcamentos/novo', function () {
    var pre = App.ui.prefill || {};
    App.ui.prefill = null;
    var clientes = Store.data.clientes.slice().sort(function (a, b) { return a.nome.localeCompare(b.nome); });
    var html =
      '<form id="orc-form" class="stack" novalidate>' +
      '<section class="card"><div class="card-head"><h1 class="card-title">Criar orçamento</h1></div><div class="card-body">' +
        '<span class="section-label">Cliente e veículo</span>' +
        '<div class="form-grid">' +
          '<div class="field"><label for="of-cli">Cliente</label><select class="select" id="of-cli" name="clienteId">' + H.options(clientes.map(function (c) { return { value: c.id, label: c.nome }; }), pre.clienteId, 'Selecione o cliente') + '</select>' +
            '<span class="help">Cliente novo? <a href="#/clientes/novo" data-route="/clientes/novo" style="text-decoration:underline">Cadastre antes de orçar</a>.</span></div>' +
          '<div class="field"><label for="of-vei">Veículo</label><select class="select" id="of-vei" name="veiculoId" disabled><option value="">Selecione o cliente primeiro</option></select><span class="help" id="of-vei-help"></span></div>' +
        '</div>' +
        '<span class="section-label">Veículo</span>' +
        '<div class="form-grid cols-3">' +
          '<div class="field"><label for="of-placa">Placa</label><input class="input mono" id="of-placa" readonly placeholder="—"></div>' +
          '<div class="field"><label for="of-km">Quilometragem</label><input class="input" id="of-km" name="km" data-mask="km" inputmode="numeric" placeholder="Ex.: 84.230"></div>' +
          '<div class="field"><label for="of-contato">Contato preferencial</label><input class="input" id="of-contato" name="contato" readonly placeholder="—"></div>' +
        '</div>' +
      '</div></section>' +
      '<section class="card"><div class="card-head"><h2 class="card-title">Observações internas / recomendações</h2></div><div class="card-body">' +
        '<div class="field"><label for="of-obs" class="help" style="font-weight:400">Registre o problema relatado, recomendações e contexto interno para o atendimento.</label><textarea class="textarea" id="of-obs" name="obs" rows="3" placeholder="Ex.: Cliente relatou barulho metálico ao passar por lombadas."></textarea></div>' +
      '</div></section>' +
      '<section class="card"><div class="card-head"><h2 class="card-title">Valor do orçamento</h2></div><div class="card-body">' +
        '<p class="help">Valor fixo do orçamento a ser apresentado ao cliente. Serviços e peças podem ser detalhados depois, na tela do orçamento.</p>' +
        '<div class="form-grid" style="grid-template-columns:minmax(0,232px) minmax(0,1fr)">' +
          '<div class="field"><label for="of-valor">Valor do orçamento</label><div class="money"><span>R$</span><input class="input" id="of-valor" name="valor" data-mask="money" inputmode="decimal" placeholder="0,00"></div></div>' +
          '<div class="field"><label for="of-fmt">Formato</label><select class="select" id="of-fmt" name="formato"><option value="fixo">Valor fixo</option><option value="itens">A orçar (por serviços e peças)</option></select></div>' +
        '</div>' +
      '</div></section>' +
      '<section class="card"><div class="card-body"><button type="submit" class="btn btn-primary lg block">Criar orçamento</button></div></section>' +
      '</form>';

    return {
      nav: 'orcamentos', crumbs: CRUMBS.concat([{ label: 'Novo orçamento' }]), title: 'Novo orçamento', html: html,
      mount: function (root) {
        var form = root.querySelector('#orc-form');
        var cli = form.querySelector('#of-cli'), vei = form.querySelector('#of-vei');
        var fmt = form.querySelector('#of-fmt'), valor = form.querySelector('#of-valor');
        function fillVeiculos(sel) {
          var c = Store.cliente(cli.value);
          var vs = c ? Store.veiculosDoCliente(c.id) : [];
          var help = form.querySelector('#of-vei-help');
          vei.disabled = !c;
          if (!c) { vei.innerHTML = '<option value="">Selecione o cliente primeiro</option>'; help.innerHTML = ''; }
          else if (!vs.length) {
            vei.innerHTML = '<option value="">Nenhum veículo cadastrado</option>';
            help.innerHTML = '<a href="#/veiculos/novo" data-cad-vei style="text-decoration:underline">Cadastrar veículo para ' + esc(c.nome.split(' ')[0]) + '</a>';
            var a = help.querySelector('[data-cad-vei]');
            a.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); App.ui.prefillVeiculo = { cpf: c.cpf, voltar: 'orcamento' }; App.navigate('/veiculos/novo'); });
          } else {
            vei.innerHTML = H.options(vs.map(function (v) { return { value: v.id, label: H.veiculoDesc(v) + ' · ' + UI.fmtPlaca(v.placa) }; }), sel || (vs.length === 1 ? vs[0].id : ''), vs.length > 1 ? 'Selecione o veículo' : '');
            help.innerHTML = '';
          }
          form.querySelector('#of-contato').value = c ? c.telefone + ' (' + c.contatoPreferido + ')' : '';
          fillPlaca();
        }
        function fillPlaca() {
          var v = Store.veiculo(vei.value);
          form.querySelector('#of-placa').value = v ? UI.fmtPlaca(v.placa) : '';
          if (v) form.querySelector('#of-km').value = UI.numero(v.km);
        }
        function syncFmt() {
          var itens = fmt.value === 'itens';
          valor.disabled = itens;
          if (itens) { valor.value = ''; valor.placeholder = 'Definido pelos itens'; } else valor.placeholder = '0,00';
        }
        cli.addEventListener('change', function () { fillVeiculos(); });
        vei.addEventListener('change', fillPlaca);
        fmt.addEventListener('change', syncFmt);
        if (pre.clienteId) fillVeiculos(pre.veiculoId);
        H.trackDirty(form, { message: 'O orçamento ainda não foi criado. Se sair agora, os dados preenchidos serão perdidos.' });

        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var v = UI.formValues(form), err = {};
          if (!v.clienteId) err.clienteId = 'Selecione o cliente.';
          if (!v.veiculoId) err.veiculoId = v.clienteId ? 'Selecione o veículo (ou cadastre um para este cliente).' : 'Selecione o cliente primeiro.';
          var kmN = parseInt(UI.digits(v.km), 10);
          if (!kmN) err.km = 'Informe a quilometragem atual do veículo.';
          if (!v.obs) err.obs = 'Descreva o problema relatado pelo cliente.';
          var val = UI.parseMoney(v.valor);
          if (v.formato === 'fixo' && val <= 0) err.valor = 'Informe um valor maior que zero ou escolha “A orçar”.';
          if (!UI.showErrors(form, err)) return;
          var veic = Store.veiculo(v.veiculoId);
          if (kmN > veic.km) veic.km = kmN;
          var c = Store.cliente(v.clienteId), s = App.session();
          var o = {
            id: Store.nextOrcNumero(), clienteId: v.clienteId, veiculoId: v.veiculoId, km: kmN,
            contato: c.telefone + ' (' + c.contatoPreferido + ')', obs: v.obs, formato: v.formato,
            valorFixo: v.formato === 'fixo' ? val : 0, servicos: [], pecas: [], mecanicoId: '',
            status: 'aberta', criadoEm: new Date().toISOString(), criadoPor: s.nome,
            orcadaEm: null, aprovadoEm: null, recusadoEm: null, motivoRecusa: '', reabertoEm: null, osId: null
          };
          o.atualizadoEm = o.criadoEm;
          Store.data.orcamentos.push(o);
          Store.save();
          App.dirty = null;
          App.success({
            nav: 'orcamentos', crumbs: CRUMBS.concat([{ label: o.id }]),
            title: 'Orçamento criado com sucesso!', code: o.id,
            msg: 'O orçamento está em aberto. Detalhe os serviços e peças e escolha o mecânico para enviar ao cliente.',
            actions: [{ label: 'Abrir orçamento', route: '/orcamentos/' + o.id }, { label: 'Voltar ao histórico', route: '/orcamentos' }]
          });
        });
      }
    };
  });

  /* ---------------- Detalhe ---------------- */
  function readonlyVal(label, value, cls) {
    return '<div class="field"><span class="label">' + label + '</span><div class="readonly-val ' + (cls || '') + '">' + esc(value || '—') + '</div></div>';
  }
  function cabecalho(o, titulo, badgeHtml) {
    var c = Store.cliente(o.clienteId), v = Store.veiculo(o.veiculoId);
    return '<section class="card"><div class="card-head"><h1 class="card-title">' + titulo + '</h1><span class="spacer"></span>' + badgeHtml + '</div><div class="card-body">' +
      '<span class="section-label">Cliente e veículo</span>' +
      '<div class="form-grid">' +
        '<div class="field"><span class="label">Cliente</span><div class="readonly-val"><a href="#/clientes/' + o.clienteId + '" data-route="/clientes/' + o.clienteId + '">' + esc(c ? c.nome : '—') + '</a></div></div>' +
        '<div class="field"><span class="label">Veículo</span><div class="readonly-val"><a href="#/veiculos/' + o.veiculoId + '" data-route="/veiculos/' + o.veiculoId + '">' + esc(H.veiculoDesc(v)) + '</a></div></div>' +
      '</div>' +
      '<span class="section-label">Veículo</span>' +
      '<div class="form-grid cols-3">' + readonlyVal('Placa', UI.fmtPlaca(v ? v.placa : '')) + readonlyVal('Quilometragem', UI.km(o.km)) + readonlyVal('Contato preferencial', o.contato) + '</div>' +
      '</div></section>';
  }
  B.Orc = { cabecalho: cabecalho, readonlyVal: readonlyVal };

  function aprovar(o) {
    var s = App.session();
    var now = new Date().toISOString();
    o.status = 'aprovada'; o.aprovadoEm = now; o.atualizadoEm = now;
    var os = {
      id: Store.nextOsNumero(), orcamentoId: o.id, clienteId: o.clienteId, veiculoId: o.veiculoId,
      status: 'aprovada', abertura: now, inicio: null, fechamento: null, box: null,
      mecanicoId: o.mecanicoId, funcionario: s.nome, valor: Store.orcTotal(o),
      tempoBoxMin: null, retiradoEm: null, retiradoPor: '', estoqueBaixado: false
    };
    o.osId = os.id;
    Store.data.ordens.push(os);
    Store.save();
    return os;
  }

  App.route('/orcamentos/:id', function (p) {
    var o = Store.orcamento(p.id);
    if (!o) return { nav: 'orcamentos', crumbs: CRUMBS, html: '<div class="alert warn"><div><div class="a-title">Orçamento não encontrado</div>O orçamento ' + esc(p.id) + ' não existe ou foi removido. <a href="#/orcamentos" data-route="/orcamentos" style="text-decoration:underline">Voltar ao histórico</a>.</div></div>' };
    var os = o.osId ? Store.os(o.osId) : null;
    var total = Store.orcTotal(o);
    var editavel = o.status === 'aberta';
    var html = cabecalho(o, 'Orçamento ' + o.id, UI.orcBadge(o.status, 'strong'));

    if (editavel) {
      html +=
        '<section class="card"><div class="card-head"><h2 class="card-title">Observações internas / recomendações</h2></div><div class="card-body">' +
          '<div class="field"><label class="help" for="od-obs" style="font-weight:400">Observações registradas no atendimento.</label><textarea class="textarea" id="od-obs" rows="3">' + esc(o.obs) + '</textarea></div></div></section>' +
        '<section class="card tbl-card"><div class="card-head"><div class="titles"><h2 class="card-title">Serviços e peças</h2><p class="card-sub">Detalhe o que será feito. Peças saem do estoque quando o serviço começar no box.</p></div></div>' +
          '<div class="table-wrap"><table class="tbl"><thead><tr><th>Item</th><th>Tipo</th><th class="num">Qtd.</th><th class="num">Valor</th><th style="width:44px"><span class="sr-only">Remover</span></th></tr></thead><tbody id="od-itens"></tbody><tfoot id="od-foot"></tfoot></table></div>' +
          '<div class="card-body" style="border-top:1px solid var(--border)">' +
            '<form class="form-grid" id="od-add-sv" style="grid-template-columns:minmax(0,1fr) 160px auto;align-items:end">' +
              '<div class="field"><label for="od-sv-desc">Adicionar serviço</label><input class="input" id="od-sv-desc" placeholder="Ex.: Troca de pastilhas de freio"></div>' +
              '<div class="field"><label for="od-sv-val">Valor</label><div class="money"><span>R$</span><input class="input" id="od-sv-val" data-mask="money" inputmode="decimal" placeholder="0,00"></div></div>' +
              '<button type="submit" class="btn btn-outline">' + icon('plus', 14) + ' Serviço</button>' +
            '</form>' +
            '<form class="form-grid" id="od-add-pc" style="grid-template-columns:minmax(0,1fr) 160px auto;align-items:end">' +
              '<div class="field"><label for="od-pc-id">Adicionar peça do estoque</label><select class="select" id="od-pc-id">' + H.options(Store.data.pecas.slice().sort(function (a, b) { return a.nome.localeCompare(b.nome); }).map(function (pc) { return { value: pc.id, label: pc.codigo + ' · ' + pc.nome + ' · ' + UI.moeda(pc.valor) + ' · ' + pc.qtd + ' em estoque' }; }), '', 'Selecione a peça') + '</select></div>' +
              '<div class="field"><label for="od-pc-qtd">Quantidade</label><input class="input" id="od-pc-qtd" type="number" min="1" value="1"></div>' +
              '<button type="submit" class="btn btn-outline">' + icon('plus', 14) + ' Peça</button>' +
            '</form>' +
            '<div id="od-stock-warn"></div>' +
          '</div></section>' +
        '<section class="card"><div class="card-head"><h2 class="card-title">Valor do orçamento</h2></div><div class="card-body">' +
          '<p class="help" id="od-valor-help"></p>' +
          '<div class="form-grid">' +
            '<div class="field" id="od-valor-field"></div>' +
            '<div class="field"><label for="od-mec">Mecânico responsável</label><select class="select" id="od-mec">' + H.options(Store.data.mecanicos.map(function (m) { return { value: m.id, label: m.nome }; }), o.mecanicoId, 'Selecione o mecânico') + '</select></div>' +
          '</div>' +
          '<div class="row" style="margin-top:4px">' +
            '<button type="button" class="btn btn-outline" data-route="/orcamentos">Voltar</button>' +
            '<button type="button" class="btn btn-brand" id="od-salvar">Salvar alterações</button>' +
            '<button type="button" class="btn btn-go" id="od-orcar">Criar orçada</button>' +
          '</div>' +
        '</div></section>';
    } else {
      html +=
        '<section class="card"><div class="card-head"><h2 class="card-title">Observações internas / recomendações</h2></div><div class="card-body"><p class="help">Observações registradas no atendimento.</p><div class="readonly-val area">' + esc(o.obs || '—') + '</div></div></section>';
      var itens = H.itensTabela(o);
      if (itens) html += '<section class="card tbl-card"><div class="card-head"><h2 class="card-title">Serviços e peças</h2></div>' + itens + '</section>';
      if (o.status === 'recusada') {
        html += '<div class="alert dgr"><div><div class="a-title">Recusado pelo cliente em ' + UI.dataHora(o.recusadoEm) + '</div>' + esc(o.motivoRecusa || 'Motivo não informado.') + '</div></div>';
      }
      var botoes = '<button type="button" class="btn btn-brand sm" id="od-consultar">Consultar o orçamento</button>';
      if (o.status === 'orcada') botoes += '<button type="button" class="btn btn-go sm" id="od-aprovar">Aprovado</button><button type="button" class="btn btn-stop sm" id="od-recusar">Recusar</button><span class="spacer"></span><button type="button" class="btn btn-ghost sm" id="od-reabrir">Reabrir para ajustes</button>';
      if (o.status === 'aprovada' && os) botoes += os.status === 'aprovada'
        ? '<button type="button" class="btn btn-brand sm" data-route="/boxes/designar/' + os.id + '">Iniciar execução</button>'
        : '<button type="button" class="btn btn-outline sm" data-route="/ordens/' + os.id + '">Ver ordem de serviço ' + os.id + '</button>';
      if (o.status === 'recusada') botoes += '<button type="button" class="btn btn-outline sm" id="od-reabrir">Reabrir orçamento</button>';
      html +=
        '<section class="card"><div class="card-head"><h2 class="card-title">Valor do orçamento</h2></div><div class="card-body">' +
          '<p class="help">' + (itens ? 'Soma dos serviços e peças apresentada ao cliente.' : 'Valor fixo do orçamento a ser apresentado ao cliente.') + '</p>' +
          '<div class="form-grid" style="grid-template-columns:minmax(0,232px) minmax(0,250px)">' +
            readonlyVal('Valor do orçamento', total ? UI.moeda(total) : 'A orçar', 'lg') +
            (o.mecanicoId ? readonlyVal('Mecânico responsável', Store.mecanicoNome(o.mecanicoId)) : '') +
          '</div>' +
          '<div class="row" style="gap:10px;margin-top:4px">' + botoes + '</div>' +
        '</div></section>';
    }

    html += '<section class="card"><div class="card-head"><div class="titles"><h2 class="card-title">Histórico de status</h2><p class="card-sub">Cada mudança do orçamento' + (os ? ' e da ordem de serviço ' + os.id : '') + ', com data e hora.</p></div></div><div class="card-body">' + H.timelineHtml(H.timeline(o, os)) + '</div></section>';

    return {
      nav: 'orcamentos', crumbs: CRUMBS.concat([{ label: o.id }]), title: o.id, html: html,
      mount: function (root) {
        var cons = root.querySelector('#od-consultar');
        if (cons) cons.addEventListener('click', function () { H.consultar(o, null); });

        var reab = root.querySelector('#od-reabrir');
        if (reab) reab.addEventListener('click', function () {
          UI.confirmar({ icon: 'info', title: 'Reabrir ' + o.id + '?', text: 'O orçamento volta para “Aberta” e pode ser ajustado antes de ser apresentado de novo ao cliente.', ok: 'Reabrir orçamento', okCls: 'btn-primary',
            onConfirm: function () { var now = new Date().toISOString(); o.status = 'aberta'; o.reabertoEm = now; o.atualizadoEm = now; o.orcadaEm = null; o.recusadoEm = null; o.motivoRecusa = ''; Store.save(); UI.toast(o.id + ' reaberto.'); App.refresh(); } });
        });

        var apr = root.querySelector('#od-aprovar');
        if (apr) apr.addEventListener('click', function () {
          var c = Store.cliente(o.clienteId);
          UI.confirmar({ icon: 'ok', title: 'Registrar aprovação do cliente?', text: esc(c.nome) + ' aprovou o orçamento ' + o.id + ' no valor de <strong>' + UI.moeda(Store.orcTotal(o)) + '</strong>. Uma ordem de serviço será aberta e ficará aguardando box e mecânico.', ok: 'Confirmar aprovação', okCls: 'btn-go',
            onConfirm: function () {
              var os2 = aprovar(o);
              App.success({ nav: 'orcamentos', crumbs: CRUMBS.concat([{ label: o.id }]), title: 'Orçamento aprovado!', code: o.id + ' · ' + os2.id,
                msg: 'A ordem de serviço ' + os2.id + ' foi aberta e aguarda a designação de box e mecânico.',
                actions: [{ label: 'Designar box e mecânico', route: '/boxes/designar/' + os2.id }, { label: 'Voltar ao histórico', route: '/orcamentos' }] });
            } });
        });

        var rec = root.querySelector('#od-recusar');
        if (rec) rec.addEventListener('click', function () {
          UI.modal({ icon: 'dgr', title: 'Registrar recusa do orçamento', text: 'Informe o motivo dado pelo cliente. Ele fica no histórico do orçamento e do veículo.',
            body: '<div class="field"><label for="rec-motivo">Motivo da recusa</label><textarea class="textarea" id="rec-motivo" rows="3" placeholder="Ex.: Cliente achou o valor alto e vai pensar."></textarea></div>',
            actions: [{ label: 'Cancelar' }, { label: 'Registrar recusa', cls: 'btn-stop', onClick: function (m) {
              var t = m.el.querySelector('#rec-motivo');
              if (!t.value.trim()) { t.closest('.field').classList.add('invalid'); t.focus(); return false; }
              var now = new Date().toISOString();
              o.status = 'recusada'; o.recusadoEm = now; o.atualizadoEm = now; o.motivoRecusa = t.value.trim();
              Store.save(); UI.toast(o.id + ' marcado como recusado.'); App.refresh();
            } }] });
        });

        if (!editavel) return;
        /* ---- edição do orçamento em aberto ---- */
        var draft = { servicos: JSON.parse(JSON.stringify(o.servicos || [])), pecas: JSON.parse(JSON.stringify(o.pecas || [])), valorFixo: o.valorFixo || 0 };
        function markDirty() { App.dirty = { message: 'As alterações do orçamento ' + o.id + ' ainda não foram salvas.' }; }
        function totalDraft() { var hasItens = draft.servicos.length || draft.pecas.length; return hasItens ? Store.orcItensTotal(draft) : draft.valorFixo; }
        function draw() {
          var tb = root.querySelector('#od-itens'), ft = root.querySelector('#od-foot');
          var rows = '';
          draft.servicos.forEach(function (s, i) { rows += '<tr><td>' + esc(s.descricao) + '</td><td class="muted">Serviço</td><td class="num">1</td><td class="num">' + UI.moeda(s.valor) + '</td><td><button type="button" class="btn btn-ghost btn-icon sm" data-rm-sv="' + i + '" aria-label="Remover ' + esc(s.descricao) + '">' + icon('x', 14) + '</button></td></tr>'; });
          draft.pecas.forEach(function (pc, i) { rows += '<tr><td>' + esc(pc.nome) + ' <span class="mono muted" style="font-size:11.5px">' + esc(pc.codigo) + '</span></td><td class="muted">Peça</td><td class="num">' + pc.qtd + '</td><td class="num">' + UI.moeda(pc.qtd * pc.valor) + '</td><td><button type="button" class="btn btn-ghost btn-icon sm" data-rm-pc="' + i + '" aria-label="Remover ' + esc(pc.nome) + '">' + icon('x', 14) + '</button></td></tr>'; });
          tb.innerHTML = rows || H.emptyRow(5, 'Nenhum item adicionado', 'Use os campos abaixo para incluir serviços e peças.');
          ft.innerHTML = rows ? '<tr><td colspan="3">Total</td><td class="num">' + UI.moeda(Store.orcItensTotal(draft)) + '</td><td></td></tr>' : '';
          var hasItens = draft.servicos.length || draft.pecas.length;
          var vf = root.querySelector('#od-valor-field');
          root.querySelector('#od-valor-help').textContent = hasItens ? 'O valor é a soma dos serviços e peças listados acima.' : 'Sem itens detalhados, o orçamento usa o valor fixo informado.';
          vf.innerHTML = hasItens
            ? '<span class="label">Valor do orçamento</span><div class="readonly-val lg">' + UI.moeda(Store.orcItensTotal(draft)) + '</div>'
            : '<label for="od-valor">Valor do orçamento</label><div class="money"><span>R$</span><input class="input" id="od-valor" data-mask="money" inputmode="decimal" value="' + (draft.valorFixo ? UI.moneyInput(draft.valorFixo) : '') + '" placeholder="0,00"></div>';
          var vi = vf.querySelector('#od-valor');
          if (vi) { UI.applyMasks(vf); vi.addEventListener('input', function () { draft.valorFixo = UI.parseMoney(vi.value); markDirty(); }); }
          // aviso de estoque
          var falta = draft.pecas.filter(function (pc) { var s = Store.peca(pc.pecaId); return !s || s.qtd < pc.qtd; });
          root.querySelector('#od-stock-warn').innerHTML = falta.length ? '<div class="alert warn"><span class="a-dot"></span><div><div class="a-title">Estoque insuficiente</div>' + falta.map(function (pc) { var s = Store.peca(pc.pecaId); return esc(pc.nome) + ': pedido ' + pc.qtd + ', disponível ' + (s ? s.qtd : 0); }).join(' · ') + '. Reponha antes de iniciar o serviço.</div></div>' : '';
        }
        draw();
        root.querySelector('#od-itens').addEventListener('click', function (e) {
          var a = e.target.closest('[data-rm-sv]'), b = e.target.closest('[data-rm-pc]');
          if (a) { draft.servicos.splice(Number(a.getAttribute('data-rm-sv')), 1); markDirty(); draw(); }
          if (b) { draft.pecas.splice(Number(b.getAttribute('data-rm-pc')), 1); markDirty(); draw(); }
        });
        root.querySelector('#od-add-sv').addEventListener('submit', function (e) {
          e.preventDefault();
          var dsc = root.querySelector('#od-sv-desc'), val = root.querySelector('#od-sv-val');
          var err = {};
          if (!dsc.value.trim()) err.d = dsc;
          if (UI.parseMoney(val.value) <= 0) err.v = val;
          [dsc, val].forEach(function (x) { x.closest('.field').classList.toggle('invalid', !!(x === err.d || x === err.v)); });
          if (err.d || err.v) { (err.d || err.v).focus(); return; }
          draft.servicos.push({ descricao: dsc.value.trim(), valor: UI.parseMoney(val.value) });
          dsc.value = ''; val.value = ''; dsc.focus(); markDirty(); draw();
        });
        root.querySelector('#od-add-pc').addEventListener('submit', function (e) {
          e.preventDefault();
          var sel = root.querySelector('#od-pc-id'), q = root.querySelector('#od-pc-qtd');
          var pc = Store.peca(sel.value), qtd = parseInt(q.value, 10);
          sel.closest('.field').classList.toggle('invalid', !pc);
          q.closest('.field').classList.toggle('invalid', !(qtd > 0));
          if (!pc) { sel.focus(); return; }
          if (!(qtd > 0)) { q.focus(); return; }
          var ex = draft.pecas.filter(function (x) { return x.pecaId === pc.id; })[0];
          if (ex) ex.qtd += qtd; else draft.pecas.push({ pecaId: pc.id, codigo: pc.codigo, nome: pc.nome, qtd: qtd, valor: pc.valor });
          sel.value = ''; q.value = '1'; markDirty(); draw();
        });
        root.querySelector('#od-obs').addEventListener('input', markDirty);
        root.querySelector('#od-mec').addEventListener('change', markDirty);

        function persist() {
          o.servicos = draft.servicos; o.pecas = draft.pecas; o.valorFixo = draft.valorFixo;
          o.formato = (draft.servicos.length || draft.pecas.length) ? 'itens' : 'fixo';
          o.obs = root.querySelector('#od-obs').value.trim();
          o.mecanicoId = root.querySelector('#od-mec').value;
          Store.save();
          App.dirty = null;
        }
        root.querySelector('#od-salvar').addEventListener('click', function () { persist(); UI.toast('Orçamento ' + o.id + ' salvo.'); App.refresh(); });
        root.querySelector('#od-orcar').addEventListener('click', function () {
          var mec = root.querySelector('#od-mec');
          var problems = [];
          if (!mec.value) { mec.closest('.field').classList.add('invalid'); problems.push('escolha o mecânico responsável'); }
          if (totalDraft() <= 0) problems.push('inclua serviços ou informe um valor');
          if (problems.length) { UI.toast('Para orçar, ' + problems.join(' e ') + '.', 'err'); if (!mec.value) mec.focus(); return; }
          persist();
          var now = new Date().toISOString();
          o.status = 'orcada'; o.orcadaEm = now; o.atualizadoEm = now;
          Store.save();
          App.success({ nav: 'orcamentos', crumbs: CRUMBS.concat([{ label: o.id }]), title: 'Orçada criada com sucesso!', code: o.id,
            msg: 'Valor de ' + UI.moeda(Store.orcTotal(o)) + ' pronto para apresentar ao cliente.',
            actions: [{ label: 'Voltar ao histórico', route: '/orcamentos' }, { label: 'Abrir orçamento', route: '/orcamentos/' + o.id, cls: 'btn-outline' }] });
        });
      }
    };
  });
})();
