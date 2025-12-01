const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

// Buscar gravações
router.get('/search', async (req, res) => {
  try {
    const { cameraId, startDate, endDate, eventTags, keywords } = req.query;
    
    let query = `
      SELECT r.*, c.name as camera_name, c.location
      FROM recordings r
      JOIN cameras c ON r.camera_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (cameraId) {
      query += ` AND r.camera_id = $${paramCount++}`;
      params.push(cameraId);
    }
    if (startDate) {
      query += ` AND r.start_time >= $${paramCount++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND r.end_time <= $${paramCount++}`;
      params.push(endDate);
    }
    if (keywords) {
      query += ` AND (c.name ILIKE $${paramCount} OR c.location ILIKE $${paramCount})`;
      params.push(`%${keywords}%`);
      paramCount++;
    }
    
    query += ` ORDER BY r.start_time DESC LIMIT 100`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar gravações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar marcadores (bookmarks)
router.get('/bookmarks', async (req, res) => {
  try {
    const { recordingId, cameraId } = req.query;
    
    let query = `
      SELECT b.*, r.file_path, c.name as camera_name,
             u.username as created_by_username
      FROM bookmarks b
      JOIN recordings r ON b.recording_id = r.id
      JOIN cameras c ON b.camera_id = c.id
      LEFT JOIN users u ON b.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (recordingId) {
      query += ` AND b.recording_id = $${paramCount++}`;
      params.push(recordingId);
    }
    if (cameraId) {
      query += ` AND b.camera_id = $${paramCount++}`;
      params.push(cameraId);
    }
    
    query += ` ORDER BY b.timestamp DESC`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar marcadores:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar marcador
router.post('/bookmarks', async (req, res) => {
  try {
    const { recordingId, cameraId, timestamp, description, tags } = req.body;
    
    const result = await db.query(
      `INSERT INTO bookmarks (recording_id, camera_id, timestamp, description, tags, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [recordingId, cameraId, timestamp, description, tags, req.user.userId]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar marcador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar marcador
router.put('/bookmarks/:id', async (req, res) => {
  try {
    const { description, tags } = req.body;
    
    const result = await db.query(
      `UPDATE bookmarks SET description = $1, tags = $2 WHERE id = $3 RETURNING *`,
      [description, tags, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Marcador não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar marcador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar marcador
router.delete('/bookmarks/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM bookmarks WHERE id = $1 RETURNING id', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Marcador não encontrado' });
    }
    
    res.json({ message: 'Marcador deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar marcador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;

