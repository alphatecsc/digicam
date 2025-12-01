const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

// Listar eventos
router.get('/', async (req, res) => {
  try {
    const { eventType, sourceModule, cameraId, severity, isAcknowledged, startDate, endDate, limit } = req.query;
    
    let query = `
      SELECT el.*, c.name as camera_name, u.username as acknowledged_by_username
      FROM event_logs el
      LEFT JOIN cameras c ON el.camera_id = c.id
      LEFT JOIN users u ON el.acknowledged_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (eventType) {
      query += ` AND el.event_type = $${paramCount++}`;
      params.push(eventType);
    }
    if (sourceModule) {
      query += ` AND el.source_module = $${paramCount++}`;
      params.push(sourceModule);
    }
    if (cameraId) {
      query += ` AND el.camera_id = $${paramCount++}`;
      params.push(cameraId);
    }
    if (severity) {
      query += ` AND el.severity = $${paramCount++}`;
      params.push(severity);
    }
    if (isAcknowledged !== undefined) {
      query += ` AND el.is_acknowledged = $${paramCount++}`;
      params.push(isAcknowledged === 'true');
    }
    if (startDate) {
      query += ` AND el.created_at >= $${paramCount++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND el.created_at <= $${paramCount++}`;
      params.push(endDate);
    }
    
    query += ` ORDER BY el.created_at DESC LIMIT $${paramCount}`;
    params.push(parseInt(limit) || 100);
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar eventos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter evento por ID
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT el.*, c.name as camera_name, u.username as acknowledged_by_username
       FROM event_logs el
       LEFT JOIN cameras c ON el.camera_id = c.id
       LEFT JOIN users u ON el.acknowledged_by = u.id
       WHERE el.id = $1`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter evento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Reconhecer evento (acknowledge)
router.post('/:id/acknowledge', async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE event_logs SET
        is_acknowledged = true,
        acknowledged_by = $1,
        acknowledged_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [req.user.userId, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao reconhecer evento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar evento manualmente
router.post('/', async (req, res) => {
  try {
    const { eventType, sourceModule, cameraId, severity, message, metadata } = req.body;
    
    const result = await db.query(
      `INSERT INTO event_logs (event_type, source_module, camera_id, severity, message, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [eventType, sourceModule || 'manual', cameraId, severity || 'info', message, JSON.stringify(metadata || {})]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Estatísticas de eventos
router.get('/stats/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical,
        COUNT(CASE WHEN severity = 'warning' THEN 1 END) as warning,
        COUNT(CASE WHEN severity = 'error' THEN 1 END) as error,
        COUNT(CASE WHEN severity = 'info' THEN 1 END) as info,
        COUNT(CASE WHEN is_acknowledged = false THEN 1 END) as unacknowledged
      FROM event_logs
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (startDate) {
      query += ` AND created_at >= $${paramCount++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND created_at <= $${paramCount++}`;
      params.push(endDate);
    }
    
    const result = await db.query(query, params);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;

