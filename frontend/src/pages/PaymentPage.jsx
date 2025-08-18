import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import QRCode from "react-qr-code"; 
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';

const IconBuilding = () => <span role="img" aria-label="Empreendimento" style={styles.icon}>🏢</span>;
const IconInfo = () => <span role="img" aria-label="Info" style={styles.icon}>ℹ️</span>;
const IconPrice = () => <span role="img" aria-label="Preço" style={styles.icon}>💲</span>;
const IconPix = () => <span role="img" aria-label="PIX" style={styles.icon}>📱</span>;
const IconBoleto = () => <span role="img" aria-label="Boleto" style={styles.icon}>📄</span>;

const formatPrice = (value) => {
    if (value === null || value === undefined || isNaN(parseFloat(value))) return 'N/A';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const generateBoletoPDF = (compraInfo, paymentDetails) => {
    if (!compraInfo || !compraInfo.unidade || !paymentDetails || !compraInfo.cliente) {
        console.error("Dados insuficientes para gerar boleto: compraInfo, unidade, cliente ou paymentDetails faltando.");
        alert("Não foi possível gerar o boleto: dados da compra incompletos.");
        return;
    }

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });
    const construtora = compraInfo.unidade.empreendimento.construtora;
    const MARGIN = 15;
    const PAGE_WIDTH = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("BOLETO DE PAGAMENTO", PAGE_WIDTH / 2, MARGIN + 5, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Beneficiário: ${construtora.nome_empresa || 'Construtora não informada'}`, 14, 35);
    doc.text(`CNPJ: ${construtora.cnpj || 'CNPJ não informado'}`, 14, 40);
    doc.text(`Agência/Código Beneficiário: 0001-X / 123456-7`, PAGE_WIDTH - MARGIN - 70, MARGIN + 20);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, MARGIN + 30, PAGE_WIDTH - MARGIN, MARGIN + 30);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Dados do Pagador:", MARGIN, MARGIN + 40);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Nome: ${compraInfo.cliente?.nome || 'Cliente não informado'}`, MARGIN, MARGIN + 47);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Detalhes da Cobrança:", MARGIN, MARGIN + 60);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    const nossoNumero = paymentDetails.gatewayTransactionId || `SIM-${compraInfo.id}-${Date.now().toString().slice(-5)}`;
    doc.text(`Nosso Número: ${nossoNumero}`, MARGIN, MARGIN + 67);
    doc.text(`Data do Documento: ${new Date().toLocaleDateString('pt-BR')}`, PAGE_WIDTH - MARGIN - 50, MARGIN + 67);

    const dataVencimento = new Date();
    dataVencimento.setDate(dataVencimento.getDate() + 7); 
    doc.text(`Data de Vencimento: ${dataVencimento.toLocaleDateString('pt-BR')}`, MARGIN, MARGIN + 74);

    const valorDocumento = compraInfo.unidade?.preco;
    doc.setFont("helvetica", "bold");
    doc.text(`Valor do Documento: ${formatPrice(valorDocumento)}`, PAGE_WIDTH - MARGIN - 50, MARGIN + 74);
    doc.setFont("helvetica", "normal");
    doc.text(`Referente à: Compra #${compraInfo.id} - Unidade ${compraInfo.unidade?.numero || 'N/D'} do Empreendimento ${compraInfo.unidade?.empreendimento?.nome || 'N/D'}`, MARGIN, MARGIN + 83, { maxWidth: PAGE_WIDTH - (2 * MARGIN) });

    const linhaDigitavelSimulada = paymentDetails.linha_digitavel || "00190.00009 02921.770000 00000.000110 1 93750000123220";
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Linha Digitável:", MARGIN, MARGIN + 100);
    doc.text(linhaDigitavelSimulada, PAGE_WIDTH / 2, MARGIN + 108, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Código de Barras:", MARGIN, MARGIN + 125);
    let barX = MARGIN;
    const barHeight = 18;
    const barY = MARGIN + 130;
    for (let i = 0; i < 60; i++) {
        const barWidth = Math.random() > 0.4 ? (Math.random() * 1.5 + 0.5) : (Math.random() * 0.8 + 0.2);
        doc.rect(barX, barY, barWidth, barHeight, 'F');
        barX += barWidth + (Math.random() * 0.5 + 0.1);
        if (barX > PAGE_WIDTH - MARGIN - 5) break;
    }

    doc.setFontSize(9);
    doc.text("Instruções:", MARGIN, MARGIN + 160);
    doc.text("- Pagável preferencialmente na rede bancária ou correspondentes.", MARGIN, MARGIN + 165);
    doc.text("- Após o vencimento, consulte condições de pagamento.", MARGIN, MARGIN + 170);

    doc.setLineWidth(0.3);
    doc.line(MARGIN, MARGIN + 185, PAGE_WIDTH - MARGIN, MARGIN + 185); // Corte
    doc.text("Autenticação Mecânica / Recibo do Pagador", PAGE_WIDTH / 2, MARGIN + 190, { align: "center" });

    doc.save(`Boleto_${construtora.nome_empresa || 'ConstrutoraApp'}_Compra-${compraInfo.id}.pdf`);
};


