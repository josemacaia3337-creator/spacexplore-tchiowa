# Estabilização de produção — SpaceXplore Tchiowa

Este documento regista a intervenção de estabilização e os passos operacionais que dependem de acesso ao painel da Vercel ou às definições de autenticação do Supabase.

## Alterações aplicadas no código

- A rota privada `/dashboard` encaminha visitantes sem sessão para `/login`, preservando o destino de retorno validado.
- `.env.example` documenta `NEXT_PUBLIC_SITE_URL`, necessária para construir os links de confirmação de email e recuperação de palavra-passe.
- O workflow de CI deixa de fazer merge automático de pull requests. A validação técnica não substitui uma decisão explícita de revisão.
- O teste de saúde NASA GPM passa a indicar o tipo de conteúdo e uma pequena amostra quando o serviço responde com HTML ou outro conteúdo que não seja JSON. A falha do fornecedor continua visível; não é mascarada.

## Configuração obrigatória na Vercel

Definir em **Production**, **Preview** e **Development** conforme o ambiente:

- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto Supabase.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: chave publicável ativa do projeto.
- `NEXT_PUBLIC_SITE_URL`: origem absoluta da aplicação para aquele ambiente, sem barra final.

Após alterar variáveis, criar um novo deployment. Nunca colocar service-role keys, passwords de base de dados ou segredos no prefixo `NEXT_PUBLIC_`.

## Configuração obrigatória no Supabase Auth

No painel do projeto, rever **Authentication → URL Configuration**:

- Site URL: domínio de produção canónico.
- Redirect URLs: adicionar os callback URLs exatos dos ambientes efetivamente utilizados, incluindo `/auth/callback`.
- Confirmar que os domínios Preview autorizados não usam curingas excessivamente abrangentes.
- Confirmar SMTP e os templates de confirmação/recuperação se os emails não estiverem a chegar.

Em **Authentication → Security and Protection**, ativar a proteção contra palavras-passe comprometidas (HaveIBeenPwned), se disponível no plano/projeto.

## Estado e decisões de segurança Supabase

- As tabelas da aplicação têm RLS ativado, conforme a inspeção feita durante a auditoria.
- A função `public.create_organization_with_owner(text,text)` é `SECURITY DEFINER` e é chamada pela aplicação autenticada para criar a organização e a associação inicial numa única operação. A função valida `auth.uid()`, valida os argumentos e fixa `search_path` vazio. A recomendação do advisor é um aviso genérico; não remover a permissão de execução nem mudar para invoker sem redesenhar a operação e testar as políticas, pois isso pode quebrar o onboarding. Manter a execução apenas para os papéis necessários.
- O bucket `profile-avatars` é público por desenho atual: a interface utiliza `getPublicUrl` para mostrar avatares. As políticas RLS limitam uploads, alterações e remoções à pasta do próprio utilizador; a leitura pública é inerente ao bucket público. Não guardar documentos privados neste bucket.
- A proteção de palavra-passe comprometida é uma configuração Auth do painel e não é alterada por uma migração SQL.

## Divergência de histórico de migrações — requer reconciliação antes de novas migrações

Na inspeção de 17-11-2026, a tabela de histórico do Supabase continha nove versões, enquanto o diretório `supabase/migrations` do repositório continha seis ficheiros. Além disso, alguns nomes/timestamps locais não correspondem ao histórico remoto.

**Não executar `supabase db reset`, não reaplicar migrações antigas e não usar `db push` até reconciliar o histórico.** Isso pode provocar alterações duplicadas ou divergência de schema.

Procedimento recomendado:
1. Criar backup/snapshot do projeto antes de qualquer alteração estrutural.
2. Comparar o schema remoto com cada migração local e recuperar do histórico Git os ficheiros originais em falta, quando existirem.
3. Gerar uma migração de baseline apenas depois de confirmar que representa o estado remoto real.
4. Usar os comandos oficiais de repair para marcar versões como aplicadas ou revertidas, apenas após validar cada correspondência.
5. Executar uma restauração de teste numa base de dados separada antes de considerar o histórico reconciliado.

## Limitações desta intervenção

Não foi possível alterar nem validar diretamente as variáveis de ambiente e os deployments da Vercel através das integrações disponíveis. Também não foi possível ativar a proteção contra palavras-passe comprometidas no painel Auth. Estas ações estão documentadas acima e exigem acesso às respetivas definições.

O teste NASA GPM falhou com resposta HTML em vez do formato Activity JSON documentado pela NASA. O código do teste foi melhorado para diagnosticar a resposta; a disponibilidade do fornecedor externo deve ser confirmada em nova execução.
