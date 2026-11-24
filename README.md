# Checklist DHL / Suzano CD CWB

Aplicação web de checklist operacional com Firebase Authentication e Cloud Firestore. O formulário atende a operação INBOUND/OUTBOUND, permite conferência técnica, higiene, lacres, observações, assinaturas digitais e fotos; o painel administrativo permite consultar, editar, excluir e exportar os registros.

## Funcionalidades desta versão

- Um único campo de seleção múltipla para até 12 imagens.
- Compressão no navegador: redimensionamento até 1280 px e JPEG com alvo de aproximadamente 85 KB por imagem.
- Pré-visualização, remoção individual e limpeza de fotos antes do envio.
- Envio com até três tentativas e espera progressiva em falhas momentâneas.
- ID criado antes do envio e `setDoc`, evitando duplicidade quando uma resposta da rede se perde.
- Compatibilidade com checklists antigos que já armazenam `photos` e assinaturas em Base64.
- Painel protegido por autenticação, com o UID autorizado configurado em `firestore.rules` e `admin.js` para consulta, edição e exclusão.
- Exportação existente para Excel e botão **PDF completo** no modal de detalhes; o PDF inclui identificação, higiene, itens, totais, observações, assinaturas e fotos.
- Manifesto de rotas em `manus-routes.json` e deploy estático configurado em `netlify.toml`.

## Arquivos principais

- `index.html`, `index.css`, `index.js`: formulário operacional.
- `components/photo-uploader.js`: compressão, limite de 12 fotos e pré-visualização.
- `admin.html`, `admin.css`, `admin.js`: login, painel, edição e exportações.
- `firebase-init.js`: inicialização do Firebase e APIs expostas aos scripts.
- `firestore.rules`: regras de criação autenticada e administração pelo UID autorizado.
- `storage.rules`: regras preparadas para uma futura migração das fotos para Storage.
- `ANALISE_CRITICA.md`: riscos, decisões técnicas e checklist pré-deploy.
- `FUNCIONALIDADE_FOTOS.md`: documentação do fluxo de fotos.
- `TODO.md`: itens entregues e próximos passos.

## Configuração Firebase

1. Ative Authentication, Firestore e, se necessário no futuro, Storage no projeto Firebase.
2. Revise `firebase-init.js` ou copie `firebase-init.example.js` para preencher a configuração do projeto.
3. Publique as regras de `firestore.rules` no Firebase.
4. Confirme que o UID do administrador está igual em `firestore.rules` e `admin.js`.
5. Configure os domínios autorizados no Firebase Authentication.

Usuários autenticados podem criar checklists. A leitura, edição e exclusão ficam restritas ao UID administrativo configurado nas regras. Para adicionar outros administradores, atualize as regras ou migre para custom claims. O frontend não deve ser considerado uma barreira de segurança: as regras do Firebase são a proteção efetiva.

## Deploy estático

O projeto não precisa de build: o `netlify.toml` publica a raiz (`.`). Em um deploy Netlify, selecione a pasta do projeto como diretório de publicação. Antes de publicar, valide o checklist em `ANALISE_CRITICA.md`, principalmente regras, UID administrativo, limite de documentos e geração de PDF.

A biblioteca jsPDF é carregada por CDN no painel. Para uma operação sem dependência externa, fixe uma cópia versionada local antes do deploy final.

## Limitação conhecida e próxima evolução

As fotos ainda são gravadas no documento Firestore como Base64 comprimido para preservar compatibilidade com os registros existentes. Isso é adequado para o volume atual, mas não é a arquitetura ideal para crescimento. A próxima evolução deve enviar cada foto para Firebase Storage e manter no Firestore apenas caminhos/URLs e metadados; isso reduz o risco do limite de 1 MiB por documento e melhora a consulta do painel.
