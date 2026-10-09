/* Painel — visão do dia da secretária */
(function () {
  'use strict';
  var B = window.Bancada, Store = B.Store, UI = B.UI, H = B.H, App = B.App, esc = UI.esc;

  function spark(counts) {
    var max = Math.max.apply(null, counts.concat([1]));
    return '<div class="spark" aria-hidden="true">' + counts.map(function (c) {
      return '<i style="height:' + Math.max(12, Math.round((c / max) * 100)) + '%"></i>';
    }).join('') + '</div>';
  }
  function porDia(dates) {
    var out = [];
    for (var i = 6; i >= 0; i--) {
      var day = new Date(); day.setDate(day.getDate() - i);
      out.push(dates.filter(function (t) { return t && UI.mesmoDia(t, day); }).length);
    }
    return out;
  }

  App.route('/painel', function () {
    var d = Store.data, s = App.session() || {};
    var orcs = d.orcamentos, ordens = d.ordens;
    var ocup = Store.boxOcupacao();
    var nOcup = Object.keys(ocup).length;

    var abertosOrcados = orcs.filter(function (o) { return o.status === 'aberta' || o.status === 'orcada'; });
    var osAtivas = ordens.filter(function (o) { return o.status === 'aprovada' || o.status === 'execucao'; });
    var prontos = ordens.filter(function (o) { return o.status === 'finalizada' && !o.retiradoEm; })
      .sort(function (a, b) { return new Date(a.fechamento) - new Date(b.fechamento); });
    var naOficina = abertosOrcados.length + osAtivas.length + prontos.length;

    var orcadas = orcs.filter(function (o) { return o.status === 'orcada'; });
    var orcadas24 = orcadas.filter(function (o) { return UI.minutosEntre(o.orcadaEm) > 1440; }).length;

    var ultimo = ordens.filter(function (o) { return o.fechamento; }).sort(function (a, b) { return new Date(b.fechamento) - new Date(a.fechamento); })[0];
    var ultimoTxt = 'Nenhum serviço concluído ainda';
    if (ultimo) {
      var ontem = new Date(); ontem.setDate(ontem.getDate() - 1);
      var quando = UI.mesmoDia(ultimo.fechamento) ? 'hoje' : UI.mesmoDia(ultimo.fechamento, ontem) ? 'ontem' : 'em ' + UI.data(ultimo.fechamento);
      ultimoTxt = '1 concluído ' + quando + ' às ' + UI.hora(ultimo.fechamento);
    }

    var entradasHoje = orcs.filter(function (o) { return UI.mesmoDia(o.criadoEm); }).length;
    var retiradasHoje = ordens.filter(function (o) { return o.retiradoEm && UI.mesmoDia(o.retiradoEm); }).length;

    var h = new Date().getHours();
    var saud = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
    var primeiro = (s.nome || '').split(' ')[0];

    var kpis = [
      { label: 'Veículos na oficina', value: naOficina, hint: nOcup + ' boxes ocupados de ' + d.boxes, rail: 'var(--brand)', spark: porDia(orcs.map(function (o) { return o.criadoEm; })), route: '/boxes' },
      { label: 'Aguardando aprovação', value: orcadas.length, hint: orcadas24 ? orcadas24 + (orcadas24 > 1 ? ' orçados' : ' orçado') + ' há mais de 24 h' : 'Nenhum orçamento parado há mais de 24 h', rail: 'var(--info)', spark: porDia(orcs.map(function (o) { return o.orcadaEm; })), route: '/orcamentos', filtro: 'orcada' },
      { label: 'Prontos para retirada', value: prontos.length, hint: ultimoTxt, rail: 'var(--ok)', spark: porDia(ordens.map(function (o) { return o.fechamento; })), route: '/ordens', filtroOs: 'finalizada' },
      { label: 'Atendimentos hoje', value: entradasHoje + retiradasHoje, hint: entradasHoje + (entradasHoje === 1 ? ' entrada' : ' entradas') + ' · ' + retiradasHoje + (retiradasHoje === 1 ? ' retirada' : ' retiradas'), rail: 'var(--borderstrong)', spark: porDia(orcs.map(function (o) { return o.criadoEm; }).concat(ordens.map(function (o) { return o.retiradoEm; }))) }
    ];

    var kpiHtml = '<div class="grid grid-4">' + kpis.map(function (k, i) {
      return '<div class="card kpi" style="--rail:' + k.rail + '">' +
        '<span class="kpi-label">' + k.label + '</span>' +
        '<span class="kpi-value num">' + k.value + '</span>' +
        '<span class="kpi-hint">' + esc(k.hint) + '</span>' + spark(k.spark) + '</div>';
    }).join('') + '</div>';

    // Tabela de andamento: orçamentos (aberta/orçada) + OS (aprovada/execução)
    var linhas = [];
    abertosOrcados.forEach(function (o) {
      var desde = o.status === 'orcada' ? o.orcadaEm : (o.reabertoEm || o.criadoEm);
      linhas.push({ id: o.id, route: '/orcamentos/' + o.id, v: Store.veiculo(o.veiculoId), c: Store.cliente(o.clienteId), badge: UI.orcBadge(o.status), total: Store.orcTotal(o), aOrcar: o.status === 'aberta' && !Store.orcTotal(o), min: UI.minutosEntre(desde), alerta: o.status === 'orcada' && UI.minutosEntre(desde) > 1440 });
    });
    osAtivas.forEach(function (o) {
      var orc = H.orcDaOs(o);
      var exec = o.status === 'execucao';
      linhas.push({ id: o.id, route: '/ordens/' + o.id, v: Store.veiculo(o.veiculoId), c: Store.cliente(o.clienteId), badge: exec ? UI.osBadge('execucao') : UI.orcBadge('aprovada'), total: o.valor, min: exec ? -1 : UI.minutosEntre(o.abertura), exec: exec, orc: orc });
    });
    linhas.sort(function (a, b) { return b.min - a.min; });
    var mostrar = linhas.slice(0, 7);

    var rows = mostrar.map(function (l) {
      return '<tr class="click" data-route="' + l.route + '" tabindex="0">' +
        '<td class="mono nowrap">' + l.id + '</td>' +
        '<td><div class="t-main">' + esc(H.veiculoLista(l.v)) + '</div><div class="t-sub">' + esc(l.c ? l.c.nome : '') + ' · ' + esc(UI.fmtPlaca(l.v.placa)) + '</div></td>' +
        '<td>' + l.badge + '</td>' +
        '<td class="num mono ' + (l.aOrcar ? 'muted' : '') + '">' + (l.aOrcar ? 'a orçar' : UI.moeda(l.total)) + '</td>' +
        '<td class="mono nowrap" style="color:' + (l.alerta ? 'var(--dgr)' : l.min < 0 ? 'var(--mutedfg)' : 'var(--fg)') + '">' + (l.min < 0 ? '—' : UI.parada(l.min)) + '</td>' +
        '</tr>';
    }).join('') || H.emptyRow(5, 'Nenhum atendimento em andamento', 'Abra um orçamento para começar.');

    var prontosHtml = prontos.length ? prontos.map(function (o) {
      var c = Store.cliente(o.clienteId), v = Store.veiculo(o.veiculoId);
      return '<div class="queue-item">' +
        '<span class="avatar ok">' + esc(UI.iniciais(c ? c.nome : '')) + '</span>' +
        '<div class="q-main"><span class="t-main" style="font-weight:500">' + esc(c ? c.nome : '—') + '</span><span class="mono muted" style="font-size:12px">' + esc(UI.fmtPlaca(v.placa)) + ' · ' + o.id + '</span></div>' +
        '<button type="button" class="btn btn-outline sm" data-chamar="' + o.id + '">Chamar</button></div>';
    }).join('') : '<div class="card-body"><p class="muted">Nenhum veículo aguardando retirada.</p></div>';

    var emExec = Object.keys(ocup).map(function (k) { return ocup[k]; }).sort(function (a, b) { return new Date(a.inicio) - new Date(b.inicio); });
    var agendaHtml = emExec.length ? '<div class="timeline">' + emExec.map(function (o, i) {
      var orc = H.orcDaOs(o);
      return '<div class="tl-item"><span class="tl-dot ' + (i === 0 ? 't-brand' : 't-muted') + '"></span><div><div class="tl-title" style="font-weight:500">' + UI.hora(o.inicio) + ' · ' + esc(H.servicoPrincipal(orc)) + '</div><div class="tl-sub">Box ' + o.box + ' · ' + esc(Store.mecanicoNome(o.mecanicoId)) + '</div></div></div>';
    }).join('') + '</div>' : '<p class="muted">Nenhum box em execução agora.</p>';

    var html =
      '<div class="page-head"><div class="titles"><h1 class="page-title">' + saud + ', ' + esc(primeiro) + '</h1>' +
      '<p class="page-sub">' + UI.dataExtenso() + (s.inicio ? ' · turno iniciado às ' + UI.hora(s.inicio) : '') + '</p></div>' +
      '<span class="spacer"></span><div class="actions"><button type="button" class="btn btn-primary" data-route="/orcamentos/novo">' + UI.icon('plus', 14) + ' Novo orçamento</button></div></div>' +
      kpiHtml +
      '<div class="split">' +
        '<section class="card tbl-card">' +
          '<div class="card-head"><div class="titles"><h2 class="card-title">Ordens de serviço em andamento</h2><p class="card-sub">Ordenadas pelo tempo parado esperando decisão.</p></div></div>' +
          '<div class="table-wrap" style="padding:6px 6px 0"><table class="tbl plain"><thead><tr><th>OS</th><th>Veículo e cliente</th><th>Situação</th><th class="num">Valor</th><th>Parada há</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
          (linhas.length > mostrar.length ? '<div class="card-foot"><span class="muted" style="font-size:12.5px">Mais ' + (linhas.length - mostrar.length) + ' em andamento</span><span class="spacer"></span><button class="btn btn-ghost sm" data-route="/ordens">Ver ordens de serviço</button><button class="btn btn-ghost sm" data-route="/orcamentos">Ver orçamentos</button></div>' : '') +
        '</section>' +
        '<div class="stack">' +
          '<section class="card"><div class="card-head"><div class="titles"><h2 class="card-title">Prontos para retirada</h2><p class="card-sub">Cliente já pode ser chamado.</p></div></div>' + prontosHtml + '</section>' +
          '<section class="card"><div class="card-head"><div class="titles"><h2 class="card-title">Agenda de hoje</h2><p class="card-sub">Serviços em execução nos boxes.</p></div><span class="spacer"></span><button class="btn btn-ghost sm" data-route="/boxes">Abrir agenda</button></div><div class="card-body">' + agendaHtml + '</div></section>' +
        '</div>' +
      '</div>';

    return {
      nav: 'painel', crumbs: [{ label: 'Atendimento' }, { label: 'Painel' }], title: 'Painel', html: html,
      mount: function (root) {
        root.querySelectorAll('[data-chamar]').forEach(function (b) {
          b.addEventListener('click', function () { H.registrarRetirada(Store.os(b.getAttribute('data-chamar')), App.refresh); });
        });
        root.querySelectorAll('tr.click').forEach(function (tr) {
          tr.addEventListener('keydown', function (e) { if (e.key === 'Enter') App.navigate(tr.getAttribute('data-route')); });
        });
      }
    };
  });
})();
