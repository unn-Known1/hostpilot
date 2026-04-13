const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  readHosts: () => ipcRenderer.invoke('read-hosts'),
  writeHosts: (entries) => ipcRenderer.invoke('write-hosts', entries),
  getHostsPath: () => ipcRenderer.invoke('get-hosts-path'),
  validateEntry: (ip, hostname) => ipcRenderer.invoke('validate-entry', ip, hostname),
  flushDNS: () => ipcRenderer.invoke('flush-dns'),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  getHostHistory: () => ipcRenderer.invoke('get-host-history'),
  getRunningProcesses: () => ipcRenderer.invoke('get-running-processes'),
  backupHosts: () => ipcRenderer.invoke('backup-hosts'),
  getBackups: () => ipcRenderer.invoke('get-backups'),
  restoreBackup: (path) => ipcRenderer.invoke('restore-backup', path),
  showSaveDialog: (opts) => ipcRenderer.invoke('show-save-dialog', opts),
  showOpenDialog: (opts) => ipcRenderer.invoke('show-open-dialog', opts),
  exportHosts: (path, entries) => ipcRenderer.invoke('export-hosts', path, entries),
  importHosts: (path) => ipcRenderer.invoke('import-hosts', path),
  getGroups: () => ipcRenderer.invoke('get-groups'),
  getPresets: () => ipcRenderer.invoke('get-presets'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url)
});