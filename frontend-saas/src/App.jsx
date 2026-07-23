import React, { useState } from 'react';
import { LayoutDashboard, Ticket, Users, Settings, LogOut, ShieldAlert, CheckCircle2, Clock, Lock, Mail, ArrowRight } from 'lucide-react';

export default function App() {
  // Estado para saber si el usuario ha iniciado sesión
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogin = (e) => {
    e.preventDefault();
    // Aquí después conectaremos con tu backend (POST /api/auth/login)
    if (email && password) {
      setIsAuthenticated(true);
    } else {
      alert('Por favor ingresa correo y contraseña');
    }
  };

  // 1. SI NO ESTÁ AUTENTICADO, MUESTRA LA PANTALLA DE LOGIN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans px-4">
        <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 p-8 rounded-2xl shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30 mx-auto mb-4 text-xl">
              S
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              SoportePro IA
            </h2>
            <p className="text-slate-400 text-sm mt-1">Inicia sesión para gestionar tus tickets</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Correo Electrónico</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@empresa.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Contraseña</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 text-sm"
            >
              <span>Iniciar Sesión</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. SI YA ESTÁ AUTENTICADO, MUESTRA EL PANEL GENERAL
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      {/* Sidebar Lateral */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
            S
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            SoportePro IA
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard size={20} />
            <span className="font-medium text-sm">Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('tickets')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'tickets'
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <Ticket size={20} />
            <span className="font-medium text-sm">Tickets IA</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => setIsAuthenticated(false)}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all text-sm"
          >
            <LogOut size={20} />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-base font-semibold capitalize tracking-wide text-slate-200">
            {activeTab === 'dashboard' ? 'Panel General' : 'Gestión de Tickets'}
          </h1>
          <div className="flex items-center space-x-4">
            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Sistema Conectado
            </span>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
          {activeTab === 'dashboard' ? (
            <>
              {/* Tarjetas de Estadísticas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-medium text-slate-400">Total Tickets</p>
                      <h3 className="text-3xl font-bold text-slate-100 mt-2">24</h3>
                    </div>
                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                      <Ticket size={22} />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-medium text-slate-400">Resueltos por IA</p>
                      <h3 className="text-3xl font-bold text-slate-100 mt-2">18</h3>
                    </div>
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                      <CheckCircle2 size={22} />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-medium text-slate-400">En Espera</p>
                      <h3 className="text-3xl font-bold text-slate-100 mt-2">6</h3>
                    </div>
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                      <Clock size={22} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección de Bienvenida */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-xl">
                <h2 className="text-lg font-bold text-slate-100 mb-2">Bienvenido a tu SaaS de Soporte con IA</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Ahora el flujo inicia correctamente desde el login. A partir de aquí podemos estructurar el consumo de tokens de la IA y separar las vistas por roles (Admin vs Empresa).
                </p>
              </div>
            </>
          ) : (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-xl">
              <h2 className="text-lg font-bold text-slate-100 mb-4">Módulo de Tickets y Chat IA</h2>
              <p className="text-slate-400 text-sm">Aquí integraremos la ventana del chat inteligente y las respuestas automatizadas.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}