export interface ApiEndpoint {
  id: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  title: string
  description: string
  auth: boolean
  category: string
  pathParams?: { name: string; type: string; description: string; required: boolean }[]
  queryParams?: { name: string; type: string; description: string; required: boolean; default?: string; example?: string }[]
  bodyFields?: { name: string; type: string; description: string; required: boolean; example?: string; default?: string }[]
  responseExample: string
  curlExample: string
  notes?: string
}

export const apiCategories = [
  { id: 'getting-started', label: 'Começando', icon: 'rocket' },
  { id: 'authentication', label: 'Autenticação', icon: 'lock' },
  { id: 'links', label: 'Links', icon: 'link' },
  { id: 'analytics', label: 'Analytics', icon: 'chart' },
  { id: 'qr-codes', label: 'QR Codes', icon: 'qr' },
  { id: 'campaigns', label: 'Campanhas', icon: 'campaign' },
  { id: 'domains', label: 'Domínios', icon: 'globe' },
  { id: 'bio-pages', label: 'Bio Pages', icon: 'user' },
  { id: 'workspaces', label: 'Workspaces', icon: 'workspace' },
  { id: 'user', label: 'Usuário', icon: 'account' },
  { id: 'api-keys', label: 'API Keys', icon: 'key' },
  { id: 'webhooks', label: 'Webhooks', icon: 'webhook' },
  { id: 'health', label: 'Health Monitor', icon: 'health' },
  { id: 'redirect-rules', label: 'Regras de Redirecionamento', icon: 'rules' },
]

