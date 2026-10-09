/* Peças e estoque — RF-05: listagem e filtros (US-023), alertas (US-024), cadastro (US-019), detalhes (US-020), edição (US-021) e exclusão (US-022) */
(function () {
  'use strict';
  var B = window.Bancada, Store = B.Store, UI = B.UI, H = B.H, App = B.App, esc = UI.esc, icon = UI.icon;
  var PAGE = 8;
  var CR = [{ label: 'Cadastros' }, { label: 'Peças e estoque', route: '/pecas' }];
  function ui() { return App.ui.pecas || (App.ui.pecas = { q: '', cat: '', forn: '', sit: '', page: 1 }); }
  function distNome(id) { var d = Store.dist(id); return d ? d.nome : '—'; }
  function dateTop() { return '<span class="topbar-date">' + UI.dataExtenso() + '</span>'; }
  function qtyCls(p) { var s = Store.situacaoPeca(p); return s === 'esgotado' ? 'qty-out' : s === 'baixo' ? 'qty-low' : 'qty-ok'; }
  function levelBar(p) {
    var pct = p.minimo ? Math.min(100, Math.round((p.qtd / p.minimo) * 100)) : 100;
    var s = Store.situacaoPeca(p);
    return '<div class="level"><div class="level-bar ' + (s === 'disponivel' ? 'ok' : s === 'esgotado' ? 'dgr' : '') + '"><i style="width:' + pct + '%"></i></div><span class="mono ' + qtyCls(p) + '" style="font-size:12.5px;font-weight:500">' + p.qtd + ' / ' + p.minimo + '</span></div>';
  }
  function emAlerta() {
    return Store.data.pecas.filter(function (p) { return Store.situacaoPeca(p) !== 'disponivel'; })
      .sort(function (a, b) { return (a.qtd / (a.minimo || 1)) - (b.qtd / (b.minimo || 1)); });
  }

  /* reposição de estoque (entrada) */
  function repor(p, onDone) {
    var falta = Math.max(0, p.minimo * 2 - p.qtd);
    UI.modal({
      icon: 'ok', title: 'Repor estoque', text: esc(p.nome) + ' (' + esc(p.codigo) + ') · ' + p.qtd + ' em estoque, mínimo ' + p.minimo + '.',
      body: '<form id="rp-form" class="stack" style="gap:12px" novalidate>' +
        '<div class="form-grid"><div class="field"><label for="rp-qtd">Quantidade recebida</label><input class="input" id="rp-qtd" name="qtd" type="number" min="1" value="' + (falta || p.minimo || 1) + '"></div>' +
        '<div class="field"><label for="rp-preco">Preço de compra (unidade)</label><div class="money"><span>R$</span><input class="input" id="rp-preco" name="preco" data-mask="money" inputmode="decimal" value="' + UI.moneyInput(p.precoCompra) + '"></div></div></div>' +
        '<div class="field"><label for="rp-dist">Distribuidora</label><select class="select" id="rp-dist" name="dist">' + H.options(Store.data.distribuidoras.map(function (d) { return { value: d.id, label: d.nome }; }), p.distribuidoraId) + '</select></div>' +
        '</form>',
      onMount: function (el) { UI.applyMasks(el); },
      actions: [{ label: 'Cancelar' }, { label: 'Registrar entrada', cls: 'btn-go', onClick: function (m) {
        var v = UI.formValues(m.el.querySelector('#rp-form'));
        var q = parseInt(v.qtd, 10);
        if (!(q > 0)) { m.el.querySelector('#rp-qtd').closest('.field').classList.add('invalid'); m.el.querySelector('#rp-qtd').focus(); return false; }
        p.qtd += q;
        var pr = UI.parseMoney(v.preco); if (pr > 0) p.precoCompra = pr;
        var d = Store.dist(v.dist); if (d) d.ultimoPedido = new Date().toISOString();
        Store.addMovimento(p.id, 'entrada', q, v.dist, 'Reposição de estoque');
        Store.save();
        UI.toast(q + ' un. de ' + p.nome + ' adicionadas ao estoque.');
        if (onDone) onDone();
      } }]
    });
  }

  /* ---------------- Lista ---------------- */
  function filtrar() {
    var f = ui(), n = UI.norm(f.q);
    return Store.data.pecas.filter(function (p) {
      if (f.cat && p.categoria !== f.cat) return false;
      if (f.forn && p.distribuidoraId !== f.forn) return false;
      if (f.sit && Store.situacaoPeca(p) !== f.sit) return false;
      if (!n) return true;
      return UI.norm(p.nome).indexOf(n) >= 0 || UI.norm(p.codigo).indexOf(n) >= 0 || UI.norm(p.categoria).indexOf(n) >= 0 || UI.norm(p.fabricante).indexOf(n) >= 0;
    }).sort(function (a, b) { return a.codigo.localeCompare(b.codigo); });
  }

  App.route('/pecas', function () {
    var f = ui();
    var lista = filtrar(), pg = UI.paginate(lista, f.page, PAGE); f.page = pg.page;
    var alertas = emAlerta().length;
    var filtrado = f.q || f.cat || f.forn || f.sit;
    var rows = pg.items.map(function (p) {
      return '<tr class="click" data-route="/pecas/' + p.id + '" tabindex="0"><td class="muted nowrap">' + esc(p.codigo) + '</td>' +
        '<td><div class="t-main">' + esc(p.nome) + '</div><div class="t-sub">' + esc(p.fabricante) + '</div></td><td>' + esc(p.categoria) + '</td><td>' + esc(distNome(p.distribuidoraId)) + '</td>' +
        '<td class="num ' + qtyCls(p) + '">' + p.qtd + '</td><td class="num muted">' + p.minimo + '</td><td class="num nowrap">' + UI.moeda(p.valor) + '</td><td>' + UI.pecaBadge(Store.situacaoPeca(p)) + '</td></tr>';
    }).join('');
    if (!rows) rows = '<tr><td colspan="8"><div class="tbl-empty"><strong>Nenhuma peça encontrada</strong>Nenhuma peça corresponde aos filtros aplicados.<div style="margin-top:12px"><button type="button" class="btn btn-outline sm" id="pc-clear2">Limpar filtros</button></div></div></td></tr>';

    var html =
      '<div class="page-head"><div class="titles"><h1 class="page-title xl">Peças e estoque</h1><p class="page-sub">Consulte, filtre e mantenha o estoque da oficina.</p></div><span class="spacer"></span><div class="actions">' +
        '<button type="button" class="btn btn-outline" data-route="/pecas/alertas">' + icon('alert', 14) + ' Alertas de estoque' + (alertas ? ' <span class="badge warn no-dot" style="padding:0 7px">' + alertas + '</span>' : '') + '</button>' +
        '<button type="button" class="btn btn-outline" data-route="/distribuidoras">' + icon('truck', 14) + ' Distribuidoras</button>' +
        '<button type="button" class="btn btn-brand" data-route="/pecas/nova">' + icon('plus', 14) + ' Cadastrar peça</button></div></div>' +
      '<form class="toolbar" id="pc-filters">' +
        '<label class="search" style="flex:1.4"><span class="ico">' + icon('search', 14) + '</span><span class="sr-only">Buscar</span><input id="pc-q" name="q" type="search" placeholder="Buscar por nome, código ou categoria" value="' + esc(f.q) + '" style="background:var(--bg)"></label>' +
        '<select class="select" name="cat" aria-label="Categoria" style="width:150px">' + H.options(H.categorias, f.cat, 'Categoria') + '</select>' +
        '<select class="select" name="forn" aria-label="Fornecedor" style="width:190px">' + H.options(Store.data.distribuidoras.map(function (d) { return { value: d.id, label: d.nome }; }), f.forn, 'Fornecedor') + '</select>' +
        '<select class="select" name="sit" aria-label="Situação" style="width:140px">' + H.options([{ value: 'disponivel', label: 'Disponível' }, { value: 'baixo', label: 'Estoque baixo' }, { value: 'esgotado', label: 'Esgotado' }], f.sit, 'Situação') + '</select>' +
        '<button type="submit" class="btn btn-primary">Aplicar filtros</button>' +
        '<button type="button" class="btn btn-ghost" id="pc-clear">Limpar</button>' +
      '</form>' +
      (filtrado && lista.length ? '<p class="muted" style="font-size:12.5px;margin-top:-8px">' + lista.length + (lista.length === 1 ? ' peça corresponde' : ' peças correspondem') + ' aos filtros.</p>' : '') +
      '<div class="card tbl-card"><div class="table-wrap"><table class="tbl"><thead><tr><th>Código</th><th>Peça</th><th>Categoria</th><th>Fornecedor</th><th class="num">Qtd.</th><th class="num">Mínimo</th><th class="num">Valor unit.</th><th>Situação</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
      (pg.total ? '<div id="pc-pager">' + UI.pagerHtml(pg, 'peças', { numbers: true }).replace('Mostrando', 'Exibindo') + '</div>' : '');

    return {
      nav: 'pecas', crumbs: CR.slice(0, 1).concat([{ label: 'Peças e estoque' }]), title: 'Peças e estoque', bodyClass: 'tinted', html: html, topRight: dateTop(),
      mount: function (root) {
        var form = root.querySelector('#pc-filters');
        form.addEventListener('submit', function (e) { e.preventDefault(); var v = UI.formValues(form); f.q = v.q; f.cat = v.cat; f.forn = v.forn; f.sit = v.sit; f.page = 1; App.refresh(); });
        function clear() { f.q = ''; f.cat = ''; f.forn = ''; f.sit = ''; f.page = 1; App.refresh(); }
        root.querySelector('#pc-clear').addEventListener('click', clear);
        var c2 = root.querySelector('#pc-clear2'); if (c2) c2.addEventListener('click', clear);
        var pgEl = root.querySelector('#pc-pager');
        if (pgEl) pgEl.addEventListener('click', function (e) { var b = e.target.closest('[data-page]'); if (b && !b.disabled) { f.page = Number(b.getAttribute('data-page')); App.refresh(); } });
        root.querySelectorAll('tr.click').forEach(function (tr) { tr.addEventListener('keydown', function (e) { if (e.key === 'Enter') App.navigate(tr.getAttribute('data-route')); }); });
      }
    };
  });

  /* ---------------- Alertas (US-024) ---------------- */
  App.route('/pecas/alertas', function () {
    var lista = emAlerta();
    var esg = lista.filter(function (p) { return Store.situacaoPeca(p) === 'esgotado'; }).length;
    var rows = lista.map(function (p) {
      return '<tr><td class="muted nowrap">' + esc(p.codigo) + '</td><td class="t-main"><a href="#/pecas/' + p.id + '" data-route="/pecas/' + p.id + '">' + esc(p.nome) + '</a></td><td>' + esc(distNome(p.distribuidoraId)) + '</td><td style="min-width:160px">' + levelBar(p) + '</td><td>' + UI.pecaBadge(Store.situacaoPeca(p)) + '</td><td><button type="button" class="btn btn-outline sm" data-repor="' + p.id + '">Repor estoque</button></td></tr>';
    }).join('') || H.emptyRow(6, 'Nenhuma peça em alerta', 'Todo o estoque está acima do nível mínimo.');
    var html =
      '<div class="page-head"><div class="titles"><h1 class="page-title xl">Alertas de estoque</h1><p class="page-sub">Peças abaixo do nível mínimo definido pela oficina, das mais críticas para as menos.</p></div><span class="spacer"></span><button type="button" class="btn btn-outline" data-route="/pecas">' + icon('back', 14) + ' Voltar ao estoque</button></div>' +
      '<div class="grid grid-3">' +
        '<div class="card kpi" style="--rail:transparent"><span class="kpi-label">Esgotadas</span><span class="kpi-value md" style="color:var(--dgr)">' + esg + '</span><span class="kpi-hint">Sem unidades disponíveis</span></div>' +
        '<div class="card kpi" style="--rail:transparent"><span class="kpi-label">Abaixo do mínimo</span><span class="kpi-value md" style="color:var(--brand)">' + (lista.length - esg) + '</span><span class="kpi-hint">Quantidade no mínimo ou abaixo dele</span></div>' +
        '<div class="card kpi" style="--rail:transparent"><span class="kpi-label">Total em alerta</span><span class="kpi-value md">' + lista.length + '</span><span class="kpi-hint">Peças que exigem reposição</span></div>' +
      '</div>' +
      '<div class="card tbl-card"><div class="table-wrap"><table class="tbl"><thead><tr><th>Código</th><th>Peça</th><th>Fornecedor</th><th>Nível de estoque</th><th>Situação</th><th>Ação</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="card-foot"><span class="muted" style="font-size:12.5px">' + lista.length + (lista.length === 1 ? ' peça em alerta' : ' peças em alerta') + '</span></div></div>';
    return {
      nav: 'pecas', crumbs: CR.concat([{ label: 'Alertas de estoque' }]), title: 'Alertas de estoque', bodyClass: 'tinted', html: html, topRight: dateTop(),
      mount: function (root) {
        root.querySelectorAll('[data-repor]').forEach(function (b) { b.addEventListener('click', function () { repor(Store.peca(b.getAttribute('data-repor')), App.refresh); }); });
      }
    };
  });

  /* ---------------- Cadastro (US-019) ---------------- */
  function sugerirCodigo(nome) {
    var w = UI.norm(nome).replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(function (x) { return x.length > 2; });
    if (!w.length) return '';
    var pre = ((w[0][0] || 'X') + (w[1] ? w[1][0] : (w[0][1] || 'X'))).toUpperCase();
    var n = 1000 + Math.floor(Math.random() * 9000), cod = pre + '-' + n;
    while (Store.data.pecas.some(function (p) { return p.codigo === cod; })) { n = (n + 7) % 9000 + 1000; cod = pre + '-' + n; }
    return cod;
  }
  App.route('/pecas/nova', function () {
    var dists = Store.data.distribuidoras.map(function (d) { return { value: d.id, label: d.nome }; });
    var html =
      '<div class="page-head"><div class="titles"><h1 class="page-title">Peças e estoque</h1><p class="page-sub">Cadastre a peça e a quantidade inicial em estoque.</p></div></div>' +
      '<form id="pf-form" class="stack" novalidate>' +
      '<section class="card"><div class="card-head"><div class="titles"><h2 class="card-title">Peça</h2><p class="card-sub">Informações da peça</p></div></div><div class="card-body"><div class="form-grid">' +
        '<div class="field"><label for="pf-nome">Nome</label><input class="input" id="pf-nome" name="nome" placeholder="Ex.: Pastilha de freio dianteira"></div>' +
        '<div class="field"><label for="pf-codigo">Código</label><input class="input mono" id="pf-codigo" name="codigo" placeholder="Ex.: PF-2263" autocapitalize="characters"><span class="help">Sugerido a partir do nome; pode ser alterado.</span></div>' +
        '<div class="field"><label for="pf-cat">Tipo (categoria)</label><select class="select" id="pf-cat" name="categoria">' + H.options(H.categorias, '', 'Selecione a categoria') + '</select></div>' +
        '<div class="field"><label for="pf-fab">Fabricante</label><input class="input" id="pf-fab" name="fabricante" placeholder="Ex.: Bosch"></div>' +
        '<div class="field"><label for="pf-marca">Para o</label><select class="select" id="pf-marca" name="marcaCarro">' + H.options(['Universal'].concat(Object.keys(H.marcas)), 'Universal') + '</select><span class="help">Marca(s) de carros que trabalha(m) a peça</span></div>' +
        '<div class="field"><label for="pf-modelo">De modelo</label><select class="select" id="pf-modelo" name="modeloCarro"><option value="Todos">Todos</option></select><span class="help">Modelo(s) do carro que a peça se encaixa</span></div>' +
      '</div></div></section>' +
      '<section class="card"><div class="card-head"><div class="titles"><h2 class="card-title">Distribuidora</h2><p class="card-sub">Informações da distribuidora e do estoque inicial</p></div></div><div class="card-body"><div class="form-grid cols-4">' +
        '<div class="field"><label for="pf-dist">Nome</label><select class="select" id="pf-dist" name="distribuidoraId">' + H.options(dists, '', 'Selecione') + '</select><span class="help">A distribuidora já deve estar cadastrada. <a href="#/distribuidoras/nova" data-route="/distribuidoras/nova" style="text-decoration:underline">Cadastrar</a></span></div>' +
        '<div class="field"><label for="pf-qtd">Quantidade de peças</label><input class="input" id="pf-qtd" name="qtd" type="number" min="0" placeholder="0"></div>' +
        '<div class="field"><label for="pf-compra">Preço de compra (unidade)</label><div class="money"><span>R$</span><input class="input" id="pf-compra" name="precoCompra" data-mask="money" inputmode="decimal" placeholder="0,00"></div></div>' +
        '<div class="field"><label for="pf-venda">Preço de venda (unidade)</label><div class="money"><span>R$</span><input class="input" id="pf-venda" name="valor" data-mask="money" inputmode="decimal" placeholder="0,00"></div></div>' +
        '<div class="field"><label for="pf-min">Nível mínimo</label><input class="input" id="pf-min" name="minimo" type="number" min="0" placeholder="Ex.: 4"><span class="help">Abaixo disso a peça entra em alerta.</span></div>' +
      '</div></div></section></form>';
    return {
      nav: 'pecas', crumbs: [{ label: 'Peças e estoque', route: '/pecas' }, { label: 'Cadastrar peças e estoque' }], title: 'Cadastrar peça', html: html,
      after: '<div class="form-bar"><span class="spacer"></span><button type="button" class="btn btn-ghost" data-route="/pecas">Descartar</button><button type="submit" form="pf-form" class="btn btn-primary">Cadastrar</button></div>',
      mount: function (root) {
        var form = root.querySelector('#pf-form');
        var nome = form.querySelector('#pf-nome'), cod = form.querySelector('#pf-codigo'), codTocado = false;
        cod.addEventListener('input', function () { codTocado = true; cod.value = cod.value.toUpperCase(); });
        nome.addEventListener('blur', function () { if (!codTocado && nome.value.trim() && !cod.value) cod.value = sugerirCodigo(nome.value); });
        var marca = form.querySelector('#pf-marca'), modelo = form.querySelector('#pf-modelo');
        marca.addEventListener('change', function () { modelo.innerHTML = H.options(['Todos'].concat(H.marcas[marca.value] || []), 'Todos'); });
        H.trackDirty(form, { message: 'O cadastro da peça ainda não foi concluído.' });
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var v = UI.formValues(form), err = {};
          var codigo = v.codigo.toUpperCase();
          if (!v.nome) err.nome = 'Informe o nome da peça.';
          if (!codigo) err.codigo = 'Informe o código.';
          else if (Store.data.pecas.some(function (p) { return p.codigo === codigo; })) err.codigo = 'Já existe uma peça com este código.';
          if (!v.categoria) err.categoria = 'Selecione a categoria.';
          if (!v.distribuidoraId) err.distribuidoraId = 'Selecione a distribuidora.';
          var qtd = parseInt(v.qtd, 10), min = parseInt(v.minimo, 10);
          if (isNaN(qtd) || qtd < 0) err.qtd = 'Informe a quantidade (pode ser 0).';
          if (isNaN(min) || min < 0) err.minimo = 'Informe o nível mínimo.';
          var compra = UI.parseMoney(v.precoCompra), venda = UI.parseMoney(v.valor);
          if (venda <= 0) err.valor = 'Informe o preço de venda.';
          else if (compra > venda) err.valor = 'O preço de venda está abaixo do preço de compra.';
          if (!UI.showErrors(form, err)) return;
          var p = { id: Store.nextId('peca', 'p'), codigo: codigo, nome: v.nome, categoria: v.categoria, fabricante: v.fabricante || '—', distribuidoraId: v.distribuidoraId, qtd: qtd, minimo: min, precoCompra: compra, valor: venda, marcaCarro: v.marcaCarro, modeloCarro: v.modeloCarro, criadoEm: new Date().toISOString() };
          Store.data.pecas.push(p);
          if (qtd > 0) { Store.addMovimento(p.id, 'entrada', qtd, p.distribuidoraId, 'Estoque inicial'); var d = Store.dist(p.distribuidoraId); if (d) d.ultimoPedido = new Date().toISOString(); }
          Store.save(); App.dirty = null;
          App.success({ nav: 'pecas', crumbs: CR.concat([{ label: codigo }]), title: 'Peça cadastrada com sucesso!', code: codigo,
            msg: p.nome + ' entrou no estoque com ' + qtd + (qtd === 1 ? ' unidade.' : ' unidades.') + (Store.situacaoPeca(p) !== 'disponivel' ? ' A quantidade já está no nível de alerta.' : ''),
            actions: [{ label: 'Ver peça', route: '/pecas/' + p.id }, { label: 'Cadastrar outra peça', route: '/pecas/nova', cls: 'btn-outline' }, { label: 'Voltar ao estoque', route: '/pecas', cls: 'btn-ghost' }] });
        });
      }
    };
  });

  /* ---------------- Detalhes (US-020) e exclusão (US-022) ---------------- */
  App.route('/pecas/:id', function (pr) {
    var p = Store.peca(pr.id);
    if (!p) return { nav: 'pecas', crumbs: CR, bodyClass: 'tinted', html: '<div class="alert warn"><div><div class="a-title">Peça não encontrada</div>Ela pode ter sido excluída. <a href="#/pecas" data-route="/pecas" style="text-decoration:underline">Voltar ao estoque</a>.</div></div>' };
    var s = Store.situacaoPeca(p);
    var faltam = Math.max(0, p.minimo - p.qtd);
    var alerta = s === 'esgotado'
      ? '<div class="alert dgr"><span class="a-dot" style="color:var(--dgr)"></span><div><div class="a-title">Peça esgotada</div>Não há unidades disponíveis e o nível mínimo definido pela oficina é ' + p.minimo + '. Providencie a reposição.</div></div>'
      : s === 'baixo' ? '<div class="alert warn"><span class="a-dot"></span><div><div class="a-title">Estoque abaixo do mínimo</div>Restam ' + p.qtd + (p.qtd === 1 ? ' unidade' : ' unidades') + ' e o nível mínimo definido pela oficina é ' + p.minimo + '. Providencie a reposição.</div></div>' : '';
    var movs = Store.data.movimentos.filter(function (m) { return m.pecaId === p.id; }).sort(function (a, b) { return new Date(b.data) - new Date(a.data); }).slice(0, 6);
    var pct = p.minimo ? Math.min(100, Math.round((p.qtd / (p.minimo * 1.5)) * 100)) : 100;
    var margem = p.precoCompra ? Math.round(((p.valor - p.precoCompra) / p.precoCompra) * 100) : null;
    function kv(k, v) { return '<div class="kv"><span class="k">' + k + '</span><span class="v">' + v + '</span></div>'; }
    var html =
      '<div class="page-head"><div class="titles"><h1 class="page-title xl">' + esc(p.nome) + '</h1><p class="page-sub">Código ' + esc(p.codigo) + ' · ' + esc(p.categoria) + ' · Fornecedor ' + esc(distNome(p.distribuidoraId)) + '</p></div><span class="spacer"></span><div class="actions">' +
        '<button type="button" class="btn btn-outline" data-route="/pecas">' + icon('back', 14) + ' Voltar ao estoque</button>' +
        '<button type="button" class="btn btn-outline" id="pd-repor">Repor estoque</button>' +
        '<button type="button" class="btn btn-primary" data-route="/pecas/' + p.id + '/editar">Editar peça</button>' +
        '<button type="button" class="btn btn-outline-danger" id="pd-excluir">Excluir peça</button></div></div>' +
      alerta +
      '<div class="split">' +
        '<section class="card"><div class="card-head"><h2 class="card-title">Informações da peça</h2></div><div class="card-body"><div class="kv-grid">' +
          kv('Nome da peça', esc(p.nome)) + kv('Código', esc(p.codigo)) +
          kv('Categoria', esc(p.categoria)) + kv('Fornecedor', '<a href="#/distribuidoras/' + p.distribuidoraId + '" data-route="/distribuidoras/' + p.distribuidoraId + '" style="text-decoration:underline">' + esc(distNome(p.distribuidoraId)) + '</a>') +
          kv('Fabricante', esc(p.fabricante)) + kv('Aplicação', esc(p.marcaCarro === 'Universal' ? 'Universal' : p.marcaCarro + ' · ' + p.modeloCarro)) +
          kv('Quantidade disponível', p.qtd + ' un.') + kv('Valor unitário', UI.moeda(p.valor)) +
          kv('Preço de compra', UI.moeda(p.precoCompra) + (margem !== null ? ' <span class="muted" style="font-weight:400;font-size:12px">· margem ' + margem + '%</span>' : '')) + kv('Valor em estoque', UI.moeda(p.qtd * p.valor)) +
          kv('Situação', UI.pecaBadge(s)) + kv('Nível mínimo', p.minimo + ' un.') +
        '</div></div></section>' +
        '<div class="stack">' +
          '<section class="card"><div class="card-head"><h2 class="card-title">Nível de estoque</h2></div><div class="card-body">' +
            '<div class="row" style="align-items:baseline;gap:8px"><span class="mono" style="font-size:30px;font-weight:500;color:' + (s === 'esgotado' ? 'var(--dgr)' : s === 'baixo' ? 'var(--warn)' : 'var(--ok)') + '">' + p.qtd + '</span><span class="muted">de ' + p.minimo + ' (mínimo)</span></div>' +
            '<div class="level-bar ' + (s === 'disponivel' ? 'ok' : s === 'esgotado' ? 'dgr' : '') + '" style="height:7px"><i style="width:' + pct + '%"></i></div>' +
            '<p class="help">' + (faltam ? 'Faltam ' + faltam + (faltam === 1 ? ' unidade' : ' unidades') + ' para atingir o nível mínimo.' : s === 'baixo' ? 'A quantidade está exatamente no nível mínimo.' : 'Estoque acima do nível mínimo.') + '</p>' +
          '</div></section>' +
          '<section class="card"><div class="card-head"><h2 class="card-title">Movimentações recentes</h2></div><div class="card-body">' +
            (movs.length ? '<div class="timeline">' + movs.map(function (m) {
              var lbl = m.tipo === 'entrada' ? 'Entrada' : m.tipo === 'saida' ? 'Saída' : 'Ajuste';
              return '<div class="tl-item"><span class="tl-dot ' + (m.tipo === 'entrada' ? 't-ok' : m.tipo === 'saida' ? 't-dgr' : 't-info') + '"></span><div><div class="tl-title" style="font-weight:500">' + lbl + ' · ' + (m.tipo === 'saida' ? '−' : m.qtd > 0 && m.tipo === 'ajuste' ? '+' : '') + Math.abs(m.qtd) + ' un.</div><div class="tl-sub">' + esc(m.obs) + (m.ref && /^OS-/.test(m.ref) ? '' : m.ref && Store.dist(m.ref) ? ' · ' + esc(Store.dist(m.ref).nome) : '') + ' · ' + UI.dataHora(m.data) + '</div></div></div>';
            }).join('') + '</div>' : '<p class="muted">Nenhuma movimentação registrada.</p>') +
          '</div></section>' +
        '</div>' +
      '</div>';
    return {
      nav: 'pecas', crumbs: CR.concat([{ label: p.codigo }]), title: p.nome, bodyClass: 'tinted', html: html, topRight: dateTop(),
      mount: function (root) {
        root.querySelector('#pd-repor').addEventListener('click', function () { repor(p, App.refresh); });
        root.querySelector('#pd-excluir').addEventListener('click', function () {
          var emUso = Store.data.orcamentos.filter(function (o) {
            if (!(o.pecas || []).some(function (x) { return x.pecaId === p.id; })) return false;
            if (o.status === 'aberta' || o.status === 'orcada') return true;
            var os = o.osId ? Store.os(o.osId) : null;
            return os && os.status === 'aprovada';
          });
          if (emUso.length) {
            UI.modal({ icon: 'dgr', title: 'Esta peça não pode ser excluída agora', text: 'Ela está em orçamentos que ainda vão usar o estoque: <strong>' + emUso.map(function (o) { return o.id; }).join(', ') + '</strong>. Remova a peça desses orçamentos ou conclua os serviços antes de excluir.', actions: [{ label: 'Entendi', cls: 'btn-primary' }] });
            return;
          }
          UI.confirmar({ title: 'Excluir esta peça?', text: 'A peça “' + esc(p.nome) + '” (' + esc(p.codigo) + ') será removida do estoque. Esta ação não pode ser desfeita.', ok: 'Excluir peça',
            onConfirm: function () {
              Store.data.pecas = Store.data.pecas.filter(function (x) { return x.id !== p.id; });
              Store.save();
              App.success({ nav: 'pecas', crumbs: CR.concat([{ label: p.codigo }]), title: 'Peça excluída com sucesso!', code: p.codigo, msg: p.nome + ' foi removida do estoque.',
                actions: [{ label: 'Voltar ao estoque', route: '/pecas' }] });
            } });
        });
      }
    };
  });

  /* ---------------- Edição (US-021) ---------------- */
  App.route('/pecas/:id/editar', function (pr) {
    var p = Store.peca(pr.id);
    if (!p) return { redirect: '/pecas' };
    var dists = Store.data.distribuidoras.map(function (d) { return { value: d.id, label: d.nome }; });
    var html =
      '<div class="page-head"><div class="titles"><h1 class="page-title xl">Editar peça</h1><p class="page-sub">Atualize as informações da peça ' + esc(p.codigo) + '.</p></div><span class="spacer"></span><button type="button" class="btn btn-outline" data-route="/pecas/' + p.id + '">' + icon('back', 14) + ' Voltar à peça</button></div>' +
      '<div class="split">' +
        '<form id="pe-form" class="card" novalidate><div class="card-head"><div class="titles"><h2 class="card-title">Dados da peça</h2><p class="card-sub">Informe nome, código, quantidade, valor unitário e fornecedor.</p></div></div><div class="card-body">' +
          '<div class="form-grid" style="grid-template-columns:minmax(0,2fr) minmax(0,1fr)">' +
            '<div class="field"><label for="pe-nome">Nome da peça</label><input class="input" id="pe-nome" name="nome" value="' + esc(p.nome) + '"></div>' +
            '<div class="field"><label for="pe-cod">Código</label><input class="input mono" id="pe-cod" name="codigo" value="' + esc(p.codigo) + '"></div></div>' +
          '<div class="form-grid">' +
            '<div class="field"><label for="pe-cat">Categoria</label><select class="select" id="pe-cat" name="categoria">' + H.options(H.categorias, p.categoria) + '</select></div>' +
            '<div class="field"><label for="pe-dist">Fornecedor</label><select class="select" id="pe-dist" name="distribuidoraId">' + H.options(dists, p.distribuidoraId) + '</select></div>' +
            '<div class="field"><label for="pe-fab">Fabricante</label><input class="input" id="pe-fab" name="fabricante" value="' + esc(p.fabricante) + '"></div>' +
            '<div class="field"><label for="pe-compra">Preço de compra (unidade)</label><div class="money"><span>R$</span><input class="input" id="pe-compra" name="precoCompra" data-mask="money" value="' + UI.moneyInput(p.precoCompra) + '"></div></div></div>' +
          '<div class="form-grid" style="grid-template-columns:repeat(3,minmax(0,1fr))">' +
            '<div class="field"><label for="pe-qtd">Quantidade disponível</label><input class="input" id="pe-qtd" name="qtd" type="number" min="0" value="' + p.qtd + '"></div>' +
            '<div class="field"><label for="pe-min">Nível mínimo</label><input class="input" id="pe-min" name="minimo" type="number" min="0" value="' + p.minimo + '"></div>' +
            '<div class="field"><label for="pe-val">Valor unitário</label><div class="money"><span>R$</span><input class="input" id="pe-val" name="valor" data-mask="money" value="' + UI.moneyInput(p.valor) + '"></div></div></div>' +
        '</div></form>' +
        '<div class="stack">' +
          '<section class="card"><div class="card-head"><h2 class="card-title">Resumo da peça</h2></div><div class="card-body" style="padding-top:6px;padding-bottom:6px"><div class="kv-list" id="pe-resumo"></div></div></section>' +
          '<div class="alert info"><div><div class="a-title">Alerta de estoque baixo</div>Quando a quantidade disponível chegar ao nível mínimo, a peça passa a aparecer em Alertas de estoque.</div></div>' +
          '<div class="row" style="justify-content:flex-end"><button type="button" class="btn btn-outline" data-route="/pecas/' + p.id + '">Cancelar</button><button type="submit" form="pe-form" class="btn btn-brand">Salvar alterações</button></div>' +
        '</div>' +
      '</div>';
    return {
      nav: 'pecas', crumbs: CR.concat([{ label: p.codigo, route: '/pecas/' + p.id }, { label: 'Editar' }]), title: 'Editar ' + p.codigo, bodyClass: 'tinted', html: html, topRight: dateTop(),
      mount: function (root) {
        var form = root.querySelector('#pe-form');
        function resumo() {
          var v = UI.formValues(form);
          var tmp = { qtd: parseInt(v.qtd, 10) || 0, minimo: parseInt(v.minimo, 10) || 0 };
          root.querySelector('#pe-resumo').innerHTML =
            '<div><span class="k">Código</span><span class="v mono">' + esc(v.codigo.toUpperCase() || '—') + '</span></div>' +
            '<div><span class="k">Categoria</span><span class="v">' + esc(v.categoria) + '</span></div>' +
            '<div><span class="k">Fornecedor</span><span class="v">' + esc(distNome(v.distribuidoraId)) + '</span></div>' +
            '<div><span class="k">Quantidade</span><span class="v">' + tmp.qtd + ' un.</span></div>' +
            '<div><span class="k">Valor unitário</span><span class="v">' + UI.moeda(UI.parseMoney(v.valor)) + '</span></div>' +
            '<div><span class="k">Situação</span><span class="v">' + UI.pecaBadge(Store.situacaoPeca(tmp)) + '</span></div>';
        }
        resumo();
        form.addEventListener('input', resumo); form.addEventListener('change', resumo);
        H.trackDirty(form, { message: 'As alterações da peça ' + p.codigo + ' ainda não foram salvas.' });
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var v = UI.formValues(form), err = {};
          var codigo = v.codigo.toUpperCase();
          if (!v.nome) err.nome = 'Informe o nome da peça.';
          if (!codigo) err.codigo = 'Informe o código.';
          else if (Store.data.pecas.some(function (x) { return x.codigo === codigo && x.id !== p.id; })) err.codigo = 'Já existe outra peça com este código.';
          var qtd = parseInt(v.qtd, 10), min = parseInt(v.minimo, 10);
          if (isNaN(qtd) || qtd < 0) err.qtd = 'Quantidade inválida.';
          if (isNaN(min) || min < 0) err.minimo = 'Nível mínimo inválido.';
          var venda = UI.parseMoney(v.valor), compra = UI.parseMoney(v.precoCompra);
          if (venda <= 0) err.valor = 'Informe o valor unitário.';
          else if (compra > venda) err.valor = 'O valor de venda está abaixo do preço de compra.';
          if (!UI.showErrors(form, err)) return;
          if (qtd !== p.qtd) Store.addMovimento(p.id, 'ajuste', qtd - p.qtd, '', 'Ajuste manual de inventário');
          p.nome = v.nome; p.codigo = codigo; p.categoria = v.categoria; p.distribuidoraId = v.distribuidoraId; p.fabricante = v.fabricante || '—';
          p.qtd = qtd; p.minimo = min; p.valor = venda; p.precoCompra = compra;
          Store.save(); App.dirty = null;
          App.success({ nav: 'pecas', crumbs: CR.concat([{ label: p.codigo }]), title: 'Peça atualizada com sucesso!', code: p.codigo,
            msg: p.nome + ' · ' + p.qtd + ' un. em estoque · situação: ' + UI.PECA_STATUS[Store.situacaoPeca(p)].label.toLowerCase() + '.',
            actions: [{ label: 'Ver peça', route: '/pecas/' + p.id }, { label: 'Voltar ao estoque', route: '/pecas', cls: 'btn-outline' }] });
        });
      }
    };
  });
})();
