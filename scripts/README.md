# Scripts do Projeto DominoMania

Este diretório contém scripts para auxiliar no desenvolvimento, manutenção e migração do projeto DominoMania.

## Scripts de Migração

### 1. migracao-estrutura.ps1

Este script copia os arquivos da estrutura antiga para a nova estrutura de diretórios, seguindo princípios de Arquitetura em Camadas e Domain-Driven Design.

**Como executar:**

```powershell
cd c:\Users\rilto\Downloads\meusProjetos\mania
.\scripts\migracao-estrutura.ps1
```

### 2. atualizar-importacoes.ps1

Este script atualiza as importações nos arquivos migrados para refletir a nova estrutura de diretórios.

**Como executar:**

```powershell
cd c:\Users\rilto\Downloads\meusProjetos\mania
.\scripts\atualizar-importacoes.ps1
```

## Scripts de Banco de Dados

### 1. listar_tabelas.js

Script para listar todas as tabelas do banco de dados Supabase e suas estruturas.

**Como executar:**

```bash
node scripts/listar_tabelas.js
```

### 2. listar_tabelas_script.js

Versão alternativa para listar tabelas do banco de dados.

**Como executar:**

```bash
node scripts/listar_tabelas_script.js
```

### 3. listar_tabelas_supabase.js

Script específico para listar tabelas do Supabase com formatação personalizada.

**Como executar:**

```bash
node scripts/listar_tabelas_supabase.js
```

## Ferramentas

### 1. bfg.jar

Ferramenta BFG Repo-Cleaner para limpeza de histórico do Git (remover arquivos grandes, dados sensíveis, etc).

**Como executar:**

```bash
java -jar scripts/bfg.jar --strip-blobs-bigger-than 10M
```

## Próximos Passos

Após executar os scripts, você deve:

1. **Verificar erros de compilação**: Alguns caminhos de importação podem precisar de ajustes manuais.
2. **Testar a aplicação**: Certifique-se de que tudo continua funcionando corretamente.
3. **Remover arquivos duplicados**: Após confirmar que a migração foi bem-sucedida, remova os arquivos da estrutura antiga.

## Observações

- Os scripts não removem os arquivos originais, apenas criam cópias na nova estrutura.
- É recomendável fazer um backup do projeto antes de executar os scripts.
- Caso encontre problemas, consulte o guia de migração em `GUIA_MIGRACAO.md` na raiz do projeto.
