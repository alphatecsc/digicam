const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

// ========== TRIPWIRE (Linha de Pedestre) ==========

// Listar regras de tripwire
router.get('/tripwire', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT t.*, c.name as camera_name
       FROM dva_tripwire t
       JOIN cameras c ON t.camera_id = c.id
       ORDER BY t.name`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar tripwires:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar regra de tripwire
router.post('/tripwire', async (req, res) => {
  try {
    const { cameraId, name, lineCoordinates, direction, objectTypes, sensitivity, isActive } = req.body;
    
    const result = await db.query(
      `INSERT INTO dva_tripwire (camera_id, name, line_coordinates, direction, object_types, sensitivity, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [cameraId, name, JSON.stringify(lineCoordinates), direction || 'both', objectTypes, sensitivity || 50, isActive !== false]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar tripwire:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar tripwire
router.put('/tripwire/:id', async (req, res) => {
  try {
    const { name, lineCoordinates, direction, objectTypes, sensitivity, isActive } = req.body;
    
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (lineCoordinates) {
      updates.push(`line_coordinates = $${paramCount++}`);
      values.push(JSON.stringify(lineCoordinates));
    }
    if (direction) {
      updates.push(`direction = $${paramCount++}`);
      values.push(direction);
    }
    if (objectTypes) {
      updates.push(`object_types = $${paramCount++}`);
      values.push(objectTypes);
    }
    if (sensitivity !== undefined) {
      updates.push(`sensitivity = $${paramCount++}`);
      values.push(sensitivity);
    }
    if (isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(isActive);
    }
    
    values.push(req.params.id);
    
    const result = await db.query(
      `UPDATE dva_tripwire SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tripwire não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar tripwire:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar eventos de tripwire
router.get('/tripwire/events', async (req, res) => {
  try {
    const { tripwireId, cameraId, startDate, endDate } = req.query;
    
    let query = `
      SELECT te.*, t.name as tripwire_name, c.name as camera_name
      FROM tripwire_events te
      JOIN dva_tripwire t ON te.tripwire_id = t.id
      JOIN cameras c ON te.camera_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (tripwireId) {
      query += ` AND te.tripwire_id = $${paramCount++}`;
      params.push(tripwireId);
    }
    if (cameraId) {
      query += ` AND te.camera_id = $${paramCount++}`;
      params.push(cameraId);
    }
    if (startDate) {
      query += ` AND te.detected_at >= $${paramCount++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND te.detected_at <= $${paramCount++}`;
      params.push(endDate);
    }
    
    query += ` ORDER BY te.detected_at DESC LIMIT 100`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar eventos tripwire:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar evento de tripwire
router.post('/tripwire/events', async (req, res) => {
  try {
    const { tripwireId, cameraId, direction, objectType, confidence, snapshotPath } = req.body;
    
    const result = await db.query(
      `INSERT INTO tripwire_events (tripwire_id, camera_id, direction, object_type, confidence, snapshot_path)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [tripwireId, cameraId, direction, objectType, confidence, snapshotPath]
    );
    
    // Registrar evento no log
    await db.query(
      `INSERT INTO event_logs (event_type, source_module, camera_id, severity, message, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'tripwire_crossed',
        'dva',
        cameraId,
        'warning',
        `Tripwire cruzado: ${direction}`,
        JSON.stringify({ tripwireId, objectType, confidence })
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar evento tripwire:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ========== PERIMETER (Cerca Virtual) ==========

// Listar regras de perimeter
router.get('/perimeter', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*, c.name as camera_name
       FROM dva_perimeter p
       JOIN cameras c ON p.camera_id = c.id
       ORDER BY p.name`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar perimeters:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar regra de perimeter
router.post('/perimeter', async (req, res) => {
  try {
    const { cameraId, name, zoneCoordinates, zoneType, objectTypes, sensitivity, isActive } = req.body;
    
    const result = await db.query(
      `INSERT INTO dva_perimeter (camera_id, name, zone_coordinates, zone_type, object_types, sensitivity, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [cameraId, name, JSON.stringify(zoneCoordinates), zoneType, objectTypes, sensitivity || 50, isActive !== false]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar perimeter:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar perimeter
router.put('/perimeter/:id', async (req, res) => {
  try {
    const { name, zoneCoordinates, zoneType, objectTypes, sensitivity, isActive } = req.body;
    
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (zoneCoordinates) {
      updates.push(`zone_coordinates = $${paramCount++}`);
      values.push(JSON.stringify(zoneCoordinates));
    }
    if (zoneType) {
      updates.push(`zone_type = $${paramCount++}`);
      values.push(zoneType);
    }
    if (objectTypes) {
      updates.push(`object_types = $${paramCount++}`);
      values.push(objectTypes);
    }
    if (sensitivity !== undefined) {
      updates.push(`sensitivity = $${paramCount++}`);
      values.push(sensitivity);
    }
    if (isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(isActive);
    }
    
    values.push(req.params.id);
    
    const result = await db.query(
      `UPDATE dva_perimeter SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Perimeter não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar perimeter:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar eventos de perimeter
router.get('/perimeter/events', async (req, res) => {
  try {
    const { perimeterId, cameraId, startDate, endDate } = req.query;
    
    let query = `
      SELECT pe.*, p.name as perimeter_name, c.name as camera_name
      FROM perimeter_events pe
      JOIN dva_perimeter p ON pe.perimeter_id = p.id
      JOIN cameras c ON pe.camera_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (perimeterId) {
      query += ` AND pe.perimeter_id = $${paramCount++}`;
      params.push(perimeterId);
    }
    if (cameraId) {
      query += ` AND pe.camera_id = $${paramCount++}`;
      params.push(cameraId);
    }
    if (startDate) {
      query += ` AND pe.detected_at >= $${paramCount++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND pe.detected_at <= $${paramCount++}`;
      params.push(endDate);
    }
    
    query += ` ORDER BY pe.detected_at DESC LIMIT 100`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar eventos perimeter:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar evento de perimeter
router.post('/perimeter/events', async (req, res) => {
  try {
    const { perimeterId, cameraId, eventType, objectType, confidence, snapshotPath } = req.body;
    
    const result = await db.query(
      `INSERT INTO perimeter_events (perimeter_id, camera_id, event_type, object_type, confidence, snapshot_path)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [perimeterId, cameraId, eventType, objectType, confidence, snapshotPath]
    );
    
    // Registrar evento no log
    await db.query(
      `INSERT INTO event_logs (event_type, source_module, camera_id, severity, message, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        `perimeter_${eventType}`,
        'dva',
        cameraId,
        eventType === 'entry' ? 'warning' : 'info',
        `Evento de perimeter: ${eventType}`,
        JSON.stringify({ perimeterId, objectType, confidence })
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar evento perimeter:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ========== CONTAGEM DE OBJETOS ==========

// Listar zonas de contagem
router.get('/counting', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT oc.*, c.name as camera_name
       FROM object_counting oc
       JOIN cameras c ON oc.camera_id = c.id
       ORDER BY oc.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar zonas de contagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar zona de contagem
router.post('/counting', async (req, res) => {
  try {
    const { cameraId, countingZone, objectType } = req.body;
    
    const result = await db.query(
      `INSERT INTO object_counting (camera_id, counting_zone, object_type, period_start)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       RETURNING *`,
      [cameraId, JSON.stringify(countingZone), objectType]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar zona de contagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Registrar contagem
router.post('/counting/records', async (req, res) => {
  try {
    const { countingId, cameraId, direction, objectType, confidence } = req.body;
    
    const result = await db.query(
      `INSERT INTO counting_records (counting_id, camera_id, direction, object_type, confidence)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [countingId, cameraId, direction, objectType, confidence]
    );
    
    // Atualizar contadores
    const updateField = direction === 'in' ? 'count_in' : 'count_out';
    await db.query(
      `UPDATE object_counting SET ${updateField} = ${updateField} + 1, count_total = count_total + 1
       WHERE id = $1`,
      [countingId]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao registrar contagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter estatísticas de contagem
router.get('/counting/:id/stats', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM object_counting WHERE id = $1`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Zona de contagem não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;

