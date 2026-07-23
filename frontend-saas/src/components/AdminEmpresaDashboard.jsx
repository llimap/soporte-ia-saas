import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function AdminEmpresaDashboard({ authData, onLogout }) {
  const [activeTab, setActiveTab] = useState('ia'); // 'usuarios', 'tickets', 'ia'

  // Estados: Gestión de Usuarios
  const [usuariosList, setUsuariosList] = useState([]);
  const [totalUsuarios, setTotalUsuarios] = useState(0);

  // Formulario Registrar Usuario (POST)
  const [regNombre, setRegNombre] = useState('');
  const [regCorreo, setRegCorreo] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRol, setRegRol] = useState('empleado');
  const [regMensaje, setRegMensaje] = useState('');
  const [regError, setRegError] = useState('');

  // Formulario Editar Usuario (PUT)
  const [selectedUserToEdit, setSelectedUserToEdit] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editCorreo, setEditCorreo] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRol, setEditRol] = useState('empleado');
  const [editUserMsg, setEditUserMsg] = useState('');
  const [editUserErr, setEditUserErr] = useState('');

  // Formulario Editar Perfil Propio (PUT)
  const [miNombre, setMiNombre] = useState(authData?.usuario?.nombre || '');
  const [miPassword, setMiPassword] = useState('');
  const [miPerfilMsg, setMiPerfilMsg] = useState('');
  const [miPerfilErr, setMiPerfilErr] = useState('');

  // Estados: Tickets y Filtros
  const [ticketsList, setTicketsList] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroPrioridad, setFiltroPrioridad] = useState('');
  
  // Formulario Crear Ticket (POST)
  const [tituloTicket, setTituloTicket] = useState('');
  const [descTicket, setDescTicket] = useState('');
  const [prioridadTicket, setPrioridadTicket] = useState('normal');
  const [estadoTicket, setEstadoTicket] = useState('Abierto');
  const [ticketMsg, setTicketMsg] = useState('');

  // Reporte Individual y Edición de Tickets
  const [ticketReporte, setTicketReporte] = useState(null);
  const [editTicketId, setEditTicketId] = useState(null);
  const [editTicketTitulo, setEditTicketTitulo] = useState('');
  const [editTicketDesc, setEditTicketDesc] = useState('');
  const [editTicketPrioridad, setEditTicketPrioridad] = useState('normal');
  const [editTicketEstado, setEditTicketEstado] = useState('Abierto');
  const [editTicketMsg, setEditTicketMsg] = useState('');

  // Estados: Diagnóstico IA Interactivo
  const [iaSelectedTicketId, setIaSelectedTicketId] = useState('');
  const [iaLoading, setIaLoading] = useState(false);
  const [iaData, setIaData] = useState(null);
  const [iaError, setIaError] = useState('');

  // Cargar Usuarios
  const fetchUsuarios = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/auth/usuarios', { headers: { Authorization: `Bearer ${token}` } });
      const data = res.data;
      const lista = data.usuarios || (Array.isArray(data) ? data : []);
      setUsuariosList(lista);
      setTotalUsuarios(lista.length);
    } catch (err) {
      setUsuariosList([]);
    }
  };

  // Cargar Tickets
  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = {};
      if (filtroEstado) params.estado = filtroEstado;
      if (filtroPrioridad) params.prioridad = filtroPrioridad;

      const response = await api.get('/tickets', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      const listaTickets = response.data.tickets || response.data; 
      const arrayFinal = Array.isArray(listaTickets) ? listaTickets : [];
      setTicketsList(arrayFinal);
      
      // Seleccionar por defecto el primer ticket si existe y no hay uno seleccionado
      if (arrayFinal.length > 0 && !iaSelectedTicketId) {
        setIaSelectedTicketId(arrayFinal[0].id);
      }
    } catch (error) {
      console.error("Error al cargar tickets:", error);
      setTicketsList([]);
    }
  };

