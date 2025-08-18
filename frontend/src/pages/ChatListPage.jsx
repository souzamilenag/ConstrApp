import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const IconBackArrow = () => <span role="img" aria-label="Voltar" style={{ marginRight: '5px' }}>←</span>;

const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const msgDate = new Date(timestamp);
    const diffTime = Math.abs(now - msgDate);
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return diffMinutes < 1 ? 'Agora mesmo' : `${diffMinutes} min atrás`;
    } else if (diffHours < now.getHours()) {
        return msgDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 0 || (diffDays === 1 && now.getDate() === msgDate.getDate() + 1)) {
        return 'Ontem';
    } else if (diffDays < 7) {
        return msgDate.toLocaleDateString('pt-BR', { weekday: 'long' });
    }
    return msgDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

function ConversationListItem({ conversa }) {
    const { outroUsuario, ultimaMensagem } = conversa;
    const { user: currentUser } = useAuth();

    if (!outroUsuario || !ultimaMensagem) return null;

    const snippet = ultimaMensagem.mensagem.length > 45
        ? ultimaMensagem.mensagem.substring(0, 45) + '...'
        : ultimaMensagem.mensagem;
    const isMyMessage = ultimaMensagem.remetente_id === currentUser?.id;
    const prefix = isMyMessage ? "Você: " : "";
    const messageStyle = isMyMessage ? styles.myMessageSnippet : styles.otherMessageSnippet;

    return (
        <Link to={`/chat/conversa/${outroUsuario.id}`} style={styles.listItemLink}>
            <div style={styles.listItem}>
                <div style={{ ...styles.avatarPlaceholder, backgroundColor: getRandomColorForAvatar(outroUsuario.nome?.charAt(0)) }}>
                    {outroUsuario.nome?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div style={styles.content}>
                    <div style={styles.header}>
                        <span style={styles.userName}>{outroUsuario.nome || 'Usuário Desconhecido'}</span>
                        <span style={styles.timestamp}>{formatTimestamp(ultimaMensagem.createdAt)}</span>
                    </div>
                    <p style={{ ...styles.messageSnippetBase, ...messageStyle }}>
                        {prefix}{snippet}
                    </p>
                </div>
            </div>
        </Link>
    );
}

const avatarColors = ['#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c', '#e67e22'];
const getRandomColorForAvatar = (char) => {
    if (!char) return avatarColors[0];
    const index = char.charCodeAt(0) % avatarColors.length;
    return avatarColors[index];
};

function ChatListPage() {
    const [conversas, setConversas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const fetchConversas = useCallback(async () => { setLoading(true); setError(''); try { const response = await api.get('/chat/conversas'); setConversas(response.data || []); } catch (err) { console.error("Erro ao buscar lista de conversas:", err); setError(err.response?.data?.message || "Falha ao carregar suas conversas."); setConversas([]); } finally { setLoading(false); } }, []);
    useEffect(() => { fetchConversas(); }, [fetchConversas]);

    return (
        <div style={styles.pageContainer}>

            <header style={styles.pageHeader}>
                <button onClick={() => navigate(-1)} style={styles.backButton}>
                    <IconBackArrow /> Voltar
                </button>
                <h1 style={styles.pageTitle}>Minhas Conversas</h1>
            </header>

            {loading && <div style={styles.centerMessage}>Carregando conversas...</div>}
            {error && <div style={styles.errorBox}>{error}</div>}

            {!loading && !error && conversas.length === 0 && (
                <div style={styles.centerMessage}>
                    <p>Você ainda não possui nenhuma conversa.</p>
                    <p>Inicie um chat a partir da página de um empreendimento!</p>
                </div>
            )}

            {!loading && !error && conversas.length > 0 && (
                <div style={styles.listContainer}>
                    {conversas.map((conversa, index) => (
                        <ConversationListItem key={conversa.outroUsuario?.id || index} conversa={conversa} />
                    ))}
                </div>
            )}
        </div>
    );
}

const styles = {
    pageContainer: { maxWidth: '700px', margin: '30px auto', padding: '0 15px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" },
    pageHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '25px',
        position: 'relative',
    },
    pageTitle: {
        fontSize: '2em',
        color: '#2c3e50',
        margin: 0,
        fontWeight: 600,
        textAlign: 'center',
        flexGrow: 1,
    },
    backButton: {
        padding: '8px 15px',
        backgroundColor: 'transparent',
        color: '#3498db',
        border: '1px solid #3498db',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 500,
        fontSize: '0.9em',
        display: 'flex',
        alignItems: 'center',
        transition: 'all 0.2s ease',
        '&:hover': {
            backgroundColor: '#eaf5ff',
            color: '#2980b9',
        }
    },
    icon: { fontSize: '1em' },
    newMessageButton: { padding: '8px 15px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, fontSize: '0.9em', '&:hover': { backgroundColor: '#2980b9' } },
    centerMessage: { textAlign: 'center', padding: '50px 20px', fontSize: '1.1em', color: '#7f8c8d' },
    errorBox: { color: '#c0392b', backgroundColor: '#fdedec', border: '1px solid #e74c3c', padding: '15px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' },
    listContainer: { backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', overflow: 'hidden' },
    listItemLink: { textDecoration: 'none', color: 'inherit', display: 'block' },
    listItem: {
        display: 'flex', alignItems: 'center', padding: '18px 20px',
        borderBottom: '1px solid #f0f0f0',
        cursor: 'pointer', transition: 'background-color 0.15s ease-out',
        '&:hover': { backgroundColor: '#f8f9fa' },
        '&:last-child': { borderBottom: 'none' }
    },
    avatarPlaceholder: {
        width: '48px', height: '48px',
        borderRadius: '50%',
        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.4em', fontWeight: '500',
        marginRight: '18px', flexShrink: 0
    },
    content: { flexGrow: 1, overflow: 'hidden' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' },
    userName: { fontWeight: 600, fontSize: '1.05em', color: '#34495e' },
    timestamp: { fontSize: '0.75em', color: '#95a5a6', whiteSpace: 'nowrap' },
    messageSnippetBase: { fontSize: '0.9em', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    myMessageSnippet: { color: '#7f8c8d' },
    otherMessageSnippet: { color: '#2c3e50', fontWeight: 500 },
    unreadDot: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3498db', marginLeft: '10px', flexShrink: 0 }
};

export default ChatListPage;