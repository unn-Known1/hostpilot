import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Shield, Search, Plus, RefreshCw, Download, Upload, Moon, Sun, ToggleLeft, ToggleRight, Edit2, Trash2, X, CheckCircle, AlertCircle, Clock, Copy, Zap, Folder, Tag, ChevronDown, ChevronRight, Database, Code, Server, Cloud, Trash, LayoutGrid, List, AlertTriangle, Keyboard, Bookmark, Star, Archive } from 'lucide-react';

const translations = {
  en: { appName: 'HostPilot', hostsFileManager: 'Hosts File Manager', total: 'Total', enabled: 'Enabled', disabled: 'Disabled', filtered: 'Filtered', search: 'Search hosts, IPs...', all: 'All', addEntry: 'Add Entry', editEntry: 'Edit Entry', ipAddress: 'IP Address', hostname: 'Hostname', comment: 'Comment (Optional)', group: 'Group', cancel: 'Cancel', add: 'Add', update: 'Update', backupHistory: 'Backup History', createBackup: 'Create Backup', saveCurrentHosts: 'Save your current hosts file', backupNow: 'Backup Now', noBackups: 'No backups yet', noEntries: 'No entries', noResults: 'No results found', tryDifferent: 'Try different search terms', addFirst: 'Add your first host entry', default: 'Default', applyPreset: 'Apply Template', importHosts: 'Import Hosts', exportHosts: 'Export Hosts', selectFile: 'Select File', exportAll: 'Export All', dnsFlushed: 'DNS cache flushed successfully!', dnsFlushFailed: 'Failed to flush DNS cache', invalidIP: 'Invalid IP address', invalidHostname: 'Invalid hostname', systemEntry: 'System Entry', cannotDeleteSystem: 'Cannot delete system entries', cannotToggleSystem: 'Cannot toggle system entries', loadedSuccessfully: 'Loaded successfully', savedSuccessfully: 'Saved successfully', backupCreated: 'Backup created', restored: 'Restored from backup', imported: 'Imported successfully', exported: 'Exported successfully', deleted: 'Deleted successfully', copied: 'Copied to clipboard', warnings: 'Warnings' },
  zh: { appName: 'HostPilot', hostsFileManager: 'Hosts 文件管理器', total: '总计', enabled: '已启用', disabled: '已禁用', filtered: '已筛选', search: '搜索主机, IP...', all: '全部', addEntry: '添加条目', editEntry: '编辑条目', ipAddress: 'IP 地址', hostname: '主机名', comment: '备注（可选）', group: '分组', cancel: '取消', add: '添加', update: '更新', backupHistory: '备份历史', createBackup: '创建备份', saveCurrentHosts: '保存当前 hosts 文件', backupNow: '立即备份', noBackups: '暂无备份', noEntries: '暂无条目', noResults: '未找到结果', tryDifferent: '尝试不同的搜索词', addFirst: '添加您的第一个主机条目', default: '默认', applyPreset: '应用模板', importHosts: '导入 Hosts', exportHosts: '导出 Hosts', selectFile: '选择文件', exportAll: '导出全部', dnsFlushed: 'DNS 缓存刷新成功！', dnsFlushFailed: 'DNS 缓存刷新失败', invalidIP: '无效的 IP 地址', invalidHostname: '无效的主机名', systemEntry: '系统条目', cannotDeleteSystem: '无法删除系统条目', cannotToggleSystem: '无法切换系统条目', loadedSuccessfully: '加载成功', savedSuccessfully: '保存成功', backupCreated: '备份已创建', restored: '已从备份恢复', imported: '导入成功', exported: '导出成功', deleted: '删除成功', copied: '已复制到剪贴板', warnings: '警告' }
};

const shortcuts = [
  { key: 'Ctrl+N', action: 'Add new entry' }, { key: 'Ctrl+S', action: 'Save changes' }, { key: 'Ctrl+F', action: 'Focus search' },
  { key: 'Ctrl+B', action: 'Create backup' }, { key: 'Ctrl+E', action: 'Export hosts' }, { key: 'Ctrl+D', action: 'Flush DNS' }, { key: 'Esc', action: 'Close modal' }
];