// Función para consumir el endpoint de análisis de IA con el ticket seleccionado
  const fetchAnalisisIA = async () => {
    if (!iaSelectedTicketId) {
      setIaError('Por favor seleccione un ticket válido.');
      return;
    }
    setIaLoading(true);
    setIaError('');
    setIaData(null);
    try {
      const token = localStorage.getItem('token');
      const response = await api.post(`/tickets/${iaSelectedTicketId}/analizar-ia`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // 📍 AQUÍ ES DONDE TE SUGERÍ AGREGAR EL CONSOLE.LOG
      console.log("Respuesta exitosa de IA:", response.data); 
      
      setIaData(response.data);
    } catch (err) {
      // 📍 Y AQUÍ EL DE ERROR
      console.error("Error completo al analizar con IA:", err.response || err); 
      
      setIaError(err.response?.data?.error || err.response?.data?.mensaje || 'No se pudo conectar con el servicio de IA o el ticket no pertenece a la empresa.');
    } finally {
      setIaLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
    fetchTickets();
  }, [filtroEstado, filtroPrioridad]);

  // POST: Registrar Usuario
  const handleRegisterUser = async (e) => {
    e.preventDefault();
    setRegMensaje(''); setRegError('');
    try {
      const token = localStorage.getItem('token');
      await api.post('/auth/registro-usuario', {
        tenant_id: authData?.usuario?.tenant_id,
        nombre: regNombre,
        correo: regCorreo,
        password: regPassword,
        rol_sistema: regRol
      }, { headers: { Authorization: `Bearer ${token}` } });

      setRegMensaje('¡Usuario registrado exitosamente!');
      setRegNombre(''); setRegCorreo(''); setRegPassword('');
      fetchUsuarios();
    } catch (err) {
      setRegError(err.response?.data?.error || 'Error al registrar usuario');
    }
  };

  const handleSelectUser = (u) => {
    setSelectedUserToEdit(u);
    setEditNombre(u.nombre);
    setEditCorreo(u.correo);
    setEditPassword('');
    setEditRol(u.rol_sistema);
    setEditUserMsg(''); setEditUserErr('');
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setEditUserMsg(''); setEditUserErr('');
    try {
      const token = localStorage.getItem('token');
      const body = { nombre: editNombre, correo: editCorreo, rol_sistema: editRol };
      if (editPassword) body.password = editPassword;

      await api.put(`/auth/usuarios/${selectedUserToEdit.id}`, body, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditUserMsg('¡Usuario actualizado exitosamente!');
      fetchUsuarios();
    } catch (err) {
      setEditUserErr(err.response?.data?.error || 'Error al actualizar');
    }
  };

  const handleDeleteUser = async (u) => {
    if (window.confirm(`¿Seguro que deseas eliminar a ${u.nombre}?`)) {
      try {
        const token = localStorage.getItem('token');
        await api.delete(`/auth/usuarios/${u.id}`, { headers: { Authorization: `Bearer ${token}` } });
        fetchUsuarios();
      } catch (err) {
        alert('Error al eliminar usuario');
      }
    }
  };

  // PUT: Actualizar Mi Perfil
  const handleUpdateMyProfile = async (e) => {
    e.preventDefault();
    setMiPerfilMsg(''); setMiPerfilErr('');
    try {
      const token = localStorage.getItem('token');
      const body = { nombre: miNombre };
      if (miPassword) body.password = miPassword;

      await api.put(`/auth/perfil`, body, { headers: { Authorization: `Bearer ${token}` } });
      setMiPerfilMsg('¡Perfil actualizado con éxito!');
      setMiPassword('');
    } catch (err) {
      setMiPerfilErr('Error al actualizar perfil');
    }
  };

  // POST: Crear Ticket
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setTicketMsg('');
    try {
      const token = localStorage.getItem('token');
      await api.post('/tickets', {
        titulo: tituloTicket,
        descripcion_problema: descTicket,
        prioridad: prioridadTicket,
        estado: estadoTicket
      }, { headers: { Authorization: `Bearer ${token}` } });

      setTicketMsg('¡Ticket creado con éxito!');
      setTituloTicket(''); setDescTicket('');
      fetchTickets();
    } catch (err) {
      setTicketMsg('Error al crear ticket');
    }
  };

  // PUT: Actualizar Ticket
  const handleUpdateTicket = async (e) => {
    e.preventDefault();
    setEditTicketMsg('');
    try {
      const token = localStorage.getItem('token');
      await api.put(`/tickets/${editTicketId}`, {
        titulo: editTicketTitulo,
        descripcion_problema: editTicketDesc,
        prioridad: editTicketPrioridad,
        estado: editTicketEstado
      }, { headers: { Authorization: `Bearer ${token}` } });

      setEditTicketMsg('¡Ticket actualizado con éxito!');
      fetchTickets();
    } catch (err) {
      setEditTicketMsg('Error al actualizar ticket');
    }
  };

  return (
    <div className="admin-dashboard-container" style={{ padding: '20px', background: '#0b132b', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* Cabecera Principal */}
      <h2 style={{ textAlign: 'center', marginBottom: '15px', color: '#4cc9f0', letterSpacing: '1px' }}>PANEL DE ADMINISTRACIÓN DE EMPRESA</h2>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1c2541', padding: '12px 20px', borderRadius: '8px', marginBottom: '25px' }}>
        <div style={{ fontSize: '14px' }}>
          <span style={{ fontWeight: 'bold', color: '#4cc9f0' }}>Administrador:</span> {authData?.usuario?.nombre} ({authData?.usuario?.correo})
        </div>
        
        {/* Botones de Pestañas Superiores */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setActiveTab('usuarios')} 
            style={{ background: activeTab === 'usuarios' ? '#00b4d8' : '#1d3557', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
            Gestión de Personal
          </button>
          <button 
            onClick={() => setActiveTab('tickets')} 
            style={{ background: activeTab === 'tickets' ? '#00b4d8' : '#1d3557', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
            Gestión y Reportes de Entradas
          </button>
          <button 
            onClick={() => setActiveTab('ia')} 
            style={{ background: activeTab === 'ia' ? '#00b4d8' : '#1d3557', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
            Diagnósticos IA
          </button>
        </div>

        <button onClick={onLogout} style={{ background: '#f72585', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
          Cerrar Sesión
        </button>
      </div>

      {/* VISTA DE USUARIOS / GESTIÓN DE PERSONAL */}
      {activeTab === 'usuarios' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: '#1c2541', padding: '20px', borderRadius: '8px', border: '1px solid #2b3a67' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 style={{ margin: 0, color: '#fff' }}>Personal de la Empresa</h4>
                <span style={{ fontSize: '13px', color: '#4cc9f0' }}>Total: {totalUsuarios}</span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #48cae4', textAlign: 'left', color: '#8d99ae' }}>
                    <th style={{ padding: '10px 8px' }}>N°</th>
                    <th style={{ padding: '10px 8px' }}>Nombre</th>
                    <th style={{ padding: '10px 8px' }}>Correo</th>
                    <th style={{ padding: '10px 8px' }}>Rol</th>
                    <th style={{ padding: '10px 8px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosList.length > 0 ? (
                    usuariosList.map((u, index) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #2b3a67' }}>
                        <td style={{ padding: '10px 8px', color: '#4cc9f0' }}>{index + 1}</td>
                        <td style={{ padding: '10px 8px', fontWeight: 'bold' }}>{u.nombre}</td>
                        <td style={{ padding: '10px 8px', color: '#8d99ae' }}>{u.correo}</td>
                        <td style={{ padding: '10px 8px' }}>{u.rol_sistema}</td>
                        <td style={{ padding: '10px 8px', display: 'flex', gap: '6px' }}>
                          <button onClick={() => handleSelectUser(u)} style={{ background: '#00b4d8', color: '#0b132b', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Editor</button>
                          <button onClick={() => handleDeleteUser(u)} style={{ background: '#f72585', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Eliminar</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#8d99ae' }}>No hay usuarios registrados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ background: '#1c2541', padding: '20px', borderRadius: '8px', border: '1px solid #2b3a67', minHeight: '220px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#4cc9f0', fontSize: '14px' }}>Panel de Edición (Seleccione usuario)</h4>
              {selectedUserToEdit ? (
                <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input type="text" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} placeholder="Nombre" style={{ padding: '10px', background: '#0b132b', color: '#fff', border: '1px solid #2b3a67', borderRadius: '4px' }} required />
                  <input type="email" value={editCorreo} onChange={(e) => setEditCorreo(e.target.value)} placeholder="Correo" style={{ padding: '10px', background: '#0b132b', color: '#fff', border: '1px solid #2b3a67', borderRadius: '4px' }} required />
                  <input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="Nueva Contraseña (Opcional)" style={{ padding: '10px', background: '#0b132b', color: '#fff', border: '1px solid #2b3a67', borderRadius: '4px' }} />
                  <select value={editRol} onChange={(e) => setEditRol(e.target.value)} style={{ padding: '10px', background: '#0b132b', color: '#fff', border: '1px solid #2b3a67', borderRadius: '4px' }}>
                    <option value="empleado">empleado</option>
                    <option value="administrador_empresa">administrador_empresa</option>
                  </select>
                  <button type="submit" style={{ background: '#3a0ca3', color: '#fff', fontWeight: 'bold', padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Guardar Cambios</button>
                  {editUserMsg && <p style={{ color: '#4cc9f0', fontSize: '12px', margin: 0 }}>{editUserMsg}</p>}
                  {editUserErr && <p style={{ color: '#f72585', fontSize: '12px', margin: 0 }}>{editUserErr}</p>}
                </form>
              ) : (
                <p style={{ color: '#8d99ae', textAlign: 'center', marginTop: '50px', fontSize: '13px' }}>Haz clic en "Editor" en la tabla para modificar los datos de un usuario.</p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ background: '#1c2541', padding: '26px 20px', borderRadius: '8px', border: '1px solid #2b3a67' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#fff', fontSize: '15px' }}>Ranking: Reportes Asistidos por IA</h4>
              <div style={{ fontSize: '13px', marginBottom: '10px', fontWeight: 'bold' }}>{authData?.usuario?.nombre}</div>
              <div style={{ background: '#00b4d8', height: '8px', borderRadius: '4px', width: '100%' }}></div>
              <div style={{ textAlign: 'right', fontSize: '12px', color: '#4cc9f0', marginTop: '8px' }}>1 diagnósticos</div>
            </div>

            <div style={{ background: '#1c2541', padding: '15px 20px', borderRadius: '8px', border: '1px solid #2b3a67' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '14px' }}>Registrar Nuevo Empleado</h4>
              <form onSubmit={handleRegisterUser} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input type="text" placeholder="Nombre completo" value={regNombre} onChange={(e) => setRegNombre(e.target.value)} style={{ padding: '7px 10px', background: '#0b132b', color: '#fff', border: '1px solid #2b3a67', borderRadius: '4px', fontSize: '13px' }} required />
                <input type="email" placeholder="Correo electrónico" value={regCorreo} onChange={(e) => setRegCorreo(e.target.value)} style={{ padding: '7px 10px', background: '#0b132b', color: '#fff', border: '1px solid #2b3a67', borderRadius: '4px', fontSize: '13px' }} required />
                <input type="password" placeholder="Contraseña" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} style={{ padding: '7px 10px', background: '#0b132b', color: '#fff', border: '1px solid #2b3a67', borderRadius: '4px', fontSize: '13px' }} required />
                <select value={regRol} onChange={(e) => setRegRol(e.target.value)} style={{ padding: '7px 10px', background: '#0b132b', color: '#fff', borderRadius: '4px', border: '1px solid #2b3a67', fontSize: '13px' }}>
                  <option value="empleado">empleado</option>
                  <option value="administrador_empresa">administrador_empresa</option>
                </select>
                <button type="submit" style={{ background: '#2ec4b6', color: '#0b132b', fontWeight: 'bold', padding: '8px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>Registrar Usuario</button>
                {regMensaje && <p style={{ color: '#4cc9f0', fontSize: '11px', margin: 0 }}>{regMensaje}</p>}
                {regError && <p style={{ color: '#f72585', fontSize: '11px', margin: 0 }}>{regError}</p>}
              </form>
            </div>

            <div style={{ background: '#1c2541', padding: '15px 20px', borderRadius: '8px', border: '1px solid #2b3a67' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '14px' }}>Editar Mi Información Propia</h4>
              <form onSubmit={handleUpdateMyProfile} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input type="text" value={miNombre} onChange={(e) => setMiNombre(e.target.value)} style={{ padding: '7px 10px', background: '#0b132b', color: '#fff', border: '1px solid #2b3a67', borderRadius: '4px', fontSize: '13px' }} required />
                <input type="password" placeholder="Nueva Contraseña (Opcional)" value={miPassword} onChange={(e) => setMiPassword(e.target.value)} style={{ padding: '7px 10px', background: '#0b132b', color: '#fff', border: '1px solid #2b3a67', borderRadius: '4px', fontSize: '13px' }} />
                <button type="submit" style={{ background: '#00b4d8', color: '#0b132b', fontWeight: 'bold', padding: '8px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>Actualizar Mis Datos</button>
                {miPerfilMsg && <p style={{ color: '#4cc9f0', fontSize: '11px', margin: 0 }}>{miPerfilMsg}</p>}
                {miPerfilErr && <p style={{ color: '#f72585', fontSize: '11px', margin: 0 }}>{miPerfilErr}</p>}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* VISTA DE TICKETS */}
      {activeTab === 'tickets' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: '#1c2541', padding: '20px', borderRadius: '8px', border: '1px solid #2b3a67' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#fff', fontSize: '14px' }}>Crear Entrada / Ticket</h4>
              <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input type="text" placeholder="Título" value={tituloTicket} onChange={(e) => setTituloTicket(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #2b3a67', background: '#0b132b', color: '#fff' }} required />
                <textarea placeholder="Descripción del problema" value={descTicket} onChange={(e) => setDescTicket(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #2b3a67', background: '#0b132b', color: '#fff', minHeight: '70px' }} required />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select value={prioridadTicket} onChange={(e) => setPrioridadTicket(e.target.value)} style={{ flex: 1, padding: '10px', background: '#0b132b', color: '#fff', borderRadius: '4px', border: '1px solid #2b3a67' }}>
                    <option value="baja">Baja</option>
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                  <select value={estadoTicket} onChange={(e) => setEstadoTicket(e.target.value)} style={{ flex: 1, padding: '10px', background: '#0b132b', color: '#fff', borderRadius: '4px', border: '1px solid #2b3a67' }}>
                    <option value="Abierto">Abierto</option>
                    <option value="En proceso">En proceso</option>
                    <option value="Resuelto">Resuelto</option>
                    <option value="Cerrado">Cerrado</option>
                  </select>
                </div>
                <button type="submit" style={{ background: '#00b4d8', color: '#0b132b', fontWeight: 'bold', padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Guardar Entrada</button>
                {ticketMsg && <p style={{ fontSize: '12px', color: '#4cc9f0', margin: 0 }}>{ticketMsg}</p>}
              </form>
            </div>

            <div style={{ background: '#1c2541', padding: '20px', borderRadius: '8px', border: '1px solid #2b3a67' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 style={{ margin: 0, color: '#fff', fontSize: '14px' }}>Tickets de la empresa</h4>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={{ padding: '6px', background: '#0b132b', color: '#fff', borderRadius: '4px', fontSize: '12px', border: '1px solid #2b3a67' }}>
                    <option value="">Estado: Todos</option>
                    <option value="Abierto">Abierto</option>
                    <option value="En proceso">En proceso</option>
                    <option value="Resuelto">Resuelto</option>
                    <option value="Cerrado">Cerrado</option>
                  </select>
                  <select value={filtroPrioridad} onChange={(e) => setFiltroPrioridad(e.target.value)} style={{ padding: '6px', background: '#0b132b', color: '#fff', borderRadius: '4px', fontSize: '12px', border: '1px solid #2b3a67' }}>
                    <option value="">Prioridad: Todas</option>
                    <option value="baja">Baja</option>
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #48cae4', textAlign: 'left', color: '#8d99ae' }}>
                    <th style={{ padding: '10px 8px' }}>IDENTIFICACIÓN</th>
                    <th style={{ padding: '10px 8px' }}>Título / Creador</th>
                    <th style={{ padding: '10px 8px' }}>Estado</th>
                    <th style={{ padding: '10px 8px' }}>Prioridad</th>
                    <th style={{ padding: '10px 8px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketsList.length > 0 ? (
                    ticketsList.map((ticket) => (
                      <tr key={ticket.id} style={{ borderBottom: '1px solid #2b3a67' }}>
                        <td style={{ padding: '10px 8px', color: '#4cc9f0', fontWeight: 'bold' }}>#TK-{String(ticket.id).padStart(4, '0')}</td>
                        <td style={{ padding: '10px 8px' }}>
                          <div style={{ fontWeight: 'bold' }}>{ticket.titulo}</div>
                          <div style={{ fontSize: '11px', color: '#8d99ae' }}>Por: {ticket.creado_por}</div>
                        </td>
                        <td style={{ padding: '10px 8px' }}>{ticket.estado}</td>
                        <td style={{ padding: '10px 8px' }}>{ticket.prioridad}</td>
                        <td style={{ padding: '10px 8px' }}>
                          <button 
                            onClick={() => {
                              setTicketReporte(ticket);
                              setEditTicketId(ticket.id);
                              setEditTicketTitulo(ticket.titulo);
                              setEditTicketDesc(ticket.descripcion_problema);
                              setEditTicketPrioridad(ticket.prioridad);
                              setEditTicketEstado(ticket.estado);
                            }}
                            style={{ background: '#00b4d8', color: '#0b132b', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                            Ver / Editar
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#8d99ae' }}>No hay tickets registrados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background: '#1c2541', padding: '20px', borderRadius: '8px', border: '1px solid #2b3a67', minHeight: '520px' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#fff', fontSize: '14px' }}>Reporte Individual y Edición de Entrada</h4>
            {ticketReporte ? (
              <form onSubmit={handleUpdateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '15px' }}>
                <p style={{ fontSize: '12px', color: '#4cc9f0', margin: 0, fontWeight: 'bold' }}>Editando Entrada #TK-{String(editTicketId).padStart(4, '0')} (Creador: {ticketReporte.creado_por})</p>
                
                <label style={{ fontSize: '13px', color: '#8d99ae' }}>Título:</label>
                <input type="text" value={editTicketTitulo} onChange={(e) => setEditTicketTitulo(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #2b3a67', background: '#0b132b', color: '#fff' }} required />

                <label style={{ fontSize: '13px', color: '#8d99ae' }}>Descripción del problema:</label>
                <textarea value={editTicketDesc} onChange={(e) => setEditTicketDesc(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #2b3a67', background: '#0b132b', color: '#fff', minHeight: '100px' }} required />

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '13px', color: '#8d99ae' }}>Prioridad:</label>
                    <select value={editTicketPrioridad} onChange={(e) => setEditTicketPrioridad(e.target.value)} style={{ width: '100%', padding: '10px', background: '#0b132b', color: '#fff', borderRadius: '4px', border: '1px solid #2b3a67' }}>
                      <option value="baja">Baja</option>
                      <option value="normal">Normal</option>
                      <option value="alta">Alta</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '13px', color: '#8d99ae' }}>Estado:</label>
                    <select value={editTicketEstado} onChange={(e) => setEditTicketEstado(e.target.value)} style={{ width: '100%', padding: '10px', background: '#0b132b', color: '#fff', borderRadius: '4px', border: '1px solid #2b3a67' }}>
                      <option value="Abierto">Abierto</option>
                      <option value="En proceso">En proceso</option>
                      <option value="Resuelto">Resuelto</option>
                      <option value="Cerrado">Cerrado</option>
                    </select>
                  </div>
                </div>

                <button type="submit" style={{ background: '#3a0ca3', color: '#fff', fontWeight: 'bold', padding: '11px', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}>
                  Actualizar Todo el Ticket (PUT)
                </button>
                {editTicketMsg && <p style={{ fontSize: '12px', color: '#4cc9f0', margin: 0 }}>{editTicketMsg}</p>}

                {ticketReporte.sugerencia_generada && (
                  <div style={{ background: '#0b132b', padding: '12px', borderRadius: '6px', marginTop: '15px', border: '1px solid #48cae4' }}>
                    <strong style={{ color: '#48cae4', fontSize: '13px' }}>Sugerencia de Inteligencia Artificial:</strong>
                    <p style={{ fontSize: '13px', margin: '5px 0 0 0' }}>{ticketReporte.sugerencia_generada}</p>
                  </div>
                )}
              </form>
            ) : (
              <p style={{ color: '#8d99ae', textAlign: 'center', marginTop: '120px', fontSize: '14px', lineHeight: '1.6' }}>
                Busque un boleto por título o haga clic en "Ver / Editar" en la tabla de la izquierda para modificar título, descripción, estado o prioridad.
              </p>
            )}
          </div>
        </div>
      )}

      {/* VISTA DE DIAGNÓSTICOS IA INTERACTIVA */}
      {activeTab === 'ia' && (
        <div style={{ background: '#1c2541', padding: '25px', borderRadius: '8px', border: '1px solid #2b3a67' }}>
          <h3 style={{ color: '#fff', margin: '0 0 15px 0' }}>Diagnósticos de Inteligencia Artificial</h3>
          
          {/* Selector de Tickets y Botón de Análisis */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center', background: '#0b132b', padding: '15px', borderRadius: '6px', border: '1px solid #2b3a67' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '12px', color: '#8d99ae', fontWeight: 'bold' }}>Seleccionar Ticket a Analizar:</label>
              <select 
                value={iaSelectedTicketId} 
                onChange={(e) => setIaSelectedTicketId(e.target.value)}
                style={{ padding: '10px', background: '#1c2541', color: '#fff', borderRadius: '4px', border: '1px solid #48cae4', fontSize: '14px' }}>
                <option value="">-- Seleccione una entrada --</option>
                {ticketsList.map((t) => (
                  <option key={t.id} value={t.id}>
                    #TK-{String(t.id).padStart(4, '0')} - {t.titulo} ({t.estado})
                  </option>
                ))}
              </select>
            </div>

            <button 
              onClick={fetchAnalisisIA}
              disabled={iaLoading || !iaSelectedTicketId}
              style={{ background: '#00b4d8', color: '#0b132b', border: 'none', padding: '11px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', marginTop: '18px', opacity: (iaLoading || !iaSelectedTicketId) ? 0.6 : 1 }}>
              {iaLoading ? 'Analizando con IA...' : 'Ejecutar Análisis IA'}
            </button>
          </div>

          {iaLoading && (
            <p style={{ color: '#4cc9f0', textAlign: 'center', padding: '40px' }}>Conectando con la IA de Gemini y generando diagnóstico estructurado...</p>
          )}

          {iaError && (
            <div style={{ background: '#3a0ca3', padding: '15px', borderRadius: '6px', color: '#f72585', border: '1px solid #f72585', marginBottom: '15px' }}>
              {iaError}
            </div>
          )}

          {/* Bloque único y unificado para mostrar el resultado sin duplicaciones */}
          {!iaLoading && iaData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#0b132b', padding: '12px 18px', borderRadius: '6px', border: '1px solid #2b3a67', fontSize: '13px' }}>
                <div><span style={{ color: '#4cc9f0', fontWeight: 'bold' }}>Mensaje:</span> {iaData.mensaje || 'Análisis completado exitosamente'}</div>
                <div><span style={{ color: '#4cc9f0', fontWeight: 'bold' }}>Tokens utilizados:</span> {iaData.diagnostico?.tokens_utilizados || iaData.tokens_utilizados || 'N/D'}</div>
              </div>

              {/* Espacio dedicado para la respuesta formateada */}
              <div style={{ background: '#0b132b', padding: '20px', borderRadius: '6px', border: '1px solid #48cae4', whiteSpace: 'pre-line', lineHeight: '1.6', fontSize: '14px', color: '#e2e8f0' }}>
                {iaData.diagnostico?.sugerencia_generada || iaData.sugerencia_generada || (typeof iaData === 'string' ? iaData : JSON.stringify(iaData, null, 2))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}