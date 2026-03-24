import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { FICO_DEFINITIONS, PHASES, ETAPES_SUIVI } from '../data/ficoDefinitions';
import { ArrowLeft, CheckCircle, XCircle, Clock, Plus, ListChecks, ClipboardCheck } from 'lucide-react';

interface Control {
  id: string; fico_type: string; status: string; checked_at?: string; comments?: string;
  checker_first_name?: string; checker_last_name?: string;
}

export default function OperationDetail() {
  const { id } = useParams();
  const [operation, setOperation] = useState<any>(null);
  const [controls, setControls] = useState<Control[]>([]);
  const [activePhase, setActivePhase] = useState<string>(PHASES[0]);
  const [activeView, setActiveView] = useState<'fico' | 'suivi'>('fico');

  useEffect(() => {
    api.get(`/operations/${id}`).then(r => setOperation(r.data));
    loadControls();
  }, [id]);

  const loadControls = () => api.get(`/operations/${id}/controls`).then(r => setControls(r.data));

  const getControlForFico = (ficoType: string) => controls.find(c => c.fico_type === ficoType);

  const createControl = async (ficoType: string) => {
    await api.post(`/operations/${id}/controls`, { fico_type: ficoType });
    loadControls();
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'conforme': return <CheckCircle size={20} className="text-success" />;
      case 'non_conforme': return <XCircle size={20} className="text-danger" />;
      case 'en_attente': return <Clock size={20} className="text-warning" />;
      default: return <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />;
    }
  };

  const ficosForPhase = FICO_DEFINITIONS.filter(f => f.phase === activePhase);

  // Stats
  const total = FICO_DEFINITIONS.length;
  const filled = controls.length;
  const conforme = controls.filter(c => c.status === 'conforme').length;
  const nonConforme = controls.filter(c => c.status === 'non_conforme').length;

  if (!operation) return <div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link to={`/programs/${operation.program_id}`} className="text-gray-500 hover:text-primary flex items-center gap-1 mb-4 no-underline text-sm">
        <ArrowLeft size={16} /> Retour au programme
      </Link>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold text-accent">{operation.name}</h1>
        {operation.building && <p className="text-gray-500 mt-1">Bâtiment {operation.building} {operation.floor && `- Étage ${operation.floor}`}</p>}

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="text-center p-3 bg-bg rounded-xl">
            <p className="text-2xl font-bold text-accent">{total}</p>
            <p className="text-xs text-gray-500">Total FICO</p>
          </div>
          <div className="text-center p-3 bg-success/10 rounded-xl">
            <p className="text-2xl font-bold text-success">{conforme}</p>
            <p className="text-xs text-gray-500">Conformes</p>
          </div>
          <div className="text-center p-3 bg-danger/10 rounded-xl">
            <p className="text-2xl font-bold text-danger">{nonConforme}</p>
            <p className="text-xs text-gray-500">Non conformes</p>
          </div>
          <div className="text-center p-3 bg-warning/10 rounded-xl">
            <p className="text-2xl font-bold text-warning">{total - filled}</p>
            <p className="text-xs text-gray-500">Restants</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 bg-gray-200 rounded-full h-3 overflow-hidden">
          <div className="h-full bg-success rounded-full transition-all" style={{ width: `${total > 0 ? (conforme / total) * 100 : 0}%` }} />
        </div>
        <p className="text-sm text-gray-500 mt-1">{total > 0 ? Math.round((conforme / total) * 100) : 0}% de conformité</p>
      </div>

      {/* View toggle */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveView('fico')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${activeView === 'fico' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
          <ClipboardCheck size={16} /> Autocontrôles FICO
        </button>
        <button onClick={() => setActiveView('suivi')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${activeView === 'suivi' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
          <ListChecks size={16} /> Suivi Incontournable
        </button>
      </div>

      {activeView === 'suivi' && (
        <div className="space-y-4">
          {ETAPES_SUIVI.map(etape => (
            <div key={etape.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-accent text-white px-5 py-3 flex items-center justify-between">
                <h3 className="font-semibold text-sm">{etape.numero} - {etape.name}</h3>
                <span className="text-xs text-gray-400">{etape.items.length} points</span>
              </div>
              <div className="divide-y divide-gray-100">
                {etape.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-gray-300 rounded flex items-center justify-center text-xs cursor-pointer hover:border-success hover:bg-success/10 transition">
                      </div>
                      <span className="text-sm text-gray-700">{item.label}</span>
                    </div>
                    {item.delai && <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">{item.delai}</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeView === 'fico' && (
      <>
      {/* Phase tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {PHASES.map(phase => (
          <button key={phase} onClick={() => setActivePhase(phase)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activePhase === phase ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
            {phase}
          </button>
        ))}
      </div>

      {/* FICO list */}
      <div className="space-y-3">
        {ficosForPhase.map(fico => {
          const ctrl = getControlForFico(fico.type);
          return (
            <div key={fico.type} className="bg-white rounded-xl shadow-sm p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {ctrl ? statusIcon(ctrl.status) : <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />}
                <div>
                  <h3 className="font-semibold text-accent">{fico.type} - {fico.name}</h3>
                  <p className="text-sm text-gray-500">{fico.checks.length} points de contrôle</p>
                </div>
              </div>
              {ctrl ? (
                <Link to={`/controls/${ctrl.id}?fico=${fico.type}`} className="text-primary hover:text-primary-dark font-medium text-sm no-underline">
                  {ctrl.status === 'en_attente' ? 'Remplir' : 'Voir / Modifier'}
                </Link>
              ) : (
                <button onClick={() => createControl(fico.type)} className="text-primary hover:text-primary-dark font-medium text-sm flex items-center gap-1">
                  <Plus size={16} /> Créer
                </button>
              )}
            </div>
          );
        })}
      </div>
      </>
      )}
    </div>
  );
}
