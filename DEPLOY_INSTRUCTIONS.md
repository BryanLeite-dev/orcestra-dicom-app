# 🚀 Instruções de Deploy no Render

## Primeira vez (Inicialização do Banco de Dados)

Após o deploy inicial no Render, você precisa executar a migração do banco de dados **uma única vez**:

### Via Render Shell (Opção 1 - Premium)
```bash
pnpm db:push
```

### Via Local + Ngrok (Opção 2 - Gratuito)
Se não tiver acesso ao Shell do Render:

1. **Confirme que suas variáveis de ambiente estão corretas:**
   - Verifique `.env` com `DATABASE_URL` do Render
   - Teste conectando localmente:
   ```bash
   $env:DATABASE_URL="postgresql://postgres:xxx@hopper.proxy.rlwy.net:17702/railway"
   pnpm db:push
   ```

2. **Se não conseguir conexão remota:**
   - Use um túnel (ngrok, Cloudflare Tunnel, etc)
   - Ou peça ao Render para rodar um comando único

## Variáveis de Ambiente Obrigatórias

```env
DATABASE_URL=postgresql://postgres:password@host:port/database
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
JWT_SECRET=xxx
DIRECTOR_CODE=diretor123
OAUTH_SERVER_URL=https://api.manus.im
VITE_GOOGLE_CLIENT_ID=xxx
```

## Após o primeiro Deploy

O servidor já deve estar rodando normalmente e criará usuários conforme eles façam login via Google!

## Troubleshooting

### Erro: "users table not found"
- Execute `pnpm db:push` uma vez via Shell/Local
- As tabelas serão criadas automaticamente

### Erro: "Database unavailable"
- Verifique se `DATABASE_URL` está configurada no Render
- Teste a conexão localmente

### Deploy demorado
- Se o deploy estiver demorando >15min durante `db:setup`, cancele
- O servidor deve iniciar sem a migração
- Execute `pnpm db:push` após o deploy estar completo
