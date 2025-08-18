import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function StartPurchaseHandler() {
    const { unidadeId } = useParams();
    const { isAuthenticated, user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [status, setStatus] = useState('iniciando...');
    const [error, setError] = useState('');

    useEffect(() => {
        if (authLoading) {
             setStatus('Verificando autenticação...');
             return;
        }

        if (!isAuthenticated) {
             setStatus('Redirecionando para login...');
             navigate('/login', { state: { from: location }, replace: true });
             return;
        }

        if (user?.tipo_usuario !== 'cliente') {
             setError('Apenas clientes podem iniciar compras.');
             setStatus('Acesso negado.');
             return;
        }

        const iniciarCompraAPI = async () => {
             setStatus('Processando sua solicitação...');
             setError('');
             try {
                 console.log(`Iniciando compra para unidade ID: ${unidadeId}`);
                 const response = await api.post('/compras/iniciar', { unidadeId: Number(unidadeId) });
                 const novaCompraId = response.data?.compra?.id;

                 setStatus('Compra iniciada com sucesso! Redirecionando...');

                 if (novaCompraId) {
                     navigate(`/compras/detalhes/${novaCompraId}`, { replace: true });
                 } else {
                     navigate('/minhas-compras', { replace: true });
                 }

             } catch (err) {
                 console.error("Erro ao iniciar compra via API:", err);
                 const errorMsg = err.response?.data?.message || "Não foi possível iniciar a compra desta unidade. Ela pode não estar mais disponível.";
                 setError(errorMsg);
                 setStatus('Falha ao iniciar compra.');
             }
         };

        iniciarCompraAPI();

    }, [isAuthenticated, user, authLoading, unidadeId, navigate, location]);

    return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
            <h2>Processando Compra</h2>
            <p>{status}</p>
            {error && <p style={{ color: 'red', fontWeight: 'bold' }}>Erro: {error}</p>}
            {!error && <p>Aguarde um instante...</p>}
             { }
             {(error || status === 'Acesso negado.') &&
                 <button onClick={() => navigate(-1)} style={{marginTop: '20px'}}>Voltar</button>
             }
        </div>
    );
}

export default StartPurchaseHandler;