// src/pages/EmpreendimentoPublicDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
// Ícones (Simples)
const IconBuilding = () => <span role="img" aria-label="Construtora" style={styles.icon}>🏢</span>;
const IconCalendar = () => <span role="img" aria-label="Agenda" style={styles.icon}>📅</span>;
const IconChat = () => <span role="img" aria-label="Chat" style={styles.icon}>💬</span>;
const IconDownload = () => <span role="img" aria-label="Download" style={styles.icon}>⬇️</span>;
const IconPin = () => <span role="img" aria-label="Localização" style={styles.icon}>📍</span>;
const IconChevronRight = () => <span role="img" aria-label="Ver mais" style={styles.icon}>❯</span>;
const IconPlant = () => <span role="img" aria-label="Planta" style={styles.icon}>🌿</span>;

// Funções de formatação (Idealmente, mover para um arquivo utils)
const formatPrice = (value) => {
    if (value === null || value === undefined || isNaN(parseFloat(value))) return 'N/A';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
        return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    } catch (e) { return null; }
};

// --- Componente para a linha da tabela de unidades ---
function AvailableUnitItem({ unidade }) {
    return (
        <tr style={styles.tableRow} className="table-row-hover">
            <td style={styles.tableCell}>{unidade.bloco || '-'}</td>
            <td style={styles.tableCell}>{unidade.andar === null ? '-' : unidade.andar}</td>
            <td style={styles.tableCell}>{unidade.numero}</td>
            <td style={styles.tableCell}>{unidade.quartos ?? '-'}<span style={styles.dimLabel}>q</span> / {unidade.banheiros ?? '-'}<span style={styles.dimLabel}>b</span> / {unidade.vagas ?? '-'}<span style={styles.dimLabel}>v</span></td>
            <td style={styles.tableCell}>{unidade.area ? `${unidade.area} m²` : '-'}</td>
            <td style={styles.tableCell}>{formatPrice(unidade.preco)}</td>
            <td style={styles.tdActions}>
                {unidade.planta_unidade_url && (
                    // --- CORRIGIDO: Tag <a> estilizada diretamente ---
                    <a
                        href={`${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}${unidade.planta_unidade_url}`}
                        download
                        rel="noopener noreferrer"
                        style={{ ...styles.actionButton, ...styles.buttonDetails, textDecoration: 'none' }}
                    >
                        <IconPlant />Ver Planta
                    </a>
                )}
                <Link to={`/comprar/unidade/${unidade.id}`}>
                    <button style={{ ...styles.actionButton, ...styles.buttonInterest }}>Tenho Interesse <IconChevronRight /></button>
                </Link>
            </td>
        </tr>
    );
}

