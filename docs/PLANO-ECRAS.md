# Plano dos ecrãs da Reward App

As imagens em `design/` são referências visuais. A versão local usa dados fictícios em memória; a família partilhada depende das contas e de testes reais. A lista distingue trabalho feito, em curso e por fazer.

## 1. Base visual e navegação

- [x] Paleta comum, cabeçalhos, indicadores, cartões, ilustrações, campos, botões, navegação e histórico reutilizáveis; textos dos campos têm rótulos acessíveis e exemplos.
- [~] Rever visualmente a demonstração Android com letra ampliada (escala 1,3): em 411 × 914 dp, início, família, lista/detalhe/confirmação/sucesso de recompensa, formulários, comportamentos e histórico; em 360 × 800 dp, início, família, filtros e nomes longos, registo, lista/detalhe/confirmação e formulário de criança. Falta validar outros tamanhos/dispositivos e toda a acessibilidade.
- [~] Comparar os ecrãs principais com os mockups em Android; a navegação inferior e a grelha da família foram ajustadas para 360 dp. Falta uma revisão sistemática dos restantes ecrãs em mais resoluções e com outros conteúdos longos.

## 2. Entrada e família

- [x] Demonstração local e ecrã inicial de entrada para conta partilhada.
- [x] Criar ecrãs separados para escolher, criar família e aceitar convite; validação com contas reais pendente.
- [x] Ilustrar boas-vindas e início com imagem decorativa gerada por IA; avatares continuam a ser opções fixas e não são gerados por IA.
- [x] Criar ecrã próprio para gerar, partilhar e revogar convite no modo partilhado.
- [ ] Validar expiração, revogação e uso real com contas de teste.
- [~] Apresentar família, crianças e nomes dos adultos; definir regras de papéis e remoção antes de implementar remoções.
- [ ] Configurar Google/Supabase nas contas próprias e testar sessão e convite em dois dispositivos.

## 3. Crianças e início

- [x] Adicionar criança com nome e avatar predefinido; editar no modo partilhado.
- [x] Acrescentar edição de criança no modo de demonstração e estados vazios no perfil.
- [x] Demonstração: perfil com saldo, recompensas associadas, atividades recentes e acesso ao registo.
- [x] Aplicar o perfil ao modo partilhado; validação real pendente.
- [x] Mostrar uma recompensa sugerida e respetivo progresso nos cartões de início.
- [~] Rever navegação em Android com texto ampliado; confirmar a navegação restante em ecrãs/dispositivos adicionais.

## 4. Comportamentos e histórico

- [x] Criar comportamentos distintos positivos e a melhorar, registar e consultar histórico; edição no modo partilhado.
- [x] Completar edição no modo de demonstração e seleção de ícone nos dois modos.
- [x] Ecrãs próprios de criação/edição e confirmação do registo em ambos os modos; validação com serviços reais pendente.
- [x] Histórico agrupado por data, filtro por criança e indicação de correções; mantém movimentos originais e autor. Validação real pendente.
- [ ] Confirmar regras pendentes para saldo negativo e correções depois de resgates.

## 5. Recompensas e resgate

- [x] Criar recompensa com uma ou mais crianças e calcular progresso a partir do saldo.
- [x] Demonstração: apresentar progresso em barras na lista e detalhe.
- [x] Completar edição de recompensas no modo de demonstração.
- [x] Demonstração: ecrãs próprios de detalhe, confirmação e sucesso, com saldo antes/depois.
- [x] Aplicar o percurso ao modo partilhado com transações e erros de rede; teste real pendente.
- [x] Validar na demonstração Android: 75 − 70 = 5, saldo insuficiente e cancelamento sem alterar o saldo; progresso atualizado para 7%. As regras de saldo e sugestão têm testes automatizados.
- [ ] Validar o percurso partilhado em dois Androids com contas e dados fictícios.
- [ ] Confirmar se as recompensas são repetíveis e se existe reserva de pontos.

## 6. Integração, testes e distribuição

- [~] Fluxos principais alinhados entre demonstração e modo partilhado; testar mudança de conta e família com contas reais.
- [x] Preparar criações idempotentes de famílias, crianças, comportamentos e recompensas, com recuperação de pedidos pendentes e testes PostgreSQL locais.
- [ ] Validar a recuperação de criações com rede instável em Supabase real e no Android.
- [ ] Rever autenticação, RLS, convites, concorrência e segurança num projeto Supabase de teste.
- [~] Preparar GitHub Actions para APK assinado e OTA no canal preview; falta configurar UUID/token Expo e keystore de release nas contas próprias.
- [~] Gerar e instalar APK autónomo local ARM64 de ensaio com assinatura debug. Falta instalar no telemóvel e validar a APK oficial com assinatura e OTA EAS.
- [ ] Testar família partilhada em dois Androids, acessibilidade e rede instável.
- [ ] Definir relatórios, alertas, offline e retenção antes de os implementar.

Não guardar dados pessoais nem segredos no repositório. A hipótese provisória de saldos negativos não é uma decisão confirmada.
