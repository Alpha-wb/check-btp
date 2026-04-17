import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { PHASES_AVANCEMENT, DATES_CLES_TEMPLATE } from '../data/ficoDefinitions';
import { Plus, ArrowLeft, User, Calendar, Building2, FileText, ChevronDown, ChevronUp, Pencil, Check, X, Trash2, Save, PlusCircle, Upload, AlertTriangle, File, Download } from 'lucide-react';

interface Operation {
  id: string; name: string; description?: string; building?: string; floor?: string; status: string;
  assigned_first_name?: string; assigned_last_name?: string; due_date?: string;
}

interface CustomSection {
  id: string;
  title: string;
  section_order: number;
  items: { label: string; value: string; status?: string }[];
}

const CONCESSIONNAIRES_DEFAULT = [
  { id: 'cf', label: 'COURANT FORT (ENEDIS)', steps: ['Demande de raccordement MOA', 'Validation projet', 'Installation poste transfo', 'Réception colonnes', 'Mise sous tension', 'Consuel', 'Mise en service'] },
  { id: 'tel', label: 'TELECOM', steps: ['Demande de raccordement MOA', 'Validation projet', 'Réception colonnes', 'Pose armoire fibre', 'Ouverture des lignes'] },
  { id: 'chauf', label: 'CHAUFFAGE', steps: ['Demande de raccordement MOA', 'Validation projet', 'Installation chaufferie', 'Pose des coffrets', 'Raccordement', 'Mise en service'] },
  { id: 'eau', label: 'EAU POTABLE', steps: ['Demande de raccordement MOA', 'Validation projet', 'Raccordement'] },
  { id: 'egout', label: 'ÉGOUT', steps: ['Demande de raccordement MOA', 'Validation projet', 'Raccordement'] },
];

const CERTIF_DEFAULT = [
  'Label NF Habitat HQE', 'Diag vent', 'Réglementation thermique RE2020', 'Attestation handicapée',
  'Test infiltrométrie', 'Attestation thermique', 'DPE', 'RFCT'
];

const STATUS_OPTIONS = [
  { value: 'en_attente', label: 'En attente', color: 'bg-warning/20 text-warning' },
  { value: 'validé', label: 'Validé', color: 'bg-success/20 text-success' },
  { value: 'refusé', label: 'Refusé', color: 'bg-danger/20 text-danger' },
  { value: 'na', label: 'N/A', color: 'bg-gray-200 text-gray-500' },
];

