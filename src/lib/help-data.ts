export interface HelpArticle {
  id: string
  title: string
  content: string
  category: string
  keywords: string[]
}

export interface HelpCategory {
  id: string
  label: string
  icon: string
}

export const categories: HelpCategory[] = [
  { id: 'getting-started', label: 'Primeiros Passos', icon: 'rocket' },
  { id: 'links', label: 'Links', icon: 'link' },
  { id: 'qr-codes', label: 'QR Codes', icon: 'qr' },
  { id: 'campaigns', label: 'Campanhas', icon: 'campaign' },
  { id: 'analytics', label: 'Analytics', icon: 'chart' },
  { id: 'domains', label: 'Domínios', icon: 'globe' },
  { id: 'api', label: 'API', icon: 'code' },
  { id: 'account', label: 'Conta', icon: 'user' },
]

export const articles: HelpArticle[] = [
  // Getting Started
  {
    id: 'what-is-123bit',
    title: 'O que é o 123bit?',
    content: `O 123bit é uma plataforma de encurtamento de URLs com analytics avançado. Com ele você pode:

• Criar links curtos personalizados com domínios próprios
• Gerar QR Codes customizados
• Criar campanhas de marketing rastreáveis
• Acompanhar cliques, localização, dispositivos e muito mais
• Integrar com pixels de rastreamento (Meta, Google, TikTok, LinkedIn)
• Gerenciar tudo via API

O plano gratuito permite criar até 50 links com analytics completo.`,
    category: 'getting-started',
    keywords: ['o que é', 'sobre', 'funcionalidades', 'plano gratuito', 'começar'],
  },
  {
    id: 'create-first-link',
    title: 'Como criar meu primeiro link',
    content: `Para criar seu primeiro link:

1. Acesse o menu "Meus Links" na barra lateral
2. Clique no botão "Novo Link"
3. Cole a URL longa no campo "URL Original"
4. (Opcional) Personalize o código curto
5. (Opcional) Adicione título, descrição ou tags
6. Clique em "Criar Link"

O link estará pronto para uso imediatamente. Você pode copiar e compartilhar.`,
    category: 'getting-started',
    keywords: ['primeiro link', 'criar link', 'como criar', 'novo link', 'começar'],
  },
  {
    id: 'dashboard-overview',
    title: 'Entendendo o Dashboard',
    content: `O Dashboard é sua visão geral da conta:

• **Total de Links**: Quantidade de links criados
• **Total de Cliques**: Soma de todos os cliques nos seus links
• **Gráfico de Cliques**: Evolução temporal dos cliques
• **Links Recentes**: Seus links mais recentes com estatísticas rápidas
• **Top Links**: Os links com mais cliques

Use o Dashboard para ter uma visão rápida do desempenho dos seus links.`,
    category: 'getting-started',
    keywords: ['dashboard', 'painel', 'visão geral', 'estatísticas', 'gráfico'],
  },

  // Links
  {
    id: 'custom-short-code',
    title: 'Como personalizar o código curto do link',
    content: `Ao criar ou editar um link, você pode definir um código curto personalizado:

1. No campo "Código Personalizado", digite o texto desejado
2. Use apenas letras, números e hífens
3. O código deve ser único na plataforma

Exemplo: com código "minha-promo", o link ficará:
123b.it/minha-promo

Se o código já estiver em uso, você receberá um aviso.`,
    category: 'links',
    keywords: ['personalizar', 'código curto', 'slug', 'customizar', 'link customizado'],
  },
  {
    id: 'link-tags',
    title: 'Organizando links com Tags',
    content: `Tags ajudam a organizar seus links:

1. Ao criar ou editar um link, adicione tags
2. Clique em "Nova Tag" para criar uma tag
3. Escolha uma cor para cada tag
4. Filtre seus links por tags na página "Meus Links"

Exemplo de uso: "black-friday", "instagram", "email-marketing".`,
    category: 'links',
    keywords: ['tags', 'organizar', 'categorizar', 'etiquetas', 'filtrar links'],
  },
  {
    id: 'link-password',
    title: 'Protegendo links com senha',
    content: `Você pode proteger um link com senha:

1. Ao criar ou editar um link, ative a opção "Protegido por Senha"
2. Defina uma senha
3. Quem acessar o link precisará informar a senha

Ideal para conteúdos restritos ou compartilhamento privado.`,
    category: 'links',
    keywords: ['senha', 'proteger', 'privado', 'restrito', 'segurança link'],
  },
  {
    id: 'link-expiration',
    title: 'Configurando expiração de links',
    content: `Configure links para expirar automaticamente:

• **Data de Início**: O link só funciona a partir desta data
• **Data de Expiração**: O link para de funcionar após esta data
• **Limite de Cliques**: O link desativa após atingir o número máximo de cliques

Útil para promoções temporárias ou conteúdo com prazo.`,
    category: 'links',
    keywords: ['expirar', 'validade', 'prazo', 'temporário', 'limite cliques'],
  },
  {
    id: 'utm-parameters',
    title: 'Adicionando parâmetros UTM',
    content: `Parâmetros UTM ajudam a rastrear a origem do tráfego:

• **utm_source**: De onde vem o tráfego (ex: google, facebook)
• **utm_medium**: Canal (ex: cpc, email, social)
• **utm_campaign**: Nome da campanha
• **utm_term**: Termo pago (para buscas)
• **utm_content**: Variação do anúncio

Preencha os UTMs ao criar o link para rastreamento completo no Google Analytics.`,
    category: 'links',
    keywords: ['utm', 'rastreamento', 'google analytics', 'campanha', 'fonte'],
  },

  // QR Codes
  {
    id: 'generate-qr-code',
    title: 'Como gerar um QR Code',
    content: `Todo link criado no 123bit gera automaticamente um QR Code:

1. Crie ou selecione um link existente
2. Clique no ícone de QR Code
3. Personalize cores, estilo dos cantos e adicione logo
4. Baixe em PNG ou SVG

O QR Code redireciona para o link curto, mantendo todos os analytics.`,
    category: 'qr-codes',
    keywords: ['qr code', 'gerar qr', 'código qr', 'download qr', 'baixar qr'],
  },
  {
    id: 'customize-qr-code',
    title: 'Personalizando o QR Code',
    content: `Personalize seu QR Code para combinar com sua marca:

• **Cor do primeiro plano**: Cor dos módulos (pontos)
• **Cor de fundo**: Cor do fundo do QR Code
• **Estilo dos cantos**: Quadrado, arredondado ou circular
• **Logo**: Adicione sua marca no centro
• **Nível de correção de erro**: M (médio) ou H (alto, recomendado com logo)

Dica: Use cores com bom contraste para garantir a leitura.`,
    category: 'qr-codes',
    keywords: ['personalizar qr', 'cores qr', 'logo qr', 'estilo qr', 'customizar qr'],
  },

  // Campaigns
  {
    id: 'create-campaign',
    title: 'Criando uma campanha',
    content: `Campanhas agrupam links relacionados:

1. Acesse "Campanhas" na barra lateral
2. Clique em "Nova Campanha"
3. Dê um nome e descrição
4. Ao criar links, associe à campanha

Exemplo: Crie uma campanha "Black Friday 2024" e associe todos os links relacionados.`,
    category: 'campaigns',
    keywords: ['campanha', 'criar campanha', 'agrupar links', 'organizar campanhas'],
  },
  {
    id: 'campaign-analytics',
    title: 'Analytics de campanhas',
    content: `Cada campanha tem seu próprio painel de analytics:

• Total de cliques da campanha
• Links mais performáticos
• Distribuição geográfica
• Dispositivos e navegadores
• Gráfico de evolução temporal

Acesse clicando na campanha desejada.`,
    category: 'campaigns',
    keywords: ['analytics campanha', 'estatísticas campanha', 'performance campanha'],
  },

  // Analytics
  {
    id: 'understanding-analytics',
    title: 'Entendendo os Analytics',
    content: `Os analytics do 123bit fornecem dados detalhados sobre cada clique:

• **Localização**: País e cidade do visitante
• **Dispositivo**: Mobile, Tablet ou Desktop
• **Sistema Operacional**: iOS, Android, Windows, macOS
• **Navegador**: Chrome, Safari, Firefox, etc.
• **Referenciador**: De onde veio o visitante
• **Timestamp**: Data e hora exata do clique

Esses dados ajudam a entender seu público e otimizar suas campanhas.`,
    category: 'analytics',
    keywords: ['analytics', 'estatísticas', 'dados', 'métricas', 'relatórios', 'cliques'],
  },
  {
    id: 'export-analytics',
    title: 'Exportando dados de analytics',
    content: `Você pode exportar os dados de analytics:

1. Acesse os detalhes de um link
2. Clique em "Exportar" ou "Download CSV"
3. Os dados serão baixados em formato CSV

Ideal para análises avançadas em planilhas ou BI.`,
    category: 'analytics',
    keywords: ['exportar', 'download', 'csv', 'planilha', 'relatório'],
  },

  // Domains
  {
    id: 'add-custom-domain',
    title: 'Adicionando um domínio personalizado',
    content: `Use seu próprio domínio para links curtos:

1. Acesse Configurações > Domínios
2. Clique em "Adicionar Domínio"
3. Digite seu domínio (ex: links.suaempresa.com)
4. Configure os registros DNS conforme as instruções
5. Aguarde a verificação (pode levar até 48h)

Após verificado, selecione o domínio ao criar links.`,
    category: 'domains',
    keywords: ['domínio', 'domínio personalizado', 'dns', 'verificação', 'cname'],
  },
  {
    id: 'ssl-domains',
    title: 'SSL em domínios personalizados',
    content: `Todos os domínios personalizados recebem SSL automaticamente:

• O certificado é provisionado após a verificação DNS
• Status: Pendente → Ativo (pode levar alguns minutos)
• Não é necessário configurar nada manualmente

Se o SSL não ativar após 24h, entre em contato com o suporte.`,
    category: 'domains',
    keywords: ['ssl', 'https', 'certificado', 'segurança domínio'],
  },

  // API
  {
    id: 'generate-api-key',
    title: 'Gerando uma chave de API',
    content: `Chaves de API permitem integração com seus sistemas:

1. Acesse Configurações > Chaves de API
2. Clique em "Nova Chave"
3. Dê um nome descritivo (ex: "App Mobile")
4. (Opcional) Defina uma data de expiração
5. Copie a chave imediatamente — ela não será exibida novamente

Guarde a chave em local seguro. Se perder, gere uma nova e revogue a antiga.`,
    category: 'api',
    keywords: ['api key', 'chave api', 'token', 'integração', 'gerar chave'],
  },
  {
    id: 'api-documentation',
    title: 'Documentação da API',
    content: `A API do 123bit permite:

• Criar, listar, atualizar e deletar links
• Gerenciar tags, campanhas e domínios
• Acessar analytics programaticamente
• Gerenciar QR Codes

Base URL: https://123b.it/api

Autenticação: Header "Authorization: Bearer SUA_CHAVE_API"

Exemplo de criação de link:
POST /api/links
Body: { "url": "https://exemplo.com" }

Acesse a documentação completa em /docs/api.`,
    category: 'api',
    keywords: ['documentação api', 'endpoints', 'referência api', 'como usar api'],
  },

  // Account
  {
    id: 'change-password',
    title: 'Alterando sua senha',
    content: `Para alterar sua senha:

1. Clique no seu nome na barra lateral
2. Clique em "Alterar senha de acesso"
3. Informe a senha atual
4. Defina a nova senha (mínimo 8 caracteres)
5. Confirme a nova senha
6. Clique em "Definir Nova Senha"

Se esqueceu a senha, entre em contato com o suporte.`,
    category: 'account',
    keywords: ['senha', 'alterar senha', 'trocar senha', 'nova senha'],
  },
  {
    id: 'enable-2fa',
    title: 'Ativando autenticação em dois fatores (2FA)',
    content: `Adicione uma camada extra de segurança:

1. Acesse Configurações > Segurança
2. Clique em "Ativar 2FA"
3. Escaneie o QR Code com seu app autenticador (Google Authenticator, Authy)
4. Insira o código de verificação
5. Salve os códigos de backup em local seguro

Com 2FA ativo, você precisará do código do app além da senha para fazer login.`,
    category: 'account',
    keywords: ['2fa', 'dois fatores', 'autenticação', 'segurança', 'google authenticator'],
  },
  {
    id: 'plan-limits',
    title: 'Limites do plano gratuito',
    content: `O plano FREE inclui:

• Até 50 links
• Até 1.000 cliques/mês rastreados
• Analytics completo
• QR Codes
• 1 domínio personalizado

Para limites maiores, considere o upgrade para PRO ou ENTERPRISE.`,
    category: 'account',
    keywords: ['limites', 'plano gratuito', 'free', 'upgrade', 'quantos links'],
  },
  {
    id: 'change-avatar',
    title: 'Alterando foto de perfil',
    content: `Para alterar sua foto de perfil:

1. Clique no seu nome na barra lateral
2. Clique na imagem de perfil (avatar)
3. Selecione uma imagem do seu computador
4. A imagem deve ser JPG, PNG ou WebP (máx. 5MB)
5. O upload é automático

A nova imagem aparecerá na barra lateral e na página de configurações.`,
    category: 'account',
    keywords: ['foto', 'avatar', 'perfil', 'imagem perfil', 'foto perfil'],
  },
  {
    id: 'bio-pages',
    title: 'Criando uma Bio Page',
    content: `Bio Pages são páginas estilo "link na bio" para redes sociais:

1. Acesse "Minhas Bios" na barra lateral
2. Clique em "Nova Bio"
3. Personalize título, descrição e tema
4. Adicione links (redes sociais, sites, etc.)
5. Publique e compartilhe o link

Ideal para Instagram, TikTok e outras redes sociais.`,
    category: 'getting-started',
    keywords: ['bio', 'bio page', 'link na bio', 'página bio', 'redes sociais'],
  },
  {
    id: 'health-monitor',
    title: 'Health Monitor',
    content: `O Health Monitor verifica se seus links de destino estão funcionando:

• Verifica periodicamente a disponibilidade do URL original
• Alerta se o destino retornar erro (4xx, 5xx)
• Mostra o último check e o status

Acesse "Health Monitor" na barra lateral para ver o status de todos os links.`,
    category: 'links',
    keywords: ['health', 'monitor', 'saúde', 'verificar', 'destino offline', 'erro link'],
  },
  {
    id: 'tracking-pixels',
    title: 'Configurando pixels de rastreamento',
    content: `Pixels de rastreamento permitem retargeting:

1. Acesse Configurações > Pixels de Rastreamento
2. Adicione seu ID do pixel:
   • Meta Pixel (Facebook/Instagram)
   • Google Tag (Google Ads)
   • TikTok Pixel
   • LinkedIn Tag
3. Associe pixels a links específicos ao criar/editar

Quando alguém clicar no link, o pixel será disparado para retargeting.`,
    category: 'links',
    keywords: ['pixel', 'rastreamento', 'meta pixel', 'facebook pixel', 'google tag', 'tiktok', 'linkedin', 'retargeting'],
  },
  {
    id: 'webhooks',
    title: 'Configurando Webhooks',
    content: `Webhooks enviam notificações em tempo real:

1. Acesse Configurações > Webhooks
2. Clique em "Novo Webhook"
3. Informe a URL do seu endpoint
4. Selecione os eventos desejados:
   • link.created
   • link.clicked
   • link.deleted
5. (Opcional) Defina um secret para validação

Seu endpoint receberá POST requests com os dados do evento.`,
    category: 'api',
    keywords: ['webhook', 'notificação', 'evento', 'endpoint', 'integração tempo real'],
  },
  {
    id: 'workspaces',
    title: 'Usando Workspaces',
    content: `Workspaces permitem organizar projetos separadamente:

1. Acesse "Workspaces" na barra lateral
2. Crie um novo workspace
3. Cada workspace tem seus próprios links, campanhas e analytics
4. Alterne entre workspaces pelo seletor na barra lateral

Ideal para agências ou quem gerencia múltiplos projetos.`,
    category: 'getting-started',
    keywords: ['workspace', 'espaço de trabalho', 'projeto', 'organizar', 'agência'],
  },
]
