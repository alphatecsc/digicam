const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

// Listar fontes de insight
router.get('/sources', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM insight_sources ORDER BY name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar fontes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar fonte de insight
router.post('/sources', async (req, res) => {
  try {
    const { name, sourceType, sourceIdentifier, isActive } = req.body;
    
    const result = await db.query(
      `INSERT INTO insight_sources (name, source_type, source_identifier, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, sourceType || 'desktop', sourceIdentifier, isActive !== false]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar fonte:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar fonte
router.put('/sources/:id', async (req, res) => {
  try {
    const { name, sourceType, sourceIdentifier, isActive } = req.body;
    
    const result = await db.query(
      `UPDATE insight_sources SET
        name = COALESCE($1, name),
        source_type = COALESCE($2, source_type),
        source_identifier = COALESCE($3, source_identifier),
        is_active = COALESCE($4, is_active)
       WHERE id = $5
       RETURNING *`,
      [name, sourceType, sourceIdentifier, isActive, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fonte não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar fonte:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar fonte
router.delete('/sources/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM insight_sources WHERE id = $1 RETURNING id', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fonte não encontrada' });
    }
    
    res.json({ message: 'Fonte deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar fonte:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;

