# Ambientes de Desenvolvimento e Produção

Neste projeto usamos dois ambientes no Supabase:

- **Desenvolvimento**: `dominomaniaApp_dev`
  - URL: https://zciflougwvuosvmulftn.supabase.co
  - Variáveis em `.env.development`

- **Produção**: `dominomaniaApp_prod`
  - URL: https://euqnfrvptiriujrdebpr.supabase.co
  - Variáveis em `.env.production`

---

## Arquivos de ambiente

Criamos dois arquivos na raiz (já ignorados pelo Git via `.gitignore`):

```text
.env.development   # dev
.env.production    # prod
```

Cada um contém:

```text
SUPABASE_URL=https://...supabase.co
SUPABASE_ANON_KEY=<anon-key>
```

---

## Uso em desenvolvimento

1. Copie ou renomeie `.env.development` para `.env`:
   ```powershell
   copy .env.development .env
   ```
2. Rode o Expo:
   ```powershell
   npm run start
   ```

A aplicação usará as variáveis do `.env` (dev).

---

## Uso em produção

1. Copie ou renomeie `.env.production` para `.env`:
   ```powershell
   copy .env.production .env
   ```
2. Faça o build EAS em produção:
   ```powershell
   eas build --profile production --platform all
   ```

O build incorporará as variáveis de produção.

---

## Observações

- Nunca comite `.env` no repositório.
- Para automatizar, você pode usar `cross-env` ou scripts no `package.json`.
- Em código, acesse via `process.env` (com dotenv) ou via `Constants.expoConfig.extra` se usar `app.config.js`.

## Migração de Banco de Dados com Supabase MCP

Para migrar o schema sem afetar os dados em produção, siga este fluxo:

**Plano pago (com branch):**

1. Criar branch de produção  
   ```powershell
   npx supabase mcp0_confirm_cost --organization-id <org_id> --type branch --amount <custo> --recurrence hourly
   npx supabase mcp0_create_branch --project-id euqnfrvptiriujrdebpr --confirm-cost-id <confirm_cost_id>
   ```
2. Aplicar migrations na branch  
   ```powershell
   npx supabase mcp0_apply_migration --project-id <branch_project_id> --name <nome_da_migration> --file supabase/migrations/<arquivo.sql>
   # repita para cada migration...
   ```
3. Testar a branch  
   - Aponte sua aplicação para o endpoint da branch e valide todas as funcionalidades.
4. Mesclar apenas o DDL em produção  
   ```powershell
   npx supabase mcp0_merge_branch --branch-id <branch_id>
   ```

**Plano gratuito (sem branch):**

1. Aplicar migrations diretamente em produção  
   ```powershell
   npx supabase mcp0_apply_migration --project-id euqnfrvptiriujrdebpr --name <nome_da_migration> --file supabase/migrations/<arquivo.sql>
   # repita para cada migration...
   ```
2. Testar apontando a aplicação para o endpoint de produção.

Boas práticas  
   - Escreva migrations não-destrutivas e idempotentes (ADD IF NOT EXISTS, etc.).  
   - Sempre faça backup (dump ou snapshot) antes e teste em staging.  