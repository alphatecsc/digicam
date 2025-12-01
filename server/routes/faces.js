const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

// Listar pessoas cadastradas
router.get('/persons', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM persons ORDER BY name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pessoas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar pessoa
router.post('/persons', async (req, res) => {
  try {
    const { name, faceEncoding, photoPath, isAuthorized, notes } = req.body;
    
    const result = await db.query(
      `INSERT INTO persons (name, face_encoding, photo_path, is_authorized, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, faceEncoding, photoPath, isAuthorized !== false, notes]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar pessoa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar pessoa
router.put('/persons/:id', async (req, res) => {
  try {
    const { name, faceEncoding, photoPath, isAuthorized, notes } = req.body;
    
    const result = await db.query(
      `UPDATE persons SET
        name = COALESCE($1, name),
        face_encoding = COALESCE($2, face_encoding),
        photo_path = COALESCE($3, photo_path),
        is_authorized = COALESCE($4, is_authorized),
        notes = COALESCE($5, notes),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [name, faceEncoding, photoPath, isAuthorized, notes, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar pessoa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar pessoa
router.delete('/persons/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM persons WHERE id = $1 RETURNING id', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }
    
    res.json({ message: 'Pessoa deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar pessoa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar faces reconhecidas
router.get('/recognized', async (req, res) => {
  try {
    const { cameraId, personId, startDate, endDate, isAuthorized } = req.query;
    
    let query = `
      SELECT rf.*, c.name as camera_name, p.name as person_name
      FROM recognized_faces rf
      JOIN cameras c ON rf.camera_id = c.id
      LEFT JOIN persons p ON rf.person_id = p.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (cameraId) {
      query += ` AND rf.camera_id = $${paramCount++}`;
      params.push(cameraId);
    }
    if (personId) {
      query += ` AND rf.person_id = $${paramCount++}`;
      params.push(personId);
    }
    if (startDate) {
      query += ` AND rf.detected_at >= $${paramCount++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND rf.detected_at <= $${paramCount++}`;
      params.push(endDate);
    }
    if (isAuthorized !== undefined) {
      query += ` AND rf.is_authorized = $${paramCount++}`;
      params.push(isAuthorized === 'true');
    }
    
    query += ` ORDER BY rf.detected_at DESC LIMIT 100`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar faces reconhecidas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar registro de face reconhecida
router.post('/recognized', async (req, res) => {
  try {
    const { cameraId, faceEncoding, personId, personName, confidence, snapshotPath, isAuthorized } = req.body;
    
    const result = await db.query(
      `INSERT INTO recognized_faces (camera_id, face_encoding, person_id, person_name, confidence, snapshot_path, is_authorized)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [cameraId, faceEncoding, personId, personName, confidence, snapshotPath, isAuthorized]
    );
    
    // Registrar evento no log
    await db.query(
      `INSERT INTO event_logs (event_type, source_module, camera_id, severity, message, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        isAuthorized ? 'face_recognized_authorized' : 'face_recognized_unauthorized',
        'face',
        cameraId,
        isAuthorized ? 'info' : 'warning',
        `Face reconhecida: ${personName || 'Desconhecido'}`,
        JSON.stringify({ personId, confidence })
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar registro de face:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;

