/* Funções compartilhadas entre as telas */
(function () {
  'use strict';
  var B = window.Bancada, Store = B.Store, UI = B.UI, esc = UI.esc;

  var H = {
    clienteNome: function (id) { var c = Store.cliente(id); return c ? c.nome : '—'; },
    veiculoNome: function (v) { if (!v) return '—'; return v.marca + ' ' + v.modelo + (v.versao ? ' ' + v.versao : ''); },
    veiculoDesc: function (v) { if (!v) return '—'; return H.veiculoNome(v) + ' (' + v.ano + ')'; },
    veiculoLista: function (v) { if (!v) return '—'; return v.marca + ' ' + v.modelo + (v.versao ? ' ' + v.versao : '') + ' ' + v.ano; },
    servicoPrincipal: function (o) {
      if (!o) return '—';
      if (o.servicos && o.servicos.length) return o.servicos[0].descricao;
      return o.obs ? (o.obs.length > 60 ? o.obs.slice(0, 57) + '…' : o.obs) : 'Avaliação do veículo';
    },
    orcDaOs: function (os) { return os ? Store.orcamento(os.orcamentoId) : null; },

    /* timeline do atendimento (orçamento + OS) */
    timeline: function (orc, os) {
      var ev = [];
      if (orc) {
        ev.push({ t: orc.criadoEm, title: 'Orçamento ' + orc.id + ' criado', sub: 'Registrado por ' + orc.criadoPor + '.', dot: 'brand' });
        if (orc.orcadaEm) ev.push({ t: orc.orcadaEm, title: 'Orçamento ' + orc.id + ' orçado', sub: 'Valor de ' + UI.moeda(Store.orcTotal(orc)) + ' registrado para aprovação do cliente' + (orc.mecanicoId ? ' · mecânico ' + Store.mecanicoNome(orc.mecanicoId) : '') + '.', dot: 'info' });
        if (orc.recusadoEm) ev.push({ t: orc.recusadoEm, title: 'Orçamento recusado', sub: orc.motivoRecusa || 'O cliente não aprovou o orçamento.', dot: 'dgr' });
        if (orc.reabertoEm) ev.push({ t: orc.reabertoEm, title: 'Orçamento reaberto', sub: 'Voltou para ajustes antes de nova apresentação ao cliente.', dot: 'brand' });
        if (orc.aprovadoEm) ev.push({ t: orc.aprovadoEm, title: 'Orçamento aprovado', sub: H.clienteNome(orc.clienteId) + ' aprovou o orçamento ' + orc.id + '.', dot: 'vio' });
      }
      if (os) {
        ev.push({ t: os.abertura, title: 'Ordem de serviço ' + os.id + ' aberta', sub: 'OS criada a partir do orçamento aprovado.', dot: 'ok' });
        if (os.inicio) ev.push({ t: os.inicio, title: 'Designado ao Box ' + os.box + ' · em execução', sub: 'Mecânico responsável: ' + Store.mecanicoNome(os.mecanicoId) + '.', dot: 'warn' });
        if (os.fechamento) ev.push({ t: os.fechamento, title: 'Ordem de serviço finalizada', sub: 'Serviço concluído em ' + UI.duracao(os.tempoBoxMin) + ' no box. Box ' + os.box + ' liberado.', dot: 'vio' });
        if (os.retiradoEm) ev.push({ t: os.retiradoEm, title: 'Veículo entregue ao cliente', sub: 'Retirado por ' + os.retiradoPor + '.', dot: 'ok' });
      }
      ev.sort(function (a, b) { return new Date(a.t) - new Date(b.t); });
      return ev;
    },
    timelineHtml: function (ev) {
      if (!ev.length) return '<p class="muted">Nenhum registro.</p>';
      return '<div class="timeline">' + ev.map(function (e) {
        return '<div class="tl-item"><span class="tl-dot t-' + e.dot + '"></span><div><div class="tl-title">' + esc(e.title) + '</div><div class="tl-sub">' + esc(e.sub) + '</div><div class="tl-time">' + UI.dataHora(e.t) + '</div></div></div>';
      }).join('') + '</div>';
    },

    /* itens (serviços e peças) de um orçamento, em tabela somente leitura */
    itensTabela: function (o) {
      var rows = '';
      (o.servicos || []).forEach(function (s) { rows += '<tr><td>' + esc(s.descricao) + '</td><td class="muted">Serviço</td><td class="num">1</td><td class="num">' + UI.moeda(s.valor) + '</td></tr>'; });
      (o.pecas || []).forEach(function (p) { rows += '<tr><td>' + esc(p.nome) + ' <span class="muted mono" style="font-size:11.5px">' + esc(p.codigo) + '</span></td><td class="muted">Peça</td><td class="num">' + p.qtd + '</td><td class="num">' + UI.moeda(p.qtd * p.valor) + '</td></tr>'; });
      if (!rows) return '';
      return '<div class="table-wrap"><table class="tbl"><thead><tr><th>Item</th><th>Tipo</th><th class="num">Qtd.</th><th class="num">Valor</th></tr></thead><tbody>' + rows +
        '</tbody><tfoot><tr><td colspan="3">Total</td><td class="num">' + UI.moeda(Store.orcItensTotal(o)) + '</td></tr></tfoot></table></div>';
    },

    /* modal de consulta do orçamento / OS */
    consultar: function (o, os) {
      var c = Store.cliente(o.clienteId), v = Store.veiculo(o.veiculoId);
      var body = '<div class="kv-grid" style="margin:6px 0 4px">' +
        '<div class="kv"><span class="k">Cliente</span><span class="v">' + esc(c ? c.nome : '—') + '</span></div>' +
        '<div class="kv"><span class="k">Veículo</span><span class="v">' + esc(H.veiculoDesc(v)) + '</span></div>' +
        '<div class="kv"><span class="k">Placa · Km</span><span class="v">' + esc(UI.fmtPlaca(v ? v.placa : '')) + ' · ' + UI.km(o.km) + '</span></div>' +
        '<div class="kv"><span class="k">Mecânico responsável</span><span class="v">' + esc(Store.mecanicoNome((os && os.mecanicoId) || o.mecanicoId) || 'A definir') + '</span></div>' +
        '</div>' +
        (H.itensTabela(o) || '<div class="note">Orçamento de valor fixo, sem itens detalhados.</div>') +
        '<div class="row" style="justify-content:flex-end;font-size:15px"><span class="muted">Valor total</span><strong class="num">' + UI.moeda(os ? os.valor : Store.orcTotal(o)) + '</strong></div>';
      UI.modal({ wide: true, title: (os ? 'Ordem de serviço ' + os.id : 'Orçamento ' + o.id), body: body, actions: [{ label: 'Fechar', cls: 'btn-primary' }] });
    },

    /* registrar retirada do veículo (cliente chamado no balcão) */
    registrarRetirada: function (os, onDone) {
      var c = Store.cliente(os.clienteId), v = Store.veiculo(os.veiculoId);
      UI.modal({
        icon: 'ok', title: 'Chamar ' + (c ? c.nome.split(' ')[0] : 'cliente') + ' para retirada',
        text: esc(H.veiculoDesc(v)) + ' · <span class="mono">' + esc(UI.fmtPlaca(v.placa)) + '</span> · ' + esc(os.id) + ' finalizada em ' + UI.dataHora(os.fechamento) + '.',
        body: '<div class="kv-list" style="margin-bottom:4px">' +
          '<div><span class="k">Telefone</span><span class="v mono">' + esc(c ? c.telefone : '—') + '</span></div>' +
          '<div><span class="k">Contato preferido</span><span class="v">' + esc(c ? c.contatoPreferido : '—') + '</span></div>' +
          '<div><span class="k">Valor a cobrar</span><span class="v">' + UI.moeda(os.valor) + '</span></div>' +
          '</div>' +
          '<form id="ret-form" class="field"><label for="ret-por">Retirado por</label><input class="input" id="ret-por" name="por" value="' + esc(c ? c.nome : '') + '"><span class="help">Registre quem levou o veículo. A entrega aparece no histórico do veículo.</span></form>',
        actions: [
          { label: 'Ainda não', cls: 'btn-outline' },
          { label: 'Registrar retirada', cls: 'btn-go', onClick: function (m) {
            var por = m.el.querySelector('#ret-por').value.trim();
            if (!por) { m.el.querySelector('#ret-por').focus(); return false; }
            os.retiradoEm = new Date().toISOString();
            os.retiradoPor = por;
            Store.save();
            UI.toast('Retirada registrada · ' + os.id);
            if (onDone) onDone();
          } }
        ]
      });
    },

    /* filtro de data (popover) */
    dateFilterHtml: function (id, f) {
      var on = f && (f.de || f.ate);
      return '<div class="dropdown">' +
        '<button type="button" class="btn btn-outline btn-filter" id="' + id + '-btn" aria-haspopup="true">' + UI.icon('filter', 14) + (on ? 'Data: ' + (f.de ? UI.data(f.de + 'T12:00') : '…') + ' a ' + (f.ate ? UI.data(f.ate + 'T12:00') : '…') : 'Filtrar data') + '</button>' +
        '<div class="dropdown-pop right" id="' + id + '-pop" hidden><form class="dd-form" id="' + id + '-form">' +
          '<div class="field"><label for="' + id + '-de">De</label><input type="date" class="input" id="' + id + '-de" name="de" value="' + esc(f && f.de || '') + '"></div>' +
          '<div class="field"><label for="' + id + '-ate">Até</label><input type="date" class="input" id="' + id + '-ate" name="ate" value="' + esc(f && f.ate || '') + '"></div>' +
          '<div class="row"><button type="button" class="btn btn-ghost sm" data-clear>Limpar</button><span class="spacer"></span><button type="submit" class="btn btn-primary sm">Aplicar</button></div>' +
        '</form></div></div>';
    },
    bindDateFilter: function (root, id, f, onChange) {
      UI.bindDropdown(root, '#' + id + '-btn', '#' + id + '-pop');
      var form = root.querySelector('#' + id + '-form');
      form.addEventListener('submit', function (e) { e.preventDefault(); var v = UI.formValues(form); f.de = v.de; f.ate = v.ate; onChange(); });
      form.querySelector('[data-clear]').addEventListener('click', function () { f.de = ''; f.ate = ''; onChange(); });
    },
    inRange: function (isoStr, f) {
      if (!f || (!f.de && !f.ate)) return true;
      var day = UI.isoDate(new Date(isoStr));
      if (f.de && day < f.de) return false;
      if (f.ate && day > f.ate) return false;
      return true;
    },

    entityPic: function (kind) { return '<div class="entity-pic ' + (kind === 'car' ? 'car' : 'person') + '">' + (kind === 'car' ? UI.CAR_SVG : UI.PERSON_SVG) + '</div>'; },

    emptyRow: function (cols, title, sub) {
      return '<tr><td colspan="' + cols + '"><div class="tbl-empty"><strong>' + esc(title) + '</strong>' + esc(sub || '') + '</div></td></tr>';
    },

    marcas: {
      'Chevrolet': ['Onix', 'Onix Plus', 'Tracker', 'S10', 'Spin', 'Cruze', 'Montana'],
      'Fiat': ['Uno', 'Argo', 'Mobi', 'Strada', 'Toro', 'Cronos', 'Pulse'],
      'Volkswagen': ['Gol', 'Polo', 'Saveiro', 'T-Cross', 'Virtus', 'Nivus', 'Amarok'],
      'Toyota': ['Corolla', 'Corolla Cross', 'Hilux', 'Yaris', 'Etios', 'SW4'],
      'Honda': ['Civic', 'City', 'Fit', 'HR-V', 'WR-V'],
      'Hyundai': ['HB20', 'HB20S', 'Creta', 'Tucson'],
      'Renault': ['Kwid', 'Sandero', 'Logan', 'Duster', 'Oroch'],
      'Ford': ['Ka', 'Ranger', 'EcoSport', 'Territory'],
      'Nissan': ['March', 'Versa', 'Kicks', 'Frontier'],
      'Jeep': ['Renegade', 'Compass', 'Commander'],
      'Peugeot': ['208', '2008', '3008']
    },
    cores: ['Branco', 'Prata', 'Preto', 'Cinza', 'Vermelho', 'Azul', 'Verde', 'Amarelo', 'Marrom', 'Bege', 'Laranja', 'Vinho'],
    categorias: ['Freios', 'Lubrificantes', 'Filtros', 'Motor', 'Suspensão', 'Elétrica', 'Arrefecimento', 'Transmissão', 'Outros'],
    contatos: ['WhatsApp', 'Ligação', 'E-mail', 'SMS'],
    ufs: ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'],

    options: function (list, sel, placeholder) {
      return (placeholder ? '<option value="">' + esc(placeholder) + '</option>' : '') + list.map(function (x) {
        var val = typeof x === 'object' ? x.value : x, lab = typeof x === 'object' ? x.label : x;
        return '<option value="' + esc(val) + '"' + (String(val) === String(sel) ? ' selected' : '') + '>' + esc(lab) + '</option>';
      }).join('');
    },

    /* acompanha alterações de um formulário e marca a tela como "suja" */
    trackDirty: function (form, opts) {
      opts = opts || {};
      var initial = JSON.stringify(UI.formValues(form));
      function check() {
        var now = UI.formValues(form);
        var dirty = JSON.stringify(now) !== initial;
        B.App.dirty = dirty ? { message: opts.message } : null;
        if (opts.onChange) opts.onChange(now, dirty);
      }
      form.addEventListener('input', check);
      form.addEventListener('change', check);
      return { reset: function () { initial = JSON.stringify(UI.formValues(form)); check(); }, check: check };
    }
  };

  B.H = H;
})();
