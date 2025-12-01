const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

// Listar regras de automação
router.get('/rules', async (req, res) => {
  try {
    const { isActive } = req.query;
    
    let query = `
      SELECT ar.*, u.username as created_by_username
      FROM automation_rules ar
      LEFT JOIN users u ON ar.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (isActive !== undefined) {
      query += ` AND ar.is_active = $${paramCount++}`;
      params.push(isActive === 'true');
    }
    
    query += ` ORDER BY ar.priority DESC, ar.created_at DESC`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar regras:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter regra por ID
router.get('/rules/:id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT ar.*, u.username as created_by_username
       FROM automation_rules ar
       LEFT JOIN users u ON ar.created_by = u.id
       WHERE ar.id = $1`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Regra não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter regra:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar regra de automação
router.post('/rules', async (req, res) => {
  try {
    const { name, description, triggerEventType, triggerConditions, actions, isActive, priority } = req.body;
    
    const result = await db.query(
      `INSERT INTO automation_rules (name, description, trigger_event_type, trigger_conditions, actions, is_active, priority, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        name,
        description,
        triggerEventType,
        JSON.stringify(triggerConditions || {}),
        JSON.stringify(actions || []),
        isActive !== false,
        priority || 0,
        req.user.userId
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar regra:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar regra
router.put('/rules/:id', async (req, res) => {
  try {
    const { name, description, triggerEventType, triggerConditions, actions, isActive, priority } = req.body;
    
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (triggerEventType) {
      updates.push(`trigger_event_type = $${paramCount++}`);
      values.push(triggerEventType);
    }
    if (triggerConditions) {
      updates.push(`trigger_conditions = $${paramCount++}`);
      values.push(JSON.stringify(triggerConditions));
    }
    if (actions) {
      updates.push(`actions = $${paramCount++}`);
      values.push(JSON.stringify(actions));
    }
    if (isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(isActive);
    }
    if (priority !== undefined) {
      updates.push(`priority = $${paramCount++}`);
      values.push(priority);
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.params.id);
    
    const result = await db.query(
      `UPDATE automation_rules SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Regra não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar regra:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar regra
router.delete('/rules/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM automation_rules WHERE id = $1 RETURNING id', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Regra não encontrada' });
    }
    
    res.json({ message: 'Regra deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar regra:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar execuções de regras
router.get('/executions', async (req, res) => {
  try {
    const { ruleId, startDate, endDate, status } = req.query;
    
    let query = `
      SELECT ae.*, ar.name as rule_name, el.message as triggered_by_message
      FROM automation_executions ae
      JOIN automation_rules ar ON ae.rule_id = ar.id
      LEFT JOIN event_logs el ON ae.triggered_by_event_id = el.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (ruleId) {
      query += ` AND ae.rule_id = $${paramCount++}`;
      params.push(ruleId);
    }
    if (startDate) {
      query += ` AND ae.executed_at >= $${paramCount++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND ae.executed_at <= $${paramCount++}`;
      params.push(endDate);
    }
    if (status) {
      query += ` AND ae.execution_status = $${paramCount++}`;
      params.push(status);
    }
    
    query += ` ORDER BY ae.executed_at DESC LIMIT 100`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar execuções:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar registro de execução (normalmente chamado pelo sistema quando uma regra é executada)
router.post('/executions', async (req, res) => {
  try {
    const { ruleId, triggeredByEventId, executionStatus, executionResult } = req.body;
    
    const result = await db.query(
      `INSERT INTO automation_executions (rule_id, triggered_by_event_id, execution_status, execution_result)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [ruleId, triggeredByEventId, executionStatus, JSON.stringify(executionResult || {})]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar execução:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;

