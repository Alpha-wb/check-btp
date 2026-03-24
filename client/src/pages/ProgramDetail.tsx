import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { PHASES_AVANCEMENT, DATES_CLES_TEMPLATE } from '../data/ficoDefinitions';
import { Plus, ArrowLeft, User, Calendar, Building2, FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface Operation {
  id: string; name: string; description?: string; building?: string; floor?: string; status: string;
  assigned_first_name?: string; assigned_last_name?: string; due_date?: string;
}

const CONCESSIONNAIRES = [
  { id: 'cf', label: 'COURANT FORT (ENEDIS)', steps: ['Demande de raccordement MOA', 'Validation projet', 'Installation poste transfo', 'Réception colonnes', 'Mise sous tension', 'Consuel', 'Mise en service'] },
  { id: 'tel', label: 'TELECOM', steps: ['Demande de raccordement MOA', 'Validation projet', 'Réception colonnes', 'Pose armoire fibre', 'Ouverture des lignes'] },
  { id: 'chauf', label: 'CHAUFFAGE', steps: ['Demande de raccordement MOA', 'Validation projet', 'Installation chaufferie', 'Pose des coffrets', 'Raccordement', 'Mise en service'] },
  { id: 'eau', label: 'EAU POTABLE', steps: ['Demande de raccordement MOA', 'Validation projet', 'Raccordement'] },
  { id: 'egout', label: 'ÉGOUT', steps: ['Demande de raccordement MOA', 'Validation projet', 'Raccordement'] },
];

export default function ProgramDetail() {
  const { id } = useParams();
  const [program, setProgram] = useState<any>(null);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'board' | 'operations'>('board');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ avancement: true, dates: true, concess: false, certif: false });
  const [form, setForm] = useState({ name: '', description: '', building: '', floor: '', due_date: '' });

  useEffect(() => {
    api.get(`/programs/${id}`).then(r => setProgram(r.data));
    api.get(`/reports/program/${id}`).then(r => setStats(r.data)).catch(() => {});
    loadOps();
  }, [id]);

  const loadOps = () => api.get(`/programs/${id}/operations`).then(r => setOperations(r.data));

  const toggleSection = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post(`/programs/${id}/operations`, form);
    setForm({ name: '', description: '', building: '', floor: '', due_date: '' });
    setShowForm(false);
    loadOps();
  };

  const statusLabels: Record<string, { label: string; color: string }> = {
    a_faire: { label: 'À faire', color: 'bg-gray-200 text-gray-700' },
    en_cours: { label: 'En cours', color: 'bg-warning/20 text-warning' },
    termine: { label: 'Terminé', color: 'bg-success/20 text-success' },
  };

  if (!program) return <div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;

  // Demo avancement data
  const batiments = operations.filter(o => o.building);
  const avancementData: Record<string, Record<string, number>> = {};
  batiments.forEach(b => {
    const key = b.building || b.name;
    avancementData[key] = {};
    PHASES_AVANCEMENT.forEach((phase, i) => {
      if (b.status === 'termine') avancementData[key][phase] = 100;
      else if (b.status === 'en_cours') avancementData[key][phase] = Math.max(0, Math.min(100, 100 - i * 20 + Math.floor(Math.random() * 10)));
      else avancementData[key][phase] = 0;
    });
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link to="/dashboard" className="text-gray-500 hover:text-primary flex items-center gap-1 mb-4 no-underline text-sm">
        <ArrowLeft size={16} /> Retour au tableau de bord
      </Link>

      {/* Header */}
      <div className="bg-accent text-white rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <p className="text-primary text-sm font-medium mb-1">TABLEAU DE BORD</p>
            <h1 className="text-2xl font-bold">{program.name}</h1>
            <p className="text-gray-400 mt-1">{program.address} {program.city}</p>
          </div>
          <div className="flex gap-3">
            <Link to={`/reports?program=${id}`} className="border border-gray-500 text-white px-4 py-2 rounded-lg hover:bg-white/10 no-underline text-sm transition flex items-center gap-2">
              <FileText size={16} /> Rapport PDF
            </Link>
            <button onClick={() => setShowForm(!showForm)} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition">
              <Plus size={16} /> Opération
            </button>
          </div>
        </div>

        {/* Stats summary */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold">{stats.operations}</p>
              <p className="text-gray-400 text-xs">Bâtiments</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-success">{stats.controls.conforme}</p>
              <p className="text-gray-400 text-xs">Conformes</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-danger">{stats.controls.nonConforme}</p>
              <p className="text-gray-400 text-xs">Non conformes</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-primary">{stats.conformityRate}%</p>
              <p className="text-gray-400 text-xs">Conformité</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab('board')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'board' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
          Tableau de bord
        </button>
        <button onClick={() => setActiveTab('operations')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'operations' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
          Opérations ({operations.length})
        </button>
      </div>

      {activeTab === 'board' && (
        <div className="space-y-4">
          {/* AVANCEMENT TRAVAUX */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button onClick={() => toggleSection('avancement')} className="w-full flex items-center justify-between p-5 text-left">
              <h2 className="text-lg font-bold text-accent">Avancement travaux</h2>
              {openSections.avancement ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
            </button>
            {openSections.avancement && (
              <div className="px-5 pb-5">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 pr-4 text-gray-500 font-medium">Bâtiment(s)</th>
                        {batiments.map(b => (
                          <th key={b.id} className="text-center py-2 px-3 text-accent font-bold">{b.building || b.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {PHASES_AVANCEMENT.map(phase => (
                        <tr key={phase} className="border-b border-gray-100">
                          <td className="py-2 pr-4 text-gray-600 font-medium">{phase}</td>
                          {batiments.map(b => {
                            const pct = avancementData[b.building || b.name]?.[phase] || 0;
                            const color = pct >= 100 ? 'text-success' : pct > 50 ? 'text-primary' : pct > 0 ? 'text-warning' : 'text-gray-400';
                            return (
                              <td key={b.id} className="text-center py-2 px-3">
                                <span className={`font-bold ${color}`}>{pct}%</span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-400 mt-3 italic">Commentaires : Points de blocage, retard relatif au planning objectif...</p>
              </div>
            )}
          </div>

          {/* DATES CLEFS */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button onClick={() => toggleSection('dates')} className="w-full flex items-center justify-between p-5 text-left">
              <h2 className="text-lg font-bold text-accent">Dates clefs</h2>
              {openSections.dates ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
            </button>
            {openSections.dates && (
              <div className="px-5 pb-5">
                <div className="grid md:grid-cols-3 gap-x-8 gap-y-3">
                  {DATES_CLES_TEMPLATE.map(d => (
                    <div key={d.id} className="flex justify-between items-center py-1 border-b border-gray-50">
                      <span className="text-sm text-gray-600">{d.label}</span>
                      <span className="text-sm font-medium text-accent">
                        {d.id === 'fin_go' ? '15/09/2025' :
                         d.id === 'hors_eau' ? '15/12/2025' :
                         d.id === 'hors_air' ? '15/02/2026' :
                         d.id === 'opr' ? '15/04/2026' :
                         d.id === 'livraison' ? '30/06/2026' :
                         d.id === 'reception' ? '15/06/2026' :
                         '---'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SUIVI FINANCIER */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button onClick={() => toggleSection('financier')} className="w-full flex items-center justify-between p-5 text-left">
              <h2 className="text-lg font-bold text-accent">Suivi Financier</h2>
              {openSections.financier ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
            </button>
            {openSections.financier && (
              <div className="px-5 pb-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-bg rounded-xl p-4">
                    <p className="text-sm text-gray-500">Total TS soumis</p>
                    <p className="text-xl font-bold text-accent mt-1">12</p>
                  </div>
                  <div className="bg-bg rounded-xl p-4">
                    <p className="text-sm text-gray-500">Total TMA soumis</p>
                    <p className="text-xl font-bold text-accent mt-1">8</p>
                  </div>
                  <div className="bg-success/10 rounded-xl p-4">
                    <p className="text-sm text-gray-500">Total TS validés</p>
                    <p className="text-xl font-bold text-success mt-1">9</p>
                  </div>
                  <div className="bg-success/10 rounded-xl p-4">
                    <p className="text-sm text-gray-500">Total TMA validés</p>
                    <p className="text-xl font-bold text-success mt-1">5</p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-warning/10 rounded-lg">
                  <p className="text-sm text-warning font-medium">3 TS à valider</p>
                </div>
              </div>
            )}
          </div>

          {/* CONCESSIONNAIRES */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button onClick={() => toggleSection('concess')} className="w-full flex items-center justify-between p-5 text-left">
              <h2 className="text-lg font-bold text-accent">Concessionnaires</h2>
              {openSections.concess ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
            </button>
            {openSections.concess && (
              <div className="px-5 pb-5 space-y-4">
                {CONCESSIONNAIRES.map(c => (
                  <div key={c.id} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 font-semibold text-sm text-accent">{c.label}</div>
                    <div className="divide-y divide-gray-100">
                      {c.steps.map((step, i) => (
                        <div key={i} className="flex justify-between items-center px-4 py-2">
                          <span className="text-sm text-gray-600">{step}</span>
                          <span className="text-xs text-gray-400">---</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CERTIFICATIONS & LIVRABLES */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button onClick={() => toggleSection('certif')} className="w-full flex items-center justify-between p-5 text-left">
              <h2 className="text-lg font-bold text-accent">Certifications & Livrables</h2>
              {openSections.certif ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
            </button>
            {openSections.certif && (
              <div className="px-5 pb-5">
                <div className="grid md:grid-cols-2 gap-3">
                  {['Label NF Habitat HQE', 'Diag vent', 'Réglementation thermique RE2020', 'Attestation handicapée',
                    'Test infiltrométrie', 'Attestation thermique', 'DPE', 'RFCT'].map(label => (
                    <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-600">{label}</span>
                      <span className="text-xs px-2 py-1 bg-warning/20 text-warning rounded-full">En attente</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'operations' && (
        <>
          {showForm && (
            <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
              <h2 className="text-lg font-bold text-accent mb-4">Nouvelle opération</h2>
              <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" placeholder="Ex: Bâtiment A - Fondations" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bâtiment</label>
                  <input value={form.building} onChange={e => setForm({ ...form, building: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Étage</label>
                  <input value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date limite</label>
                  <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
                </div>
                <div className="md:col-span-2 flex gap-3">
                  <button type="submit" className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-medium transition">Créer</button>
                  <button type="button" onClick={() => setShowForm(false)} className="border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition">Annuler</button>
                </div>
              </form>
            </div>
          )}

          {operations.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <Building2 size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucune opération. Ajoutez-en une pour commencer les contrôles.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {operations.map(op => (
                <Link key={op.id} to={`/operations/${op.id}`} className="bg-white rounded-xl shadow-sm hover:shadow-md p-5 flex items-center justify-between no-underline transition block">
                  <div>
                    <h3 className="text-lg font-semibold text-accent">{op.name}</h3>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                      {op.building && <span className="flex items-center gap-1"><Building2 size={14} /> {op.building} {op.floor && `- ${op.floor}`}</span>}
                      {op.assigned_first_name && <span className="flex items-center gap-1"><User size={14} /> {op.assigned_first_name} {op.assigned_last_name}</span>}
                      {op.due_date && <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(op.due_date).toLocaleDateString('fr-FR')}</span>}
                    </div>
                  </div>
                  <span className={`${statusLabels[op.status]?.color || 'bg-gray-100'} px-3 py-1 rounded-full text-sm font-medium`}>
                    {statusLabels[op.status]?.label || op.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
