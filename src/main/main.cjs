const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec, execSync } = require('child_process');
const os = require('os');
const log = require('electron-log');

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = 'info';

// Global exception handler
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error);
  process.exit(1);
});

let mainWindow;

// Host change history (stores last 50 changes)
const hostHistory = [];
const MAX_HISTORY = 50;

// Group definitions
const groups = [
  { id: 'development', name: 'development', label: 'Development', icon: 'code', color: '#10b981' },
  { id: 'staging', name: 'staging', label: 'Staging', icon: 'server', color: '#f59e0b' },
  { id: 'production', name: 'production', label: 'Production', icon: 'cloud', color: '#ef4444' },
  { id: 'blocklist', name: 'blocklist', label: 'Blocklist', icon: 'shield', color: '#6366f1' },
  { id: 'custom', name: 'custom', label: 'Custom', icon: 'folder', color: '#8b5cf6' }
];

// Preset templates
const presets = [
  {
    id: 'local-dev',
    name: 'local-dev',
    label: 'Local Development',
    description: 'Common localhost development mappings',
    icon: 'code',
    entries: [
      { ip: '127.0.0.1', hostname: 'localhost', comment: 'Localhost' },
      { ip: '127.0.0.1', hostname: 'dev.local', comment: 'Local dev domain' },
      { ip: '127.0.0.1', hostname: 'api.local', comment: 'API endpoint' }
    ]
  },
  {
    id: 'ad-block',
    name: 'ad-block',
    label: 'Ad Blocking',
    description: 'Block common advertising domains',
    icon: 'shield',
    entries: [
      { ip: '0.0.0.0', hostname: 'ads.google.com', comment: 'Block Google Ads' },
      { ip: '0.0.0.0', hostname: 'pagead2.googlesyndication.com', comment: 'Block Google Ads' },
      { ip: '0.0.0.0', hostname: 'ad.doubleclick.net', comment: 'Block DoubleClick' },
      { ip: '0.0.0.0', hostname: 'www.facebook.com/tr', comment: 'Block Facebook Ads' },
      { ip: '0.0.0.0', hostname: 'ads.twitter.com', comment: 'Block Twitter Ads' }
    ]
  },
  {
    id: 'privacy',
    name: 'privacy',
    label: 'Privacy Protection',
    description: 'Block tracking and analytics domains',
    icon: 'eye-off',
    entries: [
      { ip: '0.0.0.0', hostname: 'www.google-analytics.com', comment: 'Block Google Analytics' },
      { ip: '0.0.0.0', hostname: 'analytics.google.com', comment: 'Block Google Analytics' },
      { ip: '0.0.0.0', hostname: 'ssl.google-analytics.com', comment: 'Block Google Analytics' },
      { ip: '0.0.0.0', hostname: 'www.googletagmanager.com', comment: 'Block Tag Manager' },
      { ip: '0.0.0.0', hostname: 'connect.facebook.net', comment: 'Block Facebook SDK' },
      { ip: '0.0.0.0', hostname: 'pixel.facebook.com', comment: 'Block Facebook Pixel' }
    ]
  }
];

function getHostsPath() {
  if (process.platform === 'win32') {
    return path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'drivers', 'etc', 'hosts');
  }
  return '/etc/hosts';
}

function getSystemUptime() {
  const uptime = os.uptime();
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  return { total: uptime, days, hours, minutes, formatted: `${days}d ${hours}h ${minutes}m` };
}

function getSystemInfo() {
  return {
    platform: process.platform,
    arch: process.arch,
    hostname: os.hostname(),
    username: os.userInfo().username,
    homedir: os.homedir(),
    cpus: os.cpus().length,
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    uptime: getSystemUptime()
  };
}

function getCurrentHostsHash() {
  try {
    const hostsPath = getHostsPath();
    const content = fs.readFileSync(hostsPath, 'utf8');
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  } catch (error) {
    return 'unknown';
  }
}

function addToHistory(action, entries, details = '') {
  const entry = {
    timestamp: new Date().toISOString(),
    action,
    entriesCount: entries.length,
    details,
    hostsHash: getCurrentHostsHash()
  };
  hostHistory.unshift(entry);
  if (hostHistory.length > MAX_HISTORY) {
    hostHistory.pop();
  }
  return entry;
}

