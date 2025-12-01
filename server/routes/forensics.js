const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

// Gerar resumo de eventos (Forensics)
router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate, cameraId, eventTypes } = req.query;
    
    let query = `
      SELECT 
        event_type,
        source_module,
        COUNT(*) as count,
        MIN(created_at) as first_occurrence,
        MAX(created_at) as last_occurrence,
        COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_count,
        COUNT(CASE WHEN severity = 'warning' THEN 1 END) as warning_count,
        COUNT(CASE WHEN is_acknowledged = false THEN 1 END) as unacknowledged_count
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
    if (cameraId) {
      query += ` AND camera_id = $${paramCount++}`;
      params.push(cameraId);
    }
    if (eventTypes) {
      const types = Array.isArray(eventTypes) ? eventTypes : [eventTypes];
      query += ` AND event_type = ANY($${paramCount++})`;
      params.push(types);
    }
    
    query += ` GROUP BY event_type, source_module ORDER BY count DESC`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao gerar resumo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Timeline de eventos
router.get('/timeline', async (req, res) => {
  try {
    const { startDate, endDate, cameraId, severity } = req.query;
    
    let query = `
      SELECT el.*, c.name as camera_name
      FROM event_logs el
      LEFT JOIN cameras c ON el.camera_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (startDate) {
      query += ` AND el.created_at >= $${paramCount++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND el.created_at <= $${paramCount++}`;
      params.push(endDate);
    }
    if (cameraId) {
      query += ` AND el.camera_id = $${paramCount++}`;
      params.push(cameraId);
    }
    if (severity) {
      query += ` AND el.severity = $${paramCount++}`;
      params.push(severity);
    }
    
    query += ` ORDER BY el.created_at DESC LIMIT 500`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao obter timeline:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Estatísticas por módulo
router.get('/stats/by-module', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        source_module,
        COUNT(*) as total_events,
        COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical,
        COUNT(CASE WHEN severity = 'warning' THEN 1 END) as warnings,
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
    
    query += ` GROUP BY source_module ORDER BY total_events DESC`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Correlação de eventos
router.get('/correlation', async (req, res) => {
  try {
    const { startDate, endDate, cameraId } = req.query;
    
    let query = `
      SELECT 
        DATE_TRUNC('hour', created_at) as hour,
        event_type,
        COUNT(*) as count
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
    if (cameraId) {
      query += ` AND camera_id = $${paramCount++}`;
      params.push(cameraId);
    }
    
    query += ` GROUP BY DATE_TRUNC('hour', created_at), event_type ORDER BY hour DESC, count DESC`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao obter correlação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;