function PaymentPage() {
    const { compraId } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const [compra, setCompra] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('pix');
    const [paymentInfo, setPaymentInfo] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState('');
    const [initiatingPayment, setInitiatingPayment] = useState(false);

    const fetchCompra = useCallback(async () => {
        setLoading(true);
        setError('');
        setPaymentInfo(null);
        setPaymentStatus('');
        try {
            const response = await api.get(`/compras/${compraId}`);
            setCompra(response.data);
            const statusRecebido = response.data?.status;
            if (statusRecebido !== 'Aguardando Pagamento') {
                setError(`Esta compra não está aguardando pagamento (Status: ${statusRecebido || 'desconhecido'}).`);
            }
        } catch (err) {
            console.error("PaymentPage: Erro ao buscar dados da compra:", err);
            setError(err.response?.data?.message || "Erro ao buscar dados da compra.");
        } finally {
            setLoading(false);
        }
    }, [compraId]);

    useEffect(() => {
        fetchCompra();
    }, [fetchCompra]);

    const handleInitiatePayment = async () => {
        if (!compra || !compra.unidade || !compra.unidade.empreendimento) {
            setError("Dados da compra incompletos para iniciar pagamento.");
            return;
        }

        setInitiatingPayment(true);
        setError('');
        setPaymentInfo(null);
        setPaymentStatus('pending');

        const valorPagamento = compra.unidade?.preco;

        const dataToSend = {
            valor: valorPagamento,
            metodo_pagamento: paymentMethod,
            descricao: `Pagamento Compra #${compraId} - Un. ${compra.unidade?.numero || 'N/D'} / Empr. ${compra.unidade?.empreendimento?.nome || 'N/D'} por ${currentUser?.nome || 'Cliente'}`
        };

        if (!dataToSend.valor || dataToSend.valor <= 0) {
            setError("Valor do pagamento inválido ou não definido para esta unidade.");
            setInitiatingPayment(false);
            setPaymentStatus('');
            return;
        }

        console.log("Iniciando pagamento com:", dataToSend);

        try {
            const response = await api.post(`/compras/${compraId}/pagamentos/iniciar`, dataToSend);
            console.log("Resposta da API de iniciar pagamento:", response.data);

            if (response.data && response.data.paymentInfo) {
                setPaymentInfo(response.data.paymentInfo);
                setPaymentStatus('initiated');
                setError('');

                if (response.data.paymentInfo.type === 'boleto' && compra && response.data.paymentInfo.linha_digitavel) {
                    generateBoletoPDF(compra, response.data.paymentInfo);
                }
            } else {
                throw new Error("Resposta da API de pagamento inválida ou incompleta.");
            }

        } catch (err) {
            console.error("Erro ao iniciar pagamento:", err);
            setError(err.response?.data?.message || "Falha ao gerar informações de pagamento.");
            setPaymentStatus('error');
            setPaymentInfo(null);
        } finally {
            setInitiatingPayment(false);
            console.log("PaymentPage: handleInitiatePayment finalizado.");
        }
    };

    if (loading) {
        return <div style={styles.centerMessage}>Carregando informações da compra...</div>;
    }
    if (error && !compra) {
        return <div style={{ ...styles.centerMessage, ...styles.errorBox }}>Erro: {error} <button onClick={() => navigate('/minhas-compras')} style={styles.backButtonError}>Voltar</button></div>;
    }
    if (!compra) {
        return <div style={styles.centerMessage}>Compra não encontrada. <button onClick={() => navigate('/minhas-compras')} style={styles.backButtonError}>Voltar</button></div>;
    }
    if (compra.status !== 'Aguardando Pagamento' && !error) {
        return (
            <div style={{ ...styles.centerMessage, color: '#e67e22' }}>
                Status da Compra: <strong>{compra.status}</strong>.
                <br />
                Não requer ação de pagamento no momento.
                <br />
                <button onClick={() => navigate(`/compras/detalhes/${compraId}`)} style={{...styles.backButton, marginTop: '20px'}}>
                    Ver Detalhes da Compra
                </button>
            </div>
        );
    }

    return (
        <div style={styles.pageContainer}>
            <h1 style={styles.pageTitle}>Pagamento da Compra <span style={styles.highlight}>#{compraId}</span></h1>

            <div style={styles.summaryBox}>
                <h3><IconBuilding />{compra.unidade?.empreendimento?.nome || 'Empreendimento'}</h3>
                <p><IconInfo />Unidade:
                    {compra.unidade?.bloco ? ` Bloco ${compra.unidade.bloco} /` : ''}
                    {compra.unidade?.andar ? ` Andar ${compra.unidade.andar} /` : ''}
                    {' Nº '} {compra.unidade?.numero || 'N/A'}
                </p>
                <p style={styles.summaryValor}><IconPrice />Valor a Pagar: <strong style={{color: '#27ae60'}}>{formatPrice(compra.unidade?.preco)}</strong></p>
                <p style={styles.paymentNote}>
                    Este é o valor total da unidade. O valor da entrada ou parcela atual pode ser diferente.
                    Consulte os detalhes da sua negociação.
                </p>
            </div>

            {error && !initiatingPayment && <p style={styles.errorBox}>{error}</p>}

            <div style={styles.paymentSection}>
                {!paymentInfo && paymentStatus !== 'initiated' ? (
                    <div style={styles.paymentOptions}>
                        <h3 style={styles.sectionTitle}>Selecione o Método de Pagamento:</h3>
                        <div style={styles.methodSelector}>
                            <button
                                onClick={() => setPaymentMethod('pix')}
                                style={paymentMethod === 'pix' ? {...styles.methodButton, ...styles.methodButtonActive} : styles.methodButton}
                            ><IconPix />PIX</button>
                            <button
                                onClick={() => setPaymentMethod('boleto')}
                                style={paymentMethod === 'boleto' ? {...styles.methodButton, ...styles.methodButtonActive} : styles.methodButton}
                            ><IconBoleto />Boleto Bancário</button>
                        </div>
                        <button onClick={handleInitiatePayment} disabled={initiatingPayment} style={styles.generateButton}>
                            {initiatingPayment ? 'Gerando...' : `Prosseguir com ${paymentMethod.toUpperCase()}`}
                        </button>
                    </div>
                ) : null}

                {paymentStatus === 'initiated' && paymentInfo?.type === 'pix' && paymentInfo?.copia_cola && (
                    <div style={styles.paymentInstructions}>
                        <h3 style={styles.sectionTitle}><IconPix />Pague com PIX</h3>
                        <p>1. Abra o app do seu banco e escolha a opção PIX.</p>
                        <p>2. Selecione "Pagar com QR Code" e escaneie a imagem abaixo:</p>
                        <div style={styles.qrCodeContainer}>
                            <QRCode value={paymentInfo.copia_cola} size={220} level={"M"} includeMargin={true} />
                        </div>
                        <p>3. Ou use a chave PIX Copia e Cola:</p>
                        <div style={styles.copyPasteContainer}>
                            <input type="text" readOnly value={paymentInfo.copia_cola} style={styles.copyPasteInput} onFocus={(e) => e.target.select()} />
                            <button onClick={() => { navigator.clipboard.writeText(paymentInfo.copia_cola); alert('Chave PIX copiada!'); }} style={styles.copyButton}>Copiar</button>
                        </div>
                        <p style={styles.statusInfo}>Aguardando confirmação do pagamento...</p>
                        <button onClick={() => { setPaymentInfo(null); setPaymentStatus(''); }} style={styles.changeMethodButton}>Escolher Outro Método</button>
                    </div>
                )}

                {paymentStatus === 'initiated' && paymentInfo?.type === 'boleto' && (
                     <div style={styles.paymentInstructions}>
                        <h3 style={styles.sectionTitle}><IconBoleto />Boleto Gerado (Simulação)</h3>
                        <p>O download do seu boleto simulado deve ter iniciado automaticamente.</p>
                        <p>Se não iniciou, você pode tentar gerar novamente ou verificar os downloads.</p>
                        <button onClick={() => generateBoletoPDF(compra, paymentInfo)} style={{...styles.boletoViewButton, marginTop: '10px', backgroundColor: '#5a6268'}}>
                            Gerar PDF Novamente
                        </button>
                        <p style={{marginTop: '15px'}}>Linha digitável (simulada):</p>
                        <div style={styles.copyPasteContainer}>
                            <input type="text" readOnly value={paymentInfo?.linha_digitavel || 'Não disponível'} style={styles.copyPasteInput} onFocus={(e) => e.target.select()} />
                            <button onClick={() => { navigator.clipboard.writeText(paymentInfo?.linha_digitavel); alert('Linha digitável copiada!'); }} style={styles.copyButton}>Copiar</button>
                        </div>
                        <p style={styles.statusInfo}>A confirmação pode levar até 3 dias úteis.</p>
                         <button onClick={() => { setPaymentInfo(null); setPaymentStatus(''); }} style={styles.changeMethodButton}>Escolher Outro Método</button>
                     </div>
                )}
            </div>

            <button onClick={() => navigate(`/compras/detalhes/${compraId}`)} style={styles.backButton}>
                ← Voltar para Detalhes
            </button>
        </div>
    );
}

