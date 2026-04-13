const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
  readHosts: () => ipcRenderer.invoke('read-hosts'),
  writeHosts: (entries, groups) => ipcRenderer.invoke('write-hosts', entries, groups),
  getHostsPath: () => ipcRenderer.invoke('get-hosts-path'),
  validateEntry: (ip, hostname) => ipcRenderer.invoke('validate-entry', ip, hostname),
  flushDNS: () => ipcRenderer.invoke('flush-dns'),
  backupHosts: () => ipcRenderer.invoke('backup-hosts'),
  getBackups: () => ipcRenderer.invoke('get-backups'),
  restoreBackup: (path) => ipcRenderer.invoke('restore-backup', path),
  showSaveDialog: (opts) => ipcRenderer.invoke('show-save-dialog', opts),
  showOpenDialog: (opts) => ipcRenderer.invoke('show-open-dialog', opts),
  exportHosts: (path, entries, groups) => ipcRenderer.invoke('export-hosts', path, entries, groups),
  importHosts: (path) => ipcRenderer.invoke('import-hosts', path),
  getGroups: () => ipcRenderer.invoke('get-groups'),
  getPresets: () => ipcRenderer.invoke('get-presets'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url)
});
