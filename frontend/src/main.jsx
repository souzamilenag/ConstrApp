// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import App from './App.jsx';
import ProtectedRoute from './components/ProtectedRoute';
// Públicas
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import EmpreendimentoPublicDetailsPage from './pages/EmpreendimentoPublicDetailsPage';
import NotFoundPage from './pages/NotFoundPage';
import RegisterPage from './pages/RegisterPage';
import StartPurchaseHandler from './components/StartPurchaseHandler';
// Cliente
import AgendamentoPage from './pages/AgendamentoPage';
import MinhasComprasPage from './pages/MinhasComprasPage';
import MeusAgendamentosPage from './pages/MeusAgendamentosPage';
import PaymentPage from './pages/PaymentPage';
import CompraDetalhesPage from './pages/CompraDetalhesPage';
import ClienteProfilePage from './pages/ClienteProfilePage';
// Construtora
import EmpreendimentosListPage from './pages/EmpreendimentosListPage';
import EmpreendimentoFormPage from './pages/EmpreendimentoFormPage';
import UnidadesListPage from './pages/UnidadesListPage';
import UnidadeFormPage from './pages/UnidadeFormPage.jsx';
import VerAgendamentosPage from './pages/VerAgendamentosPage';
import CadastroConstrutoraPage from './pages/CadastroConstrutoraPage.jsx';
import ConstrutoraComprasPage from './pages/ConstrutoraComprasPage';
import ConstrutoraProfilePage from './pages/ConstrutoraProfilePage';
// Chat
import ChatListPage from './pages/ChatListPage';
import ChatConversationPage from './pages/ChatConversationPage';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rota principal que aplica o Layout 'App' */}
          <Route path="/" element={<App />}>

            {/* === ROTAS PÚBLICAS === */}
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="empreendimentos/public/:id" element={<EmpreendimentoPublicDetailsPage />} />
            <Route path="comprar/unidade/:unidadeId" element={<StartPurchaseHandler />} />

            {/* === ROTAS PROTEGIDAS (Requer Login, Qualquer Tipo de Usuário) === */}
            <Route element={<ProtectedRoute />}>
              <Route path="dashboard-geral" element={<div>Dashboard Geral (Logado)</div>} />
              <Route path="compras/detalhes/:id" element={<CompraDetalhesPage />} />
              {/* --- ROTAS DE CHAT --- */}
              <Route path="chat" element={<ChatListPage />} />
              <Route path="chat/conversa/:otherUserId" element={<ChatConversationPage />} />
            </Route>

            {/* === ROTAS PROTEGIDAS (Requer Login E Role 'cliente') === */}
            <Route element={<ProtectedRoute allowedRoles={['cliente']} />}>
              <Route path="agendar-visita" element={<AgendamentoPage />} />
              <Route path="minhas-compras" element={<MinhasComprasPage />} />
              <Route path="meus-agendamentos" element={<MeusAgendamentosPage />} />
              <Route path="pagamentos/compra/:compraId" element={<PaymentPage />} />
              <Route path="/meu-perfil" element={<ClienteProfilePage />} />
            </Route>
            {/* === ROTAS PROTEGIDAS (Requer Login E Role 'construtora') === */}
            <Route element={<ProtectedRoute allowedRoles={['construtora']} />}>
              <Route path="empreendimentos" element={<EmpreendimentosListPage />} />
              <Route path="meus-empreendimentos" element={<EmpreendimentosListPage />} />
              <Route path="empreendimentos/novo" element={<EmpreendimentoFormPage />} />
              <Route path="empreendimentos/editar/:id" element={<EmpreendimentoFormPage />} />
              <Route path="empreendimentos/:empreendimentoId/unidades" element={<UnidadesListPage />} />
              <Route path="empreendimentos/:empreendimentoId/unidades/nova" element={<UnidadeFormPage />} />
              <Route path="unidades/editar/:id" element={<UnidadeFormPage />} />
              <Route path="ver-agendamentos" element={<VerAgendamentosPage />} />
              <Route path="completar-cadastro-construtora" element={<CadastroConstrutoraPage />} />
              <Route path="construtora/compras" element={<ConstrutoraComprasPage />} />
              <Route path="/perfil-construtora" element={<ConstrutoraProfilePage />} />
            </Route>


            <Route path="*" element={<NotFoundPage />} />

          </Route>

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);