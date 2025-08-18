import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const modalStyles = {
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000
    },
    content: {
        backgroundColor: 'white', padding: '25px 30px', borderRadius: '8px',
        maxWidth: '550px', width: '90%', maxHeight: '90vh', overflowY: 'auto',
        position: 'relative',
        boxShadow: '0 5px 15px rgba(0,0,0,0.2)'
    },
    closeButton: {
        position: 'absolute', top: '10px', right: '15px',
        background: 'none', border: 'none', fontSize: '1.8em',
        cursor: 'pointer', color: '#888', padding: 0, lineHeight: 1
    },
    input: {
        width: '100%', padding: '12px', marginTop: '5px', marginBottom: '15px',
        border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box',
        fontSize: '1em'
    },
    checkboxLabel: {
        display: 'flex', alignItems: 'center', margin: '20px 0',
        cursor: 'pointer', fontSize: '0.95em'
    },
    checkbox: {
        marginRight: '10px', width: '18px', height: '18px', cursor: 'pointer'
    },
    button: {
        padding: '10px 20px', fontSize: '1em', cursor: 'pointer',
        marginRight: '10px', borderRadius: '4px', border: 'none'
    },
    confirmButton: {
        backgroundColor: '#198754', color: 'white'
    },
    cancelButton: {
        backgroundColor: '#6c757d', color: 'white'
    },
    errorText: {
        color: '#dc3545', fontSize: '0.9em', marginTop: '15px',
        border: '1px solid #f5c6cb', padding: '8px', borderRadius: '4px', backgroundColor: '#f8d7da'
    },
    linkContainer: {
        margin: '15px 0', padding: '10px', border: '1px dashed #ccc', borderRadius: '5px', textAlign: 'center'
    },
    hr: {
        border: 0, borderTop: '1px solid #eee', margin: '25px 0'
    }
};

function SignatureModal({ isOpen, onClose, compraId, documentoUrl, onSignatureSuccess }) {
    const { user } = useAuth();

    const [nomeDigitado, setNomeDigitado] = useState('');
    const [aceiteTermos, setAceiteTermos] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');


    useEffect(() => {
        if (isOpen) {
            setNomeDigitado('');
            setAceiteTermos(false);
            setError('');
            setLoading(false);
        }
    }, [isOpen]);

    const handleClose = () => {
        if (loading) return;
        onClose();
    };

    const handleConfirmSignature = async () => {
        setError('');

        if (!aceiteTermos) {
            setError("Você precisa confirmar que leu e concorda com os termos.");
            return;
        }
        if (!nomeDigitado || nomeDigitado.trim().toLowerCase() !== user?.nome?.trim().toLowerCase()) {
            setError("Por favor, digite seu nome completo exatamente como no cadastro para confirmar.");
            return;
        }

        setLoading(true);
        try {
            await api.post(`/compras/${compraId}/assinar-cliente`, { nomeDigitado: nomeDigitado.trim() });

            alert('Assinatura confirmada com sucesso!');
            onSignatureSuccess();
            handleClose();

        } catch (err) {
            console.error("Erro ao confirmar assinatura:", err);
            setError(err.response?.data?.message || "Não foi possível confirmar a assinatura. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div style={modalStyles.overlay} onClick={handleClose}>
            <div style={modalStyles.content} onClick={(e) => e.stopPropagation()}>
                <button onClick={handleClose} style={modalStyles.closeButton} aria-label="Fechar">
                    ×
                </button>

                <h2>Confirmar Assinatura (Simulação)</h2>
                <p>Por favor, revise o documento do contrato e confirme digitando seu nome completo.</p>

                <div style={modalStyles.linkContainer}>
                    {documentoUrl ? (
                        <a href={documentoUrl} target="_blank" rel="noopener noreferrer">
                            <strong>Visualizar Contrato (PDF)</strong>
                        </a>

                    ) : (
                        <p style={{ color: 'orange', margin: 0 }}>Link do documento não disponível.</p>
                    )}
                </div>

                <hr style={modalStyles.hr} />

                <div>
                    <label htmlFor="nomeAssinatura" style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                        Digite seu nome completo para assinar:
                    </label>
                    <input
                        type="text"
                        id="nomeAssinatura"
                        value={nomeDigitado}
                        onChange={(e) => setNomeDigitado(e.target.value)}
                        placeholder={user?.nome || "Seu Nome Completo"}
                        style={modalStyles.input}
                        disabled={loading}
                    />
                </div>

                <label style={modalStyles.checkboxLabel}>
                    <input
                        type="checkbox"
                        checked={aceiteTermos}
                        onChange={(e) => setAceiteTermos(e.target.checked)}
                        style={modalStyles.checkbox}
                        disabled={loading}
                    />
                    Li e concordo com os termos do contrato apresentado.
                </label>

                {error && <p style={modalStyles.errorText}>{error}</p>}

                <div style={{ marginTop: '25px', textAlign: 'right' }}>
                    <button
                        onClick={handleConfirmSignature}
                        disabled={loading || !aceiteTermos || !nomeDigitado.trim()}
                        style={{ ...modalStyles.button, ...modalStyles.confirmButton }}
                    >
                        {loading ? 'Confirmando...' : 'Confirmar Assinatura'}
                    </button>
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        style={{ ...modalStyles.button, ...modalStyles.cancelButton }}
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SignatureModal;