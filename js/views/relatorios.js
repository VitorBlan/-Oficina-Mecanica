/* Relatórios — catálogo (US-012) e Relatório de Ordens de Serviço (RF-05) */
(function () {
  'use strict';
  var B = window.Bancada, Store = B.Store, UI = B.UI, H = B.H, App = B.App, esc = UI.esc, icon = UI.icon;
  function ui() { return App.ui.rel || (App.ui.rel = { q: '', freq: '', de: '', ate: '', atualizado: new Date(Date.now() - 12 * 60000).toISOString(), status: '', mec: '' }); }

  var CATALOGO = [
    { id: 'ordens', titulo: 'Relatório de Ordens de Serviço', desc: 'Cliente, funcionário, mecânico, valor e datas de abertura/fechamento.', freq: 'diaria', pronto: true },
    { titulo: 'Relatório de Orçamentos', desc: 'Orçamentos por status: aberto, orçado, aprovado e recusado.', freq: 'semanal', att: 'há 1h' },
    { titulo: 'Relatório de Faturamento', desc: 'Valores faturados por período e forma de pagamento.', freq: 'mensal', att: 'há 3h' },
    { titulo: 'Relatório de Ocupação dos Boxes', desc: 'Tempo médio de permanência e uso de cada box.', freq: 'diaria', att: 'hoje' },
    { titulo: 'Relatório de Peças e Estoque', desc: 'Peças com giro alto, baixo estoque e reposição.', freq: 'semanal', att: 'ontem' },
    { titulo: 'Relatório de Clientes Atendidos', desc: 'Clientes atendidos por período e frequência de retorno.', freq: 'mensal', att: 'há 2 dias' },
    { titulo: 'Relatório de Desempenho dos Mecânicos', desc: 'OS concluídas e tempo médio por mecânico.', freq: 'mensal', att: 'há 4h' },
    { titulo: 'Relatório de Veículos Atendidos', desc: 'Veículos por marca, modelo e histórico de serviços.', freq: 'mensal', att: 'há 1 dia' }
  ];
  var FREQ = [{ v: '', label: 'Frequência: todas' }, { v: 'diaria', label: 'Frequência: diária' }, { v: 'semanal', label: 'Frequência: semanal' }, { v: 'mensal', label: 'Frequência: mensal' }];

  App.route('/relatorios', function () {
    var f = ui(), s = App.session() || {};
    var n = UI.norm(f.q);
    var lista = CATALOGO.filter(function (r) { return (!f.freq || r.freq === f.freq) && (!n || UI.norm(r.titulo + ' ' + r.desc).indexOf(n) >= 0); });
    var fr = FREQ.filter(function (x) { return x.v === f.freq; })[0];
    var cards = lista.map(function (r) {
      return '<article class="card report-card"><h2 class="r-title">' + esc(r.titulo) + '</h2><p class="r-desc">' + esc(r.desc) + '</p>' +
        '<div class="r-foot"><span>Atualizado ' + (r.pronto ? UI.relativo(f.atualizado) : r.att) + '</span>' +
        (r.pronto ? '<button type="button" class="r-link" data-route="/relatorios/' + r.id + '">Ver relatório →</button>' : '<span>Em breve</span>') + '</div></article>';
    }).join('');
    var html =
      '<div class="page-head"><div class="titles"><h1 class="page-title">Relatórios</h1><p class="page-sub">Olá, <span class="hl">' + esc((s.nome || '').split(' ')[0]) + '</span> — acompanhe e exporte os relatórios disponíveis da oficina.</p></div></div>' +
      '<div class="toolbar">' +
        '<label class="search"><span class="ico">' + icon('search', 14) + '</span><span class="sr-only">Buscar</span><input id="rl-q" type="search" placeholder="Buscar relatório por nome ou descrição..." value="' + esc(f.q) + '"></label>' +
        '<div class="dropdown"><button type="button" class="btn btn-outline btn-filter" id="rl-fr-btn">' + icon('filter', 14) + fr.label + ' <span class="chev">' + icon('chev', 14) + '</span></button>' +
          '<div class="dropdown-pop" id="rl-fr-pop" hidden>' + FREQ.map(function (x) { return '<button type="button" class="dd-item ' + (x.v === f.freq ? 'on' : '') + '" data-fr="' + x.v + '">' + x.label.replace('Frequência: ', '') + '</button>'; }).join('') + '</div></div>' +
        H.dateFilterHtml('rl-dt', f) +
        '<button type="button" class="btn btn-outline-brand" id="rl-att">Atualizar relatórios</button>' +
      '</div>' +
      (f.de || f.ate ? '<p class="muted" style="font-size:12.5px;margin-top:-8px">O período escolhido é aplicado ao abrir o relatório.</p>' : '') +
      (cards ? '<div class="report-grid">' + cards + '</div>' : '<div class="card"><div class="tbl-empty"><strong>Nenhum relatório encontrado</strong>Ajuste a busca ou a frequência.</div></div>') +
      '<div class="pager"><span class="info">Mostrando ' + lista.length + ' de ' + CATALOGO.length + ' relatórios disponíveis</span><span class="spacer"></span><button type="button" class="btn btn-outline sm" disabled>Anterior</button><button type="button" class="btn btn-outline sm" disabled>Próxima</button></div>';
    return {
      nav: 'relatorios', crumbs: [{ label: 'Relatórios', route: '/relatorios' }, { label: 'Disponíveis' }], title: 'Relatórios', html: html,
      mount: function (root) {
        var q = root.querySelector('#rl-q');
        q.addEventListener('input', function () { f.q = q.value; App.refresh(); var nq = document.getElementById('rl-q'); nq.focus(); nq.setSelectionRange(nq.value.length, nq.value.length); });
        UI.bindDropdown(root, '#rl-fr-btn', '#rl-fr-pop');
        root.querySelectorAll('[data-fr]').forEach(function (b) { b.addEventListener('click', function () { f.freq = b.getAttribute('data-fr'); App.refresh(); }); });
        H.bindDateFilter(root, 'rl-dt', f, App.refresh);
        root.querySelector('#rl-att').addEventListener('click', function () { f.atualizado = new Date().toISOString(); UI.toast('Relatórios atualizados com os dados mais recentes.'); App.refresh(); });
      }
    };
  });

  /* ---------- RF-05: Relatório de Ordens de Serviço ---------- */
  function filtrar() {
    var f = ui();
    return Store.data.ordens.filter(function (o) {
      if (f.status && o.status !== f.status) return false;
      if (f.mec && o.mecanicoId !== f.mec) return false;
      return H.inRange(o.abertura, f);
    }).sort(function (a, b) { return new Date(b.abertura) - new Date(a.abertura); });
  }

  App.route('/relatorios/ordens', function () {
    var f = ui();
    var lista = filtrar();
    var total = lista.reduce(function (s, o) { return s + o.valor; }, 0);
    var fin = lista.filter(function (o) { return o.tempoBoxMin !== null && o.tempoBoxMin !== undefined; });
    var tempoMedio = fin.length ? Math.round(fin.reduce(function (s, o) { return s + o.tempoBoxMin; }, 0) / fin.length) : null;
    var rows = lista.map(function (o) {
      return '<tr class="click" data-route="/ordens/' + o.id + '"><td class="mono nowrap">' + o.id + '</td><td>' + esc(H.clienteNome(o.clienteId)) + '</td><td>' + esc(o.funcionario) + '</td><td>' + esc(Store.mecanicoNome(o.mecanicoId) || '—') + '</td>' +
        '<td class="num nowrap">' + UI.moeda(o.valor) + '</td><td class="nowrap">' + UI.dataHora(o.abertura) + '</td><td class="nowrap">' + (o.fechamento ? UI.dataHora(o.fechamento) : '<span class="muted">—</span>') + '</td><td>' + UI.osBadge(o.status) + '</td></tr>';
    }).join('') || H.emptyRow(8, 'Nenhuma ordem de serviço no filtro', 'Amplie o período ou remova filtros.');
    var html =
      '<div class="page-head"><div class="titles"><h1 class="page-title">Relatório de Ordens de Serviço</h1><p class="page-sub">RF-05 · cliente, funcionário, mecânico, valor total e datas de abertura e fechamento de cada OS.</p></div><span class="spacer"></span><div class="actions">' +
        '<button type="button" class="btn btn-outline" data-route="/relatorios">' + icon('back', 14) + ' Relatórios</button>' +
        '<button type="button" class="btn btn-outline-brand" id="ro-export">' + icon('download', 14) + ' Exportar CSV</button></div></div>' +
      '<form class="toolbar" id="ro-form">' +
        '<div class="field" style="flex-direction:row;align-items:center;gap:8px"><label for="ro-de" class="muted" style="font-weight:400">De</label><input type="date" class="input" id="ro-de" name="de" value="' + esc(f.de) + '" style="width:160px"></div>' +
        '<div class="field" style="flex-direction:row;align-items:center;gap:8px"><label for="ro-ate" class="muted" style="font-weight:400">Até</label><input type="date" class="input" id="ro-ate" name="ate" value="' + esc(f.ate) + '" style="width:160px"></div>' +
        '<select class="select" name="status" aria-label="Status" style="width:170px">' + H.options([{ value: 'aprovada', label: 'Aprovada' }, { value: 'execucao', label: 'Em execução' }, { value: 'finalizada', label: 'Finalizada' }], f.status, 'Todos os status') + '</select>' +
        '<select class="select" name="mec" aria-label="Mecânico" style="width:200px">' + H.options(Store.data.mecanicos.map(function (m) { return { value: m.id, label: m.nome }; }), f.mec, 'Todos os mecânicos') + '</select>' +
        '<button type="button" class="btn btn-ghost" id="ro-clear">Limpar filtros</button>' +
      '</form>' +
      '<div class="grid grid-4">' +
        '<div class="card kpi" style="--rail:var(--brand)"><span class="kpi-label">Ordens no filtro</span><span class="kpi-value md">' + lista.length + '</span><span class="kpi-hint">' + lista.filter(function (o) { return o.status === 'finalizada'; }).length + ' finalizadas</span></div>' +
        '<div class="card kpi" style="--rail:var(--ok)"><span class="kpi-label">Valor total</span><span class="kpi-value md">' + UI.moeda(total) + '</span><span class="kpi-hint">Soma dos orçamentos aprovados</span></div>' +
        '<div class="card kpi" style="--rail:var(--info)"><span class="kpi-label">Ticket médio</span><span class="kpi-value md">' + UI.moeda(lista.length ? total / lista.length : 0) + '</span><span class="kpi-hint">Valor médio por OS</span></div>' +
        '<div class="card kpi" style="--rail:var(--warn)"><span class="kpi-label">Tempo médio no box</span><span class="kpi-value md">' + (tempoMedio !== null ? UI.duracao(tempoMedio) : '—') + '</span><span class="kpi-hint">Entre início e conclusão</span></div>' +
      '</div>' +
      '<div class="card tbl-card"><div class="table-wrap"><table class="tbl zebra"><thead><tr><th>OS</th><th>Cliente</th><th>Funcionário</th><th>Mecânico</th><th class="num">Valor total</th><th>Abertura</th><th>Fechamento</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody>' +
      (lista.length ? '<tfoot><tr><td colspan="4">Total · ' + lista.length + (lista.length === 1 ? ' ordem de serviço' : ' ordens de serviço') + '</td><td class="num nowrap">' + UI.moeda(total) + '</td><td colspan="3"></td></tr></tfoot>' : '') +
      '</table></div></div>' +
      '<p class="muted" style="font-size:12px">Gerado em ' + UI.dataHora(new Date().toISOString()) + ' por ' + esc((App.session() || {}).nome || '') + '.</p>';
    return {
      nav: 'relatorios', crumbs: [{ label: 'Relatórios', route: '/relatorios' }, { label: 'Ordens de Serviço' }], title: 'Relatório de Ordens de Serviço', html: html,
      mount: function (root) {
        var form = root.querySelector('#ro-form');
        form.addEventListener('change', function () { var v = UI.formValues(form); f.de = v.de; f.ate = v.ate; f.status = v.status; f.mec = v.mec; App.refresh(); });
        form.addEventListener('submit', function (e) { e.preventDefault(); });
        root.querySelector('#ro-clear').addEventListener('click', function () { f.de = ''; f.ate = ''; f.status = ''; f.mec = ''; App.refresh(); });
        root.querySelector('#ro-export').addEventListener('click', function () {
          var rows = [['OS', 'Cliente', 'Funcionário', 'Mecânico', 'Valor total', 'Abertura', 'Fechamento', 'Status']];
          lista.forEach(function (o) { rows.push([o.id, H.clienteNome(o.clienteId), o.funcionario, Store.mecanicoNome(o.mecanicoId), UI.moneyInput(o.valor), UI.dataHora(o.abertura), o.fechamento ? UI.dataHora(o.fechamento) : '', UI.OS_STATUS[o.status].label]); });
          rows.push(['Total', lista.length + ' OS', '', '', UI.moneyInput(total), '', '', '']);
          UI.exportCsv('Exportar Relatório de Ordens de Serviço', 'relatorio-ordens-de-servico-' + UI.isoDate(new Date()) + '.csv', rows);
        });
      }
    };
  });
})();
