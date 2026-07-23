import React, { useState, useEffect } from 'react';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import AdminEmpresaDashboard from './components/AdminEmpresaDashboard';
import EmpleadoDashboard from './components/EmpleadoDashboard'; 
import api from './services/api';

/* ==========================================================
   COMPONENTE PRINCIPAL APP
   ========================================================== */
export default function App() {
  const [authData, setAuthData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados del formulario de Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargandoLogin, setCargandoLogin] = useState(false);

  // Verificar si hay una sesión activa al cargar la app
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('usuario');

    if (token && storedUser) {
      try {
        const usuario = JSON.parse(storedUser);
        setAuthData({ token, usuario });
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
      }
    }
    setLoading(false);
  }, []);

  // Manejar el inicio de sesión unificado para los 3 roles
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargandoLogin(true);

    try {
      const response = await api.post('/auth/login', {
        correo: email,
        password: password
      });

      const data = response.data;
      const rol = data.usuario?.rol_sistema;

      // Validar que el rol sea uno de los permitidos en este sistema
      if (!['super_admin', 'admin_empresa', 'empleado'].includes(rol)) {
        setError('Acceso denegado: Rol de sistema no reconocido.');
        setCargandoLogin(false);
        return;
      }

      // Guardar en localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));

      setAuthData({
        token: data.token,
        usuario: data.usuario
      });

      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciales incorrectas o error en el servidor.');
    } finally {
      setCargandoLogin(false);
    }
  };

  // Manejar el cierre de sesión
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setAuthData(null);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0b132b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Segoe UI, sans-serif' }}>
        <p style={{ color: '#4cc9f0', fontSize: '14px', fontWeight: 'bold' }}>Cargando aplicación...</p>
      </div>
    );
  }

  // Enrutar según el rol del usuario autenticado
  if (authData) {
    const rol = authData.usuario?.rol_sistema;
    
    if (rol === 'super_admin') {
      return <SuperAdminDashboard authData={authData} onLogout={handleLogout} />;
    } else if (rol === 'admin_empresa') {
      return <AdminEmpresaDashboard authData={authData} onLogout={handleLogout} />;
    } else if (rol === 'empleado') {
      return <EmpleadoDashboard user={authData.usuario} onLogout={handleLogout} />;
    }
  }

  // Pantalla de inicio de sesión mejorada visualmente
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0b132b 0%, #1c2541 100%)', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center', 
      fontFamily: 'Segoe UI, sans-serif',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      
      {/* CABECERA / IDENTIDAD DEL SAAS */}
      <div style={{ textAlign: 'center', marginBottom: '25px' }}>
        <div style={{ 
          width: '60px', 
          height: '60px', 
          background: 'linear-gradient(135deg, #00b4d8 0%, #3a0ca3 100%)', 
          borderRadius: '16px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 15px auto', 
          fontSize: '26px',
          boxShadow: '0 0 20px rgba(0,180,216,0.4)',
          border: '1px solid #90e0ef'
        }}>
          🛡️
        </div>
        <h1 style={{ color: '#fff', fontSize: '24px', margin: '0 0 5px 0', letterSpacing: '0.5px' }}>
          SaaS Support <span style={{ color: '#4cc9f0' }}>AI</span>
        </h1>
        <p style={{ color: '#8d99ae', fontSize: '13px', margin: 0 }}>
          Plataforma inteligente de gestión de incidencias y diagnóstico
        </p>
      </div>

      {/* TARJETA DE LOGIN */}
      <div style={{ 
        background: '#1c2541', 
        padding: '35px', 
        borderRadius: '12px', 
        border: '1px solid #2b3a67', 
        boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
        width: '100%',
        maxWidth: '400px',
        boxSizing: 'border-box'
      }}>
        
        <h2 style={{ color: '#fff', fontSize: '18px', marginTop: 0, marginBottom: '20px', textAlign: 'center' }}>
          Iniciar Sesión
        </h2>

        {error && (
          <div style={{ 
            background: '#3a0ca322', 
            border: '1px solid #f72585', 
            color: '#f72585', 
            padding: '10px', 
            borderRadius: '6px', 
            fontSize: '12px', 
            marginBottom: '20px', 
            textAlign: 'center' 
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#8d99ae', marginBottom: '6px', fontWeight: 'bold' }}>
              Correo Electrónico
            </label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              placeholder="correo@empresa.com"
              style={{ 
                width: '100%', 
                padding: '11px 14px', 
                background: '#0b132b', 
                color: '#fff', 
                borderRadius: '6px', 
                border: '1px solid #2b3a67', 
                boxSizing: 'border-box',
                fontSize: '13px',
                outline: 'none'
              }} 
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#8d99ae', marginBottom: '6px', fontWeight: 'bold' }}>
              Contraseña
            </label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
              style={{ 
                width: '100%', 
                padding: '11px 14px', 
                background: '#0b132b', 
                color: '#fff', 
                borderRadius: '6px', 
                border: '1px solid #2b3a67', 
                boxSizing: 'border-box',
                fontSize: '13px',
                outline: 'none'
              }} 
            />
          </div>

          <button 
            type="submit" 
            disabled={cargandoLogin}
            style={{ 
              background: 'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)', 
              color: '#0b132b', 
              border: 'none', 
              padding: '12px', 
              borderRadius: '6px', 
              cursor: cargandoLogin ? 'not-allowed' : 'pointer', 
              fontWeight: 'bold', 
              fontSize: '14px',
              marginTop: '10px',
              boxShadow: '0 4px 12px rgba(0,180,216,0.3)',
              transition: 'opacity 0.2s'
            }}
          >
            {cargandoLogin ? 'Verificando acceso...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>

      <div style={{ marginTop: '25px', color: '#8d99ae', fontSize: '12px', textAlign: 'center' }}>
        Sistema protegido con encriptación de tenant • Powered by Gemini AI
      </div>

    </div>
  );
}