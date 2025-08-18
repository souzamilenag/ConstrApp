import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { getStatusStyle } from '../utils/styleUtils';

const IconUser = () => <span role="img" aria-label="Cliente" style={styles.icon}>👤</span>;
const IconBuilding = () => <span role="img" aria-label="Empreendimento" style={styles.icon}>🏢</span>;
const IconUnit = () => <span role="img" aria-label="Unidade" style={styles.icon}>🔑</span>;
const IconCalendar = () => <span role="img" aria-label="Data" style={styles.icon}>📅</span>;
const IconStatus = () => <span role="img" aria-label="Status" style={styles.icon}>📊</span>;
const IconContract = () => <span role="img" aria-label="Contrato" style={styles.icon}>📄</span>;
const IconUpload = () => <span role="img" aria-label="Upload" style={styles.icon}>📤</span>;
const IconSign = () => <span role="img" aria-label="Assinar" style={styles.icon}>✒️</span>;
const IconDetails = () => <span role="img" aria-label="Detalhes" style={styles.icon}>ℹ️</span>;

const formatPrice = (value) => {
    if (value === null || value === undefined || isNaN(parseFloat(value))) return 'N/A';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) { return 'Data inválida'; }
};

function ContractStatusConstrutora({ contrato }) {
    if (!contrato) {
        return <span style={getStatusStyle('Pendente')}>Contrato Pendente</span>;
    }
    let text = contrato.status || 'Pendente';
    if (contrato.status === 'Pendente' && contrato.documento_url && !contrato.cliente_assinou && !contrato.construtora_assinou) {
        text = 'Pronto para Envio ao Cliente';
    } else if (contrato.status === 'Aguardando Assinatura Cliente') {
        text = 'Aguardando Cliente Assinar';
    } else if (contrato.status === 'Aguardando Assinatura Construtora') {
        text = 'Aguardando Sua Assinatura';
    } else if (contrato.cliente_assinou && contrato.construtora_assinou) {
        text = 'Contrato Assinado';
    } else if (contrato.status === 'Inválido' || contrato.status === 'Cancelado') {
        text = contrato.status;
    }
    return <span style={getStatusStyle(contrato.status)}>{text.replace(/_/g, ' ')}</span>;
}

