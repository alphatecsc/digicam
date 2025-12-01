const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

// Listar detecções de movimento
router.get('/', async (req, res) => {
  try {
    const { cameraId, startDate, endDate, isAlert } = req.query;
    
    let query = `
      SELECT md.*, c.name as camera_name
      FROM motion_detections md
      JOIN cameras c ON md.camera_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (cameraId) {
      query += ` AND md.camera_id = $${paramCount++}`;
      params.push(cameraId);
    }
    if (startDate) {
      query += ` AND md.detected_at >= $${paramCount++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND md.detected_at <= $${paramCount++}`;
      params.push(endDate);
    }
    if (isAlert !== undefined) {
      query += ` AND md.is_alert = $${paramCount++}`;
      params.push(isAlert === 'true');
    }
    
    query += ` ORDER BY md.detected_at DESC LIMIT 100`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar detecções:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar detecção de movimento (simulado)
router.post('/', async (req, res) => {
  try {
    const { cameraId, region, confidence, isAlert } = req.body;
    
    const result = await db.query(
      `INSERT INTO motion_detections (camera_id, region, confidence, is_alert)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [cameraId, JSON.stringify(region), confidence, isAlert || false]
    );
    
    // Registrar evento no log
    await db.query(
      `INSERT INTO event_logs (event_type, source_module, camera_id, severity, message, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'motion_detected',
        'motion',
        cameraId,
        isAlert ? 'warning' : 'info',
        'Movimento detectado',
        JSON.stringify({ region, confidence })
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar detecção:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;

