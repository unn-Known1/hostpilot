import React, { useState, useEffect, useMemo } from 'react';
import { Shield, Search, Plus, RefreshCw, Download, Upload, Moon, Sun, ToggleLeft, ToggleRight, Edit2, Trash2, X, CheckCircle, AlertCircle, Clock, Copy, Link } from 'lucide-react';

function App() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntries, setSelectedEntries] = useState(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [hostsPath, setHostsPath] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [filter, setFilter] = useState('all');


  useEffect(() => {
    loadHosts();
    loadHostsPath();
    const isDark = localStorage.getItem('darkMode') === 'true' || window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add('dark');
  }, []);


  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
    newMode ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark');
  };

  const loadHostsPath = async () => { try { setHostsPath(await window.electronAPI.getHostsPath()); } catch {} };
  const loadHosts = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.readHosts();
      if (result.success) { setEntries(result.entries); showToast('Loaded successfully', 'success'); }
      else showToast(result.error || 'Failed to load', 'error');
    } catch { showToast('Error loading hosts', 'error'); }
    setLoading(false);
  };


  const saveHosts = async (newEntries) => {
    try {
      const result = await window.electronAPI.writeHosts(newEntries);
      if (result.success) { setEntries(newEntries); showToast('Saved successfully', 'success'); return true; }
      else { showToast(result.error || 'Failed to save', 'error'); return false; }
    } catch { showToast('Error saving', 'error'); return false; }
  };

  const showToast = (message, type = 'info') => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };

  const handleAddEntry = async (entry) => {
    const newEntry = { ...entry, id: `${Date.now()}`, enabled: true, isSystem: false };
    if (await saveHosts([...entries, newEntry])) setShowAddModal(false);
  };


  const handleEditEntry = async (updated) => {
    const newEntries = entries.map(e => e.id === updated.id ? updated : e);
    if (await saveHosts(newEntries)) { setEditingEntry(null); setShowAddModal(false); }
  };


  const handleDelete = async (id) => {
    if (entries.find(e => e.id === id)?.isSystem) { showToast('Cannot delete system entries', 'error'); return; }
    if (await saveHosts(entries.filter(e => e.id !== id))) setSelectedEntries(prev => { const n = new Set(prev); n.delete(id); return n; });
  };


  const handleToggle = async (id) => {
    const entry = entries.find(e => e.id === id);
    if (entry?.isSystem) { showToast('Cannot toggle system entries', 'error'); return; }
    await saveHosts(entries.map(e => e.id === id ? { ...e, enabled: !e.enabled } : e));
  };

  const filteredEntries = useMemo(() => entries.filter(entry => {
    if (filter === 'enabled' && !entry.enabled) return false;
    if (filter === 'disabled' && entry.enabled) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return entry.ip.toLowerCase().includes(q) || entry.hostname.toLowerCase().includes(q) || entry.comment.toLowerCase().includes(q);
    }
    return true;
  }), [entries, searchQuery, filter]);


  const toggleSelection = (id) => setSelectedEntries(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = () => selectedEntries.size === filteredEntries.length ? setSelectedEntries(new Set()) : setSelectedEntries(new Set(filteredEntries.map(e => e.id)));
  const handleBulkDelete = async () => { await saveHosts(entries.filter(e => !selectedEntries.has(e.id) || e.isSystem)); setSelectedEntries(new Set()); showToast(`Deleted ${entries.length - filteredEntries.length} entries`, 'success'); };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-200 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-dark-100 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30"><Shield className="w-6 h-6 text-white" /></div>
              <div><h1 className="text-xl font-bold text-gray-900 dark:text-white">HostPilot</h1><p className="text-xs text-gray-500 dark:text-gray-400">Hosts File Manager</p></div>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-200 rounded-lg text-sm font-mono text-gray-600 dark:text-gray-300 max-w-md truncate">{hostsPath}</div>
            <div className="flex items-center gap-2">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-2.5 hover:bg-gray-100 dark:hover:bg-dark-200 rounded-lg transition-colors text-gray-600 dark:text-gray-400"><Link className="w-5 h-5" /></a>
              <button onClick={toggleDarkMode} className="p-2.5 hover:bg-gray-100 dark:hover:bg-dark-200 rounded-lg transition-colors text-gray-600 dark:text-gray-400">{darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
            </div>
          </div>
        </div>
      </header>


      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={<Shield className="w-5 h-5" />} label="Total" value={entries.length} color="blue" />
          <StatCard icon={<ToggleRight className="w-5 h-5" />} label="Enabled" value={entries.filter(e => e.enabled).length} color="green" />
          <StatCard icon={<ToggleLeft className="w-5 h-5" />} label="Disabled" value={entries.filter(e => !e.enabled).length} color="orange" />
          <StatCard icon={<Search className="w-5 h-5" />} label="Filtered" value={filteredEntries.length} color="purple" />
        </div>

        {/* Action Bar */}
        <div className="bg-white dark:bg-dark-100 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Search hosts, IPs..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-dark-200 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div className="flex items-center gap-2">
              <select value={filter} onChange={e => setFilter(e.target.value)} className="px-3 py-2.5 bg-gray-100 dark:bg-dark-200 border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
                <option value="all">All</option><option value="enabled">Enabled</option><option value="disabled">Disabled</option>
              </select>
              <button onClick={loadHosts} className="p-2.5 bg-gray-100 dark:bg-dark-200 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"><RefreshCw className="w-5 h-5" /></button>
              <button onClick={() => setShowBackupModal(true)} className="p-2.5 bg-gray-100 dark:bg-dark-200 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"><Download className="w-5 h-5" /></button>
              <button onClick={() => setShowImportExportModal(true)} className="p-2.5 bg-gray-100 dark:bg-dark-200 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"><Upload className="w-5 h-5" /></button>
              <button onClick={() => { setEditingEntry(null); setShowAddModal(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-sm"><Plus className="w-5 h-5" /><span>Add Entry</span></button>
            </div>
          </div>
          {selectedEntries.size > 0 && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 animate-fade-in">
              <span className="text-sm text-gray-500">{selectedEntries.size} selected</span>
              <button onClick={handleBulkDelete} className="px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">Delete</button>
            </div>
          )}
        </div>


        {/* Host List */}
        {loading ? (
          <div className="bg-white dark:bg-dark-100 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="bg-white dark:bg-dark-100 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">{searchQuery ? 'No results' : 'No entries'}</h3>
            <p className="text-gray-500">{searchQuery ? 'Try different search terms' : 'Add your first host entry'}</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-100 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 dark:bg-dark-200 text-sm font-medium text-gray-500">
              <div className="col-span-1"><input type="checkbox" checked={selectedEntries.size === filteredEntries.length} onChange={toggleSelectAll} className="w-4 h-4 rounded" /></div>
              <div className="col-span-2">Status</div><div className="col-span-3">IP Address</div><div className="col-span-4">Hostname</div><div className="col-span-2">Actions</div>
            </div>
            {filteredEntries.map(entry => (
              <div key={entry.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 dark:hover:bg-dark-200/50 border-t border-gray-100 dark:border-gray-700/50">
                <div className="col-span-1"><input type="checkbox" checked={selectedEntries.has(entry.id)} onChange={() => toggleSelection(entry.id)} className="w-4 h-4 rounded" /></div>
                <div className="col-span-2">
                  <button onClick={() => handleToggle(entry.id)} disabled={entry.isSystem} className={`flex items-center gap-2 ${entry.enabled ? 'text-green-600' : 'text-gray-400'} ${entry.isSystem ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {entry.enabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                    <span className="text-sm">{entry.enabled ? 'Enabled' : 'Disabled'}</span>
                  </button>
                </div>
                <div className="col-span-3 font-mono text-sm">{entry.ip}{entry.isSystem && <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">System</span>}</div>
                <div className="col-span-4"><span className="font-medium">{entry.hostname}</span>{entry.comment && <p className="text-sm text-gray-500">{entry.comment}</p>}</div>
                <div className="col-span-2 flex items-center gap-1">
                  <button onClick={() => { setEditingEntry(entry); setShowAddModal(true); }} disabled={entry.isSystem} className={`p-2 rounded-lg ${entry.isSystem ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-dark-200'}`}><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(entry.id)} disabled={entry.isSystem} className={`p-2 rounded-lg ${entry.isSystem ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600'}`}><Trash2 className="w-4 h-4" /></button>
                  <button onClick={() => navigator.clipboard.writeText(`${entry.ip} ${entry.hostname}`)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-200"><Copy className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      {showAddModal && <AddEditModal entry={editingEntry} onClose={() => { setShowAddModal(false); setEditingEntry(null); }} onSave={editingEntry ? handleEditEntry : handleAddEntry} />}

      {/* Backup Modal */}
      {showBackupModal && <BackupModal onClose={() => setShowBackupModal(false)} onBackup={async () => { await window.electronAPI.backupHosts(); showToast('Backup created', 'success'); }} onRestore={async (p) => { await window.electronAPI.restoreBackup(p); loadHosts(); showToast('Restored', 'success'); }} onLoadBackups={async () => window.electronAPI.getBackups()} />}


      {/* Import/Export Modal */}
      {showImportExportModal && <ImportExportModal onClose={() => setShowImportExportModal(false)} entries={entries} onImport={async (imported) => { const merged = [...entries, ...imported.filter(i => !entries.some(e => e.hostname === i.hostname))]; await saveHosts(merged); showToast(`Imported ${imported.length} entries`, 'success'); }} onExport={async () => { const result = await window.electronAPI.showSaveDialog({ title: 'Export', defaultPath: 'hosts', filters: [{ name: 'Hosts', extensions: ['txt'] }] }); if (!result.canceled && result.filePath) { await window.electronAPI.exportHosts(result.filePath); showToast('Exported', 'success'); } }} />}


      {/* Toast */}
      {toast && <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-5 py-3 rounded-xl border shadow-lg animate-slide-in ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
        {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
        <p className="font-medium">{toast.message}</p>
      </div>}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colors = { blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600', green: 'bg-green-50 dark:bg-green-900/20 text-green-600', orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600', purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' };
  return <div className="bg-white dark:bg-dark-100 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4"><div className="flex items-center gap-3"><div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div><div><p className="text-2xl font-bold">{value}</p><p className="text-sm text-gray-500">{label}</p></div></div></div>;
}

function AddEditModal({ entry, onClose, onSave }) {
  const [form, setForm] = useState({ ip: entry?.ip || '', hostname: entry?.hostname || '', comment: entry?.comment || '' });
  const [errors, setErrors] = useState({});
  const isValid = form.ip.trim() && form.hostname.trim() && Object.keys(errors).length === 0;
  const handleSubmit = (e) => { e.preventDefault(); if (isValid) onSave({ ...entry, ...form }); };
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-2xl w-full max-w-lg animate-slide-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold">{entry ? 'Edit Entry' : 'Add Entry'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-200 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">IP Address</label>
            <input type="text" value={form.ip} onChange={e => setForm({ ...form, ip: e.target.value })} placeholder="127.0.0.1" className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-200 border border-gray-200 dark:border-gray-700 rounded-lg font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Hostname</label>
            <input type="text" value={form.hostname} onChange={e => setForm({ ...form, hostname: e.target.value })} placeholder="example.local" className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-200 border border-gray-200 dark:border-gray-700 rounded-lg font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Comment (Optional)</label>
            <input type="text" value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} placeholder="Add a note..." className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-200 border border-gray-200 dark:border-gray-700 rounded-lg" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-5 py-2.5 hover:bg-gray-100 dark:hover:bg-dark-200 rounded-lg">Cancel</button>
            <button type="submit" disabled={!isValid} className={`px-5 py-2.5 rounded-lg flex items-center gap-2 ${isValid ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}><CheckCircle className="w-5 h-5" />{entry ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BackupModal({ onClose, onBackup, onRestore, onLoadBackups }) {
  const [backups, setBackups] = useState([]);
  useEffect(() => { onLoadBackups().then(setBackups); }, []);
  const formatDate = (d) => new Date(d).toLocaleString();
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-2xl w-full max-w-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b"><h2 className="text-xl font-bold">Backup & Restore</h2><button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button></div>
        <div className="p-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 mb-6 flex items-center justify-between">
            <div><h3 className="font-semibold">Create Backup</h3><p className="text-sm text-gray-500">Save your current hosts file</p></div>
            <button onClick={onBackup} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"><Download className="w-4 h-4" />Backup Now</button>
          </div>
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Clock className="w-5 h-5" />Backup History</h3>
          {backups.length === 0 ? <p className="text-center py-8 text-gray-500">No backups yet</p> : (
            <div className="space-y-3">{backups.map(b => (
              <div key={b.path} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-200 rounded-xl">
                <div><p className="font-medium">{formatDate(b.date)}</p><p className="text-sm text-gray-500 font-mono">{b.name}</p></div>
                <button onClick={() => onRestore(b.path)} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Restore</button>
              </div>
            ))}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ImportExportModal({ onClose, entries, onImport, onExport }) {
  const [imported, setImported] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const handleImport = async () => {
    const result = await window.electronAPI.showOpenDialog({ title: 'Import', filters: [{ name: 'Hosts', extensions: ['txt', 'hosts'] }], properties: ['openFile'] });
    if (!result.canceled && result.filePaths[0]) {
      const r = await window.electronAPI.importHosts(result.filePaths[0]);
      if (r.success) { setImported(r.entries); setSelected(new Set(r.entries.map(e => e.id))); }
    }
  };
  const toggle = (id) => { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n); };
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-2xl w-full max-w-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b"><h2 className="text-xl font-bold">Import & Export</h2><button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button></div>
        <div className="p-6 space-y-6">
          <div className="bg-gray-50 dark:bg-dark-200 rounded-xl p-5">
            <h3 className="font-semibold mb-2">Import Hosts</h3>
            {imported.length === 0 ? (
              <button onClick={handleImport} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary-500 flex items-center justify-center gap-2"><Upload className="w-5 h-5" />Select File</button>
            ) : (
              <div className="space-y-2">{imported.map(e => (
                <label key={e.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${selected.has(e.id) ? 'bg-primary-50 border border-primary-200' : 'bg-white'}`}>
                  <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggle(e.id)} className="w-4 h-4" />
                  <span className="font-mono">{e.ip} {e.hostname}</span>
                </label>
              ))}
              <button onClick={() => onImport(imported.filter(e => selected.has(e.id)))} className="w-full py-2 bg-primary-600 text-white rounded-lg mt-2">Import {selected.size} Entries</button></div>
            )}
          </div>
          <div className="bg-gray-50 dark:bg-dark-200 rounded-xl p-5">
            <h3 className="font-semibold mb-2">Export Hosts</h3>
            <button onClick={onExport} className="w-full py-3 bg-green-600 text-white rounded-xl flex items-center justify-center gap-2"><Download className="w-5 h-5" />Export All ({entries.length} entries)</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
