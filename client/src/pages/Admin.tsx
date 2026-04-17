import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import api from '../api/client';
import {
  Users, FolderOpen, BarChart3, Plus, Pencil, Trash2, X, Save,
  Search, Shield, Eye, UserPlus, FolderPlus
} from 'lucide-react';

interface UserItem {
  id: string; email: string; first_name: string; last_name: string;
  role: string; company?: string; phone?: string; created_at: string;
}

interface ProgramItem {
  id: string; name: string; address?: string; city?: string; description?: string;
  start_date?: string; end_date?: string; status: string; created_by: string;
  created_by_name?: string; operations_count?: number; members_count?: number;
}

interface Stats {
  users: number; programs: number; activePrograms: number;
  operations: number; controls: number; conformeControls: number;
  nonConformeControls: number; roleBreakdown: Record<string, number>;
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  superadmin: { label: 'Super Admin', color: 'bg-amber-100 text-amber-800' },
  moe: { label: 'MOE', color: 'bg-blue-100 text-blue-800' },
  moa: { label: 'MOA', color: 'bg-purple-100 text-purple-800' },
  entreprise: { label: 'Entreprise', color: 'bg-green-100 text-green-800' },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  actif: { label: 'Actif', color: 'bg-success/20 text-success' },
  termine: { label: 'Terminé', color: 'bg-gray-200 text-gray-600' },
  suspendu: { label: 'Suspendu', color: 'bg-warning/20 text-warning' },
};

const emptyUser = { email: '', password: '', first_name: '', last_name: '', role: 'moe', company: '', phone: '' };
const emptyProgram = { name: '', address: '', city: '', description: '', start_date: '', end_date: '', status: 'actif' };

