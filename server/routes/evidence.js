const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

// Listar evidências
router.get('/', async (req, res) => {
  try {
    const { status, priority, assignedTo, incidentType } = req.query;
    
    let query = `
      SELECT e.*,
             u1.username as created_by_username,
             u2.username as assigned_to_username
      FROM evidence e
      LEFT JOIN users u1 ON e.created_by = u1.id
      LEFT JOIN users u2 ON e.assigned_to = u2.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (status) {
      query += ` AND e.status = $${paramCount++}`;
      params.push(status);
    }
    if (priority) {
      query += ` AND e.priority = $${paramCount++}`;
      params.push(priority);
    }
    if (assignedTo) {
      query += ` AND e.assigned_to = $${paramCount++}`;
      params.push(assignedTo);
    }
    if (incidentType) {
      query += ` AND e.incident_type = $${paramCount++}`;
      params.push(incidentType);
    }
    
    query += ` ORDER BY e.created_at DESC`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar evidências:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter evidência por ID
router.get('/:id', async (req, res) => {
  try {
    const evidenceResult = await db.query(
      `SELECT e.*,
              u1.username as created_by_username,
              u2.username as assigned_to_username
       FROM evidence e
       LEFT JOIN users u1 ON e.created_by = u1.id
       LEFT JOIN users u2 ON e.assigned_to = u2.id
       WHERE e.id = $1`,
      [req.params.id]
    );
    
    if (evidenceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Evidência não encontrada' });
    }
    
    const evidence = evidenceResult.rows[0];
    
    // Buscar arquivos relacionados
    const filesResult = await db.query(
      'SELECT * FROM evidence_files WHERE evidence_id = $1',
      [req.params.id]
    );
    
    // Buscar gravações relacionadas
    const recordingsResult = await db.query(
      `SELECT r.*, c.name as camera_name
       FROM evidence_recordings er
       JOIN recordings r ON er.recording_id = r.id
       JOIN cameras c ON r.camera_id = c.id
       WHERE er.evidence_id = $1`,
      [req.params.id]
    );
    
    evidence.files = filesResult.rows;
    evidence.recordings = recordingsResult.rows;
    
    res.json(evidence);
  } catch (error) {
    console.error('Erro ao obter evidência:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar evidência
router.post('/', async (req, res) => {
  try {
    const { title, description, incidentType, incidentDate, location, status, priority, assignedTo } = req.body;
    
    const result = await db.query(
      `INSERT INTO evidence (title, description, incident_type, incident_date, location, status, priority, created_by, assigned_to)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [title, description, incidentType, incidentDate, location, status || 'open', priority || 'medium', req.user.userId, assignedTo]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar evidência:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar evidência
router.put('/:id', async (req, res) => {
  try {
    const { title, description, incidentType, incidentDate, location, status, priority, assignedTo } = req.body;
    
    const result = await db.query(
      `UPDATE evidence SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        incident_type = COALESCE($3, incident_type),
        incident_date = COALESCE($4, incident_date),
        location = COALESCE($5, location),
        status = COALESCE($6, status),
        priority = COALESCE($7, priority),
        assigned_to = COALESCE($8, assigned_to),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [title, description, incidentType, incidentDate, location, status, priority, assignedTo, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evidência não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar evidência:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar evidência
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM evidence WHERE id = $1 RETURNING id', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evidência não encontrada' });
    }
    
    res.json({ message: 'Evidência deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar evidência:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Adicionar arquivo à evidência
router.post('/:id/files', async (req, res) => {
  try {
    const { fileType, filePath, fileName, fileSize, description } = req.body;
    
    const result = await db.query(
      `INSERT INTO evidence_files (evidence_id, file_type, file_path, file_name, file_size, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.params.id, fileType, filePath, fileName, fileSize, description]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao adicionar arquivo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Vincular gravação à evidência
router.post('/:id/recordings', async (req, res) => {
  try {
    const { recordingId, startTime, endTime } = req.body;
    
    const result = await db.query(
      `INSERT INTO evidence_recordings (evidence_id, recording_id, start_time, end_time)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (evidence_id, recording_id) DO NOTHING
       RETURNING *`,
      [req.params.id, recordingId, startTime, endTime]
    );
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Gravação já vinculada ou inválida' });
    }
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao vincular gravação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;

