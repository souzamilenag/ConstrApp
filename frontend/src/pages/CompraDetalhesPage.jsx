// src/pages/CompraDetalhesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom'; // <<< CORRIGIDO AQUI
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// --- Ícones (Simples) ---
const IconBack = () => <span role="img" aria-label="Voltar" style={{ marginRight: '6px' }}>⬅️</span>;
const IconSign = () => <span role="img" aria-label="Assinar" style={{ marginRight: '6px' }}>✒️</span>;
const IconPay = () => <span role="img" aria-label="Pagar" style={{ marginRight: '6px' }}>💳</span>;
const IconConfirm = () => <span role="img" aria-label="Confirmar" style={{ marginRight: '6px' }}>✔️</span>;


// --- Funções Auxiliares ---
const getCompraStatusStyle = (status) => {
    let backgroundColor = '#6c757d', color = 'white', borderColor = 'transparent';
    switch (status?.toLowerCase()) {
        case 'em processo': case 'aguardando contrato': case 'pendente':
            backgroundColor = '#fff3cd'; color = '#664d03'; borderColor = '#ffecb5'; break;
        case 'aguardando assinaturas': case 'pronto para assinatura': case 'aguardando sua assinatura': case 'aguardando assinatura da construtora':
            backgroundColor = '#cff4fc'; color = '#055160'; borderColor = '#b6effb'; break;
        case 'aguardando pagamento':
            backgroundColor = '#ffe5d0'; color = '#854400'; borderColor = '#fed8b1'; break;
        case 'concluída': case 'assinado': case 'confirmado':
            backgroundColor = '#d1e7dd'; color = '#0f5132'; borderColor = '#badbcc'; break;
        case 'cancelada': case 'inválido': case 'falhou':
            backgroundColor = '#f8d7da'; color = '#842029'; borderColor = '#f5c2c7'; break;
        default:
             backgroundColor = '#e9ecef'; color = '#495057'; borderColor = '#dee2e6'; break;
    }
    return { padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', display: 'inline-block', border: `1px solid ${borderColor}`, backgroundColor, color, textTransform: 'capitalize' };
};

const formatPrice = (value) => {
    if (value === null || value === undefined || isNaN(parseFloat(value))) return 'N/A';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
    } catch { return 'Data inválida'; }
};


