import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function EmpleadoDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('tickets');
  const [ticketsList, setTicketsList] = useState([]);
  
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [paginaActual, setPaginaActual] = useState(1);
  const ticketsPorPagina = 5;

  const [modalDiagnosticoAbierto, setModalDiagnosticoAbierto] = useState(false);
  const [diagnosticoSeleccionado, setDiagnosticoSeleccionado] = useState(null);
  const [ticketSeleccionadoInfo, setTicketSeleccionadoInfo] = useState(null);
  const [cargandoDiagnosticoModal, setCargandoDiagnosticoModal] = useState(false);
  const [copiadoMensaje, setCopiadoMensaje] = useState(false);

  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevaDescripcion, setNuevaDescripcion] = useState('');
  const [nuevaPrioridad, setNuevaPrioridad] = useState('Normal');
  const [creandoTicket, setCreandoTicket] = useState(false);

  const [nombreEdit, setNombreEdit] = useState(user?.nombre || '');
  const [correoEdit, setCorreoEdit] = useState(user?.correo || '');
  const [passwordEdit, setPasswordEdit] = useState('');
  const [mensajePerfil, setMensajePerfil] = useState('');

  const [iaSelectedTicketId, setIaSelectedTicketId] = useState('');
  const [iaLoading, setIaLoading] = useState(false);
  const [iaData, setIaData] = useState(null);
  const [iaError, setIaError] = useState(null);

  useEffect(() => {
    cargarTickets();
  }, [filtroTipo]);

  useEffect(() => {
    setPaginaActual(1);
  }, [filtroTipo, filtroEstado]);

  const cargarTickets = async () => {
    try {
      const endpoint = filtroTipo === 'mios' ? '/tickets/mis-tickets' : '/tickets';
      const response = await api.get(endpoint);
      setTicketsList(response.data.tickets || response.data);
    } catch (error) {
      try {
        const response = await api.get('/tickets');
        const todos = response.data.tickets || response.data;
        if (filtroTipo === 'mios') {
          setTicketsList(todos.filter(t => t.usuario_id === user?.id));
        } else {
          setTicketsList(todos);
        }
      } catch (err) {
        console.error('Error al cargar tickets:', err);
      }
    }
  };

  const handleCrearTicket = async (e) => {
    e.preventDefault();
    if (!nuevoTitulo || !nuevaDescripcion) return;
    
    setCreandoTicket(true);
    try {
      await api.post('/tickets', { 
        titulo: nuevoTitulo, 
        descripcion_problema: nuevaDescripcion,
        prioridad: nuevaPrioridad 
      });
      setNuevoTitulo('');
      setNuevaDescripcion('');
      setNuevaPrioridad('Normal');
      cargarTickets();
      setActiveTab('tickets');
    } catch (error) {
      console.error('Error al crear ticket:', error);
    } finally {
      setCreandoTicket(false);
    }
  };

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      await api.put(`/tickets/${id}/estado`, { estado: nuevoEstado });
      cargarTickets();
    } catch (error) {
      console.error('Error al actualizar estado:', error);
    }
  };

  const abrirDiagnosticoModal = async (ticket) => {
    setTicketSeleccionadoInfo(ticket);
    setModalDiagnosticoAbierto(true);
    setCopiadoMensaje(false);
    
    const diagLocal = ticket.diagnostico || ticket.sugerencia_ia || ticket.analisis || ticket.sugerencia_generada;
    if (diagLocal) {
      setDiagnosticoSeleccionado(diagLocal);
      return;
    }

    setCargandoDiagnosticoModal(true);
    setDiagnosticoSeleccionado(null);
    try {
      const response = await api.post(`/tickets/${ticket.id}/analizar-ia`);
      const data = response.data;
      const textoDiag = data.diagnostico?.sugerencia_generada || data.sugerencia_generada || data.analisis || data.mensaje;
      setDiagnosticoSeleccionado(textoDiag);
    } catch (err) {
      console.error('No se pudo recuperar el diagnóstico automáticamente:', err);
      setDiagnosticoSeleccionado(null);
    } finally {
      setCargandoDiagnosticoModal(false);
    }
  };

  const reanalizarTicketModal = async () => {
    if (!ticketSeleccionadoInfo) return;
    setCargandoDiagnosticoModal(true);
    try {
      const response = await api.post(`/tickets/${ticketSeleccionadoInfo.id}/analizar-ia`);
      const data = response.data;
      const textoDiag = data.diagnostico?.sugerencia_generada || data.sugerencia_generada || data.analisis || data.mensaje;
      setDiagnosticoSeleccionado(textoDiag);
      cargarTickets();
    } catch (err) {
      console.error('Error al reanalizar:', err);
    } finally {
      setCargandoDiagnosticoModal(false);
    }
  };

  const copiarAlPortapapeles = () => {
    const texto = typeof diagnosticoSeleccionado === 'string' 
      ? diagnosticoSeleccionado 
      : (diagnosticoSeleccionado?.sugerencia_generada || JSON.stringify(diagnosticoSeleccionado));
    
    navigator.clipboard.writeText(texto);
    setCopiadoMensaje(true);
    setTimeout(() => setCopiadoMensaje(false), 2500);
  };

  const handleActualizarPerfil = async (e) => {
    e.preventDefault();
    try {
      await api.put('/auth/perfil', { nombre: nombreEdit, correo: correoEdit, password: passwordEdit });
      setMensajePerfil('¡Información actualizada con éxito!');
      setPasswordEdit('');
    } catch (error) {
      setMensajePerfil(error.response?.data?.error || 'Error al actualizar perfil');
    }
  };

  const fetchAnalisisIA = async () => {
    if (!iaSelectedTicketId) return;
    setIaLoading(true);
    setIaError(null);
    setIaData(null);

    try {
      const response = await api.post(`/tickets/${iaSelectedTicketId}/analizar-ia`);
      setIaData(response.data);
      cargarTickets();
    } catch (err) {
      setIaError(err.response?.data?.error || 'Error al conectar con la IA de Gemini');
    } finally {
      setIaLoading(false);
    }
  };

  const ticketsFiltrados = ticketsList.filter(t => {
    if (filtroEstado === 'todos') return true;
    const estadoTicket = (t.estado || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const estadoFiltro = filtroEstado.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return estadoTicket === estadoFiltro;
  });

  const totalPaginas = Math.ceil(ticketsFiltrados.length / ticketsPorPagina) || 1;
  const indiceUltimoTicket = paginaActual * ticketsPorPagina;
  const indicePrimerTicket = indiceUltimoTicket - ticketsPorPagina;
  const ticketsPaginados = ticketsFiltrados.slice(indicePrimerTicket, indiceUltimoTicket);

  return (
    <div style={{ minHeight: '100vh', background: '#0b132b', color: '#fff', padding: '20px 40px', fontFamily: 'Segoe UI, sans-serif', boxSizing: 'border-box' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1c2541', padding: '15px 25px', borderRadius: '8px', marginBottom: '25px', border: '1px solid #2b3a67', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
        <div>
          <h2 style={{ margin: 0, color: '#4cc9f0', fontSize: '20px' }}>Panel de Empleado</h2>
          <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#8d99ae' }}>
            Bienvenido, <strong style={{ color: '#fff' }}>{user?.nombre || 'Usuario'}</strong> ({user?.correo || user?.email})
          </p>
        </div>
        <button onClick={onLogout} style={{ background: '#f72585', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'filter 0.2s' }}>
          Cerrar Sesión
        </button>
      </div>

      {/* MENÚ DE NAVEGACIÓN */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', flexWrap: 'wrap' }}>
        {[
          { id: 'tickets', label: 'Ver Entradas' },
          { id: 'ia', label: 'Diagnósticos IA' },
          { id: 'estadisticas', label: '📊 Estadísticas y Costos' },
          { id: 'autogestion', label: '🛠️ Autogestión y Perfil' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)} 
            style={{ 
              background: activeTab === tab.id ? 'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)' : '#1c2541', 
              color: activeTab === tab.id ? '#0b132b' : '#fff', 
              border: activeTab === tab.id ? '1px solid #90e0ef' : '1px solid #2b3a67', 
              padding: '10px 20px', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              fontWeight: 'bold',
              boxShadow: activeTab === tab.id ? '0 0 10px rgba(0,180,216,0.4)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENEDOR CON ANIMACIÓN DE ENTRADA SUAVE */}
      <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>

        {/* VISTA 1: TABLA DE TICKETS */}
        {activeTab === 'tickets' && (
          <div style={{ background: '#1c2541', padding: '25px', borderRadius: '8px', border: '1px solid #2b3a67', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
              <h3 style={{ margin: 0, color: '#fff' }}>Gestión de Tickets</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} style={{ padding: '8px', background: '#0b132b', color: '#fff', borderRadius: '4px', border: '1px solid #48cae4', fontSize: '13px', cursor: 'pointer' }}>
                  <option value="todos">Todos los del Tenant</option>
                  <option value="mios">Solo Mis Tickets</option>
                </select>
                <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={{ padding: '8px', background: '#0b132b', color: '#fff', borderRadius: '4px', border: '1px solid #48cae4', fontSize: '13px', cursor: 'pointer' }}>
                  <option value="todos">Filtrar Estado: Todos</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="En proceso">En Proceso</option>
                  <option value="Resuelto">Resuelto</option>
                  <option value="Cerrado">Cerrado</option>
                </select>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#0b132b', color: '#48cae4', borderBottom: '2px solid #2b3a67' }}>
                    <th style={{ padding: '12px' }}>ID</th>
                    <th style={{ padding: '12px' }}>Título</th>
                    <th style={{ padding: '12px' }}>Descripción</th>
                    <th style={{ padding: '12px' }}>Prioridad</th>
                    <th style={{ padding: '12px' }}>Estado Actual</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Diagnóstico IA</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Cambiar Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketsPaginados.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: '#8d99ae' }}>No se encontraron tickets con los filtros seleccionados.</td>
                    </tr>
                  ) : (
                    ticketsPaginados.map((t) => (
                      <tr key={t.id} style={{ borderBottom: '1px solid #2b3a67', transition: 'background 0.2s' }}>
                        <td style={{ padding: '12px', color: '#4cc9f0', fontWeight: 'bold' }}>#{String(t.id).padStart(4, '0')}</td>
                        <td style={{ padding: '12px', fontWeight: '600', color: '#fff' }}>{t.titulo}</td>
                        <td style={{ padding: '12px', color: '#cbd5e1', maxWidth: '300px' }}>{t.descripcion_problema || t.descripcion}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', background: t.prioridad?.toLowerCase() === 'alta' ? '#f7258533' : '#48cae433', color: t.prioridad?.toLowerCase() === 'alta' ? '#f72585' : '#48cae4' }}>
                            {t.prioridad || 'Normal'}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', background: '#3a0ca3', color: '#f72585' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f72585', display: 'inline-block' }}></span>
                            {t.estado}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button onClick={() => abrirDiagnosticoModal(t)} style={{ background: '#48cae422', color: '#48cae4', border: '1px solid #48cae4', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>
                            Ver Diagnóstico
                          </button>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <select value={t.estado || 'Pendiente'} onChange={(e) => cambiarEstado(t.id, e.target.value)} style={{ padding: '6px 10px', background: '#0b132b', color: '#48cae4', borderRadius: '4px', border: '1px solid #48cae4', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                            <option value="Pendiente">Pendiente</option>
                            <option value="En proceso">En Proceso</option>
                            <option value="Resuelto">Resuelto</option>
                            <option value="Cerrado">Cerrado</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPaginas > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #2b3a67' }}>
                <span style={{ fontSize: '12px', color: '#8d99ae' }}>Mostrando del {indicePrimerTicket + 1} al {Math.min(indiceUltimoTicket, ticketsFiltrados.length)} de {ticketsFiltrados.length} tickets</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button onClick={() => setPaginaActual(p => Math.max(p - 1, 1))} disabled={paginaActual === 1} style={{ background: '#0b132b', color: '#48cae4', border: '1px solid #48cae4', padding: '6px 12px', borderRadius: '4px', cursor: paginaActual === 1 ? 'not-allowed' : 'pointer', opacity: paginaActual === 1 ? 0.5 : 1, fontSize: '12px', fontWeight: 'bold' }}>Anterior</button>
                  <span style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold', padding: '0 5px' }}>Página {paginaActual} de {totalPaginas}</span>
                  <button onClick={() => setPaginaActual(p => Math.min(p + 1, totalPaginas))} disabled={paginaActual === totalPaginas} style={{ background: '#0b132b', color: '#48cae4', border: '1px solid #48cae4', padding: '6px 12px', borderRadius: '4px', cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer', opacity: paginaActual === totalPaginas ? 0.5 : 1, fontSize: '12px', fontWeight: 'bold' }}>Siguiente</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VISTA 2: DIAGNÓSTICOS IA */}
        {activeTab === 'ia' && (
          <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px', alignItems: 'start' }}>
            
            <div style={{ background: '#1c2541', padding: '25px', borderRadius: '8px', border: '1px solid #2b3a67', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
              <h3 style={{ color: '#fff', margin: '0 0 15px 0', fontSize: '18px' }}>Control de Análisis IA</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#8d99ae', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Seleccionar Ticket:</label>
                  <select value={iaSelectedTicketId} onChange={(e) => setIaSelectedTicketId(e.target.value)} style={{ width: '100%', padding: '10px', background: '#0b132b', color: '#fff', borderRadius: '4px', border: '1px solid #48cae4', fontSize: '13px', boxSizing: 'border-box' }}>
                    <option value="">-- Seleccione una entrada --</option>
                    {ticketsList.map((t) => (
                      <option key={t.id} value={t.id}>#TK-{String(t.id).padStart(4, '0')} - {t.titulo}</option>
                    ))}
                  </select>
                </div>
                <button onClick={fetchAnalisisIA} disabled={iaLoading || !iaSelectedTicketId} style={{ background: '#00b4d8', color: '#0b132b', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', opacity: (iaLoading || !iaSelectedTicketId) ? 0.6 : 1 }}>
                  {iaLoading ? 'Analizando con IA...' : 'Ejecutar Análisis IA'}
                </button>
                <div style={{ background: '#0b132b', padding: '15px', borderRadius: '6px', border: '1px solid #2b3a67', marginTop: '10px' }}>
                  <span style={{ color: '#4cc9f0', fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>💡 Consejo IA</span>
                  <p style={{ margin: 0, fontSize: '12px', color: '#8d99ae', lineHeight: '1.4' }}>Selecciona cualquier incidencia activa para generar diagnósticos automáticos y recomendaciones de solución basadas en patrones técnicos.</p>
                </div>
              </div>
            </div>

            <div style={{ background: '#1c2541', padding: '25px', borderRadius: '8px', border: '1px solid #2b3a67', minHeight: '320px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
              <h3 style={{ color: '#fff', margin: '0 0 15px 0', fontSize: '18px' }}>Resultado del Diagnóstico</h3>
              {iaLoading && <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4cc9f0', padding: '40px' }}>Conectando con la IA de Gemini...</div>}
              {iaError && <div style={{ background: '#3a0ca3', padding: '15px', borderRadius: '6px', color: '#f72585', border: '1px solid #f72585', marginBottom: '15px' }}>{iaError}</div>}
              {!iaLoading && !iaData && !iaError && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#8d99ae', padding: '60px 20px', textAlign: 'center' }}>
                  <span style={{ fontSize: '32px', marginBottom: '10px' }}>🤖</span>
                  <p style={{ margin: 0, fontSize: '14px' }}>Selecciona un ticket y presiona "Ejecutar Análisis IA" para visualizar el informe técnico detallado aquí.</p>
                </div>
              )}
              {!iaLoading && iaData && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', background: '#0b132b', padding: '12px 18px', borderRadius: '6px', border: '1px solid #2b3a67', fontSize: '13px' }}>
                    <div><span style={{ color: '#4cc9f0', fontWeight: 'bold' }}>Estado:</span> {iaData.mensaje || 'Completado'}</div>
                    <div><span style={{ color: '#4cc9f0', fontWeight: 'bold' }}>Tokens:</span> {iaData.diagnostico?.tokens_utilizados || iaData.tokens_utilizados || '180'}</div>
                  </div>
                  <div style={{ background: '#0b132b', padding: '20px', borderRadius: '6px', border: '1px solid #48cae4', whiteSpace: 'pre-line', lineHeight: '1.6', fontSize: '14px', color: '#e2e8f0', flex: 1, overflowY: 'auto' }}>
                    {iaData.diagnostico?.sugerencia_generada || iaData.sugerencia_generada || (typeof iaData === 'string' ? iaData : JSON.stringify(iaData, null, 2))}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* VISTA 3: ESTADÍSTICAS Y COSTOS */}
        {activeTab === 'estadisticas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Fila superior: Métricas principales */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
              <div style={{ background: '#1c2541', padding: '20px', borderRadius: '8px', border: '1px solid #2b3a67', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                <span style={{ color: '#8d99ae', fontSize: '12px' }}>Tokens Consumidos (Histórico)</span>
                <h3 style={{ color: '#4cc9f0', margin: '8px 0 0 0', fontSize: '24px' }}>14,850</h3>
                <span style={{ color: '#48cae4', fontSize: '11px' }}>↑ 12% vs mes anterior</span>
              </div>
              <div style={{ background: '#1c2541', padding: '20px', borderRadius: '8px', border: '1px solid #2b3a67', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                <span style={{ color: '#8d99ae', fontSize: '12px' }}>Costo Estimado IA</span>
                <h3 style={{ color: '#f72585', margin: '8px 0 0 0', fontSize: '24px' }}>$0.45 USD</h3>
                <span style={{ color: '#8d99ae', fontSize: '11px' }}>Basado en modelo estándar</span>
              </div>
              <div style={{ background: '#1c2541', padding: '20px', borderRadius: '8px', border: '1px solid #2b3a67', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                <span style={{ color: '#8d99ae', fontSize: '12px' }}>Diagnósticos Realizados</span>
                <h3 style={{ color: '#4cc9f0', margin: '8px 0 0 0', fontSize: '24px' }}>38 consultas</h3>
                <span style={{ color: '#8d99ae', fontSize: '11px' }}>Tasa de éxito del 98%</span>
              </div>
            </div>

            {/* Centro: Gráfica de consumo */}
            <div style={{ background: '#1c2541', padding: '25px', borderRadius: '8px', border: '1px solid #2b3a67', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
              <h3 style={{ marginTop: 0, color: '#fff', fontSize: '18px', marginBottom: '5px' }}>Evolución de Consumo de Tokens (Últimos Días)</h3>
              <p style={{ color: '#8d99ae', fontSize: '13px', marginBottom: '25px' }}>Seguimiento temporal del uso de la IA de Gemini en tus análisis de incidencias.</p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '180px', padding: '15px 20px', background: '#0b132b', borderRadius: '6px', border: '1px solid #2b3a67' }}>
                {[
                  { dia: 'Lun', tokens: 1200, altura: '40%' },
                  { dia: 'Mar', tokens: 2400, altura: '75%' },
                  { dia: 'Mié', tokens: 900, altura: '30%' },
                  { dia: 'Jue', tokens: 3100, altura: '95%' },
                  { dia: 'Vie', tokens: 1800, altura: '55%' },
                  { dia: 'Sáb', tokens: 600, altura: '20%' },
                  { dia: 'Dom', tokens: 1500, altura: '50%' },
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end', flex: 1 }}>
                    <span style={{ fontSize: '10px', color: '#48cae4', fontWeight: 'bold' }}>{item.tokens}</span>
                    <div style={{ width: '36px', height: item.altura, background: 'linear-gradient(180deg, #4cc9f0 0%, #3a0ca3 100%)', borderRadius: '4px 4px 0 0', boxShadow: '0 0 8px rgba(76,201,240,0.3)' }}></div>
                    <span style={{ fontSize: '12px', color: '#8d99ae' }}>{item.dia}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fila inferior: Tarjetas secundarias con texto corregido */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ background: '#1c2541', padding: '20px', borderRadius: '8px', border: '1px solid #2b3a67', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                <div>
                  <span style={{ color: '#8d99ae', fontSize: '12px', display: 'block', marginBottom: '5px' }}>⚡ Eficiencia de Resolución con IA</span>
                  <h4 style={{ color: '#4cc9f0', margin: 0, fontSize: '20px' }}>94.2% de efectividad</h4>
                  <p style={{ color: '#cbd5e1', fontSize: '12px', margin: '5px 0 0 0' }}>Basado en la aceptación de sugerencias de los tickets cerrados.</p>
                </div>
                <div style={{ background: '#48cae422', border: '1px solid #48cae4', borderRadius: '50%', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  🎯
                </div>
              </div>

              <div style={{ background: '#1c2541', padding: '20px', borderRadius: '8px', border: '1px solid #2b3a67', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                <div>
                  <span style={{ color: '#8d99ae', fontSize: '12px', display: 'block', marginBottom: '5px' }}>🤖 Motor de IA Predominante</span>
                  <h4 style={{ color: '#f72585', margin: 0, fontSize: '20px' }}>Gemini Pro (Tenant v2)</h4>
                  <p style={{ color: '#cbd5e1', fontSize: '12px', margin: '5px 0 0 0' }}>Latencia promedio de respuesta: ~1.2 segundos.</p>
                </div>
                <div style={{ background: '#f7258522', border: '1px solid #f72585', borderRadius: '50%', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  🧠
                </div>
              </div>
            </div>

          </div>
        )}

        {/* VISTA 4: AUTOGESTIÓN Y PERFIL */}
        {activeTab === 'autogestion' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
            
            <div style={{ background: '#1c2541', padding: '25px', borderRadius: '8px', border: '1px solid #2b3a67', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
              <h3 style={{ marginTop: 0, color: '#fff', fontSize: '18px', marginBottom: '15px' }}>Crear Nuevo Ticket</h3>
              <form onSubmit={handleCrearTicket} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#8d99ae', marginBottom: '5px' }}>Título del Incidente</label>
                  <input type="text" value={nuevoTitulo} onChange={(e) => setNuevoTitulo(e.target.value)} placeholder="Ej: Error al conectar con la base de datos" style={{ width: '100%', padding: '10px', background: '#0b132b', color: '#fff', borderRadius: '4px', border: '1px solid #48cae4', boxSizing: 'border-box' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#8d99ae', marginBottom: '5px' }}>Descripción detallada</label>
                  <textarea value={nuevaDescripcion} onChange={(e) => setNuevaDescripcion(e.target.value)} placeholder="Explica el problema técnico..." rows="4" style={{ width: '100%', padding: '10px', background: '#0b132b', color: '#fff', borderRadius: '4px', border: '1px solid #48cae4', boxSizing: 'border-box' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#8d99ae', marginBottom: '5px' }}>Prioridad</label>
                  <select value={nuevaPrioridad} onChange={(e) => setNuevaPrioridad(e.target.value)} style={{ width: '100%', padding: '10px', background: '#0b132b', color: '#fff', borderRadius: '4px', border: '1px solid #48cae4', boxSizing: 'border-box' }}>
                    <option value="Baja">Baja</option>
                    <option value="Normal">Normal</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>
                <button type="submit" disabled={creandoTicket} style={{ background: '#00b4d8', color: '#0b132b', border: 'none', padding: '11px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>{creandoTicket ? 'Guardando...' : 'Registrar Ticket'}</button>
              </form>
            </div>

            <div style={{ background: '#1c2541', padding: '25px', borderRadius: '8px', border: '1px solid #2b3a67', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
              <h3 style={{ marginTop: 0, color: '#fff', fontSize: '18px', marginBottom: '15px' }}>Editar Mi Información Personal</h3>
              {mensajePerfil && <div style={{ background: '#0b132b', border: '1px solid #48cae4', color: '#4cc9f0', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '13px' }}>{mensajePerfil}</div>}
              <form onSubmit={handleActualizarPerfil} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#8d99ae', marginBottom: '5px' }}>Nombre Completo</label>
                  <input type="text" value={nombreEdit} onChange={(e) => setNombreEdit(e.target.value)} style={{ width: '100%', padding: '10px', background: '#0b132b', color: '#fff', borderRadius: '4px', border: '1px solid #48cae4', boxSizing: 'border-box' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#8d99ae', marginBottom: '5px' }}>Correo Electrónico</label>
                  <input type="email" value={correoEdit} onChange={(e) => setCorreoEdit(e.target.value)} style={{ width: '100%', padding: '10px', background: '#0b132b', color: '#fff', borderRadius: '4px', border: '1px solid #48cae4', boxSizing: 'border-box' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#8d99ae', marginBottom: '5px' }}>Nueva Contraseña (Opcional)</label>
                  <input type="password" value={passwordEdit} onChange={(e) => setPasswordEdit(e.target.value)} placeholder="Dejar en blanco para no cambiar" style={{ width: '100%', padding: '10px', background: '#0b132b', color: '#fff', borderRadius: '4px', border: '1px solid #48cae4', boxSizing: 'border-box' }} />
                </div>
                <button type="submit" style={{ background: '#00b4d8', color: '#0b132b', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', marginTop: '18px' }}>Actualizar Mis Datos</button>
              </form>
            </div>

          </div>
        )}

      </div>

      {/* MODAL DE DIAGNÓSTICO IA */}
      {modalDiagnosticoAbierto && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px', boxSizing: 'border-box' }}>
          <div style={{ background: '#1c2541', width: '100%', maxWidth: '1100px', maxHeight: '90vh', borderRadius: '10px', border: '1px solid #48cae4', padding: '30px', boxSizing: 'border-box', color: '#fff', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #2b3a67', paddingBottom: '12px', flexShrink: 0 }}>
              <div>
                <span style={{ background: '#48cae433', color: '#48cae4', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                  #{String(ticketSeleccionadoInfo?.id).padStart(4, '0')}
                </span>
                <h3 style={{ margin: '6px 0 0 0', color: '#fff', fontSize: '20px' }}>
                  {ticketSeleccionadoInfo?.titulo}
                </h3>
              </div>
              <button onClick={() => setModalDiagnosticoAbierto(false)} style={{ background: 'transparent', border: 'none', color: '#8d99ae', fontSize: '22px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '25px', flexGrow: 1, overflow: 'hidden' }}>
              
              <div style={{ background: '#0b132b', padding: '20px', borderRadius: '8px', border: '1px solid #2b3a67', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: '#8d99ae', display: 'block', fontSize: '11px' }}>ESTADO ACTUAL</span>
                    <span style={{ color: '#f72585', fontWeight: 'bold', fontSize: '14px' }}>{ticketSeleccionadoInfo?.estado}</span>
                  </div>
                  <div>
                    <span style={{ color: '#8d99ae', display: 'block', fontSize: '11px' }}>PRIORIDAD</span>
                    <span style={{ color: '#48cae4', fontWeight: 'bold', fontSize: '14px' }}>{ticketSeleccionadoInfo?.prioridad || 'Normal'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#8d99ae', display: 'block', fontSize: '11px' }}>DESCRIPCIÓN ORIGINAL</span>
                    <p style={{ margin: '6px 0 0 0', color: '#cbd5e1', fontSize: '13px', lineHeight: '1.5' }}>
                      {ticketSeleccionadoInfo?.descripcion_problema || ticketSeleccionadoInfo?.descripcion}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {copiadoMensaje && <span style={{ color: '#4cc9f0', fontSize: '12px', textAlign: 'center' }}>¡Copiado al portapapeles!</span>}
                  <button onClick={copiarAlPortapapeles} style={{ background: '#48cae422', color: '#48cae4', border: '1px solid #48cae4', padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                    📋 Copiar Diagnóstico
                  </button>
                  <button onClick={reanalizarTicketModal} disabled={cargandoDiagnosticoModal} style={{ background: '#3a0ca3', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                    🔄 {cargandoDiagnosticoModal ? 'Actualizando...' : 'Reanalizar con IA'}
                  </button>
                </div>
              </div>

              <div style={{ background: '#0b132b', padding: '25px', borderRadius: '8px', border: '1px solid #2b3a67', overflowY: 'auto', fontSize: '14px', lineHeight: '1.7', color: '#e2e8f0', whiteSpace: 'pre-line' }}>
                {cargandoDiagnosticoModal ? (
                  <p style={{ color: '#4cc9f0', textAlign: 'center', margin: '40px 0' }}>Consultando a la IA de Gemini...</p>
                ) : diagnosticoSeleccionado ? (
                  typeof diagnosticoSeleccionado === 'string' 
                    ? diagnosticoSeleccionado 
                    : (diagnosticoSeleccionado.sugerencia_generada || diagnosticoSeleccionado.analisis || JSON.stringify(diagnosticoSeleccionado, null, 2))
                ) : (
                  <span style={{ color: '#8d99ae', fontStyle: 'italic' }}>
                    Este ticket aún no cuenta con un diagnóstico de IA registrado. Puedes generarlo con el botón de "Reanalizar con IA".
                  </span>
                )}
              </div>

            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
              <button onClick={() => setModalDiagnosticoAbierto(false)} style={{ background: '#00b4d8', color: '#0b132b', border: 'none', padding: '10px 24px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}