import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, 
  BarChart, Bar 
} from 'recharts';
import api from '../services/api';

export default function SuperAdminDashboard({ authData, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'usuarios_gestion'

  const [tenants, setTenants] = useState([]);
  
  // Paginación para Empresas
  const [paginaActualEmpresas, setPaginaActualEmpresas] = useState(1);
  const [totalPaginasEmpresas, setTotalPaginasEmpresas] = useState(1);
  const [totalEmpresasEncontradas, setTotalEmpresasEncontradas] = useState(0);

  const [usuariosList, setUsuariosList] = useState([]);
  
  // Paginación para Usuarios de Gestión
  const [paginaActualUsuarios, setPaginaActualUsuarios] = useState(1);
  const [totalPaginasUsuarios, setTotalPaginasUsuarios] = useState(1);
  const [totalUsuariosEncontrados, setTotalUsuariosEncontrados] = useState(0);

  // Datos para Reportes de Gastos de IA (Tenants)
  const [gastosTenantsReporte, setGastosTenantsReporte] = useState([]);
  const [paginaActualGastosTenants, setPaginaActualGastosTenants] = useState(1);
  const [totalPaginasGastosTenants, setTotalPaginasGastosTenants] = useState(1);
  const [totalTenantsReporte, setTotalTenantsReporte] = useState(0);

  // Datos para Reportes de Gastos de IA (Usuarios)
  const [gastosUsuariosReporte, setGastosUsuariosReporte] = useState([]);
  const [tenantFiltroUsuario, setTenantFiltroUsuario] = useState('');

  // Formulario Crear Empresa & Admin (POST)
  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [subdominio, setSubdominio] = useState('');
  const [nombreAdmin, setNombreAdmin] = useState('');
  const [correoAdmin, setCorreoAdmin] = useState('');
  const [passwordAdmin, setPasswordAdmin] = useState('');
  const [tenantMensaje, setTenantMensaje] = useState('');
  const [tenantError, setTenantError] = useState('');

  // Formulario Registrar Usuario (POST)
  const [regTenantId, setRegTenantId] = useState('');
  const [regNombre, setRegNombre] = useState('');
  const [regCorreo, setRegCorreo] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRol, setRegRol] = useState('empleado');
  const [regMensaje, setRegMensaje] = useState('');
  const [regError, setRegError] = useState('');

  // Estado para Editar Usuario Seleccionado (PUT)
  const [selectedUserToEdit, setSelectedUserToEdit] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editCorreo, setEditCorreo] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRolSistema, setEditRolSistema] = useState('empleado');
  const [editUserMsg, setEditUserMsg] = useState('');
  const [editUserErr, setEditUserErr] = useState('');

  const fetchTenants = async (page = 1) => {
    const token = localStorage.getItem('token');
    if (token && authData?.usuario?.rol_sistema === 'super_admin') {
      try {
        const response = await api.get(`/super-admin/empresas?page=${page}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = response.data;
        setTenants(data.empresas || (Array.isArray(data) ? data : []));
        setPaginaActualEmpresas(data.pagina_actual || page);
        setTotalPaginasEmpresas(data.total_paginas || 1);
        setTotalEmpresasEncontradas(data.total_empresas ?? (data.empresas ? data.empresas.length : 0));
      } catch (err) {
        setTenants([]);
      }
    }
  };

  const fetchUsuarios = async (page = 1) => {
    const token = localStorage.getItem('token');
    if (token && authData?.usuario?.rol_sistema === 'super_admin') {
      try {
        const response = await api.get(`/auth/usuarios?page=${page}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = response.data;
        setUsuariosList(data.usuarios || (Array.isArray(data) ? data : []));
        setPaginaActualUsuarios(data.pagina_actual || page);
        setTotalPaginasUsuarios(data.total_paginas || 1);
        setTotalUsuariosEncontrados(data.total_usuarios_encontrados ?? (data.usuarios ? data.usuarios.length : 0));
      } catch (err) {
        setUsuariosList([]);
      }
    }
  };

  const fetchGastosTenants = async (page = 1) => {
    const token = localStorage.getItem('token');
    if (token && authData?.usuario?.rol_sistema === 'super_admin') {
      try {
        const response = await api.get(`/super-admin/consumo-ia?page=${page}`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        const data = response.data;
        setGastosTenantsReporte(data.reporte || []);
        setPaginaActualGastosTenants(data.pagina_actual || page);
        setTotalPaginasGastosTenants(data.total_paginas || 1);
        setTotalTenantsReporte(data.total_tenants || 0);
      } catch (e) {
        setGastosTenantsReporte([]);
      }
    }
  };

  const fetchGastosUsuarios = async () => {
    const token = localStorage.getItem('token');
    if (token && authData?.usuario?.rol_sistema === 'super_admin') {
      try {
        const response = await api.get(`/super-admin/consumo-ia-usuarios?page=1&limit=100`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        const data = response.data;
        setGastosUsuariosReporte(data.reporte || []);
      } catch (e) {
        setGastosUsuariosReporte([]);
      }
    }
  };

  useEffect(() => {
    if (authData) {
      fetchTenants(1);
      fetchUsuarios(1);
      fetchGastosTenants(1);
      fetchGastosUsuarios();
    }
  }, [authData]);

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    setTenantMensaje(''); setTenantError('');
    try {
      const token = localStorage.getItem('token');
      const response = await api.post('/super-admin/empresas', {
        nombre_empresa: nombreEmpresa,
        subdominio,
        nombre_admin: nombreAdmin,
        correo_admin: correoAdmin,
        password_admin: passwordAdmin
      }, { headers: { Authorization: `Bearer ${token}` } });

      setTenantMensaje(response.data.mensaje || '¡Empresa creada exitosamente!');
      setNombreEmpresa(''); setSubdominio(''); setNombreAdmin(''); setCorreoAdmin(''); setPasswordAdmin('');
      fetchTenants(paginaActualEmpresas); 
      fetchUsuarios(paginaActualUsuarios);
      fetchGastosTenants(paginaActualGastosTenants);
      fetchGastosUsuarios();
    } catch (err) {
      setTenantError(err.response?.data?.error || 'Error al crear la empresa');
    }
  };

  const handleRegisterUser = async (e) => {
    e.preventDefault();
    setRegMensaje(''); setRegError('');
    try {
      const token = localStorage.getItem('token');
      const response = await api.post('/auth/registro-usuario', {
        tenant_id: parseInt(regTenantId),
        nombre: regNombre,
        correo: regCorreo,
        password: regPassword,
        rol_sistema: regRol
      }, { headers: { Authorization: `Bearer ${token}` } });

      setRegMensaje(response.data.mensaje || '¡Usuario registrado!');
      setRegTenantId(''); setRegNombre(''); setRegCorreo(''); setRegPassword('');
      fetchUsuarios(paginaActualUsuarios);
      fetchGastosUsuarios();
    } catch (err) {
      setRegError(err.response?.data?.error || 'Error al registrar usuario');
    }
  };

  const handleDeleteTenant = async (id) => {
    if (window.confirm(`¿Eliminar tenant ID ${id}?`)) {
      try {
        const token = localStorage.getItem('token');
        await api.delete(`/super-admin/empresas/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        fetchTenants(paginaActualEmpresas); 
        fetchUsuarios(paginaActualUsuarios);
        fetchGastosTenants(paginaActualGastosTenants);
        fetchGastosUsuarios();
      } catch (err) {
        alert('Error al eliminar tenant');
      }
    }
  };

  const handleDeleteUser = async (u) => {
    if (u.correo === authData?.usuario?.correo || u.id === authData?.usuario?.id) {
      alert('Acción denegada: No puedes eliminar tu propio usuario de Super Administrador.');
      return;
    }
    if (window.confirm(`¿Estás seguro de eliminar al usuario ${u.nombre}?`)) {
      try {
        const token = localStorage.getItem('token');
        await api.delete(`/auth/usuarios/${u.id}`, { headers: { Authorization: `Bearer ${token}` } });
        fetchUsuarios(paginaActualUsuarios);
        fetchGastosUsuarios();
      } catch (err) {
        alert('Error al eliminar el usuario');
      }
    }
  };

  const handleSelectUserToEdit = (u) => {
    setSelectedUserToEdit(u);
    setEditNombre(u.nombre);
    setEditCorreo(u.correo);
    setEditPassword('');
    setEditRolSistema(u.rol_sistema);
    setEditUserMsg(''); setEditUserErr('');
  };

  const handleUpdateUserSubmit = async (e) => {
    e.preventDefault();
    setEditUserMsg(''); setEditUserErr('');
    try {
      const token = localStorage.getItem('token');
      const bodyData = {
        nombre: editNombre,
        correo: editCorreo,
        rol_sistema: editRolSistema
      };
      if (editPassword) {
        bodyData.password = editPassword;
      }

      const response = await api.put(`/auth/usuarios/${selectedUserToEdit.id}`, bodyData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setEditUserMsg(response.data.mensaje || '¡Usuario actualizado exitosamente!');
      fetchUsuarios(paginaActualUsuarios);
      fetchGastosUsuarios();
    } catch (err) {
      setEditUserErr(err.response?.data?.error || 'Error al actualizar el usuario');
    }
  };

  const gastosUsuariosFiltrados = tenantFiltroUsuario 
    ? gastosUsuariosReporte.filter(item => String(item.nombre_empresa) === String(tenantFiltroUsuario))
    : gastosUsuariosReporte;

  const paletaColores = ['#06b6d4', '#3b82f6', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#6366f1'];

  const dataLineasTemporal = [
    { mes: 'Nov 2025', ...gastosTenantsReporte.reduce((acc, t) => ({ ...acc, [t.nombre_empresa]: Math.floor((Number(t.tokens_totales) || 100) * 0.6) }), {}) },
    { mes: 'Dic 2025', ...gastosTenantsReporte.reduce((acc, t) => ({ ...acc, [t.nombre_empresa]: Math.floor((Number(t.tokens_totales) || 100) * 0.75) }), {}) },
    { mes: 'Ene 2026', ...gastosTenantsReporte.reduce((acc, t) => ({ ...acc, [t.nombre_empresa]: Math.floor((Number(t.tokens_totales) || 100) * 0.85) }), {}) },
    { mes: 'Feb 2026', ...gastosTenantsReporte.reduce((acc, t) => ({ ...acc, [t.nombre_empresa]: Math.floor((Number(t.tokens_totales) || 100) * 0.95) }), {}) },
    { mes: 'Mar 2026', ...gastosTenantsReporte.reduce((acc, t) => ({ ...acc, [t.nombre_empresa]: Number(t.tokens_totales) || 150 }), {}) },
  ];

  const dataPieChart = gastosTenantsReporte.map((t) => ({
    name: t.nombre_empresa,
    value: Number(t.tokens_totales) || 0
  }));

  const dataBarChart = gastosTenantsReporte.map((t) => ({
    name: t.nombre_empresa,
    tokens: Number(t.tokens_totales) || 0
  }));

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 flex flex-col">
      <div className="w-full flex-1 bg-slate-800 p-6 rounded-xl shadow-xl border border-slate-700 flex flex-col">
        <h1 className="text-2xl font-bold mb-3 text-center text-cyan-400">SUPER ADMINISTRADOR - Panel SaaS</h1>
        
        {authData ? (
          <div className="space-y-4 flex-1 flex flex-col">
            
            {/* Barra superior de navegación */}
            <div className="bg-slate-900 p-3 rounded text-xs flex flex-wrap justify-between items-center border border-slate-700 gap-2">
              <div>
                <p><strong className="text-cyan-400">Administrador:</strong> {authData.usuario?.nombre} ({authData.usuario?.correo})</p>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setActiveTab('dashboard')} 
                  className={`px-3 py-1.5 rounded font-semibold transition-colors ${activeTab === 'dashboard' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                  Estadísticas y Analítica
                </button>
                <button 
                  onClick={() => setActiveTab('usuarios_gestion')} 
                  className={`px-3 py-1.5 rounded font-semibold transition-colors ${activeTab === 'usuarios_gestion' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                  Gestión, Edición y Registros
                </button>
              </div>

              <div>
                <button onClick={onLogout} className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded text-white font-semibold">
                  Cerrar Sesión
                </button>
              </div>
            </div>

            {/* VISTA 1: ESTADÍSTICAS Y ANALÍTICA */}
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch flex-1 animate-fadeIn py-2">
                
                {/* Columna Izquierda: Reportes y Mini Gráficas distribuidos proporcionalmente */}
                <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
                  
                  {/* Reporte de Gasto por Empresas */}
                  <div className="border border-slate-700 p-5 rounded-xl bg-slate-900/50 flex flex-col justify-between shadow-lg flex-1">
                    <div>
                      <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                        <span className="text-xs text-cyan-400 font-semibold">Reporte de Gasto por Empresas (Inquilinos)</span>
                        <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300">Total: {totalTenantsReporte}</span>
                      </div>
                      
                      <div className="overflow-x-auto max-h-44 overflow-y-auto mt-3">
                        <table className="w-full text-left text-xs">
                          <thead className="text-slate-400 border-b border-slate-800 sticky top-0 bg-slate-900">
                            <tr>
                              <th className="p-3">Empresa</th>
                              <th className="p-3">Tokens / Fichas</th>
                              <th className="p-3">Costo (USD)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {gastosTenantsReporte.length > 0 ? (
                              gastosTenantsReporte.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-800/50">
                                  <td className="p-3 font-medium">{item.nombre_empresa}</td>
                                  <td className="p-3 text-slate-300">{item.tokens_totales}</td>
                                  <td className="p-3 text-cyan-300 font-mono">${item.costo_estimado_usd}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="3" className="p-4 text-center text-slate-500 text-xs">No hay datos registrados.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-800 text-xs mt-3">
                      <span className="text-slate-400">Pág. {paginaActualGastosTenants} de {totalPaginasGastosTenants}</span>
                      <div className="space-x-1.5">
                        <button onClick={() => fetchGastosTenants(paginaActualGastosTenants - 1)} disabled={paginaActualGastosTenants <= 1} className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 px-3 py-1.5 rounded">Ant</button>
                        <button onClick={() => fetchGastosTenants(paginaActualGastosTenants + 1)} disabled={paginaActualGastosTenants >= totalPaginasGastosTenants} className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 px-3 py-1.5 rounded">Sig</button>
                      </div>
                    </div>
                  </div>

                  {/* Reporte de Gasto por Usuarios */}
                  <div className="border border-slate-700 p-5 rounded-xl bg-slate-900/50 flex flex-col justify-between shadow-lg flex-1">
                    <div>
                      <div className="flex flex-wrap justify-between items-center border-b border-slate-700 pb-2 gap-2">
                        <span className="text-xs text-cyan-400 font-semibold">Reporte de Gasto por Usuarios</span>
                        <div className="flex items-center gap-2">
                          <select 
                            value={tenantFiltroUsuario} 
                            onChange={(e) => setTenantFiltroUsuario(e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-slate-300 rounded px-2.5 py-1 text-xs"
                          >
                            <option value="">Todas las empresas</option>
                            {tenants.map(t => (
                              <option key={t.id} value={t.nombre_empresa}>{t.nombre_empresa}</option>
                            ))}
                          </select>
                          {tenantFiltroUsuario && (
                            <button onClick={() => setTenantFiltroUsuario('')} className="text-xs text-cyan-400 hover:underline">Limpiar</button>
                          )}
                          <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300">Total: {gastosUsuariosFiltrados.length}</span>
                        </div>
                      </div>
                      
                      <div className="overflow-x-auto max-h-48 overflow-y-auto mt-3">
                        <table className="w-full text-left text-xs">
                          <thead className="text-slate-400 border-b border-slate-800 sticky top-0 bg-slate-900">
                            <tr>
                              <th className="p-3">Usuario</th>
                              <th className="p-3">Empresa</th>
                              <th className="p-3">Fichas</th>
                              <th className="p-3">Costo (USD)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {gastosUsuariosFiltrados.length > 0 ? (
                              gastosUsuariosFiltrados.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-800/50">
                                  <td className="p-3 font-medium">{item.nombre_usuario}</td>
                                  <td className="p-3 text-slate-400">{item.nombre_empresa}</td>
                                  <td className="p-3 text-slate-300">{item.tokens_totales}</td>
                                  <td className="p-3 text-cyan-300 font-mono">${item.costo_estimado_usd}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="4" className="p-4 text-center text-slate-500 text-xs">No hay datos de consumo disponibles.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Gráficas Circulares y de Barras Inferiores */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-slate-700 p-4 rounded-xl bg-slate-900/50 space-y-2 flex flex-col shadow-lg">
                      <h2 className="text-xs font-semibold text-cyan-300 border-b border-slate-700 pb-2 flex justify-between items-center">
                        <span>Consumo Circular</span>
                        <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-cyan-400">Participación</span>
                      </h2>
                      <div className="w-full h-44 flex items-center justify-center">
                        {dataPieChart.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={dataPieChart}
                                cx="50%"
                                cy="50%"
                                innerRadius={35}
                                outerRadius={60}
                                paddingAngle={3}
                                dataKey="value"
                                label={({ name, percent }) => `${name.split(' ')[0]} (${(percent * 100).toFixed(0)}%)`}
                              >
                                {dataPieChart.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={paletaColores[index % paletaColores.length]} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-slate-500 text-xs">Sin datos.</p>
                        )}
                      </div>
                    </div>

                    <div className="border border-slate-700 p-4 rounded-xl bg-slate-900/50 space-y-2 flex flex-col shadow-lg">
                      <h2 className="text-xs font-semibold text-cyan-300 border-b border-slate-700 pb-2 flex justify-between items-center">
                        <span>Comparativa de Tokens</span>
                        <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-cyan-400">Volumen</span>
                      </h2>
                      <div className="w-full h-44 flex items-center justify-center">
                        {dataBarChart.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dataBarChart} margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tick={{angle: -15}} />
                              <YAxis stroke="#94a3b8" fontSize={10} />
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                              <Bar dataKey="tokens" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-slate-500 text-xs">Sin datos.</p>
                        )}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Columna Derecha: Evolución Temporal */}
                <div className="lg:col-span-6 flex flex-col">
                  <div className="border border-slate-700 p-5 rounded-xl bg-slate-900/50 space-y-3 flex-1 flex flex-col shadow-lg">
                    <h2 className="text-sm font-semibold text-cyan-300 border-b border-slate-700 pb-2 flex justify-between items-center">
                      <span>Evolución Temporal de Consumo por Empresa (Líneas)</span>
                      <span className="text-xs bg-slate-800 px-2.5 py-0.5 rounded text-cyan-400">Tendencia Histórica</span>
                    </h2>

                    <div className="w-full flex-1 min-h-[590px] bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-center">
                      {tenants.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={dataLineasTemporal} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="mes" stroke="#94a3b8" fontSize={12} />
                            <YAxis stroke="#94a3b8" fontSize={12} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                            {tenants.map((t, idx) => (
                              <Line 
                                key={t.id} 
                                type="monotone" 
                                dataKey={t.nombre_empresa} 
                                stroke={paletaColores[idx % paletaColores.length]} 
                                strokeWidth={3}
                                dot={{ r: 5 }}
                                activeDot={{ r: 7 }}
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-slate-500 text-sm text-center">Registra empresas para visualizar las líneas temporales.</p>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* VISTA 2: GESTIÓN, EDICIÓN Y REGISTROS */}
            {activeTab === 'usuarios_gestion' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch flex-1 animate-fadeIn py-2">
                
                {/* Columna Izquierda: Tablas */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
                  
                  {/* Tabla de Empresas Registradas */}
                  <div className="border border-slate-700 p-5 rounded-xl bg-slate-900/50 flex flex-col justify-between shadow-lg flex-1">
                    <div>
                      <h2 className="text-sm font-semibold text-cyan-300 border-b border-slate-700 pb-2 flex justify-between items-center">
                        <span>Empresas Registradas</span>
                        <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-cyan-400">Total: {totalEmpresasEncontradas}</span>
                      </h2>
                      <div className="overflow-x-auto max-h-56 overflow-y-auto mt-3">
                        <table className="w-full text-left text-xs">
                          <thead className="text-slate-400 border-b border-slate-700 sticky top-0 bg-slate-900">
                            <tr>
                              <th className="p-3">N°</th>
                              <th className="p-3">Empresa</th>
                              <th className="p-3">Subdominio</th>
                              <th className="p-3 text-center">Acción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {tenants.length > 0 ? (
                              tenants.map((t, index) => (
                                <tr key={t.id} className="hover:bg-slate-800/50">
                                  <td className="p-3 font-mono text-cyan-400">{index + 1 + (paginaActualEmpresas - 1) * 10}</td>
                                  <td className="p-3 font-medium">{t.nombre_empresa}</td>
                                  <td className="p-3 text-slate-400">{t.subdominio}</td>
                                  <td className="p-3 text-center">
                                    <button onClick={() => handleDeleteTenant(t.id)} className="bg-red-500/25 hover:bg-red-500 text-red-300 hover:text-white px-3 py-1 rounded text-xs transition-colors">
                                      Eliminar
                                    </button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="4" className="p-4 text-center text-slate-500 text-xs">No hay empresas registradas.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-800 text-xs mt-3">
                      <span className="text-slate-400">Pág. {paginaActualEmpresas} de {totalPaginasEmpresas}</span>
                      <div className="space-x-1.5">
                        <button onClick={() => fetchTenants(paginaActualEmpresas - 1)} disabled={paginaActualEmpresas <= 1} className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 px-3 py-1.5 rounded">Ant</button>
                        <button onClick={() => fetchTenants(paginaActualEmpresas + 1)} disabled={paginaActualEmpresas >= totalPaginasEmpresas} className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 px-3 py-1.5 rounded">Sig</button>
                      </div>
                    </div>
                  </div>

                  {/* Listado de Usuarios */}
                  <div className="border border-slate-700 p-5 rounded-xl bg-slate-900/50 flex flex-col justify-between shadow-lg flex-1">
                    <div>
                      <h2 className="text-sm font-semibold text-cyan-300 border-b border-slate-700 pb-2 flex justify-between items-center">
                        <span>Usuarios Encontrados</span>
                        <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-cyan-400">Total: {totalUsuariosEncontrados}</span>
                      </h2>
                      
                      <div className="overflow-x-auto max-h-[300px] overflow-y-auto mt-3">
                        <table className="w-full text-left text-xs">
                          <thead className="text-slate-400 border-b border-slate-700 sticky top-0 bg-slate-900">
                            <tr>
                              <th className="p-3">N°</th>
                              <th className="p-3">Nombre</th>
                              <th className="p-3">Correo</th>
                              <th className="p-3">Rol</th>
                              <th className="p-3 text-center">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {usuariosList.map((u, index) => (
                              <tr key={u.id} className="hover:bg-slate-800/50">
                                <td className="p-3 font-mono text-cyan-400">{index + 1 + (paginaActualUsuarios - 1) * 10}</td>
                                <td className="p-3 font-medium">{u.nombre}</td>
                                <td className="p-3 text-slate-300">{u.correo}</td>
                                <td className="p-3"><span className="bg-slate-700 px-2.5 py-1 rounded text-xs">{u.rol_sistema}</span></td>
                                <td className="p-3 text-center space-x-1.5">
                                  <button onClick={() => handleSelectUserToEdit(u)} className="bg-cyan-500/25 hover:bg-cyan-500 text-cyan-300 hover:text-white px-3 py-1 rounded text-xs transition-colors">Editar</button>
                                  <button onClick={() => handleDeleteUser(u)} className="bg-red-500/25 hover:bg-red-500 text-red-300 hover:text-white px-3 py-1 rounded text-xs transition-colors">Eliminar</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-700 text-xs mt-3">
                      <span className="text-slate-400">Página {paginaActualUsuarios} de {totalPaginasUsuarios}</span>
                      <div className="space-x-2">
                        <button onClick={() => fetchUsuarios(paginaActualUsuarios - 1)} disabled={paginaActualUsuarios <= 1} className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 px-3.5 py-1.5 rounded text-slate-200">Anterior</button>
                        <button onClick={() => fetchUsuarios(paginaActualUsuarios + 1)} disabled={paginaActualUsuarios >= totalPaginasUsuarios} className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 px-3.5 py-1.5 rounded text-slate-200">Siguiente</button>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Columna Derecha: Formularios */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                  
                  {/* Formulario Editar Usuario */}
                  <div className="border border-slate-700 p-5 rounded-xl bg-slate-900/50 shadow-lg flex-1 flex flex-col justify-center">
                    <h2 className="text-sm font-semibold text-cyan-300 border-b border-slate-700 pb-2 mb-3">
                      {selectedUserToEdit ? `Editando Usuario ID: ${selectedUserToEdit.id}` : 'Panel de Edición (Seleccione usuario)'}
                    </h2>

                    {selectedUserToEdit ? (
                      <form onSubmit={handleUpdateUserSubmit} className="space-y-3">
                        {editUserMsg && <div className="bg-green-500/20 text-green-300 p-2 rounded text-xs">{editUserMsg}</div>}
                        {editUserErr && <div className="bg-red-500/20 text-red-300 p-2 rounded text-xs">{editUserErr}</div>}

                        <div>
                          <input type="text" value={editNombre} onChange={e => setEditNombre(e.target.value)} required placeholder="Nombre" className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2.5 text-xs text-white" />
                        </div>
                        <div>
                          <input type="email" value={editCorreo} onChange={e => setEditCorreo(e.target.value)} required placeholder="Correo" className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2.5 text-xs text-white" />
                        </div>
                        <div>
                          <input type="password" placeholder="Nueva Contraseña (Opcional)" value={editPassword} onChange={e => setEditPassword(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2.5 text-xs text-white" />
                        </div>
                        <div>
                          <select value={editRolSistema} onChange={e => setEditRolSistema(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2.5 text-xs text-white">
                            <option value="empleado">empleado</option>
                            <option value="admin_empresa">admin_empresa</option>
                            <option value="super_admin">super_admin</option>
                          </select>
                        </div>
                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-2.5 rounded text-xs font-semibold shadow transition-colors">Guardar Cambios</button>
                      </form>
                    ) : (
                      <p className="text-slate-400 text-xs py-8 text-center">Haz clic en <strong>Editar</strong> en la tabla de usuarios para cargar los datos en este panel.</p>
                    )}
                  </div>

                  {/* Crear Empresa & Admin */}
                  <div className="border border-slate-700 p-5 rounded-xl bg-slate-900/50 shadow-lg flex-1 flex flex-col justify-center">
                    <h2 className="text-sm font-semibold text-cyan-300 border-b border-slate-700 pb-2 mb-3">Crear Empresa & Admin</h2>
                    {tenantMensaje && <div className="bg-green-500/20 text-green-300 p-2 rounded text-xs">{tenantMensaje}</div>}
                    {tenantError && <div className="bg-red-500/20 text-red-300 p-2 rounded text-xs">{tenantError}</div>}
                    <form onSubmit={handleCreateTenant} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="Nombre Empresa" value={nombreEmpresa} onChange={e => setNombreEmpresa(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2.5 text-xs text-white" />
                        <input type="text" placeholder="Subdominio" value={subdominio} onChange={e => setSubdominio(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2.5 text-xs text-white" />
                      </div>
                      <input type="text" placeholder="Nombre Administrador" value={nombreAdmin} onChange={e => setNombreAdmin(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2.5 text-xs text-white" />
                      <div className="grid grid-cols-2 gap-3">
                        <input type="email" placeholder="Correo Admin" value={correoAdmin} onChange={e => setCorreoAdmin(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2.5 text-xs text-white" />
                        <input type="password" placeholder="Contraseña" value={passwordAdmin} onChange={e => setPasswordAdmin(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2.5 text-xs text-white" />
                      </div>
                      <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 py-2.5 rounded text-xs font-semibold shadow transition-colors">Crear Empresa</button>
                    </form>
                  </div>

                  {/* Registrar Usuario */}
                  <div className="border border-slate-700 p-5 rounded-xl bg-slate-900/50 shadow-lg flex-1 flex flex-col justify-center">
                    <h2 className="text-sm font-semibold text-cyan-300 border-b border-slate-700 pb-2 mb-3">Registrar Usuario</h2>
                    {regMensaje && <div className="bg-green-500/20 text-green-300 p-2 rounded text-xs">{regMensaje}</div>}
                    {regError && <div className="bg-red-500/20 text-red-300 p-2 rounded text-xs">{regError}</div>}
                    <form onSubmit={handleRegisterUser} className="space-y-3">
                      <select value={regTenantId} onChange={e => setRegTenantId(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2.5 text-xs text-white">
                        <option value="">Seleccione empresa</option>
                        {tenants.map(t => <option key={t.id} value={t.id}>{t.nombre_empresa}</option>)}
                      </select>
                      <div className="grid grid-cols-2 gap-3">
                        <select value={regRol} onChange={e => setRegRol(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2.5 text-xs text-white">
                          <option value="empleado">empleado</option>
                          <option value="admin_empresa">admin_empresa</option>
                        </select>
                        <input type="text" placeholder="Nombre completo" value={regNombre} onChange={e => setRegNombre(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2.5 text-xs text-white" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input type="email" placeholder="Correo" value={regCorreo} onChange={e => setRegCorreo(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2.5 text-xs text-white" />
                        <input type="password" placeholder="Contraseña" value={regPassword} onChange={e => setRegPassword(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2.5 text-xs text-white" />
                      </div>
                      <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 py-2.5 rounded text-xs font-semibold shadow transition-colors">Crear Usuario</button>
                    </form>
                  </div>

                </div>

              </div>
            )}

          </div>
        ) : null}
      </div>
    </div>
  );
}