const styles = {
    pageContainer: { maxWidth: '700px', margin: '30px auto', padding: '30px', border: '1px solid #e0e0e0', borderRadius: '12px', backgroundColor: '#fdfdff', boxShadow: '0 5px 15px rgba(0,0,0,0.08)', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" },
    pageTitle: { fontSize: '2em', color: '#2c3e50', marginBottom: '25px', textAlign: 'center', fontWeight: 600 },
    highlight: { color: '#3498db' },
    centerMessage: { textAlign: 'center', padding: '50px 20px', fontSize: '1.1em', color: '#555' },
    summaryBox: { border: '1px solid #eee', padding: '20px', marginBottom: '30px', backgroundColor: '#f9f9f9', borderRadius: '8px', h3: { marginTop: 0, marginBottom: '15px', fontSize: '1.2em', color: '#34495e', display: 'flex', alignItems: 'center' }, p: { margin: '8px 0', fontSize: '0.95em', display: 'flex', alignItems: 'center' } },
    summaryValor: { fontSize: '1.1em', marginTop: '10px !important' },
    paymentNote: { fontSize: '0.85em !important', color: '#7f8c8d', fontStyle: 'italic', marginTop: '15px !important', borderTop: '1px dashed #ddd', paddingTop: '10px !important' },
    errorBox: { color: '#c0392b', backgroundColor: '#fdedec', border: '1px solid #e74c3c', padding: '12px 15px', borderRadius: '6px', marginBottom: '25px', textAlign: 'center', fontSize: '0.95em' },
    paymentSection: { borderTop: '1px solid #eee', paddingTop: '25px', marginTop: '25px' },
    sectionTitle: { fontSize: '1.5em', color: '#34495e', marginBottom: '20px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    paymentOptions: { textAlign: 'center' },
    methodSelector: { display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' },
    methodButton: { padding: '10px 18px', fontSize: '1em', cursor: 'pointer', backgroundColor: '#fff', color: '#3498db', border: '1px solid #3498db', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', '&:hover': { backgroundColor: '#f0f8ff' } },
    methodButtonActive: { backgroundColor: '#3498db', color: 'white', fontWeight: 'bold' },
    generateButton: { padding: '12px 25px', fontSize: '1.1em', cursor: 'pointer', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 500, transition: 'background-color 0.2s ease', '&:hover:not(:disabled)': { backgroundColor: '#218838' }, '&:disabled': { backgroundColor: '#a3d9b6', cursor: 'not-allowed' } },
    paymentInstructions: { textAlign: 'center', marginTop: '20px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' },
    qrCodeContainer: { margin: '25px auto', display: 'inline-block', border: '1px solid #ccc', padding: '15px', backgroundColor: 'white', borderRadius: '6px' },
    copyPasteContainer: { display: 'flex', alignItems: 'stretch', justifyContent: 'center', margin: '15px auto', maxWidth: '90%' },
    copyPasteInput: { flexGrow: 1, fontFamily: 'monospace', padding: '10px 12px', fontSize: '0.95em', border: '1px solid #ccc', borderRadius: '4px 0 0 4px', backgroundColor: '#fff', color: '#333' },
    copyButton: { padding: '0 18px', cursor: 'pointer', border: '1px solid #ccc', borderLeft: 'none', backgroundColor: '#e9ecef', borderRadius: '0 4px 4px 0', color: '#495057', fontWeight: 500, transition: 'background-color 0.2s ease', '&:hover': { backgroundColor: '#dde1e6' } },
    statusInfo: { fontStyle: 'italic', color: '#555', marginTop: '20px', fontSize: '0.9em' },
    boletoViewButton: { fontSize: '1.2em', padding: '12px 25px', cursor: 'pointer', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '6px', margin: '15px 0', transition: 'background-color 0.2s ease', '&:hover': { backgroundColor: '#138496' } },
    changeMethodButton: { marginTop: '25px', backgroundColor: 'transparent', border: '1px solid #adb5bd', color: '#495057', padding: '8px 18px', cursor: 'pointer', borderRadius: '6px', fontSize: '0.9em', transition: 'all 0.2s ease', '&:hover': { backgroundColor: '#e9ecef', borderColor: '#6c757d' } },
    backButton: { display: 'block', width: 'fit-content', margin: '35px auto 10px auto', backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '10px 20px', cursor: 'pointer', borderRadius: '6px', fontSize: '0.95em', textDecoration: 'none', '&:hover': { backgroundColor: '#5a6268' } },
    backButtonError: { backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '8px 15px', cursor: 'pointer', borderRadius: '6px', fontSize: '0.9em', textDecoration: 'none', '&:hover': { backgroundColor: '#5a6268' } },
    icon: { marginRight: '8px', verticalAlign: 'middle' }
};

export default PaymentPage;