function ConstrutoraComprasPage() {
    const [compras, setCompras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchConstrutoraCompras = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get('/compras/construtora');
            setCompras(response.data?.compras || []);
        } catch (err) {
            console.error("Erro ao buscar compras da construtora:", err);
            setError(err.response?.data?.message || "Falha ao carregar as compras.");
            setCompras([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConstrutoraCompras();
    }, [fetchConstrutoraCompras]);

    const handleAction = async (actionPromise, successMessage, errorMessagePrefix) => {
        setError('');
        try {
            await actionPromise;
            alert(successMessage); 
            fetchConstrutoraCompras(); 
        } catch (err) {
            console.error(`${errorMessagePrefix}:`, err);
            const errorMsg = err.response?.data?.message || `${errorMessagePrefix}. Tente novamente.`;
            setError(errorMsg);
            alert(`Erro: ${errorMsg}`);
        }
    };

    const handleConstrutoraSign = (compraId) => {
        if (window.confirm(`Confirmar assinatura do contrato para a compra ID ${compraId}?`)) {
            handleAction(
                api.post(`/compras/${compraId}/assinar-construtora`),
                'Contrato assinado pela construtora com sucesso!',
                `Erro ao assinar contrato (construtora) para Compra ${compraId}`
            );
        }
    };

    const handleSetDocumentUrl = (compraId) => {
        const url = prompt(`Insira a URL do documento PDF para a compra ID ${compraId} (Ex: link do Google Drive, Dropbox, etc.):`);
        if (url && url.trim() !== '') {
            handleAction(
                api.put(`/compras/${compraId}/contrato`, {
                    documento_url: url.trim(),
                    status: 'Aguardando Assinatura Cliente'
                }),
                'URL do documento e status atualizados! O cliente será notificado (quando implementado).',
                `Erro ao definir URL do documento para Compra ${compraId}`
            );
        }
    };

    return (
        <div style={styles.pageContainer}>
            <h1 style={styles.pageTitle}>Vendas e Processos de Compra</h1>

            {loading && <div style={styles.centerMessage}>Carregando dados das vendas...</div>}
            {error && <div style={styles.errorBox}>Erro: {error}</div>}

            {!loading && !error && compras.length === 0 && (
                <div style={styles.centerMessage}>
                    <p>Nenhum processo de compra encontrado para seus empreendimentos.</p>
                    <p>Quando um cliente iniciar uma compra, ela aparecerá aqui.</p>
                </div>
            )}

            {!loading && !error && compras.length > 0 && (
                <div style={styles.cardsGrid}>
                    {compras.map(compra => {
                        const statusCompraText = compra.status?.replace(/_/g, ' ') || 'N/D';
                        return (
                            <div key={compra.id} style={styles.compraCard}>
                                <div style={styles.cardHeader}>
                                    <h3 style={styles.cardTitle}>Compra #{compra.id}</h3>
                                    <span style={styles.cardDate}><IconCalendar />{formatDate(compra.createdAt)}</span>
                                </div>
                                <div style={styles.cardBody}>
                                    <div style={styles.infoRow}><IconUser /><strong>Cliente:</strong> <span>{compra.cliente?.nome || 'N/A'} ({compra.cliente?.email || 'N/A'})</span></div>
                                    <div style={styles.infoRow}><IconBuilding /><strong>Empreendimento:</strong> <span>{compra.unidade?.empreendimento?.nome || 'N/A'}</span></div>
                                    <div style={styles.infoRow}><IconUnit /><strong>Unidade:</strong> <span>
                                        {compra.unidade?.bloco ? `Bl ${compra.unidade.bloco}/` : ''}
                                        {compra.unidade?.andar ? `And ${compra.unidade.andar}/` : ''}
                                        Un {compra.unidade?.numero || 'N/A'}
                                    </span></div>
                                    <div style={styles.infoRow}><IconStatus /><strong>Status Compra:</strong> <span style={getStatusStyle(compra.status)}>{statusCompraText}</span></div>
                                    <div style={styles.infoRow}><IconContract /><strong>Status Contrato:</strong> <ContractStatusConstrutora contrato={compra.contrato} /></div>
                                </div>
                                <div style={styles.cardActions}>
                                    {compra.contrato && !compra.contrato.documento_url &&
                                     (compra.status === 'Aguardando Contrato' || compra.contrato.status === 'Pendente') && (
                                        <button onClick={() => handleSetDocumentUrl(compra.id)} style={{...styles.actionButton, ...styles.buttonUpload}}>
                                            <IconUpload /> Definir/Enviar Contrato
                                        </button>
                                    )}

                                    {compra.contrato?.documento_url && compra.contrato?.status === 'Aguardando Assinatura Construtora' && !compra.contrato?.construtora_assinou && (
                                        <button onClick={() => handleConstrutoraSign(compra.id)} style={{...styles.actionButton, ...styles.buttonSign}}>
                                            <IconSign /> Assinar Contrato
                                        </button>
                                    )}
                                     <Link to={`/compras/detalhes/${compra.id}`} style={styles.actionLink}>
                                        <button style={{...styles.actionButton, ...styles.buttonDetails}}>
                                            <IconDetails /> Ver Detalhes
                                        </button>
                                    </Link>
                                </div>
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
    centerMessage: { textAlign: 'center', padding: '50px 20px', fontSize: '1.1em', color: '#7f8c8d' },
    errorBox: { color: '#c0392b', backgroundColor: '#fdedec', border: '1px solid #e74c3c', padding: '15px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' },
    cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '25px' },
    compraCard: {
        border: '1px solid #ddd', borderRadius: '10px', backgroundColor: '#fff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 6px 16px rgba(0,0,0,0.12)' }
    },
    cardHeader: {
        backgroundColor: '#f8f9fa', padding: '15px 20px', borderBottom: '1px solid #eee',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        h3: { margin: '0', fontSize: '1.25em', color: '#2c3e50', fontWeight: 600 },
    },
    cardDate: { fontSize: '0.85em', color: '#6c757d', display: 'flex', alignItems: 'center' },
    cardBody: { padding: '18px 20px', flexGrow: 1 },
    infoRow: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '10px', fontSize: '0.95em', color: '#34495e',
        strong: { color: '#2c3e50', marginRight: '8px' },
        span: { textAlign: 'right', flexShrink: 0 } 
    },
    cardActions: {
        padding: '15px 20px', borderTop: '1px solid #eee', backgroundColor: '#f8f9fa',
        display: 'flex', flexDirection: 'column', gap: '10px',
    },
    actionLink: { textDecoration: 'none', display: 'block', width: '100%' },
    actionButton: {
        width: '100%', padding: '10px 15px', fontSize: '0.9em', cursor: 'pointer',
        borderRadius: '6px', border: 'none', fontWeight: 500, textAlign: 'center',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        transition: 'background-color 0.2s ease',
    },
    buttonUpload: { backgroundColor: '#0dcaf0', color: '#055160', '&:hover': { backgroundColor: '#3dd5f3' } },
    buttonSign: { backgroundColor: '#198754', color: 'white', '&:hover': { backgroundColor: '#157347' } },
    buttonDetails: { backgroundColor: '#6c757d', color: 'white', '&:hover': { backgroundColor: '#5a6268' } },
    icon: { fontSize: '1em', marginRight: '6px' }
};

export default ConstrutoraComprasPage;