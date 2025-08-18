import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import NotificationBell from './components/NotificationBell';
import LogoImage from "./images/logo.png";

const AppLogo = () => (
    <Link to="/" style={styles.logoContainer}>
        <img src={LogoImage} alt="ConstrApp Logo" style={styles.logoImage} />
        {/* <span style={styles.logoText}>ConstrApp</span>  // Opcional, se a logo não tiver o nome */}
    </Link>
);


function App() {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const profilePath = user?.tipo_usuario === 'cliente'
    ? '/meu-perfil'
    : user?.tipo_usuario === 'construtora'
    ? '/perfil-construtora'
    : '/'; 

  if (loading) {
    return (
        <div style={{display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center'}}>
            <p>Carregando aplicação...</p>
        </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      <nav style={styles.navbar}>
        <div style={styles.navContent}>
          <AppLogo />

          {isAuthenticated && (
            <ul style={styles.navLinksList}>
              {user?.tipo_usuario === 'cliente' && (
                <>
                  <li><Link to="/minhas-compras" style={styles.navLink}>Minhas Compras</Link></li>
                  <li><Link to="/meus-agendamentos" style={styles.navLink}>Meus Agendamentos</Link></li>
                </>
              )}

              {user?.tipo_usuario === 'construtora' && (
                <>
                  <li><Link to="/empreendimentos" style={styles.navLink}>Empreendimentos</Link></li>
                  <li><Link to="/ver-agendamentos" style={styles.navLink}>Agendamentos</Link></li>
                  <li><Link to="/construtora/compras" style={styles.navLink}>Vendas</Link></li>
                </>
              )}
              <li><Link to="/chat" style={styles.navLink}>Chat</Link></li>
            </ul>
          )}
        </div>

        <div style={styles.userArea}>
          {isAuthenticated ? (
            <>
              <NotificationBell />
              <span style={styles.userName}>
                Olá, {user?.nome}!
                <Link to={profilePath} style={styles.perfilLink}>Meu Perfil</Link>
              </span>
              <button onClick={handleLogout} style={styles.logoutButton}>Sair</button>
            </>
          ) : (
            <Link to="/login" style={{...styles.navLink, ...styles.loginButton}}>Login</Link>
          )}
        </div>
      </nav>

      <main style={styles.mainContent}>
        <Outlet />
      </main>

      <footer style={styles.footer}>
        <p>&copy; {new Date().getFullYear()} ConstrApp. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

const styles = {
  appContainer: { display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", backgroundColor: '#f4f6f8' },
  navbar: { backgroundColor: '#ffffff', padding: '15px 30px', borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  navContent: { display: 'flex', alignItems: 'center', gap: '25px' },
  logoContainer: { display: 'flex', alignItems: 'center', textDecoration: 'none' },
  logoImage: { height: '35px', width: 'auto' },
  navLinksList: { display: 'flex', listStyle: 'none', padding: 0, margin: 0, alignItems: 'center', gap: '25px' }, // Adicionado alignItems e gap maior
  navLink: { textDecoration: 'none', color: '#555', fontWeight: 500, fontSize: '0.95em', padding: '5px', transition: 'color 0.2s ease', '&:hover': { color: '#3498db' } },
  userArea: { display: 'flex', alignItems: 'center', gap: '20px' },
  userName: { fontWeight: 500, color: '#34495e', fontSize: '0.9em', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' },
  perfilLink: {
    color: '#3498db', marginLeft: '10px', fontWeight: 'bold', textDecoration: 'none', fontSize: '0.9em',
    '&:hover': { textDecoration: 'underline' }
  },
  logoutButton: {
    padding: '8px 16px', backgroundColor: '#e74c3c', color: 'white', border: 'none',
    borderRadius: '6px', cursor: 'pointer', fontWeight: 500, fontSize: '0.9em',
    transition: 'background-color 0.2s ease', '&:hover': { backgroundColor: '#c0392b' }
  },
  loginButton: { 
    padding: '8px 18px', backgroundColor: '#3498db', color: 'white',
    borderRadius: '6px', transition: 'background-color 0.2s ease',
    '&:hover': { backgroundColor: '#2980b9' }
  },
  mainContent: { flexGrow: 1, padding: '30px' },
  footer: { padding: '25px', backgroundColor: '#2c3e50', color: '#bdc3c7', textAlign: 'center', fontSize: '0.85em', p: { margin: 0 } }
};

export default App;