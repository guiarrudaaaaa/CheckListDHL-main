# Funcionalidade de fotos

A Seção 06 do checklist agora usa um único campo `<input type="file" multiple>` para selecionar até 12 imagens de uma vez. A pré-visualização aparece em uma grade responsiva, com remoção individual e botão para limpar todas as fotos.

## Processamento

O processamento é feito no navegador por `components/photo-uploader.js`. Cada arquivo é validado como imagem, redimensionado para no máximo 1280 px no maior lado e convertido para JPEG com compressão progressiva. O alvo é aproximadamente 85 KB por imagem, mantendo o conjunto pequeno o suficiente para reduzir falhas no Firestore e em conexões lentas. O formulário mostra o progresso e o tamanho aproximado total antes do envio.

As imagens comprimidas ficam temporariamente no array `photoDataUrls`. Ao salvar, o campo `photos` é incluído no checklist. O painel administrativo mantém as imagens no detalhe e preserva as fotos quando um checklist é editado. Registros antigos com arrays Base64 continuam compatíveis.

## Confiabilidade do envio

O salvamento usa três tentativas com espera progressiva para falhas momentâneas. O documento recebe um ID criado antes do primeiro envio e é gravado com `setDoc`; se a resposta se perder e a operação for repetida, o mesmo ID evita a criação de dois checklists. O botão de envio também fica protegido contra duplo clique.

## Fluxo

1. O usuário seleciona até 12 imagens no único campo.
2. O navegador valida, comprime e exibe cada imagem.
3. O usuário pode remover fotos individualmente.
4. O checklist é gravado com fotos, assinaturas e demais dados.
5. O admin visualiza as fotos no modal e pode incluí-las no PDF completo.

## Limitação arquitetural

A versão atual mantém Base64 no Firestore por compatibilidade com dados já existentes. Essa é uma mitigação para o problema imediato de peso, não a solução definitiva para alto volume. Em uma próxima etapa, migrar as fotos para Firebase Storage e guardar apenas caminhos, URLs e metadados no Firestore reduzirá o risco do limite de 1 MiB por documento.
