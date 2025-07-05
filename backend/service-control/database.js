const sqlite3 = require('sqlite3').verbose();
const DB_SOURCE = "controle.db";

const db = new sqlite3.Database(DB_SOURCE, (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {
        console.log('✅ Conectado ao banco de dados de controle.');
        db.run(`
            CREATE TABLE IF NOT EXISTS configuracao (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                parametro TEXT UNIQUE,
                valor TEXT
            )
        `, (err) => {
            if (!err) {
                // Garante que existe um valor padrão para o embarcado não falhar na primeira execução
                db.run('INSERT OR IGNORE INTO configuracao (parametro, valor) VALUES (?, ?)', ['threshold_cm', '20']);
            }
        });
    }
});

module.exports = db;