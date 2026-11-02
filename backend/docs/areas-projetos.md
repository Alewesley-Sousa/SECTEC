# Áreas e projetos (B01–B03)

Branch: `feature/backend-areas`.

## Resumo

O domínio de áreas agora é uma entidade própria. Cada projeto tem uma área; áreas não têm relação com orientadores. Os projetos deixaram de apontar para eixo temático. A edição por aluno é autorizada somente para o aluno autor do projeto.

O `git pull origin main` foi concluído e informou `Already up to date`. O branch estava no mesmo commit de `origin/main` (`5f975df`, merge da branch de frontend). O checkout não tinha upstream configurado, por isso `git pull` sem argumentos não funcionou; o pull explícito de `origin/main` funcionou.

## Alterações esperadas no banco

| Tabela | Alteração |
| --- | --- |
| `areas` | Criada com `id` (PK), `nome` (`varchar(120)`, único) e `descricao` (`text`, nullable). |
| `projetos` | `area_id` passa a ser obrigatório e referencia `areas.id` com `ON DELETE RESTRICT`. A coluna `tema_id` é removida. |
| `usuarios` | A coluna antiga `area` é removida. |
| `orientador_areas` | A tabela de associação antiga entre orientador e área é removida. |

A migração cria áreas com os nomes dos eixos que já estavam usados por projetos e transfere os projetos para a área correspondente. Projetos sem eixo válido recebem `Área não definida`. Nomes repetidos são consolidados numa única área.

Os eixos de evento (`tema_eventos`) continuam existindo para os fluxos próprios do evento e seleção de temas por orientadores. Eles deixam de ser usados como área do projeto. Os dados antigos de área cadastrados diretamente em orientadores serão descartados ao remover `usuarios.area` e `orientador_areas`, conforme o requisito de remover essa associação.

### Estado do banco nesta revisão

A migração foi criada, mas **não foi aplicada ao banco configurado**. A inspeção somente leitura do MySQL retornou `ER_ACCESS_DENIED_ERROR`; não havia credenciais válidas disponíveis para confirmar o schema físico. Portanto, a descrição acima é o schema definido pela entidade e pela migração, não uma confirmação de que o banco remoto/local já foi alterado.

O backend atual usa `synchronize: true`. Em banco existente, execute a migração antes de iniciar esta versão da aplicação. Caso o backend novo já tenha sido iniciado contra esse banco antes da migração, pare e confira o schema antes de continuar: a sincronização automática pode já ter alterado as colunas sem copiar os dados antigos.

## Endpoints de áreas

Todas as rotas requerem JWT.

| Método | Rota | Acesso | Resultado |
| --- | --- | --- | --- |
| `GET` | `/api/areas` | usuário autenticado | Lista áreas em ordem alfabética. |
| `GET` | `/api/areas/:id` | usuário autenticado | Retorna uma área ou `404`. |
| `POST` | `/api/areas` | coordenador | Cria área (`nome`, `descricao?`). |
| `PATCH` | `/api/areas/:id` | coordenador | Atualiza `nome` e/ou `descricao`. |
| `DELETE` | `/api/areas/:id` | coordenador | Exclui área sem projetos vinculados; retorna `409` se estiver em uso. |

Nomes duplicados retornam `409`. Nome é obrigatório e limitado a 120 caracteres.

Exemplo de criação:

```http
POST /api/areas
Authorization: Bearer <token-de-coordenador>
Content-Type: application/json

{
  "nome": "Ciências da Natureza",
  "descricao": "Projetos de biologia, química e física"
}
```

## Contrato de projetos

Criar projeto agora recebe `areaId` em vez de `temaId`:

```json
{
  "titulo": "Projeto de exemplo",
  "descricao": "Descrição com pelo menos 30 caracteres para cumprir a validação.",
  "areaId": 3,
  "alunosIds": [12, 18]
}
```

O ID da área precisa existir. Projeto retornado inclui `areaId` e a relação `area`.

Na edição (`PATCH /api/projetos/:id`), aluno autor pode alterar `titulo`, `descricao`, `areaId` e `alunosIds`. Coordenador pode também alterar `evento`. Outros alunos recebem `403`. A troca de área na edição também é validada.

Os filtros das listagens de projetos usam `area`; as telas de aluno e coordenação foram atualizadas para ler e enviar `areaId`. A tela de orientador passou a mostrar a área retornada pelo backend; as preferências de temas do orientador não filtram mais os projetos.

## Migração

Foi adicionado `backend/areas-data-source.ts` para executar somente a migração desta tarefa sem tentar reaplicar as migrações históricas antigas. A tabela de controle usada por ela é `areas_migrations`. O script `migration:run` aponta para essa fonte de dados.

Antes de aplicar em banco de dados com conteúdo:

1. Faça backup do banco.
2. Confirme que o schema ainda tem `projetos.tema_id`, `tema_eventos`, `usuarios.area` (se existente) e `orientador_areas` (se existente).
3. Configure `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME` no ambiente do backend.
4. A partir de `backend/`, execute:

```bash
npm run migration:run
```

5. Confirme a nova tabela `areas`, a coluna `projetos.area_id`, a ausência de `projetos.tema_id` e da associação antiga com orientadores.
6. Só então inicie o backend atualizado.

A migração não foi executada nesta sessão porque o banco recusou autenticação. Não execute a migração se o schema já tiver sido alterado pela sincronização automática; nesse caso, inspecione e reconcilie o banco primeiro.

## Como testar

### Testes automatizados do backend

```bash
cd backend
npm test -- --runInBand areas/areas.service.spec.ts projetos/projetos.service.spec.ts
npm run build
```

Os testes cobrem ordenação/listagem, criação, conflito por nome duplicado, exclusão bloqueada por projetos, `404` para área inexistente e bloqueio de edição por aluno que não é o autor.

### Verificação manual da API

1. Inicie a aplicação após aplicar a migração num banco de teste.
2. Com token de coordenador, crie uma área e confirme-a com `GET /api/areas`.
3. Com token de aluno, crie projeto usando `areaId` válido; tente também ID inexistente e confirme a rejeição.
4. Edite o projeto como autor (`PATCH /api/projetos/:id`) e confirme alterações de título, descrição, área e integrantes.
5. Tente editar o mesmo projeto como outro aluno e confirme resposta `403`.
6. Tente remover uma área já usada por projeto e confirme resposta `409`; remova uma área sem projetos e confirme sucesso.

### Verificações executadas nesta revisão

- Backend build: passou (`npm run build`).
- Testes backend: 2 suítes passaram, 9 testes passaram.
- Frontend build: passou (`npm run build`). O bundler ainda reporta aviso de chunk JavaScript acima de 500 kB.
- Banco: não confirmado nem migrado; a conexão retornou `ER_ACCESS_DENIED_ERROR`.

Essas verificações confirmam compilação e testes unitários. A validação final do schema e dos endpoints com banco real permanece pendente de credenciais válidas e execução da migração em banco de teste.
