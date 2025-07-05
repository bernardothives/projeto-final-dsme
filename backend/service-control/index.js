 const express = require('express');
const db = require('./database.js');
const app = express();
const PORT = 3001;

app.use(express.json());

// Rota para o App Móvel salvar a configuração
app.post('/config', (req, res) => {
    const { threshold_cm } = req.body;
    if (!threshold_cm) {
        return res.status(400).json({ "error": "Parâmetro 'threshold_cm' é obrigatório." });
    }
    const sql = 'INSERT OR REPLACE INTO configuracao (parametro, valor) VALUES (?, ?)';
    db.run(sql, ['threshold_cm', threshold_cm], function(err) {
        if (err) {
            return res.status(500).json({ "error": err.message });
        }
        res.status(200).json({ message: 'Configuração salva!', "threshold_cm": threshold_cm });
    });
});

// Rota para o Embarcado buscar a configuração
app.get('/config', (req, res) => {
    const sql = "SELECT * FROM configuracao WHERE parametro = 'threshold_cm'";
    db.get(sql, [], (err, row) => {
        if (err) {
            return res.status(500).json({ "error": err.message });
        }
        // O embarcado espera um JSON simples, ex: { "threshold_cm": 20 }
        res.status(200).json({ "threshold_cm": row ? Number(row.valor) : 20 });
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Serviço de Controle rodando na porta ${PORT}`);
});