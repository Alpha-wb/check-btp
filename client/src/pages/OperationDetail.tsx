import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { FICO_DEFINITIONS, PHASES, ETAPES_SUIVI } from '../data/ficoDefinitions';
import { ArrowLeft, CheckCircle, XCircle, Clock, Plus, ListChecks, ClipboardCheck, AlertTriangle, Calendar, Check } from 'lucide-react';

interface Control {
  id: string; fico_type: string; status: string; checked_at?: string; comments?: string;
}
interface SuiviCheck {
  etape_id: string; item_id: string; checked: number;
}
interface PlanningItem {
  fico_type: string; planned_date: string; actual_date?: string; fico_status?: string;
}
interface Alert {
  fico_type: string; planned_date: string; alert_level: string; fico_status: string;
}

export default function OperationDetail() {
  const { id } = useParams();
  const [operation, setOperation] = useState<any>(null);
  const [controls, setControls] = useState<Control[]>([]);
  const [suiviChecks, setSuiviChecks] = useState<SuiviCheck[]>([]);
  const [planning, setPlanning] = useState<PlanningItem[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activePhase, setActivePhase] = useState<string>(PHASES[0]);
  const [activeView, setActiveView] = useState<'fico' | 'suivi' | 'planning'>('fico');
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [dateValue, setDateValue] = useState('');

  useEffect(() => {
    api.get(`/operations/${id}`).then(r => setOperation(r.data));
    loadControls();
    loadSuivi();
    loadPlanning();
    loadAlerts();
  }, [id]);

  const loadControls = () => api.get(`/operations/${id}/controls`).then(r => setControls(r.data));
  const loadSuivi = () => api.get(`/operations/${id}/suivi`).then(r => setSuiviChecks(r.data));
  const loadPlanning = () => api.get(`/operations/${id}/planning`).then(r => setPlanning(r.data));
  const loadAlerts = () => api.get(`/operations/${id}/alerts`).then(r => setAlerts(r.data));

  const getControlForFico = (ficoType: string) => controls.find(c => c.fico_type === ficoType);

  const createControl = async (ficoType: string) => {
    await api.post(`/operations/${id}/controls`, { fico_type: ficoType });
    loadControls();
  };

  const toggleSuiviCheck = async (etape_id: string, item_id: string) => {
    const existing = suiviChecks.find(s => s.etape_id === etape_id && s.item_id === item_id);
    const checked = existing ? !existing.checked : true;
    await api.put(`/operations/${id}/suivi`, { etape_id, item_id, checked });
    loadSuivi();
  };

  const isChecked = (etape_id: string, item_id: string) => {
    return suiviChecks.find(s => s.etape_id === etape_id && s.item_id === item_id)?.checked === 1;
  };

  const savePlanningDate = async (fico_type: string) => {
    if (!dateValue) return;
    await api.put(`/operations/${id}/planning`, { fico_type, planned_date: dateValue });
    setEditingDate(null);
    setDateValue('');
    loadPlanning();
    loadAlerts();
  };

  const getPlanningForFico = (ficoType: string) => planning.find(p => p.fico_type === ficoType);

  const statusIcon = (status: string) => {
    switch (status) {
      case 'conforme': return <CheckCircle size={20} className="text-success" />;
      case 'non_conforme': return <XCircle size={20} className="text-danger" />;
      case 'en_attente': return <Clock size={20} className="text-warning" />;
      default: return <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />;
    }
  };

  const alertBadge = (level: string) => {
    switch (level) {
      case 'en_retard': return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">En retard</span>;
      case 'imminent': return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">Imminent</span>;
      case 'non_conforme': return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Non conforme</span>;
      default: return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">A venir</span>;
    }
  };

  const ficosForPhase = FICO_DEFINITIONS.filter(f => f.phase === activePhase);

  // Stats
  const total = FICO_DEFINITIONS.length;
  const filled = controls.length;
  const conforme = controls.filter(c => c.status === 'conforme').length;
  const nonConforme = controls.filter(c => c.status === 'non_conforme').length;

  // Suivi stats
  const totalSuiviItems = ETAPES_SUIVI.reduce((sum, e) => sum + e.items.length, 0);
  const checkedSuiviItems = suiviChecks.filter(s => s.checked).length;

  if (!operation) return <div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link to={`/programs/${operation.program_id}`} className="text-gray-500 hover:text-primary flex items-center gap-1 mb-4 no-underline text-sm">
        <ArrowLeft size={16} /> Retour au programme
      </Link>

      {/* Alertes */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={20} className="text-red-600" />
            <h3 className="font-semibold text-red-800">{alerts.length} alerte{alerts.length > 1 ? 's' : ''} FICO</h3>
          </div>
          <div className="space-y-2">
            {alerts.slice(0, 5).map(a => {
              const ficoDef = FICO_DEFINITIONS.find(f => f.type === a.fico_type);
              return (
                <div key={a.fico_type} className="flex items-center justify-between text-sm">
                  <span className="text-red-700">{a.fico_type} - {ficoDef?.name || ''}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Prévu : {new Date(a.planned_date).toLocaleDateString('fr-FR')}</span>
                    {alertBadge(a.alert_level)}
                  </div>
                </div>
              );
            })}
            {alerts.length > 5 && <p className="text-xs text-red-500">+ {alerts.length - 5} autres alertes</p>}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold text-accent">{operation.name}</h1>
        {operation.building && <p className="text-gray-500 mt-1">Bâtiment {operation.building} {operation.floor && `- Étage ${operation.floor}`}</p>}

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
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
          <div className="text-center p-3 bg-primary/10 rounded-xl">
            <p className="text-2xl font-bold text-primary">{totalSuiviItems > 0 ? Math.round((checkedSuiviItems / totalSuiviItems) * 100) : 0}%</p>
            <p className="text-xs text-gray-500">Suivi</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 bg-gray-200 rounded-full h-3 overflow-hidden">
          <div className="h-full bg-success rounded-full transition-all" style={{ width: `${total > 0 ? (conforme / total) * 100 : 0}%` }} />
        </div>
        <p className="text-sm text-gray-500 mt-1">{total > 0 ? Math.round((conforme / total) * 100) : 0}% de conformité FICO</p>
      </div>

      {/* View toggle */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setActiveView('fico')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${activeView === 'fico' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
          <ClipboardCheck size={16} /> Autocontrôles FICO
        </button>
        <button onClick={() => setActiveView('suivi')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${activeView === 'suivi' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
          <ListChecks size={16} /> Suivi Incontournable
          <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{checkedSuiviItems}/{totalSuiviItems}</span>
        </button>
        <button onClick={() => setActiveView('planning')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${activeView === 'planning' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
          <Calendar size={16} /> Planning Référence
          {alerts.filter(a => a.alert_level === 'en_retard').length > 0 && (
            <span className="bg-red-500 text-white px-1.5 py-0.5 rounded-full text-xs">{alerts.filter(a => a.alert_level === 'en_retard').length}</span>
          )}
        </button>
      </div>

      {/* ═══ SUIVI INCONTOURNABLE (interactif) ═══ */}
      {activeView === 'suivi' && (
        <div className="space-y-4">
          {/* Barre de progression globale suivi */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-accent">Progression du suivi</h3>
              <span className="text-sm font-medium text-primary">{checkedSuiviItems}/{totalSuiviItems} points validés</span>
            </div>
            <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${totalSuiviItems > 0 ? (checkedSuiviItems / totalSuiviItems) * 100 : 0}%` }} />
            </div>
          </div>

          {ETAPES_SUIVI.map(etape => {
            const etapeChecked = etape.items.filter(item => isChecked(etape.id, item.id)).length;
            const etapeTotal = etape.items.length;
            const etapeComplete = etapeChecked === etapeTotal;
            return (
              <div key={etape.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className={`${etapeComplete ? 'bg-success' : 'bg-accent'} text-white px-5 py-3 flex items-center justify-between`}>
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    {etapeComplete && <CheckCircle size={16} />}
                    {etape.numero} - {etape.name}
                  </h3>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded">{etapeChecked}/{etapeTotal}</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {etape.items.map(item => {
                    const checked = isChecked(etape.id, item.id);
                    return (
                      <div key={item.id}
                        onClick={() => toggleSuiviCheck(etape.id, item.id)}
                        className={`flex items-center justify-between px-5 py-3 cursor-pointer transition hover:bg-gray-50 ${checked ? 'bg-success/5' : ''}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 border-2 rounded flex items-center justify-center text-xs transition
                            ${checked ? 'border-success bg-success text-white' : 'border-gray-300 hover:border-success'}`}>
                            {checked && <Check size={12} />}
                          </div>
                          <span className={`text-sm ${checked ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{item.label}</span>
                        </div>
                        {item.delai && <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">{item.delai}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ PLANNING DE RÉFÉRENCE ═══ */}
      {activeView === 'planning' && (
        <div className="space-y-3">
          <div className="bg-white rounded-xl shadow-sm p-4 mb-2">
            <p className="text-sm text-gray-500">Renseignez les dates prévues pour chaque FICO. Le système compare automatiquement avec l'état réel des contrôles et génère des alertes.</p>
          </div>
          {FICO_DEFINITIONS.map(fico => {
            const plan = getPlanningForFico(fico.type);
            const ctrl = getControlForFico(fico.type);
            const today = new Date().toISOString().split('T')[0];
            let color = 'bg-gray-50';
            if (plan) {
              if (ctrl?.status === 'conforme') color = 'bg-success/5 border-success/20';
              else if (plan.planned_date < today && (!ctrl || ctrl.status === 'en_attente')) color = 'bg-red-50 border-red-200';
              else if (plan.planned_date >= today) color = 'bg-blue-50 border-blue-200';
            }
            return (
              <div key={fico.type} className={`rounded-xl shadow-sm p-4 flex items-center justify-between border ${color}`}>
                <div className="flex items-center gap-3">
                  {ctrl ? statusIcon(ctrl.status) : <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />}
                  <div>
                    <h4 className="font-semibold text-sm text-accent">{fico.type} - {fico.name}</h4>
                    <p className="text-xs text-gray-500">{fico.phase}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {plan ? (
                    <>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Prévu</p>
                        <p className="text-sm font-medium">{new Date(plan.planned_date).toLocaleDateString('fr-FR')}</p>
                      </div>
                      {ctrl?.status === 'conforme' && ctrl.checked_at && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Réalisé</p>
                          <p className="text-sm font-medium text-success">{new Date(ctrl.checked_at).toLocaleDateString('fr-FR')}</p>
                        </div>
                      )}
                      {plan.planned_date < today && (!ctrl || ctrl.status === 'en_attente') && (
                        <AlertTriangle size={16} className="text-red-500" />
                      )}
                    </>
                  ) : editingDate === fico.type ? (
                    <div className="flex items-center gap-2">
                      <input type="date" value={dateValue} onChange={e => setDateValue(e.target.value)}
                        className="border rounded px-2 py-1 text-sm" />
                      <button onClick={() => savePlanningDate(fico.type)} className="text-success hover:text-success/80">
                        <CheckCircle size={18} />
                      </button>
                      <button onClick={() => setEditingDate(null)} className="text-gray-400 hover:text-gray-600">
                        <XCircle size={18} />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingDate(fico.type); setDateValue(''); }}
                      className="text-primary hover:text-primary-dark text-sm font-medium flex items-center gap-1">
                      <Calendar size={14} /> Planifier
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ AUTOCONTRÔLES FICO ═══ */}
      {activeView === 'fico' && (
      <>
      <div className="flex flex-wrap gap-2 mb-6">
        {PHASES.map(phase => (
          <button key={phase} onClick={() => setActivePhase(phase)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activePhase === phase ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
            {phase}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {ficosForPhase.map(fico => {
          const ctrl = getControlForFico(fico.type);
          const plan = getPlanningForFico(fico.type);
          const today = new Date().toISOString().split('T')[0];
          const isLate = plan && plan.planned_date < today && (!ctrl || ctrl.status === 'en_attente');
          return (
            <div key={fico.type} className={`bg-white rounded-xl shadow-sm p-5 flex items-center justify-between ${isLate ? 'ring-2 ring-red-300' : ''}`}>
              <div className="flex items-center gap-4">
                {ctrl ? statusIcon(ctrl.status) : <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />}
                <div>
                  <h3 className="font-semibold text-accent flex items-center gap-2">
                    {fico.type} - {fico.name}
                    {isLate && <AlertTriangle size={14} className="text-red-500" />}
                  </h3>
                  <p className="text-sm text-gray-500">{fico.checks.length} points de contrôle
                    {plan && <span className="ml-2 text-xs">| Prévu : {new Date(plan.planned_date).toLocaleDateString('fr-FR')}</span>}
                  </p>
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
