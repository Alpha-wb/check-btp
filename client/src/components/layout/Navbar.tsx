import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Bell, Menu, X, Shield } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isAdmin = user?.role === 'superadmin';

  return (
    <nav className="bg-accent text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-3 no-underline">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center font-bold text-white text-sm">C</div>
          <span className="text-xl font-bold text-white">Check <span className="text-primary">BTP</span></span>
          <span className="hidden lg:inline text-xs text-gray-500 ml-2">par GROUPE ALPHA ISI</span>
        </Link>

        {user && (
          <>
            <div className="hidden md:flex items-center gap-6">
              <Link to="/dashboard" className="text-gray-300 hover:text-white transition no-underline">Tableau de bord</Link>
              <Link to="/reports" className="text-gray-300 hover:text-white transition no-underline">Rapports</Link>
              {isAdmin && (
                <Link to="/admin" className="text-primary hover:text-primary-light transition no-underline flex items-center gap-1.5">
                  <Shield size={16} /> Administration
                </Link>
              )}
            </div>

            <div className="hidden md:flex items-center gap-4">
              <button className="text-gray-300 hover:text-white transition"><Bell size={20} /></button>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 ${isAdmin ? 'bg-amber-500' : 'bg-primary'} rounded-full flex items-center justify-center text-sm font-medium`}>
                  {isAdmin ? <Shield size={14} /> : <>{user.first_name[0]}{user.last_name[0]}</>}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-300">{user.first_name}</span>
                  {isAdmin && <span className="text-[10px] text-amber-400 leading-none">Super Admin</span>}
                </div>
              </div>
              <button onClick={handleLogout} className="text-gray-400 hover:text-white transition" title="Déconnexion"><LogOut size={18} /></button>
            </div>

            <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </>
        )}

        {!user && (
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-gray-300 hover:text-white no-underline">Connexion</Link>
            <Link to="/register" className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg no-underline transition">Inscription</Link>
          </div>
        )}
      </div>

      {menuOpen && user && (
        <div className="md:hidden bg-accent border-t border-gray-700 px-4 py-3 space-y-2">
          <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-white py-2 no-underline">Tableau de bord</Link>
          <Link to="/reports" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-white py-2 no-underline">Rapports</Link>
          {isAdmin && (
            <Link to="/admin" onClick={() => setMenuOpen(false)} className="block text-primary hover:text-primary-light py-2 no-underline flex items-center gap-1.5">
              <Shield size={16} /> Administration
            </Link>
          )}
          <button onClick={handleLogout} className="text-gray-400 hover:text-white py-2">Déconnexion</button>
        </div>
      )}
    </nav>
  );
}
