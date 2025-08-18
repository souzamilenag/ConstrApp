// src/pages/ClienteProfilePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const IconUser = () => <span role="img" aria-label="Usuário" style={styles.icon}>👤</span>;
const IconEmail = () => <span role="img" aria-label="Email" style={styles.icon}>✉️</span>;
const IconPassword = () => <span role="img" aria-label="Senha" style={styles.icon}>🔒</span>;
const IconSave = () => <span role="img" aria-label="Salvar" style={{ marginRight: '6px' }}>💾</span>;


function ClienteProfilePage() {
    const { user: currentUser, login } = useAuth(); // Usar para atualizar o contexto
    const navigate = useNavigate();

    const [profileData, setProfileData] = useState({ nome: '', email: '' });
    const [passwordData, setPasswordData] = useState({ senhaAntiga: '', novaSenha: '', confirmarNovaSenha: '' });

    const [loadingProfile, setLoadingProfile] = useState(true);
    const [submittingProfile, setSubmittingProfile] = useState(false);
    const [submittingPassword, setSubmittingPassword] = useState(false);

    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');


    // Busca os dados do perfil ao carregar a página
    useEffect(() => {
        setProfileData({
            nome: currentUser?.nome || '',
            email: currentUser?.email || ''
        });
        setLoadingProfile(false);
    }, [currentUser]);


    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
        setProfileError('');
        setProfileSuccess('');
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
        setPasswordError('');
        setPasswordSuccess('');
    };


    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setSubmittingProfile(true);
        setProfileError('');
        setProfileSuccess('');

        try {
            const response = await api.put('/users/profile', {
                nome: profileData.nome,
                email: profileData.email
            });
            setProfileSuccess("Dados do perfil atualizados com sucesso!");

            // Atualiza o AuthContext com os novos dados
            const token = localStorage.getItem('authToken');
            if (response.data && token) {
                // Monta um objeto de usuário completo para a função login
                const updatedUser = { ...currentUser, ...response.data };
                login(updatedUser, token);
            }
            setTimeout(() => setProfileSuccess(''), 3000);

        } catch (err) {
            console.error("Erro ao atualizar perfil:", err);
            setProfileError(err.response?.data?.message || "Falha ao atualizar o perfil.");
        } finally {
            setSubmittingProfile(false);
        }
    };


    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setSubmittingPassword(true);
        setPasswordError('');
        setPasswordSuccess('');

        if (passwordData.novaSenha !== passwordData.confirmarNovaSenha) {
            setPasswordError("As novas senhas não coincidem.");
            setSubmittingPassword(false);
            return;
        }

        try {
            const response = await api.put('/users/change-password', {
                senhaAntiga: passwordData.senhaAntiga,
                novaSenha: passwordData.novaSenha
            });
            setPasswordSuccess(response.data.message || "Senha alterada com sucesso!");
            setPasswordData({ senhaAntiga: '', novaSenha: '', confirmarNovaSenha: '' }); // Limpa campos
            setTimeout(() => setPasswordSuccess(''), 3000);

        } catch (err) {
            console.error("Erro ao alterar senha:", err);
            setPasswordError(err.response?.data?.message || "Falha ao alterar a senha.");
        } finally {
            setSubmittingPassword(false);
        }
    };

    if (loadingProfile) {
        return <div style={styles.centerMessage}>Carregando perfil...</div>;
    }


    return (
        <div style={styles.pageContainer}>
            <h1 style={styles.pageTitle}>Meu Perfil</h1>

            <form onSubmit={handleProfileSubmit} style={styles.formCard}>
                <h2 style={styles.sectionTitle}>Meus Dados</h2>

                {profileError && <p style={styles.errorMessage}>{profileError}</p>}
                {profileSuccess && <p style={styles.successMessage}>{profileSuccess}</p>}

                <div style={styles.formGroup}>
                    <label htmlFor="nome" style={styles.label}><IconUser />Nome Completo:</label>
                    <input type="text" id="nome" name="nome" value={profileData.nome} onChange={handleProfileChange} style={styles.input} disabled={submittingProfile} />
                </div>
                <div style={styles.formGroup}>
                    <label htmlFor="email" style={styles.label}><IconEmail />Email de Login:</label>
                    <input type="email" id="email" name="email" value={profileData.email} onChange={handleProfileChange} style={styles.input} disabled={submittingProfile} />
                </div>
                <div style={styles.buttonGroup}>
                    <button type="submit" disabled={submittingProfile} style={{...styles.button, ...styles.buttonSubmit}}>
                        <IconSave /> {submittingProfile ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </form>

            <form onSubmit={handlePasswordSubmit} style={styles.formCard}>
                <h2 style={styles.sectionTitle}>Alterar Senha</h2>

                {passwordError && <p style={styles.errorMessage}>{passwordError}</p>}
                {passwordSuccess && <p style={styles.successMessage}>{passwordSuccess}</p>}

                <div style={styles.formGroup}>
                    <label htmlFor="senhaAntiga" style={styles.label}><IconPassword />Senha Antiga:</label>
                    <input type="password" id="senhaAntiga" name="senhaAntiga" value={passwordData.senhaAntiga} onChange={handlePasswordChange} style={styles.input} disabled={submittingPassword} autoComplete="current-password" />
                </div>
                <div style={styles.formGroup}>
                    <label htmlFor="novaSenha" style={styles.label}><IconPassword />Nova Senha:</label>
                    <input type="password" id="novaSenha" name="novaSenha" value={passwordData.novaSenha} onChange={handlePasswordChange} style={styles.input} disabled={submittingPassword} autoComplete="new-password" />
                </div>
                 <div style={styles.formGroup}>
                    <label htmlFor="confirmarNovaSenha" style={styles.label}><IconPassword />Confirmar Nova Senha:</label>
                    <input type="password" id="confirmarNovaSenha" name="confirmarNovaSenha" value={passwordData.confirmarNovaSenha} onChange={handlePasswordChange} style={styles.input} disabled={submittingPassword} autoComplete="new-password" />
                </div>
                <div style={styles.buttonGroup}>
                    <button type="submit" disabled={submittingPassword} style={{...styles.button, ...styles.buttonSubmit}}>
                        <IconSave /> {submittingPassword ? 'Alterando...' : 'Alterar Senha'}
                    </button>
                </div>
            </form>
        </div>
    );
}

