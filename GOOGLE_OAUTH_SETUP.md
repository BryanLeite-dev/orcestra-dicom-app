# 🔐 Como Configurar Google OAuth no Google Cloud Console

## Passo 1: Acesse o Google Cloud Console
1. Vá para: https://console.cloud.google.com/
2. Selecione o projeto: `orcestra-dicom-app`

## Passo 2: Vá para APIs & Services
1. No menu lateral, clique em **APIs & Services**
2. Depois clique em **Credentials**

## Passo 3: Encontre o OAuth 2.0 Client
1. Procure por `Orc'estra DiCoM` ou `orcestra-dicom-app`
2. Clique no **OAuth 2.0 Client ID** (não é o secret, é o Client)

## Passo 4: Adicione a URL de Callback
1. Você verá uma seção chamada **Authorized redirect URIs**
2. Clique em **ADD URI** e adicione EXATAMENTE:
   ```
   https://orcestra-dicom-app.onrender.com/api/oauth/google/callback
   ```

3. **TAMBÉM adicione para desenvolvimento local:**
   ```
   http://localhost:3000/api/oauth/google/callback
   ```

4. Clique em **SAVE**

## ✅ URLs que Devem Estar Configuradas

- ✅ `http://localhost:3000/api/oauth/google/callback` (desenvolvimento)
- ✅ `https://orcestra-dicom-app.onrender.com/api/oauth/google/callback` (produção)

## Se Ainda Não Funcionar

1. **Limpe o cache do navegador** (Ctrl+Shift+Del)
2. **Feche e reabra a abinha** com a URL de login
3. **Tente novamente**

## Verificar se a URL está correta

No navegador, durante o login do Google, verifique a URL completa na barra de endereço - deve conter:
```
redirect_uri=https%3A%2F%2Forcestra-dicom-app.onrender.com%2Fapi%2Foauth%2Fgoogle%2Fcallback
```

Se der erro `redirect_uri_mismatch`, é porque a URL não está exatamente igual no Console!
