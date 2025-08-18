import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function EmpreendimentoCardConstrutora({ empreendimento, handleDelete }) {
    const formatPrice = (value) => {
        if (value === null || value === undefined) return 'N/A';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }

    const imageUrl = empreendimento.imagem_url || 'https://via.placeholder.com/300x200.png?text=Empreendimento';

    return (
        <div style={styles.card}>
            <img src={imageUrl} alt={empreendimento.nome} style={styles.cardImage} />
            <div style={styles.cardBody}>
                <h3 style={styles.cardTitle}>{empreendimento.nome}</h3>
                <p style={styles.cardText}>📍 {empreendimento.endereco || 'Endereço não informado'}</p>
                <p style={styles.cardText}>Status: {empreendimento.status}</p>
                <p style={styles.cardPrice}>{formatPrice(empreendimento.preco)}</p>

                <div style={styles.actionButtons}>
                    <Link to={`/empreendimentos/${empreendimento.id}/unidades`}>
                        <button style={{ ...styles.button, ...styles.buttonManage }}>
                            Unidades ({empreendimento.total_unidade || 0})
                        </button>
                    </Link>
                    <Link to={`/empreendimentos/editar/${empreendimento.id}`}>
                        <button style={{ ...styles.button, ...styles.buttonEdit }}>
                            Editar
                        </button>
                    </Link>
                    <button
                        onClick={() => handleDelete(empreendimento.id)}
                        style={{ ...styles.button, ...styles.buttonDelete }}
                    >
                        Excluir
                    </button>
                </div>
                <small style={{ marginTop: '10px', textAlign: 'right', color: '#777' }}>ID: {empreendimento.id}</small>
            </div>
        </div>
    );
}


function EmpreendimentosListPage() {
  const [empreendimentos, setEmpreendimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const fetchEmpreendimentos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      console.log("Buscando empreendimentos da construtora...");
      const response = await api.get('/empreendimentos/meus');
      console.log("Resposta da API:", response.data);
      setEmpreendimentos(response.data || []);
    } catch (err) {
      console.error("Erro ao buscar empreendimentos:", err);
      if (err.response && err.response.status === 403) {
           setError("Você não tem permissão para ver esta página."); 
      } else if (err.response && err.response.data && err.response.data.message) {
           setError(err.response.data.message);
      }
       else {
        setError("Falha ao carregar os empreendimentos. Tente novamente mais tarde.");
      }
       setEmpreendimentos([]); 
    } finally {
      setLoading(false);
    }
  }, []); 
  useEffect(() => {
    if (user?.tipo_usuario === 'construtora') {
        fetchEmpreendimentos();
    } else if (user) { // Se usuário existe mas não é construtora
        setError("Acesso não permitido para este tipo de usuário.");
        setLoading(false);
        setEmpreendimentos([]);
    } else {
    }
  }, [user, fetchEmpreendimentos]);

  const handleDelete = async (id) => {
    if (window.confirm(`Tem certeza que deseja excluir o empreendimento ID ${id}? Esta ação não pode ser desfeita e pode excluir dados relacionados (unidades, agendamentos).`)) {
      setError('');
      try {
        console.log(`Tentando excluir empreendimento ID: ${id}`);
        await api.delete(`/empreendimentos/${id}`);
        console.log(`Empreendimento ${id} excluído com sucesso.`);
        setEmpreendimentos(prevEmpreendimentos =>
          prevEmpreendimentos.filter(emp => emp.id !== id)
        );
      } catch (err) {
        console.error("Erro ao excluir empreendimento:", err);
        let errorMsg = "Falha ao excluir o empreendimento.";
        if (err.response && err.response.data && err.response.data.message) {
            errorMsg = err.response.data.message;
        }
        setError(errorMsg);
        alert(`Erro: ${errorMsg}`);
      }
    }
  };

  if (loading) {
    return <div style={styles.centerMessage}>Carregando empreendimentos...</div>;
  }

  return (
    <div style={styles.pageContainer}>
      <div style={styles.headerContainer}>
        <h2 style={styles.pageTitle}>Meus Empreendimentos</h2>
        <Link to="/empreendimentos/novo">
          <button style={styles.newButton}>
            + Novo Empreendimento
          </button>
        </Link>
      </div>

      {error && <div style={styles.errorBox}>Erro: {error}</div>}

      {!loading && !error && empreendimentos.length === 0 && (
        <p style={styles.centerMessage}>Você ainda não cadastrou nenhum empreendimento.</p>
      )}

      {!loading && !error && empreendimentos.length > 0 && (
        <div style={styles.grid}>
          {empreendimentos.map((emp) => (
            <EmpreendimentoCardConstrutora
              key={emp.id}
              empreendimento={emp}
              handleDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
const styles = {
    pageContainer: {
        maxWidth: '1200px',
        margin: '20px auto',
        padding: '0 15px',
    },
    headerContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '25px',
    },
    pageTitle: {
        margin: 0,
        fontSize: '1.8em',
    },
    newButton: {
        padding: '10px 20px',
        fontSize: '1em',
        cursor: 'pointer',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    centerMessage: {
        textAlign: 'center',
        padding: '40px 20px',
        fontSize: '1.1em',
        color: '#6c757d',
    },
    errorBox: {
        color: '#721c24',
        backgroundColor: '#f8d7da',
        border: '1px solid #f5c6cb',
        padding: '15px',
        borderRadius: '5px',
        marginBottom: '20px',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '25px',
    },
    card: { 
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 8px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
    },
    cardImage: {
        width: '100%',
        height: '220px',
        objectFit: 'cover',
    },
    cardBody: {
        padding: '15px 20px',
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    cardTitle: {
        marginTop: '0',
        marginBottom: '8px',
        fontSize: '1.3em',
        fontWeight: '600',
        color: '#333',
    },
    cardText: {
        fontSize: '0.95em',
        color: '#555',
        margin: '4px 0',
    },
    cardPrice: {
        fontSize: '1.2em',
        fontWeight: 'bold',
        color: '#28a745',
        margin: '10px 0',
    },
    actionButtons: {
        display: 'flex',
        gap: '8px',
        marginTop: 'auto',
        paddingTop: '10px',
        borderTop: '1px solid #f0f0f0',
        justifyContent: 'space-around', 
    },
    button: { 
        padding: '6px 12px',
        fontSize: '0.85em',
        cursor: 'pointer',
        borderRadius: '4px',
        border: '1px solid transparent',
        fontWeight: '500',
        flex: 1,
        textAlign: 'center',
    },
    buttonManage: {
        backgroundColor: '#0d6efd', 
        color: 'white',
        borderColor: '#0d6efd',
    },
    buttonEdit: {
        backgroundColor: '#6c757d', 
        color: 'white',
        borderColor: '#6c757d',
    },
    buttonDelete: {
        backgroundColor: '#dc3545', 
        color: 'white',
        borderColor: '#dc3545',
    }
};

export default EmpreendimentosListPage;