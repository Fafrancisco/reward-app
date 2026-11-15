# Implementação e configuração

## Estado

A demonstração local usa apenas dados fictícios e não os envia para a rede. A interface de família partilhada implementa login Google, criação e seleção de família, convites de uma utilização, crianças, comportamentos, recompensas por uma ou mais crianças, movimentos, resgates e correções. Permite editar crianças, comportamentos e recompensas. A sincronização ocorre ao carregar a família, após operações e ao tocar em **Atualizar dados**; não existe sincronização em tempo real ou offline.

A aplicação inclui o fluxo OAuth Google: o primeiro acesso cria a conta Supabase e os seguintes iniciam sessão com a mesma conta. O botão de entrada serve para ambos; não é necessária uma palavra-passe separada. O funcionamento no APK depende de configurar as contas Google Cloud e Supabase indicadas abaixo e de compilar a app com o URL e a chave pública do projeto.

A camada de família partilhada e a API ainda não foram validadas num projeto Supabase/Vercel real nem num APK instalado. Os testes locais usam um PostgreSQL isolado e um esquema Auth simulado: verificam isolamento, convites, idempotência, saldo, permissões e resgates concorrentes, mas não substituem testes com Supabase, Google, Vercel e dispositivos reais. Não utilizar dados pessoais antes de completar as validações abaixo e rever a segurança. As credenciais Google e os parâmetros de projeto Supabase continuam dependentes da configuração nas contas correspondentes.

## Regras confirmadas e hipóteses

Confirmado: comportamentos negativos descontam pontos; 75 − 70 = 5; adultos partilham uma família; recompensas podem ser atribuídas a várias crianças. O histórico guarda o identificador do adulto e o valor aplicado na altura; o nome de perfil Google é apresentado apenas como etiqueta e nunca como critério de autorização; editar uma definição não altera movimentos anteriores.

Hipóteses provisórias: comportamentos podem deixar o saldo negativo; um resgate exige saldo suficiente, é repetível e não reserva pontos; uma correção cria um movimento inverso único, inclusive após um resgate. Estas hipóteses não são decisões do utilizador. Todos os adultos membros têm as mesmas permissões nesta versão. Remoção de membros, eliminação de perfis, política de retenção, regras definitivas de correção, offline e relatórios ainda carecem de decisão e implementação. A referência JavaScript foi substituída porque truncava descontos a zero sem confirmação e não implementava segurança, transações nem auditoria.

## 1. Supabase e Google

