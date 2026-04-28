# CheckList DHL / Suzano CD CWB

## Visão geral

Este projeto é uma aplicação front-end para checklist operacional de movimentação de carga, com duas páginas principais:

- `index.html`: formulário de checklist operacional
- `admin.html`: painel de relatórios e visualização dos registros salvos

A aplicação funciona inteiramente no navegador, usando `localStorage` para persistência local.

---

## O que existe no site

### 1) Formulário de checklist (`index.html`)

#### Campos de identificação
- Fluxo: `INBOUND` / `OUTBOUND`
- NF / DT
- Doca
- Motorista
- CPF / CNH
- Transportadora
- Placa Cavalo
- Placa Carreta 1
- Placa Carreta 2

#### Seções do checklist
- **Higiene e Estrutura**
  - Critérios: `Paredes Internas`, `Sem Furos`, `Teto`, `Chão Limpo`, `Sem Odor`, `Sem Pragas`
  - Cada critério tem opção `C` ou `NC`

- **Conferência Técnica de Itens**
  - Campos:
    - Descrição
    - Código
    - Previsto
    - Realizado
    - Falta
    - Sobra
    - Avaria
    - Scrap
    - Av. Int.
    - Total Bons
  - Linha inicial gerada automaticamente
  - Botão para adicionar mais linhas de item
  - Cálculo automático de faltas, sobras e total bons

- **Controle de Paletes (PBR)**
  - Campos:
    - Pallets OUTBOUND
    - Pallets INBOUND
    - Total PBR Utilizados
  - Seções condicionais:
    - `Embarque (OUT)` para OUTBOUND
    - `Descarregamento (IN)` para INBOUND
  - Botão `Adicionar código` para criar mais linhas de pallet
  - Botão `✕` para remover linha de pallet
  - Exibe apenas a seção correspondente ao fluxo selecionado

- **Observações da carga**
- **Lacres e assinaturas**
  - Lacre 01
  - Lacre 02
  - Status Lacre
  - Áreas visuais de assinatura

#### Regras de validação
- Campos obrigatórios para a maioria do formulário
- Restrições numéricas aplicadas a:
  - DT
  - Doca
  - CPF/CNH
  - Código do item
  - Previsto
  - Realizado
  - Avaria
  - Scrap
  - Av. Int.
  - Pallets
  - Fardos Totais
  - Fardos / Pallet
  - Lacres
- O envio é bloqueado se campos obrigatórios estiverem em branco ou inválidos
- A seção de pallets exige pelo menos uma linha válida para o fluxo ativo

### 2) Painel de relatórios (`admin.html`)

#### Métricas exibidas
- Total de registros
- Docas em uso
- Operações Inbound
- Operações Outbound

#### Funcionalidades
- Busca por:
  - DT
  - Motorista
  - Placa Cavalo
  - Placa Carreta 1
  - Transportadora
- Filtro por abas:
  - Todos
  - Inbound
  - Outbound
- Tabela de registros com ações:
  - Visualizar detalhes
  - Excluir registro
- Exportar dados para CSV

#### Detalhes de visualização
- Modal com informações completas de checklist:
  - identificação
  - higiene
  - itens conferidos
  - totais
  - observações
  - pallets
  - selos

---

## Arquivos do projeto

- `index.html`: formulário principal do checklist
- `index.js`: lógica do formulário, validação, alternância de pallets e gravação em `localStorage`
- `index.css`: estilos do formulário e da página principal
- `admin.html`: painel de visualização e relatórios
- `admin.js`: lógica de leitura de `localStorage`, filtros, tabela, modal e exportação CSV
- `admin.css`: estilos do painel de administração
- `images/`: ativos de imagens usados no projeto

---

## Frameworks e tecnologias

- HTML5
- CSS3
- JavaScript puro
- Tailwind via CDN (presente apenas por conveniência de estilo)
- `localStorage` para persistência dos checklists

---

## Responsividade e segurança

### Design responsivo
A aplicação foi desenvolvida com design responsivo completo, funcionando perfeitamente em:
- **Desktop**: layout otimizado para telas grandes (1024px+)
- **Tablet**: layout adaptado para telas médias (769px-1024px)
- **Mobile**: layout compacto para telas pequenas (até 768px)

#### Recursos responsivos implementados:
- Navbar adaptável com empilhamento vertical em mobile
- Grid responsivo para métricas e tabelas
- Tabelas com scroll horizontal em dispositivos móveis
- Botões e controles otimizados para toque
- Tipografia escalável
- Padding e margens adaptáveis

