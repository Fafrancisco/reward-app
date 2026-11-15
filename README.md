# Família em Pontos

Aplicação Android em português de Portugal, com Expo, React Native e TypeScript. A demonstração funciona com dados fictícios em memória; ao reiniciar, as alterações desaparecem. A interface de família partilhada está implementada, mas **precisa de projetos e credenciais próprios e ainda não foi validada de ponta a ponta**. Usa apenas dados de demonstração até terminar os testes indicados em [Configuração e validação](docs/IMPLEMENTACAO.md).

## Experimentar localmente

Com Node.js 22: `npm ci`, `npm test`, `npm run typecheck`, `npm start`. Abrir a demonstração no Expo Go compatível ou num emulador. Para o login Google com URL própria, usa uma build de desenvolvimento ou um APK: o Expo Go não permite testar o esquema personalizado da mesma forma. Na demonstração, um resgate de 70 pontos de um saldo de 75 deixa 5.

Em **Família → Entrar para partilhar família** estão os ecrãs de autenticação, criação de família e convite. Sem a configuração abaixo, não há ligação real; os dados de demonstração nunca são enviados automaticamente para a família partilhada.

## Configuração de contas

Os passos completos, variáveis públicas, migrações, regras provisórias e testes estão em [docs/IMPLEMENTACAO.md](docs/IMPLEMENTACAO.md). Não partilhes segredos no chat nem os coloques no repositório. Nunca uses a chave de serviço Supabase na aplicação ou na API.

## APK no GitHub Actions

O workflow executa testes em push/PR e, em cada push à `main`, gera automaticamente um APK de release diretamente no runner, sem EAS Build. Também pode ser iniciado manualmente em **Actions → Android APK → Run workflow**. Configura primeiro um projeto Expo/EAS, a variável de Actions `EXPO_PUBLIC_EAS_PROJECT_ID`, a mesma variável no ambiente Expo `preview` e o segredo Actions `EXPO_TOKEN`; configura também os quatro segredos de assinatura `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` e `ANDROID_KEY_PASSWORD`. As variáveis públicas Supabase/Vercel são opcionais para a demonstração e estão listadas em `docs/IMPLEMENTACAO.md`. Gera a keystore de release com `keytool` numa máquina segura, guarda uma cópia protegida fora do repositório e usa base64 apenas para preencher o segredo. Nunca registes a keystore ou palavras-passe no Git nem no chat. Perder a chave impede instalar futuras APKs por cima da mesma app. Descarrega o artefacto `familia-em-pontos-apk` no resumo do workflow; fica disponível por 14 dias. O identificador Android ainda é provisório e deve ser escolhido antes da distribuição.

### Atualizações OTA

Depois de instalar a primeira APK de release configurada com EAS Updates, cada push à `main` publica automaticamente as alterações no canal `preview`; também podes publicar manualmente em **Actions → Expo OTA preview → Run workflow**. O dispositivo verifica a atualização ao abrir a app e espera até 5 segundos pela transferência. Se esta for mais lenta, mantém a versão instalada e ativa a atualização numa abertura seguinte. Alterações nativas, dependências Expo nativas, permissões, esquema de login, identificador do Android ou uma nova versão compatível exigem outra APK. A instalação inicial tem de incluir `expo-updates` e o mesmo projeto/canal/runtime; a APK de depuração local não recebe estas OTA. Mais passos e limites estão em [docs/IMPLEMENTACAO.md](docs/IMPLEMENTACAO.md).

O APK local de ensaio está em `android/app/build/outputs/apk/release/app-release.apk`. Foi assinado com a chave Android de desenvolvimento apenas para instalação e teste; **desinstala-o antes da APK oficial**, porque essa chave não é a de release. A primeira APK OTA e o workflow de Actions precisam de EAS ID e segredos configurados. Builds, minutos e retenção de artefactos estão sujeitos aos limites e preços atuais do GitHub; Expo, Supabase e Vercel também têm quotas e restrições nos planos gratuitos. Não se garante custo zero.
