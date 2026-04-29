# CheckList DHL / Suzano CD CWB

## Visão geral

Este projeto é uma aplicação web de checklist operacional com backend Firebase.
Ela permite o envio de checklists com fotos e a visualização segura dos registros em um painel administrativo.

### Páginas principais
- `index.html`: formulário de checklist operado por usuários autenticados
- `admin.html`: painel administrativo para listar, filtrar, visualizar e excluir registros

### Tecnologia principal
- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- JavaScript puro com Tailwind CSS para estilo

---

## Funcionalidade atual

### Formulário principal (`index.html`)

O formulário permite:
- autenticação antes de liberar o envio
- registro de operação `INBOUND` / `OUTBOUND`
- preenchimento de informações de transporte e logística
- seleção de lacres e observações de carga
- conferência técnica de itens com cálculo automático de faltas, sobras e bons
- controle de pallets
- upload de até 6 fotos por checklist
- gravação dos dados em Firestore e upload das fotos para Storage

### Painel administrativo (`admin.html`)

O painel permite:
- login seguro de administrador
- visualização de métricas de registros
- busca por DT, motorista, placa ou transportadora
- filtro por todos / inbound / outbound
- visualização de detalhes completos em modal
- exclusão de registros com limpeza dos arquivos de foto no Storage
- exportação dos dados para CSV

---

## Arquivos principais

- `index.html`: interface do formulário de checklist e login
- `index.css`: estilos da interface principal
- `index.js`: lógica de formulário, validação, upload de fotos e gravação em Firebase
- `admin.html`: painel administrativo e relatório
- `admin.css`: estilos do painel administrativo
- `admin.js`: lógica do painel, filtros, renderização e exclusão
- `firebase-init.js`: inicialização de Firebase Auth, Firestore e Storage
- `shared.js`: utilitários de sanitização, relógio e escape de HTML
- `firestore.rules`: regras de segurança do Firestore
- `storage.rules`: regras de segurança do Firebase Storage

---

## Melhorias aplicadas

### Segurança
- uso de Firebase Authentication para liberar envio e acesso ao painel
- `firestore.rules` exige que `createdByUid` seja igual ao usuário autenticado no momento da criação
- exclusão de registros permitida apenas para admins com `request.auth.token.admin == true`
- `storage.rules` restringe leitura e escrita de fotos a usuários autenticados
- sanitização de entradas antes de gravar e ao renderizar o painel

### Integridade de dados
- rollback de checklist em caso de falha no upload das fotos após a criação do documento
- limpeza de arquivos no Storage quando um checklist é excluído
- listener em tempo real (`onSnapshot`) no painel admin para evitar polling constante

### Qualidade do código
- redução de polling no painel admin
- separação de responsabilidades entre carregamento de dados, renderização e autenticação
- tratamento de erros melhorado no upload e exclusão

---

## Detalhes de implementação

### Salvar checklist
- cria um documento em `checklists`
- envia fotos para `checklists/{id}/photo-{n}.jpg`
- salva URLs de fotos no documento Firestore
- armazena metadados do usuário (`createdByUid`, `createdByEmail`)

### Painel admin
- usa `onSnapshot` para atualizações em tempo real
- renderiza dados sanitizados no painel
- exibe modal de detalhes com itens, higiene, fotos e observações
- exporta CSV com os dados carregados

---

## Como usar

1. Configure o projeto Firebase com Auth, Firestore e Storage
2. Atualize as credenciais em `firebase-init.js`
3. Abra `index.html` para enviar checklists
4. Abra `admin.html` para visualizar e gerenciar registros

---

## Regras de segurança recomendadas

### Firestore
- `create`: apenas usuário autenticado e dono do documento
- `read`: apenas usuário autenticado
- `delete`: apenas admin
- `update`: bloqueado pelo frontend

### Storage
- leitura e escrita apenas para usuários autenticados
- bloqueio total de outros caminhos

---

## Observações finais

O projeto já está preparado para uso com Firebase e garante gravação de dados e imagens de forma persistente.
Para produção, recomenda-se:
- usar claims de administrador no Firebase Auth
- limitar usuários que podem criar checklists
- habilitar App Check para proteção adicional
- revisar e testar as regras do Firebase no console
