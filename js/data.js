/* ==========================================================================
   Bancada — camada de dados
   Tudo fica no localStorage do navegador (chave "bancada.db").
   Na primeira abertura o sistema é preenchido com dados de exemplo
   da Oficina Antônio Motores; "Restaurar dados de exemplo" volta a esse estado.
   ========================================================================== */
(function () {
  'use strict';

  var DB_KEY = 'bancada.db';
  var SESSION_KEY = 'bancada.sessao';
  var SEED_VERSION = 3;

  /* ---------- utilidades de tempo para os dados de exemplo ---------- */
  var MIN = 60000;
  function iso(t) { return new Date(t).toISOString(); }
  function ago(d, h, m) { return iso(Date.now() - (((d || 0) * 24 + (h || 0)) * 60 + (m || 0)) * MIN); }
  function at(dateStr) { return new Date(dateStr).toISOString(); }
  function plus(isoStr, h, m) { return iso(new Date(isoStr).getTime() + ((h || 0) * 60 + (m || 0)) * MIN); }

  function createSeed() {
    var funcionarios = [
      { matricula: 'FUNC-0142', nome: 'Marina Cardoso', cargo: 'Secretária', senha: '1234' },
      { matricula: 'FUNC-0201', nome: 'Renan Souza', cargo: 'Mecânico', senha: '1234' }
    ];

    var mecanicos = [
      { id: 'm1', nome: 'Renan Souza' },
      { id: 'm2', nome: 'Jocimar Ferreira' },
      { id: 'm3', nome: 'Luís Henrique Prado' }
    ];

    function cli(id, nome, cpf, nasc, tel, email, contato, end, desde, obs) {
      return {
        id: id, nome: nome, cpf: cpf, nascimento: nasc, telefone: tel, email: email,
        contatoPreferido: contato,
        cep: end[0], logradouro: end[1], numero: end[2], complemento: end[3] || '',
        bairro: end[4], cidade: end[5] || 'Porto Velho', uf: end[6] || 'RO',
        observacoes: obs || '', criadoEm: desde, historico: []
      };
    }

    var clientes = [
      cli('c1', 'Carlos Eduardo Souza', '526.018.159-06', '1985-04-22', '(69) 99214-5580', 'carlos.souza@email.com', 'WhatsApp',
        ['76820-408', 'Avenida Jorge Teixeira', '2.310', '', 'Embratel'], at('2024-02-08T10:00:00'), ''),
      cli('c2', 'Antônio Ribeiro Sales', '472.108.559-12', '1968-07-12', '(69) 99107-3388', 'antonio.sales68@email.com', 'WhatsApp',
        ['76804-120', 'Rua Duque de Caxias', '1.482', 'Fundos', 'Nossa Senhora das Graças'], at('2023-03-14T09:30:00'), 'Prefere ser avisado depois das 17 h.'),
      cli('c3', 'Joana Barros Lima', '083.016.613-05', '1990-11-03', '(69) 98412-7731', 'joana.lima@email.com', 'Ligação',
        ['76803-610', 'Rua Almirante Barroso', '915', 'Apto 302', 'Centro'], at('2022-09-19T14:10:00')),
      cli('c4', 'Marcos Vinícius Prado', '186.091.390-34', '1979-02-15', '(69) 99230-1189', 'marcos.prado@email.com', 'WhatsApp',
        ['76824-262', 'Rua Rafael Vaz e Silva', '3.020', '', 'Liberdade'], at('2024-06-03T08:40:00')),
      cli('c5', 'Célia Fernandes Nogueira', '996.030.824-30', '1972-08-30', '(69) 98877-4410', 'celia.nogueira@email.com', 'Ligação',
        ['76829-500', 'Avenida Calama', '4.871', 'Galpão 2', 'Flodoaldo Pontes Pinto'], at('2021-05-11T11:20:00'), 'Veículo de trabalho. Pede orçamento por escrito.'),
      cli('c6', 'Rafael Alves Duarte', '628.194.821-12', '1996-12-09', '(69) 99901-2287', 'rafael.duarte@email.com', 'WhatsApp',
        ['76808-090', 'Rua Getúlio Vargas', '640', '', 'São Cristóvão'], at('2025-01-27T16:00:00')),
      cli('c7', 'Ana Paula Ribeiro', '993.518.190-19', '1988-05-17', '(69) 98123-6654', 'anapaula.ribeiro@email.com', 'WhatsApp',
        ['76812-332', 'Rua Joaquim Nabuco', '2.205', 'Casa B', 'Pedrinhas'], at('2023-10-02T09:00:00')),
      cli('c8', 'Eduardo Matias', '937.865.797-41', '1983-03-25', '(69) 99345-0021', 'eduardo.matias@email.com', 'E-mail',
        ['76801-059', 'Avenida Sete de Setembro', '1.120', 'Sala 4', 'Centro'], at('2024-11-21T10:30:00')),
      cli('c9', 'Sandra Peixoto', '543.231.948-97', '1975-09-14', '(69) 98456-7712', 'sandra.peixoto@email.com', 'WhatsApp',
        ['76820-866', 'Rua Abunã', '2.744', '', 'Embratel'], at('2022-04-06T15:45:00')),
      cli('c10', 'Maria Silva', '757.491.186-06', '1981-01-30', '(11) 98745-3210', 'maria.silva@email.com', 'WhatsApp',
        ['76804-226', 'Rua Prudente de Moraes', '388', '', 'Nossa Senhora das Graças'], at('2023-07-18T13:00:00')),
      cli('c11', 'João Oliveira', '252.760.189-87', '1993-06-21', '(69) 99654-1020', 'joao.oliveira@email.com', 'Ligação',
        ['76813-584', 'Rua Jatuarana', '5.010', '', 'Nova Floresta'], at('2025-03-09T09:10:00')),
      cli('c12', 'Bruno Silva', '555.979.711-15', '1999-10-04', '(69) 98321-4477', 'bruno.silva@email.com', 'WhatsApp',
        ['76808-510', 'Rua Elias Gorayeb', '1.731', '', 'Liberdade'], at('2025-08-14T17:20:00')),
      cli('c13', 'Camila Oliveira', '471.049.746-01', '1991-04-12', '(69) 99112-9034', 'camila.oliveira@email.com', 'WhatsApp',
        ['76820-120', 'Rua Tenreiro Aranha', '2.090', 'Apto 51', 'Olaria'], at('2024-03-27T08:15:00')),
      cli('c14', 'Pedro Almeida', '507.529.170-80', '1986-07-08', '(69) 98765-0099', 'pedro.almeida@email.com', 'SMS',
        ['76801-470', 'Rua Dom Pedro II', '760', '', 'Caiari'], at('2024-08-30T11:45:00')),
      cli('c15', 'Rafael Antunes', '342.366.712-55', '1977-11-19', '(69) 99287-6612', 'rafael.antunes@email.com', 'WhatsApp',
        ['76812-100', 'Rua José Bonifácio', '1.505', '', 'Mato Grosso'], at('2025-05-22T14:30:00')),
      cli('c16', 'Beatriz Santos', '768.426.846-50', '1994-02-02', '(69) 98543-2201', 'beatriz.santos@email.com', 'WhatsApp',
        ['76824-016', 'Avenida Pinheiro Machado', '2.980', '', 'São Cristóvão'], at('2025-02-11T10:05:00')),
      cli('c17', 'Fernanda Lima', '563.212.233-60', '1989-12-27', '(69) 99876-5543', 'fernanda.lima@email.com', 'Ligação',
        ['76820-736', 'Rua Afonso Pena', '415', '', 'Centro'], at('2024-12-05T09:50:00'))
    ];

    function vei(id, clienteId, marca, modelo, versao, ano, cor, placa, km) {
      return { id: id, clienteId: clienteId, marca: marca, modelo: modelo, versao: versao, ano: ano, cor: cor, placa: placa, km: km };
    }
    var veiculos = [
      vei('v1', 'c1', 'Honda', 'Civic', 'Sedan LXS 1.8 16V', 2018, 'Prata', 'QHP5F82', 84230),
      vei('v2', 'c2', 'Fiat', 'Strada', 'Freedom 1.3', 2021, 'Branco', 'RTA4C21', 63900),
      vei('v3', 'c2', 'Fiat', 'Uno', 'Way 1.0', 2015, 'Prata', 'NBH9E44', 158740),
      vei('v4', 'c3', 'Honda', 'Civic', 'EXL 2.0', 2019, 'Preto', 'NDF7J09', 71200),
      vei('v5', 'c4', 'Volkswagen', 'Saveiro', '1.6 Robust', 2020, 'Branco', 'OHK2B55', 98450),
      vei('v6', 'c5', 'Toyota', 'Hilux', 'SRV 2.8', 2020, 'Cinza', 'PQD8H41', 132900),
      vei('v7', 'c6', 'Chevrolet', 'Onix', 'LT 1.0', 2022, 'Vermelho', 'MTB5C07', 38700),
      vei('v8', 'c7', 'Fiat', 'Argo', 'Drive 1.3', 2021, 'Branco', 'RFT3B12', 45210),
      vei('v9', 'c8', 'Volkswagen', 'Gol', '1.0', 2019, 'Prata', 'JKR1F88', 88120),
      vei('v10', 'c9', 'Hyundai', 'HB20', 'Sense 1.0', 2020, 'Branco', 'GWT3A12', 61340),
      vei('v11', 'c10', 'Chevrolet', 'Onix', '1.0 Turbo', 2023, 'Azul', 'BRA2E19', 22150),
      vei('v12', 'c10', 'Toyota', 'Corolla Cross', 'XRE 2.0', 2024, 'Prata', 'SPO8J32', 18300),
      vei('v13', 'c11', 'Hyundai', 'HB20', '1.6 Comfort', 2018, 'Preto', 'RIO4K57', 92800),
      vei('v14', 'c12', 'Fiat', 'Uno', 'Attractive 1.0', 2018, 'Vermelho', 'FUN1A18', 104500),
      vei('v15', 'c13', 'Honda', 'City', 'EX 1.5', 2020, 'Cinza', 'DFG8H91', 56700),
      vei('v16', 'c14', 'Toyota', 'Corolla', 'XEi 2.0', 2019, 'Preto', 'PDA2C19', 87300),
      vei('v17', 'c15', 'Fiat', 'Strada', 'Freedom 1.3', 2021, 'Prata', 'LKM2D19', 49800),
      vei('v18', 'c16', 'Toyota', 'Corolla', 'GLi 2.0', 2022, 'Branco', 'QWE9H88', 31200),
      vei('v19', 'c17', 'Chevrolet', 'Onix', 'Plus 1.0', 2022, 'Prata', 'JKR8B45', 40100)
    ];

    var distribuidoras = [
      { id: 'd1', nome: 'Distribuidora Nova Era', cnpj: '39.825.979/0001-72', telefone: '(11) 98765-4321', email: 'vendas@novaera.com.br', contatoPreferido: 'WhatsApp', cep: '76804-120', logradouro: 'Rua Duque de Caxias', numero: '1.482', complemento: 'Galpão', bairro: 'Nossa Senhora das Graças', cidade: 'Porto Velho', uf: 'RO', observacoes: 'Não atendem na segunda.', ultimoPedido: at('2026-07-12T10:00:00'), criadoEm: at('2023-01-10T09:00:00') },
      { id: 'd2', nome: 'Solar Distribuidora', cnpj: '19.074.833/0001-25', telefone: '(21) 93456-7890', email: 'pedidos@solardistribuidora.com.br', contatoPreferido: 'E-mail', cep: '76820-000', logradouro: 'Avenida Jorge Teixeira', numero: '5.400', complemento: '', bairro: 'Embratel', cidade: 'Porto Velho', uf: 'RO', observacoes: 'Entrega em até 2 dias úteis.', ultimoPedido: at('2026-08-03T10:00:00'), criadoEm: at('2023-04-22T09:00:00') },
      { id: 'd3', nome: 'Mega Supply LTDA', cnpj: '78.876.232/0001-03', telefone: '(31) 97654-3210', email: 'comercial@megasupply.com.br', contatoPreferido: 'Ligação', cep: '30140-071', logradouro: 'Rua da Bahia', numero: '1.900', complemento: '', bairro: 'Lourdes', cidade: 'Belo Horizonte', uf: 'MG', observacoes: '', ultimoPedido: at('2026-06-28T10:00:00'), criadoEm: at('2024-02-01T09:00:00') },
      { id: 'd4', nome: 'Rede Norte Distribuição', cnpj: '86.012.904/0001-52', telefone: '(41) 92345-6789', email: 'atendimento@redenorte.com.br', contatoPreferido: 'WhatsApp', cep: '76829-500', logradouro: 'Avenida Calama', numero: '6.120', complemento: '', bairro: 'Flodoaldo Pontes Pinto', cidade: 'Porto Velho', uf: 'RO', observacoes: 'Principal fornecedor de freios e filtros.', ultimoPedido: at('2026-09-15T10:00:00'), criadoEm: at('2022-11-15T09:00:00') },
      { id: 'd5', nome: 'Central Atacado S.A.', cnpj: '04.796.669/0001-92', telefone: '(51) 98123-4567', email: 'compras@centralatacado.com.br', contatoPreferido: 'E-mail', cep: '90010-000', logradouro: 'Avenida Mauá', numero: '2.010', complemento: '', bairro: 'Centro Histórico', cidade: 'Porto Alegre', uf: 'RS', observacoes: '', ultimoPedido: at('2026-05-01T10:00:00'), criadoEm: at('2024-05-09T09:00:00') },
      { id: 'd6', nome: 'Distribuidora Horizonte', cnpj: '72.510.273/0001-97', telefone: '(85) 91234-5678', email: 'contato@horizonte.com.br', contatoPreferido: 'WhatsApp', cep: '60110-001', logradouro: 'Avenida Santos Dumont', numero: '3.300', complemento: '', bairro: 'Aldeota', cidade: 'Fortaleza', uf: 'CE', observacoes: '', ultimoPedido: at('2026-08-22T10:00:00'), criadoEm: at('2024-09-30T09:00:00') }
    ];

    function pc(id, codigo, nome, categoria, fabricante, distId, qtd, minimo, compra, valor, marca, modelo) {
      return { id: id, codigo: codigo, nome: nome, categoria: categoria, fabricante: fabricante, distribuidoraId: distId, qtd: qtd, minimo: minimo, precoCompra: compra, valor: valor, marcaCarro: marca || 'Universal', modeloCarro: modelo || 'Todos', criadoEm: at('2025-01-15T09:00:00') };
    }
    var pecas = [
      pc('p1', 'PF-2263', 'Pastilha de freio dianteira', 'Freios', 'Fras-le', 'd4', 12, 6, 52.0, 89.9, 'Chevrolet', 'Onix'),
      pc('p2', 'PF-2264', 'Pastilha de freio traseira', 'Freios', 'Bosch', 'd1', 4, 6, 41.0, 74.5),
      pc('p3', 'OL-2028', 'Óleo de motor 5W30 (1 L)', 'Lubrificantes', 'Ipiranga', 'd2', 38, 15, 24.0, 42.0),
      pc('p4', 'AR-1044', 'Filtro de ar do motor', 'Filtros', 'Tecfil', 'd4', 3, 8, 18.5, 36.9),
      pc('p5', 'CO-3310', 'Correia dentada (kit)', 'Motor', 'Gates', 'd3', 9, 4, 128.0, 219.0),
      pc('p6', 'AM-5521', 'Amortecedor dianteiro', 'Suspensão', 'Cofap', 'd5', 0, 4, 190.0, 312.0),
      pc('p7', 'VE-7710', 'Vela de ignição', 'Elétrica', 'NGK', 'd6', 26, 12, 14.0, 28.5),
      pc('p8', 'BA-9001', 'Bateria 60Ah', 'Elétrica', 'Moura', 'd5', 2, 3, 330.0, 489.0),
      pc('p9', 'FO-1180', 'Filtro de óleo', 'Filtros', 'Tecfil', 'd4', 14, 6, 12.0, 25.0),
      pc('p10', 'FL-0402', 'Fluido de freio DOT 4 (500 ml)', 'Freios', 'Bosch', 'd1', 10, 4, 22.0, 39.9),
      pc('p11', 'DF-3020', 'Disco de freio dianteiro (par)', 'Freios', 'Fras-le', 'd4', 5, 2, 180.0, 298.0, 'Fiat', 'Strada'),
      pc('p12', 'AD-0750', 'Aditivo de arrefecimento (1 L)', 'Arrefecimento', 'Paraflu', 'd2', 18, 6, 15.0, 29.9)
    ];
    var pecaById = {};
    pecas.forEach(function (p) { pecaById[p.id] = p; });
    function it(pid, qtd) { var p = pecaById[pid]; return { pecaId: pid, codigo: p.codigo, nome: p.nome, qtd: qtd, valor: p.valor }; }
    function sv(descricao, valor) { return { descricao: descricao, valor: valor }; }

    var orcamentos = [];
    var ordens = [];
    var movimentos = [];

    /* Cria um orçamento (e, quando houver, a OS) a partir de uma descrição compacta. */
    function mk(o) {
      var orc = {
        id: o.id, clienteId: o.c, veiculoId: o.v, km: o.km, contato: o.contato || '',
        obs: o.obs || '', formato: o.formato || 'itens', valorFixo: o.valorFixo || 0,
        servicos: o.servicos || [], pecas: o.pecas || [], mecanicoId: o.mec || '',
        status: o.status, criadoEm: o.criado, criadoPor: 'Marina Cardoso',
        orcadaEm: o.orcada || null, aprovadoEm: o.aprovado || null,
        recusadoEm: o.recusado || null, motivoRecusa: o.motivo || '', reabertoEm: null,
        osId: o.os ? o.os.id : null
      };
      orc.atualizadoEm = orc.aprovadoEm || orc.recusadoEm || orc.orcadaEm || orc.criadoEm;
      orcamentos.push(orc);
      if (o.os) {
        var total = orcTotal(orc);
        var os = {
          id: o.os.id, orcamentoId: orc.id, clienteId: o.c, veiculoId: o.v,
          status: o.os.status, abertura: orc.aprovadoEm, inicio: o.os.inicio || null,
          fechamento: o.os.fim || null, box: o.os.box || null,
          mecanicoId: o.os.mec || orc.mecanicoId, funcionario: 'Marina Cardoso', valor: total,
          tempoBoxMin: o.os.inicio && o.os.fim ? Math.round((new Date(o.os.fim) - new Date(o.os.inicio)) / MIN) : null,
          retiradoEm: o.os.retirado || null, retiradoPor: o.os.retiradoPor || '',
          estoqueBaixado: !!o.os.inicio
        };
        ordens.push(os);
        if (os.inicio) {
          orc.pecas.forEach(function (p) {
            movimentos.push({ id: 'mv' + movimentos.length, pecaId: p.pecaId, tipo: 'saida', qtd: p.qtd, data: os.inicio, ref: os.id, obs: 'Baixa para ' + os.id });
          });
        }
      }
    }

    var obsCarlos = 'Cliente relatou barulho metálico persistente ao passar por irregularidades. Recomenda-se checar também buchas da bandeja superior esquerda e terminal de direção.';

    // Histórico antigo
    mk({ id: 'ORC-0967', c: 'c2', v: 'v2', km: 54310, contato: '(69) 99107-3388 (WhatsApp)', obs: 'Embreagem patinando em subidas e pedal alto.',
      servicos: [sv('Troca do kit de embreagem (peças inclusas)', 1900), sv('Regulagem do pedal e do cabo', 250)], mec: 'm2', status: 'aprovada',
      criado: at('2025-11-12T09:20:00'), orcada: at('2025-11-12T15:10:00'), aprovado: at('2025-11-12T17:30:00'),
      os: { id: 'OS-0102', status: 'finalizada', inicio: at('2025-11-13T08:10:00'), fim: at('2025-11-14T16:30:00'), box: 3, mec: 'm2', retirado: at('2025-11-14T17:40:00'), retiradoPor: 'Antônio Ribeiro Sales' } });
    mk({ id: 'ORC-1012', c: 'c2', v: 'v2', km: 62480, contato: '(69) 99107-3388 (WhatsApp)', obs: 'Cliente relatou barulho metálico ao frear e vibração no volante em velocidades acima de 60 km/h.',
      servicos: [sv('Troca de pastilhas de freio dianteiras', 420), sv('Retífica dos discos de freio', 260), sv('Balanceamento das rodas dianteiras', 80)],
      pecas: [it('p1', 2), it('p10', 1)], mec: 'm1', status: 'aprovada',
      criado: at('2026-08-26T08:05:00'), orcada: at('2026-08-26T09:00:00'), aprovado: at('2026-08-26T09:40:00'),
      os: { id: 'OS-0168', status: 'finalizada', inicio: at('2026-08-26T10:30:00'), fim: at('2026-08-26T17:20:00'), box: 2, mec: 'm1', retirado: at('2026-08-27T08:40:00'), retiradoPor: 'Antônio Ribeiro Sales' } });

    // Últimas semanas
    var t;
    t = ago(22, 3);
    mk({ id: 'ORC-1020', c: 'c10', v: 'v11', km: 20010, contato: '(11) 98745-3210 (WhatsApp)', obs: 'Revisão programada de 20.000 km.',
      servicos: [sv('Revisão de 20.000 km', 380)], pecas: [it('p3', 4), it('p9', 1)], mec: 'm3', status: 'aprovada',
      criado: t, orcada: plus(t, 1), aprovado: plus(t, 2),
      os: { id: 'OS-0172', status: 'finalizada', inicio: plus(t, 3), fim: plus(t, 7), box: 2, mec: 'm3', retirado: plus(t, 26), retiradoPor: 'Maria Silva' } });
    t = ago(16, 5);
    mk({ id: 'ORC-1021', c: 'c2', v: 'v3', km: 158600, contato: '(69) 99107-3388 (WhatsApp)', obs: 'Motor aquecendo no trânsito.',
      servicos: [sv('Troca do radiador', 690), sv('Mão de obra de arrefecimento', 180)], mec: 'm2', status: 'recusada',
      criado: t, orcada: plus(t, 3), recusado: plus(t, 26), motivo: 'Valor acima do esperado pelo cliente.' });
    t = ago(10, 4);
    mk({ id: 'ORC-1022', c: 'c16', v: 'v18', km: 31150, contato: '(69) 98543-2201 (WhatsApp)', obs: 'Troca de óleo e alinhamento.',
      servicos: [sv('Troca de óleo e filtro', 90), sv('Alinhamento e balanceamento', 120)], pecas: [it('p3', 4), it('p9', 1)], mec: 'm1', status: 'aprovada',
      criado: t, orcada: plus(t, 1), aprovado: plus(t, 1, 30),
      os: { id: 'OS-0175', status: 'finalizada', inicio: plus(t, 2), fim: plus(t, 5), box: 1, mec: 'm1', retirado: plus(t, 30), retiradoPor: 'Beatriz Santos' } });
    t = ago(6, 6);
    mk({ id: 'ORC-1023', c: 'c14', v: 'v16', km: 87250, contato: '(69) 98765-0099 (SMS)', obs: 'Batida seca na suspensão dianteira.',
      servicos: [sv('Troca do kit de suspensão dianteira', 1180), sv('Alinhamento e balanceamento', 120), sv('Mão de obra de suspensão', 340)], mec: 'm3', status: 'recusada',
      criado: t, orcada: plus(t, 2), recusado: plus(t, 20), motivo: 'Cliente vai providenciar as peças por conta própria.' });
    t = ago(5, 3);
    mk({ id: 'ORC-1024', c: 'c10', v: 'v12', km: 18300, contato: '(11) 98745-3210 (WhatsApp)', obs: 'Revisão de 20.000 km e cheiro forte no ar-condicionado.',
      servicos: [sv('Revisão de 20.000 km', 420), sv('Higienização do ar-condicionado', 160)], pecas: [it('p3', 5), it('p9', 1), it('p4', 1)], mec: 'm2', status: 'aprovada',
      criado: t, orcada: plus(t, 2), aprovado: plus(t, 4),
      os: { id: 'OS-0178', status: 'finalizada', inicio: plus(t, 20), fim: plus(t, 45), box: 5, mec: 'm2' } });
    t = ago(4, 2);
    mk({ id: 'ORC-1025', c: 'c12', v: 'v14', km: 104500, contato: '(69) 98321-4477 (WhatsApp)', obs: 'Carro não dá partida pela manhã.',
      servicos: [sv('Diagnóstico elétrico', 120), sv('Troca do motor de partida', 200)], mec: 'm1', status: 'recusada',
      criado: t, orcada: plus(t, 2), recusado: plus(t, 24), motivo: 'Cliente optou por fazer o serviço em outra oficina.' });
    t = ago(3, 6);
    mk({ id: 'ORC-1026', c: 'c9', v: 'v10', km: 61340, contato: '(69) 98456-7712 (WhatsApp)', obs: 'Falhas na aceleração e consumo alto.',
      servicos: [sv('Troca das velas e cabos', 140), sv('Limpeza dos bicos injetores', 180)], pecas: [it('p7', 4)], mec: 'm3', status: 'aprovada',
      criado: t, orcada: plus(t, 2), aprovado: plus(t, 3),
      os: { id: 'OS-0180', status: 'finalizada', inicio: plus(t, 22), fim: plus(t, 27, 20), box: 2, mec: 'm3' } });
    t = ago(2, 9);
    mk({ id: 'ORC-1027', c: 'c8', v: 'v9', km: 88120, contato: '(69) 99345-0021 (E-mail)', obs: 'Troca preventiva da correia dentada.',
      servicos: [sv('Troca da correia dentada', 260), sv('Troca do tensor', 90)], pecas: [it('p5', 1)], mec: 'm1', status: 'aprovada',
      criado: t, orcada: plus(t, 1), aprovado: plus(t, 2),
      os: { id: 'OS-0181', status: 'finalizada', inicio: plus(t, 20), fim: plus(t, 30), box: 1, mec: 'm1' } });

    // Em execução nos boxes
    t = ago(1, 9);
    mk({ id: 'ORC-1028', c: 'c17', v: 'v19', km: 40100, contato: '(69) 99876-5543 (Ligação)', obs: 'Pedal de freio baixo e chiado ao frear.',
      servicos: [sv('Troca de pastilhas dianteiras', 160), sv('Revisão do sistema de freios', 140)], pecas: [it('p1', 1), it('p10', 1)], mec: 'm2', status: 'aprovada',
      criado: t, orcada: plus(t, 2), aprovado: plus(t, 4),
      os: { id: 'OS-0182', status: 'execucao', inicio: ago(0, 6, 10), box: 6, mec: 'm2' } });
    t = ago(1, 7);
    mk({ id: 'ORC-1029', c: 'c13', v: 'v15', km: 56700, contato: '(69) 99112-9034 (WhatsApp)', obs: 'Revisão de 60.000 km.',
      servicos: [sv('Revisão de 60.000 km', 690), sv('Troca do fluido de arrefecimento', 120)], pecas: [it('p12', 3), it('p3', 4), it('p9', 1)], mec: 'm3', status: 'aprovada',
      criado: t, orcada: plus(t, 1), aprovado: plus(t, 3),
      os: { id: 'OS-0183', status: 'execucao', inicio: ago(0, 5, 20), box: 3, mec: 'm3' } });
    t = ago(1, 5);
    mk({ id: 'ORC-1030', c: 'c15', v: 'v17', km: 49800, contato: '(69) 99287-6612 (WhatsApp)', obs: 'Embreagem trepidando ao arrancar.',
      servicos: [sv('Troca do kit de embreagem (peças inclusas)', 1600), sv('Revisão do câmbio', 450)], mec: 'm1', status: 'aprovada',
      criado: t, orcada: plus(t, 1), aprovado: plus(t, 2),
      os: { id: 'OS-0184', status: 'execucao', inicio: ago(0, 3, 5), box: 1, mec: 'm1' } });
    t = ago(1, 3);
    mk({ id: 'ORC-1031', c: 'c3', v: 'v4', km: 71200, contato: '(69) 98412-7731 (Ligação)', obs: 'Embreagem pesada e ruído no volante do motor.',
      servicos: [sv('Troca do kit de embreagem (peças inclusas)', 1950), sv('Retífica do volante do motor', 380), sv('Alinhamento e balanceamento', 120)], mec: 'm2', status: 'aprovada',
      criado: t, orcada: plus(t, 1), aprovado: plus(t, 2),
      os: { id: 'OS-0185', status: 'execucao', inicio: ago(0, 1, 50), box: 4, mec: 'm2' } });

    // Aguardando aprovação do cliente
    mk({ id: 'ORC-1032', c: 'c11', v: 'v13', km: 92800, contato: '(69) 99654-1020 (Ligação)', obs: 'Barulho na traseira em lombadas.',
      servicos: [sv('Troca dos amortecedores traseiros', 520), sv('Troca das buchas da bandeja', 310), sv('Alinhamento e balanceamento', 120)], mec: 'm3', status: 'orcada',
      criado: ago(0, 23), orcada: ago(0, 20) });
    mk({ id: 'ORC-1033', c: 'c5', v: 'v6', km: 132900, contato: '(69) 98877-4410 (Ligação)', obs: 'Perda de potência, fumaça azulada e consumo de óleo acima do normal.',
      servicos: [sv('Retífica parcial do motor', 3900), sv('Troca de juntas e retentores', 780), sv('Substituição da bomba d’água', 630)], mec: 'm2', status: 'orcada',
      criado: ago(2, 8), orcada: ago(2, 6) });
    mk({ id: 'ORC-1034', c: 'c2', v: 'v2', km: 63900, contato: '(69) 99107-3388 (WhatsApp)', obs: 'Revisão de 60.000 km atrasada. Cliente pediu também a troca da correia.',
      servicos: [sv('Revisão de 60.000 km', 450), sv('Alinhamento e balanceamento', 120), sv('Troca da correia dentada', 260)],
      pecas: [it('p3', 4), it('p9', 1), it('p4', 1), it('p5', 1)], mec: 'm1', status: 'orcada',
      criado: ago(1, 6), orcada: ago(1, 4) });

    // Aprovados aguardando box
    mk({ id: 'ORC-1035', c: 'c7', v: 'v8', km: 45210, contato: '(69) 98123-6654 (WhatsApp)', obs: 'Troca de óleo vencida e chiado leve nos freios dianteiros.',
      servicos: [sv('Troca de óleo e filtro', 120), sv('Troca das pastilhas dianteiras', 220)], pecas: [it('p3', 4), it('p9', 1), it('p1', 1)], mec: 'm1', status: 'aprovada',
      criado: ago(0, 9), orcada: ago(0, 7), aprovado: ago(0, 5),
      os: { id: 'OS-0186', status: 'aprovada' } });
    mk({ id: 'ORC-1036', c: 'c4', v: 'v5', km: 98450, contato: '(69) 99230-1189 (WhatsApp)', obs: 'Temperatura oscilando no painel.',
      servicos: [sv('Revisão do sistema de arrefecimento', 180), sv('Troca da válvula termostática', 400)], pecas: [it('p12', 2)], mec: 'm3', status: 'aprovada',
      criado: ago(0, 7), orcada: ago(0, 5), aprovado: ago(0, 3),
      os: { id: 'OS-0187', status: 'aprovada' } });

    // Em aberto (a orçar)
    mk({ id: 'ORC-1037', c: 'c1', v: 'v1', km: 84230, contato: '(69) 99214-5580 (WhatsApp)', obs: obsCarlos, formato: 'fixo', valorFixo: 100,
      servicos: [sv('Troca de óleo do motor', 45), sv('Filtro de óleo', 25), sv('Alinhamento e balanceamento', 80), sv('Troca de pastilhas de freio', 120), sv('Revisão do sistema de arrefecimento', 95), sv('Troca de correia dentada', 180)],
      status: 'aberta', criado: ago(0, 2) });
    mk({ id: 'ORC-1038', c: 'c6', v: 'v7', km: 38700, contato: '(69) 99901-2287 (WhatsApp)', obs: 'Luz de injeção acesa e marcha lenta irregular.', formato: 'itens',
      status: 'aberta', criado: ago(0, 0, 40) });

    // Entradas de estoque de exemplo
    var entradas = [['p3', 24, ago(9, 4), 'd2'], ['p1', 10, ago(15, 2), 'd4'], ['p7', 20, ago(12, 5), 'd6'], ['p9', 12, ago(9, 3), 'd4'], ['p12', 12, ago(7, 1), 'd2']];
    entradas.forEach(function (e) {
      movimentos.push({ id: 'mv' + movimentos.length, pecaId: e[0], tipo: 'entrada', qtd: e[1], data: e[2], ref: e[3], obs: 'Pedido ao fornecedor' });
    });

    return {
      version: SEED_VERSION,
      funcionarios: funcionarios,
      mecanicos: mecanicos,
      clientes: clientes,
      veiculos: veiculos,
      distribuidoras: distribuidoras,
      pecas: pecas,
      orcamentos: orcamentos,
      ordens: ordens,
      movimentos: movimentos,
      boxes: 6,
      seq: { cliente: 100, veiculo: 100, peca: 100, dist: 100, mov: 1000 }
    };
  }

  /* ---------- cálculo de valores ---------- */
  function orcItensTotal(o) {
    var s = 0;
    (o.servicos || []).forEach(function (x) { s += Number(x.valor) || 0; });
    (o.pecas || []).forEach(function (x) { s += (Number(x.valor) || 0) * (Number(x.qtd) || 0); });
    return Math.round(s * 100) / 100;
  }
  function orcTotal(o) {
    var hasItens = (o.servicos && o.servicos.length) || (o.pecas && o.pecas.length);
    return hasItens ? orcItensTotal(o) : (Number(o.valorFixo) || 0);
  }

  /* ---------- Store ---------- */
  var Store = {
    data: null,
    persistent: true,

    load: function () {
      var raw = null;
      try { raw = window.localStorage.getItem(DB_KEY); } catch (e) { this.persistent = false; }
      if (raw) {
        try {
          var parsed = JSON.parse(raw);
          if (parsed && parsed.version === SEED_VERSION) { this.data = parsed; return; }
        } catch (e) { /* dados corrompidos: recria */ }
      }
      this.data = createSeed();
      this.save();
    },
    save: function () {
      try { window.localStorage.setItem(DB_KEY, JSON.stringify(this.data)); this.persistent = true; }
      catch (e) { this.persistent = false; }
    },
    reset: function () { this.data = createSeed(); this.save(); },

    /* sessão */
    getSession: function () {
      var raw = null;
      try { raw = window.sessionStorage.getItem(SESSION_KEY) || window.localStorage.getItem(SESSION_KEY); } catch (e) { raw = null; }
      if (!raw) return this._memSession || null;
      try { return JSON.parse(raw); } catch (e) { return null; }
    },
    setSession: function (s, remember) {
      this._memSession = s;
      try {
        window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
        if (remember) window.localStorage.setItem(SESSION_KEY, JSON.stringify(s));
      } catch (e) { /* mantém em memória */ }
    },
    clearSession: function () {
      this._memSession = null;
      try { window.sessionStorage.removeItem(SESSION_KEY); window.localStorage.removeItem(SESSION_KEY); } catch (e) { /* ignora */ }
    },

    /* busca por id */
    find: function (col, id) {
      var arr = this.data[col] || [];
      for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i];
      return null;
    },
    cliente: function (id) { return this.find('clientes', id); },
    veiculo: function (id) { return this.find('veiculos', id); },
    orcamento: function (id) { return this.find('orcamentos', id); },
    os: function (id) { return this.find('ordens', id); },
    peca: function (id) { return this.find('pecas', id); },
    dist: function (id) { return this.find('distribuidoras', id); },
    mecanico: function (id) { return this.find('mecanicos', id); },
    mecanicoNome: function (id) { var m = this.mecanico(id); return m ? m.nome : ''; },

    veiculosDoCliente: function (cid) { return this.data.veiculos.filter(function (v) { return v.clienteId === cid; }); },
    orcamentosDoCliente: function (cid) { return this.data.orcamentos.filter(function (o) { return o.clienteId === cid; }); },
    ordensDoCliente: function (cid) { return this.data.ordens.filter(function (o) { return o.clienteId === cid; }); },
    orcamentosDoVeiculo: function (vid) { return this.data.orcamentos.filter(function (o) { return o.veiculoId === vid; }); },
    ordensDoVeiculo: function (vid) { return this.data.ordens.filter(function (o) { return o.veiculoId === vid; }); },

    orcTotal: orcTotal,
    orcItensTotal: orcItensTotal,

    nextId: function (kind, prefix) {
      this.data.seq[kind] = (this.data.seq[kind] || 100) + 1;
      return prefix + this.data.seq[kind];
    },
    nextOrcNumero: function () {
      var max = 0;
      this.data.orcamentos.forEach(function (o) { var n = parseInt(o.id.replace(/\D/g, ''), 10); if (n > max) max = n; });
      return 'ORC-' + String(max + 1).padStart(4, '0');
    },
    nextOsNumero: function () {
      var max = 0;
      this.data.ordens.forEach(function (o) { var n = parseInt(o.id.replace(/\D/g, ''), 10); if (n > max) max = n; });
      return 'OS-' + String(max + 1).padStart(4, '0');
    },

    /* boxes: ocupação derivada das OS em execução */
    boxOcupacao: function () {
      var map = {};
      this.data.ordens.forEach(function (o) { if (o.status === 'execucao' && o.box) map[o.box] = o; });
      return map;
    },

    situacaoPeca: function (p) {
      // Regra do protótipo: ao chegar no nível mínimo a peça entra em alerta.
      if (p.qtd <= 0) return 'esgotado';
      if (p.qtd <= p.minimo) return 'baixo';
      return 'disponivel';
    },

    addMovimento: function (pecaId, tipo, qtd, ref, obs) {
      this.data.movimentos.push({ id: this.nextId('mov', 'mv'), pecaId: pecaId, tipo: tipo, qtd: qtd, data: new Date().toISOString(), ref: ref || '', obs: obs || '' });
    }
  };

  window.Bancada = window.Bancada || {};
  window.Bancada.Store = Store;
})();