export const apiEndpoints: ApiEndpoint[] = [
  // ==================== GETTING STARTED ====================
  {
    id: 'intro',
    method: 'GET',
    path: '',
    title: 'Introdução à API',
    description: `A API do 123bit permite integrar seus sistemas com nossa plataforma de encurtamento de URLs. Com ela, você pode criar links, gerar QR Codes, gerenciar campanhas, acessar analytics e muito mais — tudo programaticamente.

**Base URL:** A API está disponível no mesmo domínio da aplicação. Todos os endpoints começam com \`/api\`.

**Formato:** Todas as requisições e respostas usam JSON.

**Rate Limiting:** Respeite os limites do seu plano para evitar bloqueios temporários.`,
    auth: false,
    category: 'getting-started',
    responseExample: '',
    curlExample: '',
  },
  {
    id: 'auth-header',
    method: 'GET',
    path: '',
    title: 'Autenticação via Header',
    description: `A maioria dos endpoints requer autenticação. Inclua sua API Key no header de cada requisição:

\`\`\`
Authorization: Bearer SUA_CHAVE_API
\`\`\`

**Como obter sua chave:**
1. Acesse Configurações > Chaves de API no painel
2. Clique em "Nova Chave"
3. Dê um nome descritivo
4. Copie a chave — ela só é exibida uma vez

**Exemplo de requisição autenticada:**

\`\`\`bash
curl -H "Authorization: Bearer sua-chave-aqui" \\
  https://seu-dominio.com/api/user/profile
\`\`\`

Se a chave estiver ausente ou inválida, a API retornará \`401 Unauthorized\`.`,
    auth: false,
    category: 'getting-started',
    responseExample: '',
    curlExample: '',
  },

  // ==================== AUTHENTICATION ====================
  {
    id: 'register',
    method: 'POST',
    path: '/api/auth/register',
    title: 'Registrar nova conta',
    description: 'Cria uma nova conta de usuário com plano gratuito (FREE).',
    auth: false,
    category: 'authentication',
    bodyFields: [
      { name: 'email', type: 'string', description: 'Email do usuário', required: true, example: 'usuario@email.com' },
      { name: 'password', type: 'string', description: 'Senha (mínimo 8 caracteres)', required: true, example: 'minhaSenha123' },
      { name: 'name', type: 'string', description: 'Nome completo (opcional)', required: false, example: 'João Silva' },
    ],
    responseExample: JSON.stringify({
      user: {
        id: 'abc123',
        name: 'João Silva',
        email: 'usuario@email.com',
        plan: 'FREE',
        createdAt: '2024-01-15T10:30:00.000Z',
      },
    }, null, 2),
    curlExample: `curl -X POST https://seu-dominio.com/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "João Silva",
    "email": "usuario@email.com",
    "password": "minhaSenha123"
  }'`,
  },

  // ==================== LINKS ====================
  {
    id: 'create-link',
    method: 'POST',
    path: '/api/links',
    title: 'Criar um link',
    description: 'Cria um novo link encurtado associado à sua conta.',
    auth: true,
    category: 'links',
    bodyFields: [
      { name: 'originalUrl', type: 'string', description: 'URL de destino completa (com http/https)', required: true, example: 'https://exemplo.com/pagina-muito-longa' },
      { name: 'shortCode', type: 'string', description: 'Código personalizado para o link curto', required: false, example: 'minha-promo' },
      { name: 'title', type: 'string', description: 'Título descritivo do link', required: false, example: 'Promoção Black Friday' },
      { name: 'description', type: 'string', description: 'Descrição do link', required: false, example: 'Link para a página de promoção' },
      { name: 'utmSource', type: 'string', description: 'Fonte UTM para rastreamento', required: false, example: 'instagram' },
      { name: 'utmMedium', type: 'string', description: 'Meio UTM', required: false, example: 'social' },
      { name: 'utmCampaign', type: 'string', description: 'Campanha UTM', required: false, example: 'black-friday-2024' },
      { name: 'utmTerm', type: 'string', description: 'Termo UTM (para buscas pagas)', required: false, example: 'promoção' },
      { name: 'utmContent', type: 'string', description: 'Conteúdo UTM (variação do anúncio)', required: false, example: 'stories' },
      { name: 'password', type: 'string', description: 'Senha para proteger o link', required: false, example: 'senha123' },
      { name: 'expiresAt', type: 'string', description: 'Data de expiração (ISO 8601)', required: false, example: '2025-12-31T23:59:59Z' },
      { name: 'maxClicks', type: 'number', description: 'Limite máximo de cliques', required: false, example: '1000' },
      { name: 'campaignId', type: 'string', description: 'ID da campanha para associar', required: false, example: 'camp_abc123' },
      { name: 'tagIds', type: 'string[]', description: 'Array de IDs de tags', required: false, example: '["tag_1", "tag_2"]' },
    ],
    responseExample: JSON.stringify({
      link: {
        id: 'link_xyz789',
        shortCode: 'minha-promo',
        shortUrl: 'https://seu-dominio.com/minha-promo',
        originalUrl: 'https://exemplo.com/pagina-muito-longa',
        title: 'Promoção Black Friday',
        isActive: true,
        clickCount: 0,
        createdAt: '2024-01-15T10:30:00.000Z',
      },
    }, null, 2),
    curlExample: `curl -X POST https://seu-dominio.com/api/links \\
  -H "Authorization: Bearer SUA_CHAVE_API" \\
  -H "Content-Type: application/json" \\
  -d '{
    "originalUrl": "https://exemplo.com/pagina-muito-longa",
    "shortCode": "minha-promo",
    "title": "Promoção Black Friday",
    "utmSource": "instagram",
    "utmCampaign": "black-friday-2024"
  }'`,
  },
  {
    id: 'list-links',
    method: 'GET',
    path: '/api/links',
    title: 'Listar links',
    description: 'Retorna todos os links do usuário com paginação e filtros.',
    auth: true,
    category: 'links',
    queryParams: [
      { name: 'page', type: 'number', description: 'Número da página', required: false, default: '1' },
      { name: 'limit', type: 'number', description: 'Itens por página', required: false, default: '20' },
      { name: 'search', type: 'string', description: 'Busca por título, URL ou shortCode', required: false },
      { name: 'tagId', type: 'string', description: 'Filtrar por tag', required: false },
      { name: 'campaignId', type: 'string', description: 'Filtrar por campanha', required: false },
      { name: 'sortBy', type: 'string', description: 'Ordenação: createdAt, clickCount, title', required: false, default: 'createdAt' },
      { name: 'sortOrder', type: 'string', description: 'Direção: asc ou desc', required: false, default: 'desc' },
    ],
    responseExample: JSON.stringify({
      links: [
        {
          id: 'link_abc123',
          shortCode: 'minha-promo',
          shortUrl: 'https://seu-dominio.com/minha-promo',
          originalUrl: 'https://exemplo.com/pagina',
          title: 'Promoção Black Friday',
          clickCount: 156,
          isActive: true,
          tags: [{ id: 'tag_1', name: 'promoção', color: '#8b5cf6' }],
          createdAt: '2024-01-15T10:30:00.000Z',
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 45,
        totalPages: 3,
      },
    }, null, 2),
    curlExample: `curl -X GET "https://seu-dominio.com/api/links?page=1&limit=10" \\
  -H "Authorization: Bearer SUA_CHAVE_API"`,
  },
  {
    id: 'get-link',
    method: 'GET',
    path: '/api/links/:id',
    title: 'Obter um link',
    description: 'Retorna os detalhes de um link específico.',
    auth: true,
    category: 'links',
    pathParams: [
      { name: 'id', type: 'string', description: 'ID do link', required: true },
    ],
    responseExample: JSON.stringify({
      link: {
        id: 'link_abc123',
        shortCode: 'minha-promo',
        shortUrl: 'https://seu-dominio.com/minha-promo',
        originalUrl: 'https://exemplo.com/pagina',
        title: 'Promoção Black Friday',
        description: 'Link da promoção de Black Friday',
        clickCount: 156,
        isActive: true,
        tags: [{ id: 'tag_1', name: 'promoção', color: '#8b5cf6' }],
        qrConfig: { fgColor: '#000000', bgColor: '#FFFFFF', cornerStyle: 'square' },
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
    }, null, 2),
    curlExample: `curl -X GET https://seu-dominio.com/api/links/link_abc123 \\
  -H "Authorization: Bearer SUA_CHAVE_API"`,
  },
  {
    id: 'update-link',
    method: 'PATCH',
    path: '/api/links/:id',
    title: 'Atualizar um link',
    description: 'Atualiza os campos de um link existente. Apenas os campos enviados serão modificados.',
    auth: true,
    category: 'links',
    pathParams: [
      { name: 'id', type: 'string', description: 'ID do link', required: true },
    ],
    bodyFields: [
      { name: 'title', type: 'string', description: 'Novo título', required: false, example: 'Novo Título' },
      { name: 'originalUrl', type: 'string', description: 'Nova URL de destino', required: false, example: 'https://nova-url.com' },
      { name: 'isActive', type: 'boolean', description: 'Ativar ou desativar o link', required: false, example: 'false' },
      { name: 'campaignId', type: 'string', description: 'ID da campanha (null para remover)', required: false, example: 'camp_xyz' },
    ],
    responseExample: JSON.stringify({
      link: {
        id: 'link_abc123',
        shortCode: 'minha-promo',
        title: 'Novo Título',
        isActive: false,
        updatedAt: '2024-01-16T10:30:00.000Z',
      },
    }, null, 2),
    curlExample: `curl -X PATCH https://seu-dominio.com/api/links/link_abc123 \\
  -H "Authorization: Bearer SUA_CHAVE_API" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Novo Título",
    "isActive": false
  }'`,
  },
  {
    id: 'delete-link',
    method: 'DELETE',
    path: '/api/links/:id',
    title: 'Deletar um link',
    description: 'Remove permanentemente um link e todos os seus dados associados.',
    auth: true,
    category: 'links',
    pathParams: [
      { name: 'id', type: 'string', description: 'ID do link', required: true },
    ],
    responseExample: JSON.stringify({ success: true }, null, 2),
    curlExample: `curl -X DELETE https://seu-dominio.com/api/links/link_abc123 \\
  -H "Authorization: Bearer SUA_CHAVE_API"`,
  },
  {
    id: 'public-create-link',
    method: 'POST',
    path: '/api/links/public',
    title: 'Criar link público (sem autenticação)',
    description: 'Cria um link encurtado sem necessidade de autenticação. Ideal para integrações rápidas. O link não é associado a nenhum usuário e não aparece no painel.',
    auth: false,
    category: 'links',
    bodyFields: [
      { name: 'originalUrl', type: 'string', description: 'URL de destino completa', required: true, example: 'https://exemplo.com/pagina' },
    ],
    responseExample: JSON.stringify({
      shortCode: 'aB3xK9m',
      shortUrl: 'https://seu-dominio.com/aB3xK9m',
    }, null, 2),
    curlExample: `curl -X POST https://seu-dominio.com/api/links/public \\
  -H "Content-Type: application/json" \\
  -d '{
    "originalUrl": "https://exemplo.com/pagina"
  }'`,
  },

  // ==================== ANALYTICS ====================
  {
    id: 'link-analytics',
    method: 'GET',
    path: '/api/links/:id/analytics',
    title: 'Analytics de um link',
    description: 'Retorna dados detalhados de analytics de um link: cliques totais, visitantes únicos, distribuição por país, dispositivo, navegador, sistema operacional e referenciadores.',
    auth: true,
    category: 'analytics',
    pathParams: [
      { name: 'id', type: 'string', description: 'ID do link', required: true },
    ],
    queryParams: [
      { name: 'period', type: 'number', description: 'Período em dias (ex: 7, 30, 90)', required: false, default: '30' },
    ],
    responseExample: JSON.stringify({
      summary: {
        totalClicks: 1523,
        uniqueVisitors: 1204,
        botClicks: 45,
        bounceRate: 12.5,
      },
      chartData: [
        { date: '2024-01-01', clicks: 45 },
        { date: '2024-01-02', clicks: 67 },
      ],
      hourlyData: [
        { hour: 0, clicks: 12 },
        { hour: 1, clicks: 8 },
      ],
      clicksByCountry: [
        { country: 'BR', clicks: 890 },
        { country: 'US', clicks: 340 },
      ],
      clicksByDevice: [
        { deviceType: 'MOBILE', clicks: 980 },
        { deviceType: 'DESKTOP', clicks: 500 },
        { deviceType: 'TABLET', clicks: 43 },
      ],
      clicksByBrowser: [
        { browser: 'Chrome', clicks: 890 },
        { browser: 'Safari', clicks: 450 },
      ],
      clicksByOS: [
        { os: 'Android', clicks: 600 },
        { os: 'iOS', clicks: 380 },
        { os: 'Windows', clicks: 350 },
      ],
      topReferers: [
        { referer: 'instagram.com', clicks: 500 },
        { referer: 'direct', clicks: 400 },
      ],
    }, null, 2),
    curlExample: `curl -X GET "https://seu-dominio.com/api/links/link_abc123/analytics?period=30" \\
  -H "Authorization: Bearer SUA_CHAVE_API"`,
  },
  {
    id: 'compare-links',
    method: 'GET',
    path: '/api/links/compare',
    title: 'Comparar links',
    description: 'Compara o desempenho de múltiplos links lado a lado.',
    auth: true,
    category: 'analytics',
    queryParams: [
      { name: 'ids', type: 'string', description: 'IDs dos links separados por vírgula', required: true, example: 'link_1,link_2,link_3' },
    ],
    responseExample: JSON.stringify({
      summary: [
        {
          id: 'link_1',
          title: 'Link A',
          shortCode: 'link-a',
          totalClicks: 500,
          uniqueVisitors: 420,
          createdAt: '2024-01-01T00:00:00Z',
          ctr: 84.0,
        },
        {
          id: 'link_2',
          title: 'Link B',
          shortCode: 'link-b',
          totalClicks: 300,
          uniqueVisitors: 280,
          createdAt: '2024-01-05T00:00:00Z',
          ctr: 93.3,
        },
      ],
    }, null, 2),
    curlExample: `curl -X GET "https://seu-dominio.com/api/links/compare?ids=link_1,link_2,link_3" \\
  -H "Authorization: Bearer SUA_CHAVE_API"`,
  },

  // ==================== QR CODES ====================
  {
    id: 'get-qr',
    method: 'GET',
    path: '/api/links/:id/qr',
    title: 'Obter QR Code',
    description: 'Retorna a imagem do QR Code de um link nos formatos SVG ou PNG. Endpoint público — não requer autenticação.',
    auth: false,
    category: 'qr-codes',
    pathParams: [
      { name: 'id', type: 'string', description: 'ID do link ou shortCode', required: true },
    ],
    queryParams: [
      { name: 'format', type: 'string', description: 'Formato da imagem: svg ou png', required: false, default: 'svg' },
      { name: 'size', type: 'number', description: 'Tamanho em pixels (máx. 1000)', required: false, default: '300' },
    ],
    responseExample: '(Imagem SVG ou PNG)',
    curlExample: `curl -X GET "https://seu-dominio.com/api/links/link_abc123/qr?format=png&size=500" \\
  -o qr-code.png`,
  },
  {
    id: 'get-qr-config',
    method: 'GET',
    path: '/api/links/:id/qr-config',
    title: 'Obter configuração do QR Code',
    description: 'Retorna as configurações atuais de personalização do QR Code de um link.',
    auth: true,
    category: 'qr-codes',
    pathParams: [
      { name: 'id', type: 'string', description: 'ID do link', required: true },
    ],
    responseExample: JSON.stringify({
      qrConfig: {
        id: 'qr_abc123',
        linkId: 'link_abc123',
        fgColor: '#000000',
        bgColor: '#FFFFFF',
        cornerStyle: 'square',
        errorLevel: 'M',
        frameText: 'Escaneie para acessar',
        logoUrl: 'https://exemplo.com/logo.png',
      },
    }, null, 2),
    curlExample: `curl -X GET https://seu-dominio.com/api/links/link_abc123/qr-config \\
  -H "Authorization: Bearer SUA_CHAVE_API"`,
  },
  {
    id: 'update-qr-config',
    method: 'PUT',
    path: '/api/links/:id/qr-config',
    title: 'Atualizar configuração do QR Code',
    description: 'Personaliza as cores, estilo e logo do QR Code. Cria a configuração se não existir (upsert).',
    auth: true,
    category: 'qr-codes',
    pathParams: [
      { name: 'id', type: 'string', description: 'ID do link', required: true },
    ],
    bodyFields: [
      { name: 'fgColor', type: 'string', description: 'Cor dos módulos (formato hex)', required: false, example: '#8b5cf6' },
      { name: 'bgColor', type: 'string', description: 'Cor de fundo (formato hex)', required: false, example: '#ffffff' },
      { name: 'cornerStyle', type: 'string', description: 'Estilo dos cantos: square ou rounded', required: false, example: 'rounded' },
      { name: 'errorLevel', type: 'string', description: 'Nível de correção: L, M, Q, H (use H com logo)', required: false, example: 'H' },
      { name: 'frameText', type: 'string', description: 'Texto na moldura (máx. 40 caracteres)', required: false, example: 'Escaneie aqui' },
      { name: 'logoUrl', type: 'string', description: 'URL do logo no centro (string vazia para remover)', required: false, example: 'https://exemplo.com/logo.png' },
    ],
    responseExample: JSON.stringify({
      qrConfig: {
        id: 'qr_abc123',
        fgColor: '#8b5cf6',
        bgColor: '#ffffff',
        cornerStyle: 'rounded',
        errorLevel: 'H',
        frameText: 'Escaneie aqui',
        logoUrl: 'https://exemplo.com/logo.png',
      },
    }, null, 2),
    curlExample: `curl -X PUT https://seu-dominio.com/api/links/link_abc123/qr-config \\
  -H "Authorization: Bearer SUA_CHAVE_API" \\
  -H "Content-Type: application/json" \\
  -d '{
    "fgColor": "#8b5cf6",
    "cornerStyle": "rounded",
    "errorLevel": "H",
    "logoUrl": "https://exemplo.com/logo.png"
  }'`,
  },

  // ==================== CAMPAIGNS ====================
  {
    id: 'list-campaigns',
    method: 'GET',
    path: '/api/campaigns',
    title: 'Listar campanhas',
    description: 'Retorna todas as campanhas do usuário.',
    auth: true,
    category: 'campaigns',
    queryParams: [
      { name: 'workspaceId', type: 'string', description: 'Filtrar por workspace', required: false },
    ],
    responseExample: JSON.stringify({
      campaigns: [
        {
          id: 'camp_abc123',
          name: 'Black Friday 2024',
          description: 'Campanha de Black Friday',
          createdAt: '2024-01-01T00:00:00Z',
          linkCount: 15,
          totalClicks: 2340,
        },
      ],
    }, null, 2),
    curlExample: `curl -X GET https://seu-dominio.com/api/campaigns \\
  -H "Authorization: Bearer SUA_CHAVE_API"`,
  },
  {
    id: 'create-campaign',
    method: 'POST',
    path: '/api/campaigns',
    title: 'Criar campanha',
    description: 'Cria uma nova campanha para agrupar links relacionados.',
    auth: true,
    category: 'campaigns',
    bodyFields: [
      { name: 'name', type: 'string', description: 'Nome da campanha (obrigatório)', required: true, example: 'Black Friday 2024' },
      { name: 'description', type: 'string', description: 'Descrição da campanha', required: false, example: 'Links da campanha de Black Friday' },
      { name: 'workspaceId', type: 'string', description: 'ID do workspace', required: false },
    ],
    responseExample: JSON.stringify({
      campaign: {
        id: 'camp_abc123',
        name: 'Black Friday 2024',
        description: 'Campanha de Black Friday',
        createdAt: '2024-01-01T00:00:00Z',
      },
    }, null, 2),
    curlExample: `curl -X POST https://seu-dominio.com/api/campaigns \\
  -H "Authorization: Bearer SUA_CHAVE_API" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Black Friday 2024",
    "description": "Campanha de Black Friday"
  }'`,
  },
  {
    id: 'get-campaign',
    method: 'GET',
    path: '/api/campaigns/:id',
    title: 'Obter campanha',
    description: 'Retorna os detalhes de uma campanha incluindo todos os links associados.',
    auth: true,
    category: 'campaigns',
    pathParams: [
      { name: 'id', type: 'string', description: 'ID da campanha', required: true },
    ],
    responseExample: JSON.stringify({
      campaign: {
        id: 'camp_abc123',
        name: 'Black Friday 2024',
        description: 'Campanha de Black Friday',
        totalClicks: 2340,
        links: [
          {
            id: 'link_1',
            shortCode: 'bf-prod1',
            title: 'Produto 1',
            clickCount: 450,
            shortUrl: 'https://seu-dominio.com/bf-prod1',
          },
        ],
      },
    }, null, 2),
    curlExample: `curl -X GET https://seu-dominio.com/api/campaigns/camp_abc123 \\
  -H "Authorization: Bearer SUA_CHAVE_API"`,
  },
  {
    id: 'update-campaign',
    method: 'PATCH',
    path: '/api/campaigns/:id',
    title: 'Atualizar campanha',
    description: 'Atualiza nome e/ou descrição de uma campanha.',
    auth: true,
    category: 'campaigns',
    pathParams: [
      { name: 'id', type: 'string', description: 'ID da campanha', required: true },
    ],
    bodyFields: [
      { name: 'name', type: 'string', description: 'Novo nome (máx. 100 caracteres)', required: false, example: 'Black Friday 2025' },
      { name: 'description', type: 'string', description: 'Nova descrição (máx. 500 caracteres)', required: false },
    ],
    responseExample: JSON.stringify({
      campaign: {
        id: 'camp_abc123',
        name: 'Black Friday 2025',
        description: 'Campanha atualizada',
      },
    }, null, 2),
    curlExample: `curl -X PATCH https://seu-dominio.com/api/campaigns/camp_abc123 \\
  -H "Authorization: Bearer SUA_CHAVE_API" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Black Friday 2025"
  }'`,
  },
  {
    id: 'delete-campaign',
    method: 'DELETE',
    path: '/api/campaigns/:id',
    title: 'Deletar campanha',
    description: 'Remove uma campanha. Os links associados não são deletados, apenas desvinculados.',
    auth: true,
    category: 'campaigns',
    pathParams: [
      { name: 'id', type: 'string', description: 'ID da campanha', required: true },
    ],
    responseExample: JSON.stringify({ success: true }, null, 2),
    curlExample: `curl -X DELETE https://seu-dominio.com/api/campaigns/camp_abc123 \\
  -H "Authorization: Bearer SUA_CHAVE_API"`,
  },
  {
    id: 'add-link-to-campaign',
    method: 'POST',
    path: '/api/campaigns/:id/links',
    title: 'Adicionar link à campanha',
    description: 'Associa um link existente a uma campanha.',
    auth: true,
    category: 'campaigns',
    pathParams: [
      { name: 'id', type: 'string', description: 'ID da campanha', required: true },
    ],
    bodyFields: [
      { name: 'linkId', type: 'string', description: 'ID do link a ser adicionado', required: true, example: 'link_xyz789' },
    ],
    responseExample: JSON.stringify({
      link: {
        id: 'link_xyz789',
        shortCode: 'bf-prod1',
        title: 'Produto 1',
        clickCount: 450,
      },
    }, null, 2),
    curlExample: `curl -X POST https://seu-dominio.com/api/campaigns/camp_abc123/links \\
  -H "Authorization: Bearer SUA_CHAVE_API" \\
  -H "Content-Type: application/json" \\
  -d '{
    "linkId": "link_xyz789"
  }'`,
  },
  {
    id: 'remove-link-from-campaign',
    method: 'DELETE',
    path: '/api/campaigns/:id/links',
    title: 'Remover link da campanha',
    description: 'Desassocia um link de uma campanha. O link não é deletado.',
    auth: true,
    category: 'campaigns',
    pathParams: [
      { name: 'id', type: 'string', description: 'ID da campanha', required: true },
    ],
    bodyFields: [
      { name: 'linkId', type: 'string', description: 'ID do link a ser removido', required: true, example: 'link_xyz789' },
    ],
    responseExample: JSON.stringify({ success: true }, null, 2),
    curlExample: `curl -X DELETE https://seu-dominio.com/api/campaigns/camp_abc123/links \\
  -H "Authorization: Bearer SUA_CHAVE_API" \\
  -H "Content-Type: application/json" \\
  -d '{
    "linkId": "link_xyz789"
  }'`,
  },

  // ==================== DOMAINS ====================
  {
    id: 'list-domains',
    method: 'GET',
    path: '/api/domains',
    title: 'Listar domínios',
    description: 'Retorna todos os domínios personalizados do usuário.',
    auth: true,
    category: 'domains',
    responseExample: JSON.stringify({
      domains: [
        {
          id: 'dom_abc123',
          domain: 'links.minhaempresa.com',
          verified: true,
          txtRecord: '123bit-verify=abc123xyz',
          sslStatus: 'active',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ],
    }, null, 2),
    curlExample: `curl -X GET https://seu-dominio.com/api/domains \\
  -H "Authorization: Bearer SUA_CHAVE_API"`,
  },
  {
    id: 'add-domain',
    method: 'POST',
    path: '/api/domains',
    title: 'Adicionar domínio',
    description: 'Adiciona um novo domínio personalizado. Um registro TXT de verificação será gerado automaticamente.',
    auth: true,
    category: 'domains',
    bodyFields: [
      { name: 'domain', type: 'string', description: 'Nome do domínio (ex: links.empresa.com)', required: true, example: 'links.minhaempresa.com' },
    ],
    responseExample: JSON.stringify({
      domain: {
        id: 'dom_abc123',
        domain: 'links.minhaempresa.com',
        verified: false,
        txtRecord: '123bit-verify=abc123xyz',
        sslStatus: 'pending',
      },
      message: 'Domínio adicionado. Configure o registro TXT para verificar.',
    }, null, 2),
    curlExample: `curl -X POST https://seu-dominio.com/api/domains \\
  -H "Authorization: Bearer SUA_CHAVE_API" \\
  -H "Content-Type: application/json" \\
  -d '{
    "domain": "links.minhaempresa.com"
  }'`,
  },
  {
    id: 'get-deep-links',
    method: 'GET',
    path: '/api/domains/:id/deep-links',
    title: 'Obter configuração de Deep Links',
    description: 'Retorna a configuração de deep linking de um domínio (redirecionamento para apps mobile).',
    auth: true,
    category: 'domains',
    pathParams: [
      { name: 'id', type: 'string', description: 'ID do domínio', required: true },
    ],
    responseExample: JSON.stringify({
      deepLinkConfig: {
        id: 'dl_abc123',
        domainId: 'dom_abc123',
        iosAppId: '1234567890',
        androidPackage: 'com.minhaempresa.app',
        iosStoreUrl: 'https://apps.apple.com/app/id1234567890',
        androidStoreUrl: 'https://play.google.com/store/apps/details?id=com.minhaempresa.app',
      },
    }, null, 2),
    curlExample: `curl -X GET https://seu-dominio.com/api/domains/dom_abc123/deep-links \\
  -H "Authorization: Bearer SUA_CHAVE_API"`,
  },
  {
    id: 'update-deep-links',
    method: 'PUT',
    path: '/api/domains/:id/deep-links',
    title: 'Atualizar configuração de Deep Links',
    description: 'Configura o deep linking de um domínio para redirecionar para apps mobile (iOS/Android).',
    auth: true,
    category: 'domains',
    pathParams: [
      { name: 'id', type: 'string', description: 'ID do domínio', required: true },
    ],
    bodyFields: [
      { name: 'iosAppId', type: 'string', description: 'ID do app iOS (máx. 100 caracteres)', required: false, example: '1234567890' },
      { name: 'androidPackage', type: 'string', description: 'Package name do app Android (máx. 200 caracteres)', required: false, example: 'com.minhaempresa.app' },
      { name: 'iosStoreUrl', type: 'string', description: 'URL da App Store', required: false, example: 'https://apps.apple.com/app/id1234567890' },
      { name: 'androidStoreUrl', type: 'string', description: 'URL da Google Play', required: false, example: 'https://play.google.com/store/apps/details?id=com.empresa.app' },
    ],
    responseExample: JSON.stringify({
      deepLinkConfig: {
        iosAppId: '1234567890',
        androidPackage: 'com.minhaempresa.app',
        iosStoreUrl: 'https://apps.apple.com/app/id1234567890',
        androidStoreUrl: 'https://play.google.com/store/apps/details?id=com.minhaempresa.app',
      },
    }, null, 2),
    curlExample: `curl -X PUT https://seu-dominio.com/api/domains/dom_abc123/deep-links \\
  -H "Authorization: Bearer SUA_CHAVE_API" \\
  -H "Content-Type: application/json" \\
  -d '{
    "iosAppId": "1234567890",
    "androidPackage": "com.minhaempresa.app"
  }'`,
  },

  // ==================== BIO PAGES ====================
  {
    id: 'list-bio-pages',
    method: 'GET',
    path: '/api/bio-pages',
    title: 'Listar Bio Pages',
    description: 'Retorna todas as Bio Pages do usuário com seus itens.',
    auth: true,
    category: 'bio-pages',
    responseExample: JSON.stringify({
      bios: [
        {
          id: 'bio_abc123',
          slug: 'joao-silva',
          title: 'João Silva',
          bio: 'Desenvolvedor e criador de conteúdo',
          theme: 'dark',
          accentColor: '#8b5cf6',
          published: true,
          clicksTotal: 1250,
          items: [
            { id: 'item_1', label: 'GitHub', url: 'https://github.com/joao', icon: 'github', order: 0, active: true, clicks: 500 },
            { id: 'item_2', label: 'LinkedIn', url: 'https://linkedin.com/in/joao', icon: 'linkedin', order: 1, active: true, clicks: 350 },
          ],
        },
      ],
    }, null, 2),
    curlExample: `curl -X GET https://seu-dominio.com/api/bio-pages \\
  -H "Authorization: Bearer SUA_CHAVE_API"`,
  },
  {
    id: 'create-bio-page',
    method: 'POST',
    path: '/api/bio-pages',
    title: 'Criar Bio Page',
    description: 'Cria uma nova Bio Page (página estilo "link na bio").',
    auth: true,
    category: 'bio-pages',
    bodyFields: [
      { name: 'slug', type: 'string', description: 'URL amigável (min 2, máx 30, apenas letras minúsculas, números e hífens)', required: true, example: 'joao-silva' },
      { name: 'title', type: 'string', description: 'Título da página (máx. 80 caracteres)', required: false, example: 'João Silva' },
      { name: 'theme', type: 'string', description: 'Tema: dark, light ou purple', required: false, default: 'dark' },
      { name: 'accentColor', type: 'string', description: 'Cor de destaque (formato hex)', required: false, default: '#8B5CF6' },
    ],
    responseExample: JSON.stringify({
      bio: {
        id: 'bio_abc123',
        slug: 'joao-silva',
        title: 'João Silva',
        theme: 'dark',
        accentColor: '#8b5cf6',
        published: true,
        items: [],
      },
    }, null, 2),
    curlExample: `curl -X POST https://seu-dominio.com/api/bio-pages \\
  -H "Authorization: Bearer SUA_CHAVE_API" \\
  -H "Content-Type: application/json" \\
  -d '{
    "slug": "joao-silva",
    "title": "João Silva",
    "theme": "dark"
  }'`,
  },
  {
    id: 'update-bio-page',
    method: 'PATCH',
    path: '/api/bio-pages/:id',
    title: 'Atualizar Bio Page',
    description: 'Atualiza as configurações de uma Bio Page existente.',
    auth: true,
    category: 'bio-pages',
    pathParams: [
      { name: 'id', type: 'string', description: 'ID da Bio Page', required: true },
    ],
    bodyFields: [
      { name: 'title', type: 'string', description: 'Novo título', required: false, example: 'Novo Título' },
      { name: 'bio', type: 'string', description: 'Nova biografia (máx. 200 caracteres)', required: false, example: 'Nova bio' },
      { name: 'theme', type: 'string', description: 'Novo tema: dark, light ou purple', required: false, example: 'light' },
      { name: 'accentColor', type: 'string', description: 'Nova cor de destaque', required: false, example: '#10b981' },
      { name: 'published', type: 'boolean', description: 'Publicar ou despublicar', required: false, example: 'true' },
      { name: 'slug', type: 'string', description: 'Novo slug', required: false, example: 'novo-slug' },
    ],
    responseExample: JSON.stringify({
      bio: {
        id: 'bio_abc123',
        slug: 'novo-slug',
        title: 'Novo Título',
        bio: 'Nova bio',
        theme: 'light',
        accentColor: '#10b981',
        published: true,
      },
    }, null, 2),
    curlExample: `curl -X PATCH https://seu-dominio.com/api/bio-pages/bio_abc123 \\
  -H "Authorization: Bearer SUA_CHAVE_API" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Novo Título",
    "theme": "light"
  }'`,
  },
  {
    id: 'delete-bio-page',
    method: 'DELETE',
    path: '/api/bio-pages/:id',
    title: 'Deletar Bio Page',
    description: 'Remove permanentemente uma Bio Page e todos os seus itens.',
    auth: true,
    category: 'bio-pages',
    pathParams: [
      { name: 'id', type: 'string', description: 'ID da Bio Page', required: true },
    ],
    responseExample: JSON.stringify({ success: true }, null, 2),
    curlExample: `curl -X DELETE https://seu-dominio.com/api/bio-pages/bio_abc123 \\
  -H "Authorization: Bearer SUA_CHAVE_API"`,
  },
  {
    id: 'bio-page-analytics',
    method: 'GET',
    path: '/api/bio-pages/:id/analytics',
    title: 'Analytics da Bio Page',
    description: 'Retorna dados de analytics de uma Bio Page: cliques totais, dispositivos, países, itens mais clicados.',
    auth: true,
    category: 'bio-pages',
    pathParams: [
      { name: 'id', type: 'string', description: 'ID da Bio Page', required: true },
    ],
    queryParams: [
      { name: 'days', type: 'number', description: 'Período em dias', required: false, default: '30' },
    ],
    responseExample: JSON.stringify({
      summary: {
        totalClicks: 1250,
        totalItems: 5,
        topCountry: 'BR',
        topDevice: 'MOBILE',
        topBrowser: 'Chrome',
      },
      chartData: [
        { date: '2024-01-01', clicks: 45 },
      ],
      devices: [{ device: 'Mobile', clicks: 900 }],
      countries: [{ country: 'BR', clicks: 800 }],
      topItems: [
        { itemId: 'item_1', label: 'GitHub', clicks: 500 },
      ],
    }, null, 2),
    curlExample: `curl -X GET "https://seu-dominio.com/api/bio-pages/bio_abc123/analytics?days=30" \\
  -H "Authorization: Bearer SUA_CHAVE_API"`,
  },

  // ==================== WORKSPACES ====================
  {
    id: 'list-workspaces',
    method: 'GET',
    path: '/api/workspaces',
    title: 'Listar workspaces',
    description: 'Retorna todos os workspaces onde o usuário é membro.',
    auth: true,
    category: 'workspaces',
    responseExample: JSON.stringify({
      workspaces: [
        {
          id: 'ws_abc123',
          name: 'Minha Empresa',
          slug: 'minha-empresa',
          plan: 'PRO',
          role: 'OWNER',
          memberCount: 5,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ],
    }, null, 2),
    curlExample: `curl -X GET https://seu-dominio.com/api/workspaces \\
  -H "Authorization: Bearer SUA_CHAVE_API"`,
  },
  {
    id: 'create-workspace',
    method: 'POST',
    path: '/api/workspaces',
    title: 'Criar workspace',
    description: 'Cria um novo workspace. O criador se torna automaticamente OWNER.',
    auth: true,
    category: 'workspaces',
    bodyFields: [
      { name: 'name', type: 'string', description: 'Nome do workspace (máx. 80 caracteres)', required: true, example: 'Minha Empresa' },
      { name: 'slug', type: 'string', description: 'URL amigável (min 2, máx 40, apenas letras minúsculas, números e hífens)', required: true, example: 'minha-empresa' },
    ],
    responseExample: JSON.stringify({
      workspace: {
        id: 'ws_abc123',
        name: 'Minha Empresa',
        slug: 'minha-empresa',
        plan: 'FREE',
        createdAt: '2024-01-01T00:00:00Z',
      },
    }, null, 2),
    curlExample: `curl -X POST https://seu-dominio.com/api/workspaces \\
  -H "Authorization: Bearer SUA_CHAVE_API" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Minha Empresa",
    "slug": "minha-empresa"
  }'`,
  },
  {
    id: 'get-workspace',
    method: 'GET',
    path: '/api/workspaces/:id',
    title: 'Obter workspace',
    description: 'Retorna os detalhes de um workspace incluindo membros.',
    auth: true,
    category: 'workspaces',
    pathParams: [
      { name: 'id', type: 'string', description: 'ID do workspace', required: true },
    ],
    responseExample: JSON.stringify({
      workspace: {
        id: 'ws_abc123',
        name: 'Minha Empresa',
        slug: 'minha-empresa',
        plan: 'PRO',
        members: [
          { role: 'OWNER', user: { id: 'user_1', name: 'João', email: 'joao@email.com' } },
          { role: 'EDITOR', user: { id: 'user_2', name: 'Maria', email: 'maria@email.com' } },
        ],
      },
      currentRole: 'OWNER',
    }, null, 2),
    curlExample: `curl -X GET https://seu-dominio.com/api/workspaces/ws_abc123 \\
  -H "Authorization: Bearer SUA_CHAVE_API"`,
  },
  {
    id: 'add-workspace-member',
    method: 'POST',
    path: '/api/workspaces/:id',
    title: 'Adicionar membro ao workspace',
    description: 'Convida um usuário existente para o workspace.',
    auth: true,
    category: 'workspaces',
    pathParams: [
      { name: 'id', type: 'string', description: 'ID do workspace', required: true },
    ],
    bodyFields: [
      { name: 'email', type: 'string', description: 'Email do usuário a ser convidado', required: true, example: 'maria@email.com' },
      { name: 'role', type: 'string', description: 'Função: ADMIN, EDITOR ou VIEWER', required: true, example: 'EDITOR' },
    ],
    responseExample: JSON.stringify({
      member: {
        role: 'EDITOR',
        joinedAt: '2024-01-15T10:30:00Z',
        user: {
          id: 'user_2',
          name: 'Maria',
          email: 'maria@email.com',
        },
      },
    }, null, 2),
    curlExample: `curl -X POST https://seu-dominio.com/api/workspaces/ws_abc123 \\
  -H "Authorization: Bearer SUA_CHAVE_API" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "maria@email.com",
    "role": "EDITOR"
  }'`,
  },
  {
    id: 'delete-workspace',
    method: 'DELETE',
    path: '/api/workspaces/:id',
    title: 'Deletar workspace',
    description: 'Remove permanentemente um workspace. Apenas o OWNER pode executar esta ação.',
    auth: true,
    category: 'workspaces',
    pathParams: [
      { name: 'id', type: 'string', description: 'ID do workspace', required: true },
    ],
    responseExample: JSON.stringify({ success: true }, null, 2),
    curlExample: `curl -X DELETE https://seu-dominio.com/api/workspaces/ws_abc123 \\
  -H "Authorization: Bearer SUA_CHAVE_API"`,
  },

  // ==================== USER ====================
  {
    id: 'get-profile',
    method: 'GET',
    path: '/api/user/profile',
    title: 'Obter perfil',
    description: 'Retorna os dados do perfil do usuário autenticado, incluindo limites e uso do plano.',
    auth: true,
    category: 'user',
    responseExample: JSON.stringify({
      id: 'user_abc123',
      name: 'João Silva',
      email: 'joao@email.com',
      image: 'https://exemplo.com/avatar.png',
      plan: 'FREE',
      twoFactorEnabled: false,
      createdAt: '2024-01-01T00:00:00Z',
      limits: {
        links: 50,
        clicksPerMonth: 1000,
      },
      usage: {
        links: 23,
        linksPercentage: 46,
      },
    }, null, 2),
    curlExample: `curl -X GET https://seu-dominio.com/api/user/profile \\
  -H "Authorization: Bearer SUA_CHAVE_API"`,
  },
  {
    id: 'update-profile',
    method: 'PATCH',
    path: '/api/user/profile',
    title: 'Atualizar perfil',
    description: 'Atualiza nome e/ou imagem do perfil.',
    auth: true,
    category: 'user',
    bodyFields: [
      { name: 'name', type: 'string', description: 'Novo nome (mínimo 2 caracteres)', required: false, example: 'João da Silva' },
      { name: 'image', type: 'string', description: 'URL da nova imagem (ou null para remover)', required: false, example: 'https://exemplo.com/nova-foto.jpg' },
    ],
    responseExample: JSON.stringify({
      user: {
        id: 'user_abc123',
        name: 'João da Silva',
        email: 'joao@email.com',
        image: 'https://exemplo.com/nova-foto.jpg',
        plan: 'FREE',
      },
    }, null, 2),
    curlExample: `curl -X PATCH https://seu-dominio.com/api/user/profile \\
  -H "Authorization: Bearer SUA_CHAVE_API" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "João da Silva"
  }'`,
  },
  {
    id: 'upload-avatar',
    method: 'POST',
    path: '/api/user/avatar',
    title: 'Upload de avatar',
    description: 'Envia uma imagem de perfil. O arquivo deve ser uma imagem (JPG, PNG, WebP) de no máximo 5MB. Usa multipart/form-data.',
    auth: true,
    category: 'user',
    bodyFields: [
      { name: 'file', type: 'file', description: 'Arquivo de imagem (máx. 5MB)', required: true },
    ],
    responseExample: JSON.stringify({
      imageUrl: 'https://seu-dominio.com/storage/avatars/user_abc123.jpg',
    }, null, 2),
    curlExample: `curl -X POST https://seu-dominio.com/api/user/avatar \\
  -H "Authorization: Bearer SUA_CHAVE_API" \\
  -F "file=@/caminho/para/foto.jpg"`,
  },
  {
    id: 'change-password',
    method: 'POST',
    path: '/api/user/password',
    title: 'Alterar senha',
    description: 'Altera a senha de acesso do usuário.',
    auth: true,
    category: 'user',
    bodyFields: [
      { name: 'currentPassword', type: 'string', description: 'Senha atual', required: true, example: 'senhaAtual123' },
      { name: 'newPassword', type: 'string', description: 'Nova senha (mínimo 8 caracteres)', required: true, example: 'novaSenha456' },
    ],
    responseExample: JSON.stringify({ success: true }, null, 2),
    curlExample: `curl -X POST https://seu-dominio.com/api/user/password \\
  -H "Authorization: Bearer SUA_CHAVE_API" \\
  -H "Content-Type: application/json" \\
  -d '{
    "currentPassword": "senhaAtual123",
    "newPassword": "novaSenha456"
  }'`,
  },
  {
    id: 'get-2fa-status',
    method: 'GET',
    path: '/api/user/2fa',
    title: 'Status do 2FA',
    description: 'Retorna o status da autenticação em dois fatores. Se não estiver ativada, retorna a URL do QR Code para configuração.',
    auth: true,
    category: 'user',
    responseExample: JSON.stringify({
      enabled: false,
      otpAuthUrl: 'otpauth://totp/123bit:usuario@email.com?secret=ABC123...',
      secret: 'ABC123XYZ789',
    }, null, 2),
    curlExample: `curl -X GET https://seu-dominio.com/api/user/2fa \\
  -H "Authorization: Bearer SUA_CHAVE_API"`,
  },
  {
    id: 'enable-2fa',
    method: 'POST',
    path: '/api/user/2fa',
    title: 'Ativar 2FA',
    description: 'Ativa a autenticação em dois fatores. Retorna códigos de backup que devem ser salvos em local seguro.',
    auth: true,
    category: 'user',
    bodyFields: [
      { name: 'token', type: 'string', description: 'Código TOTP do app autenticador (6 dígitos)', required: true, example: '123456' },
    ],
    responseExample: JSON.stringify({
      success: true,
      backupCodes: ['ABC123', 'DEF456', 'GHI789', 'JKL012', 'MNO345', 'PQR678', 'STU901', 'VWX234'],
    }, null, 2),
    curlExample: `curl -X POST https://seu-dominio.com/api/user/2fa \\
  -H "Authorization: Bearer SUA_CHAVE_API" \\
  -H "Content-Type: application/json" \\
  -d '{
    "token": "123456"
  }'`,
  },
  {
    id: 'disable-2fa',
    method: 'DELETE',
    path: '/api/user/2fa',
    title: 'Desativar 2FA',
    description: 'Desativa a autenticação em dois fatores.',
    auth: true,
    category: 'user',
    bodyFields: [
      { name: 'token', type: 'string', description: 'Código TOTP ou código de backup', required: true, example: '123456' },
    ],
    responseExample: JSON.stringify({ success: true }, null, 2),
    curlExample: `curl -X DELETE https://seu-dominio.com/api/user/2fa \\
  -H "Authorization: Bearer SUA_CHAVE_API" \\
  -H "Content-Type: application/json" \\
  -d '{
    "token": "123456"
  }'`,
  },
  {
    id: 'get-pixels',
    method: 'GET',
    path: '/api/user/pixels',
    title: 'Obter pixels de rastreamento',
    description: 'Retorna os IDs dos pixels de rastreamento configurados (Meta, Google, TikTok, LinkedIn).',
    auth: true,
    category: 'user',
    responseExample: JSON.stringify({
      pixels: {
        metaPixelId: '1234567890123456',
        googleTagId: 'G-ABC123DEF4',
        tiktokPixelId: 'ABCDEF1234567890',
        linkedinTagId: '12345678',
      },
    }, null, 2),
    curlExample: `curl -X GET https://seu-dominio.com/api/user/pixels \\
  -H "Authorization: Bearer SUA_CHAVE_API"`,
  },
  {
    id: 'update-pixels',
    method: 'PATCH',
    path: '/api/user/pixels',
    title: 'Atualizar pixels de rastreamento',
    description: 'Configura os IDs dos pixels de rastreamento. Apenas os campos enviados serão atualizados.',
    auth: true,
    category: 'user',
    bodyFields: [
      { name: 'metaPixelId', type: 'string', description: 'ID do Meta Pixel (máx. 30 caracteres)', required: false, example: '1234567890123456' },
      { name: 'googleTagId', type: 'string', description: 'ID do Google Tag (máx. 30 caracteres)', required: false, example: 'G-ABC123DEF4' },
      { name: 'tiktokPixelId', type: 'string', description: 'ID do TikTok Pixel (máx. 30 caracteres)', required: false, example: 'ABCDEF1234567890' },
      { name: 'linkedinTagId', type: 'string', description: 'ID do LinkedIn Tag (máx. 20 caracteres)', required: false, example: '12345678' },
    ],
    responseExample: JSON.stringify({
      pixels: {
        metaPixelId: '1234567890123456',
        googleTagId: null,
        tiktokPixelId: null,
        linkedinTagId: null,
      },
    }, null, 2),
    curlExample: `curl -X PATCH https://seu-dominio.com/api/user/pixels \\
  -H "Authorization: Bearer SUA_CHAVE_API" \\
  -H "Content-Type: application/json" \\
  -d '{
    "metaPixelId": "1234567890123456"
  }'`,
  },

  // ==================== API KEYS ====================
  {
    id: 'list-api-keys',
    method: 'GET',
    path: '/api/keys',
    title: 'Listar API Keys',
    description: 'Retorna todas as chaves de API ativas (não revogadas) do usuário.',
    auth: true,
    category: 'api-keys',
    responseExample: JSON.stringify({
      keys: [
        {
          id: 'key_abc123',
          name: 'App Mobile',
          lastUsedAt: '2024-01-15T10:30:00Z',
          expiresAt: null,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ],
    }, null, 2),
    curlExample: `curl -X GET https://seu-dominio.com/api/keys \\
  -H "Authorization: Bearer SUA_CHAVE_API"`,
  },
  {
    id: 'create-api-key',
    method: 'POST',
    path: '/api/keys',
    title: 'Criar API Key',
    description: 'Gera uma nova chave de API. A chave é exibida apenas uma vez — guarde-a em local seguro.',
    auth: true,
    category: 'api-keys',
    bodyFields: [
      { name: 'name', type: 'string', description: 'Nome descritivo para a chave (máx. 100 caracteres)', required: true, example: 'App Mobile' },
      { name: 'expiresAt', type: 'string', description: 'Data de expiração (ISO 8601). Null = sem expiração.', required: false, example: '2025-12-31T23:59:59Z' },
    ],
    responseExample: JSON.stringify({
      key: 'ABCdef123456GHIjkl789012MNO345pq',
      apiKey: {
        id: 'key_abc123',
        name: 'App Mobile',
        expiresAt: null,
        createdAt: '2024-01-15T10:30:00Z',
      },
    }, null, 2),
    curlExample: `curl -X POST https://seu-dominio.com/api/keys \\
  -H "Authorization: Bearer SUA_CHAVE_API" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "App Mobile"
  }'`,
  },
  {
    id: 'delete-api-key',
    method: 'DELETE',
    path: '/api/keys/:id',
    title: 'Revogar API Key',
    description: 'Revoga (soft-delete) uma chave de API. A chave deixa de funcionar imediatamente.',
    auth: true,
    category: 'api-keys',
    pathParams: [
      { name: 'id', type: 'string', description: 'ID da chave de API', required: true },
    ],
    responseExample: JSON.stringify({ success: true }, null, 2),
    curlExample: `curl -X DELETE https://seu-dominio.com/api/keys/key_abc123 \\
  -H "Authorization: Bearer SUA_CHAVE_API"`,
  },

  // ==================== WEBHOOKS ====================
  {
    id: 'list-webhooks',
    method: 'GET',
    path: '/api/webhooks',
    title: 'Listar webhooks',
    description: 'Retorna todos os webhooks configurados pelo usuário.',
    auth: true,
    category: 'webhooks',
    responseExample: JSON.stringify({
      webhooks: [
        {
          id: 'wh_abc123',
          name: 'Meu App',
          url: 'https://meuapp.com/webhook/123bit',
          events: ['link.created', 'link.clicked'],
          active: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ],
    }, null, 2),
    curlExample: `curl -X GET https://seu-dominio.com/api/webhooks \\
  -H "Authorization: Bearer SUA_CHAVE_API"`,
  },
  {
    id: 'create-webhook',
    method: 'POST',
    path: '/api/webhooks',
    title: 'Criar webhook',
    description: 'Cria um novo webhook para receber notificações em tempo real.',
    auth: true,
    category: 'webhooks',
    bodyFields: [
      { name: 'name', type: 'string', description: 'Nome do webhook (máx. 50 caracteres)', required: true, example: 'Meu App' },
      { name: 'url', type: 'string', description: 'URL do endpoint que receberá os eventos', required: true, example: 'https://meuapp.com/webhook/123bit' },
      { name: 'events', type: 'string[]', description: 'Lista de eventos para ouvir', required: true, example: '["link.created", "link.clicked"]' },
      { name: 'secret', type: 'string', description: 'Secret para validação de assinatura', required: false, example: 'meu-secret-123' },
    ],
    responseExample: JSON.stringify({
      webhook: {
        id: 'wh_abc123',
        name: 'Meu App',
        url: 'https://meuapp.com/webhook/123bit',
        events: ['link.created', 'link.clicked'],
        active: true,
        createdAt: '2024-01-15T10:30:00Z',
      },
    }, null, 2),
    curlExample: `curl -X POST https://seu-dominio.com/api/webhooks \\
  -H "Authorization: Bearer SUA_CHAVE_API" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Meu App",
    "url": "https://meuapp.com/webhook/123bit",
    "events": ["link.created", "link.clicked"]
  }'`,
  },
  {
    id: 'toggle-webhook',
    method: 'PATCH',
    path: '/api/webhooks/:id',
    title: 'Ativar/desativar webhook',
    description: 'Ativa ou desativa um webhook existente.',
    auth: true,
    category: 'webhooks',
    pathParams: [
      { name: 'id', type: 'string', description: 'ID do webhook', required: true },
    ],
    bodyFields: [
      { name: 'active', type: 'boolean', description: 'true para ativar, false para desativar', required: true, example: 'false' },
    ],
    responseExample: JSON.stringify({
      webhook: {
        id: 'wh_abc123',
        name: 'Meu App',
        active: false,
      },
    }, null, 2),
    curlExample: `curl -X PATCH https://seu-dominio.com/api/webhooks/wh_abc123 \\
  -H "Authorization: Bearer SUA_CHAVE_API" \\
  -H "Content-Type: application/json" \\
  -d '{
    "active": false
  }'`,
  },
  {
    id: 'test-webhook',
    method: 'POST',
    path: '/api/webhooks/:id',
    title: 'Testar webhook',
    description: 'Envia um evento de teste para o webhook para verificar se está funcionando.',
    auth: true,
    category: 'webhooks',
    pathParams: [
      { name: 'id', type: 'string', description: 'ID do webhook', required: true },
    ],
    responseExample: JSON.stringify({
      success: true,
      statusCode: 200,
    }, null, 2),
    curlExample: `curl -X POST https://seu-dominio.com/api/webhooks/wh_abc123 \\
  -H "Authorization: Bearer SUA_CHAVE_API"`,
  },
  {
    id: 'delete-webhook',
    method: 'DELETE',
    path: '/api/webhooks/:id',
    title: 'Deletar webhook',
    description: 'Remove permanentemente um webhook.',
    auth: true,
    category: 'webhooks',
    pathParams: [
      { name: 'id', type: 'string', description: 'ID do webhook', required: true },
    ],
    responseExample: JSON.stringify({ success: true }, null, 2),
    curlExample: `curl -X DELETE https://seu-dominio.com/api/webhooks/wh_abc123 \\
  -H "Authorization: Bearer SUA_CHAVE_API"`,
  },

  // ==================== HEALTH ====================
  {
    id: 'list-health',
    method: 'GET',
    path: '/api/links/health',
    title: 'Listar status de saúde dos links',
    description: 'Retorna o status de saúde dos últimos 100 links ativos. Mostra se o URL de destino está respondendo corretamente.',
    auth: true,
    category: 'health',
    responseExample: JSON.stringify({
      links: [
        {
          id: 'link_abc123',
          shortCode: 'meu-link',
          title: 'Meu Link',
          originalUrl: 'https://exemplo.com/pagina',
          healthStatus: 'ok',
          lastHealthCheck: '2024-01-15T10:30:00Z',
          clickCount: 156,
        },
        {
          id: 'link_def456',
          shortCode: 'link-quebrado',
          title: 'Link Quebrado',
          originalUrl: 'https://exemplo.com/404',
          healthStatus: 'error',
          lastHealthCheck: '2024-01-15T09:00:00Z',
          clickCount: 45,
        },
      ],
    }, null, 2),
    curlExample: `curl -X GET https://seu-dominio.com/api/links/health \\
  -H "Authorization: Bearer SUA_CHAVE_API"`,
  },
  {
    id: 'check-health',
    method: 'POST',
    path: '/api/links/health',
    title: 'Verificar saúde de um link',
    description: 'Faz um check de saúde imediato de um link específico.',
    auth: true,
    category: 'health',
    bodyFields: [
      { name: 'linkId', type: 'string', description: 'ID do link a verificar', required: true, example: 'link_abc123' },
    ],
    responseExample: JSON.stringify({
      status: 'ok',
      statusCode: 200,
      latencyMs: 245,
    }, null, 2),
    curlExample: `curl -X POST https://seu-dominio.com/api/links/health \\
  -H "Authorization: Bearer SUA_CHAVE_API" \\
  -H "Content-Type: application/json" \\
  -d '{
    "linkId": "link_abc123"
  }'`,
  },
  {
    id: 'bulk-health-check',
    method: 'PATCH',
    path: '/api/links/health',
    title: 'Check em massa de saúde',
    description: 'Verifica a saúde de todos os links que não foram verificados nas últimas 6 horas (máximo 20 por vez).',
    auth: true,
    category: 'health',
    responseExample: JSON.stringify({
      checked: 15,
      results: [
        { linkId: 'link_1', status: 'ok', statusCode: 200 },
        { linkId: 'link_2', status: 'error', statusCode: 404 },
      ],
    }, null, 2),
    curlExample: `curl -X PATCH https://seu-dominio.com/api/links/health \\
  -H "Authorization: Bearer SUA_CHAVE_API"`,
  },

  // ==================== REDIRECT RULES ====================
  {
    id: 'list-rules',
    method: 'GET',
    path: '/api/links/:id/rules',
    title: 'Listar regras de redirecionamento',
    description: 'Retorna todas as regras de redirecionamento de um link, ordenadas.',
    auth: true,
    category: 'redirect-rules',
    pathParams: [
      { name: 'id', type: 'string', description: 'ID do link', required: true },
    ],
    responseExample: JSON.stringify({
      rules: [
        {
          id: 'rule_abc123',
          linkId: 'link_abc123',
          type: 'geo',
          condition: '{"countries": ["BR"]}',
          destination: 'https://exemplo.com/br',
          weight: 100,
          order: 0,
          active: true,
        },
      ],
    }, null, 2),
    curlExample: `curl -X GET https://seu-dominio.com/api/links/link_abc123/rules \\
  -H "Authorization: Bearer SUA_CHAVE_API"`,
  },
  {
    id: 'create-rule',
    method: 'POST',
    path: '/api/links/:id/rules',
    title: 'Criar regra de redirecionamento',
    description: 'Adiciona uma nova regra de redirecionamento a um link. Tipos suportados: geo (por país), device (por dispositivo), time (por horário), ab (teste A/B).',
    auth: true,
    category: 'redirect-rules',
    pathParams: [
      { name: 'id', type: 'string', description: 'ID do link', required: true },
    ],
    bodyFields: [
      { name: 'type', type: 'string', description: 'Tipo da regra: geo, device, time, ab', required: true, example: 'geo' },
      { name: 'condition', type: 'string | object', description: 'Condição da regra (JSON string ou objeto)', required: true, example: '{"countries": ["BR"]}' },
      { name: 'destination', type: 'string', description: 'URL de destino quando a condição é atendida', required: true, example: 'https://exemplo.com/br' },
      { name: 'weight', type: 'number', description: 'Peso da regra (para teste A/B, padrão 100)', required: false, example: '100' },
      { name: 'order', type: 'number', description: 'Ordem de execução (padrão 0)', required: false, example: '0' },
      { name: 'active', type: 'boolean', description: 'Se a regra está ativa', required: false, example: 'true' },
    ],
    responseExample: JSON.stringify({
      rule: {
        id: 'rule_abc123',
        type: 'geo',
        condition: '{"countries": ["BR"]}',
        destination: 'https://exemplo.com/br',
        weight: 100,
        order: 0,
        active: true,
      },
    }, null, 2),
    curlExample: `curl -X POST https://seu-dominio.com/api/links/link_abc123/rules \\
  -H "Authorization: Bearer SUA_CHAVE_API" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "geo",
    "condition": "{\"countries\": [\"BR\"]}",
    "destination": "https://exemplo.com/br"
  }'`,
  },
  {
    id: 'update-rule',
    method: 'PATCH',
    path: '/api/links/:id/rules',
    title: 'Atualizar regra de redirecionamento',
    description: 'Atualiza uma regra existente.',
    auth: true,
    category: 'redirect-rules',
    pathParams: [
      { name: 'id', type: 'string', description: 'ID do link', required: true },
    ],
    bodyFields: [
      { name: 'ruleId', type: 'string', description: 'ID da regra a atualizar', required: true, example: 'rule_abc123' },
      { name: 'type', type: 'string', description: 'Novo tipo', required: false },
      { name: 'condition', type: 'string | object', description: 'Nova condição', required: false },
      { name: 'destination', type: 'string', description: 'Novo destino', required: false },
      { name: 'weight', type: 'number', description: 'Novo peso', required: false },
      { name: 'order', type: 'number', description: 'Nova ordem', required: false },
      { name: 'active', type: 'boolean', description: 'Novo status', required: false },
    ],
    responseExample: JSON.stringify({ rule: { id: 'rule_abc123', active: false } }, null, 2),
    curlExample: `curl -X PATCH https://seu-dominio.com/api/links/link_abc123/rules \\
  -H "Authorization: Bearer SUA_CHAVE_API" \\
  -H "Content-Type: application/json" \\
  -d '{
    "ruleId": "rule_abc123",
    "active": false
  }'`,
  },
  {
    id: 'delete-rule',
    method: 'DELETE',
    path: '/api/links/:id/rules',
    title: 'Deletar regra de redirecionamento',
    description: 'Remove uma regra de redirecionamento.',
    auth: true,
    category: 'redirect-rules',
    pathParams: [
      { name: 'id', type: 'string', description: 'ID do link', required: true },
    ],
    queryParams: [
      { name: 'ruleId', type: 'string', description: 'ID da regra a deletar', required: true },
    ],
    responseExample: JSON.stringify({ success: true }, null, 2),
    curlExample: `curl -X DELETE "https://seu-dominio.com/api/links/link_abc123/rules?ruleId=rule_abc123" \\
  -H "Authorization: Bearer SUA_CHAVE_API"`,
  },
]
