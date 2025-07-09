// 1. IMPORTAÇÃO DOS MÓDULOS NECESSÁRIOS
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const morgan = require('morgan');

// 2. CONFIGURAÇÕES BÁSICAS
const app = express();
const PORT = 3000; // Porta padrão para o gateway. O App e o IoT se comunicarão com ela.

// Endereços dos microservices que este gateway irá gerenciar.
const aplicationTargets = {
    control: 'http://localhost:3001',
    logging: 'http://localhost:3002',
};

// 3. USO DE MIDDLEWARES
// Morgan: Usado para logar todas as requisições que chegam no gateway.
// O formato 'dev' é conciso e colorido, ótimo para desenvolvimento.
// Exemplo de log: GET /config 200 5.114 ms - 49
app.use(morgan('dev'));

// 4. CONFIGURAÇÃO DO PROXY (O CORAÇÃO DO GATEWAY)

// Rota para o Microservice de Controle
// Todas as requisições que chegarem em /config (ex: /config, /config/123)
// serão redirecionadas para o serviço de controle.
app.use('/', createProxyMiddleware({
    target: aplicationTargets.control,
    changeOrigin: true, // Necessário para que o servidor de destino não recuse a requisição.
    pathRewrite: {
        '^/config': '', // Reescreve a URL. Remove o '/config' do caminho.
                        // Ex: Uma chamada para /config/parametro vira /parametro no microservice.
                        // Isso torna o microservice independente, ele não precisa saber que foi chamado via '/config'.
    },
}));

// Rota para o Microservice de Logging
// Todas as requisições que chegarem em /logs (ex: /logs, /logs/all)
// serão redirecionadas para o serviço de logging.
app.use('/', createProxyMiddleware({
    target: aplicationTargets.logging,
    changeOrigin: true,
    pathRewrite: {
        '^/logs': '', // Remove o '/logs' do caminho.
                      // Ex: Uma chamada para /logs/new vira /new no microservice.
    },
}));


// 5. ROTA RAIZ (HEALTH CHECK)
// É uma boa prática ter uma rota na raiz do gateway para verificar se ele está online.
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'API Gateway está funcionando corretamente.',
        timestamp: new Date().toISOString(),
    });
});


// 6. INICIALIZAÇÃO DO SERVIDOR
app.listen(PORT, () => {
    console.log(`✅ API Gateway iniciado e rodando na porta ${PORT}`);
    console.log(`➡️  Requisições para /config serão redirecionadas para ${aplicationTargets.control}`);
    console.log(`➡️  Requisições para /logs serão redirecionadas para ${aplicationTargets.logging}`);
});
