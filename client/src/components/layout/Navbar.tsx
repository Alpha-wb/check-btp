import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Bell, Menu, X, Shield, LayoutDashboard, FileText } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isAdmin = user?.role === 'superadmin';
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className="bg-gradient-to-r from-accent via-[#1a2638] to-accent text-white shadow-xl sticky top-0 z-50 border-b border-white/5 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-3 no-underline group">
          <div className="w-10 h-10 bg-white/5 group-hover:bg-white/10 rounded-xl flex items-center justify-center transition border border-white/10">
            <img src="/logo-alpha-isi-mark.svg" alt="GROUPE ALPHA ISI" className="w-7 h-7" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xl font-bold text-white">Check <span className="text-primary">BTP</span></span>
            <span className="hidden sm:inline text-[10px] text-gray-400 -mt-0.5">par GROUPE ALPHA I.S.I</span>
          </div>
        </Link>

        {user && (
          <>
            <div className="hidden md:flex items-center gap-1">
              <Link to="/dashboard" className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition no-underline ${isActive('/dashboard') ? 'bg-primary/15 text-primary' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>
                <LayoutDashboard size={16} /> Tableau de bord
              </Link>
              <Link to="/reports" className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition no-underline ${isActive('/reports') ? 'bg-primary/15 text-primary' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>
                <FileText size={16} /> Rapports
              </Link>
              {isAdmin && (
                <Link to="/admin" className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition no-underline ${isActive('/admin') ? 'bg-amber-500/20 text-amber-400' : 'text-amber-400/80 hover:text-amber-400 hover:bg-amber-500/10'}`}>
                  <Shield size={16} /> Administration
                </Link>
              )}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <button className="text-gray-400 hover:text-white transition relative p-2 hover:bg-white/5 rounded-lg">
                <Bell size={18} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
              </button>
              <div className="flex items-center gap-2.5 pl-3 border-l border-white/10">
                <div className={`w-9 h-9 ${isAdmin ? 'bg-gradient-to-br from-amber-500 to-amber-600' : 'bg-gradient-to-br from-primary to-primary-dark'} rounded-full flex items-center justify-center text-sm font-semibold shadow-md`}>
                  {isAdmin ? <Shield size={15} /> : <>{user.first_name[0]}{user.last_name[0]}</>}
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-medium text-white">{user.first_name}</span>
                  <span className="text-[10px] text-gray-400">
                    {isAdmin ? 'Super Admin' : user.role === 'moe' ? "Maître d'œuvre" : user.role === 'moa' ? "Maître d'ouvrage" : 'Entreprise'}
                  </span>
                </div>
                <button onClick={handleLogout} className="text-gray-400 hover:text-white hover:bg-white/5 p-2 rounded-lg transition ml-1" title="Déconnexion">
                  <LogOut size={16} />
                </button>
              </div>
            </div>

            <button className="md:hidden text-white p-2 hover:bg-white/5 rounded-lg" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </>
        )}

        {!user && (
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-gray-300 hover:text-white text-sm no-underline px-3 py-2">Connexion</Link>
            <Link to="/register" className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg no-underline transition shadow-lg shadow-primary/20 text-sm font-medium">Inscription</Link>
          </div>
        )}
      </div>

      {menuOpen && user && (
        <div className="md:hidden bg-accent border-t border-white/10 px-4 py-3 space-y-1">
          <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-white/5 px-3 py-2.5 rounded-lg no-underline">
            <LayoutDashboard size={16} /> Tableau de bord
          </Link>
          <Link to="/reports" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-white/5 px-3 py-2.5 rounded-lg no-underline">
            <FileText size={16} /> Rapports
          </Link>
          {isAdmin && (
            <Link to="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 text-amber-400 hover:bg-white/5 px-3 py-2.5 rounded-lg no-underline">
              <Shield size={16} /> Administration
            </Link>
          )}
          <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-white px-3 py-2.5 w-full text-left">
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      )}
    </nav>
  );
}
