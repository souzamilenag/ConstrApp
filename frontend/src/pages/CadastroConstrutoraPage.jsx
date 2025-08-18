import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; 
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const IconBuilding = () => <span style={styles.icon}>🏢</span>;
const IconCNPJ = () => <span style={styles.icon}>#️⃣</span>; 
const IconEmail = () => <span style={styles.icon}>✉️</span>;
const IconPhone = () => <span style={styles.icon}>📞</span>;
const IconAddress = () => <span role="img" aria-label="Endereço" style={styles.icon}>📍</span>;
const IconSave = () => <span role="img" aria-label="Salvar" style={{ marginRight: '6px' }}>💾</span>;


function CompletarCadastroConstrutoraPage() {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [formData, setFormData] = useState({
        nome_empresa: '',
        cnpj: '',
        email: user?.email || '', 
        telefone: '',
        endereco: ''
    });
    const [submitting, setSubmitting] = useState(false); 
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(''); 
    const [pageLoading, setPageLoading] = useState(true); 

    useEffect(() => {
        if (authLoading) return;
        if (!user || user.tipo_usuario !== 'construtora') {
            console.log("CompletarCadastro: Usuário não é construtora ou não está logado. Redirecionando...");
            navigate('/', { replace: true }); 
            return;
        }

        setPageLoading(true);
        api.get('/construtoras/meu-perfil')
            .then(() => {
                console.log("CompletarCadastro: Perfil já existe. Redirecionando para empreendimentos...");
                navigate('/empreendimentos', { replace: true });
            })
            .catch(err => {
                if (err.response && err.response.status === 404) {
                    console.log("CompletarCadastro: Perfil não encontrado. Exibindo formulário.");
                    setFormData(prev => ({ ...prev, email: prev.email || user.email || '' }));
                } else {
                    console.error("CompletarCadastro: Erro ao verificar perfil:", err);
                    setError("Ocorreu um erro ao verificar seu perfil. Por favor, tente recarregar a página.");
                }
            })
            .finally(() => {
                setPageLoading(false);
            });
    }, [user, authLoading, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);

        const cnpjLimpo = formData.cnpj.replace(/[^\d]/g, '');
        if (cnpjLimpo.length !== 14) {
            setError("CNPJ inválido. Deve conter exatamente 14 dígitos.");
            setSubmitting(false);
            return;
        }
        if (!formData.nome_empresa.trim() || !formData.email.trim()) {
            setError("Nome da empresa e Email de contato são obrigatórios.");
            setSubmitting(false);
            return;
        }

        const dataToSend = {
            nome_empresa: formData.nome_empresa.trim(),
            cnpj: cnpjLimpo,
            email: formData.email.trim(),
            telefone: formData.telefone.trim() || null,
            endereco: formData.endereco.trim() || null
        };

        console.log("Enviando dados para completar perfil:", dataToSend);

        try {
            await api.post('/construtoras/completar-perfil', dataToSend);
            setSuccess("Dados da construtora salvos com sucesso! Redirecionando...");
            setTimeout(() => {
                navigate('/empreendimentos', { replace: true });
            }, 2000);

        } catch (err) {
        } finally {
            setSubmitting(false);
        }
    };

    if (authLoading || pageLoading) {
        return <div style={styles.centerMessage}>Verificando informações...</div>;
    }

    if (error && pageLoading === false && formData.nome_empresa === '') { 
        return <div style={{ ...styles.errorBox, textAlign: 'center' }}>Erro: {error} <br /> <Link to="/" style={styles.backLinkError}>Voltar para Home</Link></div>;
    }


    return (
        <div style={styles.pageContainer}>
            <div style={styles.formCard}>
                <h1 style={styles.title}>Complete o Perfil da Sua Construtora</h1>
                <p style={styles.subtitle}>Olá, {user?.nome}! Precisamos de alguns dados da sua empresa para ativar todas as funcionalidades.</p>

                {success && <p style={styles.successMessage}>{success}</p>}
                {error && <p style={styles.errorMessage}>{error}</p>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.formGroup}>
                        <label htmlFor="nome_empresa" style={styles.label}><IconBuilding />Nome da Empresa*</label>
                        <input type="text" id="nome_empresa" name="nome_empresa" value={formData.nome_empresa} onChange={handleChange} required style={styles.input} placeholder="Razão Social ou Nome Fantasia" disabled={submitting} />
                    </div>
                    <div style={styles.formGroup}>
                        <label htmlFor="cnpj" style={styles.label}><IconCNPJ />CNPJ*</label>
                        <input type="text" id="cnpj" name="cnpj" value={formData.cnpj} onChange={handleChange} required placeholder="00.000.000/0001-00" style={styles.input} disabled={submitting} />
                    </div>
                    <div style={styles.formGroup}>
                        <label htmlFor="email" style={styles.label}><IconEmail />Email de Contato da Empresa*</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required placeholder="contato@suaempresa.com" style={styles.input} disabled={submitting} />
                    </div>
                    <div style={styles.formGroup}>
                        <label htmlFor="telefone" style={styles.label}><IconPhone />Telefone de Contato</label>
                        <input type="tel" id="telefone" name="telefone" value={formData.telefone} onChange={handleChange} placeholder="(XX) XXXXX-XXXX ou (XX) XXXX-XXXX" style={styles.input} disabled={submitting} />
                    </div>
                    <div style={styles.formGroup}>
                        <label htmlFor="endereco" style={styles.label}><IconAddress />Endereço Completo da Sede</label>
                        <textarea id="endereco" name="endereco" value={formData.endereco} onChange={handleChange} rows="3" style={styles.textarea} placeholder="Rua, Número, Complemento, Bairro, Cidade - UF, CEP" disabled={submitting} />
                    </div>

                    <div style={styles.buttonGroup}>
                        <button type="button" onClick={() => navigate('/')} disabled={submitting} style={{ ...styles.button, ...styles.buttonCancel }}>
                            Cancelar
                        </button>
                        <button type="submit" disabled={submitting || pageLoading} style={{ ...styles.button, ...styles.buttonSubmit }}>
                            <IconSave /> {submitting ? 'Salvando...' : 'Salvar e Continuar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const styles = {
    pageContainer: { maxWidth: '700px', margin: '40px auto', padding: '0 20px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" },
    formCard: { backgroundColor: '#ffffff', padding: '35px 40px', borderRadius: '12px', boxShadow: '0 8px 25px rgba(0,0,0,0.1)' },
    title: { fontSize: '2em', color: '#2c3e50', marginBottom: '10px', fontWeight: 600, textAlign: 'center' },
    subtitle: { fontSize: '1em', color: '#7f8c8d', marginBottom: '30px', textAlign: 'center', lineHeight: 1.5 },
    form: { display: 'flex', flexDirection: 'column', gap: '18px' },
    formGroup: { display: 'flex', flexDirection: 'column' },
    label: { marginBottom: '8px', fontSize: '0.95em', color: '#34495e', fontWeight: 500, display: 'flex', alignItems: 'center' },
    input: { width: '100%', padding: '12px 15px', borderRadius: '6px', border: '1px solid #bdc3c7', fontSize: '1em', boxSizing: 'border-box', transition: 'border-color 0.2s ease, box-shadow 0.2s ease', '&:focus': { borderColor: '#3498db', boxShadow: '0 0 0 3px rgba(52, 152, 219, 0.2)', outline: 'none' } },
    textarea: { width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #bdc3c7', fontSize: '1em', boxSizing: 'border-box', fontFamily: 'inherit', minHeight: '80px', transition: 'border-color 0.2s ease, box-shadow 0.2s ease', '&:focus': { borderColor: '#3498db', boxShadow: '0 0 0 3px rgba(52, 152, 219, 0.2)', outline: 'none' } },
    errorMessage: { color: '#e74c3c', backgroundColor: '#fdeded', border: '1px solid #f5b7b1', padding: '12px', borderRadius: '6px', textAlign: 'center', fontSize: '0.9em', marginBottom: '18px' },
    successMessage: { color: '#155724', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', padding: '12px', borderRadius: '6px', textAlign: 'center', fontSize: '0.9em', marginBottom: '18px' },
    buttonGroup: { display: 'flex', justifyContent: 'flex-end', marginTop: '25px', borderTop: '1px solid #eee', paddingTop: '20px' },
    button: { padding: '12px 25px', fontSize: '1.05em', cursor: 'pointer', borderRadius: '6px', border: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'background-color 0.2s ease' },
    buttonSubmit: { backgroundColor: '#28a745', color: 'white', '&:hover:not(:disabled)': { backgroundColor: '#218838' }, '&:disabled': { backgroundColor: '#a3d9b6', cursor: 'not-allowed' } },
    buttonCancel: { backgroundColor: '#6c757d', color: 'white', '&:hover:not(:disabled)': { backgroundColor: '#5a6268' }, '&:disabled': { backgroundColor: '#b0b4b8', cursor: 'not-allowed' } },
    centerMessage: { textAlign: 'center', padding: '50px 20px', fontSize: '1.2em', color: '#6c757d' },
    icon: { fontSize: '1.1em', marginRight: '8px', color: '#555' },
    backLinkError: { color: '#0056b3', textDecoration: 'underline', marginTop: '10px', display: 'inline-block' },
};

export default CompletarCadastroConstrutoraPage;