import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Plus, MapPin, Calendar, Building2 } from 'lucide-react';

interface Program {
  id: string; name: string; address?: string; city?: string; status: string; start_date?: string; end_date?: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', city: '', description: '', start_date: '', end_date: '' });

  useEffect(() => { loadPrograms(); }, []);
  const loadPrograms = () => api.get('/programs').then(r => setPrograms(r.data));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/programs', form);
    setForm({ name: '', address: '', city: '', description: '', start_date: '', end_date: '' });
    setShowForm(false);
    loadPrograms();
  };

  const roleLabel = { superadmin: 'Super Admin', moa: "Maître d'ouvrage", moe: "Maître d'œuvre", entreprise: 'Entreprise' }[user?.role || 'moe'];
  const statusColors: Record<string, string> = { actif: 'bg-success', termine: 'bg-gray-400', suspendu: 'bg-warning' };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-accent">Tableau de bord</h1>
          <p className="text-gray-500 mt-1">Bienvenue {user?.first_name} - <span className="text-primary font-medium">{roleLabel}</span></p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-primary hover:bg-primary-dark text-white px-5 py-3 rounded-xl font-medium flex items-center gap-2 transition">
          <Plus size={20} /> Nouveau programme
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-accent mb-4">Créer un programme immobilier</h2>
          <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom du programme *</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" placeholder="Ex: Résidence Les Jardins" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
              <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
              <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
              <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-medium transition">Créer</button>
              <button type="button" onClick={() => setShowForm(false)} className="border border-gray-300 text-gray-600 px-6 py-3 rounded-lg hover:bg-gray-50 transition">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {programs.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <Building2 size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500">Aucun programme</h3>
          <p className="text-gray-400 mt-1">Créez votre premier programme immobilier pour commencer.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map(p => (
            <Link key={p.id} to={`/programs/${p.id}`} className="bg-white rounded-2xl shadow-sm hover:shadow-md p-6 transition no-underline group">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold text-accent group-hover:text-primary transition">{p.name}</h3>
                <span className={`${statusColors[p.status] || 'bg-gray-300'} text-white text-xs px-2 py-1 rounded-full`}>{p.status}</span>
              </div>
              {(p.address || p.city) && (
                <p className="text-gray-500 text-sm flex items-center gap-1 mb-2"><MapPin size={14} /> {p.address} {p.city}</p>
              )}
              {p.start_date && (
                <p className="text-gray-400 text-sm flex items-center gap-1"><Calendar size={14} /> {new Date(p.start_date).toLocaleDateString('fr-FR')}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
