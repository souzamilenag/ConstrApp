import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('authToken') || null);
    const [loading, setLoading] = useState(true);
    const [profileCheckLoading, setProfileCheckLoading] = useState(false);
    const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const profileCheckAttemptedForCurrentUser = useRef(false);


    const checkConstrutoraProfile = useCallback(async () => {
        console.log("AuthContext: Verificando perfil da construtora...");
        setProfileCheckLoading(true);
        try {
            await api.get('/construtoras/meu-perfil');
            console.log("AuthContext: Perfil construtora encontrado.");
            setNeedsProfileCompletion(false);
            return false;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log("AuthContext: Perfil construtora NÃO encontrado (404). Necessário completar.");
                setNeedsProfileCompletion(true);
                return true;
            }
            console.error("AuthContext: Erro ao verificar perfil construtora:", error);
            setNeedsProfileCompletion(false);
            return false;
        } finally {
            setProfileCheckLoading(false);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        const initializeAuth = async () => {
            console.log("AuthContext: Effect[initializeAuth] - Iniciando...");
            setLoading(true);
            profileCheckAttemptedForCurrentUser.current = false;
            setNeedsProfileCompletion(false);

            const storedToken = localStorage.getItem('authToken');
            if (storedToken) {
                console.log("AuthContext: Effect[initializeAuth] - Token encontrado.");
                api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
                try {
                    const response = await api.get('/users/profile');
                    if (isMounted) {
                        console.log("AuthContext: Effect[initializeAuth] - Usuário obtido:", response.data);
                        setToken(storedToken);
                        setUser(response.data);
                        localStorage.setItem('userData', JSON.stringify(response.data));
                    }
                } catch (error) {
                    console.error("AuthContext: Effect[initializeAuth] - Token inválido/expirado.", error);
                    if (isMounted) {
                        localStorage.removeItem('authToken'); localStorage.removeItem('userData');
                        if (api.defaults.headers.common['Authorization']) delete api.defaults.headers.common['Authorization'];
                        setToken(null); setUser(null);
                    }
                }
            } else {
                console.log("AuthContext: Effect[initializeAuth] - Nenhum token.");
                if (isMounted) {
                    localStorage.removeItem('authToken'); localStorage.removeItem('userData');
                    if (api.defaults.headers.common['Authorization']) delete api.defaults.headers.common['Authorization'];
                    setToken(null); setUser(null);
                }
            }
            if (isMounted) {
                setLoading(false);
                console.log("AuthContext: Effect[initializeAuth] - Concluído.");
            }
        };
        initializeAuth();
        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        let isMounted = true;
        console.log("AuthContext: Effect[checkAndRedirect] - Status: loading=", loading, "user=", !!user, "profileCheckAttempted=", profileCheckAttemptedForCurrentUser.current);

        if (!loading && user && user.tipo_usuario === 'construtora' && !profileCheckAttemptedForCurrentUser.current) {
            profileCheckAttemptedForCurrentUser.current = true;
            console.log("AuthContext: Effect[checkAndRedirect] - Usuário é construtora. Verificando perfil...");

            const verifyAndRedirect = async () => {
                const needsCompletion = await checkConstrutoraProfile();
                if (isMounted && needsCompletion) {
                    if (location.pathname !== '/completar-cadastro-construtora') {
                        console.log("AuthContext: Effect[checkAndRedirect] - REDIRECIONANDO para /completar-cadastro-construtora");
                        navigate('/completar-cadastro-construtora', { replace: true });
                    } else {
                        console.log("AuthContext: Effect[checkAndRedirect] - Já está na página de completar cadastro.");
                    }
                } else if (isMounted && !needsCompletion) {
                    console.log("AuthContext: Effect[checkAndRedirect] - Perfil construtora OK ou não precisa completar.");
                }
            };
            verifyAndRedirect();
        } else if (!loading && user && user.tipo_usuario !== 'construtora') {
            if (isMounted) setNeedsProfileCompletion(false);
        } else if (!loading && !user) {
            if (isMounted) setNeedsProfileCompletion(false);
        }

        return () => { isMounted = false; };
    }, [loading, user, checkConstrutoraProfile, navigate, location.pathname]);


    // Função Login
    const login = useCallback(async (userData, authToken) => {
        console.log("AuthContext: Função login chamada.");
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('userData', JSON.stringify(userData));
        api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
        setToken(authToken);
        profileCheckAttemptedForCurrentUser.current = false; 
        setUser(userData);
    }, []);


    // Função Logout
    const logout = useCallback(() => {
        console.log("AuthContext: Função logout chamada.");
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        if (api.defaults.headers.common['Authorization']) delete api.defaults.headers.common['Authorization'];
        setToken(null);
        setUser(null); //
        setNeedsProfileCompletion(false);
        profileCheckAttemptedForCurrentUser.current = false; // Reseta
    }, []);


    const value = { user, token, loading, profileCheckLoading, needsProfileCompletion, login, logout, isAuthenticated: !!user };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
};