export default function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'programs'>('stats');

  // Data
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [programs, setPrograms] = useState<ProgramItem[]>([]);

  // Search
  const [userSearch, setUserSearch] = useState('');
  const [programSearch, setProgramSearch] = useState('');

  // Modals
  const [showUserModal, setShowUserModal] = useState(false);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [showProgramDetail, setShowProgramDetail] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editingProgram, setEditingProgram] = useState<string | null>(null);

  // Forms
  const [userForm, setUserForm] = useState<any>({ ...emptyUser });
  const [programForm, setProgramForm] = useState<any>({ ...emptyProgram });

  // Add member to program (from program detail)
  const [addMemberProgramId, setAddMemberProgramId] = useState<string | null>(null);
  const [addMemberUserId, setAddMemberUserId] = useState('');
  const [addMemberRole, setAddMemberRole] = useState('membre');

  // Assign dossiers to user
  const [showAssignModal, setShowAssignModal] = useState<UserItem | null>(null);
  const [assignUserPrograms, setAssignUserPrograms] = useState<any[]>([]);
  const [assignRole, setAssignRole] = useState('membre');
  const [assignSelectedPrograms, setAssignSelectedPrograms] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);

  if (user?.role !== 'superadmin') return <Navigate to="/dashboard" />;

  useEffect(() => {
    loadStats();
    loadUsers();
    loadPrograms();
  }, []);

  const loadStats = () => api.get('/admin/stats').then(r => setStats(r.data)).catch(() => {});
  const loadUsers = () => api.get('/admin/users').then(r => setUsers(r.data)).catch(() => {});
  const loadPrograms = () => api.get('/admin/programs').then(r => setPrograms(r.data)).catch(() => {});

  // ─── USER CRUD ───
  const openCreateUser = () => {
    setUserForm({ ...emptyUser });
    setEditingUser(null);
    setShowUserModal(true);
  };

  const openEditUser = (u: UserItem) => {
    setUserForm({ ...u, password: '' });
    setEditingUser(u.id);
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    setSaving(true);
    try {
      if (editingUser) {
        await api.put(`/admin/users/${editingUser}`, userForm);
      } else {
        if (!userForm.password) { alert('Mot de passe requis'); setSaving(false); return; }
        await api.post('/admin/users', userForm);
      }
      setShowUserModal(false);
      loadUsers();
      loadStats();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur');
    }
    setSaving(false);
  };

  // ─── ASSIGN DOSSIERS ───
  const openAssignModal = async (u: UserItem) => {
    setShowAssignModal(u);
    setAssignSelectedPrograms([]);
    setAssignRole('membre');
    try {
      const res = await api.get(`/admin/users/${u.id}`);
      setAssignUserPrograms(res.data.programs || []);
    } catch { setAssignUserPrograms([]); }
  };

  const handleAssignPrograms = async () => {
    if (!showAssignModal || assignSelectedPrograms.length === 0) return;
    setSaving(true);
    try {
      await api.post(`/admin/users/${showAssignModal.id}/assign-programs`, {
        program_ids: assignSelectedPrograms,
        role: assignRole
      });
      // Refresh
      const res = await api.get(`/admin/users/${showAssignModal.id}`);
      setAssignUserPrograms(res.data.programs || []);
      setAssignSelectedPrograms([]);
      loadPrograms();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur');
    }
    setSaving(false);
  };

  const handleUnassignProgram = async (programId: string) => {
    if (!showAssignModal) return;
    if (!confirm('Retirer cet utilisateur de ce dossier ?')) return;
    try {
      await api.delete(`/admin/users/${showAssignModal.id}/programs/${programId}`);
      const res = await api.get(`/admin/users/${showAssignModal.id}`);
      setAssignUserPrograms(res.data.programs || []);
      loadPrograms();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur');
    }
  };

  const handleChangeAssignRole = async (programId: string, newRole: string) => {
    if (!showAssignModal) return;
    try {
      await api.put(`/admin/users/${showAssignModal.id}/programs/${programId}`, { role: newRole });
      const res = await api.get(`/admin/users/${showAssignModal.id}`);
      setAssignUserPrograms(res.data.programs || []);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Supprimer l'utilisateur "${name}" ? Cette action est irréversible.`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      loadUsers();
      loadStats();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur');
    }
  };

  // ─── PROGRAM CRUD ───
  const openCreateProgram = () => {
    setProgramForm({ ...emptyProgram });
    setEditingProgram(null);
    setShowProgramModal(true);
  };

  const openEditProgram = (p: ProgramItem) => {
    setProgramForm({ name: p.name, address: p.address || '', city: p.city || '', description: p.description || '', start_date: p.start_date || '', end_date: p.end_date || '', status: p.status });
    setEditingProgram(p.id);
    setShowProgramModal(true);
  };

  const handleSaveProgram = async () => {
    setSaving(true);
    try {
      if (editingProgram) {
        await api.put(`/admin/programs/${editingProgram}`, programForm);
      } else {
        await api.post('/admin/programs', programForm);
      }
      setShowProgramModal(false);
      loadPrograms();
      loadStats();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur');
    }
    setSaving(false);
  };

  const handleDeleteProgram = async (id: string, name: string) => {
    if (!confirm(`Supprimer le programme "${name}" et toutes ses données (opérations, contrôles, photos) ? Cette action est irréversible.`)) return;
    try {
      await api.delete(`/admin/programs/${id}`);
      loadPrograms();
      loadStats();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur');
    }
  };

  const openProgramDetail = async (id: string) => {
    try {
      const res = await api.get(`/admin/programs/${id}`);
      setShowProgramDetail(res.data);
    } catch { }
  };

  const handleAddMember = async () => {
    if (!addMemberProgramId || !addMemberUserId) return;
    try {
      await api.post(`/admin/programs/${addMemberProgramId}/members`, { user_id: addMemberUserId, role: addMemberRole });
      openProgramDetail(addMemberProgramId);
      setAddMemberUserId('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur');
    }
  };

  const handleRemoveMember = async (programId: string, userId: string) => {
    if (!confirm('Retirer ce membre du programme ?')) return;
    try {
      await api.delete(`/admin/programs/${programId}/members/${userId}`);
      openProgramDetail(programId);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur');
    }
  };

  // Filters
  const filteredUsers = users.filter(u =>
    `${u.first_name} ${u.last_name} ${u.email} ${u.company || ''} ${u.role}`.toLowerCase().includes(userSearch.toLowerCase())
  );
  const filteredPrograms = programs.filter(p =>
    `${p.name} ${p.address || ''} ${p.city || ''} ${p.status}`.toLowerCase().includes(programSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-800 text-white rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield size={28} />
          <div>
            <h1 className="text-2xl font-bold">Administration</h1>
            <p className="text-amber-200 text-sm">GROUPE ALPHA ISI - Gestion des utilisateurs et dossiers</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: 'stats', label: 'Vue d\'ensemble', icon: BarChart3 },
          { key: 'users', label: `Utilisateurs (${users.length})`, icon: Users },
          { key: 'programs', label: `Dossiers (${programs.length})`, icon: FolderOpen },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${activeTab === tab.key ? 'bg-amber-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════ STATISTIQUES ═══════════ */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Utilisateurs" value={stats.users} color="bg-blue-500" />
            <StatCard label="Programmes" value={stats.programs} color="bg-purple-500" />
            <StatCard label="Programmes actifs" value={stats.activePrograms} color="bg-green-500" />
            <StatCard label="Opérations" value={stats.operations} color="bg-orange-500" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard label="Contrôles total" value={stats.controls} color="bg-gray-500" />
            <StatCard label="Conformes" value={stats.conformeControls} color="bg-emerald-500" />
            <StatCard label="Non conformes" value={stats.nonConformeControls} color="bg-red-500" />
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-accent mb-4">Répartition par rôle</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.roleBreakdown).map(([role, count]) => (
                <div key={role} className="flex items-center gap-3 p-3 bg-bg rounded-xl">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${ROLE_LABELS[role]?.color || 'bg-gray-100'}`}>
                    {ROLE_LABELS[role]?.label || role}
                  </span>
                  <span className="font-bold text-accent">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ UTILISATEURS ═══════════ */}
      {activeTab === 'users' && (
        <div>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Rechercher un utilisateur..." value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>
            <button onClick={openCreateUser}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 transition whitespace-nowrap">
              <UserPlus size={16} /> Nouvel utilisateur
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Utilisateur</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Email</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Rôle</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Société</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Dossiers</th>
                    <th className="text-center px-5 py-3 text-gray-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map(u => {
                    const roleInfo = ROLE_LABELS[u.role] || { label: u.role, color: 'bg-gray-100 text-gray-600' };
                    return (
                      <tr key={u.id} className="hover:bg-gray-50 transition">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 ${u.role === 'superadmin' ? 'bg-amber-500' : 'bg-primary'} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                              {u.role === 'superadmin' ? <Shield size={14} /> : `${u.first_name[0]}${u.last_name[0]}`}
                            </div>
                            <div>
                              <p className="font-medium text-accent">{u.first_name} {u.last_name}</p>
                              <p className="text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString('fr-FR')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-gray-600">{u.email}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleInfo.color}`}>{roleInfo.label}</span>
                        </td>
                        <td className="px-5 py-3 text-gray-600">{u.company || '—'}</td>
                        <td className="px-5 py-3">
                          <button onClick={() => openAssignModal(u)}
                            className="text-xs px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition flex items-center gap-1 font-medium">
                            <FolderOpen size={12} /> Gérer dossiers
                          </button>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => openEditUser(u)} className="text-primary hover:text-primary-dark p-1.5 rounded hover:bg-primary/10 transition" title="Modifier">
                              <Pencil size={15} />
                            </button>
                            {u.id !== user?.id && (
                              <button onClick={() => handleDeleteUser(u.id, `${u.first_name} ${u.last_name}`)} className="text-danger hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition" title="Supprimer">
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredUsers.length === 0 && (
              <div className="p-8 text-center text-gray-400">Aucun utilisateur trouvé.</div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════ PROGRAMMES / DOSSIERS ═══════════ */}
      {activeTab === 'programs' && (
        <div>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Rechercher un dossier..." value={programSearch}
                onChange={e => setProgramSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>
            <button onClick={openCreateProgram}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 transition whitespace-nowrap">
              <FolderPlus size={16} /> Nouveau dossier
            </button>
          </div>

          <div className="space-y-3">
            {filteredPrograms.map(p => {
              const statusInfo = STATUS_LABELS[p.status] || { label: p.status, color: 'bg-gray-100' };
              return (
                <div key={p.id} className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-accent text-lg">{p.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                      </div>
                      <p className="text-sm text-gray-500">{[p.address, p.city].filter(Boolean).join(', ') || 'Aucune adresse'}</p>
                      <div className="flex gap-4 mt-2 text-xs text-gray-400">
                        <span>Créé par : {p.created_by_name || '—'}</span>
                        <span>{p.operations_count || 0} opération(s)</span>
                        <span>{p.members_count || 0} membre(s)</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openProgramDetail(p.id)} className="text-gray-500 hover:text-primary p-2 rounded hover:bg-primary/10 transition" title="Voir détails">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => openEditProgram(p)} className="text-primary hover:text-primary-dark p-2 rounded hover:bg-primary/10 transition" title="Modifier">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDeleteProgram(p.id, p.name)} className="text-danger hover:text-red-700 p-2 rounded hover:bg-red-50 transition" title="Supprimer">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {filteredPrograms.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-400">Aucun dossier trouvé.</div>
          )}
        </div>
      )}

      {/* ═══════════ MODAL UTILISATEUR ═══════════ */}
      {showUserModal && (
        <Modal title={editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'} onClose={() => setShowUserModal(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                <input value={userForm.first_name} onChange={e => setUserForm({ ...userForm, first_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input value={userForm.last_name} onChange={e => setUserForm({ ...userForm, last_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe {editingUser ? '(laisser vide pour ne pas changer)' : '*'}
              </label>
              <input type="password" value={userForm.password || ''} onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rôle *</label>
              <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none">
                <option value="superadmin">Super Admin</option>
                <option value="moe">MOE (Maître d'œuvre)</option>
                <option value="moa">MOA (Maître d'ouvrage)</option>
                <option value="entreprise">Entreprise</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Société</label>
                <input value={userForm.company || ''} onChange={e => setUserForm({ ...userForm, company: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input value={userForm.phone || ''} onChange={e => setUserForm({ ...userForm, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSaveUser} disabled={saving}
                className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 transition disabled:opacity-50">
                <Save size={14} /> {saving ? 'Sauvegarde...' : 'Enregistrer'}
              </button>
              <button onClick={() => setShowUserModal(false)} className="border border-gray-300 px-5 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition">Annuler</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ═══════════ MODAL PROGRAMME ═══════════ */}
      {showProgramModal && (
        <Modal title={editingProgram ? 'Modifier le dossier' : 'Nouveau dossier'} onClose={() => setShowProgramModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom du programme *</label>
              <input value={programForm.name} onChange={e => setProgramForm({ ...programForm, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input value={programForm.address} onChange={e => setProgramForm({ ...programForm, address: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                <input value={programForm.city} onChange={e => setProgramForm({ ...programForm, city: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea rows={3} value={programForm.description} onChange={e => setProgramForm({ ...programForm, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none resize-none" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
                <input type="date" value={programForm.start_date} onChange={e => setProgramForm({ ...programForm, start_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
                <input type="date" value={programForm.end_date} onChange={e => setProgramForm({ ...programForm, end_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select value={programForm.status} onChange={e => setProgramForm({ ...programForm, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none">
                  <option value="actif">Actif</option>
                  <option value="termine">Terminé</option>
                  <option value="suspendu">Suspendu</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSaveProgram} disabled={saving}
                className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 transition disabled:opacity-50">
                <Save size={14} /> {saving ? 'Sauvegarde...' : 'Enregistrer'}
              </button>
              <button onClick={() => setShowProgramModal(false)} className="border border-gray-300 px-5 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition">Annuler</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ═══════════ MODAL ASSIGNATION DOSSIERS ═══════════ */}
      {showAssignModal && (
        <Modal title={`Dossiers de ${showAssignModal.first_name} ${showAssignModal.last_name}`} onClose={() => setShowAssignModal(null)} wide>
          <div className="space-y-6">
            {/* Dossiers déjà assignés */}
            <div>
              <h4 className="font-bold text-accent mb-3 flex items-center gap-2">
                <FolderOpen size={16} /> Dossiers assignés ({assignUserPrograms.length})
              </h4>
              {assignUserPrograms.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-6 text-center">
                  <FolderOpen size={32} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Aucun dossier assigné à cet utilisateur.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {assignUserPrograms.map((p: any) => {
                    const statusInfo = STATUS_LABELS[p.status] || { label: p.status, color: 'bg-gray-100' };
                    return (
                      <div key={p.id} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <FolderOpen size={14} className="text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-accent">{p.name}</p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusInfo.color}`}>{statusInfo.label}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <select value={p.member_role}
                            onChange={e => handleChangeAssignRole(p.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-amber-500 outline-none bg-white">
                            <option value="admin">Admin</option>
                            <option value="membre">Membre</option>
                            <option value="lecteur">Lecteur</option>
                          </select>
                          <button onClick={() => handleUnassignProgram(p.id)}
                            className="text-danger hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition" title="Retirer du dossier">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Assigner de nouveaux dossiers */}
            <div className="border-t border-gray-100 pt-4">
              <h4 className="font-bold text-accent mb-3 flex items-center gap-2">
                <Plus size={16} /> Assigner de nouveaux dossiers
              </h4>
              {(() => {
                const assignedIds = assignUserPrograms.map((p: any) => p.id);
                const availablePrograms = programs.filter(p => !assignedIds.includes(p.id));

                if (availablePrograms.length === 0) {
                  return <p className="text-sm text-gray-400 italic">Tous les dossiers sont déjà assignés à cet utilisateur.</p>;
                }

                return (
                  <>
                    <div className="mb-3 flex items-center gap-3">
                      <label className="text-sm text-gray-600">Rôle pour les nouveaux dossiers :</label>
                      <select value={assignRole} onChange={e => setAssignRole(e.target.value)}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-amber-500 outline-none">
                        <option value="admin">Admin</option>
                        <option value="membre">Membre</option>
                        <option value="lecteur">Lecteur</option>
                      </select>
                    </div>

                    <div className="border border-gray-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                      {availablePrograms.map(p => {
                        const isSelected = assignSelectedPrograms.includes(p.id);
                        const statusInfo = STATUS_LABELS[p.status] || { label: p.status, color: 'bg-gray-100' };
                        return (
                          <label key={p.id}
                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition
                              ${isSelected ? 'bg-amber-50' : 'hover:bg-gray-50'}`}>
                            <input type="checkbox" checked={isSelected}
                              onChange={() => {
                                setAssignSelectedPrograms(prev =>
                                  isSelected ? prev.filter(id => id !== p.id) : [...prev, p.id]
                                );
                              }}
                              className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-accent">{p.name}</p>
                              <p className="text-xs text-gray-400">{[p.address, p.city].filter(Boolean).join(', ') || 'Aucune adresse'}</p>
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusInfo.color}`}>{statusInfo.label}</span>
                          </label>
                        );
                      })}
                    </div>

                    {assignSelectedPrograms.length > 0 && (
                      <div className="flex items-center justify-between mt-4 bg-amber-50 rounded-xl p-3">
                        <span className="text-sm text-amber-800 font-medium">
                          {assignSelectedPrograms.length} dossier(s) sélectionné(s)
                        </span>
                        <button onClick={handleAssignPrograms} disabled={saving}
                          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition disabled:opacity-50">
                          <Save size={14} /> {saving ? 'Assignation...' : 'Assigner'}
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </Modal>
      )}

      {/* ═══════════ MODAL DÉTAIL PROGRAMME ═══════════ */}
      {showProgramDetail && (
        <Modal title={`Dossier : ${showProgramDetail.name}`} onClose={() => { setShowProgramDetail(null); setAddMemberProgramId(null); }} wide>
          <div className="space-y-6">
            {/* Info programme */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Adresse :</span> <span className="font-medium">{showProgramDetail.address || '—'}, {showProgramDetail.city || '—'}</span></div>
              <div><span className="text-gray-500">Statut :</span> <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_LABELS[showProgramDetail.status]?.color}`}>{STATUS_LABELS[showProgramDetail.status]?.label}</span></div>
              <div><span className="text-gray-500">Début :</span> <span className="font-medium">{showProgramDetail.start_date || '—'}</span></div>
              <div><span className="text-gray-500">Fin :</span> <span className="font-medium">{showProgramDetail.end_date || '—'}</span></div>
              <div className="col-span-2"><span className="text-gray-500">Créé par :</span> <span className="font-medium">{showProgramDetail.created_by_name || '—'}</span></div>
            </div>

            {/* Membres */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-accent">Membres ({showProgramDetail.members?.length || 0})</h4>
                <button onClick={() => setAddMemberProgramId(addMemberProgramId ? null : showProgramDetail.id)}
                  className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1">
                  <UserPlus size={14} /> Ajouter
                </button>
              </div>

              {addMemberProgramId && (
                <div className="bg-amber-50 rounded-lg p-3 mb-3 flex flex-wrap gap-2 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-xs text-gray-500 mb-1 block">Utilisateur</label>
                    <select value={addMemberUserId} onChange={e => setAddMemberUserId(e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none">
                      <option value="">Sélectionner...</option>
                      {users.filter(u => !showProgramDetail.members?.some((m: any) => m.id === u.id)).map(u => (
                        <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Rôle</label>
                    <select value={addMemberRole} onChange={e => setAddMemberRole(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none">
                      <option value="admin">Admin</option>
                      <option value="membre">Membre</option>
                      <option value="lecteur">Lecteur</option>
                    </select>
                  </div>
                  <button onClick={handleAddMember} className="bg-amber-600 text-white px-3 py-1.5 rounded text-sm hover:bg-amber-700 transition">Ajouter</button>
                </div>
              )}

              <div className="space-y-2">
                {showProgramDetail.members?.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {m.first_name?.[0]}{m.last_name?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{m.first_name} {m.last_name}</p>
                        <p className="text-xs text-gray-400">{m.email} · {m.company || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{m.member_role}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_LABELS[m.role]?.color}`}>{ROLE_LABELS[m.role]?.label}</span>
                      <button onClick={() => handleRemoveMember(showProgramDetail.id, m.id)} className="text-danger hover:text-red-700 p-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {(!showProgramDetail.members || showProgramDetail.members.length === 0) && (
                  <p className="text-sm text-gray-400 italic">Aucun membre</p>
                )}
              </div>
            </div>

            {/* Opérations */}
            <div>
              <h4 className="font-bold text-accent mb-3">Opérations ({showProgramDetail.operations?.length || 0})</h4>
              <div className="space-y-2">
                {showProgramDetail.operations?.map((op: any) => (
                  <div key={op.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{op.name}</p>
                      <p className="text-xs text-gray-400">
                        {[op.building && `Bât. ${op.building}`, op.floor, op.assigned_name && `Assigné: ${op.assigned_name}`].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${op.status === 'termine' ? 'bg-success/20 text-success' : op.status === 'en_cours' ? 'bg-warning/20 text-warning' : 'bg-gray-200 text-gray-600'}`}>
                      {op.status === 'termine' ? 'Terminé' : op.status === 'en_cours' ? 'En cours' : 'À faire'}
                    </span>
                  </div>
                ))}
                {(!showProgramDetail.operations || showProgramDetail.operations.length === 0) && (
                  <p className="text-sm text-gray-400 italic">Aucune opération</p>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Composants utilitaires ───

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
          <span className="text-white font-bold text-lg">{value}</span>
        </div>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-xl ${wide ? 'max-w-3xl' : 'max-w-lg'} w-full max-h-[85vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-accent">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition"><X size={20} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