1. Cria um projeto de teste no Supabase e guarda em local seguro a palavra-passe da base de dados. No painel SQL, aplica por ordem os ficheiros `supabase/migrations/202611080001_initial.sql`, `202611080002_reward.sql`, `20261114194806_idempotent_creation.sql` e `20261114205650_member_display_names.sql`. Revê-os antes de aplicar. Não apliques `supabase/tests/bootstrap.sql` num projeto Supabase: apenas simula o Auth para testes locais.
2. Na Google Cloud, configura o ecrã de consentimento e cria um cliente OAuth do tipo aplicação Web. Como URI de redirecionamento autorizado no Google, usa o callback HTTPS fornecido pelo painel Supabase em **Authentication → Providers → Google**. Configura o cliente e o respetivo segredo nesse painel Supabase; o segredo fica apenas nas contas Google/Supabase, nunca na app. Se o ecrã de consentimento estiver em modo de teste, adiciona as contas de teste autorizadas.
3. No Supabase, ativa o fornecedor Google, permite a criação de novas contas (sign-ups), restringe os restantes métodos de autenticação que não pretendes permitir e adiciona `familiaempontos://auth/callback` aos Redirect URLs em Authentication → URL Configuration. O esquema e o identificador Android em `app.json` devem ser fixados antes de distribuir APKs. A app usa browser do sistema, PKCE e SecureStore; testa num APK ou development build instalado, pois o Expo Go usa o seu próprio esquema de URLs.
4. Anota o URL do projeto e a chave pública compatível `anon`/publishable. Só estas são incluídas na aplicação; nunca coloques service-role, secret key, segredo Google ou palavras-passe na aplicação, no Git ou no chat. Segue também a documentação oficial de [Google Auth](https://supabase.com/docs/guides/auth/social-login/auth-google) e [deep links](https://supabase.com/docs/guides/auth/native-mobile-deep-linking).

## 2. API Vercel e app

1. Liga um projeto Vercel ao repositório, com o diretório raiz como raiz do projeto e funções TypeScript no diretório `api/`. Configura `SUPABASE_URL` e `SUPABASE_ANON_KEY` no ambiente Vercel com os valores públicos do mesmo projeto Supabase. Não uses service-role. Publica primeiro num ambiente de teste. `GET /api/health` permite verificar que o processo responde; não valida a ligação aos dados.
2. Copia `.env.example` para `.env` local e preenche `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` e `EXPO_PUBLIC_API_URL` (origem HTTPS da Vercel, sem `/api/points`). As variáveis `EXPO_PUBLIC_` são incorporadas na app e são públicas. Reinicia o Expo depois de as alterar.
3. Para o APK Actions, coloca os mesmos três valores públicos em **Settings → Secrets and variables → Actions → Variables**, e configura os quatro segredos de assinatura descritos no README. Depois de fazeres push para `main`, descarrega o artefacto produzido automaticamente. A publicação e a primeira execução real dependem das tuas contas.
4. O cliente acede aos dados Supabase com a sessão do adulto e RLS; as operações de pontos passam pela API Vercel, que valida o utilizador com Supabase e invoca a função com o mesmo token. A base de dados volta a verificar pertença. Sem API configurada, a app não executa movimentos partilhados.

## 3. APK de ensaio e atualizações OTA

O APK local em `android/app/build/outputs/apk/release/app-release.apk` é autónomo e abre sem Metro. Para o ensaio foi assinado com a chave **Android Debug** local, não com uma chave de distribuição. Instala-o para testar; antes de instalar um APK assinado pela pipeline, desinstala este APK de ensaio. Não distribuas a chave debug nem reutilizes esta assinatura como chave de produção.

Para preparar a OTA antes da primeira instalação que pretendes manter:

1. Cria/inicia sessão numa conta Expo e cria um projeto EAS para esta aplicação. Obtém o UUID do projeto EAS. O UUID é configuração pública, não é um segredo. Não é necessário usar EAS Build; a compilação Android continua a ocorrer no GitHub Actions.
2. Em GitHub → **Settings → Secrets and variables → Actions**, cria a variável `EXPO_PUBLIC_EAS_PROJECT_ID` com esse UUID e o segredo `EXPO_TOKEN` com um token pessoal Expo. Cria também `EXPO_PUBLIC_EAS_PROJECT_ID` no ambiente **preview** nas variáveis do projeto Expo/EAS. O fluxo OTA usa esse ambiente para construir o bundle no SDK atual. Quando ligares backend, configura `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` e `EXPO_PUBLIC_API_URL` com os mesmos valores públicos tanto nas GitHub Actions Variables como no ambiente Expo **preview**; são valores incorporados na app e não são segredos. Não coloques o token em `.env`, no código ou no chat. Localmente, podes colocar o UUID no `.env` ignorado pelo Git para validar `npx expo config --type public`.
3. Cria a chave de assinatura no teu Mac, num local fora do repositório. O comando pede a palavra-passe de forma interativa:

   ```sh
   keytool -genkeypair -v -keystore "$HOME/reward-app-release.jks" -alias reward-app -keyalg RSA -keysize 2048 -validity 10000
   ```

   Guarda uma cópia de segurança protegida. Em **GitHub → Settings → Secrets and variables → Actions → Secrets**, adiciona `ANDROID_KEYSTORE_PASSWORD` e `ANDROID_KEY_PASSWORD` com a palavra-passe que escolheste, `ANDROID_KEY_ALIAS` com `reward-app`, e `ANDROID_KEYSTORE_BASE64` com o conteúdo codificado da keystore. No macOS podes copiar esse conteúdo diretamente para a área de transferência sem o imprimir no terminal: `base64 < "$HOME/reward-app-release.jks" | pbcopy`. Nunca guardes a keystore, a palavra-passe ou o conteúdo base64 no repo/chat. A pipeline exige o UUID EAS e estes quatro segredos antes de gerar APK.
4. Faz push do código para `main` ou executa **Actions → Android APK → Run workflow**. Em cada push à `main`, o workflow corre typecheck/testes e gera o artefacto `familia-em-pontos-apk` (retenção de 14 dias). Instala essa primeira APK OTA no telemóvel e mantém a instalação. O workflow não publica na Play Store: o APK fica para descarregar no GitHub Actions.
5. Em cada push à `main`, o workflow **Expo OTA preview** corre typecheck/testes e publica mudanças para o canal `preview`. Também podes executá-lo manualmente e fornecer uma descrição. A aplicação verifica atualizações ao abrir e espera até 5 segundos pela transferência antes de iniciar com a versão instalada. Se a transferência terminar dentro desse período, a nova versão pode abrir logo; se não, fica ativa na abertura seguinte. Sem rede ou sem o serviço acessível, mantém a versão instalada. Este canal é de ensaio, não distribuição pública.

OTA pode atualizar JavaScript e assets compatíveis com o código nativo já instalado. Não instala bibliotecas nativas, não altera permissões ou o esquema Android, não muda configuração nativa de login e não substitui a assinatura Android. Para essas mudanças, incrementa `expo.version` em `app.json`, compila e assina outro APK com a mesma keystore, e instala-o por cima da app existente. A política `runtimeVersion: appVersion` separa essas versões nativas de forma a evitar enviar um update de runtime incompatível. O workflow recusa publicar OTA quando deteta configuração/dependências nativas alteradas sem incremento de versão. O APK local de ensaio foi criado sem UUID EAS, por isso tem OTA desativada; para testar OTA, é necessário instalar o APK da pipeline depois de configurar a conta e a keystore.

O canal `preview` foi escolhido para ensaios. Não publicar dados reais nem assumir que a conta EAS, os limites gratuitos, armazenamento de artefactos ou a distribuição são gratuitos para sempre. O workflow OTA ainda não foi executado: requer a conta EAS, `EXPO_TOKEN` e o UUID acima.

## 4. Validar antes de dados reais

- Num projeto de teste, aplica as migrações e verifica privilégios efetivos, RLS e invocação das funções com as versões Supabase/PostgREST ativas. Revê especialmente as funções `security definer`, que verificam explicitamente o utilizador e usam `search_path` fixo.
- Instala o APK em dois dispositivos, inicia sessão com dois adultos de teste, cria uma família, partilha e aceita um convite, verifica sincronização manual, expiração, revogação e reutilização do convite. Testa uma terceira conta sem acesso. Confirma que nenhum segredo nem token aparece em logs.
- Cria dados fictícios, regista e corrige movimentos, edita definições e verifica que os movimentos anteriores não mudam. Testa 75 − 70 = 5, saldo insuficiente e resgates em simultâneo. Simula perda de rede durante um pedido: a app mantém o identificador pendente em armazenamento seguro e oferece **Tentar operação novamente** com a mesma conta. Se não for possível confirmar um pedido anterior, não cries uma nova operação equivalente até reconciliar o histórico.
- Verifica permissões de armazenamento da sessão, recuperação após reinício, saída e mudança de conta. Revê limites gratuitos atuais, política de privacidade, retenção, recuperação e cópias de segurança antes de guardar dados de crianças.

## Modelo e testes locais

As tabelas estão isoladas por família com RLS; chaves compostas impedem associações entre famílias. O saldo e o livro-razão são alterados numa transação, com bloqueio por criança e chave de idempotência; a correção é um novo movimento. A criação de família, criança, comportamento e recompensa usa igualmente um identificador de pedido persistido; após falha, a app oferece confirmar a criação pendente com a mesma conta. Os testes locais não substituem o teste de recuperação de rede com o Supabase real. O convite é aleatório, guardado como hash, expira após 24 horas e pode ser revogado ou usado uma vez. As políticas e permissões devem ser revistas no ambiente real.

Os testes de banco requerem uma **base descartável** com PostgreSQL: aplica `supabase/tests/bootstrap.sql`, as quatro migrações por ordem e depois `supabase/tests/security.sql` e `supabase/tests/creation.sql`; executa `supabase/tests/concurrency.sh` com `DATABASE_URL` apontado para a base descartável. O script de concorrência insere dados fictícios e não os remove. O GitHub Actions corre estes testes numa instância isolada.
