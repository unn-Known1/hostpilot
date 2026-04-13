import React, { useState, useEffect } from 'react';
import { Sun, Moon, Monitor, Plus, Trash2, Save, Download, Upload, Search, ChevronDown, ChevronRight, AlertTriangle, CheckCircle, XCircle, RefreshCw, History, Shield, Code, Server, Cloud, Folder, Eye, EyeOff, Clock, Cpu, HardDrive, Wifi, Database, Terminal } from 'lucide-react';

const translations = {
  en: {
    appName: 'HostPilot', search: 'Search hosts...', addEntry: 'Add Entry', ip: 'IP Address', hostname: 'Hostname', comment: 'Comment', group: 'Group', save: 'Save', cancel: 'Cancel', delete: 'Delete', enabled: 'Enabled', disabled: 'Disabled', import: 'Import', export: 'Export', backup: 'Backup', restore: 'Restore', flushDNS: 'Flush DNS', history: 'History', systemInfo: 'System Info', warnings: 'Warnings', presets: 'Presets', noEntries: 'No host entries found', saveSuccess: 'Hosts file saved!', backupSuccess: 'Backup created!', restoreSuccess: 'Restored!', dnsFlushed: 'DNS cache flushed!', importSuccess: 'Hosts imported!', runningProcesses: 'Running Processes', uptime: 'Uptime', memory: 'Memory', platform: 'Platform', entries: 'entries', total: 'Total', active: 'Active', recentActivity: 'Recent Activity', lightTheme: 'Light', darkTheme: 'Dark', development: 'Development', staging: 'Staging', production: 'Production', blocklist: 'Blocklist', custom: 'Custom', localDev: 'Local Development', adBlock: 'Ad Blocking', privacy: 'Privacy Protection', applyPreset: 'Apply Preset', validIP: 'Valid IP', invalidIP: 'Invalid IP', validHostname: 'Valid Hostname', invalidHostname: 'Invalid Hostname'
  },
  zh: {
    appName: 'HostPilot', search: '搜索主机...', addEntry: '添加条目', ip: 'IP 地址', hostname: '主机名', comment: '备注', group: '分组', save: '保存', cancel: '取消', delete: '删除', enabled: '已启用', disabled: '已禁用', import: '导入', export: '导出', backup: '备份', restore: '恢复', flushDNS: '刷新 DNS', history: '历史', systemInfo: '系统信息', warnings: '警告', presets: '预设', noEntries: '未找到主机条目', saveSuccess: '主机文件已保存！', backupSuccess: '备份已创建！', restoreSuccess: '已恢复！', dnsFlushed: 'DNS 缓存已刷新！', importSuccess: '主机已导入！', runningProcesses: '运行中的进程', uptime: '运行时间', memory: '内存', platform: '平台', entries: '条目', total: '总计', active: '活跃', recentActivity: '最近活动', lightTheme: '浅色', darkTheme: '深色', development: '开发', staging: '测试', production: '生产', blocklist: '黑名单', custom: '自定义', localDev: '本地开发', adBlock: '广告拦截', privacy: '隐私保护', applyPreset: '应用预设', validIP: '有效 IP', invalidIP: '无效 IP', validHostname: '有效主机名', invalidHostname: '无效主机名'
  }
};

const groupIcons = { development: Code, staging: Server, production: Cloud, blocklist: Shield, custom: Folder };
const groupColors = { development: 'bg-emerald-500', staging: 'bg-amber-500', production: 'bg-red-500', blocklist: 'bg-indigo-500', custom: 'bg-violet-500' };

