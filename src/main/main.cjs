const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const log = require('electron-log');

log.transports.file.level = 'info';
log.info('HostPilot starting...');

process.on('uncaughtException', (error) => { log.error('Uncaught:', error); app.exit(1); });
process.on('unhandledRejection', (reason) => { log.error('Unhandled:', reason); });

let mainWindow;

function getHostsPath() {
  return process.platform === 'win32' ? 'C:\\Windows\\System32\\drivers\\etc\\hosts' : '/etc/hosts';
}

function validateIP(ip) {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$|^::1$|^::$/;
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.');
    return parts.every(p => parseInt(p) <= 255);
  }
  return ipv6Regex.test(ip);
}

function validateHostname(hostname) {
  const regex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\. [a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;
  return regex.test(hostname) && hostname.length <= 253;
}

function parseHostsFile(content) {
  const entries = [];
  const warnings = [];
  content.split('\n').forEach((line, index) => {
    const trimmed = line.trim();
    const lineNum = index + 1;
    if (trimmed === '' || trimmed.startsWith('#')) {
      if (trimmed.startsWith('#') && trimmed.length > 1) {
        const after = trimmed.substring(1).trim();
        const match = after.match(/^(\d+\.\d+\.\d+\.\d+|\S+)\s+(\S+)(?:\s+(.*))?$/);
        if (match) {
          const entry = { id: `${lineNum}-${Date.now()}`, ip: match[1], hostname: match[2], comment: match[3] || '', enabled: false, lineNumber: lineNum, group: 'default' };
          if (!validateIP(match[1])) warnings.push({ line: lineNum, message: 'Invalid IP format' });
          if (!validateHostname(match[2])) warnings.push({ line: lineNum, message: 'Invalid hostname format' });
          entries.push(entry);
        }
      }
    } else {
      const match = trimmed.match(/^(\d+\.\d+\.\d+\.\d+|\S+)\s+(\S+)(?:\s+(.*))?$/);
      if (match) {
        const entry = { id: `${lineNum}-${Date.now()}`, ip: match[1], hostname: match[2], comment: match[3] || '', enabled: true, lineNumber: lineNum, group: 'default' };
        if (!validateIP(match[1])) warnings.push({ line: lineNum, message: 'Invalid IP format' });
        if (!validateHostname(match[2])) warnings.push({ line: lineNum, message: 'Invalid hostname format' });
        entries.push(entry);
      } else if (trimmed && !trimmed.startsWith('#')) {
        warnings.push({ line: lineNum, message: 'Invalid syntax - line will be preserved' });
      }
    }
  });
  return { entries, warnings };
}

function generateHostsContent(entries, groups) {
  let content = '# ============================================\n';
  content += '#  HostPilot - Hosts File Manager\n';
  content += `#  Generated at: ${new Date().toISOString()}\n`;
  content += '# ============================================\n\n';
  const systemEntries = entries.filter(e => e.isSystem);
  if (systemEntries.length > 0) {
    content += '# --- System Entries ---\n';
    systemEntries.forEach(e => { content += `${e.ip} ${e.hostname}${e.comment ? ' # ' + e.comment : ''}\n`; });
    content += '\n';
  }
  const groupNames = [...new Set(entries.filter(e => !e.isSystem && e.group).map(e => e.group))];
  groupNames.forEach(groupName => {
    const groupEntries = entries.filter(e => !e.isSystem && e.group === groupName);
    const groupData = groups.find(g => g.name === groupName);
    content += `# ═══ ${(groupData?.label || groupName).toUpperCase()} ═══`;
    if (groupData?.description) content += ` - ${groupData.description}`;
    content += '\n';
    groupEntries.forEach(e => {
      let line = (e.enabled ? '' : '# ') + `${e.ip} ${e.hostname}`;
      if (e.comment) line += ` # ${e.comment}`;
      content += line + '\n';
    });
    content += '\n';
  });
  const ungrouped = entries.filter(e => !e.isSystem && !e.group);
  if (ungrouped.length > 0) {
    content += '# --- Other Entries ---\n';
    ungrouped.forEach(e => { content += (e.enabled ? '' : '# ') + `${e.ip} ${e.hostname}${e.comment ? ' # ' + e.comment : ''}\n`; });
  }
  return content;
}

async function readHostsFile() {
  const hostsPath = getHostsPath();
  try {
    if (!fs.existsSync(hostsPath)) return { success: false, error: 'Hosts file not found', entries: [], warnings: [] };
    const content = fs.readFileSync(hostsPath, 'utf8');
    const { entries, warnings } = parseHostsFile(content);
    const systemMarkers = ['localhost', 'broadcasthost', '::1'];
    entries.forEach(e => { if (systemMarkers.includes(e.hostname.toLowerCase())) e.isSystem = true; });
    return { success: true, entries, path: hostsPath, warnings };
  } catch (error) {
    log.error('Read error:', error);
    return { success: false, error: error.message, entries: [], warnings: [] };
  }
}

async function writeHostsFile(entries, groups) {
  const hostsPath = getHostsPath();
  try {
    fs.writeFileSync(hostsPath, generateHostsContent(entries, groups), 'utf8');
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
    if (fs.existsSync(hostsPath)) { fs.copyFileSync(hostsPath, backupPath); return { success: true, path: backupPath }; }
    return { success: false, error: 'No hosts file' };
  } catch (error) { return { success: false, error: error.message }; }
}

async function getBackups() {
  const backupDir = path.join(app.getPath('userData'), 'backups');
  try {
    if (!fs.existsSync(backupDir)) return [];
    return fs.readdirSync(backupDir).filter(f => f.endsWith('.bak')).map(f => ({ name: f, path: path.join(backupDir, f), date: fs.statSync(path.join(backupDir, f)).mtime })).sort((a, b) => b.date - a.date);
  } catch { return []; }
}

async function restoreBackup(backupPath) {
  const hostsPath = getHostsPath();
  try { fs.writeFileSync(hostsPath, fs.readFileSync(backupPath, 'utf8'), 'utf8'); return { success: true }; }
  catch (error) { return { success: false, error: error.message }; }
}

function flushDNSCache() {
  return new Promise((resolve) => {
    const platform = process.platform;
    let command;
    if (platform === 'win32') command = 'ipconfig /flushdns';
    else if (platform === 'darwin') command = 'sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder';
    else command = 'sudo systemd-resolve --flush-caches 2>/dev/null || sudo service nscd restart 2>/dev/null || echo "DNS cache flush not supported"';
    exec(command, (error, stdout, stderr) => {
      if (error) { log.error('DNS flush error:', error); resolve({ success: false, error: stderr || error.message, output: stdout }); }
      else { log.info('DNS cache flushed'); resolve({ success: true, output: stdout || 'DNS cache flushed successfully' }); }
    });
  });
}

function getGroups() {
  return [
    { id: 'development', name: 'development', label: 'Development', icon: 'code', color: '#10b981', description: 'Local development environments' },
    { id: 'staging', name: 'staging', label: 'Staging', icon: 'server', color: '#f59e0b', description: 'Staging server mappings' },
    { id: 'production', name: 'production', label: 'Production', icon: 'cloud', color: '#ef4444', description: 'Production server mappings' },
    { id: 'blocklist', name: 'blocklist', label: 'Blocklist', icon: 'shield', color: '#6366f1', description: 'Blocked domains' },
    { id: 'custom', name: 'custom', label: 'Custom', icon: 'folder', color: '#8b5cf6', description: 'User-defined group' }
  ];
}

function getPresets() {
  return [
    { id: 'local-dev', name: 'local-dev', label: 'Local Development', description: 'Common localhost development mappings', entries: [{ ip: '127.0.0.1', hostname: 'localhost', comment: 'Localhost' }, { ip: '127.0.0.1', hostname: 'api.localhost', comment: 'Local API' }, { ip: '127.0.0.1', hostname: 'app.localhost', comment: 'Local App' }, { ip: '127.0.0.1', hostname: 'db.localhost', comment: 'Local Database' }] },
    { id: 'ad-block', name: 'ad-block', label: 'Ad Blocking', description: 'Block common advertising domains', entries: [{ ip: '0.0.0.0', hostname: 'ads.google.com', comment: 'Block Google Ads' }, { ip: '0.0.0.0', hostname: 'ads.facebook.com', comment: 'Block Facebook Ads' }, { ip: '0.0.0.0', hostname: 'doubleclick.net', comment: 'Block DoubleClick' }, { ip: '0.0.0.0', hostname: 'googlesyndication.com', comment: 'Block AdSense' }] },
    { id: 'privacy', name: 'privacy', label: 'Privacy Protection', description: 'Block tracking and analytics', entries: [{ ip: '0.0.0.0', hostname: 'google-analytics.com', comment: 'Block GA' }, { ip: '0.0.0.0', hostname: 'googletagmanager.com', comment: 'Block Tag Manager' }, { ip: '0.0.0.0', hostname: 'facebook.com', comment: 'Block Facebook' }, { ip: '0.0.0.0', hostname: 'analytics.twitter.com', comment: 'Block Twitter Analytics' }] }
  ];
}

function createWindow() {
  mainWindow = new BrowserWindow({ width: 1400, height: 900, minWidth: 1000, minHeight: 700, webPreferences: { nodeIntegration: false, contextIsolation: true, preload: path.join(__dirname, 'preload.cjs') }, show: false, backgroundColor: '#f8fafc' });
  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) mainWindow.loadURL('http://localhost:5173');
  else mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });
}

