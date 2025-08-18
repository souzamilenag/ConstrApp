import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const getCompraStatusStyle = (status) => {
    let backgroundColor = '#6c757d';
    let color = 'white';
    switch (status?.toLowerCase()) {
        case 'em processo':
        case 'aguardando contrato':
        case 'pendente':
            backgroundColor = '#ffc107'; color = '#000'; break;
        case 'aguardando assinaturas':
        case 'pronto para assinatura':
        case 'aguardando sua assinatura':
        case 'aguardando assinatura da construtora':
            backgroundColor = '#0dcaf0'; color = '#000'; break;
        case 'aguardando pagamento':
            backgroundColor = '#fd7e14'; break;
        case 'concluída':
        case 'assinado':
            backgroundColor = '#198754'; break;
        case 'cancelada':
        case 'inválido':
            backgroundColor = '#dc3545'; break;
    }
    return {
        padding: '5px 12px',
        borderRadius: '8px',
        fontSize: '0.85rem',
        display: 'inline-block',
        fontWeight: '600',
        backgroundColor,
        color,
    };
};

const formatPrice = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
    } catch {
        return 'Data inválida';
    }
};

function CompraDetalhesPage() {
    const { id: compraId } = useParams();
    const navigate = useNavigate();
    const [compra, setCompra] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDetalhes = async () => {
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
        };

        fetchDetalhes();
    }, [compraId]);

    if (loading) return <div style={styles.centerMessage}>Carregando detalhes da compra...</div>;
    if (error) return <div style={{ ...styles.centerMessage, color: 'red' }}>Erro: {error} <button onClick={() => navigate(-1)}>Voltar</button></div>;
    if (!compra) return <div style={styles.centerMessage}>Compra não encontrada. <button onClick={() => navigate(-1)}>Voltar</button></div>;

    const { unidade, cliente, contrato, pagamentos, status: compraStatus, createdAt } = compra;
    const { empreendimento } = unidade || {};

    return (
        <div style={styles.pageContainer}>
            <h1 style={styles.title}>Detalhes da Compra #{compra.id}</h1>

            <div style={styles.grid}>
                <div style={styles.card}>
                    <h2 style={styles.cardTitle}>Resumo da Compra</h2>
                    <div style={styles.infoGroup}><span>Data de Início:</span><strong>{formatDate(createdAt)}</strong></div>
                    <div style={styles.infoGroup}><span>Status Atual:</span><span style={getCompraStatusStyle(compraStatus)}>{compraStatus}</span></div>
                    <div style={styles.infoGroup}><span>Cliente:</span><strong>{cliente?.nome}</strong> <small>({cliente?.email})</small></div>

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
                    <div style={styles.infoGroup}><span>Valor:</span><strong>{formatPrice(unidade?.preco)}</strong></div>
                </div>

                <div style={styles.card}>
                    <h2 style={styles.cardTitle}>Contrato</h2>
                    {contrato ? (
                        <>
                            <div style={styles.infoGroup}><span>Status:</span><span style={getCompraStatusStyle(contrato.status)}>{contrato.status}</span></div>
                            <div style={styles.infoGroup}><span>Cliente Assinou:</span><strong>{contrato.cliente_assinou ? `Sim (${formatDate(contrato.data_assinatura)})` : 'Não'}</strong></div>
                            <div style={styles.infoGroup}><span>Construtora Assinou:</span><strong>{contrato.construtora_assinou ? `Sim (${formatDate(contrato.data_assinatura)})` : 'Não'}</strong></div>
                            <div style={styles.infoGroup}>
                                <span>Documento:</span>
                                {contrato.documento_url ? (
                                    <a href={contrato.documento_url} target="_blank" rel="noopener noreferrer">
                                        Visualizar/Assinar
                                    </a>
                                ) : 'Ainda não disponível.'}
                            </div>
                        </>
                    ) : <p>Contrato ainda não gerado.</p>}

                    <h3 style={styles.subTitle}>Histórico de Pagamentos</h3>
                    {pagamentos && pagamentos.length > 0 ? (
                        <ul style={styles.paymentList}>
                            {pagamentos.map(pgto => (
                                <li key={pgto.id} style={styles.paymentItem}>
                                    <span>{formatDate(pgto.createdAt)}:</span>
                                    <strong>{formatPrice(pgto.valor)}</strong>
                                    <span style={{ marginLeft: '8px', ...getCompraStatusStyle(pgto.status) }}>{pgto.status}</span>
                                    <small style={{ marginLeft: '8px' }}>({pgto.metodo_pagamento})</small>
                                </li>
                            ))}
                        </ul>
                    ) : <p>Nenhum pagamento registrado.</p>}

                    {compraStatus === 'Aguardando Pagamento' && (
                        <Link to={`/pagamentos/compra/${compra.id}`}>
                            <button style={styles.actionButtonPay}>Ver/Realizar Pagamento</button>
                        </Link>
                    )}
                </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '40px' }}>
                <button onClick={() => navigate(-1)} style={styles.backButton}>Voltar</button>
            </div>
        </div>
    );
}

const styles = {
    pageContainer: { maxWidth: '1200px', margin: '30px auto', padding: '0 20px', fontFamily: 'Segoe UI, sans-serif' },
    title: { fontSize: '1.8rem', marginBottom: '25px', color: '#333' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '25px' },
    card: { borderRadius: '12px', padding: '25px', backgroundColor: '#fff', boxShadow: '0 3px 6px rgba(0,0,0,0.1)', border: '1px solid #eee' },
    cardTitle: { fontSize: '1.2rem', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px', color: '#444' },
    subTitle: { fontSize: '1.1rem', marginTop: '25px', marginBottom: '10px', color: '#333' },
    infoGroup: { marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center' },
    paymentList: { listStyle: 'none', paddingLeft: '0', marginTop: '10px' },
    paymentItem: { marginBottom: '8px' },
    centerMessage: { textAlign: 'center', padding: '60px 20px', fontSize: '1.1em', color: '#555' },
    actionButtonPay: { backgroundColor: '#ffc107', color: 'black', border: 'none', padding: '10px 16px', cursor: 'pointer', borderRadius: '6px', fontWeight: '600', marginTop: '15px' },
    backButton: { backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }
};

export default CompraDetalhesPage;