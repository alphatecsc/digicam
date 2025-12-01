const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

// Obter status de câmeras para monitoramento ao vivo
router.get('/status', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, status, location, ptz_enabled FROM cameras ORDER BY name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao obter status:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Controle PTZ (simulado)
router.post('/ptz/:cameraId', async (req, res) => {
  try {
    const { cameraId } = req.params;
    const { action, value } = req.body; // action: 'pan', 'tilt', 'zoom', 'preset'
    
    // Verificar se câmera existe e tem PTZ habilitado
    const cameraResult = await db.query(
      'SELECT id, ptz_enabled FROM cameras WHERE id = $1',
      [cameraId]
    );
    
    if (cameraResult.rows.length === 0) {
      return res.status(404).json({ error: 'Câmera não encontrada' });
    }
    
    if (!cameraResult.rows[0].ptz_enabled) {
      return res.status(400).json({ error: 'PTZ não habilitado para esta câmera' });
    }
    
    // Simular comando PTZ
    // Em produção, aqui seria feita a comunicação com a câmera via protocolo apropriado
    
    res.json({
      success: true,
      message: `Comando PTZ ${action} executado`,
      cameraId,
      action,
      value
    });
  } catch (error) {
    console.error('Erro ao executar comando PTZ:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;

