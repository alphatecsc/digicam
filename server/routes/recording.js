const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

// Listar configurações de gravação
router.get('/configs', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT rc.*, c.name as camera_name
       FROM recording_configs rc
       JOIN cameras c ON rc.camera_id = c.id
       ORDER BY c.name`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar configurações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar configuração de gravação
router.post('/configs', async (req, res) => {
  try {
    const {
      cameraId,
      recordingType,
      scheduleStart,
      scheduleEnd,
      scheduleDays,
      eventTriggers,
      storagePath,
      retentionDays,
      isActive
    } = req.body;
    
    const result = await db.query(
      `INSERT INTO recording_configs (
        camera_id, recording_type, schedule_start, schedule_end,
        schedule_days, event_triggers, storage_path, retention_days, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        cameraId, recordingType, scheduleStart, scheduleEnd,
        scheduleDays, eventTriggers, storagePath, retentionDays || 30, isActive !== false
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar configuração:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar configuração
router.put('/configs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${dbKey} = $${paramCount++}`);
        values.push(updates[key]);
      }
    });
    
    values.push(id);
    
    const result = await db.query(
      `UPDATE recording_configs SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Configuração não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar configuração:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar gravações
router.get('/', async (req, res) => {
  try {
    const { cameraId, startDate, endDate, recordingType } = req.query;
    
    let query = `
      SELECT r.*, c.name as camera_name
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
    if (recordingType) {
      query += ` AND r.recording_type = $${paramCount++}`;
      params.push(recordingType);
    }
    
    query += ` ORDER BY r.start_time DESC LIMIT 100`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar gravações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar registro de gravação
router.post('/', async (req, res) => {
  try {
    const {
      cameraId,
      startTime,
      endTime,
      filePath,
      fileSize,
      durationSeconds,
      recordingType,
      eventTags
    } = req.body;
    
    const result = await db.query(
      `INSERT INTO recordings (
        camera_id, start_time, end_time, file_path, file_size,
        duration_seconds, recording_type, event_tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [cameraId, startTime, endTime, filePath, fileSize, durationSeconds, recordingType, eventTags]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar gravação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;

