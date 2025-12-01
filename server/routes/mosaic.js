const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

// Listar mosaicos
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT m.*, u.username as created_by_username
       FROM mosaics m
       LEFT JOIN users u ON m.user_id = u.id
       WHERE m.user_id = $1 OR m.user_id IS NULL
       ORDER BY m.is_default DESC, m.name`,
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar mosaicos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter mosaico por ID
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT m.*, u.username as created_by_username
       FROM mosaics m
       LEFT JOIN users u ON m.user_id = u.id
       WHERE m.id = $1`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mosaico não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter mosaico:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar mosaico
router.post('/', async (req, res) => {
  try {
    const { name, layoutConfig, isDefault } = req.body;
    
    // Se for padrão, remover padrão de outros mosaicos do usuário
    if (isDefault) {
      await db.query(
        'UPDATE mosaics SET is_default = false WHERE user_id = $1',
        [req.user.userId]
      );
    }
    
    const result = await db.query(
      `INSERT INTO mosaics (name, user_id, layout_config, is_default)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, req.user.userId, JSON.stringify(layoutConfig), isDefault || false]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar mosaico:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar mosaico
router.put('/:id', async (req, res) => {
  try {
    const { name, layoutConfig, isDefault } = req.body;
    
    // Se for padrão, remover padrão de outros mosaicos do usuário
    if (isDefault) {
      await db.query(
        'UPDATE mosaics SET is_default = false WHERE user_id = $1 AND id != $2',
        [req.user.userId, req.params.id]
      );
    }
    
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (layoutConfig) {
      updates.push(`layout_config = $${paramCount++}`);
      values.push(JSON.stringify(layoutConfig));
    }
    if (isDefault !== undefined) {
      updates.push(`is_default = $${paramCount++}`);
      values.push(isDefault);
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.params.id);
    
    const result = await db.query(
      `UPDATE mosaics SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mosaico não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar mosaico:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar mosaico
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM mosaics WHERE id = $1 AND user_id = $2 RETURNING id', [
      req.params.id,
      req.user.userId
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mosaico não encontrado' });
    }
    
    res.json({ message: 'Mosaico deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar mosaico:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;