function parseHostsFile(content) {
  const entries = [];
  const warnings = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      if (trimmed.includes('::1') && !trimmed.includes('localhost')) {
        warnings.push({ line: index + 1, message: 'IPv6 localhost entry may conflict' });
      }
      return;
    }

    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      const ip = parts[0];
      const hostname = parts[1];
      let comment = '';
      const commentIndex = trimmed.indexOf('#');
      if (commentIndex !== -1) {
        comment = trimmed.substring(commentIndex + 1).trim();
      }

      if (!validateIP(ip)) {
        warnings.push({ line: index + 1, message: `Invalid IP address: ${ip}` });
      }
      if (!validateHostname(hostname)) {
        warnings.push({ line: index + 1, message: `Invalid hostname: ${hostname}` });
      }

      entries.push({ ip, hostname, comment, enabled: true });
    }
  });

  return { entries, warnings };
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
  const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-\.]*[a-zA-Z0-9])?$/;
  return hostnameRegex.test(hostname) && hostname.length <= 253;
}

function generateHostsContent(entries, groupFilter = null) {
  let content = '# Host file managed by HostPilot\n';
  content += '# Generated: ' + new Date().toISOString() + '\n\n';

  const groupedEntries = {};
  groups.forEach(g => {
    groupedEntries[g.id] = entries.filter(e => (e.group || 'custom') === g.id);
  });

  groups.forEach(group => {
    const groupEntries = groupedEntries[group.id];
    if (groupEntries && groupEntries.length > 0) {
      if (groupFilter && groupFilter !== group.id) return;
      content += `# === ${group.label.toUpperCase()} ===\n`;
      groupEntries.forEach(entry => {
        const line = `${entry.ip}\t${entry.hostname}`;
        const fullLine = entry.comment ? `${line} # ${entry.comment}` : line;
        content += fullLine + '\n';
      });
      content += '\n';
    }
  });

  const uncategorized = entries.filter(e => !e.group || e.group === 'uncategorized');
  if (uncategorized.length > 0) {
    content += '# === UNCATEGORIZED ===\n';
    uncategorized.forEach(entry => {
      const line = `${entry.ip}\t${entry.hostname}`;
      const fullLine = entry.comment ? `${line} # ${entry.comment}` : line;
      content += fullLine + '\n';
    });
  }

  return content;
}

function flushDNSCache() {
  return new Promise((resolve) => {
    const platform = process.platform;
    let command;
    if (platform === 'win32') {
      command = 'ipconfig /flushdns';
    } else if (platform === 'darwin') {
      command = 'sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder; sudo lookupd -flushcache';
    } else {
      command = 'sudo systemd-resolve --flush-caches 2>/dev/null || sudo service nscd restart 2>/dev/null || sudo rc-service nscd restart 2>/dev/null';
    }
    exec(command, (error, stdout, stderr) => {
      if (error) {
        log.error('DNS flush error:', error);
        resolve({ success: false, error: stderr || error.message });
      } else {
        log.info('DNS cache flushed');
        resolve({ success: true, output: stdout || 'DNS cache flushed successfully' });
      }
    });
  });
}

