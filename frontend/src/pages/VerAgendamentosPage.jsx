import React, { useState, useEffect, useCallback } from 'react';
// import { Link } from 'react-router-dom'; // Não está sendo usado diretamente aqui
import api from '../services/api';
import { getStatusStyle } from '../utils/styleUtils';

const IconFilter = () => <span role="img" aria-label="Filtro" style={styles.icon}>🔍</span>;
const IconCalendar = () => <span role="img" aria-label="Data" style={styles.icon}>🗓️</span>;
const IconUser = () => <span role="img" aria-label="Cliente" style={styles.icon}>👤</span>;
const IconBuilding = () => <span role="img" aria-label="Empreendimento" style={styles.icon}>🏢</span>;
const IconLocation = () => <span role="img" aria-label="Local" style={styles.icon}>📍</span>;
const IconStatus = () => <span role="img" aria-label="Status" style={styles.icon}>📊</span>;
const IconConfirm = () => <span role="img" aria-label="Confirmar" style={styles.icon}>✔️</span>;
const IconCancel = () => <span role="img" aria-label="Cancelar" style={styles.icon}>❌</span>;
const IconComplete = () => <span role="img" aria-label="Realizado" style={styles.icon}>🏁</span>;

function VerAgendamentosPage() {
    const [agendamentos, setAgendamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({ status: '', empreendimentoId: '' });
    const [empreendimentosConstrutora, setEmpreendimentosConstrutora] = useState([]);

    const fetchAgendamentos = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = {
                status: filters.status || undefined,
                empreendimentoId: filters.empreendimentoId || undefined,
                // page: currentPage, limit: itemsPerPage // Para paginação futura
            };
            const response = await api.get('/agendamentos/construtora', { params });
            setAgendamentos(response.data?.agendamentos || []);
        } catch (err) {
            console.error("Erro ao buscar agendamentos da construtora:", err);
            setError(err.response?.data?.message || "Falha ao carregar agendamentos.");
            setAgendamentos([]);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        api.get('/empreendimentos/meus')
            .then(response => {
                setEmpreendimentosConstrutora(response.data || []);
            })
            .catch(err => {
                console.error("Erro ao buscar lista de empreendimentos para filtro:", err);
            });
    }, []); 

    useEffect(() => {
        fetchAgendamentos();
    }, [fetchAgendamentos]);

    const handleUpdateStatus = async (agendamentoId, novoStatus) => {
        setError('');
        try {
            const response = await api.put(`/agendamentos/${agendamentoId}/status`, { status: novoStatus });
            setAgendamentos(prev => prev.map(ag =>
                ag.id === agendamentoId ? response.data : ag 
            ));
        } catch (err) {
            console.error(`Erro ao atualizar status para ${novoStatus} no agendamento ${agendamentoId}:`, err);
            const errorMsg = err.response?.data?.message || `Falha ao atualizar status.`;
            setError(errorMsg); 
            alert(`Erro: ${errorMsg}`);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return 'N/A';
        try {
            return new Date(dateTimeString).toLocaleString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch (e) { return 'Data inválida'; }
    };

    const getStatusText = (status) => status?.replace(/_/g, ' ') || 'N/D';


    return (
        <div style={styles.pageContainer}>
            <h1 style={styles.pageTitle}>Agendamentos Recebidos</h1>

            {/* Seção de Filtros */}
            <div style={styles.filterContainer}>
                <div style={styles.filterGroup}>
                    <label htmlFor="statusFilter" style={styles.filterLabel}><IconStatus />Status:</label>
                    <select id="statusFilter" name="status" value={filters.status} onChange={handleFilterChange} style={styles.selectInput}>
                        <option value="">Todos os Status</option>
                        <option value="Solicitado">Solicitado</option>
                        <option value="Confirmado">Confirmado</option>
                        <option value="Cancelado">Cancelado</option>
                        <option value="Realizado">Realizado</option>
                    </select>
                </div>
                <div style={styles.filterGroup}>
                    <label htmlFor="empreendimentoFilter" style={styles.filterLabel}><IconBuilding />Empreendimento:</label>
                    <select id="empreendimentoFilter" name="empreendimentoId" value={filters.empreendimentoId} onChange={handleFilterChange} style={styles.selectInput}>
                        <option value="">Todos Empreendimentos</option>
                        {empreendimentosConstrutora.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.nome}</option>
                        ))}
                    </select>
                </div>
                 <button onClick={fetchAgendamentos} style={styles.filterButton}><IconFilter /> Aplicar Filtros</button>
            </div>

            {loading && <div style={styles.centerMessage}>Carregando agendamentos...</div>}
            {error && <div style={styles.errorBox}>Erro: {error}</div>}

            {!loading && !error && agendamentos.length === 0 && (
                <div style={styles.centerMessage}>
                    <p>Nenhum agendamento encontrado com os filtros selecionados.</p>
                    <p>Aguardando novas solicitações de clientes.</p>
                </div>
            )}

            {!loading && !error && agendamentos.length > 0 && (
                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>ID</th>
                                <th style={styles.th}><IconCalendar /> Data/Hora Visita</th>
                                <th style={styles.th}><IconUser /> Cliente</th>
                                <th style={styles.th}><IconBuilding /> Empreendimento</th>
                                <th style={styles.th}><IconLocation /> Local</th>
                                <th style={styles.th}>Status</th>
                                <th style={styles.th}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {agendamentos.map(ag => (
                                <tr key={ag.id} style={styles.tableRow}>
                                    <td style={styles.td}>{ag.id}</td>
                                    <td style={styles.td}>{formatDateTime(ag.data_visita)}</td>
                                    <td style={styles.td}>
                                        {ag.cliente?.nome || 'N/A'}
                                        {ag.cliente?.email && <><br/><small style={styles.smallText}>{ag.cliente.email}</small></>}
                                    </td>
                                    <td style={styles.td}>{ag.empreendimento?.nome || 'N/A'}</td>
                                    <td style={styles.td}>
                                        {ag.visitar_stand ? 'Stand de Vendas' : `Unidade: ${ag.numero_apartamento || 'N/A'}`}
                                    </td>
                                    <td style={styles.td}>
                                        <span style={getStatusStyle(ag.status)}>{getStatusText(ag.status)}</span>
                                    </td>
                                    <td style={styles.tdActions}>
                                        {ag.status === 'Solicitado' && (
                                            <>
                                                <button onClick={() => handleUpdateStatus(ag.id, 'Confirmado')} title="Confirmar Agendamento" style={{...styles.actionButton, ...styles.buttonConfirm}}><IconConfirm />Confirmar</button>
                                                <button onClick={() => handleUpdateStatus(ag.id, 'Cancelado')} title="Cancelar Agendamento" style={{...styles.actionButton, ...styles.buttonCancel}}><IconCancel />Cancelar</button>
                                            </>
                                        )}
                                        {ag.status === 'Confirmado' && (
                                            <>
                                                <button onClick={() => handleUpdateStatus(ag.id, 'Realizado')} title="Marcar como Realizado" style={{...styles.actionButton, ...styles.buttonComplete}}><IconComplete />Realizado</button>
                                                <button onClick={() => handleUpdateStatus(ag.id, 'Cancelado')} title="Cancelar Agendamento" style={{...styles.actionButton, ...styles.buttonCancel}}><IconCancel />Cancelar</button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

const styles = {
    pageContainer: { maxWidth: '1200px', margin: '30px auto', padding: '0 20px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" },
    pageTitle: { fontSize: '2.2em', marginBottom: '20px', color: '#2c3e50', textAlign: 'center', fontWeight: 600 },
    filterContainer: {
        display: 'flex', gap: '20px', flexWrap: 'wrap',
        padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px',
        marginBottom: '25px', border: '1px solid #e0e0e0'
    },
    filterGroup: { display: 'flex', alignItems: 'center', gap: '8px' },
    filterLabel: { fontWeight: 500, color: '#495057', fontSize: '0.95em' },
    selectInput: {
        padding: '8px 10px', borderRadius: '6px', border: '1px solid #ced4da',
        fontSize: '0.9em', minWidth: '180px', backgroundColor: 'white',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        '&:focus': { borderColor: '#86b7fe', boxShadow: '0 0 0 0.25rem rgba(13, 110, 253, 0.25)', outline: 'none' }
    },
    filterButton: { padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px', '&:hover': { backgroundColor: '#0056b3'} },
    centerMessage: { textAlign: 'center', padding: '50px 20px', fontSize: '1.1em', color: '#7f8c8d' },
    errorBox: { color: '#c0392b', backgroundColor: '#fdedec', border: '1px solid #e74c3c', padding: '15px', borderRadius: '8px', marginBottom: '20px' },
    tableContainer: { overflowX: 'auto', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', border: '1px solid #e0e0e0' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '900px' /* Para evitar quebra excessiva */ },
    th: { backgroundColor: '#f1f3f5', padding: '12px 15px', borderBottom: '2px solid #dee2e6', textAlign: 'left', fontSize: '0.85em', fontWeight: 600, color: '#495057', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' },
    td: { padding: '12px 15px', borderBottom: '1px solid #eee', fontSize: '0.9em', color: '#34495e', verticalAlign: 'middle' },
    smallText: { fontSize: '0.8em', color: '#6c757d', display: 'block', marginTop: '2px' },
    tableRow: { '&:hover': { backgroundColor: '#f8f9fa' } },
    tdActions: { padding: '8px 15px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap', textAlign: 'right' },
    actionButton: {
        padding: '6px 10px', fontSize: '0.85em', cursor: 'pointer', borderRadius: '4px', border: 'none',
        fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '5px',
        marginRight: '8px', transition: 'opacity 0.2s ease',
        '&:last-child': { marginRight: 0 },
        '&:hover': { opacity: 0.85 }
    },
    buttonConfirm: { backgroundColor: '#28a745', color: 'white' },
    buttonComplete: { backgroundColor: '#0d6efd', color: 'white' },
    buttonCancel: { backgroundColor: '#dc3545', color: 'white' },
    icon: { fontSize: '1em', marginRight: '6px' }
};

export default VerAgendamentosPage;