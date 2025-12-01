require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const db = require('./config/database');

const app = express();
const server = http.createServer(app);

// WebSocket Server para streams de vídeo
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/cameras', require('./routes/cameras'));
app.use('/api/live', require('./routes/live'));
app.use('/api/recording', require('./routes/recording'));
app.use('/api/playback', require('./routes/playback'));
app.use('/api/mosaic', require('./routes/mosaic'));
app.use('/api/insight', require('./routes/insight'));
app.use('/api/motion', require('./routes/motion'));
app.use('/api/dva', require('./routes/dva'));
app.use('/api/faces', require('./routes/faces'));
app.use('/api/lpr', require('./routes/lpr'));
app.use('/api/evidence', require('./routes/evidence'));
app.use('/api/forensics', require('./routes/forensics'));
app.use('/api/events', require('./routes/events'));
app.use('/api/automation', require('./routes/automation'));

// WebSocket para streams de vídeo
wss.on('connection', (ws, req) => {
  console.log('Cliente WebSocket conectado');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'subscribe') {
        // Simular stream de vídeo
        const interval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'frame',
              cameraId: data.cameraId,
              timestamp: new Date().toISOString(),
              data: 'mock-frame-data-' + Math.random()
            }));
          } else {
            clearInterval(interval);
          }
        }, 100); // 10 FPS simulado
        
        ws.cameraId = data.cameraId;
        ws.interval = interval;
      }
    } catch (error) {
      console.error('Erro ao processar mensagem WebSocket:', error);
    }
  });
  
  ws.on('close', () => {
    if (ws.interval) {
      clearInterval(ws.interval);
    }
    console.log('Cliente WebSocket desconectado');
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Inicializar banco de dados e servidor
const PORT = process.env.PORT || 3001;

db.init().then(() => {
  server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}).catch(err => {
  console.error('Erro ao inicializar banco de dados:', err);
  process.exit(1);
});

module.exports = app;

