// src/pages/EmpreendimentoFormPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../services/api';

// Ícones (Simples)
const IconSave = () => <span role="img" aria-label="Salvar" style={{ marginRight: '5px' }}>💾</span>;
const IconCancel = () => <span role="img" aria-label="Cancelar" style={{ marginRight: '5px' }}>↩️</span>;
const IconBack = () => <span role="img" aria-label="Voltar" style={{ marginRight: '5px' }}>⬅️</span>;

function EmpreendimentoFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    endereco: '',
    preco: '',
    status: 'Em Lançamento',
    previsao_entrega: '',
    imagens: [],
    planta_url: '',
  });

  const [plantaFile, setPlantaFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pageTitle, setPageTitle] = useState('Novo Empreendimento');

  useEffect(() => {
    if (isEditMode && id) {
      setPageTitle(`Editar Empreendimento #${id}`);
      setLoading(true);
      api.get(`/empreendimentos/${id}`)
        .then(response => {
          const data = response.data;
          setFormData({
            nome: data.nome || '',
            descricao: data.descricao || '',
            endereco: data.endereco || '',
            preco: data.preco || '',
            status: data.status || 'Em Lançamento',
            previsao_entrega: data.previsao_entrega ? data.previsao_entrega.split('T')[0] : '',
            imagens: Array.isArray(data.imagens) ? data.imagens : [],
            planta_url: data.planta_url || '',
          });
        })
        .catch(err => {
          console.error("Erro ao buscar dados para edição:", err);
          setError("Falha ao carregar dados do empreendimento.");
        })
        .finally(() => setLoading(false));
    } else {
      setPageTitle('Novo Empreendimento');
      setFormData({
        nome: '', descricao: '', endereco: '', preco: '',
        status: 'Em Lançamento', previsao_entrega: '', imagens: [], planta_url: ''
      });
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
    }));
    setError('');
    setSuccess('');
  };

  const handlePlantaFileChange = (e) => { setPlantaFile(e.target.files[0]); };
  const handleImageFilesChange = (e) => { if (e.target.files?.length) { setImageFiles(Array.from(e.target.files)); } };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    let uploadedPlantaUrl = formData.planta_url;
    let uploadedImageUrls = formData.imagens;

    try {
      setUploading(true);

      if (plantaFile) {
        const fileFormData = new FormData();
        fileFormData.append('plantaFile', plantaFile);
        const uploadResponse = await api.post('/uploads/planta', fileFormData, { headers: { 'Content-Type': 'multipart/form-data' } });
        uploadedPlantaUrl = uploadResponse.data.filePath;
      }

      if (imageFiles.length > 0) {
        const imageFormData = new FormData();
        imageFiles.forEach(file => imageFormData.append('imageFiles', file));
        console.log("Enviando FormData de imagens..."); // Log 1
        const imageUploadResponse = await api.post('/uploads/empreendimento-imagens', imageFormData, { headers: { 'Content-Type': 'multipart/form-data' } });
        console.log("RESPOSTA RECEBIDA DO UPLOAD DE IMAGENS:", imageUploadResponse.data); // Log 2
        uploadedImageUrls = [...formData.imagens, ...imageUploadResponse.data.filePaths];
      }
      setUploading(false);

      const dataToSend = {
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim() || null,
        endereco: formData.endereco.trim() || null,
        preco: formData.preco !== '' ? parseFloat(formData.preco) : null,
        status: formData.status,
        previsao_entrega: formData.previsao_entrega || null,
        imagens: uploadedImageUrls,
        planta_url: uploadedPlantaUrl || null,
      };

      if (!dataToSend.nome || dataToSend.preco === null) { throw new Error("Nome do empreendimento e Preço são obrigatórios."); }

      if (isEditMode) {
        await api.put(`/empreendimentos/${id}`, dataToSend);
        setSuccess("Empreendimento atualizado com sucesso!");
      } else {
        await api.post('/empreendimentos', dataToSend);
        setSuccess("Empreendimento criado com sucesso!");
      }
      setTimeout(() => navigate('/empreendimentos', { replace: true }), 1500);

    } catch (err) {
      console.error(`Erro ao ${isEditMode ? 'salvar' : 'criar'} empreendimento:`, err);
      let errorMsg = `Falha ao ${isEditMode ? 'salvar' : 'criar'} o empreendimento.`;
      if (err.response?.data?.message) {
        errorMsg = err.response.data.errors ? `${err.response.data.message} Detalhes: ${err.response.data.errors.join(', ')}` : err.response.data.message;
      }
      setError(errorMsg);
      setUploading(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return <div style={styles.centerMessage}>Carregando dados do empreendimento...</div>;
  }

  return (
    <div style={styles.pageContainer}>
      <Link to="/empreendimentos" style={styles.backLink}>
        <IconBack /> Voltar para Lista de Empreendimentos
      </Link>

      <div style={styles.formCard}>
        <h1 style={styles.title}>{pageTitle}</h1>

        {success && <p style={styles.successMessage}>{success}</p>}
        {error && <p style={styles.errorMessage}>{error}</p>}

        <form onSubmit={handleSubmit} style={styles.form}>

          {/* --- SEÇÃO DE INFORMAÇÕES BÁSICAS (RESTAURADA) --- */}
          <h3 style={styles.sectionTitle}>Informações Básicas</h3>
          <div style={styles.formGroup}>
            <label htmlFor="nome" style={styles.label}>Nome do Empreendimento*</label>
            <input type="text" id="nome" name="nome" value={formData.nome} onChange={handleChange} required maxLength={255} style={styles.input} placeholder="Ex: Residencial Flores" disabled={loading} />
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="descricao" style={styles.label}>Descrição</label>
            <textarea id="descricao" name="descricao" value={formData.descricao} onChange={handleChange} rows={4} style={styles.textarea} placeholder="Detalhes sobre o empreendimento..." disabled={loading} />
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="endereco" style={styles.label}>Endereço Completo</label>
            <input type="text" id="endereco" name="endereco" value={formData.endereco} onChange={handleChange} style={styles.input} placeholder="Rua, Número, Bairro, Cidade - UF" disabled={loading} />
          </div>
          <div style={styles.formRow}>
            <div style={{ ...styles.formGroup, flex: 2 }}>
              <label htmlFor="preco" style={styles.label}>Preço Base (R$)*</label>
              <input type="number" id="preco" name="preco" value={formData.preco} onChange={handleChange} required step="0.01" min="0" style={styles.input} placeholder="Ex: 550000.00" disabled={loading} />
            </div>
            <div style={{ ...styles.formGroup, flex: 1 }}>
              <label htmlFor="status" style={styles.label}>Status*</label>
              <select id="status" name="status" value={formData.status} onChange={handleChange} required style={styles.select} disabled={loading}>
                <option value="Em Lançamento">Em Lançamento</option>
                <option value="Em Obras">Em Obras</option>
                <option value="Entregue">Entregue</option>
              </select>
            </div>
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="previsao_entrega" style={styles.label}>Previsão de Entrega</label>
            <input type="date" id="previsao_entrega" name="previsao_entrega" value={formData.previsao_entrega} onChange={handleChange} style={styles.input} disabled={loading} />
          </div>
          {/* --- FIM DA SEÇÃO RESTAURADA --- */}


          <h3 style={styles.sectionTitle}>Mídia e Documentos</h3>

          <div style={styles.formGroup}>
            <label htmlFor="imageFiles" style={styles.label}>Imagens do Carrossel (selecione múltiplas)</label>
            <input
              type="file" id="imageFiles" name="imageFiles"
              onChange={handleImageFilesChange} style={styles.input}
              accept=".png,.jpg,.jpeg,.webp" multiple disabled={loading}
            />
            <div style={styles.imagePreviewContainer}>
              {formData.imagens.map((url, index) => (
                <div key={`existing-${index}`} style={styles.imagePreviewWrapper}>
                  <img src={`${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}${url}`} alt={`Imagem existente ${index + 1}`} style={styles.imagePreview} />
                </div>
              ))}
              {imageFiles.map((file, index) => (
                <div key={`new-${index}`} style={styles.imagePreviewWrapper}>
                  <img src={URL.createObjectURL(file)} alt={`Nova imagem ${index + 1}`} style={styles.imagePreview} />
                </div>
              ))}
            </div>
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="plantaFile" style={styles.label}>Planta do Empreendimento (PDF ou Imagem)</label>
            <input
              type="file" id="plantaFile" name="plantaFile"
              onChange={handlePlantaFileChange} style={styles.input}
              accept=".pdf,.png,.jpg,.jpeg" disabled={loading}
            />
            {uploading && <p style={styles.uploadingText}>Enviando arquivos...</p>}
            {!uploading && isEditMode && formData.planta_url && (
              <p style={styles.fileLink}>
                Planta atual: <a href={`${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}${formData.planta_url}`} target="_blank" rel="noopener noreferrer">Visualizar</a>
              </p>
            )}
          </div>

          <div style={styles.buttonGroup}>
            <button type="button" onClick={() => navigate('/empreendimentos')} disabled={loading} style={{ ...styles.button, ...styles.buttonCancel }}>
              <IconCancel /> Cancelar
            </button>
            <button type="submit" disabled={loading || uploading} style={{ ...styles.button, ...styles.buttonSubmit }}>
              <IconSave /> {loading || uploading ? 'Salvando...' : (isEditMode ? 'Salvar Alterações' : 'Criar Empreendimento')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Estilos
const styles = {
  pageContainer: { maxWidth: '800px', margin: '30px auto', padding: '0 20px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" },
  formCard: { backgroundColor: '#ffffff', padding: '30px 35px', borderRadius: '12px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' },
  title: { fontSize: '1.8em', color: '#2c3e50', marginBottom: '25px', fontWeight: 600, textAlign: 'center' },
  sectionTitle: { fontSize: '1.2em', color: '#34495e', marginTop: '25px', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '8px' },
  backLink: { display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#3498db', textDecoration: 'none', marginBottom: '20px', fontSize: '0.95em', fontWeight: 500 },
  form: { display: 'flex', flexDirection: 'column', gap: '18px' },
  formRow: { display: 'flex', gap: '15px', flexWrap: 'wrap' },
  formGroup: { display: 'flex', flexDirection: 'column', marginBottom: '5px' },
  label: { marginBottom: '6px', fontSize: '0.9em', color: '#34495e', fontWeight: 500 },
  input: { width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #bdc3c7', fontSize: '1em', boxSizing: 'border-box' },
  select: { width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #bdc3c7', fontSize: '1em', boxSizing: 'border-box', backgroundColor: 'white', height: '43px' },
  textarea: { width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #bdc3c7', fontSize: '1em', boxSizing: 'border-box', fontFamily: 'inherit', minHeight: '100px' },
  imagePreviewContainer: { display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px', padding: '10px', border: '1px dashed #ccc', borderRadius: '6px', minHeight: '80px' },
  imagePreviewWrapper: { position: 'relative', width: '100px', height: '100px' },
  imagePreview: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' },
  uploadingText: { fontSize: '0.85em', color: '#007bff', marginTop: '5px' },
  fileLink: { fontSize: '0.85em', color: '#555', marginTop: '5px' },
  errorMessage: { color: '#e74c3c', backgroundColor: '#fdeded', border: '1px solid #f5b7b1', padding: '12px', borderRadius: '6px', textAlign: 'center', fontSize: '0.9em', marginBottom: '15px' },
  successMessage: { color: '#155724', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', padding: '12px', borderRadius: '6px', textAlign: 'center', fontSize: '0.9em', marginBottom: '15px' },
  buttonGroup: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '25px', borderTop: '1px solid #eee', paddingTop: '20px' },
  button: { padding: '10px 20px', fontSize: '1em', cursor: 'pointer', borderRadius: '6px', border: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '6px' },
  buttonSubmit: { backgroundColor: '#28a745', color: 'white' },
  buttonCancel: { backgroundColor: '#6c757d', color: 'white' },
  centerMessage: { textAlign: 'center', padding: '40px 20px', fontSize: '1.1em', color: '#6c757d' },
  icon: { fontSize: '1em' },
   carouselImage: {
        maxHeight: '550px',
        objectFit: 'cover',
        imageRendering: 'high-quality', 
    },
};

export default EmpreendimentoFormPage;