import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom'; 
import api from '../services/api';

const IconSave = () => <span role="img" aria-label="Salvar" style={{ marginRight: '5px' }}>💾</span>;
const IconCancel = () => <span role="img" aria-label="Cancelar" style={{ marginRight: '5px' }}>↩️</span>;
const IconBack = () => <span role="img" aria-label="Voltar" style={{ marginRight: '5px' }}>⬅️</span>;


function UnidadeFormPage() {
    const navigate = useNavigate();
    const { empreendimentoId: empreendimentoIdFromUrl, id: unidadeId } = useParams();
    const isEditMode = Boolean(unidadeId);

    const [formData, setFormData] = useState({
        numero: '',
        andar: '',
        bloco: '',
        status: 'Disponível',
        preco: '',
        area: '',
        quartos: 1,
        banheiros: 1,
        vagas: 0,
        observacoes: '',
        planta_unidade_url: '',
        empreendimento_id_original: null 
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [pageTitle, setPageTitle] = useState('Nova Unidade');
    const [empreendimentoNome, setEmpreendimentoNome] = useState('');

    const fetchEmpreendimentoNome = useCallback(async (id) => {
        if(!id) return;
        try {
            const response = await api.get(`/empreendimentos/${id}`); 
            setEmpreendimentoNome(response.data?.nome || `Empreendimento ID ${id}`);
        } catch (err) {
            console.warn("Não foi possível buscar nome do empreendimento:", err);
            setEmpreendimentoNome(`Empreendimento ID ${id}`);
        }
    }, []);

    useEffect(() => {
        const idParaBuscarEmpreendimento = isEditMode ? formData.empreendimento_id_original : empreendimentoIdFromUrl;
        if (idParaBuscarEmpreendimento) {
            fetchEmpreendimentoNome(idParaBuscarEmpreendimento);
        }

        if (isEditMode && unidadeId) {
            setPageTitle(`Editar Unidade #${unidadeId}`);
            setLoading(true);
            api.get(`/unidades/${unidadeId}`) 
                .then(response => {
                    const data = response.data;
                    setFormData({
                        numero: data.numero || '',
                        andar: data.andar === null ? '' : data.andar,
                        bloco: data.bloco || '',
                        status: data.status || 'Disponível',
                        preco: data.preco || '',
                        area: data.area || '',
                        quartos: data.quartos === null ? '' : data.quartos,
                        banheiros: data.banheiros === null ? '' : data.banheiros,
                        vagas: data.vagas === null ? '' : data.vagas,
                        observacoes: data.observacoes || '',
                        planta_unidade_url: data.planta_unidade_url || '',
                        empreendimento_id_original: data.empreendimento_id
                    });
                     if (!empreendimentoNome && data.empreendimento_id) {
                        fetchEmpreendimentoNome(data.empreendimento_id);
                    }
                })
                .catch(err => {
                    console.error("Erro ao buscar dados da unidade para edição:", err);
                    setError("Falha ao carregar dados da unidade.");
                })
                .finally(() => setLoading(false));
        } else if (empreendimentoIdFromUrl) {
            setPageTitle(`Nova Unidade`);
            setFormData(prev => ({
                ...{ numero: '', andar: '', bloco: '', status: 'Disponível', preco: '', area: '', quartos: 1, banheiros: 1, vagas: 0, observacoes: '', planta_unidade_url: ''},
                empreendimento_id_original: prev.empreendimento_id_original || empreendimentoIdFromUrl
            }));
        } else if (!isEditMode && !empreendimentoIdFromUrl) {
            setError("ID do empreendimento não fornecido para criar nova unidade.");
            setPageTitle("Erro");
        }
    }, [unidadeId, isEditMode, empreendimentoIdFromUrl, fetchEmpreendimentoNome]);


    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
        }));
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        const dataToSend = {
            numero: formData.numero.trim(),
            bloco: formData.bloco.trim() || null,
            status: formData.status,
            preco: formData.preco !== '' ? parseFloat(formData.preco) : null,
            andar: formData.andar !== '' ? Number(formData.andar) : null,
            area: formData.area !== '' ? parseFloat(formData.area) : null,
            quartos: formData.quartos !== '' ? Number(formData.quartos) : null,
            banheiros: formData.banheiros !== '' ? Number(formData.banheiros) : null,
            vagas: formData.vagas !== '' ? Number(formData.vagas) : null,
            observacoes: formData.observacoes.trim() || null,
            planta_unidade_url: formData.planta_unidade_url.trim() || null,
        };
        if (!dataToSend.numero || dataToSend.preco === null) {
             setError("Número da unidade e Preço são obrigatórios.");
             setLoading(false);
             return;
        }

        console.log("Enviando dados da unidade:", dataToSend);

        try {
            let targetEmpreendimentoId = isEditMode ? formData.empreendimento_id_original : empreendimentoIdFromUrl;

            if (isEditMode) {
                await api.put(`/unidades/${unidadeId}`, dataToSend);
                setSuccess("Unidade atualizada com sucesso!");
            } else {
                await api.post(`/empreendimentos/${empreendimentoIdFromUrl}/unidades`, dataToSend);
                setSuccess("Unidade criada com sucesso!");
            }
            setTimeout(() => {
                 navigate(`/empreendimentos/${targetEmpreendimentoId}/unidades`, { replace: true });
            }, 1500);

        } catch (err) {
            console.error(`Erro ao ${isEditMode ? 'atualizar' : 'criar'} unidade:`, err);
            let errorMsg = `Falha ao ${isEditMode ? 'atualizar' : 'criar'} a unidade.`;
            if (err.response?.data?.message) {
                errorMsg = err.response.data.errors
                    ? `${err.response.data.message} Detalhes: ${err.response.data.errors.join(', ')}`
                    : err.response.data.message;
            } else if (err.request) {
                 errorMsg = "Não foi possível conectar ao servidor.";
            }
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const backToEmpreendimentoId = isEditMode ? formData.empreendimento_id_original : empreendimentoIdFromUrl;

    if (loading && isEditMode) {
        return <div style={styles.centerMessage}>Carregando dados da unidade...</div>;
    }
    if (error && !formData.numero && !isEditMode && !empreendimentoIdFromUrl) { 
         return <div style={{...styles.errorBox, textAlign: 'center'}}>Erro: {error}</div>;
    }


    return (
        <div style={styles.pageContainer}>
            <Link to={`/empreendimentos/${backToEmpreendimentoId}/unidades`} style={styles.backLink}>
                <IconBack /> Voltar para Unidades de {empreendimentoNome || 'Empreendimento'}
            </Link>

            <div style={styles.formCard}>
                <h1 style={styles.title}>{pageTitle}</h1>
                {empreendimentoNome && !isEditMode && <p style={styles.subtitle}>Para o empreendimento: <strong>{empreendimentoNome}</strong></p>}


                {success && <p style={styles.successMessage}>{success}</p>}
                {error && <p style={styles.errorMessage}>{error}</p>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.formRow}> 
                        <div style={{...styles.formGroup, flex: 1}}>
                            <label htmlFor="numero" style={styles.label}>Número da Unidade:*</label>
                            <input type="text" id="numero" name="numero" value={formData.numero} onChange={handleChange} required maxLength={20} style={styles.input} placeholder="Ex: 101, A-203" disabled={loading} />
                        </div>
                        <div style={{...styles.formGroup, flex: 1}}>
                            <label htmlFor="bloco" style={styles.label}>Bloco/Torre:</label>
                            <input type="text" id="bloco" name="bloco" value={formData.bloco} onChange={handleChange} maxLength={50} style={styles.input} placeholder="Ex: A, Sol, Único" disabled={loading} />
                        </div>
                        <div style={{...styles.formGroup, flex: 1}}>
                            <label htmlFor="andar" style={styles.label}>Andar:</label>
                            <input type="number" id="andar" name="andar" value={formData.andar} onChange={handleChange} style={styles.input} placeholder="Ex: 1, 10" disabled={loading} />
                        </div>
                    </div>

                    <div style={styles.formRow}>
                        <div style={{...styles.formGroup, flex: 2}}> 
                            <label htmlFor="preco" style={styles.label}>Preço (R$):*</label>
                            <input type="number" id="preco" name="preco" value={formData.preco} onChange={handleChange} required step="0.01" min="0" style={styles.input} placeholder="Ex: 550000.00" disabled={loading}/>
                        </div>
                        <div style={{...styles.formGroup, flex: 1}}>
                            <label htmlFor="area" style={styles.label}>Área (m²):</label>
                            <input type="number" id="area" name="area" value={formData.area} onChange={handleChange} step="0.01" min="0" style={styles.input} placeholder="Ex: 75.50" disabled={loading}/>
                        </div>
                    </div>
                    
                    <div style={styles.formGroup}>
                        <label htmlFor="status" style={styles.label}>Status da Unidade:*</label>
                        <select id="status" name="status" value={formData.status} onChange={handleChange} required style={styles.select} disabled={loading}>
                            <option value="Disponível">Disponível</option>
                            <option value="Reservado">Reservado</option>
                            <option value="Vendido">Vendido</option>
                            <option value="Indisponível">Indisponível</option>
                        </select>
                    </div>

                    <h3 style={styles.sectionTitle}>Características</h3>
                    <div style={styles.formRow}>
                        <div style={{...styles.formGroup, flex: 1}}>
                            <label htmlFor="quartos" style={styles.label}>Quartos:</label>
                            <input type="number" id="quartos" name="quartos" value={formData.quartos} onChange={handleChange} min="0" style={styles.input} placeholder="Ex: 2" disabled={loading}/>
                        </div>
                        <div style={{...styles.formGroup, flex: 1}}>
                            <label htmlFor="banheiros" style={styles.label}>Banheiros:</label>
                            <input type="number" id="banheiros" name="banheiros" value={formData.banheiros} onChange={handleChange} min="0" style={styles.input} placeholder="Ex: 1" disabled={loading}/>
                        </div>
                        <div style={{...styles.formGroup, flex: 1}}>
                            <label htmlFor="vagas" style={styles.label}>Vagas de Garagem:</label>
                            <input type="number" id="vagas" name="vagas" value={formData.vagas} onChange={handleChange} min="0" style={styles.input} placeholder="Ex: 1" disabled={loading}/>
                        </div>
                    </div>

                    <h3 style={styles.sectionTitle}>Outras Informações</h3>
                    <div style={styles.formGroup}>
                        <label htmlFor="planta_unidade_url" style={styles.label}>URL da Planta (opcional):</label>
                        <input type="url" id="planta_unidade_url" name="planta_unidade_url" value={formData.planta_unidade_url} onChange={handleChange} maxLength={512} style={styles.input} placeholder="https://..." disabled={loading}/>
                    </div>
                    <div style={styles.formGroup}>
                        <label htmlFor="observacoes" style={styles.label}>Observações (opcional):</label>
                        <textarea id="observacoes" name="observacoes" value={formData.observacoes} onChange={handleChange} rows={4} style={styles.textarea} disabled={loading}/>
                    </div>

                    <div style={styles.buttonGroup}>
                        <button
                            type="button"
                            onClick={() => navigate(`/empreendimentos/${backToEmpreendimentoId}/unidades`)}
                            disabled={loading}
                            style={{...styles.button, ...styles.buttonCancel}}
                        >
                            <IconCancel/> Cancelar
                        </button>
                        <button type="submit" disabled={loading} style={{...styles.button, ...styles.buttonSubmit}}>
                            <IconSave/> {loading ? (isEditMode ? 'Salvando...' : 'Adicionando...') : (isEditMode ? 'Salvar Alterações' : 'Adicionar Unidade')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const styles = {
    pageContainer: { maxWidth: '800px', margin: '30px auto', padding: '0 20px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" },
    formCard: { backgroundColor: '#ffffff', padding: '30px 35px', borderRadius: '12px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' },
    title: { fontSize: '1.8em', color: '#2c3e50', marginBottom: '10px', fontWeight: 600, textAlign: 'center' },
    subtitle: { fontSize: '0.95em', color: '#7f8c8d', marginBottom: '25px', textAlign: 'center', marginTop: '-5px' },
    sectionTitle: { fontSize: '1.2em', color: '#34495e', marginTop: '25px', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '8px' },
    backLink: { display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#3498db', textDecoration: 'none', marginBottom: '20px', fontSize: '0.95em', fontWeight: 500, '&:hover': { textDecoration: 'underline' } },
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    formRow: { display: 'flex', gap: '15px', flexWrap: 'wrap' },
    formGroup: { display: 'flex', flexDirection: 'column', marginBottom: '5px'  },
    label: { marginBottom: '6px', fontSize: '0.9em', color: '#34495e', fontWeight: 500 },
    input: { width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #bdc3c7', fontSize: '1em', boxSizing: 'border-box', transition: 'border-color 0.2s ease, box-shadow 0.2s ease', '&:focus': { borderColor: '#3498db', boxShadow: '0 0 0 3px rgba(52, 152, 219, 0.2)', outline: 'none' } },
    select: { width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #bdc3c7', fontSize: '1em', boxSizing: 'border-box', backgroundColor: 'white', transition: 'border-color 0.2s ease, box-shadow 0.2s ease', '&:focus': { borderColor: '#3498db', boxShadow: '0 0 0 3px rgba(52, 152, 219, 0.2)', outline: 'none' } },
    textarea: { width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #bdc3c7', fontSize: '1em', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.2s ease, box-shadow 0.2s ease', '&:focus': { borderColor: '#3498db', boxShadow: '0 0 0 3px rgba(52, 152, 219, 0.2)', outline: 'none' } },
    errorMessage: { color: '#e74c3c', backgroundColor: '#fdeded', border: '1px solid #f5b7b1', padding: '12px', borderRadius: '6px', textAlign: 'center', fontSize: '0.9em', marginBottom: '15px' },
    successMessage: { color: '#155724', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', padding: '12px', borderRadius: '6px', textAlign: 'center', fontSize: '0.9em', marginBottom: '15px' },
    buttonGroup: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '25px' },
    button: { padding: '10px 20px', fontSize: '1em', cursor: 'pointer', borderRadius: '6px', border: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'background-color 0.2s ease' },
    buttonSubmit: { backgroundColor: '#28a745', color: 'white', '&:hover:not(:disabled)': { backgroundColor: '#218838' }, '&:disabled': { backgroundColor: '#a3d9b6', cursor: 'not-allowed' } },
    buttonCancel: { backgroundColor: '#6c757d', color: 'white', '&:hover:not(:disabled)': { backgroundColor: '#5a6268' }, '&:disabled': { backgroundColor: '#b0b4b8', cursor: 'not-allowed' } },
    centerMessage: { textAlign: 'center', padding: '40px 20px', fontSize: '1.1em', color: '#6c757d' },
    icon: { fontSize: '1em' }
};

export default UnidadeFormPage;