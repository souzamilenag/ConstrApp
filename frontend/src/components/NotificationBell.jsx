import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
let notificationSocket;

const formatTimeSince = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now - past) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) return `${diffInSeconds}s atrás`;
    if (diffInMinutes < 60) return `${diffInMinutes}min atrás`;
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    if (diffInDays === 1) return `Ontem`;
    return `${diffInDays}d atrás`;
};


function NotificationBell() {
    const { user, isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    const fetchNotifications = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const response = await api.get('/notificacoes', { params: { limit: 10 } });
            setNotifications(response.data?.notificacoes || []);
            setUnreadCount(response.data?.totalNaoLidas || 0);
        } catch (err) {
            console.error("Erro ao buscar notificações:", err);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        if (!isAuthenticated || !user) {
            if (notificationSocket) {
                console.log("NotificationBell: Desconectando socket por falta de usuário.");
                notificationSocket.disconnect();
                notificationSocket = null;
            }
            return;
        }

        if (!notificationSocket || !notificationSocket.connected) {
            console.log("NotificationBell: Conectando socket...");
            notificationSocket = io(SOCKET_SERVER_URL)

            notificationSocket.on('connect', () => {
                console.log('NotificationBell: Socket conectado:', notificationSocket.id);
                notificationSocket.emit('identificar', user.id);
            });

            notificationSocket.on('disconnect', () => {
                console.log('NotificationBell: Socket desconectado.');
            });

            notificationSocket.on('connect_error', (err) => {
                console.error('NotificationBell: Erro de conexão:', err.message);
            });
        } else {
            console.log('NotificationBell: Socket já conectado, identificando...');
            notificationSocket.emit('identificar', user.id);
        }

        const newNotificationListener = (novaNotificacao) => {
            console.log('Nova notificação recebida via Socket:', novaNotificacao);
            setNotifications(prev => [novaNotificacao, ...prev].slice(0, 10));
            setUnreadCount(prev => prev + 1);
        };
        notificationSocket.on('novaNotificacao', newNotificationListener);

        return () => {
            console.log("NotificationBell: Limpando listener de notificação.");
            if (notificationSocket) {
                notificationSocket.off('novaNotificacao', newNotificationListener);
            }
        };
    }, [isAuthenticated, user]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleToggleDropdown = async () => {
        const newState = !isOpen;
        setIsOpen(newState);
        if (newState && unreadCount > 0) {
            try {
                await api.put('/notificacoes/marcar-como-lida', { marcarTodas: true });
                setUnreadCount(0);
                setNotifications(prev => prev.map(n => ({ ...n, status: 'Lida' })));
            } catch (err) {
                console.error("Erro ao marcar notificações como lidas:", err);
            }
        }
    };

    if (!isAuthenticated) return null;

    return (
        <div style={styles.notificationContainer} ref={dropdownRef}>
            <button onClick={handleToggleDropdown} style={styles.bellButton}>
                🔔 {/* Ícone de sino */}
                {unreadCount > 0 && (
                    <span style={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div style={styles.dropdown}>
                    <div style={styles.dropdownHeader}>Notificações</div>
                    {loading && <div style={styles.dropdownItem}>Carregando...</div>}
                    {!loading && notifications.length === 0 && (
                        <div style={styles.dropdownItem}>Nenhuma notificação.</div>
                    )}
                    {!loading && notifications.map(notif => (
                        <Link
                            to={notif.link || '#'}
                            key={notif.id}
                            style={styles.dropdownItemLink}
                            onClick={() => setIsOpen(false)}
                        >
                            <div style={{ ...styles.dropdownItem, fontWeight: notif.status === 'Não Lida' ? 'bold' : 'normal' }}>
                                <strong>{notif.titulo}</strong>
                                <p style={{ margin: '4px 0', fontSize: '0.9em' }}>{notif.mensagem}</p>
                                <small style={{ color: '#777' }}>{formatTimeSince(notif.createdAt)}</small>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

const styles = {
    notificationContainer: {
        position: 'relative',
        margin: '0 15px',
    },
    bellButton: {
        background: 'none',
        border: 'none',
        fontSize: '1.5em',
        cursor: 'pointer',
        position: 'relative',
        padding: '5px'
    },
    badge: {
        position: 'absolute',
        top: '-5px',
        right: '-8px',
        background: 'red',
        color: 'white',
        borderRadius: '50%',
        padding: '2px 6px',
        fontSize: '0.7em',
        fontWeight: 'bold',
        minWidth: '18px',
        textAlign: 'center',
    },
    dropdown: {
        position: 'absolute',
        top: '100%',
        right: 0,
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '5px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
        width: '350px',
        maxHeight: '400px',
        overflowY: 'auto',
        zIndex: 100,
    },
    dropdownHeader: {
        padding: '10px 15px',
        fontWeight: 'bold',
        borderBottom: '1px solid #eee',
    },
    dropdownItemLink: {
        textDecoration: 'none',
        color: 'inherit',
    },
    dropdownItem: {
        padding: '10px 15px',
        borderBottom: '1px solid #eee',
        cursor: 'pointer',
        '&:hover': {
            backgroundColor: '#f8f9fa'
        }
    },
    viewAllLink: {
        display: 'block',
        textAlign: 'center',
        padding: '10px',
        fontSize: '0.9em',
        color: '#007bff',
        textDecoration: 'none',
        borderTop: '1px solid #eee',
    }
};
export default NotificationBell;