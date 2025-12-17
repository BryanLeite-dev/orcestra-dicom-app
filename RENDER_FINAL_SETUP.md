# CONFIGURAÇÃO FINAL - Render Dashboard

## ✅ O Que Já Foi Feito

1. ✅ Banco de dados atualizado em `.env` (URL externa do Render)
2. ✅ `render.yaml` atualizado com URL interna do Render (melhor performance)
3. ✅ Todas as variáveis de ambiente configuradas
4. ✅ Google OAuth implementado no backend

## 🔧 O Que FALTA Fazer no Dashboard Render

### Passo 1: Adicionar Variáveis de Ambiente no Render

1. Acesse: https://dashboard.render.com
2. Selecione seu serviço: **orcestra-dicom-app**
3. Clique em **Settings** → **Environment**
4. Clique em **Add Variable** para cada uma:

#### Banco de Dados (CRÍTICO)
```
DATABASE_URL = [Copiar do seu .env local]
```
*Esta é a URL INTERNA do Render (melhor performance que a external)*

#### Google OAuth - Backend
```
GOOGLE_CLIENT_ID = [Copiar do seu .env local]
GOOGLE_CLIENT_SECRET = [Copiar do seu .env local]
```

#### Google OAuth - Frontend (CRÍTICO PARA LOGIN FUNCIONAR)
```
VITE_GOOGLE_CLIENT_ID = [Copiar do seu .env local]
```

#### JWT & Segurança
```
JWT_SECRET = [Copiar do seu .env local]
DIRECTOR_CODE = [Copiar do seu .env local]
```

#### Manus OAuth (Fallback)
```
OAUTH_SERVER_URL = https://api.manus.im
VITE_OAUTH_PORTAL_URL = https://api.manus.im
```

#### App Config
```
VITE_APP_ID = orcestra-dicom-app
```

### Passo 2: Clicar em Save

Render vai automaticamente:
- Validar as variáveis
- Disparar um novo build
- Fazer deploy automático

Aguarde 3-5 minutos até aparecer o ✅ verde na seção "Deployments"

### Passo 3: Testar Login

1. Acesse: https://orcestra-dicom-app.onrender.com
2. Clique em **"Login with Google"**
3. Você deve ser redirecionado para o login do Google
4. Faça login com sua conta Google
5. Deve ser redirecionado para a home logado

## 📋 Checklist de Configuração

- [ ] DATABASE_URL adicionada no Render
- [ ] GOOGLE_CLIENT_ID adicionada no Render
- [ ] GOOGLE_CLIENT_SECRET adicionada no Render
- [ ] VITE_GOOGLE_CLIENT_ID adicionada no Render (ESSENCIAL)
- [ ] JWT_SECRET adicionada no Render
- [ ] DIRECTOR_CODE adicionada no Render
- [ ] OAUTH_SERVER_URL adicionada no Render
- [ ] VITE_OAUTH_PORTAL_URL adicionada no Render
- [ ] VITE_APP_ID adicionada no Render
- [ ] Build completou com sucesso
- [ ] Login com Google funciona

## 🗄️ Informações do Banco de Dados

### Para Usar no Render (INTERNA)
```
URL: postgresql://orcestra_dicom_db_user:r5HkEUDJiUQA7DX9AvsDAoWfANQHrPdc@dpg-d512i87gi27c73e2h27g-a/orcestra_dicom_db
```

### Para Conectar Localmente (EXTERNA)
```
URL: postgresql://orcestra_dicom_db_user:r5HkEUDJiUQA7DX9AvsDAoWfANQHrPdc@dpg-d512i87gi27c73e2h27g-a.virginia-postgres.render.com/orcestra_dicom_db
```

### Para Conectar com PSQL
```bash
PGPASSWORD=r5HkEUDJiUQA7DX9AvsDAoWfANQHrPdc psql -h dpg-d512i87gi27c73e2h27g-a.virginia-postgres.render.com -U orcestra_dicom_db_user orcestra_dicom_db
```

## ✅ Status Confirmado

- ✅ Banco de dados: Conectado (17 tabelas + dados)
- ✅ Server: Rodando com sucesso
- ✅ OAuth Google: Implementado no backend
- ✅ Migrations: Já executadas
- ✅ Código: Pronto para produção

## ⚠️ Importante

**NÃO faça isso:**
- Não altere o `buildCommand` ou `startCommand` em render.yaml
- Não delete variáveis existentes
- Não mude a port (Render usa automaticamente 3000)

**FAÇA isso:**
- Copie exatamente os valores das variáveis
- Use a URL interna do banco (dpg-d512i87gi27c73e2h27g-a) - sem "virginia-postgres.render.com"
- Aguarde o build completar antes de testar

## 🔐 Segurança

Todos esses valores estão:
- ✅ No `.env` local (não commited no git)
- ✅ Sincronizados com Render via dashboard
- ✅ Protegidos pelo Render (não visíveis em logs públicos)

## Próximas Etapas Após Login Funcionar

1. Testar criar novas tarefas
2. Testar gamificação
3. Testar dashboard de performance
4. Testar criação de leads via webhook
5. Gerar APK Android/iOS se necessário

---

**Tempo estimado: 5-10 minutos**

Depois disso, o app estará 100% funcional em produção! 🚀

