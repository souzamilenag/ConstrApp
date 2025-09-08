import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
let socket;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

function ChatConversationPage() {
    const { otherUserId: otherUserIdParam } = useParams();
    const otherUserId = Number(otherUserIdParam);
    const { user: currentUser, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [otherUserName, setOtherUserName] = useState('Carregando...');
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [error, setError] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const messagesEndRef = useRef(null);
    const fetchHistory = useCallback(async () => {
        if (!otherUserId) return;
        setLoadingHistory(true);
        setError('');
        try {
            try {
                const userResponse = await api.get(`/users/profile/${otherUserId}`); // Usar a rota '/profile/:id'
                setOtherUserName(userResponse.data?.nome || `Usuário ${otherUserId}`);
            } catch (userErr) {
                console.warn("Não foi possível buscar nome do outro usuário", userErr);
                setOtherUserName(`Usuário ${otherUserId}`);
            }

            const historyResponse = await api.get(`/chat/conversa/${otherUserId}`);
            setMessages(historyResponse.data?.mensagens || []);
        } catch (err) {
            console.error("Erro ao buscar histórico do chat:", err);
            setError(err.response?.data?.message || "Falha ao carregar histórico.");
            setMessages([]);
        } finally {
            setLoadingHistory(false);
        }
    }, [otherUserId]);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    useEffect(() => {
        if (authLoading || !currentUser) {
            return;
        }

        if (!socket || !socket.connected) {
            console.log("Conectando ao Socket.IO...");
            socket = io(SOCKET_URL);

            socket.on('connect', () => {
                console.log('Socket.IO Conectado:', socket.id);
                setIsConnected(true);
                socket.emit('identificar', currentUser.id);
                if (otherUserId) {
                    socket.emit('entrarSala', { remetenteId: currentUser.id, destinatarioId: otherUserId });
                }
            });

            socket.on('disconnect', () => {
                console.log('Socket.IO Desconectado.');
                setIsConnected(false);
            });

            socket.on('connect_error', (err) => {
                console.error('Socket.IO Erro de Conexão:', err.message);
                setError('Não foi possível conectar ao chat em tempo real.');
                setIsConnected(false);
            });

        } else {
            console.log("Socket já conectado. Identificando e entrando na sala...");
            setIsConnected(true);
            socket.emit('identificar', currentUser.id);
            if (otherUserId) {
                socket.emit('entrarSala', { remetenteId: currentUser.id, destinatarioId: otherUserId });
            }
        }
        const messageListener = (novaMensagem) => {
            console.log("Socket.IO 'receberMensagem':", novaMensagem);
            if (
                (novaMensagem.remetente_id === currentUser.id && novaMensagem.destinatario_id === otherUserId) ||
                (novaMensagem.remetente_id === otherUserId && novaMensagem.destinatario_id === currentUser.id)
            ) {
                setMessages((prevMessages) => [...prevMessages, novaMensagem]);
            }
        };
        socket.on('receberMensagem', messageListener);

        return () => {
            console.log("Limpando listeners e saindo da sala...");
            if (socket) {
                socket.off('receberMensagem', messageListener);
            }
        };

    }, [currentUser, otherUserId, authLoading]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket || !isConnected || !currentUser || !otherUserId) {
            console.warn("Não é possível enviar: msg vazia, socket desconectado ou IDs faltando.");
            return;
        }

        const messageData = {
            remetenteId: currentUser.id,
            destinatarioId: otherUserId,
            mensagem: newMessage,
        };

        console.log("Enviando mensagem via Socket.IO:", messageData);
        socket.emit('enviarMensagem', messageData);
        setNewMessage('');
    };

    if (authLoading || loadingHistory) {
        return <div style={styles.centerMessage}>Carregando conversa...</div>;
    }

    if (error) {
        return <div style={{ ...styles.centerMessage, color: 'red' }}>Erro: {error} <button onClick={() => navigate('/chat')}>Voltar para Conversas</button></div>;
    }


    return (
        <div style={styles.chatContainer}>

            <div style={styles.header}>
                <Link to="/chat" style={styles.backButton}>← Voltar</Link>
                <h2 style={styles.headerTitle}>Chat com {otherUserName}</h2>
                <span style={isConnected ? styles.statusOnline : styles.statusOffline}>
                    {isConnected ? 'Conectado' : 'Offline'}
                </span>
            </div>
            <div style={styles.messagesArea}>
                {messages.length === 0 && !loadingHistory && <p style={styles.noMessages}>Inicie a conversa!</p>}
                {messages.map((msg) => {
                    const isMe = msg.remetente_id === currentUser?.id;
                    return (
                        <div key={msg.id} style={isMe ? styles.myMessage : styles.otherMessage}>
                            <div style={styles.messageBubble(isMe)}>
                                {msg.mensagem}
                                <span style={styles.messageTimestamp}>
                                    {new Date(msg.createdAt || msg.data_envio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />

            </div>

            <form onSubmit={handleSendMessage} style={styles.inputArea}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    style={styles.messageInput}
                    disabled={!isConnected}
                />
                <button
                    type="submit"
                    style={styles.sendButton}
                    disabled={!isConnected || !newMessage.trim()}
                >
                    Enviar
                </button>
            </form>

        </div>
    );
}

const styles = {
    centerMessage: { textAlign: 'center', padding: '40px 20px', fontSize: '1.1em', color: '#555' },
    errorText: { color: 'red', textAlign: 'center', padding: '5px 0', fontSize: '0.9em' },
    pageContainer: {},
    chatContainer: {
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(90vh)',
        maxHeight: '700px',
        maxWidth: '750px',
        margin: '20px auto',
        border: '1px solid #ccc',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#f9f9f9',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        padding: '10px 15px',
        backgroundColor: '#eee',
        borderBottom: '1px solid #ccc',
    },
    backButton: {
        marginRight: '15px',
        textDecoration: 'none',
        color: '#007bff',
        fontWeight: 'bold',
        fontSize: '1.2em'
    },
    headerTitle: {
        margin: 0,
        flexGrow: 1,
        textAlign: 'center',
        fontSize: '1.1em'
    },
    statusOnline: { marginLeft: '10px', fontSize: '0.8em', color: 'green', whiteSpace: 'nowrap' },
    statusOffline: { marginLeft: '10px', fontSize: '0.8em', color: 'grey', whiteSpace: 'nowrap' },
    messagesContainer: {
        flexGrow: 1,
        overflowY: 'auto',
        padding: '15px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#e5ddd5',
        backgroundImage: 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACWCAYAAAA8AXHiAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAEPSURBVHhe7dNBDQAgEMCwA/+egQcMLGy0g54T7gQAACAAAEAAAAIAAIAAAQAAAIABAIAAAQAAAIAAAQAAAEAAAAIAAIAAAQAAAEAAAAIAAIAAAQAAAIABAAAIAAIAAAQAAAEAAAAIAAIAAAQAAAEAAAAIAAIAAAQCAAAAEAAAAIAAIAAAEAAAAIAAIAAAQAAAIAAAQAAAIABAAAIAAIAAAEAAAAIAAIAAAEAAAAIAAIAAAQAAAIABAAAIAAIAAAQAAAEAAAAIAAIAAAQAAAEAAAAIAAIAAACAAAEAAAAIAAIAAAQAAAEAAAAIAAIAAAQAAAIAAAQAAAIABAAAIAAIAAAEAAAAIAAIAAAEAAAAIAAIAAAQAAAIABAAAIAAIAAAEAgAEAAAAIAAIAAAEAAAAIAAIAAAQAAAEAAAAIAAIAAAEAAAAIAAIAAAQAAAIAAAQCAC9hzBA63iVq9wAAAABJRU5ErkJggg==")', // Textura leve (opcional)
    },
    noMessages: {
        textAlign: 'center',
        color: '#888',
        marginTop: 'auto',
        marginBottom: 'auto'
    },
    myMessage: {
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: '8px',
        marginLeft: 'auto',
        maxWidth: '75%'
    },
    otherMessage: {
        display: 'flex',
        justifyContent: 'flex-start',
        marginBottom: '8px',
        marginRight: 'auto',
        maxWidth: '75%'
    },
    messageBubble: (isMe) => ({
        padding: '8px 12px',
        borderRadius: '12px',
        backgroundColor: isMe ? '#dcf8c6' : '#fff',
        color: 'black',
        wordWrap: 'break-word',
        boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
        position: 'relative',
    }),
    messageTimestamp: {
        fontSize: '0.7em',
        display: 'block',
        textAlign: 'right',
        marginTop: '5px',
        color: '#999',
        userSelect: 'none',
    },
    inputArea: {
        display: 'flex',
        padding: '10px 15px',
        borderTop: '1px solid #ccc',
        backgroundColor: '#f0f0f0',
        alignItems: 'center'
    },
    messageInput: {
        flexGrow: 1,
        padding: '10px 15px',
        border: '1px solid #ccc',
        borderRadius: '20px',
        marginRight: '10px',
        fontSize: '1em',
    },
    sendButton: {
        padding: '10px 15px',
        border: 'none',
        backgroundColor: '#007bff',
        color: 'white',
        borderRadius: '50%',
        cursor: 'pointer',
        fontSize: '1.2em',
        lineHeight: '1',
    },
};

export default ChatConversationPage;