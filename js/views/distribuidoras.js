/* Distribuidoras — listagem, cadastro (com conflitos), visualização e atualização cadastral */
(function () {
  'use strict';
  var B = window.Bancada, Store = B.Store, UI = B.UI, H = B.H, App = B.App, esc = UI.esc, icon = UI.icon;
  var CR = [{ label: 'Distribuidoras', route: '/distribuidoras' }];
  function ui() { return App.ui.dist || (App.ui.dist = { q: '' }); }

  App.route('/distribuidoras', function () {
    var f = ui(), n = UI.norm(f.q), dg = UI.digits(f.q);
    var lista = Store.data.distribuidoras.filter(function (d) {
      if (!n) return true;
      return UI.norm(d.nome).indexOf(n) >= 0 || (dg.length >= 3 && UI.digits(d.cnpj).indexOf(dg) >= 0);
    }).sort(function (a, b) { return a.nome.localeCompare(b.nome); });
    function rowsHtml(arr) {
      return arr.map(function (d) {
        var np = Store.data.pecas.filter(function (p) { return p.distribuidoraId === d.id; }).length;
        return '<tr class="click" data-route="/distribuidoras/' + d.id + '" tabindex="0"><td><div class="t-main" style="font-size:13px">' + esc(d.nome) + '</div><div class="t-sub mono">' + esc(d.cnpj) + '</div></td><td class="mono nowrap">' + esc(d.telefone) + '</td><td>' + esc(d.cidade + '/' + d.uf) + '</td><td class="num">' + np + '</td><td class="nowrap">' + (d.ultimoPedido ? UI.data(d.ultimoPedido) : '—') + '</td></tr>';
      }).join('') || H.emptyRow(5, 'Nenhuma distribuidora encontrada', 'Confira o nome ou CNPJ digitado.');
    }
    var html =
      '<div class="page-head"><div class="titles"><h1 class="page-title">Distribuidoras</h1><p class="page-sub">Distribuidoras cadastradas que fornecem peças para a oficina.</p></div></div>' +
      '<div class="toolbar"><label class="search"><span class="ico">' + icon('search', 14) + '</span><span class="sr-only">Buscar</span><input id="dl-q" type="search" placeholder="Buscar por nº do CNPJ ou nome da distribuidora" value="' + esc(f.q) + '"></label>' +
      '<button type="button" class="btn btn-outline" data-route="/pecas">' + icon('back', 14) + ' Peças e estoque</button><button type="button" class="btn btn-primary" data-route="/distribuidoras/nova">Nova distribuidora</button></div>' +
      '<div class="card tbl-card"><div class="table-wrap"><table class="tbl zebra"><thead><tr><th>Distribuidora</th><th>Contato</th><th>Cidade</th><th class="num">Peças fornecidas</th><th>Último pedido</th></tr></thead><tbody id="dl-rows">' + rowsHtml(lista) + '</tbody></table></div></div>';
    return {
      nav: 'pecas', crumbs: CR.concat([{ label: 'Listagem de distribuidoras' }]), title: 'Distribuidoras', html: html,
      mount: function (root) {
        root.querySelector('#dl-q').addEventListener('input', function (e) {
          f.q = e.target.value;
          var nn = UI.norm(f.q), d2 = UI.digits(f.q);
          root.querySelector('#dl-rows').innerHTML = rowsHtml(Store.data.distribuidoras.filter(function (d) { return !nn || UI.norm(d.nome).indexOf(nn) >= 0 || (d2.length >= 3 && UI.digits(d.cnpj).indexOf(d2) >= 0); }).sort(function (a, b) { return a.nome.localeCompare(b.nome); }));
        });
        root.querySelector('#dl-rows').addEventListener('keydown', function (e) { var tr = e.target.closest('tr.click'); if (tr && e.key === 'Enter') App.navigate(tr.getAttribute('data-route')); });
      }
    };
  });

  function input(name, value, extra, mono) { return '<input class="input ' + (mono ? 'mono' : '') + '" id="df-' + name + '" name="' + name + '" value="' + esc(value || '') + '" ' + (extra || '') + '>'; }
  function fld(name, label, control, help) { return '<div class="field"><label for="df-' + name + '">' + label + '</label>' + control + (help ? '<span class="help">' + help + '</span>' : '') + '</div>'; }
  function distForm(d) {
    d = d || {};
    return '<form id="dist-form" novalidate><div class="grid grid-2" style="align-items:start">' +
      '<section class="card"><div class="card-head"><div class="titles"><h2 class="card-title">Identificação e contato</h2><p class="card-sub">CNPJ, telefone e e-mail não podem se repetir entre distribuidoras.</p></div></div><div class="card-body">' +
        fld('nome', 'Nome / razão social', input('nome', d.nome, 'placeholder="Ex.: Distribuidora Nova Era"')) +
        fld('cnpj', 'CNPJ', input('cnpj', d.cnpj, 'data-mask="cnpj" inputmode="numeric" placeholder="00.000.000/0000-00"', true)) +
        '<div class="form-grid">' + fld('telefone', 'Telefone', input('telefone', d.telefone, 'data-mask="tel" inputmode="tel" placeholder="(69) 90000-0000"', true)) +
        fld('contatoPreferido', 'Contato preferido', '<select class="select" id="df-contatoPreferido" name="contatoPreferido">' + H.options(H.contatos, d.contatoPreferido || 'WhatsApp') + '</select>') + '</div>' +
        fld('email', 'E-mail', input('email', d.email, 'type="email" placeholder="vendas@empresa.com.br"')) +
      '</div></section>' +
      '<section class="card"><div class="card-head"><div class="titles"><h2 class="card-title">Endereço</h2><p class="card-sub">O CEP preenche logradouro, bairro e cidade.</p></div></div><div class="card-body">' +
        '<div class="form-grid">' + fld('cep', 'CEP', input('cep', d.cep, 'data-mask="cep" inputmode="numeric" placeholder="00000-000"', true)) + fld('numero', 'Número', input('numero', d.numero, '', true)) + '</div>' +
        fld('logradouro', 'Logradouro', input('logradouro', d.logradouro)) +
        '<div class="form-grid">' + fld('complemento', 'Complemento <span class="opt">opcional</span>', input('complemento', d.complemento)) + fld('bairro', 'Bairro', input('bairro', d.bairro)) + '</div>' +
        '<div class="form-grid" style="grid-template-columns:minmax(0,1fr) 110px">' + fld('cidade', 'Cidade', input('cidade', d.cidade || 'Porto Velho')) + fld('uf', 'UF', '<select class="select" id="df-uf" name="uf">' + H.options(H.ufs, d.uf || 'RO') + '</select>') + '</div>' +
        fld('observacoes', 'Observações <span class="opt">opcional</span>', '<textarea class="textarea" id="df-observacoes" name="observacoes" rows="2" placeholder="Ex.: Não atendem na segunda.">' + esc(d.observacoes || '') + '</textarea>') +
      '</div></section></div></form>';
  }
  function validar(v, atual) {
    var err = {}, outros = Store.data.distribuidoras.filter(function (x) { return !atual || x.id !== atual.id; });
    if (!v.nome) err.nome = 'Informe o nome da distribuidora.';
    else if (outros.some(function (x) { return UI.norm(x.nome) === UI.norm(v.nome); })) err.nome = 'Já existe uma distribuidora com este nome.';
    if (!UI.validCNPJ(v.cnpj)) err.cnpj = UI.digits(v.cnpj).length === 14 ? 'CNPJ inválido. Confira os dígitos.' : 'Informe os 14 dígitos do CNPJ.';
    else if (outros.some(function (x) { return UI.digits(x.cnpj) === UI.digits(v.cnpj); })) err.cnpj = 'CNPJ já cadastrado!';
    if (UI.digits(v.telefone).length < 10) err.telefone = 'Informe DDD e número.';
    else if (outros.some(function (x) { return UI.digits(x.telefone) === UI.digits(v.telefone); })) err.telefone = 'Número de telefone já cadastrado!';
    if (!UI.validEmail(v.email)) err.email = 'Informe um e-mail válido.';
    else if (outros.some(function (x) { return (x.email || '').toLowerCase() === v.email.toLowerCase(); })) err.email = 'E-mail já cadastrado!';
    if (UI.digits(v.cep).length !== 8) err.cep = 'Informe os 8 dígitos do CEP.';
    if (!v.numero) err.numero = 'Informe o número (ou S/N).';
    if (!v.logradouro) err.logradouro = 'Informe o logradouro.';
    if (!v.bairro) err.bairro = 'Informe o bairro.';
    if (!v.cidade) err.cidade = 'Informe a cidade.';
    return err;
  }
  function bindCep(form) {
    var cep = form.querySelector('#df-cep'), last = UI.digits(cep.value);
    cep.addEventListener('input', function () {
      var d = UI.digits(cep.value); if (d.length !== 8 || d === last) return; last = d;
      UI.buscarCep(d).then(function (r) {
        if (!r) return;
        if (r.logradouro) form.querySelector('#df-logradouro').value = r.logradouro;
        if (r.bairro) form.querySelector('#df-bairro').value = r.bairro;
        if (r.cidade) form.querySelector('#df-cidade').value = r.cidade;
        if (r.uf) form.querySelector('#df-uf').value = r.uf;
        form.querySelector('#df-numero').focus();
      });
    });
  }
  function dados(v) {
    return { nome: v.nome, cnpj: UI.fmtCNPJ(v.cnpj), telefone: UI.fmtTel(v.telefone), email: v.email, contatoPreferido: v.contatoPreferido, cep: UI.fmtCEP(v.cep), numero: v.numero, logradouro: v.logradouro, complemento: v.complemento, bairro: v.bairro, cidade: v.cidade, uf: v.uf, observacoes: v.observacoes };
  }

  App.route('/distribuidoras/nova', function () {
    return {
      nav: 'pecas', crumbs: CR.concat([{ label: 'Cadastro da distribuidora' }]), title: 'Nova distribuidora',
      html: '<div class="page-head"><div class="titles"><h1 class="page-title">Distribuidoras</h1><p class="page-sub">Cadastro da distribuidora</p></div></div>' + distForm(null),
      after: '<div class="form-bar"><span class="spacer"></span><button type="button" class="btn btn-ghost" data-route="/distribuidoras">Descartar</button><button type="submit" form="dist-form" class="btn btn-primary">Cadastrar</button></div>',
      mount: function (root) {
        var form = root.querySelector('#dist-form');
        bindCep(form);
        H.trackDirty(form, { message: 'O cadastro da distribuidora ainda não foi concluído.' });
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var v = UI.formValues(form);
          if (!UI.showErrors(form, validar(v, null))) return;
          var d = dados(v); d.id = Store.nextId('dist', 'd'); d.ultimoPedido = null; d.criadoEm = new Date().toISOString();
          Store.data.distribuidoras.push(d); Store.save(); App.dirty = null;
          App.success({ nav: 'pecas', crumbs: CR.concat([{ label: d.nome }]), title: 'Distribuidora cadastrada com sucesso!', code: d.cnpj,
            msg: d.nome + ' já pode ser escolhida como fornecedora no cadastro de peças.',
            actions: [{ label: 'Ver distribuidora', route: '/distribuidoras/' + d.id }, { label: 'Cadastrar peça', route: '/pecas/nova', cls: 'btn-outline' }, { label: 'Voltar à listagem', route: '/distribuidoras', cls: 'btn-ghost' }] });
        });
      }
    };
  });

  App.route('/distribuidoras/:id', function (p) {
    var d = Store.dist(p.id);
    if (!d) return { nav: 'pecas', crumbs: CR, html: '<div class="alert warn"><div><div class="a-title">Distribuidora não encontrada</div><a href="#/distribuidoras" data-route="/distribuidoras" style="text-decoration:underline">Voltar à listagem</a>.</div></div>' };
    var pecas = Store.data.pecas.filter(function (x) { return x.distribuidoraId === d.id; });
    var pre = '<div class="profile-band"><span class="avatar lg">' + esc(UI.iniciais(d.nome)) + '</span><div class="titles"><h1 class="name">' + esc(d.nome) + '</h1><div class="meta"><span class="mono">CNPJ ' + esc(d.cnpj) + '</span><span>Último pedido ' + (d.ultimoPedido ? UI.data(d.ultimoPedido) : '—') + '</span></div></div><span class="spacer"></span>' +
      '<div class="row"><button type="button" class="btn btn-outline" id="dp-contatar">Contatar</button><button type="button" class="btn btn-primary" data-route="/distribuidoras/' + d.id + '/editar">Editar cadastro</button></div></div>';
    var html = '<div class="grid grid-2" style="align-items:start">' +
      '<section class="card"><div class="card-head"><h2 class="card-title">Identificação e contato</h2></div><div class="card-body" style="padding-top:8px;padding-bottom:8px"><div class="dl">' +
        '<div class="k">Nome completo</div><div>' + esc(d.nome) + '</div><div class="k">CNPJ</div><div class="mono">' + esc(d.cnpj) + '</div>' +
        '<div class="k">Telefone</div><div class="mono">' + esc(d.telefone) + '</div><div class="k">E-mail</div><div>' + esc(d.email) + '</div>' +
        '<div class="k">Contato preferido</div><div>' + esc(d.contatoPreferido) + '</div></div></div></section>' +
      '<section class="card"><div class="card-head"><h2 class="card-title">Endereço</h2></div><div class="card-body" style="padding-top:8px;padding-bottom:8px"><div class="dl">' +
        '<div class="k">CEP</div><div class="mono">' + esc(d.cep) + '</div><div class="k">Logradouro</div><div>' + esc(d.logradouro + (d.numero ? ', ' + d.numero : '')) + '</div>' +
        '<div class="k">Complemento</div><div>' + esc(d.complemento || '—') + '</div><div class="k">Bairro</div><div>' + esc(d.bairro) + '</div>' +
        '<div class="k">Cidade / UF</div><div>' + esc(d.cidade + ' / ' + d.uf) + '</div><div class="k">Observações</div><div class="muted">' + esc(d.observacoes || '—') + '</div></div></div></section></div>' +
      '<section class="card tbl-card"><div class="card-head"><div class="titles"><h2 class="card-title">Peças fornecidas</h2><p class="card-sub">' + pecas.length + (pecas.length === 1 ? ' peça' : ' peças') + ' do estoque vêm desta distribuidora.</p></div></div><div class="table-wrap"><table class="tbl"><thead><tr><th>Código</th><th>Peça</th><th class="num">Qtd.</th><th class="num">Preço de compra</th><th>Situação</th></tr></thead><tbody>' +
        (pecas.map(function (x) { return '<tr class="click" data-route="/pecas/' + x.id + '"><td class="muted">' + esc(x.codigo) + '</td><td class="t-main" style="font-size:13px">' + esc(x.nome) + '</td><td class="num">' + x.qtd + '</td><td class="num">' + UI.moeda(x.precoCompra) + '</td><td>' + UI.pecaBadge(Store.situacaoPeca(x)) + '</td></tr>'; }).join('') || H.emptyRow(5, 'Nenhuma peça vinculada', 'Escolha esta distribuidora ao cadastrar uma peça.')) +
      '</tbody></table></div></section>' +
      '<div class="row"><span class="spacer"></span><button type="button" class="btn btn-ghost" data-route="/distribuidoras">Voltar à listagem</button></div>';
    return {
      nav: 'pecas', crumbs: CR.concat([{ label: 'Distribuidora', route: '/distribuidoras' }, { label: d.nome }]), title: d.nome, pre: pre, html: html,
      mount: function (root) {
        root.querySelector('#dp-contatar').addEventListener('click', function () {
          UI.modal({ icon: 'info', title: 'Contatar ' + d.nome, text: 'Contato preferido: ' + esc(d.contatoPreferido) + '.',
            body: '<div class="kv-list"><div><span class="k">Telefone</span><span class="v mono" style="user-select:all">' + esc(d.telefone) + '</span></div><div><span class="k">E-mail</span><span class="v" style="user-select:all">' + esc(d.email) + '</span></div></div>',
            actions: [{ label: 'Fechar' }, { label: icon('copy', 14) + ' Copiar telefone', cls: 'btn-primary', onClick: function () {
              try { navigator.clipboard.writeText(d.telefone).then(function () { UI.toast('Telefone copiado.'); }, function () { UI.toast('Selecione o número e copie com Ctrl+C.', 'err'); }); } catch (e) { UI.toast('Selecione o número e copie com Ctrl+C.', 'err'); }
            } }] });
        });
      }
    };
  });

  App.route('/distribuidoras/:id/editar', function (p) {
    var d = Store.dist(p.id);
    if (!d) return { redirect: '/distribuidoras' };
    return {
      nav: 'pecas', crumbs: CR.concat([{ label: d.nome, route: '/distribuidoras/' + d.id }, { label: 'Atualização cadastral' }]), title: 'Editar ' + d.nome,
      html: '<div class="page-head"><div class="titles"><h1 class="page-title">Distribuidoras</h1><p class="page-sub">Atualização cadastral de ' + esc(d.nome) + '</p></div></div>' + distForm(d),
      after: '<div class="form-bar"><span class="spacer"></span><button type="button" class="btn btn-ghost" data-route="/distribuidoras/' + d.id + '">Descartar</button><button type="submit" form="dist-form" class="btn btn-primary">Salvar alterações</button></div>',
      mount: function (root) {
        var form = root.querySelector('#dist-form');
        bindCep(form);
        H.trackDirty(form, { message: 'As alterações da distribuidora ainda não foram salvas.' });
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var v = UI.formValues(form);
          if (!UI.showErrors(form, validar(v, d))) return;
          var nd = dados(v); Object.keys(nd).forEach(function (k) { d[k] = nd[k]; });
          Store.save(); App.dirty = null;
          App.success({ nav: 'pecas', crumbs: CR.concat([{ label: d.nome }]), title: 'Distribuidora atualizada com sucesso!', code: d.cnpj, msg: 'Os dados de ' + d.nome + ' foram salvos.',
            actions: [{ label: 'Ver distribuidora', route: '/distribuidoras/' + d.id }, { label: 'Voltar à listagem', route: '/distribuidoras', cls: 'btn-outline' }] });
        });
      }
    };
  });
})();
