# Revisão de segurança e consistência — 14 de novembro de 2026

Esta revisão focou o cliente Expo, a API de pontos, as migrações PostgreSQL e a compilação Android. É uma revisão parcial baseada em código e testes locais; não certifica a segurança nem substitui testes com Supabase, Google, Vercel e dois dispositivos. Usa apenas dados fictícios até concluir essas validações.

## Problemas corrigidos

1. **Submissões de pontos simultâneas — alto.** Dois toques antes da atualização visual podiam iniciar operações diferentes antes de ser gravado o pedido pendente; o servidor veria duas chaves de idempotência. `src/single-flight.ts:2` e `src/remote.ts:44` rejeitam a segunda submissão enquanto a primeira decorre. Testes verificam exclusão mútua e libertação após falha.
2. **Resposta tardia após trocar de família ou conta — médio.** Um carregamento anterior podia substituir no ecrã os dados da família selecionada. `src/RemoteApp.tsx:20` identifica a conta e família de cada carregamento, ignora respostas antigas e mantém o ecrã de carregamento até receber os dados correspondentes. Uma falha permite voltar a tentar.
3. **Envio de token para origem não segura — médio.** `src/api-url.ts:2` exige uma origem HTTPS sem credenciais, caminho, query ou fragmento antes de enviar o token de sessão à API. A configuração local também tem de usar HTTPS.

## Verificações e limitações

As políticas RLS e as funções com privilégios elevados foram revistas no código; os testes PostgreSQL locais já existentes exercitam isolamento entre famílias, convite único, idempotência e resgates concorrentes. A função `supabase/migrations/202611080001_initial.sql:72` e as restantes funções de pontos estão expostas para RPC a utilizadores autenticados e voltam a verificar a pertença dentro da base de dados; a verificação na API Vercel é uma camada adicional, não a única fronteira de autorização.

Uma compilação de release local foi gerada com uma chave temporária de teste e a assinatura APK v2 foi verificada com `apksigner`. Esta compilação usou o projeto Android gerado localmente, não verifica o workflow Actions de raiz, e antecedeu uma pequena alteração posterior no tratamento de erro da sessão. A chave de teste não serve para distribuição.

Ainda falta verificar no projeto Supabase real os privilégios efetivos, RLS e funções, o fluxo Google com PKCE num APK instalado, permissões e recuperação de sessão, revogação e expiração de convites, e concorrência entre dispositivos. Não foram realizadas auditorias independentes nem testes de intrusão. A remoção de membros e a política de retenção continuam por definir. Seguir o plano em `docs/IMPLEMENTACAO.md` antes de registar dados reais.
