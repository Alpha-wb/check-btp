import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { Download, BarChart3 } from 'lucide-react';

export default function Reports() {
  const [searchParams] = useSearchParams();
  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedProgram, setSelectedProgram] = useState(searchParams.get('program') || '');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => { api.get('/programs').then(r => setPrograms(r.data)); }, []);

  useEffect(() => {
    if (selectedProgram) {
      api.get(`/reports/program/${selectedProgram}`).then(r => setStats(r.data));
    }
  }, [selectedProgram]);

  const downloadPdf = () => {
    window.open(`/api/reports/program/${selectedProgram}/pdf`, '_blank');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-accent mb-8">Rapports et Statistiques</h1>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">Sélectionner un programme</label>
        <select value={selectedProgram} onChange={e => setSelectedProgram(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white">
          <option value="">-- Choisir un programme --</option>
          {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {stats && (
        <>
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
              <p className="text-3xl font-bold text-accent">{stats.operations}</p>
              <p className="text-gray-500 text-sm mt-1">Opérations</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
              <p className="text-3xl font-bold text-success">{stats.controls.conforme}</p>
              <p className="text-gray-500 text-sm mt-1">Conformes</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
              <p className="text-3xl font-bold text-danger">{stats.controls.nonConforme}</p>
              <p className="text-gray-500 text-sm mt-1">Non conformes</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
              <p className="text-3xl font-bold text-primary">{stats.conformityRate}%</p>
              <p className="text-gray-500 text-sm mt-1">Taux de conformité</p>
            </div>
          </div>

          {/* Progress visualization */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold text-accent mb-4">Conformité globale</h2>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                <div className="flex h-full">
                  <div className="bg-success h-full transition-all" style={{ width: `${stats.controls.total > 0 ? (stats.controls.conforme / stats.controls.total) * 100 : 0}%` }} />
                  <div className="bg-danger h-full transition-all" style={{ width: `${stats.controls.total > 0 ? (stats.controls.nonConforme / stats.controls.total) * 100 : 0}%` }} />
                  <div className="bg-warning h-full transition-all" style={{ width: `${stats.controls.total > 0 ? (stats.controls.enAttente / stats.controls.total) * 100 : 0}%` }} />
                </div>
              </div>
              <span className="text-sm text-gray-500 whitespace-nowrap">{stats.controls.total} contrôles</span>
            </div>
            <div className="flex gap-6 mt-3 text-sm">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-success rounded-full" /> Conforme</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-danger rounded-full" /> Non conforme</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-warning rounded-full" /> En attente</span>
            </div>
          </div>

          <button onClick={downloadPdf}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition">
            <Download size={20} /> Télécharger le rapport PDF
          </button>
        </>
      )}

      {!selectedProgram && (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <BarChart3 size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Sélectionnez un programme pour voir les statistiques.</p>
        </div>
      )}
    </div>
  );
}
