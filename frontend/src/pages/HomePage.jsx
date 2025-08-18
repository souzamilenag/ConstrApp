// src/pages/HomePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

// Ícones (Simples)
const IconPin = () => <span role="img" aria-label="Localização" style={{ marginRight: '6px' }}>📍</span>;
const IconBuilding = () => <span role="img" aria-label="Construtora" style={styles.inputIcon}>🏢</span>; // Usado no filtro
const IconStatus = () => <span role="img" aria-label="Status" style={{ marginRight: '6px' }}>📊</span>;
const IconPriceTag = () => <span role="img" aria-label="Preço" style={{ marginRight: '6px' }}>💲</span>;
const IconChevronRight = () => <span role="img" aria-label="Ver mais" style={{ marginLeft: '5px' }}>❯</span>;
const IconSearch = () => <span role="img" aria-label="Pesquisar" style={styles.inputIcon}>🔍</span>;


// Componente para exibir cada card de empreendimento
function EmpreendimentoPublicCard({ empreendimento }) {
    const formatPrice = (value) => {
        if (value === null || value === undefined || isNaN(parseFloat(value))) return 'Consultar';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }

    // Lógica da imagem principal do card
    const imageUrl = (Array.isArray(empreendimento.imagens) && empreendimento.imagens.length > 0)
        ? empreendimento.imagens[0]
        : `https://via.placeholder.com/350x230/eee/888?text=${encodeURIComponent(empreendimento.nome || 'Empreendimento')}`;

    const fullImageUrl = imageUrl.startsWith('http')
        ? imageUrl
        : `${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}${imageUrl}`;

    const imageAltText = `Imagem principal do empreendimento ${empreendimento.nome || 'sem nome'}`;

    return (
        <div style={styles.card} tabIndex={0}>
            <Link to={`/empreendimentos/public/${empreendimento.id}`} style={styles.cardLinkWrapper}>
                <img
                    src={fullImageUrl}
                    alt={imageAltText}
                    style={styles.cardImage}
                    onError={(e) => {
                        const placeholder = `https://via.placeholder.com/350x230/eee/888?text=${encodeURIComponent(empreendimento.nome || 'Empreendimento')}`;
                        if (e.target.src !== placeholder) {
                            e.target.onerror = null;
                            e.target.src = placeholder;
                        }
                    }}
                />
                <div style={styles.cardBody}>
                    <h3 style={styles.cardTitle}>{empreendimento.nome}</h3>
                    <p style={styles.cardInfo}><IconPin />{empreendimento.endereco || 'Endereço não informado'}</p>
                    <p style={styles.cardInfo}><span role="img" aria-label="Construtora" style={{ marginRight: '6px' }}>🏢</span>{empreendimento.construtora?.nome_empresa || 'Construtora'}</p>
                    <p style={styles.cardInfo}><IconStatus />Status: <span style={getStatusStyle(empreendimento.status)}>{empreendimento.status || 'N/D'}</span></p>
                    <p style={styles.cardPrice}><IconPriceTag />{formatPrice(empreendimento.preco)}</p>
                </div>
            </Link>
            <div style={styles.cardFooter}>
                <Link to={`/empreendimentos/public/${empreendimento.id}`} style={styles.detailsButtonLink}>
                    <button style={styles.detailsButton}>Ver Detalhes <IconChevronRight /></button>
                </Link>
            </div>
        </div>
    );
}

