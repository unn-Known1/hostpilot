const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
  readHosts: () => ipcRenderer.invoke('read-hosts'),
  writeHosts: (entries) => ipcRenderer.invoke('write-hosts', entries),
  backupHosts: () => ipcRenderer.invoke('backup-hosts'),
  getBackups: () => ipcRenderer.invoke('get-backups'),
  restoreBackup: (path) => ipcRenderer.invoke('restore-backup', path),
  getHostsPath: () => ipcRenderer.invoke('get-hosts-path'),
  showSaveDialog: (opts) => ipcRenderer.invoke('show-save-dialog', opts),
  showOpenDialog: (opts) => ipcRenderer.invoke('show-open-dialog', opts),
  exportHosts: (path) => ipcRenderer.invoke('export-hosts', path),
  importHosts: (path) => ipcRenderer.invoke('import-hosts', path)
});