function App() {
  const [entries, setEntries] = useState([]);
  const [groups, setGroups] = useState([]);
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntries, setSelectedEntries] = useState(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [showPresetsModal, setShowPresetsModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showWarningsModal, setShowWarningsModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [hostsPath, setHostsPath] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [warnings, setWarnings] = useState([]);
  const [viewMode, setViewMode] = useState('list');
  const [lang, setLang] = useState('en');
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  const t = translations[lang] || translations.en;

  useEffect(() => {
    loadHosts(); loadHostsPath(); loadGroups(); loadPresets();
    const isDark = localStorage.getItem('darkMode') === 'true' || window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(isDark);
    const savedLang = localStorage.getItem('lang') || 'en';
    setLang(savedLang);
    if (isDark) document.documentElement.classList.add('dark');
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.ctrlKey && e.key === 'n') { e.preventDefault(); setEditingEntry(null); setShowAddModal(true); }
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); saveHosts(entries); }
    if (e.ctrlKey && e.key === 'f') { e.preventDefault(); document.getElementById('search-input')?.focus(); }
    if (e.ctrlKey && e.key === 'b') { e.preventDefault(); handleQuickBackup(); }
    if (e.ctrlKey && e.key === 'e') { e.preventDefault(); setShowImportExportModal(true); }
    if (e.ctrlKey && e.key === 'd') { e.preventDefault(); handleFlushDNS(); }
    if (e.key === 'Escape') { setShowAddModal(false); setShowBackupModal(false); setShowImportExportModal(false); setShowPresetsModal(false); setShowShortcutsModal(false); setShowWarningsModal(false); }
  }, [entries]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
    newMode ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark');
  };

  const loadHostsPath = async () => { try { setHostsPath(await window.electronAPI.getHostsPath()); } catch {} };
  const loadGroups = async () => { try { const g = await window.electronAPI.getGroups(); setGroups(g); } catch {} };
  const loadPresets = async () => { try { const p = await window.electronAPI.getPresets(); setPresets(p); } catch {} };

  const loadHosts = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.readHosts();
      if (result.success) { setEntries(result.entries); setWarnings(result.warnings || []); showToast(t.loadedSuccessfully, 'success'); }
      else showToast(result.error || 'Failed to load', 'error');
    } catch { showToast('Error loading hosts', 'error'); }
    setLoading(false);
  };

  const saveHosts = async (newEntries) => {
    try {
      const result = await window.electronAPI.writeHosts(newEntries, groups);
      if (result.success) { setEntries(newEntries); showToast(t.savedSuccessfully, 'success'); return true; }
      else { showToast(result.error || 'Failed to save', 'error'); return false; }
    } catch { showToast('Error saving', 'error'); return false; }
  };

  const handleQuickBackup = async () => { await window.electronAPI.backupHosts(); showToast(t.backupCreated, 'success'); };

  const handleFlushDNS = async () => {
    const result = await window.electronAPI.flushDNS();
    showToast(result.success ? t.dnsFlushed : t.dnsFlushFailed, result.success ? 'success' : 'error');
  };

  const showToast = (message, type = 'info') => { setToast({ message, type }); setTimeout(() => setToast(null), 3500); };

  const handleAddEntry = async (entry) => {
    const newEntry = { ...entry, id: `${Date.now()}`, enabled: true, isSystem: false };
    if (await saveHosts([...entries, newEntry])) setShowAddModal(false);
  };

  const handleEditEntry = async (updated) => {
    const newEntries = entries.map(e => e.id === updated.id ? updated : e);
    if (await saveHosts(newEntries)) { setEditingEntry(null); setShowAddModal(false); }
  };

  const handleDelete = async (id) => {
    if (entries.find(e => e.id === id)?.isSystem) { showToast(t.cannotDeleteSystem, 'error'); return; }
    if (await saveHosts(entries.filter(e => e.id !== id))) setSelectedEntries(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const handleToggle = async (id) => {
    const entry = entries.find(e => e.id === id);
    if (entry?.isSystem) { showToast(t.cannotToggleSystem, 'error'); return; }
    await saveHosts(entries.map(e => e.id === id ? { ...e, enabled: !e.enabled } : e));
  };

  const handleGroupChange = async (id, newGroup) => {
    const newEntries = entries.map(e => e.id === id ? { ...e, group: newGroup } : e);
    await saveHosts(newEntries);
  };

  const handleApplyPreset = async (preset) => {
    const newEntries = [...entries];
    preset.entries.forEach(pe => {
      const exists = newEntries.some(e => e.hostname === pe.hostname);
      if (!exists) newEntries.push({ ...pe, id: `${Date.now()}-${Math.random()}`, enabled: true, isSystem: false, group: 'custom' });
    });
    await saveHosts(newEntries);
    showToast(`Applied ${preset.label}`, 'success');
    setShowPresetsModal(false);
  };

  const filteredEntries = useMemo(() => entries.filter(entry => {
    if (selectedGroup !== 'all' && entry.group !== selectedGroup) return false;
    if (filter === 'enabled' && !entry.enabled) return false;
    if (filter === 'disabled' && entry.enabled) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return entry.ip.toLowerCase().includes(q) || entry.hostname.toLowerCase().includes(q) || entry.comment.toLowerCase().includes(q);
    }
    return true;
  }), [entries, searchQuery, filter, selectedGroup]);

  const groupedEntries = useMemo(() => {
    const groups_data = {};
    filteredEntries.forEach(e => {
      const g = e.group || 'default';
      if (!groups_data[g]) groups_data[g] = [];
      groups_data[g].push(e);
    });
    return groups_data;
  }, [filteredEntries]);

  const toggleSelection = (id) => setSelectedEntries(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const handleBulkDelete = async () => { await saveHosts(entries.filter(e => !selectedEntries.has(e.id) || e.isSystem)); setSelectedEntries(new Set()); showToast(t.deleted, 'success'); };

  const getGroupIcon = (groupName) => {
    const icons = { development: Code, staging: Server, production: Cloud, blocklist: Shield, custom: Folder, default: Tag };
    return icons[groupName] || Tag;
  };

  const getGroupColor = (groupName) => {
    const colors = { development: '#10b981', staging: '#f59e0b', production: '#ef4444', blocklist: '#6366f1', custom: '#8b5cf6', default: '#6b7280' };
    return colors[groupName] || '#6b7280';
  };

  const toggleGroupExpand = (groupName) => {
    setExpandedGroups(prev => { const n = new Set(prev); n.has(groupName) ? n.delete(groupName) : n.add(groupName); return n; });
  };

  const getGroupStats = (groupName) => {
    const groupEntries = entries.filter(e => (e.group || 'default') === groupName);
    return { total: groupEntries.length, enabled: groupEntries.filter(e => e.enabled).length };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-all duration-300">
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-11 h-11 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 transform rotate-3 hover:rotate-0 transition-transform">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{t.appName}</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t.hostsFileManager}</p>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gray-100/80 dark:bg-gray-800/80 rounded-lg text-sm font-mono text-gray-600 dark:text-gray-300 max-w-md border border-gray-200/50 dark:border-gray-700/50">
              <Database className="w-4 h-4 text-gray-400" />
              <span className="truncate">{hostsPath}</span>
            </div>
            <div className="flex items-center gap-2">
              {warnings.length > 0 && (
                <button onClick={() => setShowWarningsModal(true)} className="p-2.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 relative">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center">{warnings.length}</span>
                </button>
              )}
              <button onClick={handleFlushDNS} className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50" title="Flush DNS (Ctrl+D)">
                <Zap className="w-5 h-5" />
              </button>
              <button onClick={() => setShowPresetsModal(true)} className="p-2.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50" title={t.applyPreset}>
                <Bookmark className="w-5 h-5" />
              </button>
              <button onClick={() => setShowShortcutsModal(true)} className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400" title="Keyboard Shortcuts">
                <Keyboard className="w-5 h-5" />
              </button>
              <button onClick={toggleDarkMode} className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400">
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <select value={lang} onChange={e => { setLang(e.target.value); localStorage.setItem('lang', e.target.value); }} className="px-2 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
                <option value="en">EN</option>
                <option value="zh">中文</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={<Shield className="w-5 h-5" />} label={t.total} value={entries.length} color="blue" />
          <StatCard icon={<ToggleRight className="w-5 h-5" />} label={t.enabled} value={entries.filter(e => e.enabled).length} color="green" />
          <StatCard icon={<ToggleLeft className="w-5 h-5" />} label={t.disabled} value={entries.filter(e => !e.enabled).length} color="orange" />
          <StatCard icon={<Search className="w-5 h-5" />} label={t.filtered} value={filteredEntries.length} color="purple" />
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-4 mb-6 transition-all">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full md:max-w-lg">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input id="search-input" type="text" placeholder={t.search} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-100/80 dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-gray-100/80 dark:bg-gray-900/50 rounded-lg p-1">
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-800'}`}><List className="w-4 h-4" /></button>
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-800'}`}><LayoutGrid className="w-4 h-4" /></button>
              </div>
              <select value={filter} onChange={e => setFilter(e.target.value)} className="px-3 py-2.5 bg-gray-100/80 dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-700/50 rounded-lg text-sm"><option value="all">{t.all}</option><option value="enabled">{t.enabled}</option><option value="disabled">{t.disabled}</option></select>
              <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} className="px-3 py-2.5 bg-gray-100/80 dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-700/50 rounded-lg text-sm"><option value="all">Groups</option>{groups.map(g => <option key={g.id} value={g.name}>{g.label}</option>)}<option value="default">{t.default}</option></select>
              <button onClick={loadHosts} className="p-2.5 bg-gray-100/80 dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-700/50 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"><RefreshCw className="w-5 h-5" /></button>
              <button onClick={() => setShowBackupModal(true)} className="p-2.5 bg-gray-100/80 dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-700/50 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"><Download className="w-5 h-5" /></button>
              <button onClick={() => setShowImportExportModal(true)} className="p-2.5 bg-gray-100/80 dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-700/50 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"><Upload className="w-5 h-5" /></button>
              <button onClick={() => { setEditingEntry(null); setShowAddModal(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/30 transition-all"><Plus className="w-5 h-5" /><span className="font-medium">{t.addEntry}</span></button>
            </div>
          </div>
          {selectedEntries.size > 0 && (
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50 animate-fade-in">
              <span className="text-sm text-gray-500">{selectedEntries.size} selected</span>
              <button onClick={handleBulkDelete} className="px-4 py-2 text-sm bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-2"><Trash className="w-4 h-4" /> Delete</button>
              <button onClick={() => setSelectedEntries(new Set())} className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Clear Selection</button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-16 text-center">
            <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-16 text-center">
            <AlertCircle className="w-20 h-20 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <h3 className="text-xl font-semibold mb-2">{searchQuery ? t.noResults : t.noEntries}</h3>
            <p className="text-gray-500">{searchQuery ? t.tryDifferent : t.addFirst}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedEntries).map(([groupName, groupItems]) => (
              <div key={groupName} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden transition-all hover:shadow-xl">
                <button onClick={() => toggleGroupExpand(groupName)} className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-700/50 hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-700 dark:hover:to-gray-600/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: getGroupColor(groupName) + '20', color: getGroupColor(groupName) }}>
                      {React.createElement(getGroupIcon(groupName), { className: 'w-4 h-4' })}
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold capitalize">{groupName}</h3>
                      <p className="text-sm text-gray-500">{getGroupStats(groupName).enabled} / {getGroupStats(groupName).total} active</p>
                    </div>
                  </div>
                  {expandedGroups.has(groupName) ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
                {expandedGroups.has(groupName) && (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {groupItems.map(entry => (
                      <div key={entry.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-blue-50/50 dark:hover:bg-gray-700/50 transition-colors group">
                        <div className="col-span-1"><input type="checkbox" checked={selectedEntries.has(entry.id)} onChange={() => toggleSelection(entry.id)} className="w-4 h-4 rounded border-gray-300" /></div>
                        <div className="col-span-2">
                          <button onClick={() => handleToggle(entry.id)} disabled={entry.isSystem} className={`flex items-center gap-2 ${entry.enabled ? 'text-green-600' : 'text-gray-400'} ${entry.isSystem ? 'opacity-50 cursor-not-allowed' : 'hover:text-green-700'}`}>
                            {entry.enabled ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                            <span className="text-sm font-medium">{entry.enabled ? t.enabled : t.disabled}</span>
                          </button>
                        </div>
                        <div className="col-span-3">
                          <code className="text-sm font-mono px-2 py-1 bg-gray-100 dark:bg-gray-900 rounded-lg">{entry.ip}</code>
                          {entry.isSystem && <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full font-medium">{t.systemEntry}</span>}
                        </div>
                        <div className="col-span-3">
                          <span className="font-medium">{entry.hostname}</span>
                          {entry.comment && <p className="text-sm text-gray-500 mt-0.5">{entry.comment}</p>}
                        </div>
                        <div className="col-span-3 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <select value={entry.group || 'default'} onChange={e => handleGroupChange(entry.id, e.target.value)} className="px-2 py-1 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-sm">
                            <option value="default">{t.default}</option>
                            {groups.map(g => <option key={g.id} value={g.name}>{g.label}</option>)}
                          </select>
                          <button onClick={() => { setEditingEntry(entry); setShowAddModal(true); }} disabled={entry.isSystem} className={`p-2 rounded-lg ${entry.isSystem ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(entry.id)} disabled={entry.isSystem} className={`p-2 rounded-lg ${entry.isSystem ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600'}`}><Trash2 className="w-4 h-4" /></button>
                          <button onClick={() => { navigator.clipboard.writeText(`${entry.ip} ${entry.hostname}`); showToast(t.copied, 'success'); }} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><Copy className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {showAddModal && <AddEditModal entry={editingEntry} groups={groups} onClose={() => { setShowAddModal(false); setEditingEntry(null); }} onSave={editingEntry ? handleEditEntry : handleAddEntry} t={t} />}
      {showBackupModal && <BackupModal onClose={() => setShowBackupModal(false)} t={t} showToast={showToast} />}
      {showImportExportModal && <ImportExportModal onClose={() => setShowImportExportModal(false)} entries={entries} groups={groups} onImport={async (imported) => { const merged = [...entries, ...imported.filter(i => !entries.some(e => e.hostname === i.hostname))]; await saveHosts(merged); showToast(t.imported, 'success'); }} t={t} showToast={showToast} />}
      {showPresetsModal && <PresetsModal presets={presets} onClose={() => setShowPresetsModal(false)} onApply={handleApplyPreset} t={t} />}
      {showShortcutsModal && <ShortcutsModal onClose={() => setShowShortcutsModal(false)} shortcuts={shortcuts} />}
      {showWarningsModal && <WarningsModal warnings={warnings} onClose={() => setShowWarningsModal(false)} t={t} />}

      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-6 py-4 rounded-2xl border shadow-2xl animate-slide-up ${toast.type === 'success' ? 'bg-green-50/95 border-green-200 text-green-800 backdrop-blur-xl' : 'bg-red-50/95 border-red-200 text-red-800 backdrop-blur-xl'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          <p className="font-semibold">{toast.message}</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colors = { blue: 'from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 text-blue-600 dark:text-blue-400', green: 'from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 text-green-600 dark:text-green-400', orange: 'from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/10 text-orange-600 dark:text-orange-400', purple: 'from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 text-purple-600 dark:text-purple-400' };
  return (<div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-4 hover:shadow-xl transition-all hover:-translate-y-1"><div className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br ${colors[color]}`}>{icon}</div><div className="mt-3"><p className="text-3xl font-bold">{value}</p><p className="text-sm text-gray-500">{label}</p></div></div>);
}

function AddEditModal({ entry, groups, onClose, onSave, t }) {
  const [form, setForm] = useState({ ip: entry?.ip || '', hostname: entry?.hostname || '', comment: entry?.comment || '', group: entry?.group || 'default' });
  const [ipError, setIpError] = useState('');
  const [hostnameError, setHostnameError] = useState('');
  const validateForm = async () => {
    if (!form.ip.trim() || !form.hostname.trim()) return false;
    const validation = await window.electronAPI.validateEntry(form.ip, form.hostname);
    setIpError(validation.ipValid ? '' : t.invalidIP);
    setHostnameError(validation.hostnameValid ? '' : t.invalidHostname);
    return validation.ipValid && validation.hostnameValid;
  };
  const handleSubmit = async (e) => { e.preventDefault(); if (await validateForm()) onSave({ ...entry, ...form }); };
  const handleIPChange = async (value) => { setForm({ ...form, ip: value }); if (value) { const v = await window.electronAPI.validateEntry(value, form.hostname); setIpError(v.ipValid ? '' : t.invalidIP); } };
  const handleHostnameChange = async (value) => { setForm({ ...form, hostname: value }); if (value) { const v = await window.electronAPI.validateEntry(form.ip, value); setHostnameError(v.hostnameValid ? '' : t.invalidHostname); } };
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg animate-slide-up overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-700/50">
          <h2 className="text-xl font-bold">{entry ? t.editEntry : t.addEntry}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div><label className="block text-sm font-semibold mb-2">{t.ipAddress}</label><input type="text" value={form.ip} onChange={e => handleIPChange(e.target.value)} placeholder="127.0.0.1" className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border ${ipError ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-xl font-mono focus:ring-2 focus:ring-blue-500`} />{ipError && <p className="text-red-500 text-sm mt-1">{ipError}</p>}</div>
          <div><label className="block text-sm font-semibold mb-2">{t.hostname}</label><input type="text" value={form.hostname} onChange={e => handleHostnameChange(e.target.value)} placeholder="example.local" className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border ${hostnameError ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-xl font-mono focus:ring-2 focus:ring-blue-500`} />{hostnameError && <p className="text-red-500 text-sm mt-1">{hostnameError}</p>}</div>
          <div><label className="block text-sm font-semibold mb-2">{t.comment}</label><input type="text" value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} placeholder="Add a note..." className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-sm font-semibold mb-2">{t.group}</label><select value={form.group} onChange={e => setForm({ ...form, group: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500"><option value="default">{t.default}</option>{groups.map(g => <option key={g.id} value={g.name}>{g.label}</option>)}</select></div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700"><button type="button" onClick={onClose} className="px-5 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">{t.cancel}</button><button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl flex items-center gap-2 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/30"><CheckCircle className="w-5 h-5" />{entry ? t.update : t.add}</button></div>
        </form>
      </div>
    </div>
  );
}

function BackupModal({ onClose, t, showToast }) {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { loadBackups(); }, []);
  const loadBackups = async () => { setLoading(true); const b = await window.electronAPI.getBackups(); setBackups(b); setLoading(false); };
  const handleBackup = async () => { const result = await window.electronAPI.backupHosts(); if (result.success) { showToast(t.backupCreated, 'success'); loadBackups(); } else showToast(result.error || 'Backup failed', 'error'); };
  const handleRestore = async (path) => { const result = await window.electronAPI.restoreBackup(path); if (result.success) showToast(t.restored, 'success'); else showToast(result.error || 'Restore failed', 'error'); };
  const formatDate = (d) => new Date(d).toLocaleString();
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700"><h2 className="text-xl font-bold">{t.backupHistory}</h2><button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5" /></button></div>
        <div className="p-6 overflow-y-auto">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 mb-6 flex items-center justify-between">
            <div><h3 className="font-semibold flex items-center gap-2"><Database className="w-5 h-5" />{t.createBackup}</h3><p className="text-sm text-gray-500">{t.saveCurrentHosts}</p></div>
            <button onClick={handleBackup} className="px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl flex items-center gap-2 hover:from-blue-600 hover:to-indigo-700 shadow-lg"><Download className="w-5 h-5" />{t.backupNow}</button>
          </div>
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Clock className="w-5 h-5" />{t.backupHistory}</h3>
          {loading ? <div className="text-center py-8"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div></div> : backups.length === 0 ? <p className="text-center py-12 text-gray-500">{t.noBackups}</p> : (
            <div className="space-y-3">{backups.map(b => (
              <div key={b.path} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div><p className="font-medium flex items-center gap-2"><Archive className="w-4 h-4 text-gray-400" />{formatDate(b.date)}</p><p className="text-sm text-gray-500 font-mono">{b.name}</p></div>
                <button onClick={() => handleRestore(b.path)} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700">{t.update ? 'Restore' : 'Restore'}</button>
              </div>
            ))}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ImportExportModal({ onClose, entries, groups, onImport, t, showToast }) {
  const [imported, setImported] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const handleImport = async () => { const result = await window.electronAPI.showOpenDialog({ title: t.importHosts, filters: [{ name: 'Hosts', extensions: ['txt', 'hosts'] }], properties: ['openFile'] }); if (!result.canceled && result.filePaths[0]) { const r = await window.electronAPI.importHosts(result.filePaths[0]); if (r.success) { setImported(r.entries); setSelected(new Set(r.entries.map(e => e.id))); } } };
  const handleExport = async () => { const result = await window.electronAPI.showSaveDialog({ title: t.export, defaultPath: 'hosts-export.txt', filters: [{ name: 'Hosts', extensions: ['txt'] }] }); if (!result.canceled && result.filePath) { await window.electronAPI.exportHosts(result.filePath, entries, groups); showToast(t.exported, 'success'); } };
  const toggle = (id) => { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n); };
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700"><h2 className="text-xl font-bold">{t.importHosts} / {t.exportHosts}</h2><button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5" /></button></div>
        <div className="p-6 space-y-6">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Download className="w-5 h-5" />{t.importHosts}</h3>
            {imported.length === 0 ? (<button onClick={handleImport} className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 flex items-center justify-center gap-3 text-gray-500 hover:text-blue-500 transition-colors"><Upload className="w-6 h-6" />{t.selectFile}</button>) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">{imported.map(e => (<label key={e.id} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${selected.has(e.id) ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'}`}><input type="checkbox" checked={selected.has(e.id)} onChange={() => toggle(e.id)} className="w-5 h-5" /><code className="font-mono text-sm">{e.ip} {e.hostname}</code></label>))}<button onClick={() => onImport(imported.filter(e => selected.has(e.id)))} className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl mt-3 hover:from-blue-600 hover:to-indigo-700">{t.import} {selected.size} Entries</button></div>
            )}
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Upload className="w-5 h-5" />{t.exportHosts}</h3>
            <button onClick={handleExport} className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl flex items-center justify-center gap-3 hover:from-green-600 hover:to-emerald-700 shadow-lg"><Download className="w-6 h-6" />{t.exportAll} ({entries.length} {t.total})</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PresetsModal({ presets, onClose, onApply, t }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700"><h2 className="text-xl font-bold">{t.applyPreset}</h2><button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5" /></button></div>
        <div className="p-6 grid gap-4 overflow-y-auto">{presets.map(preset => (
          <div key={preset.id} className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-5 hover:shadow-lg transition-all cursor-pointer" onClick={() => onApply(preset)}>
            <div className="flex items-center justify-between">
              <div><h3 className="font-semibold flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500" />{preset.label}</h3><p className="text-sm text-gray-500 mt-1">{preset.description}</p><p className="text-xs text-gray-400 mt-2">{preset.entries.length} entries</p></div>
              <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700">{t.applyPreset}</button>
            </div>
          </div>
        ))}</div>
      </div>
    </div>
  );
}

function ShortcutsModal({ onClose, shortcuts }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700"><h2 className="text-xl font-bold">Keyboard Shortcuts</h2><button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5" /></button></div>
        <div className="p-6 space-y-3">{shortcuts.map((s, i) => (<div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl"><span className="text-gray-600 dark:text-gray-300">{s.action}</span><kbd className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg font-mono text-sm">{s.key}</kbd></div>))}</div>
      </div>
    </div>
  );
}

function WarningsModal({ warnings, onClose, t }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700"><h2 className="text-xl font-bold flex items-center gap-2"><AlertTriangle className="w-6 h-6 text-amber-500" />{t.warnings}</h2><button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5" /></button></div>
        <div className="p-6 space-y-3 max-h-80 overflow-y-auto">{warnings.map((w, i) => (<div key={i} className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800"><AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" /><div><p className="font-medium">Line {w.line}</p><p className="text-sm text-gray-600 dark:text-gray-400">{w.message}</p></div></div>))}</div>
      </div>
    </div>
  );
}

export default App;