ipcMain.handle('read-hosts', readHostsFile);
ipcMain.handle('write-hosts', (e, entries, groups) => writeHostsFile(entries, groups || []));
ipcMain.handle('backup-hosts', backupHostsFile);
ipcMain.handle('get-backups', getBackups);
ipcMain.handle('restore-backup', (e, p) => restoreBackup(p));
ipcMain.handle('get-hosts-path', () => getHostsPath());
ipcMain.handle('flush-dns', flushDNSCache);
ipcMain.handle('get-groups', getGroups);
ipcMain.handle('get-presets', getPresets);
ipcMain.handle('show-save-dialog', (e, opts) => dialog.showSaveDialog(mainWindow, opts));
ipcMain.handle('show-open-dialog', (e, opts) => dialog.showOpenDialog(mainWindow, opts));
ipcMain.handle('export-hosts', async (e, exportPath, entries, groups) => { try { fs.writeFileSync(exportPath, generateHostsContent(entries, groups), 'utf8'); return { success: true }; } catch (error) { return { success: false, error: error.message }; } });
ipcMain.handle('import-hosts', async (e, importPath) => { try { const content = fs.readFileSync(importPath, 'utf8'); const { entries, warnings } = parseHostsFile(content); return { success: true, entries, warnings }; } catch (error) { return { success: false, error: error.message, entries: [], warnings: [] }; } });
ipcMain.handle('validate-entry', (e, ip, hostname) => { return { ipValid: validateIP(ip), hostnameValid: validateHostname(hostname) }; });
ipcMain.handle('open-external', (e, url) => shell.openExternal(url));

app.whenReady().then(() => { log.info('Creating window...'); createWindow(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
