 const express = require('express');
const db = require('./database.js');
const app = express();
const PORT = 3002;

app.use(express.json());

// Rota para o Embarcado enviar um novo log de distância
app.post('/', (req, res) => {
    const { distancia_cm } = req.body;
    if (distancia_cm === undefined) {
        return res.status(400).json({ "error": "Parâmetro 'distancia_cm' é obrigatório." });
    }
    const sql = 'INSERT INTO logs (distancia_cm) VALUES (?)';
    db.run(sql, [distancia_cm], function(err) {
        if (err) {
            return res.status(500).json({ "error": err.message });
        }
        res.status(201).json({ message: 'Log salvo!', id: this.lastID });
    });
});

// Rota para o App Móvel buscar o histórico de logs
app.get('/', (req, res) => {
    const sql = "SELECT * FROM logs ORDER BY timestamp DESC LIMIT 100";
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ "error": err.message });
        }
        res.status(200).json({ logs: rows });
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Serviço de Logging rodando na porta ${PORT}`);
});