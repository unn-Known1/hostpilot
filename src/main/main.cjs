const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');

log.transports.file.level = 'info';
log.info('HostPilot starting...');

process.on('uncaughtException', (error) => { log.error('Uncaught:', error); app.exit(1); });
process.on('unhandledRejection', (reason) => { log.error('Unhandled:', reason); });

let mainWindow;

function getHostsPath() {
  return process.platform === 'win32' ? 'C:\\Windows\\System32\\drivers\\etc\\hosts' : '/etc/hosts';
}

function parseHostsFile(content) {
  const entries = [];
  content.split('\n').forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) {
      if (trimmed.startsWith('#') && trimmed.length > 1) {
        const after = trimmed.substring(1).trim();
        const match = after.match(/^(\d+\.\d+\.\d+\.\d+|\S+)\s+(\S+)(?:\s+(.*))?$/);
        if (match) entries.push({ id: `${index}-${Date.now()}`, ip: match[1], hostname: match[2], comment: match[3] || '', enabled: false, lineNumber: index + 1 });
      }
    } else {
      const match = trimmed.match(/^(\d+\.\d+\.\d+\.\d+|\S+)\s+(\S+)(?:\s+(.*))?$/);
      if (match) entries.push({ id: `${index}-${Date.now()}`, ip: match[1], hostname: match[2], comment: match[3] || '', enabled: true, lineNumber: index + 1 });
    }
  });
  return entries;
}

function generateHostsContent(entries) {
  let content = '# Hosts file managed by HostPilot\n';
  content += `# Generated at: ${new Date().toISOString()}\n\n`;
  entries.filter(e => e.isSystem).forEach(e => { content += `${e.ip} ${e.hostname}${e.comment ? ' ' + e.comment : ''}\n`; });
  content += '\n# Custom entries\n';
  entries.filter(e => !e.isSystem).forEach(e => {
    let line = (e.enabled ? '' : '# ') + `${e.ip} ${e.hostname}`;
    if (e.comment) line += ` ${e.comment}`;
    content += line + '\n';
  });
  return content;
}

async function readHostsFile() {
  const hostsPath = getHostsPath();
  try {
    if (!fs.existsSync(hostsPath)) return { success: false, error: 'Hosts file not found', entries: [] };
    const content = fs.readFileSync(hostsPath, 'utf8');
    const entries = parseHostsFile(content);
    const systemMarkers = ['localhost', 'broadcasthost', '::1'];
    entries.forEach(e => { if (systemMarkers.includes(e.hostname.toLowerCase())) e.isSystem = true; });
    return { success: true, entries, path: hostsPath };
  } catch (error) {
    log.error('Read error:', error);
    return { success: false, error: error.message, entries: [] };
  }
}

async function writeHostsFile(entries) {
  const hostsPath = getHostsPath();
  try {
    fs.writeFileSync(hostsPath, generateHostsContent(entries), 'utf8');
    return { success: true };
  } catch (error) {
    log.error('Write error:', error);
    return { success: false, error: error.message };
  }
}

async function backupHostsFile() {
  const hostsPath = getHostsPath();
  const backupDir = path.join(app.getPath('userData'), 'backups');
  try {
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `hosts-${timestamp}.bak`);
    if (fs.existsSync(hostsPath)) {
      fs.copyFileSync(hostsPath, backupPath);
      return { success: true, path: backupPath };
    }
    return { success: false, error: 'No hosts file' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getBackups() {
  const backupDir = path.join(app.getPath('userData'), 'backups');
  try {
    if (!fs.existsSync(backupDir)) return [];
    return fs.readdirSync(backupDir).filter(f => f.endsWith('.bak')).map(f => ({
      name: f, path: path.join(backupDir, f), date: fs.statSync(path.join(backupDir, f)).mtime
    })).sort((a, b) => b.date - a.date);
  } catch { return []; }
}

async function restoreBackup(backupPath) {
  const hostsPath = getHostsPath();
  try {
    const content = fs.readFileSync(backupPath, 'utf8');
    fs.writeFileSync(hostsPath, content, 'utf8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200, height: 800, minWidth: 900, minHeight: 600,
    webPreferences: { nodeIntegration: false, contextIsolation: true, preload: path.join(__dirname, 'preload.cjs') },
    show: false, backgroundColor: '#f8fafc'
  });
  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });
}

ipcMain.handle('read-hosts', readHostsFile);
ipcMain.handle('write-hosts', (e, entries) => writeHostsFile(entries));
ipcMain.handle('backup-hosts', backupHostsFile);
ipcMain.handle('get-backups', getBackups);
ipcMain.handle('restore-backup', (e, p) => restoreBackup(p));
ipcMain.handle('get-hosts-path', () => getHostsPath());
ipcMain.handle('show-save-dialog', (e, opts) => dialog.showSaveDialog(mainWindow, opts));
ipcMain.handle('show-open-dialog', (e, opts) => dialog.showOpenDialog(mainWindow, opts));
ipcMain.handle('export-hosts', async (e, exportPath) => {
  const result = await readHostsFile();
  if (result.success) fs.writeFileSync(exportPath, generateHostsContent(result.entries), 'utf8');
  return result;
});
ipcMain.handle('import-hosts', async (e, importPath) => {
  try {
    const content = fs.readFileSync(importPath, 'utf8');
    return { success: true, entries: parseHostsFile(content) };
  } catch (error) { return { success: false, error: error.message }; }
});

app.whenReady().then(() => { log.info('Creating window...'); createWindow(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
