// src/pages/RegisterPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// Ícone simples para o input (idealmente usar biblioteca de ícones)
const InputIcon = ({ children }) => <span style={styles.inputIcon}>{children}</span>;

function RegisterPage() {
    const navigate = useNavigate();
    const { login, isAuthenticated, loading: authLoading } = useAuth();
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        senha: '',
        confirmarSenha: '',
        tipo_usuario: 'cliente',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Efeito para redirecionar o usuário se ele já estiver logado e acessar esta página
    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            console.log("RegisterPage: Já autenticado, redirecionando para home.");
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, authLoading, navigate]);


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

        // Validações de frontend
        if (formData.senha !== formData.confirmarSenha) {
            setError("As senhas não coincidem.");
            return;
        }
        if (formData.senha.length < 6) {
            setError("A senha deve ter pelo menos 6 caracteres.");
            return;
        }

        setLoading(true); // Ativa o estado de loading do botão
        const userData = {
            nome: formData.nome.trim(),
            email: formData.email.trim(),
            senha: formData.senha, // Senha não deve ter trim()
            tipo_usuario: formData.tipo_usuario
        };

        try {
            const response = await api.post('/auth/register', userData);
            console.log("Registro API success:", response.data);

            // --- LÓGICA SIMPLIFICADA E CORRIGIDA ---
            setSuccess("Cadastro realizado com sucesso! Aguarde, estamos preparando tudo para você...");
            // Apenas chama login. O AuthContext agora é 100% responsável pelo redirecionamento.
            // A função login irá setar o 'user', que por sua vez acionará o
            // useEffect de verificação de perfil no AuthContext.
            await login(response.data.usuario, response.data.token);
            // NÃO há mais `navigate` aqui.
            // --- FIM DA LÓGICA ---

        } catch (err) {
            console.error("Erro no registro:", err);
            let errorMsg = "Falha ao realizar o cadastro.";
            if (err.response?.data?.message) {
                errorMsg = err.response.data.errors
                    ? `${err.response.data.message} Detalhes: ${err.response.data.errors.join(', ')}`
                    : err.response.data.message;
            } else if (err.request) {
                 errorMsg = "Não foi possível conectar ao servidor. Verifique sua conexão.";
            }
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // Renderização para evitar "flash" da página de registro se o usuário já estiver logado
    if (authLoading && isAuthenticated) {
        return <div style={styles.loadingMessage}>Verificando...</div>;
    }

    return (
        <div style={styles.pageContainer}>
            <div style={styles.registerCard}>
                <h1 style={styles.title}>Crie sua Conta</h1>
                <p style={styles.subtitle}>É rápido e fácil. Comece a explorar!</p>
                
                {success && <p style={styles.successMessage}>{success}</p>}
                {error && <p style={styles.errorMessage}>{error}</p>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Quero me cadastrar como:</label>
                        <div style={styles.radioGroup}>
                            <label style={styles.radioLabel}>
                                <input
                                    type="radio" name="tipo_usuario" value="cliente"
                                    checked={formData.tipo_usuario === 'cliente'}
                                    onChange={handleChange} style={styles.radioInput} disabled={loading}
                                />
                                <span style={styles.radioText}>Cliente</span>
                            </label>
                            <label style={styles.radioLabel}>
                                <input
                                    type="radio" name="tipo_usuario" value="construtora"
                                    checked={formData.tipo_usuario === 'construtora'}
                                    onChange={handleChange} style={styles.radioInput} disabled={loading}
                                />
                                <span style={styles.radioText}>Construtora</span>
                            </label>
                        </div>
                    </div>
                    <div style={styles.formGroup}>
                        <label htmlFor="nome" style={styles.label}>Nome Completo</label>
                        <div style={styles.inputWrapper}>
                            <InputIcon>👤</InputIcon>
                            <input type="text" id="nome" name="nome" value={formData.nome} onChange={handleChange} required placeholder="Seu nome completo" style={styles.input} disabled={loading}/>
                        </div>
                    </div>
                    <div style={styles.formGroup}>
                        <label htmlFor="email" style={styles.label}>Email</label>
                        <div style={styles.inputWrapper}>
                            <InputIcon>✉️</InputIcon>
                            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required autoComplete='email' placeholder="seuemail@exemplo.com" style={styles.input} disabled={loading}/>
                        </div>
                    </div>
                    <div style={styles.formGroup}>
                        <label htmlFor="senha" style={styles.label}>Senha</label>
                        <div style={styles.inputWrapper}>
                            <InputIcon>🔒</InputIcon>
                            <input type="password" id="senha" name="senha" value={formData.senha} onChange={handleChange} required autoComplete='new-password' placeholder="Mínimo 6 caracteres" style={styles.input} disabled={loading}/>
                        </div>
                    </div>
                    <div style={styles.formGroup}>
                        <label htmlFor="confirmarSenha" style={styles.label}>Confirmar Senha</label>
                        <div style={styles.inputWrapper}>
                             <InputIcon>🔑</InputIcon>
                            <input type="password" id="confirmarSenha" name="confirmarSenha" value={formData.confirmarSenha} onChange={handleChange} required autoComplete='new-password' placeholder="Repita a senha" style={styles.input} disabled={loading}/>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} style={loading ? {...styles.button, ...styles.buttonLoading} : styles.button}>
                        {loading ? 'Registrando...' : 'Criar Conta'}
                    </button>
                </form>

                <p style={styles.footerText}>
                    Já tem uma conta? <Link to="/login" style={styles.link}>Faça Login aqui!</Link>
                </p>
            </div>
        </div>
    );
}