function getRunningProcesses() {
  return new Promise((resolve) => {
    const platform = process.platform;
    let command;
    if (platform === 'win32') {
      command = 'tasklist /FO CSV /NH';
    } else {
      command = 'ps aux --no-headers';
    }
    exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        log.error('Get processes error:', error);
        resolve({ success: false, error: error.message, processes: [] });
      } else {
        const processes = stdout.split('\n').slice(0, 100).map(line => {
          const parts = line.trim().split(/\s+/);
          if (platform === 'win32') {
            return { name: parts[0], pid: parts[1], memory: parts[4] || 'N/A' };
          }
          return { name: parts[10] || parts[0], pid: parts[1], memory: parts[5] || 'N/A' };
        }).filter(p => p.name && p.pid);
        resolve({ success: true, processes });
      }
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 650,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, '../../assets/icon.png'),
    show: false,
    backgroundColor: '#0f172a'
  });

  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    log.info('HostPilot window ready');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('read-hosts', async () => {
  try {
    const hostsPath = getHostsPath();
    log.info('Reading hosts file:', hostsPath);
    const content = fs.readFileSync(hostsPath, 'utf8');
    const { entries, warnings } = parseHostsFile(content);
    const stats = {
      totalEntries: entries.length,
      enabledEntries: entries.filter(e => e.enabled).length,
      groups: {}
    };
    groups.forEach(g => {
      stats.groups[g.id] = entries.filter(e => (e.group || 'custom') === g.id).length;
    });
    return {
      success: true,
      entries,
      warnings,
      path: hostsPath,
      stats,
      lastModified: fs.statSync(hostsPath).mtime,
      hash: getCurrentHostsHash()
    };
  } catch (error) {
    log.error('Error reading hosts:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('write-hosts', async (event, entries) => {
  try {
    const hostsPath = getHostsPath();
    log.info('Writing hosts file:', hostsPath);
    const content = generateHostsContent(entries);
    fs.writeFileSync(hostsPath, content, 'utf8');
    addToHistory('write', entries, 'Manual save');
    return { success: true };
  } catch (error) {
    log.error('Error writing hosts:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-hosts-path', () => getHostsPath());
ipcMain.handle('validate-entry', (event, ip, hostname) => ({
  ipValid: validateIP(ip),
  hostnameValid: validateHostname(hostname)
}));
ipcMain.handle('flush-dns', async () => await flushDNSCache());
ipcMain.handle('get-system-info', () => ({
  system: getSystemInfo(),
  hostsPath: getHostsPath(),
  currentHash: getCurrentHostsHash()
}));
ipcMain.handle('get-host-history', () => hostHistory);
ipcMain.handle('get-running-processes', async () => await getRunningProcesses());

ipcMain.handle('backup-hosts', async () => {
  try {
    const hostsPath = getHostsPath();
    const backupDir = path.join(app.getPath('userData'), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `hosts_backup_${timestamp}`);
    fs.copyFileSync(hostsPath, backupPath);
    const { entries } = parseHostsFile(fs.readFileSync(hostsPath, 'utf8'));
    addToHistory('backup', entries, `Backup: ${path.basename(backupPath)}`);
    log.info('Backup created:', backupPath);
    return { success: true, path: backupPath };
  } catch (error) {
    log.error('Backup error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-backups', async () => {
  try {
    const backupDir = path.join(app.getPath('userData'), 'backups');
    if (!fs.existsSync(backupDir)) {
      return { success: true, backups: [] };
    }
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('hosts_backup_'))
      .map(f => ({
        name: f,
        path: path.join(backupDir, f),
        date: fs.statSync(path.join(backupDir, f)).mtime,
        size: fs.statSync(path.join(backupDir, f)).size
      }))
      .sort((a, b) => b.date - a.date);
    return { success: true, backups: files };
  } catch (error) {
    log.error('Get backups error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('restore-backup', async (event, backupPath) => {
  try {
    const hostsPath = getHostsPath();
    fs.copyFileSync(backupPath, hostsPath);
    const { entries } = parseHostsFile(fs.readFileSync(hostsPath, 'utf8'));
    addToHistory('restore', entries, `Restored from: ${path.basename(backupPath)}`);
    log.info('Backup restored:', backupPath);
    return { success: true };
  } catch (error) {
    log.error('Restore error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  return await dialog.showSaveDialog(mainWindow, options);
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  return await dialog.showOpenDialog(mainWindow, options);
});

ipcMain.handle('export-hosts', async (event, filePath, entries) => {
  try {
    const content = generateHostsContent(entries);
    fs.writeFileSync(filePath, content, 'utf8');
    addToHistory('export', entries, `Exported to: ${filePath}`);
    return { success: true };
  } catch (error) {
    log.error('Export error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('import-hosts', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { entries, warnings } = parseHostsFile(content);
    addToHistory('import', entries, `Imported from: ${filePath}`);
    return { success: true, entries, warnings };
  } catch (error) {
    log.error('Import error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-groups', () => groups);
ipcMain.handle('get-presets', () => presets);
ipcMain.handle('open-external', async (event, url) => await shell.openExternal(url));

// App lifecycle
app.whenReady().then(() => {
  log.info('HostPilot starting...');
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

log.info('HostPilot main process loaded');