function CompraDetalhesPage() {
    const { id: compraId } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const [compra, setCompra] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchDetalhes = useCallback(async () => {
        if (!compraId) return;
        setLoading(true);
        setError('');
        try {
            const response = await api.get(`/compras/${compraId}`);
            setCompra(response.data);
        } catch (err) {
            console.error("Erro ao buscar detalhes da compra:", err);
            setError(err.response?.data?.message || "Falha ao carregar detalhes da compra.");
            setCompra(null);
        } finally {
            setLoading(false);
        }
    }, [compraId]);

    useEffect(() => {
        fetchDetalhes();
    }, [fetchDetalhes]);

    const handleConstrutoraSign = async () => {
        if (!window.confirm("Confirmar assinatura do contrato em nome da construtora?")) return;
        setSubmitting(true);
        setError('');
        try {
            await api.post(`/compras/${compraId}/assinar-construtora`);
            alert("Contrato assinado pela construtora com sucesso!");
            fetchDetalhes();
        } catch (err) {
            console.error("Erro ao assinar como construtora:", err);
            setError(err.response?.data?.message || "Falha ao assinar o contrato.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirmPayment = async (pagamentoId) => {
        if (!window.confirm(`Confirmar o recebimento para o pagamento ID ${pagamentoId}? Esta ação não pode ser desfeita.`)) return;
        setSubmitting(true);
        setError('');
        try {
            await api.put(`/pagamentos/${pagamentoId}/confirmar`);
            alert('Pagamento confirmado com sucesso!');
            fetchDetalhes();
        } catch (err) {
            console.error("Erro ao confirmar pagamento:", err);
            setError(err.response?.data?.message || "Falha ao confirmar o pagamento.");
        } finally {
           setSubmitting(false);
        }
   };

    if (loading) return <div style={styles.centerMessage}>Carregando detalhes da compra...</div>;
    if (error) return <div style={{ ...styles.errorBox, textAlign: 'center' }}>Erro: {error} <br/><button onClick={() => navigate(-1)} style={styles.backButtonError}>Voltar</button></div>;
    if (!compra) return <div style={styles.centerMessage}>Compra não encontrada. <button onClick={() => navigate(-1)} style={styles.backButtonError}>Voltar</button></div>;

    const { unidade, cliente, contrato, pagamentos, status: compraStatus, createdAt } = compra;
    const { empreendimento } = unidade || {};

    const isConstrutoraView = currentUser?.tipo_usuario === 'construtora';
    const canConstrutoraSign = isConstrutoraView && contrato?.status === 'Aguardando Assinatura Construtora' && !contrato?.construtora_assinou;

    return (
        <div style={styles.pageContainer}>
            <button onClick={() => navigate(-1)} style={styles.backButton}>
                <IconBack /> Voltar
            </button>

            <h1 style={styles.title}>Detalhes da Compra <span style={styles.highlight}>#{compra.id}</span></h1>
            
            {error && <p style={styles.errorMessage}>{error}</p>}

            <div style={styles.grid}>
                <div style={styles.card}>
                    <h2 style={styles.cardTitle}>Resumo da Compra</h2>
                    <div style={styles.infoGroup}><span>Data de Início:</span><strong>{formatDate(createdAt)}</strong></div>
                    <div style={styles.infoGroup}><span>Status Atual:</span><span style={getCompraStatusStyle(compraStatus)}>{compraStatus.replace(/_/g, ' ')}</span></div>
                    <div style={styles.infoGroup}><span>Cliente:</span><div><strong>{cliente?.nome}</strong> <small>({cliente?.email})</small></div></div>
                    <hr style={styles.hr} />
                    <h3 style={styles.subTitle}>Unidade Adquirida</h3>
                    <div style={styles.infoGroup}><span>Empreendimento:</span><strong>{empreendimento?.nome || 'N/A'}</strong></div>
                    <div style={styles.infoGroup}>
                        <span>Unidade:</span>
                        <strong>
                            {unidade?.bloco && `Bloco ${unidade.bloco} / `}
                            {unidade?.andar && `Andar ${unidade.andar} / `}
                            Unidade {unidade?.numero || 'N/A'}
                        </strong>
                    </div>
                    <div style={styles.infoGroup}><span>Valor:</span><strong style={{color: '#27ae60'}}>{formatPrice(unidade?.preco)}</strong></div>
                </div>

                <div style={styles.card}>
                    <h2 style={styles.cardTitle}>Andamento</h2>
                    {contrato ? (
                        <>
                            <h3 style={styles.subTitle}>Contrato</h3>
                            <div style={styles.infoGroup}><span>Status:</span><span style={getCompraStatusStyle(contrato.status)}>{contrato.status.replace(/_/g, ' ')}</span></div>
                            <div style={styles.infoGroup}><span>Cliente Assinou:</span><strong>{contrato.cliente_assinou ? `Sim (${formatDate(contrato.data_assinatura)})` : 'Não'}</strong></div>
                            <div style={styles.infoGroup}><span>Construtora Assinou:</span><strong>{contrato.construtora_assinou ? `Sim (${formatDate(contrato.data_assinatura)})` : 'Não'}</strong></div>
                            <div style={styles.infoGroup}>
                                <span>Documento:</span>
                                {contrato.documento_url ? (
                                    <a href={contrato.documento_url} target="_blank" rel="noopener noreferrer" style={styles.link}>
                                        Visualizar/Assinar
                                    </a>
                                ) : 'Ainda não disponível.'}
                            </div>
                             {canConstrutoraSign && (
                                <div style={styles.actionGroup}>
                                    <button onClick={handleConstrutoraSign} disabled={submitting} style={{...styles.actionButton, ...styles.buttonSign}}>
                                        <IconSign /> {submitting ? 'Assinando...' : 'Assinar como Construtora'}
                                    </button>
                                </div>
                             )}
                        </>
                    ) : <p>Contrato ainda não gerado.</p>}

                    <hr style={styles.hr} />

                    <h3 style={styles.subTitle}>Histórico de Pagamentos</h3>
                    {pagamentos && pagamentos.length > 0 ? (
                        <ul style={styles.paymentList}>
                            {pagamentos.map(pgto => (
                                <li key={pgto.id} style={styles.paymentItem}>
                                    <div style={styles.paymentInfo}>
                                        <span>{formatDate(pgto.createdAt)}:</span>
                                        <strong>{formatPrice(pgto.valor)}</strong>
                                        <span style={{ marginLeft: 'auto', ...getCompraStatusStyle(pgto.status) }}>{pgto.status}</span>
                                    </div>
                                    {isConstrutoraView && pgto.status === 'Pendente' && (
                                         <div style={styles.paymentAction}>
                                             <button
                                                 onClick={() => handleConfirmPayment(pgto.id)}
                                                 disabled={submitting}
                                                 style={{...styles.actionButton, ...styles.buttonConfirmPayment}}
                                             >
                                                 <IconConfirm /> {submitting ? 'Confirmando...' : 'Confirmar Recebimento'}
                                             </button>
                                         </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : <p>Nenhum pagamento registrado.</p>}

                    {compraStatus === 'Aguardando Pagamento' && !isConstrutoraView && (
                         <div style={styles.actionGroup}>
                            <Link to={`/pagamentos/compra/${compra.id}`} style={{textDecoration: 'none'}}>
                                <button style={{...styles.actionButton, ...styles.actionButtonPay}}><IconPay /> Ver/Realizar Pagamento</button>
                            </Link>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Estilos UX/UI ---
const styles = {
    pageContainer: { maxWidth: '1200px', margin: '30px auto', padding: '0 20px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" },
    title: { fontSize: '2em', marginBottom: '25px', color: '#2c3e50', fontWeight: 600, textAlign: 'center' },
    highlight: { color: '#3498db' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '30px' },
    card: { borderRadius: '12px', padding: '25px 30px', backgroundColor: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', border: '1px solid #eee' },
    cardTitle: { fontSize: '1.4em', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px', color: '#34495e', fontWeight: 500 },
    subTitle: { fontSize: '1.1em', marginTop: '25px', marginBottom: '15px', color: '#2c3e50', fontWeight: 600 },
    infoGroup: { marginBottom: '14px', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', span: { color: '#555' }, strong: { color: '#2c3e50', textAlign: 'right' }, small: { color: '#7f8c8d' }, a: { color: '#3498db', fontWeight: 'bold', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } } },
    hr: { border: 0, borderTop: '1px solid #f0f0f0', margin: '25px 0' },
    paymentList: { listStyle: 'none', paddingLeft: '0', marginTop: '10px' },
    paymentItem: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #f0f0f0' },
    paymentInfo: { display: 'flex', alignItems: 'center', gap: '8px' },
    paymentAction: { textAlign: 'right' },
    actionGroup: { marginTop: '20px' },
    actionButton: { width: '100%', padding: '12px', fontSize: '1em', cursor: 'pointer', borderRadius: '6px', border: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background-color 0.2s ease' },
    buttonSign: { backgroundColor: '#28a745', color: 'white', '&:hover:not(:disabled)': { backgroundColor: '#218838' }, '&:disabled': { backgroundColor: '#a3d9b6', cursor: 'not-allowed' } },
    actionButtonPay: { backgroundColor: '#ffc107', color: 'black', '&:hover': { backgroundColor: '#e0a800' } },
    buttonConfirmPayment: { backgroundColor: '#0d6efd', color: 'white', fontSize: '0.85em', padding: '8px 12px', width: 'auto', '&:hover:not(:disabled)': { backgroundColor: '#0b5ed7' }, '&:disabled': { backgroundColor: '#9ec5fe', cursor: 'not-allowed' } },
    centerMessage: { textAlign: 'center', padding: '60px 20px', fontSize: '1.1em', color: '#555' },
    backButton: { display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', transition: 'background-color 0.2s ease', '&:hover': { backgroundColor: '#5a6268' }, marginBottom: '20px' },
    backButtonError: { backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '8px 15px', cursor: 'pointer', borderRadius: '6px', fontSize: '0.9em', textDecoration: 'none', '&:hover': { backgroundColor: '#5a6268' } },
    errorMessage: { color: '#e74c3c', backgroundColor: '#fdeded', border: '1px solid #f5b7b1', padding: '12px', borderRadius: '6px', textAlign: 'center', fontSize: '0.9em', marginBottom: '20px' },
    icon: { marginRight: '6px', fontSize: '1.1em' }
};

export default CompraDetalhesPage;