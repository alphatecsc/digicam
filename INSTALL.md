# Guia de Instalação - Digicam VMS

## Pré-requisitos

- Node.js 18+ instalado
- PostgreSQL 12+ instalado e rodando
- npm ou yarn

## Instalação

### 1. Instalar dependências

```bash
npm run install-all
```

### 2. Configurar banco de dados

1. Crie um banco de dados PostgreSQL:
```sql
CREATE DATABASE digicam_vms;
```

2. Configure as variáveis de ambiente no arquivo `server/.env`:
```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=digicam_vms
DB_USER=postgres
DB_PASSWORD=sua_senha
JWT_SECRET=seu-secret-key-aqui
NODE_ENV=development
```

### 3. Executar migrações

```bash
cd server
npm run migrate
```

Isso irá:
- Criar todas as tabelas do banco de dados
- Criar um usuário admin padrão (username: `admin`, password: `admin123`)

### 4. Iniciar aplicação

Em um terminal, execute:
```bash
npm run dev
```

Isso iniciará:
- Backend na porta 3001
- Frontend na porta 3000

### 5. Acessar aplicação

Abra seu navegador em: http://localhost:3000

Faça login com:
- Usuário: `admin`
- Senha: `admin123`

## Estrutura do Projeto

```
digicam/
├── server/              # Backend API (Express)
│   ├── routes/          # Rotas da API
│   ├── database/        # Scripts SQL
│   ├── config/          # Configurações
│   └── middleware/      # Middlewares
├── client/              # Frontend (Next.js)
│   ├── app/             # Páginas e rotas
│   ├── components/      # Componentes React
│   └── lib/             # Utilitários
└── package.json         # Scripts principais
```

## Funcionalidades Implementadas

### Gerenciamento e Monitoramento
- ✅ Monitoramento Ao Vivo (simulado)
- ✅ Gerenciamento de Câmeras
- ✅ Configuração de Gravação
- ✅ Reprodução e Pesquisa de Vídeos
- ✅ Marcadores (Bookmarks)
- ✅ Mosaicos Personalizados
- ✅ Insight (Captura de Tela)

### Análise de Vídeo (DVA)
- ✅ Detecção de Movimento
- ✅ Tripwire (Linha de Pedestre)
- ✅ Perimeter (Cerca Virtual)
- ✅ Contagem de Objetos
- ✅ Reconhecimento Facial
- ✅ LPR (Leitura de Placas)

### Alarmes e Automação
- ✅ Sistema de Log de Eventos
- ✅ Gerenciamento de Eventos
- ✅ Regras de Automação
- ✅ Evidence / Forensics

## Notas

- O sistema utiliza streams simulados para demonstração
- Para produção, integre com câmeras IP reais via RTSP/WebRTC
- Configure adequadamente as variáveis de ambiente
- Use HTTPS em produção
- Configure backup do banco de dados

