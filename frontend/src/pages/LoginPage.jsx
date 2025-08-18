import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const InputIcon = ({ children, style }) => (
  <span style={{ ...styles.inputIcon, ...style }}>{children}</span>
);


function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, loading: authLoading } = useAuth(); 

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const from = location.state?.from?.pathname || "/";
      console.log("LoginPage: Já autenticado, redirecionando para:", from);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, location.state]);


  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, senha: password });
      console.log('Login API success:', response.data);
      const didAuthContextRedirect = await login(response.data.usuario, response.data.token);

      if (!didAuthContextRedirect) {
        const from = location.state?.from?.pathname || "/";
        console.log("LoginPage: Login OK, redirecionando para:", from);
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error('Erro no login:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.request) {
        setError('Não foi possível conectar ao servidor. Verifique sua internet.');
      }
      else {
        setError('Erro desconhecido ao tentar fazer login.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading && isAuthenticated) {
    return <div style={styles.loadingMessage}>Verificando...</div>;
  }


  return (
    <div style={styles.pageContainer}>
      <div style={styles.loginCard}>
        <h1 style={styles.title}>Bem-vindo de Volta!</h1>
        <p style={styles.subtitle}>Acesse sua conta para continuar.</p>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label htmlFor="email" style={styles.label}>Email</label>
            <div style={styles.inputWrapper}>
              <InputIcon>✉️</InputIcon>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete='email'
                placeholder="seuemail@exemplo.com"
                style={styles.input}
                disabled={loading}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>Senha</label>
            <div style={styles.inputWrapper}>
              <InputIcon>🔒</InputIcon>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete='current-password'
                placeholder="Sua senha"
                style={styles.input}
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <p style={styles.errorMessage}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={loading ? { ...styles.button, ...styles.buttonLoading } : styles.button}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p style={styles.footerText}>
          Não tem uma conta? <Link to="/register" style={styles.link}>Crie uma agora!</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  pageContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 120px)',
    padding: '20px',
    backgroundColor: '#f4f6f8',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  },
  loginCard: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: '#ffffff',
    padding: '35px 40px',
    borderRadius: '12px',
    boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  title: {
    fontSize: '2em',
    color: '#2c3e50',
    marginBottom: '10px',
    fontWeight: 600,
  },
  subtitle: {
    fontSize: '1em',
    color: '#7f8c8d',
    marginBottom: '30px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    textAlign: 'left',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '0.95em',
    color: '#34495e',
    fontWeight: 500,
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    color: '#95a5a6',
    fontSize: '1.1em',
  },
  input: {
    width: '100%',
    padding: '12px 12px 12px 40px',
    borderRadius: '6px',
    border: '1px solid #bdc3c7',
    fontSize: '1em',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    '&:focus': {
      borderColor: '#3498db',
      boxShadow: '0 0 0 3px rgba(52, 152, 219, 0.2)',
      outline: 'none',
    }
  },
  errorMessage: {
    color: '#e74c3c',
    backgroundColor: '#fdeded',
    border: '1px solid #f5b7b1',
    padding: '10px',
    borderRadius: '6px',
    textAlign: 'center',
    fontSize: '0.9em',
    marginTop: 0,
  },
  button: {
    backgroundColor: '#3498db',
    color: 'white',
    padding: '14px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1.05em',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#2980b9',
    }
  },
  buttonLoading: {
    backgroundColor: '#a9d6f5',
    cursor: 'not-allowed',
  },
  footerText: {
    marginTop: '25px',
    fontSize: '0.9em',
    color: '#555',
  },
  link: {
    color: '#3498db',
    fontWeight: 'bold',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    }
  },
  loadingMessage: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 120px)', fontSize: '1.2em'
  }
};
export default LoginPage;