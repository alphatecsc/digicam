const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

// Listar câmeras
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM cameras ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar câmeras:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter câmera por ID
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM cameras WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Câmera não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter câmera:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar câmera
router.post('/', async (req, res) => {
  try {
    const { name, ipAddress, port, streamUrl, streamType, location, ptzEnabled, recordingEnabled } = req.body;
    
    const result = await db.query(
      `INSERT INTO cameras (name, ip_address, port, stream_url, stream_type, location, ptz_enabled, recording_enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, ipAddress, port, streamUrl, streamType || 'rtsp', location, ptzEnabled || false, recordingEnabled || false]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar câmera:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar câmera
router.put('/:id', async (req, res) => {
  try {
    const { name, ipAddress, port, streamUrl, streamType, location, status, ptzEnabled, recordingEnabled } = req.body;
    
    const result = await db.query(
      `UPDATE cameras SET
        name = COALESCE($1, name),
        ip_address = COALESCE($2, ip_address),
        port = COALESCE($3, port),
        stream_url = COALESCE($4, stream_url),
        stream_type = COALESCE($5, stream_type),
        location = COALESCE($6, location),
        status = COALESCE($7, status),
        ptz_enabled = COALESCE($8, ptz_enabled),
        recording_enabled = COALESCE($9, recording_enabled),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [name, ipAddress, port, streamUrl, streamType, location, status, ptzEnabled, recordingEnabled, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Câmera não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar câmera:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar câmera
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM cameras WHERE id = $1 RETURNING id', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Câmera não encontrada' });
    }
    
    res.json({ message: 'Câmera deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar câmera:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;

