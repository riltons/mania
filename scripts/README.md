# Scripts de Migração para a Nova Estrutura

Este diretório contém scripts para auxiliar na migração do projeto para a nova estrutura de diretórios, seguindo princípios de Arquitetura em Camadas e Domain-Driven Design.

## Scripts Disponíveis

### 1. migracao-estrutura.ps1

Este script copia os arquivos da estrutura antiga para a nova estrutura de diretórios.

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

## Próximos Passos

Após executar os scripts, você deve:

1. **Verificar erros de compilação**: Alguns caminhos de importação podem precisar de ajustes manuais.
2. **Testar a aplicação**: Certifique-se de que tudo continua funcionando corretamente.
3. **Remover arquivos duplicados**: Após confirmar que a migração foi bem-sucedida, remova os arquivos da estrutura antiga.

## Observações

- Os scripts não removem os arquivos originais, apenas criam cópias na nova estrutura.
- É recomendável fazer um backup do projeto antes de executar os scripts.
- Caso encontre problemas, consulte o guia de migração em `GUIA_MIGRACAO.md` na raiz do projeto.