export default function ProgramDetail() {
  const { id } = useParams();
  const [program, setProgram] = useState<any>(null);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'board' | 'operations' | 'documents'>('board');
  const [documents, setDocuments] = useState<any[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploadType, setUploadType] = useState<string>('autre');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ avancement: true, dates: true, financier: false, concess: false, certif: false });
  const [form, setForm] = useState({ name: '', description: '', building: '', floor: '', due_date: '' });

  // Board data state
  const [boardData, setBoardData] = useState<Record<string, any>>({});
  const [customSections, setCustomSections] = useState<CustomSection[]>([]);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Temporary edit states
  const [editAvancement, setEditAvancement] = useState<Record<string, Record<string, number>>>({});
  const [editDates, setEditDates] = useState<Record<string, string>>({});
  const [editFinancier, setEditFinancier] = useState<Record<string, number>>({});
  const [editConcess, setEditConcess] = useState<any[]>([]);
  const [editCertif, setEditCertif] = useState<{ label: string; status: string }[]>([]);

  // New custom section form
  const [showNewSection, setShowNewSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');

  const loadBoardData = useCallback(() => {
    if (!id) return;
    api.get(`/programs/${id}/board`).then(r => {
      setBoardData(r.data.boardData || {});
      setCustomSections(r.data.customSections || []);
    }).catch(() => {});
  }, [id]);

  useEffect(() => {
    api.get(`/programs/${id}`).then(r => setProgram(r.data));
    api.get(`/reports/program/${id}`).then(r => setStats(r.data)).catch(() => {});
    loadOps();
    loadBoardData();
    loadDocuments();
    loadAlerts();
  }, [id, loadBoardData]);

  const loadOps = () => api.get(`/programs/${id}/operations`).then(r => setOperations(r.data));
  const loadDocuments = () => api.get(`/programs/${id}/documents`).then(r => setDocuments(r.data)).catch(() => {});
  const loadAlerts = () => api.get(`/programs/${id}/alerts`).then(r => setAlerts(r.data)).catch(() => {});

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (!files.length) return;
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    formData.append('doc_type', uploadType);
    await api.post(`/programs/${id}/documents`, formData);
    loadDocuments();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const formData = new FormData();
    Array.from(files).forEach(f => formData.append('files', f));
    formData.append('doc_type', uploadType);
    await api.post(`/programs/${id}/documents`, formData);
    loadDocuments();
    e.target.value = '';
  };

  const deleteDocument = async (docId: string) => {
    if (!confirm('Supprimer ce document ?')) return;
    await api.delete(`/programs/${id}/documents/${docId}`);
    loadDocuments();
  };

  const docTypeLabel = (t: string) => {
    switch (t) { case 'cr': return 'CR'; case 'planning': return 'Planning'; case 'plan': return 'Plan'; default: return 'Autre'; }
  };
  const docTypeColor = (t: string) => {
    switch (t) { case 'cr': return 'bg-blue-100 text-blue-700'; case 'planning': return 'bg-purple-100 text-purple-700'; case 'plan': return 'bg-teal-100 text-teal-700'; default: return 'bg-gray-100 text-gray-600'; }
  };

  const toggleSection = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const saveSection = async (section: string, data: any) => {
    setSaving(true);
    try {
      await api.put(`/programs/${id}/board/${section}`, { data });
      setBoardData(prev => ({ ...prev, [section]: data }));
      setEditingSection(null);
    } catch (e) {
      console.error('Erreur sauvegarde:', e);
    }
    setSaving(false);
  };

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

  // ─── AVANCEMENT helpers ───
  const batiments = operations.filter(o => o.building);

  const getAvancementData = (): Record<string, Record<string, number>> => {
    if (boardData.avancement) return boardData.avancement;
    // Fallback: generated from operation status
    const data: Record<string, Record<string, number>> = {};
    batiments.forEach(b => {
      const key = b.building || b.name;
      data[key] = {};
      PHASES_AVANCEMENT.forEach((phase, i) => {
        if (b.status === 'termine') data[key][phase] = 100;
        else if (b.status === 'en_cours') data[key][phase] = Math.max(0, Math.min(100, 100 - i * 20));
        else data[key][phase] = 0;
      });
    });
    return data;
  };

  const startEditAvancement = () => {
    setEditAvancement(JSON.parse(JSON.stringify(getAvancementData())));
    setEditingSection('avancement');
  };

  // ─── DATES helpers ───
  const getDatesData = (): Record<string, string> => {
    if (boardData.dates) return boardData.dates;
    return {
      fin_go: '15/09/2025', hors_eau: '15/12/2025', hors_air: '15/02/2026',
      opr: '15/04/2026', livraison: '30/06/2026', reception: '15/06/2026'
    };
  };

  const startEditDates = () => {
    setEditDates({ ...getDatesData() });
    setEditingSection('dates');
  };

  // ─── FINANCIER helpers ───
  const getFinancierData = () => {
    if (boardData.financier) return boardData.financier;
    return { ts_soumis: 12, tma_soumis: 8, ts_valides: 9, tma_valides: 5, ts_a_valider: 3 };
  };

  const startEditFinancier = () => {
    setEditFinancier({ ...getFinancierData() });
    setEditingSection('financier');
  };

  // ─── CONCESSIONNAIRES helpers ───
  const getConcessData = () => {
    if (boardData.concessionnaires) return boardData.concessionnaires;
    return CONCESSIONNAIRES_DEFAULT.map(c => ({
      ...c,
      steps: c.steps.map(s => ({ label: s, date: '', status: 'en_attente' }))
    }));
  };

  const startEditConcess = () => {
    setEditConcess(JSON.parse(JSON.stringify(getConcessData())));
    setEditingSection('concess');
  };

  // ─── CERTIFICATIONS helpers ───
  const getCertifData = (): { label: string; status: string }[] => {
    if (boardData.certifications) return boardData.certifications;
    return CERTIF_DEFAULT.map(c => ({ label: c, status: 'en_attente' }));
  };

  const startEditCertif = () => {
    setEditCertif(JSON.parse(JSON.stringify(getCertifData())));
    setEditingSection('certif');
  };

  // ─── CUSTOM SECTIONS ───
  const handleCreateSection = async () => {
    if (!newSectionTitle.trim()) return;
    try {
      const res = await api.post(`/programs/${id}/board/sections`, {
        title: newSectionTitle,
        items: []
      });
      setCustomSections(prev => [...prev, res.data]);
      setNewSectionTitle('');
      setShowNewSection(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateSection = async (section: CustomSection) => {
    try {
      await api.put(`/programs/${id}/board/sections/${section.id}`, {
        title: section.title,
        items: section.items
      });
      setEditingSection(null);
      loadBoardData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('Supprimer cette section ?')) return;
    try {
      await api.delete(`/programs/${id}/board/sections/${sectionId}`);
      setCustomSections(prev => prev.filter(s => s.id !== sectionId));
    } catch (e) {
      console.error(e);
    }
  };

  if (!program) return <div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;

  const avancementData = getAvancementData();
  const datesData = getDatesData();
  const financierData = getFinancierData();
  const concessData = getConcessData();
  const certifData = getCertifData();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link to="/dashboard" className="text-gray-500 hover:text-primary flex items-center gap-1 mb-4 no-underline text-sm">
        <ArrowLeft size={16} /> Retour au tableau de bord
      </Link>

      {/* Header */}
      <div className="bg-accent text-white rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <p className="text-primary text-sm font-medium mb-1">TABLEAU DE BORD - GROUPE ALPHA ISI</p>
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
        <button onClick={() => setActiveTab('documents')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${activeTab === 'documents' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
          <Upload size={16} /> Documents ({documents.length})
        </button>
      </div>

      {/* Alertes FICO */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-red-600" />
            <h3 className="font-semibold text-red-800 text-sm">{alerts.length} alerte{alerts.length > 1 ? 's' : ''} FICO sur ce programme</h3>
          </div>
          <div className="space-y-1">
            {alerts.slice(0, 4).map((a: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-red-700">{a.operation_name} - {a.fico_type}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Prévu : {new Date(a.planned_date).toLocaleDateString('fr-FR')}</span>
                  <span className={`px-1.5 py-0.5 rounded-full font-semibold ${a.alert_level === 'en_retard' ? 'bg-red-200 text-red-800' : a.alert_level === 'imminent' ? 'bg-orange-200 text-orange-800' : 'bg-blue-200 text-blue-800'}`}>
                    {a.alert_level === 'en_retard' ? 'Retard' : a.alert_level === 'imminent' ? 'Imminent' : 'Non conforme'}
                  </span>
                </div>
              </div>
            ))}
            {alerts.length > 4 && <p className="text-xs text-red-500 mt-1">+ {alerts.length - 4} autres</p>}
          </div>
        </div>
      )}

      {activeTab === 'board' && (
        <div className="space-y-4">

          {/* ═══════════════ AVANCEMENT TRAVAUX ═══════════════ */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button onClick={() => toggleSection('avancement')} className="w-full flex items-center justify-between p-5 text-left">
              <h2 className="text-lg font-bold text-accent">Avancement travaux</h2>
              <div className="flex items-center gap-2">
                {openSections.avancement && editingSection !== 'avancement' && (
                  <span onClick={(e) => { e.stopPropagation(); startEditAvancement(); }} className="text-primary hover:text-primary-dark cursor-pointer p-1"><Pencil size={16} /></span>
                )}
                {openSections.avancement ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
              </div>
            </button>
            {openSections.avancement && (
              <div className="px-5 pb-5">
                {editingSection === 'avancement' ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 pr-4 text-gray-500 font-medium">Phase</th>
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
                                const key = b.building || b.name;
                                return (
                                  <td key={b.id} className="text-center py-1 px-2">
                                    <input type="number" min="0" max="100"
                                      value={editAvancement[key]?.[phase] ?? 0}
                                      onChange={e => {
                                        const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                        setEditAvancement(prev => ({
                                          ...prev,
                                          [key]: { ...prev[key], [phase]: val }
                                        }));
                                      }}
                                      className="w-16 text-center border border-gray-300 rounded px-1 py-1 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
                                    <span className="text-xs text-gray-400 ml-1">%</span>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => saveSection('avancement', editAvancement)} disabled={saving}
                        className="bg-primary text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-primary-dark transition disabled:opacity-50">
                        <Save size={14} /> {saving ? 'Sauvegarde...' : 'Enregistrer'}
                      </button>
                      <button onClick={() => setEditingSection(null)} className="border border-gray-300 px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-50 transition">
                        <X size={14} /> Annuler
                      </button>
                    </div>
                  </>
                ) : (
                  <>
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
                    <p className="text-xs text-gray-400 mt-3 italic">Cliquez sur le crayon pour modifier les pourcentages d'avancement.</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ═══════════════ DATES CLEFS ═══════════════ */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button onClick={() => toggleSection('dates')} className="w-full flex items-center justify-between p-5 text-left">
              <h2 className="text-lg font-bold text-accent">Dates clefs</h2>
              <div className="flex items-center gap-2">
                {openSections.dates && editingSection !== 'dates' && (
                  <span onClick={(e) => { e.stopPropagation(); startEditDates(); }} className="text-primary hover:text-primary-dark cursor-pointer p-1"><Pencil size={16} /></span>
                )}
                {openSections.dates ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
              </div>
            </button>
            {openSections.dates && (
              <div className="px-5 pb-5">
                {editingSection === 'dates' ? (
                  <>
                    <div className="grid md:grid-cols-3 gap-x-8 gap-y-3">
                      {DATES_CLES_TEMPLATE.map(d => (
                        <div key={d.id} className="flex justify-between items-center py-1 border-b border-gray-50 gap-3">
                          <span className="text-sm text-gray-600 whitespace-nowrap">{d.label}</span>
                          <input type="text" placeholder="JJ/MM/AAAA"
                            value={editDates[d.id] || ''}
                            onChange={e => setEditDates(prev => ({ ...prev, [d.id]: e.target.value }))}
                            className="w-32 text-sm border border-gray-300 rounded px-2 py-1 text-right focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => saveSection('dates', editDates)} disabled={saving}
                        className="bg-primary text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-primary-dark transition disabled:opacity-50">
                        <Save size={14} /> {saving ? 'Sauvegarde...' : 'Enregistrer'}
                      </button>
                      <button onClick={() => setEditingSection(null)} className="border border-gray-300 px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-50 transition">
                        <X size={14} /> Annuler
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="grid md:grid-cols-3 gap-x-8 gap-y-3">
                    {DATES_CLES_TEMPLATE.map(d => (
                      <div key={d.id} className="flex justify-between items-center py-1 border-b border-gray-50">
                        <span className="text-sm text-gray-600">{d.label}</span>
                        <span className="text-sm font-medium text-accent">{datesData[d.id] || '---'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ═══════════════ SUIVI FINANCIER ═══════════════ */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button onClick={() => toggleSection('financier')} className="w-full flex items-center justify-between p-5 text-left">
              <h2 className="text-lg font-bold text-accent">Suivi Financier</h2>
              <div className="flex items-center gap-2">
                {openSections.financier && editingSection !== 'financier' && (
                  <span onClick={(e) => { e.stopPropagation(); startEditFinancier(); }} className="text-primary hover:text-primary-dark cursor-pointer p-1"><Pencil size={16} /></span>
                )}
                {openSections.financier ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
              </div>
            </button>
            {openSections.financier && (
              <div className="px-5 pb-5">
                {editingSection === 'financier' ? (
                  <>
                    <div className="grid md:grid-cols-2 gap-4">
                      {[
                        { key: 'ts_soumis', label: 'Total TS soumis' },
                        { key: 'tma_soumis', label: 'Total TMA soumis' },
                        { key: 'ts_valides', label: 'Total TS validés' },
                        { key: 'tma_valides', label: 'Total TMA validés' },
                        { key: 'ts_a_valider', label: 'TS à valider' },
                      ].map(item => (
                        <div key={item.key} className="bg-bg rounded-xl p-4">
                          <label className="text-sm text-gray-500 block mb-2">{item.label}</label>
                          <input type="number" min="0"
                            value={editFinancier[item.key] ?? 0}
                            onChange={e => setEditFinancier(prev => ({ ...prev, [item.key]: parseInt(e.target.value) || 0 }))}
                            className="w-full text-xl font-bold border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => saveSection('financier', editFinancier)} disabled={saving}
                        className="bg-primary text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-primary-dark transition disabled:opacity-50">
                        <Save size={14} /> {saving ? 'Sauvegarde...' : 'Enregistrer'}
                      </button>
                      <button onClick={() => setEditingSection(null)} className="border border-gray-300 px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-50 transition">
                        <X size={14} /> Annuler
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-bg rounded-xl p-4">
                        <p className="text-sm text-gray-500">Total TS soumis</p>
                        <p className="text-xl font-bold text-accent mt-1">{financierData.ts_soumis}</p>
                      </div>
                      <div className="bg-bg rounded-xl p-4">
                        <p className="text-sm text-gray-500">Total TMA soumis</p>
                        <p className="text-xl font-bold text-accent mt-1">{financierData.tma_soumis}</p>
                      </div>
                      <div className="bg-success/10 rounded-xl p-4">
                        <p className="text-sm text-gray-500">Total TS validés</p>
                        <p className="text-xl font-bold text-success mt-1">{financierData.ts_valides}</p>
                      </div>
                      <div className="bg-success/10 rounded-xl p-4">
                        <p className="text-sm text-gray-500">Total TMA validés</p>
                        <p className="text-xl font-bold text-success mt-1">{financierData.tma_valides}</p>
                      </div>
                    </div>
                    {financierData.ts_a_valider > 0 && (
                      <div className="mt-4 p-3 bg-warning/10 rounded-lg">
                        <p className="text-sm text-warning font-medium">{financierData.ts_a_valider} TS à valider</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* ═══════════════ CONCESSIONNAIRES ═══════════════ */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button onClick={() => toggleSection('concess')} className="w-full flex items-center justify-between p-5 text-left">
              <h2 className="text-lg font-bold text-accent">Concessionnaires</h2>
              <div className="flex items-center gap-2">
                {openSections.concess && editingSection !== 'concess' && (
                  <span onClick={(e) => { e.stopPropagation(); startEditConcess(); }} className="text-primary hover:text-primary-dark cursor-pointer p-1"><Pencil size={16} /></span>
                )}
                {openSections.concess ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
              </div>
            </button>
            {openSections.concess && (
              <div className="px-5 pb-5 space-y-4">
                {editingSection === 'concess' ? (
                  <>
                    {editConcess.map((c, ci) => (
                      <div key={ci} className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 font-semibold text-sm text-accent">{c.label}</div>
                        <div className="divide-y divide-gray-100">
                          {c.steps.map((step: any, si: number) => (
                            <div key={si} className="flex items-center gap-3 px-4 py-2">
                              <span className="text-sm text-gray-600 flex-1">{step.label}</span>
                              <input type="text" placeholder="Date"
                                value={step.date || ''}
                                onChange={e => {
                                  const updated = [...editConcess];
                                  updated[ci].steps[si].date = e.target.value;
                                  setEditConcess(updated);
                                }}
                                className="w-28 text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary outline-none" />
                              <select value={step.status || 'en_attente'}
                                onChange={e => {
                                  const updated = [...editConcess];
                                  updated[ci].steps[si].status = e.target.value;
                                  setEditConcess(updated);
                                }}
                                className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary outline-none">
                                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => saveSection('concessionnaires', editConcess)} disabled={saving}
                        className="bg-primary text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-primary-dark transition disabled:opacity-50">
                        <Save size={14} /> {saving ? 'Sauvegarde...' : 'Enregistrer'}
                      </button>
                      <button onClick={() => setEditingSection(null)} className="border border-gray-300 px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-50 transition">
                        <X size={14} /> Annuler
                      </button>
                    </div>
                  </>
                ) : (
                  concessData.map((c: any, ci: number) => (
                    <div key={ci} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 font-semibold text-sm text-accent">{c.label}</div>
                      <div className="divide-y divide-gray-100">
                        {c.steps.map((step: any, si: number) => {
                          const label = typeof step === 'string' ? step : step.label;
                          const date = typeof step === 'string' ? '' : step.date;
                          const status = typeof step === 'string' ? 'en_attente' : (step.status || 'en_attente');
                          const statusInfo = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
                          return (
                            <div key={si} className="flex justify-between items-center px-4 py-2">
                              <span className="text-sm text-gray-600">{label}</span>
                              <div className="flex items-center gap-3">
                                {date && <span className="text-xs text-gray-500">{date}</span>}
                                <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.color}`}>{statusInfo.label}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* ═══════════════ CERTIFICATIONS & LIVRABLES ═══════════════ */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button onClick={() => toggleSection('certif')} className="w-full flex items-center justify-between p-5 text-left">
              <h2 className="text-lg font-bold text-accent">Certifications & Livrables</h2>
              <div className="flex items-center gap-2">
                {openSections.certif && editingSection !== 'certif' && (
                  <span onClick={(e) => { e.stopPropagation(); startEditCertif(); }} className="text-primary hover:text-primary-dark cursor-pointer p-1"><Pencil size={16} /></span>
                )}
                {openSections.certif ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
              </div>
            </button>
            {openSections.certif && (
              <div className="px-5 pb-5">
                {editingSection === 'certif' ? (
                  <>
                    <div className="grid md:grid-cols-2 gap-3">
                      {editCertif.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50">
                          <input type="text" value={item.label}
                            onChange={e => {
                              const updated = [...editCertif];
                              updated[i].label = e.target.value;
                              setEditCertif(updated);
                            }}
                            className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary outline-none" />
                          <select value={item.status}
                            onChange={e => {
                              const updated = [...editCertif];
                              updated[i].status = e.target.value;
                              setEditCertif(updated);
                            }}
                            className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary outline-none">
                            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                          <button onClick={() => setEditCertif(prev => prev.filter((_, idx) => idx !== i))}
                            className="text-danger hover:text-red-700 p-1"><Trash2 size={14} /></button>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setEditCertif(prev => [...prev, { label: '', status: 'en_attente' }])}
                      className="mt-3 text-sm text-primary flex items-center gap-1 hover:text-primary-dark">
                      <PlusCircle size={14} /> Ajouter une certification
                    </button>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => saveSection('certifications', editCertif)} disabled={saving}
                        className="bg-primary text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-primary-dark transition disabled:opacity-50">
                        <Save size={14} /> {saving ? 'Sauvegarde...' : 'Enregistrer'}
                      </button>
                      <button onClick={() => setEditingSection(null)} className="border border-gray-300 px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-50 transition">
                        <X size={14} /> Annuler
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="grid md:grid-cols-2 gap-3">
                    {certifData.map((item, i) => {
                      const statusInfo = STATUS_OPTIONS.find(s => s.value === item.status) || STATUS_OPTIONS[0];
                      return (
                        <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50">
                          <span className="text-sm text-gray-600">{item.label}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.color}`}>{statusInfo.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ═══════════════ SECTIONS PERSONNALISÉES ═══════════════ */}
          {customSections.map(section => (
            <div key={section.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <button onClick={() => toggleSection(`custom_${section.id}`)} className="w-full flex items-center justify-between p-5 text-left">
                <h2 className="text-lg font-bold text-accent">{section.title}</h2>
                <div className="flex items-center gap-2">
                  {openSections[`custom_${section.id}`] && editingSection !== `custom_${section.id}` && (
                    <>
                      <span onClick={(e) => { e.stopPropagation(); setEditingSection(`custom_${section.id}`); }} className="text-primary hover:text-primary-dark cursor-pointer p-1"><Pencil size={16} /></span>
                      <span onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.id); }} className="text-danger hover:text-red-700 cursor-pointer p-1"><Trash2 size={16} /></span>
                    </>
                  )}
                  {openSections[`custom_${section.id}`] ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                </div>
              </button>
              {openSections[`custom_${section.id}`] && (
                <div className="px-5 pb-5">
                  {editingSection === `custom_${section.id}` ? (
                    <CustomSectionEditor section={section} onSave={handleUpdateSection} onCancel={() => setEditingSection(null)} />
                  ) : (
                    <div className="space-y-2">
                      {section.items.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">Aucun élément. Cliquez sur le crayon pour en ajouter.</p>
                      ) : (
                        section.items.map((item, i) => {
                          const statusInfo = STATUS_OPTIONS.find(s => s.value === item.status) || STATUS_OPTIONS[0];
                          return (
                            <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50">
                              <span className="text-sm text-gray-600">{item.label}</span>
                              <div className="flex items-center gap-3">
                                {item.value && <span className="text-xs text-gray-500">{item.value}</span>}
                                <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.color}`}>{statusInfo.label}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* ═══════════════ AJOUTER UNE SECTION ═══════════════ */}
          {showNewSection ? (
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h3 className="text-md font-bold text-accent mb-3">Nouvelle section</h3>
              <div className="flex gap-3">
                <input type="text" placeholder="Titre de la section" value={newSectionTitle}
                  onChange={e => setNewSectionTitle(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  onKeyDown={e => e.key === 'Enter' && handleCreateSection()} />
                <button onClick={handleCreateSection}
                  className="bg-primary text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-primary-dark transition">
                  <Check size={14} /> Créer
                </button>
                <button onClick={() => { setShowNewSection(false); setNewSectionTitle(''); }}
                  className="border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition">
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowNewSection(true)}
              className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-5 text-gray-400 hover:text-primary hover:border-primary transition flex items-center justify-center gap-2 text-sm font-medium">
              <PlusCircle size={18} /> Ajouter une section personnalisée
            </button>
          )}
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

      {/* ═══ DOCUMENTS (Drag & Drop) ═══ */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          {/* Zone de drop */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition ${dragOver ? 'border-primary bg-primary/5' : 'border-gray-300 bg-white'}`}>
            <Upload size={40} className={`mx-auto mb-3 ${dragOver ? 'text-primary' : 'text-gray-400'}`} />
            <p className="text-gray-600 font-medium">Glissez-déposez vos fichiers ici</p>
            <p className="text-gray-400 text-sm mt-1">CR, planning, plans, documents... (PDF, Excel, images, DWG)</p>

            <div className="flex items-center justify-center gap-3 mt-4">
              <select value={uploadType} onChange={e => setUploadType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none">
                <option value="cr">Compte-Rendu (CR)</option>
                <option value="planning">Planning</option>
                <option value="plan">Plan</option>
                <option value="autre">Autre</option>
              </select>
              <label className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg cursor-pointer text-sm font-medium transition flex items-center gap-2">
                <Upload size={16} /> Parcourir
                <input type="file" multiple onChange={handleFileSelect} className="hidden" />
              </label>
            </div>
          </div>

          {/* Liste des documents */}
          {documents.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <File size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucun document. Déposez des fichiers pour commencer.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm divide-y">
              {documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <File size={20} className="text-gray-400" />
                    <div>
                      <p className="font-medium text-sm text-accent">{doc.original_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${docTypeColor(doc.doc_type)}`}>{docTypeLabel(doc.doc_type)}</span>
                        {doc.uploaded_by_name && <span className="text-xs text-gray-400">par {doc.uploaded_by_name}</span>}
                        <span className="text-xs text-gray-400">{new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={`/uploads/documents/${doc.filename}`} target="_blank" rel="noreferrer"
                      className="text-primary hover:text-primary-dark p-1">
                      <Download size={16} />
                    </a>
                    <button onClick={() => deleteDocument(doc.id)} className="text-gray-400 hover:text-danger p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sous-composant pour éditer les sections personnalisées ───
function CustomSectionEditor({ section, onSave, onCancel }: {
  section: CustomSection;
  onSave: (section: CustomSection) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(section.title);
  const [items, setItems] = useState<{ label: string; value: string; status?: string }[]>(
    section.items.length > 0 ? [...section.items] : []
  );

  return (
    <div>
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mb-1 block">Titre de la section</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
      </div>

      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="text" placeholder="Libellé" value={item.label}
              onChange={e => {
                const updated = [...items];
                updated[i].label = e.target.value;
                setItems(updated);
              }}
              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary outline-none" />
            <input type="text" placeholder="Valeur / Date" value={item.value || ''}
              onChange={e => {
                const updated = [...items];
                updated[i].value = e.target.value;
                setItems(updated);
              }}
              className="w-32 text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary outline-none" />
            <select value={item.status || 'en_attente'}
              onChange={e => {
                const updated = [...items];
                updated[i].status = e.target.value;
                setItems(updated);
              }}
              className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary outline-none">
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <button onClick={() => setItems(prev => prev.filter((_, idx) => idx !== i))}
              className="text-danger hover:text-red-700 p-1"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>

      <button onClick={() => setItems(prev => [...prev, { label: '', value: '', status: 'en_attente' }])}
        className="mt-3 text-sm text-primary flex items-center gap-1 hover:text-primary-dark">
        <PlusCircle size={14} /> Ajouter un élément
      </button>

      <div className="flex gap-2 mt-4">
        <button onClick={() => onSave({ ...section, title, items })}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-primary-dark transition">
          <Save size={14} /> Enregistrer
        </button>
        <button onClick={onCancel}
          className="border border-gray-300 px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-50 transition">
          <X size={14} /> Annuler
        </button>
      </div>
    </div>
  );
}
