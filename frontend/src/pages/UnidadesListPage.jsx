import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getStatusStyle } from '../utils/styleUtils';

const IconPlus = () => <span role="img" aria-label="Adicionar" style={{ marginRight: '5px' }}>➕</span>;
const IconEdit = () => <span role="img" aria-label="Editar" style={{ marginRight: '4px' }}>✏️</span>;
const IconDelete = () => <span role="img" aria-label="Excluir" style={{ marginRight: '4px' }}>🗑️</span>;
const IconBack = () => <span role="img" aria-label="Voltar" style={{ marginRight: '5px' }}>⬅️</span>;

const formatPrice = (value) => {
    if (value === null || value === undefined || isNaN(parseFloat(value))) return 'N/A';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

// --- Componente UnidadeItem (Linha da Tabela) ---
function UnidadeItem({ unidade, handleDeleteUnidade }) {
    const statusText = unidade.status?.replace(/_/g, ' ') || 'N/D';
    return (
        <tr style={styles.tableRow} className="table-row-hover"> 
            <td style={styles.td}>{unidade.id}</td>
            <td style={styles.td}>{unidade.bloco || '-'}</td>
            <td style={styles.td}>{unidade.andar === null ? '-' : unidade.andar}</td> 
            <td style={styles.td}>{unidade.numero}</td>
            <td style={styles.td}>{formatPrice(unidade.preco)}</td>
            <td style={styles.td}><span style={getStatusStyle(unidade.status)}>{statusText}</span></td>
            <td style={styles.td}>
                {unidade.quartos ?? '-'}<span style={styles.dimLabel}>q</span> / {unidade.banheiros ?? '-'}<span style={styles.dimLabel}>b</span> / {unidade.vagas ?? '-'}<span style={styles.dimLabel}>v</span>
            </td>
            <td style={styles.tdActions}>
                <Link to={`/unidades/editar/${unidade.id}`} style={{textDecoration: 'none'}}>
                    <button style={{ ...styles.actionButton, ...styles.buttonEdit }}><IconEdit />Editar</button>
                </Link>
                {unidade.status === 'Disponível' && (
                    <button
                        onClick={() => handleDeleteUnidade(unidade.id)}
                        style={{ ...styles.actionButton, ...styles.buttonDelete }}
                    >
                        <IconDelete />Excluir
                    </button>
                )}
            </td>
        </tr>
    );
}

function UnidadesListPage() {
    const { empreendimentoId } = useParams();
    const navigate = useNavigate();
    const [unidades, setUnidades] = useState([]);
    const [empreendimentoNome, setEmpreendimentoNome] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [empResponse, unidadesResponse] = await Promise.all([
                api.get(`/empreendimentos/${empreendimentoId}`), // Endpoint da construtora para pegar nome
                api.get(`/empreendimentos/${empreendimentoId}/unidades`) // Endpoint da construtora para unidades
            ]);

            setEmpreendimentoNome(empResponse.data?.nome || `Empreendimento ID ${empreendimentoId}`);
            setUnidades(unidadesResponse.data?.unidades || []);

        } catch (err) {
            console.error("Erro ao buscar unidades ou empreendimento:", err);
            if (err.response && (err.response.status === 403 || err.response.status === 404)) {
                setError(err.response.data?.message || "Empreendimento não encontrado ou acesso negado.");
            } else {
                setError("Falha ao carregar os dados. Tente novamente.");
            }
            setUnidades([]);
            setEmpreendimentoNome('');
        } finally {
            setLoading(false);
        }
    }, [empreendimentoId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDeleteUnidade = async (unidadeId) => {
        if (window.confirm(`Tem certeza que deseja excluir a unidade ID ${unidadeId}?`)) {
            setError('');
            try {
                await api.delete(`/unidades/${unidadeId}`);
                setUnidades(prev => prev.filter(u => u.id !== unidadeId));
                alert('Unidade excluída com sucesso.');
            } catch (err) {
                console.error("Erro ao excluir unidade:", err);
                let errorMsg = "Falha ao excluir a unidade.";
                if (err.response && err.response.data && err.response.data.message) {
                    errorMsg = err.response.data.message;
                }
                setError(errorMsg);
                alert(`Erro: ${errorMsg}`);
            }
        }
    };

    if (loading) {
        return <div style={styles.centerMessage}>Carregando unidades...</div>;
    }

    if (error && !empreendimentoNome) { 
        return <div style={{...styles.errorBox, textAlign: 'center'}}>Erro: {error} <br/><Link to="/empreendimentos" style={styles.backLinkError}>Voltar para Empreendimentos</Link></div>;
    }

    return (
        <div style={styles.pageContainer}>
            <div style={styles.headerActions}>
                <button onClick={() => navigate('/empreendimentos')} style={styles.backButton}>
                    <IconBack /> Voltar para Empreendimentos
                </button>
                <button
                    onClick={() => navigate(`/empreendimentos/${empreendimentoId}/unidades/nova`)}
                    style={styles.addButton}
                >
                    <IconPlus /> Adicionar Nova Unidade
                </button>
            </div>

            <h1 style={styles.pageTitle}>
                Unidades do Empreendimento: <span style={styles.highlight}>{empreendimentoNome}</span> (ID: {empreendimentoId})
            </h1>
            
            {error && <div style={styles.errorBox}>{error}</div>}


            {!loading && !error && unidades.length === 0 && (
                <div style={styles.centerMessage}>
                    <p>Nenhuma unidade cadastrada para este empreendimento.</p>
                    <p>Clique em "+ Adicionar Nova Unidade" para começar.</p>
                </div>
            )}

            {!loading && !error && unidades.length > 0 && (
                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>ID</th>
                                <th style={styles.th}>Bloco</th>
                                <th style={styles.th}>Andar</th>
                                <th style={styles.th}>Número</th>
                                <th style={styles.th}>Preço</th>
                                <th style={styles.th}>Status</th>
                                <th style={styles.th}>Config.</th>
                                <th style={styles.th}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {unidades.map(unidade => (
                                <UnidadeItem
                                    key={unidade.id}
                                    unidade={unidade}
                                    handleDeleteUnidade={handleDeleteUnidade}
                                />
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
    pageTitle: { fontSize: '2em', marginBottom: '25px', color: '#2c3e50', fontWeight: 600, textAlign: 'center' },
    highlight: { color: '#3498db' },
    headerActions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
    addButton: { padding: '10px 18px', fontSize: '0.95em', cursor: 'pointer', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px', transition: 'background-color 0.2s ease', '&:hover': { backgroundColor: '#218838' } },
    backButton: { padding: '10px 18px', fontSize: '0.95em', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px', transition: 'background-color 0.2s ease', '&:hover': { backgroundColor: '#5a6268' } },
    backLinkError: { color: '#0056b3', textDecoration: 'underline', marginTop: '10px', display: 'inline-block' },
    centerMessage: { textAlign: 'center', padding: '50px 20px', fontSize: '1.1em', color: '#7f8c8d' },
    errorBox: { color: '#c0392b', backgroundColor: '#fdedec', border: '1px solid #e74c3c', padding: '15px', borderRadius: '8px', marginBottom: '20px' },
    tableContainer: { overflowX: 'auto', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', border: '1px solid #e0e0e0' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '800px'  },
    th: { backgroundColor: '#f8f9fa', padding: '12px 15px', borderBottom: '2px solid #dee2e6', textAlign: 'left', fontSize: '0.9em', fontWeight: 600, color: '#495057', textTransform: 'uppercase', letterSpacing: '0.5px' },
    td: { padding: '12px 15px', borderBottom: '1px solid #eee', fontSize: '0.9em', color: '#34495e', verticalAlign: 'middle' },
    tableRow: { '&:hover': { backgroundColor: '#f1f3f5' } }, 
    dimLabel: { fontSize: '0.8em', color: '#777' },
    tdActions: { padding: '8px 15px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap', textAlign: 'right' }, // Ações à direita
    actionButton: {
        padding: '6px 10px', fontSize: '0.85em', cursor: 'pointer', borderRadius: '4px', border: 'none',
        fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px',
        marginRight: '8px', 
        transition: 'opacity 0.2s ease',
        '&:last-child': { marginRight: 0 },
        '&:hover': { opacity: 0.8 }
    },
    buttonEdit: { backgroundColor: '#6c757d', color: 'white' },
    buttonDelete: { backgroundColor: '#dc3545', color: 'white' },
    icon: { fontSize: '1em' }
};

export default UnidadesListPage;