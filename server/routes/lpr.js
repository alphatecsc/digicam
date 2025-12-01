const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

// Listar placas autorizadas
router.get('/authorized', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM authorized_plates WHERE is_active = true ORDER BY plate_number'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar placas autorizadas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar placa autorizada
router.post('/authorized', async (req, res) => {
  try {
    const { plateNumber, country, ownerName, vehicleType, isActive, notes } = req.body;
    
    const result = await db.query(
      `INSERT INTO authorized_plates (plate_number, country, owner_name, vehicle_type, is_active, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [plateNumber, country || 'BR', ownerName, vehicleType, isActive !== false, notes]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Placa já cadastrada' });
    }
    console.error('Erro ao criar placa autorizada:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar placa autorizada
router.put('/authorized/:id', async (req, res) => {
  try {
    const { plateNumber, country, ownerName, vehicleType, isActive, notes } = req.body;
    
    const result = await db.query(
      `UPDATE authorized_plates SET
        plate_number = COALESCE($1, plate_number),
        country = COALESCE($2, country),
        owner_name = COALESCE($3, owner_name),
        vehicle_type = COALESCE($4, vehicle_type),
        is_active = COALESCE($5, is_active),
        notes = COALESCE($6, notes)
       WHERE id = $7
       RETURNING *`,
      [plateNumber, country, ownerName, vehicleType, isActive, notes, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Placa não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar placa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar placa autorizada
router.delete('/authorized/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM authorized_plates WHERE id = $1 RETURNING id', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Placa não encontrada' });
    }
    
    res.json({ message: 'Placa deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar placa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar detecções de placas
router.get('/detections', async (req, res) => {
  try {
    const { cameraId, plateNumber, startDate, endDate, isAuthorized, isBlacklisted } = req.query;
    
    let query = `
      SELECT lp.*, c.name as camera_name
      FROM license_plates lp
      JOIN cameras c ON lp.camera_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (cameraId) {
      query += ` AND lp.camera_id = $${paramCount++}`;
      params.push(cameraId);
    }
    if (plateNumber) {
      query += ` AND lp.plate_number ILIKE $${paramCount++}`;
      params.push(`%${plateNumber}%`);
    }
    if (startDate) {
      query += ` AND lp.detected_at >= $${paramCount++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND lp.detected_at <= $${paramCount++}`;
      params.push(endDate);
    }
    if (isAuthorized !== undefined) {
      query += ` AND lp.is_authorized = $${paramCount++}`;
      params.push(isAuthorized === 'true');
    }
    if (isBlacklisted !== undefined) {
      query += ` AND lp.is_blacklisted = $${paramCount++}`;
      params.push(isBlacklisted === 'true');
    }
    
    query += ` ORDER BY lp.detected_at DESC LIMIT 100`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar detecções:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar detecção de placa
router.post('/detections', async (req, res) => {
  try {
    const { cameraId, plateNumber, country, vehicleType, confidence, snapshotPath } = req.body;
    
    // Verificar se a placa está autorizada
    const authCheck = await db.query(
      'SELECT id, is_active FROM authorized_plates WHERE plate_number = $1 AND country = $2',
      [plateNumber, country || 'BR']
    );
    
    const isAuthorized = authCheck.rows.length > 0 && authCheck.rows[0].is_active;
    
    const result = await db.query(
      `INSERT INTO license_plates (camera_id, plate_number, country, vehicle_type, confidence, snapshot_path, is_authorized)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [cameraId, plateNumber, country || 'BR', vehicleType, confidence, snapshotPath, isAuthorized]
    );
    
    // Registrar evento no log
    await db.query(
      `INSERT INTO event_logs (event_type, source_module, camera_id, severity, message, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        isAuthorized ? 'lpr_authorized' : 'lpr_unauthorized',
        'lpr',
        cameraId,
        isAuthorized ? 'info' : 'warning',
        `Placa detectada: ${plateNumber}`,
        JSON.stringify({ plateNumber, isAuthorized, confidence })
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar detecção:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Marcar placa como blacklist
router.put('/detections/:id/blacklist', async (req, res) => {
  try {
    const { isBlacklisted } = req.body;
    
    const result = await db.query(
      `UPDATE license_plates SET is_blacklisted = $1 WHERE id = $2 RETURNING *`,
      [isBlacklisted !== false, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Detecção não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar blacklist:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;

