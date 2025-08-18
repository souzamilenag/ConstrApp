import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import SignatureModal from '../components/SignatureModal'; 

const IconBuilding = () => <span role="img" aria-label="Empreendimento" style={{ marginRight: '5px' }}>🏢</span>;
const IconUnit = () => <span role="img" aria-label="Unidade" style={{ marginRight: '5px' }}>🔑</span>;
const IconCalendar = () => <span role="img" aria-label="Data" style={{ marginRight: '5px' }}>📅</span>;
const IconPrice = () => <span role="img" aria-label="Preço" style={{ marginRight: '5px' }}>💲</span>;
const IconStatus = () => <span role="img" aria-label="Status" style={{ marginRight: '5px' }}>📊</span>;
const IconContract = () => <span role="img" aria-label="Contrato" style={{ marginRight: '5px' }}>📄</span>;
const IconChevronRight = () => <span role="img" aria-label="Ver mais" style={{ marginLeft: '5px' }}>❯</span>;
const formatPrice = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {// Mês abreviado
    } catch (e) { return 'Data inválida'; }
};

const getStatusStyle = (status) => {
    let backgroundColor = '#6c757d'; 
    let color = 'white';
    let borderColor = 'transparent'; 
    switch (status?.toLowerCase()) {
        case 'em processo':
        case 'aguardando contrato':
        case 'pendente':
            backgroundColor = '#fff3cd'; color = '#664d03'; borderColor = '#ffecb5'; break;
        case 'aguardando assinaturas':
        case 'pronto para assinatura':
        case 'aguardando sua assinatura':
        case 'aguardando assinatura da construtora':
            backgroundColor = '#cff4fc'; color = '#055160'; borderColor = '#b6effb'; break; 
        case 'aguardando pagamento':
            backgroundColor = '#ffe5d0'; color = '#854400'; borderColor = '#fed8b1'; break; 
        case 'concluída':
        case 'assinado':
            backgroundColor = '#d1e7dd'; color = '#0f5132'; borderColor = '#badbcc'; break; 
        case 'cancelada':
        case 'inválido':
            backgroundColor = '#f8d7da'; color = '#842029'; borderColor = '#f5c2c7'; break; 
        default:
             backgroundColor = '#e9ecef'; color = '#495057'; borderColor = '#dee2e6'; break;
    }
    return {
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '0.8rem',
        fontWeight: '600',
        display: 'inline-block',
        textAlign: 'center',
        minWidth: '130px', 
        border: `1px solid ${borderColor}`,
        backgroundColor,
        color,
        textTransform: 'capitalize' 
    };
};

function StatusBadge({ status, textOverride }) {
    return <span style={getStatusStyle(status)}>{textOverride || status?.replace(/_/g, ' ') || 'N/D'}</span>;
}

function ContractStatusDisplay({ contrato }) {
    if (!contrato) return <StatusBadge status="Pendente" textOverride="Contrato Pendente" />;

    let text = contrato.status || 'Pendente';
    if (contrato.status === 'Pendente' && contrato.documento_url && !contrato.cliente_assinou && !contrato.construtora_assinou) {
        text = 'Pronto para Assinatura';
    } else if (contrato.cliente_assinou && !contrato.construtora_assinou && contrato.documento_url) {
        text = 'Aguardando Construtora';
    } else if (!contrato.cliente_assinou && contrato.construtora_assinou && contrato.documento_url) {
        text = 'Aguardando Sua Assinatura';
    } else if (contrato.cliente_assinou && contrato.construtora_assinou) {
         text = 'Contrato Assinado';
    }
    return <StatusBadge status={contrato.status} textOverride={text} />;
}

