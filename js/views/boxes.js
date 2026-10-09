/* Agenda dos boxes — RF-03: designar box e mecânico, concluir serviço, tempo no box */
(function () {
  'use strict';
  var B = window.Bancada, Store = B.Store, UI = B.UI, H = B.H, App = B.App, esc = UI.esc, icon = UI.icon;
  var CRUMBS = [{ label: 'Gestão' }, { label: 'Agenda dos boxes', route: '/boxes' }];
  function ui() { return App.ui.boxes || (App.ui.boxes = { q: '' }); }

  function tempoTxt(os) { return 'Iniciado às ' + UI.hora(os.inicio) + (UI.mesmoDia(os.inicio) ? '' : ' de ' + UI.data(os.inicio)) + ' · ' + UI.duracao(UI.minutosEntre(os.inicio)) + ' no box'; }

  App.route('/boxes', function () {
    var f = ui(), s = App.session() || {};
    var ocup = Store.boxOcupacao();
    var fila = Store.data.ordens.filter(function (o) { return o.status === 'aprovada'; }).sort(function (a, b) { return new Date(a.abertura) - new Date(b.abertura); });
    var n = UI.norm(f.q);
    function match(os, box) {
      if (!n) return true;
      if (box && (String(box) === n.replace(/\D/g, '') || ('box ' + box) === n)) return true;
      if (!os) return false;
      var c = Store.cliente(os.clienteId), v = Store.veiculo(os.veiculoId);
      return UI.norm(os.id).indexOf(n) >= 0 || UI.norm(c && c.nome).indexOf(n) >= 0 || (v && v.placa.indexOf(UI.normPlaca(f.q)) >= 0 && UI.normPlaca(f.q).length >= 2);
    }
    var livres = 0;
    var cards = '';
    for (var b = 1; b <= Store.data.boxes; b++) {
      var os = ocup[b];
      if (!match(os, b)) continue;
      if (os) {
        var v = Store.veiculo(os.veiculoId);
        cards += '<article class="card box-card"><div class="bx-head"><span class="bx-name">Box ' + b + '</span><span class="spacer" style="flex:1"></span>' + UI.badge('Em execução', 'warn no-dot') + '</div>' +
          '<div><div class="bx-car">' + esc(H.veiculoDesc(v)) + '</div>' +
          '<div class="bx-line">Placa ' + esc(UI.fmtPlaca(v.placa)) + ' · <a href="#/ordens/' + os.id + '" data-route="/ordens/' + os.id + '" style="text-decoration:underline">' + os.id + '</a> · ' + esc(H.clienteNome(os.clienteId)) + '</div>' +
          '<div class="bx-line">Mecânico: ' + esc(Store.mecanicoNome(os.mecanicoId)) + '</div>' +
          '<div class="bx-time" data-inicio="' + os.inicio + '">' + tempoTxt(os) + '</div></div>' +
          '<hr><button type="button" class="btn btn-go block" data-route="/boxes/concluir/' + b + '">Concluir serviço</button></article>';
      } else {
        livres++;
        cards += '<article class="card box-card free"><div class="bx-head"><span class="bx-name">Box ' + b + '</span><span class="spacer" style="flex:1"></span>' + UI.badge('Livre', 'ok no-dot') + '</div>' +
          '<div class="bx-free">Disponível para uma nova ordem de serviço.</div>' +
          '<hr><button type="button" class="btn btn-outline block" data-livre="' + b + '" ' + (fila.length ? '' : 'disabled title="Nenhuma OS aguardando box"') + '>Designar OS</button></article>';
      }
    }
    var totalLivres = Store.data.boxes - Object.keys(ocup).length;
    var filaF = fila.filter(function (o) { return match(o, null); });
    var filaHtml = filaF.length ? filaF.map(function (o) {
      var v = Store.veiculo(o.veiculoId);
      return '<div class="queue-item">' +
        '<div class="q-main"><span><strong class="mono" style="font-weight:600">' + o.id + '</strong> · ' + esc(H.veiculoDesc(v)) + '</span>' +
        '<span class="t-sub">' + esc(H.clienteNome(o.clienteId)) + ' · placa ' + esc(UI.fmtPlaca(v.placa)) + ' · aprovada ' + UI.relativo(o.abertura) + ' · ' + UI.moeda(o.valor) + '</span></div>' +
        UI.osBadge('aprovada') +
        '<button type="button" class="btn btn-brand sm" data-route="/boxes/designar/' + o.id + '" ' + (totalLivres ? '' : 'disabled title="Todos os boxes estão ocupados"') + '>Designar box</button></div>';
    }).join('') : '<div class="card-body"><p class="muted">' + (fila.length ? 'Nenhuma OS da fila corresponde à busca.' : 'Nenhuma OS aprovada aguardando box. Quando um orçamento for aprovado, a OS aparece aqui.') + '</p></div>';

    var html =
      '<div class="page-head"><div class="titles"><h1 class="page-title">Agenda dos boxes</h1><p class="page-sub">Olá, <span class="hl">' + esc((s.nome || '').split(' ')[0]) + '</span> — acompanhe a ocupação dos boxes de serviço.</p></div></div>' +
      '<form class="search-inline" id="bx-search"><label for="bx-q">Buscar:</label><input id="bx-q" type="search" placeholder="Número do box, OS ou cliente" value="' + esc(f.q) + '"><button class="btn btn-brand" type="submit">Buscar</button>' +
        (f.q ? '<button type="button" class="btn btn-ghost" id="bx-clear">Limpar</button>' : '') + '</form>' +
      '<div class="row"><span class="badge ok no-dot">' + totalLivres + (totalLivres === 1 ? ' box livre' : ' boxes livres') + '</span><span class="badge warn no-dot">' + (Store.data.boxes - totalLivres) + ' em execução</span><span class="badge no-dot">' + fila.length + ' na fila</span></div>' +
      '<section class="card"><div class="card-head"><div class="titles"><h2 class="card-title">Fila de designação</h2><p class="card-sub">Ordens aprovadas que precisam de box e mecânico antes de entrar em execução.</p></div></div>' + filaHtml + '</section>' +
      '<div class="titles" style="display:flex;flex-direction:column;gap:3px"><h2 class="card-title">Boxes de serviço</h2><p class="card-sub">Um box comporta um veículo por vez enquanto a OS estiver em execução.</p></div>' +
      (cards ? '<div class="box-grid">' + cards + '</div>' : '<div class="card"><div class="card-body"><p class="muted">Nenhum box corresponde à busca.</p></div></div>');

    return {
      nav: 'boxes', crumbs: [{ label: 'Gestão' }, { label: 'Agenda dos boxes' }], title: 'Agenda dos boxes', html: html,
      mount: function (root) {
        root.querySelector('#bx-search').addEventListener('submit', function (e) { e.preventDefault(); f.q = root.querySelector('#bx-q').value.trim(); App.refresh(); });
        var cl = root.querySelector('#bx-clear');
        if (cl) cl.addEventListener('click', function () { f.q = ''; App.refresh(); });
        root.querySelectorAll('[data-livre]').forEach(function (bt) {
          bt.addEventListener('click', function () {
            App.ui.preBox = Number(bt.getAttribute('data-livre'));
            if (fila.length === 1) { App.navigate('/boxes/designar/' + fila[0].id); return; }
            UI.modal({
              title: 'Designar OS ao Box ' + App.ui.preBox, text: 'Escolha a ordem de serviço aprovada que vai ocupar este box.',
              body: '<div class="field"><label for="pick-os">Ordem de serviço</label><select class="select" id="pick-os">' + H.options(fila.map(function (o) { var v = Store.veiculo(o.veiculoId); return { value: o.id, label: o.id + ' · ' + H.veiculoNome(v) + ' · ' + H.clienteNome(o.clienteId) }; }), fila[0].id) + '</select></div>',
              actions: [{ label: 'Cancelar' }, { label: 'Continuar', cls: 'btn-brand', onClick: function (m) { App.navigate('/boxes/designar/' + m.el.querySelector('#pick-os').value); } }]
            });
          });
        });
        App.timers.push(setInterval(function () {
          root.querySelectorAll('.bx-time[data-inicio]').forEach(function (el) { el.textContent = tempoTxt({ inicio: el.getAttribute('data-inicio') }); });
        }, 30000));
      }
    };
  });

  /* ---------- Designar box e mecânico ---------- */
  App.route('/boxes/designar/:id', function (p) {
    var os = Store.os(p.id);
    var crumbs = CRUMBS.concat([{ label: 'Designar box' }]);
    if (!os) return { nav: 'boxes', crumbs: crumbs, html: '<div class="alert warn"><div><div class="a-title">Ordem de serviço não encontrada</div><a href="#/boxes" data-route="/boxes" style="text-decoration:underline">Voltar à Agenda dos boxes</a>.</div></div>' };
    if (os.status !== 'aprovada') {
      return { nav: 'boxes', crumbs: crumbs, html: '<div class="alert info"><div><div class="a-title">' + os.id + ' já ' + (os.status === 'execucao' ? 'está em execução no Box ' + os.box : 'foi finalizada') + '</div>Somente ordens aprovadas podem receber box. <a href="#/ordens/' + os.id + '" data-route="/ordens/' + os.id + '" style="text-decoration:underline">Abrir a OS</a>.</div></div>' };
    }
    var orc = H.orcDaOs(os), v = Store.veiculo(os.veiculoId);
    var ocup = Store.boxOcupacao();
    var pre = App.ui.preBox && !ocup[App.ui.preBox] ? App.ui.preBox : null;
    App.ui.preBox = null;
    var R = B.Orc.readonlyVal;

    var opts = '';
    for (var b = 1; b <= Store.data.boxes; b++) {
      var busy = !!ocup[b];
      opts += '<button type="button" class="box-opt ' + (pre === b ? 'on' : '') + '" data-box="' + b + '" ' + (busy ? 'disabled' : '') + ' aria-pressed="' + (pre === b) + '"><strong>Box ' + b + '</strong><span>' + (busy ? 'Em execução' : 'Livre') + '</span></button>';
    }
    var cargas = {};
    Object.keys(ocup).forEach(function (k) { var m = ocup[k].mecanicoId; cargas[m] = (cargas[m] || 0) + 1; });
    var mecOpts = Store.data.mecanicos.map(function (m) { return { value: m.id, label: m.nome + (cargas[m.id] ? ' · ' + cargas[m.id] + (cargas[m.id] > 1 ? ' boxes' : ' box') + ' em execução' : ' · disponível') }; });

    var falta = (orc.pecas || []).filter(function (pc) { var s = Store.peca(pc.pecaId); return !s || s.qtd < pc.qtd; });
    var pecasHtml = (orc.pecas || []).length ? '<section class="card"><div class="card-head"><div class="titles"><h2 class="card-title">Peças que saem do estoque</h2><p class="card-sub">Ao confirmar, estas quantidades são baixadas do estoque.</p></div></div><div class="table-wrap"><table class="tbl"><thead><tr><th>Peça</th><th class="num">Qtd.</th><th class="num">Em estoque</th><th>Situação</th></tr></thead><tbody>' +
      orc.pecas.map(function (pc) { var s = Store.peca(pc.pecaId); var ok = s && s.qtd >= pc.qtd; return '<tr><td>' + esc(pc.nome) + ' <span class="mono muted" style="font-size:11.5px">' + esc(pc.codigo) + '</span></td><td class="num">' + pc.qtd + '</td><td class="num">' + (s ? s.qtd : 0) + '</td><td>' + (ok ? UI.badge('Disponível', 'ok') : UI.badge('Insuficiente', 'dgr')) + '</td></tr>'; }).join('') +
      '</tbody></table></div></section>' : '';

    var html =
      '<div class="page-head"><div class="titles"><h1 class="page-title">Designar box e mecânico</h1><p class="page-sub">Confirme o box e o mecânico responsável antes de iniciar a execução da OS.</p></div></div>' +
      '<section class="card"><div class="card-head"><h2 class="card-title">Ordem de Serviço ' + os.id + '</h2><span class="spacer"></span>' + UI.osBadge('aprovada') + '</div><div class="card-body"><div class="form-grid">' +
        R('Cliente', H.clienteNome(os.clienteId)) + R('Veículo', H.veiculoDesc(v)) + R('Placa', UI.fmtPlaca(v.placa)) + R('Valor do orçamento', UI.moeda(os.valor)) +
      '</div></div></section>' +
      pecasHtml +
      (falta.length ? '<div class="alert dgr"><div><div class="a-title">Estoque insuficiente para iniciar</div>' + falta.map(function (pc) { var s = Store.peca(pc.pecaId); return esc(pc.nome) + ' (precisa ' + pc.qtd + ', há ' + (s ? s.qtd : 0) + ')'; }).join(' · ') + '. Reponha em <a href="#/pecas/alertas" data-route="/pecas/alertas" style="text-decoration:underline">Alertas de estoque</a> e volte para designar.</div></div>' : '') +
      '<div style="display:flex;flex-direction:column;gap:6px"><h2 class="card-title">Escolha o box</h2><p class="card-sub">Somente boxes livres podem receber uma nova OS.</p></div>' +
      '<div class="box-pick" id="dg-boxes" role="group" aria-label="Boxes">' + opts + '</div>' +
      '<div class="field" id="dg-mec-field"><label for="dg-mec">Mecânico responsável</label><select class="select" id="dg-mec" name="mecanico">' + H.options(mecOpts, os.mecanicoId, 'Selecione um mecânico') + '</select></div>' +
      '<div class="row"><span class="spacer"></span><button type="button" class="btn btn-ghost" data-route="/boxes">Cancelar</button><button type="button" class="btn btn-brand" id="dg-ok" ' + (falta.length ? 'disabled' : '') + '>Confirmar designação</button></div>';

    return {
      nav: 'boxes', crumbs: crumbs, title: 'Designar box', html: html,
      mount: function (root) {
        var escolhido = pre;
        root.querySelector('#dg-boxes').addEventListener('click', function (e) {
          var bt = e.target.closest('[data-box]'); if (!bt || bt.disabled) return;
          escolhido = Number(bt.getAttribute('data-box'));
          root.querySelectorAll('[data-box]').forEach(function (x) { var on = x === bt; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); });
        });
        root.querySelector('#dg-ok').addEventListener('click', function () {
          var mec = root.querySelector('#dg-mec').value;
          root.querySelector('#dg-mec-field').classList.toggle('invalid', !mec);
          if (!escolhido) { UI.toast('Escolha um box livre.', 'err'); return; }
          if (!mec) { UI.toast('Selecione o mecânico responsável.', 'err'); root.querySelector('#dg-mec').focus(); return; }
          if (Store.boxOcupacao()[escolhido]) { UI.toast('O Box ' + escolhido + ' acabou de ser ocupado. Escolha outro.', 'err'); App.refresh(); return; }
          var now = new Date().toISOString();
          os.status = 'execucao'; os.inicio = now; os.box = escolhido; os.mecanicoId = mec;
          if (!os.estoqueBaixado) {
            (orc.pecas || []).forEach(function (pc) {
              var s = Store.peca(pc.pecaId);
              if (s) { s.qtd = Math.max(0, s.qtd - pc.qtd); Store.addMovimento(s.id, 'saida', pc.qtd, os.id, 'Baixa para ' + os.id); }
            });
            os.estoqueBaixado = true;
          }
          Store.save();
          App.success({ nav: 'boxes', crumbs: CRUMBS.concat([{ label: os.id }]), title: 'Box designado com sucesso!', code: 'Box ' + escolhido + ' · ' + os.id,
            msg: 'A OS entrou em execução com ' + Store.mecanicoNome(mec) + '. O tempo no box começou a contar.',
            actions: [{ label: 'Voltar à Agenda dos boxes', route: '/boxes' }, { label: 'Ver ordem de serviço', route: '/ordens/' + os.id }] });
        });
      }
    };
  });

  /* ---------- Concluir serviço ---------- */
  App.route('/boxes/concluir/:box', function (p) {
    var box = Number(p.box);
    var os = Store.boxOcupacao()[box];
    var crumbs = CRUMBS.concat([{ label: 'Concluir serviço' }]);
    if (!os) return { nav: 'boxes', crumbs: crumbs, html: '<div class="alert info"><div><div class="a-title">O Box ' + esc(p.box) + ' está livre</div>Não há serviço em execução neste box. <a href="#/boxes" data-route="/boxes" style="text-decoration:underline">Voltar à Agenda dos boxes</a>.</div></div>' };
    var v = Store.veiculo(os.veiculoId), R = B.Orc.readonlyVal;
    var html =
      '<div class="page-head"><div class="titles"><h1 class="page-title">Concluir serviço</h1><p class="page-sub">Registre a conclusão do serviço e libere o box para novas designações.</p></div></div>' +
      '<section class="card"><div class="card-head"><h2 class="card-title">Box ' + box + ' · ' + os.id + '</h2><span class="spacer"></span>' + UI.badge('Em execução', 'warn no-dot') + '</div><div class="card-body"><div class="form-grid">' +
        R('Veículo', H.veiculoDesc(v)) + R('Placa', UI.fmtPlaca(v.placa)) + R('Mecânico responsável', Store.mecanicoNome(os.mecanicoId)) + R('Iniciado às', UI.hora(os.inicio) + (UI.mesmoDia(os.inicio) ? '' : ' de ' + UI.data(os.inicio))) +
      '</div></div><div class="card-foot" style="justify-content:space-between"><span style="font-weight:500">Tempo no box</span><strong id="cc-tempo" class="num">' + UI.duracao(UI.minutosEntre(os.inicio)) + '</strong></div></section>' +
      '<div class="note">Ao concluir, o veículo sai do box e o tempo de permanência é registrado no histórico do veículo.</div>' +
      '<div class="row"><span class="spacer"></span><button type="button" class="btn btn-ghost" data-route="/boxes">Cancelar</button><button type="button" class="btn btn-go" id="cc-ok">Confirmar conclusão</button></div>';
    return {
      nav: 'boxes', crumbs: crumbs, title: 'Concluir serviço', html: html,
      mount: function (root) {
        App.timers.push(setInterval(function () { var el = root.querySelector('#cc-tempo'); if (el) el.textContent = UI.duracao(UI.minutosEntre(os.inicio)); }, 30000));
        root.querySelector('#cc-ok').addEventListener('click', function () {
          var now = new Date().toISOString();
          os.status = 'finalizada'; os.fechamento = now; os.tempoBoxMin = UI.minutosEntre(os.inicio, now);
          Store.save();
          App.success({ nav: 'boxes', crumbs: CRUMBS.concat([{ label: os.id }]), title: 'Serviço concluído com sucesso!', code: 'Box ' + box + ' · ' + os.id,
            msg: 'Box ' + box + ' liberado depois de ' + UI.duracao(os.tempoBoxMin) + '. O veículo já aparece em “Prontos para retirada” no Painel.',
            actions: [{ label: 'Voltar à Agenda dos boxes', route: '/boxes' }, { label: 'Ir para o Painel', route: '/painel' }] });
        });
      }
    };
  });
})();