function App() {
  const [theme, setTheme] = useState('dark');
  const [lang, setLang] = useState('en');
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [groups, setGroups] = useState([]);
  const [presets, setPresets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPresetsModal, setShowPresetsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSystemModal, setShowSystemModal] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [warnings, setWarnings] = useState([]);
  const [hostHistory, setHostHistory] = useState([]);
  const [systemInfo, setSystemInfo] = useState(null);
  const [stats, setStats] = useState({ total: 0, active: 0 });
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [hostsPath, setHostsPath] = useState('');
  const [newEntry, setNewEntry] = useState({ ip: '', hostname: '', comment: '', group: 'custom' });
  const [ipValidation, setIpValidation] = useState({ valid: null, message: '' });
  const [hostnameValidation, setHostnameValidation] = useState({ valid: null, message: '' });

  const t = translations[lang];

  useEffect(() => {
    const savedTheme = localStorage.getItem('hostpilot-theme') || 'dark';
    const savedLang = localStorage.getItem('hostpilot-lang') || 'en';
    setTheme(savedTheme);
    setLang(savedLang);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    document.documentElement.classList.toggle('light', savedTheme === 'light');
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem('hostpilot-theme', theme);
  }, [theme]);

  useEffect(() => { localStorage.setItem('hostpilot-lang', lang); }, [lang]);
  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!searchTerm) setFilteredEntries(entries);
    else setFilteredEntries(entries.filter(e => e.ip.toLowerCase().includes(searchTerm.toLowerCase()) || e.hostname.toLowerCase().includes(searchTerm.toLowerCase()) || (e.comment && e.comment.toLowerCase().includes(searchTerm.toLowerCase()))));
  }, [searchTerm, entries]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'n': e.preventDefault(); setShowAddModal(true); break;
          case 's': e.preventDefault(); handleSave(); break;
          case 'f': e.preventDefault(); document.getElementById('search-input')?.focus(); break;
          case 'b': e.preventDefault(); handleBackup(); break;
          case 'e': e.preventDefault(); setShowPresetsModal(true); break;
          case 'd': e.preventDefault(); handleFlushDNS(); break;
        }
      }
      if (e.key === 'Escape') { setShowAddModal(false); setShowPresetsModal(false); setShowHistoryModal(false); setShowSystemModal(false); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [entries]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [hostsData, groupsData, presetsData, systemData, backupsData, historyData] = await Promise.all([
        window.electronAPI.readHosts(), window.electronAPI.getGroups(), window.electronAPI.getPresets(),
        window.electronAPI.getSystemInfo(), window.electronAPI.getBackups(), window.electronAPI.getHostHistory()
      ]);
      if (hostsData.success) {
        setEntries(hostsData.entries); setFilteredEntries(hostsData.entries); setWarnings(hostsData.warnings || []);
        setStats({ total: hostsData.stats?.totalEntries || hostsData.entries.length, active: hostsData.stats?.enabledEntries || hostsData.entries.length });
        setHostsPath(hostsData.path || '');
      }
      setGroups(groupsData); setPresets(presetsData); setSystemInfo(systemData);
      setHostHistory(historyData || []);
      const expanded = {}; groupsData.forEach(g => { expanded[g.id] = true; }); setExpandedGroups(expanded);
    } catch (error) { showNotification('Failed to load: ' + error.message, 'error'); }
    finally { setLoading(false); }
  };

  const showNotification = (message, type = 'success') => { setNotification({ message, type }); setTimeout(() => setNotification(null), 3000); };
  const validateIP = async (ip) => { const result = await window.electronAPI.validateEntry(ip, ''); setIpValidation({ valid: result.ipValid, message: result.ipValid ? t.validIP : t.invalidIP }); return result.ipValid; };
  const validateHostname = async (hostname) => { const result = await window.electronAPI.validateEntry('', hostname); setHostnameValidation({ valid: result.hostnameValid, message: result.hostnameValid ? t.validHostname : t.invalidHostname }); return result.hostnameValid; };
  const handleSave = async () => { try { const result = await window.electronAPI.writeHosts(entries); if (result.success) { showNotification(t.saveSuccess); loadData(); } else { showNotification(result.error, 'error'); } } catch (error) { showNotification(error.message, 'error'); } };
  const handleBackup = async () => { try { const result = await window.electronAPI.backupHosts(); if (result.success) { showNotification(t.backupSuccess); loadData(); } else { showNotification(result.error, 'error'); } } catch (error) { showNotification(error.message, 'error'); } };
  const handleFlushDNS = async () => { try { const result = await window.electronAPI.flushDNS(); if (result.success) showNotification(t.dnsFlushed); else showNotification(result.error, 'error'); } catch (error) { showNotification(error.message, 'error'); } };
  const handleImport = async () => { try { const result = await window.electronAPI.showOpenDialog({ filters: [{ name: 'Hosts', extensions: ['txt', 'hosts'] }] }); if (!result.canceled && result.filePaths[0]) { const importResult = await window.electronAPI.importHosts(result.filePaths[0]); if (importResult.success) { setEntries([...entries, ...importResult.entries]); showNotification(t.importSuccess); } else showNotification(importResult.error, 'error'); } } catch (error) { showNotification(error.message, 'error'); } };
  const handleExport = async () => { try { const result = await window.electronAPI.showSaveDialog({ defaultPath: 'hosts', filters: [{ name: 'Hosts', extensions: ['txt', 'hosts'] }] }); if (!result.canceled && result.filePath) { const exportResult = await window.electronAPI.exportHosts(result.filePath, entries); if (exportResult.success) showNotification(t.saveSuccess); else showNotification(exportResult.error, 'error'); } } catch (error) { showNotification(error.message, 'error'); } };
  const handleRestore = async (backupPath) => { if (window.confirm(t.confirmRestore || 'Restore?')) { try { const result = await window.electronAPI.restoreBackup(backupPath); if (result.success) { showNotification(t.restoreSuccess); loadData(); } else showNotification(result.error, 'error'); } catch (error) { showNotification(error.message, 'error'); } } };
  const handleAddEntry = async () => { const ipValid = await validateIP(newEntry.ip); const hostnameValid = await validateHostname(newEntry.hostname); if (!ipValid || !hostnameValid) { showNotification('Fix validation errors', 'error'); return; } const entry = { id: Date.now(), ip: newEntry.ip, hostname: newEntry.hostname, comment: newEntry.comment, group: newEntry.group, enabled: true }; setEntries([...entries, entry]); setNewEntry({ ip: '', hostname: '', comment: '', group: 'custom' }); setShowAddModal(false); };
  const handleUpdateEntry = (id, updates) => { setEntries(entries.map(e => e.id === id ? { ...e, ...updates } : e)); };
  const handleDeleteEntry = (id) => { if (window.confirm(t.delete + '?')) setEntries(entries.filter(e => e.id !== id)); };
  const handleApplyPreset = (preset) => { const presetEntries = preset.entries.map((e, i) => ({ id: Date.now() + i, ip: e.ip, hostname: e.hostname, comment: e.comment, group: preset.id === 'ad-block' || preset.id === 'privacy' ? 'blocklist' : 'development', enabled: true })); setEntries([...entries, ...presetEntries]); setShowPresetsModal(false); showNotification('Preset applied: ' + preset.label); };
  const toggleGroup = (groupId) => { setExpandedGroups({ ...expandedGroups, [groupId]: !expandedGroups[groupId] }); };
  const getEntriesByGroup = (groupId) => filteredEntries.filter(e => (e.group || 'custom') === groupId);
  const formatBytes = (bytes) => { if (bytes === 0) return '0 B'; const k = 1024; const sizes = ['B', 'KB', 'MB', 'GB']; const i = Math.floor(Math.log(bytes) / Math.log(k)); return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]; };
  const formatDate = (date) => new Date(date).toLocaleString();
  const getGroupStats = (groupId) => { const groupEntries = entries.filter(e => (e.group || 'custom') === groupId); return { total: groupEntries.length, active: groupEntries.filter(e => e.enabled).length }; };

  if (loading) return (<div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-100'}`}><div className="text-center"><RefreshCw className={`w-12 h-12 mx-auto mb-4 animate-spin ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} /><p className={`text-lg ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Loading HostPilot...</p></div></div>);

  return (
    <div className={`min-h-screen transition-colors duration-200 ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
      {notification && (<div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg animate-slide-up ${notification.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'} text-white`}>{notification.message}</div>)}

      <header className={`sticky top-0 z-40 backdrop-blur-lg ${theme === 'dark' ? 'bg-slate-900/80 border-slate-700' : 'bg-white/80 border-slate-200'} border-b`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${theme === 'dark' ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gradient-to-br from-blue-600 to-purple-700'} flex items-center justify-center`}><Terminal className="w-6 h-6 text-white" /></div>
                <div><h1 className="text-xl font-bold">{t.appName}</h1><p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{hostsPath}</p></div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center"><div className={`text-2xl font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>{stats.total}</div><div className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{t.total}</div></div>
              <div className="text-center"><div className={`text-2xl font-bold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>{stats.active}</div><div className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{t.active}</div></div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center rounded-lg p-1 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`}>
                <button onClick={() => setTheme('light')} className={`p-2 rounded-md transition-all ${theme === 'light' ? 'bg-white shadow-sm' : 'hover:bg-slate-700'}`}><Sun className={`w-4 h-4 ${theme === 'light' ? 'text-amber-500' : ''}`} /></button>
                <button onClick={() => setTheme('dark')} className={`p-2 rounded-md transition-all ${theme === 'dark' ? 'bg-slate-700' : 'hover:bg-slate-300'}`}><Moon className={`w-4 h-4 ${theme === 'dark' ? 'text-blue-400' : ''}`} /></button>
              </div>
              <button onClick={() => setLang(lang === 'en' ? 'zh' : 'en')} className={`px-3 py-2 rounded-lg font-medium text-sm ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-slate-200'}`}>{lang === 'en' ? '中文' : 'EN'}</button>
              <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"><Plus className="w-4 h-4" />{t.addEntry}</button>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <div className={`relative flex-1 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} rounded-lg`}>
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
              <input id="search-input" type="text" placeholder={t.search} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full pl-10 pr-4 py-2.5 bg-transparent rounded-lg outline-none ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`} />
            </div>
            <button onClick={handleImport} className={`p-2.5 rounded-lg ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-slate-200'}`} title={t.import}><Upload className="w-5 h-5" /></button>
            <button onClick={handleExport} className={`p-2.5 rounded-lg ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-slate-200'}`} title={t.export}><Download className="w-5 h-5" /></button>
            <button onClick={handleBackup} className={`p-2.5 rounded-lg ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-slate-200'}`} title={t.backup}><Database className="w-5 h-5" /></button>
            <button onClick={handleFlushDNS} className={`p-2.5 rounded-lg ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-slate-200'}`} title={t.flushDNS}><RefreshCw className="w-5 h-5" /></button>
            <button onClick={() => setShowHistoryModal(true)} className={`p-2.5 rounded-lg ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-slate-200'}`} title={t.history}><History className="w-5 h-5" /></button>
            <button onClick={() => setShowSystemModal(true)} className={`p-2.5 rounded-lg ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-slate-200'}`} title={t.systemInfo}><Monitor className="w-5 h-5" /></button>
            <button onClick={() => setShowPresetsModal(true)} className={`p-2.5 rounded-lg ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-slate-200'}`} title={t.presets}><Shield className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      {warnings.length > 0 && (<div className="max-w-7xl mx-auto px-4 py-3"><div className="flex items-center gap-2 px-4 py-3 bg-amber-500/20 border border-amber-500/30 rounded-lg"><AlertTriangle className="w-5 h-5 text-amber-500" /><span className="text-amber-500">{warnings.length} {t.warnings}</span><button onClick={() => setWarnings([])} className="ml-auto text-amber-500 hover:text-amber-400"><XCircle className="w-5 h-5" /></button></div></div>)}

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="space-y-4">
          {groups.map(group => {
            const groupEntries = getEntriesByGroup(group.id);
            const groupStats = getGroupStats(group.id);
            const GroupIcon = groupIcons[group.id] || Folder;
            const isExpanded = expandedGroups[group.id];
            if (groupEntries.length === 0 && !searchTerm) return null;
            return (
              <div key={group.id} className={`rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-white'} border ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                <button onClick={() => toggleGroup(group.id)} className={`w-full flex items-center justify-between p-4 ${theme === 'dark' ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'} transition-colors`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${groupColors[group.id]} flex items-center justify-center`}><GroupIcon className="w-4 h-4 text-white" /></div>
                    <span className="font-medium">{t[group.id] || group.label}</span>
                    <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{groupStats.active}/{groupStats.total} {t.entries}</span>
                  </div>
                  {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
                {isExpanded && groupEntries.length > 0 && (
                  <div className={`border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                    <table className="w-full">
                      <thead className={`text-left ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                        <tr className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          <th className="px-4 py-2 w-10"></th>
                          <th className="px-4 py-2">{t.ip}</th>
                          <th className="px-4 py-2">{t.hostname}</th>
                          <th className="px-4 py-2">{t.comment}</th>
                          <th className="px-4 py-2 w-20"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupEntries.map(entry => (
                          <tr key={entry.id || entry.hostname} className={`${theme === 'dark' ? 'border-slate-700 hover:bg-slate-700/30' : 'border-slate-200 hover:bg-slate-50'} border-t`}>
                            <td className="px-4 py-3"><button onClick={() => handleUpdateEntry(entry.id, { enabled: !entry.enabled })} className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${entry.enabled ? 'bg-emerald-500' : 'bg-slate-500'}`}>{entry.enabled && <CheckCircle className="w-4 h-4 text-white" />}</button></td>
                            <td className={`px-4 py-3 font-mono text-sm ${!entry.enabled ? 'opacity-50' : ''}`}>{entry.ip}</td>
                            <td className={`px-4 py-3 ${!entry.enabled ? 'opacity-50' : ''}`}>{entry.hostname}</td>
                            <td className={`px-4 py-3 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} ${!entry.enabled ? 'opacity-50' : ''}`}>{entry.comment}</td>
                            <td className="px-4 py-3"><button onClick={() => handleDeleteEntry(entry.id)} className="p-1.5 text-red-500 hover:bg-red-500/20 rounded transition-colors"><Trash2 className="w-4 h-4" /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {entries.length === 0 && (<div className={`text-center py-16 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}><Terminal className="w-16 h-16 mx-auto mb-4 opacity-50" /><p className="text-lg mb-4">{t.noEntries}</p><button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">{t.addEntry}</button></div>)}
      </main>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-2xl animate-slide-up`}>
            <div className="p-6 border-b border-slate-700"><h2 className="text-xl font-bold">{t.addEntry}</h2></div>
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{t.ip}</label>
                <input type="text" value={newEntry.ip} onChange={(e) => { setNewEntry({ ...newEntry, ip: e.target.value }); validateIP(e.target.value); }} placeholder="127.0.0.1" className={`w-full px-4 py-2.5 rounded-lg outline-none ${theme === 'dark' ? 'bg-slate-700 text-slate-100' : 'bg-slate-100 text-slate-900'} ${ipValidation.valid === false ? 'ring-2 ring-red-500' : ipValidation.valid === true ? 'ring-2 ring-emerald-500' : ''}`} />
                {ipValidation.message && <p className={`text-xs mt-1 ${ipValidation.valid ? 'text-emerald-500' : 'text-red-500'}`}>{ipValidation.message}</p>}
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{t.hostname}</label>
                <input type="text" value={newEntry.hostname} onChange={(e) => { setNewEntry({ ...newEntry, hostname: e.target.value }); validateHostname(e.target.value); }} placeholder="example.local" className={`w-full px-4 py-2.5 rounded-lg outline-none ${theme === 'dark' ? 'bg-slate-700 text-slate-100' : 'bg-slate-100 text-slate-900'} ${hostnameValidation.valid === false ? 'ring-2 ring-red-500' : hostnameValidation.valid === true ? 'ring-2 ring-emerald-500' : ''}`} />
                {hostnameValidation.message && <p className={`text-xs mt-1 ${hostnameValidation.valid ? 'text-emerald-500' : 'text-red-500'}`}>{hostnameValidation.message}</p>}
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{t.comment}</label>
                <input type="text" value={newEntry.comment} onChange={(e) => setNewEntry({ ...newEntry, comment: e.target.value })} placeholder="Optional" className={`w-full px-4 py-2.5 rounded-lg outline-none ${theme === 'dark' ? 'bg-slate-700 text-slate-100' : 'bg-slate-100 text-slate-900'}`} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{t.group}</label>
                <select value={newEntry.group} onChange={(e) => setNewEntry({ ...newEntry, group: e.target.value })} className={`w-full px-4 py-2.5 rounded-lg outline-none ${theme === 'dark' ? 'bg-slate-700 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
                  {groups.map(g => (<option key={g.id} value={g.id}>{t[g.id] || g.label}</option>))}
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
              <button onClick={() => { setShowAddModal(false); setNewEntry({ ip: '', hostname: '', comment: '', group: 'custom' }); setIpValidation({ valid: null, message: '' }); setHostnameValidation({ valid: null, message: '' }); }} className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300'}`}>{t.cancel}</button>
              <button onClick={handleAddEntry} disabled={!ipValidation.valid || !hostnameValidation.valid} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">{t.addEntry}</button>
            </div>
          </div>
        </div>
      )}

      {showPresetsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-2xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-2xl animate-slide-up`}>
            <div className="p-6 border-b border-slate-700"><h2 className="text-xl font-bold">{t.presets}</h2></div>
            <div className="p-6 space-y-3">
              {presets.map(preset => (
                <button key={preset.id} onClick={() => handleApplyPreset(preset)} className={`w-full text-left p-4 rounded-xl transition-all ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-100 hover:bg-slate-200'}`}>
                  <div className="flex items-center gap-3 mb-2"><Shield className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} /><span className="font-medium">{t[preset.id] || preset.label}</span></div>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{preset.description}</p>
                  <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{preset.entries.length} entries</p>
                </button>
              ))}
            </div>
            <div className="p-6 border-t border-slate-700 flex justify-end"><button onClick={() => setShowPresetsModal(false)} className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300'}`}>{t.cancel}</button></div>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-2xl rounded-2xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-2xl animate-slide-up`}>
            <div className="p-6 border-b border-slate-700 flex items-center justify-between"><h2 className="text-xl font-bold">{t.history}</h2><button onClick={() => setShowHistoryModal(false)} className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}><XCircle className="w-5 h-5" /></button></div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {hostHistory.length === 0 ? <p className={`text-center py-8 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>No history yet</p> : (
                <div className="space-y-3">
                  {hostHistory.map((item, i) => (
                    <div key={i} className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`}>
                      <div className="flex items-center justify-between mb-1"><span className="font-medium capitalize">{item.action}</span><span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{formatDate(item.timestamp)}</span></div>
                      <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{item.entriesCount} entries {item.details && `- ${item.details}`}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showSystemModal && systemInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-2xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-2xl animate-slide-up`}>
            <div className="p-6 border-b border-slate-700 flex items-center justify-between"><h2 className="text-xl font-bold">{t.systemInfo}</h2><button onClick={() => setShowSystemModal(false)} className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}><XCircle className="w-5 h-5" /></button></div>
            <div className="p-6 space-y-4">
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`}>
                <div className="flex items-center gap-3 mb-3"><Monitor className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} /><span className="font-medium">{t.platform}</span></div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>OS:</span><span className="ml-2 capitalize">{systemInfo.system.platform}</span></div>
                  <div><span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>Arch:</span><span className="ml-2">{systemInfo.system.arch}</span></div>
                  <div><span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>Host:</span><span className="ml-2">{systemInfo.system.hostname}</span></div>
                  <div><span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>User:</span><span className="ml-2">{systemInfo.system.username}</span></div>
                </div>
              </div>
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`}>
                <div className="flex items-center gap-3 mb-3"><Clock className={`w-5 h-5 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`} /><span className="font-medium">{t.uptime}</span></div>
                <div className="text-2xl font-bold text-emerald-500">{systemInfo.system.uptime.formatted}</div>
              </div>
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`}>
                <div className="flex items-center gap-3 mb-3"><HardDrive className={`w-5 h-5 ${theme === 'dark' ? 'text-violet-400' : 'text-violet-600'}`} /><span className="font-medium">{t.memory}</span></div>
                <div className="mb-2"><div className={`h-2 rounded-full ${theme === 'dark' ? 'bg-slate-600' : 'bg-slate-200'}`}><div className="h-2 rounded-full bg-violet-500" style={{ width: `${((systemInfo.system.totalMemory - systemInfo.system.freeMemory) / systemInfo.system.totalMemory) * 100}%` }} /></div></div>
                <div className="flex justify-between text-sm"><span>{formatBytes(systemInfo.system.totalMemory - systemInfo.system.freeMemory)} used</span><span>{formatBytes(systemInfo.system.freeMemory)} free</span></div>
              </div>
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`}>
                <div className="flex items-center gap-3 mb-2"><Terminal className={`w-5 h-5 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} /><span className="font-medium">Hosts File</span></div>
                <p className={`text-sm break-all ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{systemInfo.hostsPath}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <button onClick={handleSave} className="fixed bottom-6 right-6 flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all hover:scale-105"><Save className="w-5 h-5" />{t.save}</button>
      <div className={`fixed bottom-6 left-6 text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Ctrl+N: Add | Ctrl+S: Save | Ctrl+F: Search | Ctrl+B: Backup | Ctrl+E: Presets | Ctrl+D: DNS</div>
    </div>
  );
}

export default App;