function MinhasComprasPage() {
    const [compras, setCompras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCompra, setSelectedCompra] = useState(null);

    const fetchMinhasCompras = useCallback(async () => {setLoading(true); setError(''); try { const response = await api.get('/compras/minhas'); setCompras(response.data?.compras || []); } catch (err) { console.error("Erro ao buscar minhas compras:", err); setError(err.response?.data?.message || "Falha ao carregar suas compras."); setCompras([]); } finally { setLoading(false); } }, []);
    useEffect(() => { fetchMinhasCompras(); }, [fetchMinhasCompras]);
    const handleOpenSignatureModal = (compra) => { if (compra?.contrato?.documento_url) { setSelectedCompra(compra); setIsModalOpen(true); } else { alert("O documento do contrato ainda não está disponível."); } };
    const handleCloseModal = () => {  setIsModalOpen(false); setSelectedCompra(null); };
    const handleSignatureSuccess = () => { fetchMinhasCompras(); };

    // --- Renderização ---
    return (
        <div style={styles.pageContainer}>
            <h1 style={styles.pageTitle}>Minhas Compras</h1>

            {loading && <div style={styles.centerMessage}>Carregando suas compras...</div>}
            {error && <div style={styles.errorText}>Erro: {error}</div>}

            {!loading && !error && compras.length === 0 && (
                <div style={styles.centerMessage}>
                    <p>Você ainda não iniciou nenhum processo de compra.</p>
                    <Link to="/" style={styles.primaryLink}>Ver Empreendimentos</Link>
                </div>
            )}

            {!loading && !error && compras.length > 0 && (
                <div style={styles.cardsGrid}>
                    {compras.map(compra => (
                        <div key={compra.id} style={styles.compraCard}>
                            <div style={styles.cardHeader}>
                                <h3 style={styles.cardTitle}><IconBuilding />{compra.unidade?.empreendimento?.nome || 'Empreendimento'}</h3>
                                <p style={styles.cardSubtitle}><IconUnit />
                                    {compra.unidade?.bloco ? `Bl ${compra.unidade.bloco} / ` : ''}
                                    {compra.unidade?.andar ? `And ${compra.unidade.andar} / ` : ''}
                                    Unidade {compra.unidade?.numero || 'N/A'}
                                </p>
                            </div>
                            <div style={styles.cardBody}>
                                <div style={styles.infoRow}><IconCalendar /><strong>Data Início:</strong> <span>{formatDate(compra.createdAt)}</span></div>
                                <div style={styles.infoRow}><IconPrice /><strong>Valor:</strong> <span>{formatPrice(compra.unidade?.preco)}</span></div>
                                <div style={styles.infoRow}><IconStatus /><strong>Status Compra:</strong> <StatusBadge status={compra.status} /></div>
                                <div style={styles.infoRow}><IconContract /><strong>Status Contrato:</strong> <ContractStatusDisplay contrato={compra.contrato} /></div>
                            </div>
                            <div style={styles.cardActions}>
                                {compra.contrato?.documento_url &&
                                 !compra.contrato?.cliente_assinou &&
                                 ['Aguardando Assinatura Cliente', 'Pronto para Assinatura', 'Aguardando Assinaturas', 'Pendente', 'Aguardando Sua Assinatura'].includes(compra.contrato?.status) && (
                                    <button onClick={() => handleOpenSignatureModal(compra)} style={{...styles.actionButton, ...styles.actionButtonSign}}>
                                        Assinar Contrato <IconChevronRight />
                                    </button>
                                )}
                                {compra.status === 'Aguardando Pagamento' && (
                                    <Link to={`/pagamentos/compra/${compra.id}`} style={styles.actionLink}>
                                        <button style={{...styles.actionButton, ...styles.actionButtonPay}}>Realizar Pagamento <IconChevronRight /></button>
                                    </Link>
                                )}
                                <Link to={`/compras/detalhes/${compra.id}`} style={styles.actionLink}>
                                    <button style={{...styles.actionButton, ...styles.actionButtonDetails}}>
                                        Ver Detalhes <IconChevronRight />
                                    </button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <SignatureModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                compraId={selectedCompra?.id}
                documentoUrl={selectedCompra?.contrato?.documento_url}
                onSignatureSuccess={handleSignatureSuccess}
            />
        </div>
    );
}

const styles = {
    pageContainer: { maxWidth: '1200px', margin: '30px auto', padding: '0 20px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" },
    pageTitle: { fontSize: '2.2em', marginBottom: '30px', color: '#2c3e50', textAlign: 'center', fontWeight: 600 },
    centerMessage: { textAlign: 'center', padding: '50px 20px', fontSize: '1.2em', color: '#7f8c8d' },
    primaryLink: { color: '#3498db', textDecoration: 'none', fontWeight: 'bold', marginTop: '10px', display: 'inline-block', '&:hover': { textDecoration: 'underline' } },
    errorText: { color: '#c0392b', padding: '15px', border: '1px solid #e74c3c', borderRadius: '8px', backgroundColor: '#fdedec', marginBottom: '25px', textAlign: 'center' },
    cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '25px' },
    compraCard: {
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
        backgroundColor: '#f8f9fa', //
        padding: '18px 22px',
        borderBottom: '1px solid #eee', 
        h3: { margin: '0 0 6px 0', fontSize: '1.3em', color: '#2c3e50', fontWeight: 600, display: 'flex', alignItems: 'center' },
    },
    cardSubtitle: { fontSize: '0.95em', color: '#555', margin: 0, display: 'flex', alignItems: 'center' },
    cardBody: {
        padding: '18px 22px',
        flexGrow: 1,
    },
    infoRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between', 
        marginBottom: '12px',
        fontSize: '0.95em',
        color: '#34495e',
        strong: { color: '#2c3e50' },
        span: { textAlign: 'right' } 
    },
    cardActions: {
        padding: '18px 22px',
        borderTop: '1px solid #eee',
        backgroundColor: '#fdfdfd',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    },
    actionLink: { textDecoration: 'none', display: 'block', width: '100%' },
    actionButton: {
        width: '100%',
        padding: '10px 15px',
        fontSize: '0.95em',
        cursor: 'pointer',
        borderRadius: '6px',
        border: 'none',
        fontWeight: '500',
        textAlign: 'center',
        transition: 'background-color 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtonSign: { backgroundColor: '#28a745', color: 'white', '&:hover': { backgroundColor: '#218838' } },
    actionButtonPay: { backgroundColor: '#ffc107', color: '#212529', '&:hover': { backgroundColor: '#e0a800' } },
    actionButtonDetails: { backgroundColor: '#6c757d', color: 'white', '&:hover': { backgroundColor: '#5a6268' } },
};

export default MinhasComprasPage;