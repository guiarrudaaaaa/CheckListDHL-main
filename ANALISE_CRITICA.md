# Análise crítica e preparação para novo deploy

## Correções aplicadas

O fluxo antigo mantinha seis inputs separados, aceitava Base64 quase sem padronização e gravava tudo em um único documento Firestore. Isso é frágil porque o Firestore tem limite de aproximadamente 1 MiB por documento e porque uma resposta perdida da rede pode causar reenvio duplicado. A versão atual usa um único input múltiplo com máximo de 12 imagens, redimensiona para até 1280 px, converte para JPEG e reduz cada imagem para cerca de 85 KB. O envio usa três tentativas com espera progressiva e `setDoc` em um ID criado antes do envio, tornando a operação idempotente.

O painel ganhou PDF individual completo, com identificação, higiene, itens, totais, observações, assinaturas e fotos. O Excel existente foi preservado. Registros antigos continuam sendo exibidos porque o painel aceita o array `photos` e as assinaturas no formato anterior.

## Riscos ainda existentes

1. **Base64 no Firestore ainda é uma solução de transição.** Mesmo comprimindo, 12 imagens, duas assinaturas e campos extensos podem se aproximar do limite de documento. A solução definitiva é Firebase Storage com regras autenticadas, salvando no Firestore apenas URLs/caminhos e metadados.
2. **Segurança depende das regras e claims reais do Firebase.** As regras foram endurecidas nesta versão: usuários autenticados apenas criam checklists; somente contas com custom claim `admin == true` leem, editam e excluem. Antes do deploy, publicar essas regras e validar o claim no Firebase Auth. Não confiar apenas no fato de a rota `admin.html` estar escondida.
3. **Firebase config exposta no frontend é normal para Firebase, mas as regras são obrigatórias.** Rotacionar credenciais não corrige regras abertas; revisar `firestore.rules` e `storage.rules` no console.
4. **CDNs externos são pontos de falha.** O PDF usa jsPDF via CDN. Para operação crítica, fixar o recurso em uma versão local ou usar um build com dependência empacotada.
5. **Offline completo ainda não está implementado.** O retry cobre instabilidade momentânea; se a conexão cair por longo período, o operador precisa manter a tela aberta e reenviar. Um PWA com fila local criptografada seria a próxima evolução.
6. **Ordenação e paginação dependem de `createdAt`.** Garantir que todos os documentos antigos possuam esse campo e criar o índice solicitado pelo Firebase quando o console indicar.

## Checklist pré-deploy

- Testar 1, 6 e 12 fotos reais em celular, incluindo câmera, HEIC e imagens grandes.
- Verificar no Firebase o tamanho dos documentos e confirmar que nenhum envio passa do limite.
- Testar queda de rede durante o envio e confirmar ausência de duplicidades.
- Testar login, logout, usuário sem claim admin, edição, exclusão e acesso direto a `admin.html`.
- Gerar PDFs com e sem fotos, verificando assinaturas e quebra de páginas.
- Publicar somente depois de revisar regras, domínio autorizado do Firebase Auth e configuração do Netlify.


## Autorização administrativa escolhida

Para simplificar a operação com um único administrador, esta versão usa o UID `86vA0di5fZSL6xpQjJVFx8Nhn1H2` diretamente nas regras do Firestore e no guard visual do painel. O UID não é uma senha nem um segredo; a proteção real continua sendo a regra do Firestore. Se a empresa precisar de mais administradores, recomenda-se migrar para custom claims (`admin: true`) para não editar regras a cada novo usuário.