// Estilos (mantidos da sua última versão UX/UI)
const styles = {
  pageContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 120px)', padding: '20px', backgroundColor: '#f4f6f8', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" },
  registerCard: { width: '100%', maxWidth: '480px', backgroundColor: '#ffffff', padding: '35px 40px', borderRadius: '12px', boxShadow: '0 8px 25px rgba(0,0,0,0.1)', textAlign: 'left' },
  title: { fontSize: '2em', color: '#2c3e50', marginBottom: '10px', fontWeight: 600, textAlign: 'center' },
  subtitle: { fontSize: '1em', color: '#7f8c8d', marginBottom: '30px', textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: '18px' },
  formGroup: { display: 'flex', flexDirection: 'column' },
  label: { marginBottom: '8px', fontSize: '0.95em', color: '#34495e', fontWeight: 500 },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: '12px', color: '#95a5a6', fontSize: '1.1em' },
  input: { width: '100%', padding: '12px 12px 12px 40px', borderRadius: '6px', border: '1px solid #bdc3c7', fontSize: '1em', transition: 'border-color 0.2s ease, box-shadow 0.2s ease', '&:focus': { borderColor: '#3498db', boxShadow: '0 0 0 3px rgba(52, 152, 219, 0.2)', outline: 'none' } },
  radioGroup: { display: 'flex', gap: '20px', marginTop: '5px', marginBottom: '10px' },
  radioLabel: { display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.95em', color: '#34495e' },
  radioInput: { marginRight: '8px', cursor: 'pointer', width: '16px', height: '16px' },
  radioText: {},
  errorMessage: { color: '#e74c3c', backgroundColor: '#fdeded', border: '1px solid #f5b7b1', padding: '12px', borderRadius: '6px', textAlign: 'center', fontSize: '0.9em', marginBottom: '18px' },
  successMessage: { color: '#155724', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', padding: '12px', borderRadius: '6px', textAlign: 'center', fontSize: '0.9em', marginBottom: '18px' },
  button: { backgroundColor: '#28a745', color: 'white', padding: '14px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.05em', transition: 'background-color 0.2s ease', '&:hover': { backgroundColor: '#218838' } },
  buttonLoading: { backgroundColor: '#76c799', cursor: 'not-allowed' },
  footerText: { marginTop: '25px', fontSize: '0.9em', color: '#555', textAlign: 'center' },
  link: { color: '#3498db', fontWeight: 'bold', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },
  loadingMessage: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 120px)', fontSize: '1.2em' }
};

export default RegisterPage;