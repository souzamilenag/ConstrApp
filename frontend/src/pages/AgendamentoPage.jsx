import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const IconCalendarTime = () => <span role="img" aria-label="Data e Hora" style={styles.icon}>🗓️</span>;
const IconBuilding = () => <span role="img" aria-label="Empreendimento" style={styles.icon}>🏢</span>;
const IconUser = () => <span role="img" aria-label="Solicitante" style={styles.icon}>👤</span>;
const IconStand = () => <span role="img" aria-label="Stand" style={styles.icon}>🏠</span>; // Ícone para stand
const IconUnit = () => <span role="img" aria-label="Unidade" style={styles.icon}>🔑</span>; // Ícone para unidade
const IconNotes = () => <span role="img" aria-label="Observações" style={styles.icon}>📝</span>;
const IconSend = () => <span role="img" aria-label="Enviar" style={{ marginRight: '6px' }}>✔️</span>;
const IconBack = () => <span role="img" aria-label="Voltar" style={{ marginRight: '6px' }}>⬅️</span>;

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

function AgendamentoPage() {
    const navigate = useNavigate();
    const query = useQuery();
    const { user } = useAuth();

    const empreendimentoId = query.get('empreendimentoId');
    const [empreendimentoNome, setEmpreendimentoNome] = useState('Carregando...');
    const [loadingPage, setLoadingPage] = useState(true); 

    const [formData, setFormData] = useState({
        data_visita: '',
        visitar_stand: true,
        numero_apartamento: '',
        observacoes: ''
    });
    const [submitting, setSubmitting] = useState(false); 
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const getMinDateTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        now.setHours(now.getHours() + 1);
        return now.toISOString().slice(0, 16);
    };


    useEffect(() => {
        if (empreendimentoId) {
            setLoadingPage(true);
            api.get(`/empreendimentos/public/${empreendimentoId}`)
                .then(response => {
                    setEmpreendimentoNome(response.data?.nome || `ID ${empreendimentoId}`);
                    setError('');
                })
                .catch(err => {
                    console.error("Erro ao buscar nome do empreendimento:", err);
                    setError("Empreendimento não encontrado ou inválido.");
                    setEmpreendimentoNome('');
                })
                .finally(() => {
                    setLoadingPage(false);
                });
        } else {
            setError("ID do Empreendimento não fornecido na URL.");
            setLoadingPage(false);
        }
    }, [empreendimentoId]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (name === 'visitar_stand' && checked) {
            setFormData(prev => ({ ...prev, numero_apartamento: '' }));
        }
        setError(''); 
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true); 
        setError('');
        setSuccess('');

        if (!formData.data_visita) {
            setError("Por favor, selecione data e hora para a visita.");
            setSubmitting(false);
            return;
        }
        if (new Date(formData.data_visita) < new Date(getMinDateTime())) {
             setError("A data da visita deve ser futura.");
             setSubmitting(false);
             return;
        }
        if (!formData.visitar_stand && !formData.numero_apartamento.trim()) {
            setError('Número do apartamento é obrigatório se não for visita ao stand.');
            setSubmitting(false);
            return;
        }

        const dataToSend = {
            empreendimentoId: Number(empreendimentoId),
            data_visita: formData.data_visita,
            visitar_stand: formData.visitar_stand,
            numero_apartamento: formData.visitar_stand ? null : formData.numero_apartamento.trim(),
            observacoes: formData.observacoes.trim() || null
        };

        console.log("Enviando solicitação de agendamento:", dataToSend);

        try {
            await api.post('/agendamentos', dataToSend);
            setSuccess(`Agendamento para ${empreendimentoNome} solicitado com sucesso! Nossa equipe entrará em contato em breve para confirmar os detalhes.`);
            setFormData({ data_visita: '', visitar_stand: true, numero_apartamento: '', observacoes: ''}); // Limpa formulário
        } catch (err) {
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingPage) {
        return <div style={styles.centerMessage}>Carregando informações...</div>;
    }

    if (error && !empreendimentoNome) {
        return <div style={{ ...styles.errorBox, textAlign: 'center' }}>
                    Erro: {error} <br/>
                    <Link to="/" style={styles.backLinkError}>Voltar para Empreendimentos</Link>
               </div>;
    }

    return (
        <div style={styles.pageContainer}>
             <Link to={`/empreendimentos/public/${empreendimentoId}`} style={styles.backLink}>
                <IconBack /> Voltar para Detalhes do Empreendimento
            </Link>
            <div style={styles.formCard}>
                <h1 style={styles.title}>Solicitar Agendamento de Visita</h1>

                <div style={styles.summaryBox}>
                    <p><IconBuilding /><strong>Empreendimento:</strong> {empreendimentoNome}</p>
                    <p><IconUser /><strong>Solicitante:</strong> {user?.nome} ({user?.email})</p>
                </div>

                {success && <p style={styles.successMessage}>{success}</p>}
                {error && <p style={styles.errorMessage}>{error}</p>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.formGroup}>
                        <label htmlFor="data_visita" style={styles.label}><IconCalendarTime />Data e Hora da Visita*</label>
                        <input
                            type="datetime-local"
                            id="data_visita"
                            name="data_visita"
                            value={formData.data_visita}
                            onChange={handleChange}
                            required
                            min={getMinDateTime()}
                            style={styles.input}
                            disabled={submitting}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>O que você gostaria de visitar?</label>
                        <div style={styles.radioGroup}>
                            <label style={styles.radioLabel}>
                                <input
                                    type="radio"
                                    name="visitar_stand"
                                    checked={formData.visitar_stand === true}
                                    onChange={() => setFormData(prev => ({...prev, visitar_stand: true, numero_apartamento: ''}))}
                                    style={styles.radioInput}
                                    disabled={submitting}
                                />
                                <IconStand /><span style={styles.radioText}>Stand de Vendas</span>
                            </label>
                            <label style={styles.radioLabel}>
                                <input
                                    type="radio"
                                    name="visitar_stand"
                                    checked={formData.visitar_stand === false}
                                    onChange={() => setFormData(prev => ({...prev, visitar_stand: false}))}
                                    style={styles.radioInput}
                                    disabled={submitting}
                                />
                                <IconUnit /><span style={styles.radioText}>Unidade Específica</span>
                            </label>
                        </div>
                    </div>

                    {!formData.visitar_stand && (
                        <div style={styles.formGroup}>
                            <label htmlFor="numero_apartamento" style={styles.label}>Número do Apartamento/Unidade*</label>
                            <input
                                type="text"
                                id="numero_apartamento"
                                name="numero_apartamento"
                                value={formData.numero_apartamento}
                                onChange={handleChange}
                                required={!formData.visitar_stand}
                                maxLength={20}
                                style={styles.input}
                                placeholder="Ex: 101A, T2-503"
                                disabled={submitting}
                            />
                        </div>
                    )}

                    <div style={styles.formGroup}>
                        <label htmlFor="observacoes" style={styles.label}><IconNotes />Observações (opcional)</label>
                        <textarea
                            id="observacoes"
                            name="observacoes"
                            value={formData.observacoes}
                            onChange={handleChange}
                            rows={4}
                            style={styles.textarea}
                            placeholder="Alguma preferência, dúvida ou informação adicional?"
                            disabled={submitting}
                        />
                    </div>

                    <div style={styles.buttonGroup}>
                        <button type="submit" disabled={submitting} style={{...styles.button, ...styles.buttonSubmit}}>
                           <IconSend /> {submitting ? 'Solicitando...' : 'Enviar Solicitação'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const styles = {
    pageContainer: { maxWidth: '700px', margin: '30px auto', padding: '0 20px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" },
    formCard: { backgroundColor: '#ffffff', padding: '30px 35px', borderRadius: '12px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', marginTop: '20px' },
    title: { fontSize: '1.8em', color: '#2c3e50', marginBottom: '25px', fontWeight: 600, textAlign: 'center' },
    backLink: { display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#3498db', textDecoration: 'none', marginBottom: '0px', fontSize: '0.95em', fontWeight: 500, '&:hover': { textDecoration: 'underline' } },
    summaryBox: { padding: '15px', marginBottom: '25px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee', p: { margin: '6px 0', fontSize: '1em', display: 'flex', alignItems: 'center' }, strong: { color: '#34495e' } },
    errorMessage: { color: '#e74c3c', backgroundColor: '#fdeded', border: '1px solid #f5b7b1', padding: '12px', borderRadius: '6px', textAlign: 'center', fontSize: '0.9em', marginBottom: '20px' },
    successMessage: { color: '#155724', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', padding: '12px', borderRadius: '6px', textAlign: 'center', fontSize: '0.9em', marginBottom: '20px' },
    form: { display: 'flex', flexDirection: 'column', gap: '18px' },
    formGroup: { display: 'flex', flexDirection: 'column' },
    label: { marginBottom: '6px', fontSize: '0.95em', color: '#34495e', fontWeight: 500, display: 'flex', alignItems: 'center' },
    input: { width: '100%', padding: '12px 15px', borderRadius: '6px', border: '1px solid #bdc3c7', fontSize: '1em', boxSizing: 'border-box', transition: 'border-color 0.2s ease, box-shadow 0.2s ease', '&:focus': { borderColor: '#3498db', boxShadow: '0 0 0 3px rgba(52, 152, 219, 0.2)', outline: 'none' } },
    textarea: { width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #bdc3c7', fontSize: '1em', boxSizing: 'border-box', fontFamily: 'inherit', minHeight: '100px', transition: 'border-color 0.2s ease, box-shadow 0.2s ease', '&:focus': { borderColor: '#3498db', boxShadow: '0 0 0 3px rgba(52, 152, 219, 0.2)', outline: 'none' } },
    radioGroup: { display: 'flex', gap: '20px', marginTop: '5px', marginBottom: '5px' },
    radioLabel: { display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '1em', color: '#34495e' },
    radioInput: { marginRight: '8px', cursor: 'pointer', width: '17px', height: '17px', accentColor: '#3498db' /* Cor do radio selecionado */ },
    radioText: { marginLeft: '2px' },
    buttonGroup: { display: 'flex', justifyContent: 'flex-end', marginTop: '25px', borderTop: '1px solid #eee', paddingTop: '20px' },
    button: { padding: '12px 25px', fontSize: '1.05em', cursor: 'pointer', borderRadius: '6px', border: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'background-color 0.2s ease' },
    buttonSubmit: { backgroundColor: '#28a745', color: 'white', '&:hover:not(:disabled)': { backgroundColor: '#218838' }, '&:disabled': { backgroundColor: '#a3d9b6', cursor: 'not-allowed' } },
    centerMessage: { textAlign: 'center', padding: '40px 20px', fontSize: '1.1em', color: '#6c757d' },
    backLinkError: { color: '#0056b3', textDecoration: 'underline', marginTop: '10px', display: 'inline-block' },
    icon: { fontSize: '1em', marginRight: '8px' }
};

export default AgendamentoPage;