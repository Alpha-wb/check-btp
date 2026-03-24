import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import api from '../api/client';
import { FICO_DEFINITIONS } from '../data/ficoDefinitions';
import { ArrowLeft, Save, Camera, CheckCircle, XCircle, Minus } from 'lucide-react';

export default function ControlForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const ficoType = searchParams.get('fico') || '';
  const ficoDef = FICO_DEFINITIONS.find(f => f.type === ficoType);

  const [control, setControl] = useState<any>(null);
  const [checkData, setCheckData] = useState<Record<string, { status: string; comment: string }>>({});
  const [comments, setComments] = useState('');
  const [photos, setPhotos] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get(`/controls/${id}`).then(r => {
      setControl(r.data);
      setComments(r.data.comments || '');
      setPhotos(r.data.photos || []);
      if (r.data.data && typeof r.data.data === 'object') {
        setCheckData(r.data.data);
      }
    });
  }, [id]);

  const updateCheck = (checkId: string, field: 'status' | 'comment', value: string) => {
    setCheckData(prev => ({
      ...prev,
      [checkId]: { ...prev[checkId], [field]: value }
    }));
    setSaved(false);
  };

  const computeOverallStatus = () => {
    if (!ficoDef) return 'en_attente';
    const statuses = ficoDef.checks.map(c => checkData[c.id]?.status).filter(Boolean);
    if (statuses.length === 0) return 'en_attente';
    if (statuses.some(s => s === 'non_conforme')) return 'non_conforme';
    if (statuses.every(s => s === 'conforme' || s === 'na')) return 'conforme';
    return 'en_attente';
  };

  const handleSave = async () => {
    setSaving(true);
    const status = computeOverallStatus();
    await api.put(`/controls/${id}`, { status, comments, data: checkData });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const formData = new FormData();
    Array.from(e.target.files).forEach(f => formData.append('photos', f));
    const { data } = await api.post(`/controls/${id}/photos`, formData);
    setPhotos(prev => [...prev, ...data]);
  };

  if (!control || !ficoDef) return <div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;

  const categories = [...new Set(ficoDef.checks.map(c => c.category))];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to={`/operations/${control.operation_id}`} className="text-gray-500 hover:text-primary flex items-center gap-1 mb-4 no-underline text-sm">
        <ArrowLeft size={16} /> Retour à l'opération
      </Link>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-accent">{ficoDef.type} - {ficoDef.name}</h1>
            <p className="text-gray-500 mt-1">Phase : {ficoDef.phase} | {ficoDef.checks.length} points de contrôle</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            computeOverallStatus() === 'conforme' ? 'bg-success/20 text-success' :
            computeOverallStatus() === 'non_conforme' ? 'bg-danger/20 text-danger' :
            'bg-warning/20 text-warning'
          }`}>
            {computeOverallStatus().replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Check items by category */}
      {categories.map(cat => (
        <div key={cat} className="mb-6">
          <h2 className="text-lg font-semibold text-accent mb-3">{cat}</h2>
          <div className="space-y-3">
            {ficoDef.checks.filter(c => c.category === cat).map(check => (
              <div key={check.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-start gap-4">
                  <div className="flex gap-1 mt-1">
                    <button onClick={() => updateCheck(check.id, 'status', 'conforme')}
                      className={`p-1 rounded ${checkData[check.id]?.status === 'conforme' ? 'bg-success/20' : 'hover:bg-gray-100'}`}
                      title="Conforme">
                      <CheckCircle size={22} className={checkData[check.id]?.status === 'conforme' ? 'text-success' : 'text-gray-300'} />
                    </button>
                    <button onClick={() => updateCheck(check.id, 'status', 'non_conforme')}
                      className={`p-1 rounded ${checkData[check.id]?.status === 'non_conforme' ? 'bg-danger/20' : 'hover:bg-gray-100'}`}
                      title="Non conforme">
                      <XCircle size={22} className={checkData[check.id]?.status === 'non_conforme' ? 'text-danger' : 'text-gray-300'} />
                    </button>
                    <button onClick={() => updateCheck(check.id, 'status', 'na')}
                      className={`p-1 rounded ${checkData[check.id]?.status === 'na' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                      title="Non applicable">
                      <Minus size={22} className={checkData[check.id]?.status === 'na' ? 'text-gray-600' : 'text-gray-300'} />
                    </button>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-accent">{check.label}</p>
                    <input placeholder="Commentaire..." value={checkData[check.id]?.comment || ''}
                      onChange={e => updateCheck(check.id, 'comment', e.target.value)}
                      className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* General comments */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-accent mb-3">Commentaires généraux</h2>
        <textarea value={comments} onChange={e => { setComments(e.target.value); setSaved(false); }}
          rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
          placeholder="Observations générales sur ce contrôle..." />
      </div>

      {/* Photos */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-accent mb-3">Photos</h2>
        <div className="flex flex-wrap gap-3 mb-4">
          {photos.map((p: any) => (
            <div key={p.id} className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
              <img src={`/uploads/${p.filename}`} alt={p.original_name} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        <label className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition text-sm">
          <Camera size={18} className="text-gray-500" />
          <span className="text-gray-600">Ajouter des photos</span>
          <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
        </label>
      </div>

      {/* Save button */}
      <div className="sticky bottom-4">
        <button onClick={handleSave} disabled={saving}
          className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 shadow-lg transition disabled:opacity-50">
          <Save size={20} />
          {saving ? 'Enregistrement...' : saved ? 'Enregistré !' : 'Enregistrer le contrôle'}
        </button>
      </div>
    </div>
  );
}
