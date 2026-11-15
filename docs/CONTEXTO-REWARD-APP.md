# Reward App — contexto e requisitos

Estado: documento de transferência de contexto; os mockups são referências, não uma especificação técnica perfeita. Atualizado em novembro de 2026. Repositório: https://github.com/Fafrancisco/reward-app

## Objetivo

App Android, em português de Portugal, para uma família acompanhar comportamentos, pontos e recompensas das crianças, partilhada por adultos em telemóveis diferentes. Uso familiar inicialmente, interface cuidada e simples. Os nomes e idades nos mockups são ilustrativos e não devem ser dados fixos na app.

## Decisões confirmadas

- Utilizadores adultos autenticam-se com a sua própria conta Google.
- Uma família é criada uma vez e partilhada entre adultos, por exemplo através de um convite; a Carla não cria outra família no seu telemóvel. Sincronizar os dados entre dispositivos.
- Perfis de crianças com nome e avatar; não é necessário pressupor conta Google para a criança.
- Permitir definir e registar comportamentos positivos e comportamentos a melhorar, com valores em pontos.
- Comportamentos negativos descontam do saldo da respetiva criança.
- Recompensas têm custo e são associadas a uma ou mais crianças, com progresso separado por criança.
- O resgate desconta o custo ao saldo: 75 pontos menos 70 deixa 5. Depois disso, o progresso das restantes recompensas usa o saldo disponível.
- Histórico para consultar os registos e permitir correção de enganos. Mostrar quem efetuou a operação.
- Geração de avatar por fotografia ou IA está fora do âmbito por agora. Avatares existentes podem ser escolhidos.
- Look and feel acolhedor, tons creme, verde-petróleo, coral e amarelo, cartões arredondados e navegação simples. Exemplos em docs/design/.
- Distribuição Android via APK, sem depender de publicação na Play Store. Deseja-se build na cloud através de GitHub Actions, com APK descarregável; backend na Vercel.

## Stack acordada como orientação

- React Native + Expo + TypeScript para a app.
- API TypeScript alojada na Vercel; framework específico da API ainda não fechado. Next.js Route Handlers é uma opção, não uma obrigação.
- Supabase Auth para login Google e PostgreSQL no Supabase; dados organizados por família e devidamente protegidos com verificação de sessão e autorização por família.
- GitHub para código; GitHub Actions para testes e compilação Android na cloud. Compilação direta no runner é diferente de acionar EAS Build: apenas a primeira não usa a quota EAS.
- Autenticação, serviços, infra e assinatura do APK exigem configuração real; nunca fingir que estão operacionais.
- Usar versões estáveis atuais e compatíveis; verificar documentação e lockfile ao implementar.

## Percurso e ecrãs

1. Boas-vindas e entrada com Google.
2. Criar família ou aceitar convite; convidar outro adulto.
3. Criar perfis de crianças com avatar.
4. Início com cartões por criança, saldo e recompensa / progresso relevante.
5. Gerir comportamentos, com nome, tipo, pontos e ícone; adicionar e subtrair são comportamentos distintos.
6. Registar comportamento para uma criança com indicação clara do impacto e confirmação.
7. Criar e consultar recompensas, progresso por criança e saldo suficiente.
8. Confirmar resgate mostrando saldo antes, custo e saldo depois; mostrar sucesso.
9. Histórico e correções; gestão dos membros, crianças, comportamentos e recompensas.
10. Relatórios foram vistos nos screenshots originais, mas escopo concreto ainda não está definido.

## Segurança, dados e consistência

- Isolar famílias. Não confiar no family_id fornecido pelo cliente sem verificar a associação e o papel do utilizador autenticado.
- Nunca incluir service-role keys, segredos Google, keystores ou palavras-passe na app, no repositório ou em logs.
- Garantir que cada operação de saldo/resgate é atómica e segura face a pedidos concorrentes, repetições e duplicações; validar no servidor e usar transações na base de dados.
- Manter um histórico auditável, incluindo dados suficientes para explicar o saldo e correções. Evitar alterar historicamente o valor de registos quando uma definição é editada.
- Um convite não permite acesso a outras famílias; usar mecanismo seguro, limitado e revogável com expiração e autorização validadas no servidor.
- O repositório foi observado como público no momento da conversa: não incluir dados pessoais reais, fotos, credenciais nem chaves. Confirmar visibilidade atual antes de divulgar quaisquer dados.
- Primeiro login e sincronização dependem de rede; offline completo e resolução de conflitos não foram decididos.

## Questões por decidir

- Saldo mínimo zero foi apenas proposto; não foi confirmado. Evitar tomar como requisito definitivo. Se se adotar provisoriamente, indicar essa hipótese e registar o desconto efetivo no histórico.
- A mesma recompensa pode ser resgatada várias vezes? Pode ser configurada como única ou repetível?
- Se o saldo atual satisfaz várias recompensas, cada uma mostra o mesmo saldo e atualiza após um resgate; confirmar se há reserva de pontos (não foi definida).
- Papel dos adultos (iguais ou diferentes), acesso das crianças à app e fluxo exato de convites.
- Significado das estrelas da app de referência; não assumir que existem pontos e estrelas como duas moedas.
- Regras para editar ou anular um registo depois de um resgate, limites e política de dados.
- Necessidades de offline, alertas, relatórios, cópias de segurança, e custos/limites finais.

## Referências visuais

- 01-inicio.png: login, início, registo e recompensas.
- 02-familia.png: família, convite, adicionar criança e histórico.
- 03-comportamentos-recompensas.png: formulários e resgate. O mockup faz duas avaliações do mesmo comportamento; CORRIGIR para comportamentos positivos e a melhorar distintos. Ignorar a mensagem contraditória de que faltam pontos para uma recompensa já disponível.
- 04-perfil-resgate.png: perfil, confirmação de resgate 75−70=5, sucesso e gestão da família.
- Mockups ilustram intenção visual; textos, nomes, idades, saldo e regras efetivos seguem este documento e as confirmações do utilizador.

## Trabalho anterior

Os ficheiros em docs/referencia-codigo/ são funções experimentais JavaScript e testes Node, sem interface, backend, autenticação ou base de dados. Foram testados anteriormente. Avaliar criticamente antes de reutilizar, sobretudo a hipótese não confirmada de saldo mínimo zero. Não representam uma app pronta.