function EmpreendimentoPublicDetailsPage() {
    const { id: empreendimentoId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, user: currentUser } = useAuth();
    const [empreendimento, setEmpreendimento] = useState(null);
    const [unidades, setUnidades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [lightboxIndex, setLightboxIndex] = useState(-1);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                const [empreendimentoResponse, unidadesResponse] = await Promise.all([
                    api.get(`/empreendimentos/public/${empreendimentoId}`),
                    api.get(`/empreendimentos/${empreendimentoId}/unidades/disponiveis`)
                ]);
                setEmpreendimento(empreendimentoResponse.data);
                setUnidades(Array.isArray(unidadesResponse.data?.unidades) ? unidadesResponse.data.unidades : []);
            } catch (err) {
                console.error("Erro ao buscar detalhes do empreendimento ou unidades:", err);
                if (err.response && (err.response.status === 404)) {
                    setError("Empreendimento não encontrado.");
                } else if (err.response && err.response.data && err.response.data.message) {
                    setError(err.response.data.message);
                } else {
                    setError("Falha ao carregar os dados. Tente novamente.");
                }
                setEmpreendimento(null);
                setUnidades([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [empreendimentoId]);

    const handleAgendarVisita = () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: location } });
        } else {
            navigate(`/agendar-visita?empreendimentoId=${empreendimentoId}`);
        }
    };

    const handleIniciarChat = () => {
        const construtoraUsuarioId = empreendimento?.construtora?.usuario_id;
        if (!construtoraUsuarioId) {
            alert("Não foi possível identificar o contato da construtora.");
            return;
        }
        if (currentUser && currentUser.id === construtoraUsuarioId) {
            alert("Você não pode iniciar um chat consigo mesmo.");
            return;
        }
        if (!isAuthenticated) {
            const targetChatPath = `/chat/conversa/${construtoraUsuarioId}`;
            navigate('/login', { state: { from: { pathname: targetChatPath } } });
        } else {
            navigate(`/chat/conversa/${construtoraUsuarioId}`);
        }
    };

    if (loading) {
        return <div style={styles.centerMessage}>Carregando detalhes do empreendimento...</div>;
    }
    if (error) {
        return <div style={{ ...styles.centerMessage, color: 'red' }}>Erro: {error} <Link to="/">Voltar</Link></div>;
    }
    if (!empreendimento) {
        return <div style={styles.centerMessage}>Empreendimento não encontrado. <Link to="/">Voltar</Link></div>;
    }

    const backendUrlBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace('/api', '');
    const imagensCarrossel = Array.isArray(empreendimento.imagens) && empreendimento.imagens.length > 0
        ? empreendimento.imagens.map(imageUrl => imageUrl.startsWith('http') ? imageUrl : `${backendUrlBase}${imageUrl}`)
        : [`https://via.placeholder.com/1200x600/eee/888?text=${encodeURIComponent(empreendimento.nome || 'Empreendimento')}`];

    const previsaoEntregaFormatada = formatDate(empreendimento.previsao_entrega);
    const construtoraUsuarioId = empreendimento?.construtora?.usuario_id;
    const lightboxSlides = imagensCarrossel.map(url => ({ src: url }));

    return (
        <div style={styles.pageContainer}>
            <div style={styles.carouselContainer}>
                <Carousel
                    showThumbs={true}
                    infiniteLoop={true}
                    autoPlay={true}
                    interval={4000}
                    showStatus={false}
                    thumbWidth={100}
                    onClickItem={(index) => setLightboxIndex(index)}
                >
                    {imagensCarrossel.map((url, index) => (
                        <div key={index} style={{ cursor: 'pointer' }}>
                            <img src={url} alt={`Imagem ${index + 1}`} style={styles.carouselImage} />
                        </div>
                    ))}
                </Carousel>
            </div>
            <Lightbox
                open={lightboxIndex >= 0}
                close={() => setLightboxIndex(-1)}
                slides={lightboxSlides}
                index={lightboxIndex}
            />

            <div style={styles.headerSection}>
                <div style={styles.titleGroup}>
                    <h1 style={styles.title}>{empreendimento.nome}</h1>
                    <p style={styles.address}><IconPin />{empreendimento.endereco || 'Endereço não disponível'}</p>
                    <p style={styles.construtoraInfo}><IconBuilding />Por: {empreendimento.construtora?.nome_empresa || 'Construtora'}</p>
                </div>
                <div style={styles.actionButtonsContainer}>
                    {empreendimento.planta_url && (
                        <a
                            href={`${backendUrlBase}${empreendimento.planta_url}`}
                            download
                            rel="noopener noreferrer"
                            style={{ ...styles.actionButton, ...styles.actionButtonSecondary, textDecoration: 'none' }}
                        >
                            <IconDownload /> Baixar Planta Geral
                        </a>
                    )}
                    {construtoraUsuarioId && construtoraUsuarioId !== currentUser?.id && (
                        <button onClick={handleIniciarChat} style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}>
                            <IconChat /> Contatar Construtora
                        </button>
                    )}
                    <button onClick={handleAgendarVisita} style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}>
                        <IconCalendar /> Agendar Visita
                    </button>
                </div>
            </div>

            <div style={styles.infoBadges}>
                <span style={styles.badge}>Status: <strong style={{ color: '#333' }}>{empreendimento.status}</strong></span>
                {previsaoEntregaFormatada && <span style={styles.badge}>Previsão Entrega: <strong style={{ color: '#333' }}>{previsaoEntregaFormatada}</strong></span>}
            </div>

            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Sobre o Empreendimento</h2>
                <p style={styles.description}>{empreendimento.descricao || 'Descrição não disponível.'}</p>
            </div>

            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Unidades Disponíveis</h2>
                {unidades.length === 0 ? (
                    <p>Nenhuma unidade disponível no momento. Entre em contato para mais informações.</p>
                ) : (
                    <div style={styles.tableContainer}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.tableHeader}>Bloco</th>
                                    <th style={styles.tableHeader}>Andar</th>
                                    <th style={styles.tableHeader}>Unidade</th>
                                    <th style={styles.tableHeader}>Config.</th>
                                    <th style={styles.tableHeader}>Área</th>
                                    <th style={styles.tableHeader}>Preço</th>
                                    <th style={styles.tableHeader}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {unidades.map(unidade => (
                                    <AvailableUnitItem key={unidade.id} unidade={unidade} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <button onClick={() => navigate('/')} style={styles.backButton}>
                ← Ver outros Empreendimentos
            </button>
        </div>
    );
}

// --- Estilos ---
const styles = {
    pageContainer: { maxWidth: '1200px', margin: '30px auto', padding: '0 20px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" },
    carouselContainer: { borderRadius: '12px', overflow: 'hidden', marginBottom: '30px', boxShadow: '0 8px 25px rgba(0,0,0,0.1)' },
    carouselImage: { maxHeight: '550px', objectFit: 'cover', imageRendering: 'high-quality' },
    headerSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' },
    titleGroup: { flex: '1 1 500px' },
    title: { fontSize: '2.8em', marginBottom: '10px', color: '#2c3e50', fontWeight: 700, lineHeight: 1.2 },
    address: { fontSize: '1.1em', color: '#555', marginBottom: '5px' },
    construtoraInfo: { fontSize: '1em', color: '#777', marginBottom: '20px' },
    actionButtonsContainer: { display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end', flex: '0 1 300px' },
    actionButton: {
        width: '100%', padding: '12px 20px', fontSize: '1em', cursor: 'pointer',
        borderRadius: '6px', border: 'none', fontWeight: 500, display: 'flex',
        alignItems: 'center', justifyContent: 'center', gap: '8px',
        transition: 'background-color 0.2s ease, transform 0.1s ease',
        '&:hover': { transform: 'scale(1.02)' }
    },
    actionButtonPrimary: { backgroundColor: '#28a745', color: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' },
    actionButtonSecondary: { backgroundColor: '#007bff', color: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' },
    infoBadges: { display: 'flex', gap: '15px', marginTop: '25px', flexWrap: 'wrap' },
    badge: { backgroundColor: '#f1f3f5', padding: '8px 15px', borderRadius: '20px', fontSize: '0.9em', color: '#495057' },
    section: { marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #eee' },
    sectionTitle: { fontSize: '1.8em', marginBottom: '15px', color: '#333' },
    description: { lineHeight: '1.6', color: '#444' },
    tableContainer: { overflowX: 'auto', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', border: '1px solid #e0e0e0' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '800px' },
    tableHeader: { backgroundColor: '#f8f9fa', padding: '12px', borderBottom: '2px solid #dee2e6', textAlign: 'left', fontSize: '0.9em', fontWeight: '600' },
    tableCell: { padding: '12px 15px', borderBottom: '1px solid #eee', fontSize: '0.9em', verticalAlign: 'middle' },
    tdActions: { padding: '8px 15px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap', textAlign: 'right' },
    tableRow: { '&:hover': { backgroundColor: '#f8f9fa' } },
    dimLabel: { fontSize: '0.8em', color: '#777' },
    buttonDetails: { backgroundColor: '#6c757d', color: 'white' },
    buttonInterest: { backgroundColor: '#0d6efd', color: 'white' },
    centerMessage: { textAlign: 'center', padding: '50px 20px', fontSize: '1.1em', color: '#555' },
    backButton: { display: 'block', width: 'fit-content', margin: '40px auto 20px auto', backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '10px 25px', cursor: 'pointer', borderRadius: '6px', fontSize: '1em', textDecoration: 'none', '&:hover': { backgroundColor: '#5a6268' } },
    icon: { marginRight: '6px' },
};

export default EmpreendimentoPublicDetailsPage;