const styles = {
    pageContainer: { maxWidth: '700px', margin: '30px auto', padding: '0 20px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" },
    pageTitle: { fontSize: '2.2em', marginBottom: '25px', color: '#2c3e50', textAlign: 'center', fontWeight: 600 },
    formCard: { backgroundColor: '#ffffff', padding: '30px 35px', borderRadius: '12px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', marginBottom: '30px' },
    sectionTitle: { fontSize: '1.4em', color: '#34495e', marginTop: '0', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px', fontWeight: 500 },
    formGroup: { display: 'flex', flexDirection: 'column', marginBottom: '18px' },
    label: { marginBottom: '8px', fontSize: '0.95em', color: '#34495e', fontWeight: 500, display: 'flex', alignItems: 'center' },
    input: { width: '100%', padding: '12px 15px', borderRadius: '6px', border: '1px solid #bdc3c7', fontSize: '1em', boxSizing: 'border-box', transition: 'border-color 0.2s ease, box-shadow 0.2s ease', '&:focus': { borderColor: '#3498db', boxShadow: '0 0 0 3px rgba(52, 152, 219, 0.2)', outline: 'none' } },
    errorMessage: { color: '#e74c3c', backgroundColor: '#fdeded', border: '1px solid #f5b7b1', padding: '12px', borderRadius: '6px', textAlign: 'center', fontSize: '0.9em', marginBottom: '20px' },
    successMessage: { color: '#155724', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', padding: '12px', borderRadius: '6px', textAlign: 'center', fontSize: '0.9em', marginBottom: '20px' },
    buttonGroup: { display: 'flex', justifyContent: 'flex-end', marginTop: '10px' },
    button: { padding: '10px 20px', fontSize: '1em', cursor: 'pointer', borderRadius: '6px', border: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'background-color 0.2s ease' },
    buttonSubmit: { backgroundColor: '#28a745', color: 'white', '&:hover:not(:disabled)': { backgroundColor: '#218838' }, '&:disabled': { backgroundColor: '#a3d9b6', cursor: 'not-allowed' } },
    centerMessage: { textAlign: 'center', padding: '50px 20px', fontSize: '1.2em', color: '#6c757d' },
    icon: { fontSize: '1.1em', marginRight: '8px', color: '#555' },
    link: { color: '#3498db', fontWeight: 500, textDecoration: 'none', fontSize: '0.9em', '&:hover': { textDecoration: 'underline' } },
};

export default ClienteProfilePage;