### Segurança
Foram implementadas medidas de segurança para proteger contra vulnerabilidades comuns:

#### Sanitização de entrada:
- Remoção de tags HTML e caracteres perigosos em campos de texto
- Validação e limpeza de campos numéricos
- Prevenção de injeção de scripts via `innerHTML`

#### Validação de dados:
- Verificação de integridade dos dados carregados do `localStorage`
- Sanitização automática de dados existentes
- Proteção contra XSS em modais e conteúdo dinâmico

#### Boas práticas:
- Uso de `safeSetInnerHTML()` para conteúdo gerado dinamicamente
- Validação de entrada antes do salvamento
- Logs de sanitização para debugging

---

## O que já foi feito

- Formulário completo de checklist operacional
- Alternância de seções de pallet conforme fluxo
- Validação de campos obrigatórios
- Botão dinâmico para adicionar linhas de pallet
- Botão para remover linhas de pallet
- Gravação de checklist no `localStorage`
- Relatório com filtros e busca
- Visualização de detalhes em modal
- Exclusão de registros
- Exportação de dados para CSV
- **Design responsivo completo** para mobile, tablet e desktop
- **Medidas de segurança implementadas**:
  - Sanitização de entrada de texto (prevenção XSS)
  - Validação de dados carregados do localStorage
  - Proteção contra injeção de HTML malicioso
  - Sanitização de campos numéricos

---

## O que precisa melhorar

### UX e validação
- As mensagens de erro ainda usam `alert()`
- Falta mensagem de erro inline nos campos
- Não há validação real de formato de CPF/CNH
- Condições de obrigatoriedade poderiam ser mais claras
- O usuário pode confundir o campo `Total PBR Utilizados` com o total de códigos

### Dados e relatório
- O relatório não inclui todos os detalhes do checklist:
  - status de lacre
  - campos de higiene completos no resumo final
  - observações completas de forma destacada no CSV
  - dados de pallets separados por código e quantidade
- O `localStorage` não é persistência definitiva
- Não há edição de registros existentes

### Estrutura de dados
- Modelo de dados poderia ser mais consistente
- `palletRows` e `palletsInbound`/`palletsOutbound` coexistem sem padrão único
- Recomendável normalizar para um array único de objetos de pallet

### Design e acessibilidade
- Padrões de acessibilidade (`aria-`, foco, contraste) não estão garantidos

---

## O que precisa melhorar

### UX e validação
- As mensagens de erro ainda usam `alert()`
- Falta mensagem de erro inline nos campos
- Não há validação real de formato de CPF/CNH
- Condições de obrigatoriedade poderiam ser mais claras
- O usuário pode confundir o campo `Total PBR Utilizados` com o total de códigos

### Dados e relatório
- O relatório não inclui todos os detalhes do checklist:
  - status de lacre
  - campos de higiene completos no resumo final
  - observações completas de forma destacada no CSV
  - dados de pallets separados por código e quantidade
- O `localStorage` não é persistência definitiva
- Não há edição de registros existentes

### Estrutura de dados
- Modelo de dados poderia ser mais consistente
- `palletRows` e `palletsInbound`/`palletsOutbound` coexistem sem padrão único
- Recomendável normalizar para um array único de objetos de pallet

### Design e acessibilidade
- Falta responsividade comprovada em telas pequenas
- Padrões de acessibilidade (`aria-`, foco, contraste) não estão garantidos

---

## Recomendações de melhoria

1. Substituir `alert()` por mensagens inline e validação por campo
2. Normalizar o objeto de pallet como um array de `{code, count, per}`
3. Adicionar edição de checklist no painel
4. Salvar dados em backend ou API em vez de `localStorage`
5. Melhorar exportação CSV para incluir todos os campos importantes
6. Revisar UX para reduzir possibilidades de campos conflitantes
7. Tornar a aplicação responsiva e acessível

---

## Como usar

1. Abra `index.html` no navegador
2. Preencha o formulário com os dados da operação
3. Adicione itens e/ou códigos de pallet conforme necessário
4. Clique em `Finalizar Checklist Operacional`
5. Abra `admin.html` para visualizar os registros
6. Use busca, filtros e exportação CSV conforme necessário

---

## Observações finais

Este projeto já oferece um fluxo funcional de checklist e relatório, mas ainda precisa de refinamento para ser usado em produção com segurança e robustez.
