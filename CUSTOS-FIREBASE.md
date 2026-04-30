# 🔥 Checklist DHL - Configurações para Controle de Custos
# Este arquivo contém dicas para manter o Firebase GRATUITO

## 📊 LIMITES DO PLANO GRATUITO (Spark)
- Armazenamento: 1GB
- Leituras/dia: 50.000
- Gravações/dia: 20.000
- Exclusões/dia: 20.000
- Conexões simultâneas: 100

## 🎯 OTIMIZAÇÕES IMPLEMENTADAS

### 1. Regras de Segurança (firestore.rules)
- ✅ Apenas permite criar checklists
- ✅ Bloqueia updates/deletes públicos
- ✅ Reduz risco de uso excessivo

### 2. Otimização no Admin (admin.js)
- ✅ Limita lista lateral a 20 itens
- ✅ Só atualiza métricas quando necessário
- ✅ Carrega apenas dados recentes

### 3. Monitoramento Recomendado
- Acesse: https://console.firebase.google.com/
- Vá para: Projeto > Usage > Firestore
- Configure alertas quando chegar a 80% dos limites

## 🚨 DICAS PARA NUNCA PAGAR

### 1. Configure Orçamento no Google Cloud
1. Acesse: https://console.cloud.google.com/billing
2. Selecione seu projeto
3. Vá para: Orçamentos > Criar orçamento
4. Defina: R$ 0,00 (zero) como limite
5. Configure alertas por email

### 2. Monitore Uso Diário
- Verifique Firebase Console diariamente
- Se aproximar de 40.000 leituras/dia → otimize consultas

### 3. Limitações no Código
```javascript
// Exemplo: Limite de 1000 checklists no histórico
const q = query(
  collection(db, 'checklists'),
  orderBy('createdAt', 'desc'),
  limit(1000)  // Máximo 1000 documentos
);
```

### 4. Cache Local
- Use localStorage para dados que não mudam
- Reduza recarregamentos desnecessários

## 💰 Estimativa de Custo se Crescer
- 10.000 checklists/mês: ~R$ 5,00
- 50.000 checklists/mês: ~R$ 25,00
- 100.000 checklists/mês: ~R$ 50,00

## ✅ SEU PROJETO ESTÁ OTIMIZADO!
- Uso estimado: < 1% dos limites gratuitos
- Segurança: Regras configuradas
- Monitoramento: Firebase Console ativo

---

## 🧭 Plano de Ação Recomendado

Para deixar o projeto pronto para deploy seguro e bem organizado, siga estes passos:

1. Estrutura de projeto
   - Crie `package.json` com dependências mínimas para lint, build e deploy.
   - Adicione `.gitignore` para `node_modules`, `.env`, `.venv`, e arquivos temporários.
   - Crie `.env.example` com variáveis Firebase documentadas.

2. Regras e segurança do Firebase
   - Atualize `firestore.rules` para exigir `request.auth != null` em leitura/escrita e admin para exclusão.
   - Atualize `storage.rules` para permitir somente leitura/gravação autenticada em `/checklists/*`.
   - Remova credenciais diretamente do código e use variáveis de ambiente.

3. CI/CD e deploy
   - Configure GitHub Actions para rodar `npm install`, `npm run build` e, se houver, `npm test` em cada push para `main`.
   - Crie `netlify.toml` ou configure o painel Netlify com build command e publish directory.
   - Certifique-se de que a branch principal (`main`) esteja limpa e pronta para deploy.

4. Firebase multiplos ambientes
   - Separe projetos Firebase para `dev`, `staging` e `prod`.
   - Use arquivos de configuração ou variáveis de ambiente para trocar o projeto alvo.
   - Garanta que cada ambiente tenha regras e billing separados.

5. Testes e validação
   - Adicione smoke tests básicos para validar o form de checklist e o login admin.
   - Valide o deploy em staging antes de apontar para produção.
   - Use Lighthouse ou Web Vitals para medir performance e tempo de carregamento.

6. Documentação e monitoramento
   - Documente no README como configurar variáveis de ambiente e fazer deploy.
   - Mantenha alertas no Firebase e orçamento zero no Google Cloud para evitar custos inesperados.