// Componente principal da página inicial
function HomePage() {
    const [empreendimentos, setEmpreendimentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({ search: '', status: '', construtora: '' }); // Adicionado filtro de construtora
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 6;

    const fetchEmpreendimentos = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = {
                page: currentPage,
                limit: itemsPerPage,
                search: filters.search || undefined,
                status: filters.status || undefined,
                construtora: filters.construtora || undefined, // Passar filtro de construtora para a API
            };
            const response = await api.get('/empreendimentos', { params });
            setEmpreendimentos(response.data?.empreendimentos || []);
            setTotalPages(response.data?.totalPages || 1);
            setTotalItems(response.data?.totalItems || 0);
        } catch (err) {
            console.error("Erro ao buscar empreendimentos públicos:", err);
            setError("Não foi possível carregar os empreendimentos. Tente novamente mais tarde.");
            setEmpreendimentos([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage, filters]);

    useEffect(() => {
        const handler = setTimeout(() => {
             fetchEmpreendimentos();
        }, 500); // Debounce de 500ms
        return () => { clearTimeout(handler); };
    }, [fetchEmpreendimentos]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1); // Reseta para a primeira página ao filtrar
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
        }
    };
    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        }
    };

    return (
        <div style={styles.pageContainer}>
            <header style={styles.heroSection}>
                <h1 style={styles.heroTitle}>Encontre o Empreendimento dos Seus Sonhos</h1>
                <p style={styles.heroSubtitle}>Explore nossos lançamentos e encontre o imóvel perfeito para você.</p>

                <div style={styles.filterContainer}>
                    <div style={{...styles.filterGroup, flex: 2}}>
                        <label htmlFor="search" style={styles.filterLabel}>O que você procura?</label>
                        <div style={styles.inputWrapper}>
                            <IconSearch />
                            <input
                                type="text" id="search" name="search"
                                value={filters.search} onChange={handleFilterChange}
                                placeholder="Nome, endereço..."
                                style={styles.searchInput}
                            />
                        </div>
                    </div>
                    {/* --- NOVO FILTRO POR CONSTRUTORA --- */}
                     <div style={{...styles.filterGroup, flex: 2}}>
                        <label htmlFor="construtora" style={styles.filterLabel}>Por Construtora</label>
                        <div style={styles.inputWrapper}>
                            <IconBuilding />
                            <input
                                type="text" id="construtora" name="construtora"
                                value={filters.construtora} onChange={handleFilterChange}
                                placeholder="Nome da construtora..."
                                style={styles.searchInput}
                            />
                        </div>
                    </div>
                    {/* --- FIM NOVO FILTRO --- */}
                    <div style={{...styles.filterGroup, flex: 1}}>
                        <label htmlFor="status" style={styles.filterLabel}>Status do Imóvel</label>
                        <select
                            id="status" name="status"
                            value={filters.status} onChange={handleFilterChange}
                            style={styles.selectInput}
                        >
                            <option value="">Todos</option>
                            <option value="Em Lançamento">Em Lançamento</option>
                            <option value="Em Obras">Em Obras</option>
                            <option value="Entregue">Entregue</option>
                        </select>
                    </div>
                </div>
            </header>

            {loading && <div style={styles.centerMessage}>Carregando empreendimentos...</div>}
            {error && <div style={styles.errorBox}>Erro: {error}</div>}

            {!loading && !error && empreendimentos.length === 0 && (
                <div style={styles.centerMessage}>
                    <p>Nenhum empreendimento encontrado com os filtros selecionados.</p>
                    <p>Tente ajustar sua busca.</p>
                </div>
            )}

            {!loading && !error && empreendimentos.length > 0 && (
                <>
                    <div style={styles.grid}>
                        {empreendimentos.map((emp) => (
                            <EmpreendimentoPublicCard key={emp.id} empreendimento={emp} />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div style={styles.paginationContainer}>
                            <button onClick={handlePrevPage} disabled={currentPage <= 1} style={styles.paginationButton}>
                                ← Anterior
                            </button>
                            <span style={styles.paginationInfo}>
                                Página {currentPage} de {totalPages} ({totalItems} imóveis)
                            </span>
                            <button onClick={handleNextPage} disabled={currentPage >= totalPages} style={styles.paginationButton}>
                                Próxima →
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// Função para estilizar o status
const getStatusStyle = (status) => {
    let backgroundColor = '#e9ecef', color = '#495057', borderColor = '#dee2e6';
    switch (status?.toLowerCase()) {
        case 'em lançamento': backgroundColor = '#cff4fc'; color = '#055160'; borderColor = '#b6effb'; break;
        case 'em obras': backgroundColor = '#fff3cd'; color = '#664d03'; borderColor = '#ffecb5'; break;
        case 'entregue': backgroundColor = '#d1e7dd'; color = '#0f5132'; borderColor = '#badbcc'; break;
    }
    return { padding: '4px 8px', borderRadius: '15px', fontSize: '0.75rem', fontWeight: '600', display: 'inline-block', border: `1px solid ${borderColor}`, backgroundColor, color, textTransform: 'capitalize' };
};

// Objeto de Estilos
const styles = {
    pageContainer: { maxWidth: '1300px', margin: '0 auto', padding: '0px 20px 40px 20px', fontFamily: "'Roboto', sans-serif" },
    heroSection: { textAlign: 'center', padding: '60px 20px', marginBottom: '40px', backgroundColor: '#f8f9fa', borderRadius: '0 0 12px 12px' },
    heroTitle: { fontSize: '2.8em', fontWeight: 700, color: '#2c3e50', marginBottom: '15px' },
    heroSubtitle: { fontSize: '1.3em', color: '#555', marginBottom: '30px', lineHeight: 1.6 },
    filterContainer: { display: 'flex', gap: '20px', maxWidth: '900px', /* Aumentado */ margin: '0 auto', padding: '20px', backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', flexWrap: 'wrap' },
    filterGroup: { display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '200px', flex: 1 },
    filterLabel: { fontWeight: 500, color: '#34495e', fontSize: '0.9em', textAlign: 'left' },
    inputWrapper: { position: 'relative' },
    inputIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#aaa', fontSize: '1.1em' },
    searchInput: { width: '100%', padding: '12px 12px 12px 40px', borderRadius: '6px', border: '1px solid #bdc3c7', fontSize: '1em', boxSizing: 'border-box' },
    selectInput: { width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #bdc3c7', fontSize: '1em', backgroundColor: '#fff', height: '46px' },
    centerMessage: { textAlign: 'center', padding: '60px 20px', fontSize: '1.2em', color: '#7f8c8d' },
    errorBox: { color: '#c0392b', backgroundColor: '#fdedec', border: '1px solid #e74c3c', padding: '20px', borderRadius: '8px', marginBottom: '30px', textAlign: 'center', fontSize: '1.1em' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' },
    card: { border: '1px solid #e9ecef', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 5px 15px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', backgroundColor: '#fff', transition: 'transform 0.3s ease, box-shadow 0.3s ease', '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' } },
    cardLinkWrapper: { textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', flexGrow: 1 },
    cardImage: { width: '100%', height: '200px', objectFit: 'cover' },
    cardBody: { padding: '18px', flexGrow: 1, display: 'flex', flexDirection: 'column' },
    cardTitle: { marginTop: 0, marginBottom: '10px', fontSize: '1.4em', fontWeight: 600, color: '#34495e', lineHeight: 1.3 },
    cardInfo: { fontSize: '0.9em', color: '#555', margin: '5px 0', display: 'flex', alignItems: 'center', lineHeight: 1.5 },
    cardPrice: { fontSize: '1.3em', fontWeight: 'bold', color: '#27ae60', margin: '12px 0 15px 0', display: 'flex', alignItems: 'center' },
    cardFooter: { padding: '15px 18px', borderTop: '1px solid #f0f0f0', backgroundColor: '#fdfdfd' },
    detailsButtonLink: { textDecoration: 'none', display: 'block' },
    detailsButton: { backgroundColor: '#3498db', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '6px', cursor: 'pointer', width: '100%', fontWeight: '600', fontSize: '1em', textAlign: 'center', transition: 'background-color 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', '&:hover': { backgroundColor: '#2980b9' } },
    paginationContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '40px', marginBottom: '20px' },
    paginationButton: { padding: '10px 18px', border: '1px solid #bdc3c7', backgroundColor: 'white', color: '#34495e', cursor: 'pointer', borderRadius: '6px', fontWeight: 500, transition: 'background-color 0.2s ease, color 0.2s ease', '&:hover:not(:disabled)': { backgroundColor: '#ecf0f1', borderColor: '#95a5a6' }, '&:disabled': { backgroundColor: '#f8f9fa', color: '#adb5bd', cursor: 'not-allowed', borderColor: '#e9ecef' } },
    paginationInfo: { margin: '0 10px', fontSize: '0.95em', color: '#7f8c8d' }
};

export default HomePage;