import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom'; // Importar Link se precisar de botões de navegação
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const IconUser = () => <span role="img" aria-label="Usuário" style={styles.icon}>👤</span>;
const IconEmail = () => <span role="img" aria-label="Email" style={styles.icon}>✉️</span>;
const IconBuilding = () => <span role="img" aria-label="Empresa" style={styles.icon}>🏢</span>;
const IconCNPJ = () => <span role="img" aria-label="CNPJ" style={styles.icon}>#️⃣</span>;
const IconPhone = () => <span role="img" aria-label="Telefone" style={styles.icon}>📞</span>;
const IconAddress = () => <span role="img" aria-label="Endereço" style={styles.icon}>📍</span>;
const IconSave = () => <span role="img" aria-label="Salvar" style={{ marginRight: '6px' }}>💾</span>;


function ConstrutoraProfilePage() {
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        nome_empresa: '',
        cnpj: '',
        telefone: '',
        endereco: '',
        email_empresa: ''
    });
    const [submitting, setSubmitting] = useState(false); // Para o estado de submit
    const [loading, setLoading] = useState(true); // Para o carregamento inicial
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchProfileData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get('/construtoras/meu-perfil-completo');
            const { nome, email, construtora } = response.data;
            setFormData({
                nome: nome || '',
                email: email || '',
                nome_empresa: construtora?.nome_empresa || '',
                cnpj: construtora?.cnpj || '',
                telefone: construtora?.telefone || '',
                endereco: construtora?.endereco || '',
                email_empresa: construtora?.email || ''
            });
        } catch (err) {
            console.error("Erro ao buscar perfil da construtora:", err);
            setError(err.response?.data?.message || "Falha ao carregar dados do perfil.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccess('');

        const dataToSend = {
            nome: formData.nome,
            email: formData.email,
            nome_empresa: formData.nome_empresa,
            cnpj: formData.cnpj,
            telefone: formData.telefone,
            endereco: formData.endereco,
            email_empresa: formData.email_empresa
        };

        try {
            const response = await api.put('/construtoras/meu-perfil-completo', dataToSend);
            setSuccess("Perfil atualizado com sucesso!");
            
            const updatedUser = response.data;
            const token = localStorage.getItem('authToken');
            if (updatedUser && token) {
                login(updatedUser, token);
            }
            setTimeout(() => setSuccess(''), 3000);

        } catch (err) {
            console.error("Erro ao atualizar perfil:", err);
            setError(err.response?.data?.message || "Falha ao atualizar o perfil.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div style={styles.centerMessage}>Carregando perfil...</div>;
    }

    return (
        <div style={styles.pageContainer}>
            <h1 style={styles.pageTitle}>Meu Perfil - Construtora</h1>

            <form onSubmit={handleSubmit} style={styles.formCard}>
                {error && <p style={styles.errorMessage}>{error}</p>}
                {success && <p style={styles.successMessage}>{success}</p>}

                <h2 style={styles.sectionTitle}>Dados de Acesso</h2>
                <div style={styles.formGroup}>
                    <label htmlFor="nome" style={styles.label}><IconUser />Nome do Responsável:</label>
                    <input type="text" id="nome" name="nome" value={formData.nome} onChange={handleChange} style={styles.input} disabled={submitting} />
                </div>
                <div style={styles.formGroup}>
                    <label htmlFor="email" style={styles.label}><IconEmail />Email de Login:</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} style={styles.input} disabled={submitting} />
                </div>
                <div style={styles.changePasswordContainer}>
                    <Link to="/alterar-senha" style={styles.link}>Alterar Senha</Link>
                </div>


                <hr style={styles.hr} />

                <h2 style={styles.sectionTitle}>Dados da Empresa</h2>
                <div style={styles.formGroup}>
                    <label htmlFor="nome_empresa" style={styles.label}><IconBuilding />Nome da Empresa:</label>
                    <input type="text" id="nome_empresa" name="nome_empresa" value={formData.nome_empresa} onChange={handleChange} style={styles.input} disabled={submitting} />
                </div>
                <div style={styles.formGroup}>
                    <label htmlFor="cnpj" style={styles.label}><IconCNPJ />CNPJ:</label>
                    <input type="text" id="cnpj" name="cnpj" value={formData.cnpj} onChange={handleChange} style={styles.input} disabled={submitting} />
                </div>
                 <div style={styles.formGroup}>
                    <label htmlFor="email_empresa" style={styles.label}><IconEmail />Email de Contato da Empresa:</label>
                    <input type="email" id="email_empresa" name="email_empresa" value={formData.email_empresa} onChange={handleChange} style={styles.input} disabled={submitting} />
                </div>
                 <div style={styles.formGroup}>
                    <label htmlFor="telefone" style={styles.label}><IconPhone />Telefone de Contato:</label>
                    <input type="tel" id="telefone" name="telefone" value={formData.telefone} onChange={handleChange} style={styles.input} disabled={submitting} />
                </div>
                 <div style={styles.formGroup}>
                    <label htmlFor="endereco" style={styles.label}><IconAddress />Endereço:</label>
                    <textarea id="endereco" name="endereco" value={formData.endereco} onChange={handleChange} style={styles.textarea} rows={3} disabled={submitting}></textarea>
                </div>

                 <div style={styles.buttonGroup}>
                    <button type="submit" disabled={submitting || loading} style={{...styles.button, ...styles.buttonSubmit}}>
                        <IconSave /> {submitting ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </form>
        </div>
    );
}

const styles = {
    pageContainer: { maxWidth: '800px', margin: '30px auto', padding: '0 20px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" },
    pageTitle: { fontSize: '2.2em', marginBottom: '25px', color: '#2c3e50', textAlign: 'center', fontWeight: 600 },
    formCard: { backgroundColor: '#ffffff', padding: '30px 35px', borderRadius: '12px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' },
    sectionTitle: { fontSize: '1.4em', color: '#34495e', marginTop: '10px', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px', fontWeight: 500 },
    hr: { border: 0, borderTop: '1px solid #eee', margin: '30px 0' },
    formGroup: { display: 'flex', flexDirection: 'column', marginBottom: '18px' },
    label: { marginBottom: '8px', fontSize: '0.95em', color: '#34495e', fontWeight: 500, display: 'flex', alignItems: 'center' },
    input: { width: '100%', padding: '12px 15px', borderRadius: '6px', border: '1px solid #bdc3c7', fontSize: '1em', boxSizing: 'border-box', transition: 'border-color 0.2s ease, box-shadow 0.2s ease', '&:focus': { borderColor: '#3498db', boxShadow: '0 0 0 3px rgba(52, 152, 219, 0.2)', outline: 'none' } },
    textarea: { width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #bdc3c7', fontSize: '1em', boxSizing: 'border-box', fontFamily: 'inherit', minHeight: '80px', transition: 'border-color 0.2s ease, box-shadow 0.2s ease', '&:focus': { borderColor: '#3498db', boxShadow: '0 0 0 3px rgba(52, 152, 219, 0.2)', outline: 'none' } },
    errorMessage: { color: '#e74c3c', backgroundColor: '#fdeded', border: '1px solid #f5b7b1', padding: '12px', borderRadius: '6px', textAlign: 'center', fontSize: '0.9em', marginBottom: '20px' },
    successMessage: { color: '#155724', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', padding: '12px', borderRadius: '6px', textAlign: 'center', fontSize: '0.9em', marginBottom: '20px' },
    buttonGroup: { display: 'flex', justifyContent: 'flex-end', marginTop: '25px' },
    button: { padding: '12px 25px', fontSize: '1.05em', cursor: 'pointer', borderRadius: '6px', border: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'background-color 0.2s ease' },
    buttonSubmit: { backgroundColor: '#28a745', color: 'white', '&:hover:not(:disabled)': { backgroundColor: '#218838' }, '&:disabled': { backgroundColor: '#a3d9b6', cursor: 'not-allowed' } },
    centerMessage: { textAlign: 'center', padding: '50px 20px', fontSize: '1.2em', color: '#6c757d' },
    icon: { fontSize: '1.1em', marginRight: '8px', color: '#555' },
    changePasswordContainer: { textAlign: 'right', marginTop: '-10px', marginBottom: '10px' },
    link: { color: '#3498db', fontWeight: 500, textDecoration: 'none', fontSize: '0.9em', '&:hover': { textDecoration: 'underline' } },
};

export default ConstrutoraProfilePage;