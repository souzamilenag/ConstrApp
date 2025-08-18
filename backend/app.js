'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const db = require('./models');

// Importação das Rotas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const empreendimentoRoutes = require('./routes/empreendimentoRoutes');
const unidadeRoutes = require('./routes/unidadeRoutes');
const agendamentoRoutes = require('./routes/agendamentoRoutes');
const compraRoutes = require('./routes/compraRoutes');
const pagamentoRoutes = require('./routes/pagamentoRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificacaoRoutes = require('./routes/notificacaoRoutes');
const construtoraRoutes = require('./routes/construtoraRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// Inicialização do Servidor
const app = express();
const server = http.createServer(app);

// Configuração do Socket.IO
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "*", 
        methods: ["GET", "POST"]
    }
});

// Middlewares Globais do Express
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Definição das Rotas da API ---
app.use('/api/health', (req, res) => { res.status(200).json({ status: 'UP', message: 'API está funcionando!' }); });
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/empreendimentos', empreendimentoRoutes);
app.use('/api/unidades', unidadeRoutes);
app.use('/api/agendamentos', agendamentoRoutes);
app.use('/api/compras', compraRoutes);
app.use('/api/pagamentos', pagamentoRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notificacoes', notificacaoRoutes);
app.use('/api/construtoras', construtoraRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
}


const onlineUsers = {};

const criarNomeSala = (id1, id2) => {
    return [String(id1), String(id2)].sort().join('--');
};

io.on('connection', (socket) => {
    console.log(`⚡: Usuário conectado via Socket.IO: ${socket.id}`);

    socket.on('identificar', (userId) => {
        if (userId) {
            onlineUsers[userId] = socket.id;
            socket.userId = userId; 
            console.log(`Usuário ${userId} identificado com socket ${socket.id}`);
        }
    });

    socket.on('entrarSala', ({ remetenteId, destinatarioId }) => {
         if (!remetenteId || !destinatarioId) return;
         const nomeSala = criarNomeSala(remetenteId, destinatarioId);
         socket.join(nomeSala);
         console.log(`Socket ${socket.id} (User ${socket.userId || 'Não identificado'}) entrou na sala ${nomeSala}`);
    });

    socket.on('enviarMensagem', async (data) => {
        const { remetenteId, destinatarioId, mensagem, empreendimentoId, compraId } = data;
        console.log("Backend recebendo 'enviarMensagem':", data);

        if (!remetenteId || !destinatarioId || !mensagem) {
            console.error("Dados inválidos para 'enviarMensagem':", data);
            return;
        }

        try {
            const novaMensagem = await db.Chat.create({
                remetente_id: remetenteId,
                destinatario_id: destinatarioId,
                mensagem: mensagem,
                empreendimento_id: empreendimentoId || null,
                compra_id: compraId || null,
                status: 'Enviado'
            });

            const nomeSala = criarNomeSala(remetenteId, destinatarioId);
            io.to(nomeSala).emit('receberMensagem', novaMensagem.toJSON());
            console.log(`Mensagem emitida para sala ${nomeSala}`);

            if (!onlineUsers[destinatarioId]) {
                console.log(`Destinatário ${destinatarioId} está offline. Considerar notificação PUSH/Email.`);
            }

        } catch (error) {
            console.error("Erro ao processar 'enviarMensagem':", error);
        }
    });

    socket.on('marcarComoLida', async ({ mensagemId, leitorId }) => {
        console.log(`Pedido para marcar msg ${mensagemId} como lida por ${leitorId}`);
    });

    socket.on('disconnect', () => {
        console.log(`🔥: Usuário desconectado: ${socket.id}`);
        for (const userId in onlineUsers) {
            if (onlineUsers[userId] === socket.id) {
                delete onlineUsers[userId];
                console.log(`Usuário ${userId} removido dos online.`);
                break;
            }
        }
    });
});
global.io = io;
global.onlineUsers = onlineUsers;
const PORT = process.env.PORT || 5000;

db.sequelize.sync()
  .then(() => {
    console.log('✅ Banco de dados sincronizado com sucesso.');
    server.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT} em modo ${process.env.NODE_ENV || 'development'}.`);
    });
  })
  .catch((err) => {
    console.error('❌ Erro ao sincronizar com o banco de dados:', err);
    process.exit(1);
  });