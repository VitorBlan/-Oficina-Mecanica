/* Ordens de serviço — listagem por status e detalhe (ciclo aprovada → em execução → finalizada) */
(function () {
  'use strict';
  var B = window.Bancada, Store = B.Store, UI = B.UI, H = B.H, App = B.App, esc = UI.esc, icon = UI.icon;

  var PAGE = 8;
  var STATUS_OPC = [
    { v: '', label: 'Todas', dot: 'var(--subtle)', titulo: 'Ordens de serviço', sub: 'Todas as ordens abertas a partir de orçamentos aprovados.', btn: 'Filtrar status' },
    { v: 'aprovada', label: 'Aprovada', dot: 'var(--ok)', titulo: 'Ordens de serviço aprovadas', sub: 'Ordens aprovadas, aguardando início de execução.', btn: 'Status: aprovada' },
    { v: 'execucao', label: 'Em execução', dot: 'var(--warn)', titulo: 'Ordens de serviço em execução', sub: 'Ordens em andamento nos boxes da oficina.', btn: 'Status: em execução' },
    { v: 'finalizada', label: 'Finalizada', dot: 'var(--vio)', titulo: 'Ordens de serviço finalizadas', sub: 'Serviços concluídos, entregues ou aguardando retirada.', btn: 'Status: finalizada' }
  ];
  function ui() { return App.ui.os || (App.ui.os = { q: '', status: '', de: '', ate: '', page: 1 }); }

  function filtrar() {
    var f = ui(), n = UI.norm(f.q), pl = UI.normPlaca(f.q);
    return Store.data.ordens.filter(function (o) {
      if (f.status && o.status !== f.status) return false;
      if (!H.inRange(o.abertura, f)) return false;
      if (!n) return true;
      var c = Store.cliente(o.clienteId), v = Store.veiculo(o.veiculoId);
      return UI.norm(o.id).indexOf(n) >= 0 || UI.norm(c && c.nome).indexOf(n) >= 0 ||
        UI.norm(H.veiculoNome(v)).indexOf(n) >= 0 || (pl.length >= 2 && v && v.placa.indexOf(pl) >= 0);
    }).sort(function (a, b) { return new Date(b.abertura) - new Date(a.abertura); });
  }

  function tabela() {
    var f = ui(), pg = UI.paginate(filtrar(), f.page, PAGE);
    f.page = pg.page;
    var rows = pg.items.map(function (o) {
      var c = Store.cliente(o.clienteId), v = Store.veiculo(o.veiculoId);
      return '<tr class="click" data-route="/ordens/' + o.id + '" tabindex="0">' +
        '<td class="nowrap">' + o.id + '</td><td>' + esc(c ? c.nome : '—') + '</td><td>' + esc(H.veiculoLista(v)) + '</td>' +
        '<td class="mono nowrap">' + esc(UI.fmtPlaca(v ? v.placa : '')) + '</td><td class="nowrap">' + UI.data(o.abertura) + '</td>' +
        '<td class="num nowrap">' + UI.moeda(o.valor) + '</td>' +
        '<td>' + UI.osBadge(o.status, 'strong') + (o.status === 'finalizada' && !o.retiradoEm ? '<div class="t-sub" style="margin-top:3px">Aguardando retirada</div>' : '') + (o.status === 'execucao' ? '<div class="t-sub" style="margin-top:3px">Box ' + o.box + '</div>' : '') + '</td></tr>';
    }).join('') || H.emptyRow(7, 'Nenhuma ordem de serviço encontrada', 'Ajuste a busca ou os filtros.');
    return {
      table: '<table class="tbl zebra"><thead><tr><th>Nº OS</th><th>Cliente</th><th>Veículo</th><th>Placa</th><th>Abertura</th><th class="num">Total</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table>',
      pager: pg.total > PAGE ? UI.pagerHtml(pg, 'ordens de serviço') : '<div class="pager"><span class="info">' + pg.total + (pg.total === 1 ? ' ordem de serviço' : ' ordens de serviço') + '</span></div>'
    };
  }

  App.route('/ordens', function () {
    var f = ui();
    var st = STATUS_OPC.filter(function (s) { return s.v === f.status; })[0] || STATUS_OPC[0];
    var t = tabela();
    var html =
      '<div class="page-head"><div class="titles"><h1 class="page-title">' + st.titulo + '</h1><p class="page-sub">' + st.sub + '</p></div></div>' +
      '<div class="toolbar">' +
        '<label class="search"><span class="ico">' + icon('search', 14) + '</span><span class="sr-only">Buscar</span><input id="os-q" type="search" placeholder="Buscar por nº da OS, cliente, veículo ou placa..." value="' + esc(f.q) + '"></label>' +
        '<div class="dropdown"><button type="button" class="btn btn-outline btn-filter" id="os-st-btn" aria-haspopup="true">' + icon('filter', 14) + st.btn + (f.status ? ' <span class="chev">' + icon('chev', 14) + '</span>' : '') + '</button>' +
          '<div class="dropdown-pop" id="os-st-pop" hidden>' + STATUS_OPC.map(function (s) {
            var n = s.v ? Store.data.ordens.filter(function (o) { return o.status === s.v; }).length : Store.data.ordens.length;
            return '<button type="button" class="dd-item ' + (s.v === f.status ? 'on' : '') + '" data-st="' + s.v + '"><span class="dot" style="background:' + s.dot + '"></span>' + s.label + '<span class="spacer" style="flex:1"></span><span class="muted mono" style="font-size:11.5px">' + n + '</span></button>';
          }).join('') + '</div></div>' +
        H.dateFilterHtml('os-dt', f) +
        '<button type="button" class="btn btn-outline-brand" id="os-export">Exportar relatório</button>' +
      '</div>' +
      '<div class="card tbl-card"><div class="table-wrap" id="os-table">' + t.table + '</div></div>' +
      '<div id="os-pager">' + t.pager + '</div>';

    return {
      nav: 'ordens', crumbs: [{ label: 'Ordens de serviço', route: '/ordens' }, { label: 'Listagem de OS' }], title: 'Ordens de serviço', html: html,
      mount: function (root) {
        function redraw() { var t2 = tabela(); root.querySelector('#os-table').innerHTML = t2.table; root.querySelector('#os-pager').innerHTML = t2.pager; }
        root.querySelector('#os-q').addEventListener('input', function (e) { f.q = e.target.value; f.page = 1; redraw(); });
        UI.bindDropdown(root, '#os-st-btn', '#os-st-pop');
        root.querySelectorAll('[data-st]').forEach(function (b) { b.addEventListener('click', function () { f.status = b.getAttribute('data-st'); f.page = 1; App.refresh(); }); });
        H.bindDateFilter(root, 'os-dt', f, function () { f.page = 1; App.refresh(); });
        root.querySelector('#os-pager').addEventListener('click', function (e) { var b = e.target.closest('[data-page]'); if (b && !b.disabled) { f.page = Number(b.getAttribute('data-page')); redraw(); } });
        root.querySelector('#os-table').addEventListener('keydown', function (e) { var tr = e.target.closest('tr.click'); if (tr && e.key === 'Enter') App.navigate(tr.getAttribute('data-route')); });
        root.querySelector('#os-export').addEventListener('click', function () {
          var rows = [['OS', 'Orçamento', 'Cliente', 'Veículo', 'Placa', 'Abertura', 'Início', 'Fechamento', 'Box', 'Mecânico', 'Status', 'Valor total']];
          filtrar().forEach(function (o) {
            var v = Store.veiculo(o.veiculoId);
            rows.push([o.id, o.orcamentoId, H.clienteNome(o.clienteId), H.veiculoLista(v), UI.fmtPlaca(v.placa), UI.dataHora(o.abertura), o.inicio ? UI.dataHora(o.inicio) : '', o.fechamento ? UI.dataHora(o.fechamento) : '', o.box || '', Store.mecanicoNome(o.mecanicoId), UI.OS_STATUS[o.status].label, UI.moneyInput(o.valor)]);
          });
          UI.exportCsv('Exportar ordens de serviço', 'ordens-de-servico-' + UI.isoDate(new Date()) + '.csv', rows);
        });
      }
    };
  });

  App.route('/ordens/:id', function (p) {
    var os = Store.os(p.id);
    var crumbs = [{ label: 'Ordens de serviço', route: '/ordens' }, { label: p.id }];
    if (!os) return { nav: 'ordens', crumbs: crumbs, html: '<div class="alert warn"><div><div class="a-title">Ordem de serviço não encontrada</div>A OS ' + esc(p.id) + ' não existe. <a href="#/ordens" data-route="/ordens" style="text-decoration:underline">Voltar à listagem</a>.</div></div>' };
    var orc = H.orcDaOs(os);
    var R = B.Orc.readonlyVal;
    var html = B.Orc.cabecalho(orc, 'Ordem de Serviço ' + os.id, UI.osBadge(os.status, 'strong'));
    html += '<section class="card"><div class="card-head"><h2 class="card-title">Observações internas / recomendações</h2></div><div class="card-body"><p class="help">Observações registradas no atendimento (orçamento <a href="#/orcamentos/' + orc.id + '" data-route="/orcamentos/' + orc.id + '" style="text-decoration:underline">' + orc.id + '</a>).</p><div class="readonly-val area">' + esc(orc.obs || '—') + '</div></div></section>';
    var itens = H.itensTabela(orc);
    if (itens) html += '<section class="card tbl-card"><div class="card-head"><div class="titles"><h2 class="card-title">Serviços e peças</h2>' + (orc.pecas.length ? '<p class="card-sub">' + (os.estoqueBaixado ? 'Peças já baixadas do estoque.' : 'As peças saem do estoque quando o serviço começar no box.') + '</p>' : '') + '</div></div>' + itens + '</section>';

    var botoes = '<button type="button" class="btn btn-brand sm" id="os-consultar">Consultar a OS</button>';
    if (os.status === 'aprovada') botoes += '<button type="button" class="btn btn-primary sm" data-route="/boxes/designar/' + os.id + '">Designar box e mecânico</button>';
    if (os.status === 'execucao') botoes += '<button type="button" class="btn btn-go sm" data-route="/boxes/concluir/' + os.box + '">Finalizar</button>';
    if (os.status === 'finalizada' && !os.retiradoEm) botoes += '<button type="button" class="btn btn-go sm" id="os-retirada">Registrar retirada</button>';

    var tempo = os.status === 'execucao' ? UI.duracao(UI.minutosEntre(os.inicio)) + ' (em andamento)' : os.tempoBoxMin !== null ? UI.duracao(os.tempoBoxMin) : '—';
    html += '<section class="card"><div class="card-head"><h2 class="card-title">Valor e execução</h2></div><div class="card-body">' +
      '<p class="help">Valor aprovado pelo cliente e dados do serviço no box.</p>' +
      '<div class="form-grid cols-4">' +
        R('Valor do orçamento', UI.moeda(os.valor), 'lg') +
        R('Mecânico responsável', Store.mecanicoNome(os.mecanicoId) || 'A definir') +
        R('Box', os.box ? 'Box ' + os.box : 'Aguardando designação') +
        R('Tempo no box', tempo) +
        R('Abertura', UI.dataHora(os.abertura)) +
        R('Início', os.inicio ? UI.dataHora(os.inicio) : '—') +
        R('Fechamento', os.fechamento ? UI.dataHora(os.fechamento) : '—') +
        R('Retirada', os.retiradoEm ? UI.dataHora(os.retiradoEm) + ' · ' + os.retiradoPor : (os.status === 'finalizada' ? 'Aguardando o cliente' : '—')) +
      '</div>' +
      '<div class="row" style="gap:10px;margin-top:4px">' + botoes + '</div>' +
      '</div></section>';
    html += '<section class="card"><div class="card-head"><div class="titles"><h2 class="card-title">Histórico do atendimento</h2><p class="card-sub">Transições de status da OS com data, hora e responsável.</p></div></div><div class="card-body">' + H.timelineHtml(H.timeline(orc, os)) + '</div></section>';

    return {
      nav: 'ordens', crumbs: crumbs, title: os.id, html: html,
      mount: function (root) {
        root.querySelector('#os-consultar').addEventListener('click', function () { H.consultar(orc, os); });
        var r = root.querySelector('#os-retirada');
        if (r) r.addEventListener('click', function () { H.registrarRetirada(os, App.refresh); });
      }
    };
  });
})();
