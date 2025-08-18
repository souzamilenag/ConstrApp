import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { getStatusStyle } from '../utils/styleUtils'; 

const IconBuilding = () => <span role="img" aria-label="Empreendimento" style={styles.icon}>🏢</span>;
const IconCalendarTime = () => <span role="img" aria-label="Data e Hora" style={styles.icon}>🗓️</span>;
const IconLocation = () => <span role="img" aria-label="Local" style={styles.icon}>📍</span>;
const IconStatus = () => <span role="img" aria-label="Status" style={styles.icon}>📊</span>;
const IconCancel = () => <span role="img" aria-label="Cancelar" style={styles.icon}>❌</span>;


function MeusAgendamentosPage() {
    const [agendamentos, setAgendamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchMeusAgendamentos = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get('/agendamentos/meus');
            setAgendamentos(response.data?.agendamentos || []);
        } catch (err) {
            console.error("Erro ao buscar meus agendamentos:", err);
            setError(err.response?.data?.message || "Falha ao carregar seus agendamentos.");
            setAgendamentos([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMeusAgendamentos();
    }, [fetchMeusAgendamentos]);

    const handleCancelarAgendamento = async (agendamentoId) => {
        if (window.confirm(`Tem certeza que deseja cancelar o agendamento ID ${agendamentoId}?`)) {
            setError('');
            try {
                await api.delete(`/agendamentos/${agendamentoId}`);
                setAgendamentos(prev => prev.map(ag =>
                    ag.id === agendamentoId ? { ...ag, status: 'Cancelado' } : ag
                ));
                alert('Agendamento cancelado com sucesso.');
            } catch (err) {
                console.error(`Erro ao cancelar agendamento ${agendamentoId}:`, err);
                let errorMsg = "Falha ao cancelar o agendamento.";
                if (err.response && err.response.data && err.response.data.message) {
                    errorMsg = err.response.data.message;
                }
                setError(errorMsg);
                alert(`Erro: ${errorMsg}`);
            }
        }
    };

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return 'N/A';
        try {
            return new Date(dateTimeString).toLocaleString('pt-BR', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch (e) { return 'Data inválida'; }
    };

    return (
        <div style={styles.pageContainer}>
            <h1 style={styles.pageTitle}>Meus Agendamentos</h1>

            {loading && <div style={styles.centerMessage}>Carregando seus agendamentos...</div>}
            {error && <div style={styles.errorText}>Erro: {error}</div>}

            {!loading && !error && agendamentos.length === 0 && (
                <div style={styles.centerMessage}>
                    <p>Você ainda não possui nenhum agendamento.</p>
                    <p>
                        <Link to="/" style={styles.primaryLink}>Explore nossos empreendimentos</Link> e agende uma visita!
                    </p>
                </div>
            )}

            {!loading && !error && agendamentos.length > 0 && (
                <div style={styles.cardsGrid}>
                    {agendamentos.map(ag => {
                        const localVisita = ag.visitar_stand ? 'Stand de Vendas' : `Unidade: ${ag.numero_apartamento || 'N/A'}`;
                        const statusText = ag.status?.replace(/_/g, ' ') || 'N/D';

                        return (
                            <div key={ag.id} style={styles.agendamentoCard}>
                                <div style={styles.cardHeader}>
                                    <h3 style={styles.cardTitle}><IconBuilding />{ag.empreendimento?.nome || 'Empreendimento não informado'}</h3>
                                </div>
                                <div style={styles.cardBody}>
                                    <div style={styles.infoRow}><IconCalendarTime /><strong>Data/Hora:</strong> <span>{formatDateTime(ag.data_visita)}</span></div>
                                    <div style={styles.infoRow}><IconLocation /><strong>Local:</strong> <span>{localVisita}</span></div>
                                    <div style={styles.infoRow}><IconStatus /><strong>Status:</strong> <span style={getStatusStyle(ag.status)}>{statusText}</span></div>
                                    {ag.observacoes && (
                                        <div style={{...styles.infoRow, flexDirection: 'column', alignItems: 'flex-start'}}>
                                            <strong>Observações:</strong>
                                            <p style={styles.observationsText}>{ag.observacoes}</p>
                                        </div>
                                    )}
                                </div>
                                {ag.status === 'Solicitado' && (
                                    <div style={styles.cardActions}>
                                        <button
                                            onClick={() => handleCancelarAgendamento(ag.id)}
                                            style={styles.actionButtonCancel}
                                        >
                                            <IconCancel /> Cancelar Agendamento
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

const styles = {
    pageContainer: { maxWidth: '1200px', margin: '30px auto', padding: '0 20px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" },
    pageTitle: { fontSize: '2.2em', marginBottom: '30px', color: '#2c3e50', textAlign: 'center', fontWeight: 600 },
    centerMessage: { textAlign: 'center', padding: '50px 20px', fontSize: '1.2em', color: '#7f8c8d' },
    primaryLink: { color: '#3498db', textDecoration: 'none', fontWeight: 'bold', marginTop: '10px', display: 'inline-block', '&:hover': { textDecoration: 'underline' } },
    errorText: { color: '#c0392b', padding: '15px', border: '1px solid #e74c3c', borderRadius: '8px', backgroundColor: '#fdedec', marginBottom: '25px', textAlign: 'center' },
    cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '25px' },
    agendamentoCard: {
        border: '1px solid #ddd',
        borderRadius: '10px',
        backgroundColor: '#fff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 6px 16px rgba(0,0,0,0.12)' }
    },
    cardHeader: {
        backgroundColor: '#f8f9fa',
        padding: '18px 22px',
        borderBottom: '1px solid #eee',
        h3: { margin: '0', fontSize: '1.3em', color: '#2c3e50', fontWeight: 600, display: 'flex', alignItems: 'center' },
    },
    cardBody: {
        padding: '18px 22px',
        flexGrow: 1,
    },
    infoRow: {
        display: 'flex',
        alignItems: 'flex-start',
        marginBottom: '12px',
        fontSize: '0.95em',
        color: '#34495e',
        strong: { color: '#2c3e50', minWidth: '100px', marginRight: '8px' }, 
        span: { flexGrow: 1 } 
    },
    observationsText: {
        fontSize: '0.9em',
        color: '#555',
        marginTop: '5px',
        paddingLeft: '20px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
    },
    cardActions: {
        padding: '15px 22px',
        borderTop: '1px solid #eee',
        backgroundColor: '#fdfdfd',
        textAlign: 'right',
    },
    actionButtonCancel: {
        backgroundColor: '#e74c3c',
        color: 'white',
        border: 'none',
        padding: '8px 15px',
        fontSize: '0.9em',
        cursor: 'pointer',
        borderRadius: '6px',
        fontWeight: '500',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        transition: 'background-color 0.2s ease',
        '&:hover': { backgroundColor: '#c0392b' }
    },
    icon: {
        fontSize: '1.1em',
    }
};

export default MeusAgendamentosPage;