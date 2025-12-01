# Digicam VMS - Sistema de Gerenciamento de Vídeo

Sistema avançado de gerenciamento de vídeo com monitoramento, análise e automação.

## Stack Tecnológico

- **Backend**: Node.js + Express + PostgreSQL
- **Frontend**: Next.js + React + TypeScript
- **Banco de Dados**: PostgreSQL

## Estrutura do Projeto

```
digicam/
├── server/          # Backend API
├── client/          # Frontend Next.js
└── database/        # Scripts SQL
```

## Instalação

1. Instalar dependências:
```bash
npm run install-all
```

2. Configurar banco de dados PostgreSQL e atualizar variáveis de ambiente em `server/.env`

3. Executar migrações:
```bash
cd server && npm run migrate
```

4. Iniciar aplicação:
```bash
npm run dev
```

## Módulos Implementados

### Gerenciamento e Monitoramento
- Monitoramento Ao Vivo
- Gravação (Contínua, Agendada, por Evento)
- Reprodução e Pesquisa
- Mosaicos Personalizados
- Insight (Captura de Tela)

### Análise de Vídeo (DVA)
- Detecção de Movimento
- Linha de Pedestre (Tripwire)
- Cerca Virtual (Perimeter)
- Contagem de Objetos/Pessoas
- Reconhecimento Facial
- Leitura de Placas (LPR)

### Alarmes e Automação
- Gerenciamento de Eventos
- Regras de Ação (Automação)

