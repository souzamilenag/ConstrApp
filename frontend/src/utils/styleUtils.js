// src/utils/styleUtils.js

const statusBadgeBaseStyle = { // Movi o estilo base para cá também
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '0.85em',
    display: 'inline-block'
};

export const getStatusStyle = (status) => { // Adiciona 'export'
    let backgroundColor = '#6c757d'; // Cinza padrão
    let color = 'white';

    switch (status) {
        case 'Solicitado':
            backgroundColor = '#ffc107';
            color = '#000';
            break;
        case 'Confirmado':
            backgroundColor = '#198754';
            break;
        case 'Cancelado':
            backgroundColor = '#6c757d'; // Ou '#dc3545' para vermelho
            break;
        case 'Realizado':
            backgroundColor = '#0dcaf0';
            color = '#000';
            break;
        default:
            // Mantém padrão
            break;
    }
    return { ...statusBadgeBaseStyle, backgroundColor, color };
};
