# Bancada — Gestão de Oficina Mecânica

Implementação funcional, em HTML, CSS e JavaScript puro, do protótipo **Bancada** (Figma "Gestão de Oficina Mecânica") desenvolvido para a disciplina Fábrica de Software I — IFRO, Campus Vilhena.

## Como executar

1. Descompacte a pasta.
2. Abra o arquivo `index.html` em um navegador (Chrome, Edge ou Firefox). Não é necessário servidor nem instalação.
3. Entre com a matrícula **FUNC-0142** e a senha **1234** (perfil Secretária).

> A matrícula **FUNC-0201** (perfil Mecânico) existe para demonstrar a regra de acesso: o sistema recusa a entrada no módulo de Atendimento.

Os dados ficam salvos no `localStorage` do navegador. Na primeira abertura o sistema é preenchido com dados de exemplo da Oficina Antônio Motores. Para voltar ao estado inicial, clique no nome da usuária (canto inferior da barra lateral) › **Restaurar dados de exemplo**.

## Estrutura

```
index.html                 página única (SPA com rotas por hash, ex.: #/orcamentos)
css/styles.css             tokens do Figma (neutros stone, laranja #EA580C) e componentes
fonts/                     Geist e Geist Mono (SIL Open Font License), funcionam sem internet
js/data.js                 camada de dados, dados de exemplo e regras de cálculo
js/ui.js                   formatação, máscaras, validações (CPF, CNPJ, placa), modal, toast, CSV
js/app.js                  roteador, layout (barra lateral + topbar), busca global, login
js/views/*.js              uma tela (ou grupo de telas) por arquivo
```

## Módulos e requisitos cobertos

| Menu | Telas | Referência |
|---|---|---|
| Login | Autenticação da secretária, erro de senha, bloqueio por perfil | US-001 · RF-01 |
| Painel | Indicadores do dia, OS em andamento, prontos para retirada (registro de retirada), agenda dos boxes | — |
| Orçamento | Histórico com busca, filtro de status e de data; montar orçamento; serviços e peças; criar orçada; aprovar (gera OS) ou recusar com motivo; reabrir; histórico de status | US-016, US-018 · RF-02 |
| Ordens de serviço | Listagem por status (aprovada, em execução, finalizada), detalhe, histórico do atendimento, exportação CSV | RF-06, US-27, US-28 |
| Agenda dos boxes | Fila de designação, 6 boxes, designar box e mecânico (baixa automática do estoque), concluir serviço com tempo no box | RF-03 |
| Clientes | Lista, cadastro com validações (CPF, menor de idade, telefone e e-mail repetidos, CEP), perfil com abas, edição com marcação "alterado", motivo para troca de nome e histórico de alterações | US-003, US-004 · RF-01 |
| Veículos | Lista, cadastro, visualização, atualização cadastral, histórico por placa (encontrado, sem histórico, não encontrada) | US-006, US-007, US-011, US-014, US-029 · RF-04 |
| Peças e estoque | Listagem com filtros, alertas de estoque, reposição, cadastro, detalhes com movimentações, edição e exclusão | US-019 a US-024 · RF-05 |
| Distribuidoras | Listagem, cadastro com conflitos (CNPJ, telefone, e-mail), visualização e edição (acesso por Peças e estoque) | — |
| Relatórios | Catálogo de relatórios e Relatório de Ordens de Serviço com filtros, totalizador e exportação | US-012 · RF-05 |

## Regras de negócio implementadas

- O **orçamento vem antes da OS**: aberta → orçada → aprovada (gera a OS) ou recusada.
- Ciclo da OS: aprovada → em execução (ao receber box e mecânico) → finalizada.
- Um box comporta um veículo por vez; boxes ocupados não podem ser escolhidos.
- As peças do orçamento saem do estoque quando o serviço começa no box; o sistema impede o início se faltar peça.
- A peça entra em alerta quando a quantidade chega ao nível mínimo.
- Cliente precisa ser maior de idade; CPF, telefone e e-mail não se repetem.
- Alterações cadastrais do cliente ficam registradas com data, responsável e valores anterior e novo.
