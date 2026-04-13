# HostPilot - 100x Enhanced Hosts File Manager

<p align="center">
  <img src="https://img.shields.io/badge/Version-2.0.0-blue?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-purple?style=for-the-badge" alt="Platform">
  <img src="https://img.shields.io/badge/Electron-28.2.0-47848F?style=for-the-badge" alt="Electron">
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/hostpilot/hostpilot/main/assets/icon.png" alt="HostPilot Logo" width="128">
</p>

**A powerful, beautiful cross-platform GUI application for managing your local hosts file with enterprise-grade features.**

---

## 🚀 Features (100x Enhanced!)

### Core Management
- ✅ **Add/Edit/Delete** host entries with real-time validation
- ✅ **Enable/Disable** entries without deleting (toggle on/off)
- ✅ **Bulk Operations** - select multiple entries and perform batch actions
- ✅ **Search & Filter** - find entries by IP, hostname, or comment
- ✅ **Group Categories** - organize entries by Development, Staging, Production, Blocklist, Custom

### Advanced Features
- 🏷️ **Preset Templates** - One-click apply pre-made host configurations
  - Local Development (localhost mappings)
  - Ad Blocking (block common ad domains)
  - Privacy Protection (block trackers)
- ⚡ **DNS Cache Flush** - Instantly clear system DNS cache (Ctrl+D)
- 🔍 **Syntax Validation** - Real-time IP and hostname validation
- ⚠️ **Warning System** - Detect and display syntax issues in hosts file
- 📊 **Group Statistics** - Visual breakdown of entries by category

### Backup & Restore
- 💾 **One-click Backup** - Save current hosts file instantly
- 🔄 **Restore from Backup** - Choose from backup history
- 📁 **Import/Export** - File-based backup and sharing

### User Experience
- 🌙 **Dark/Light Mode** - Automatic theme based on system preferences
- 🌍 **Multi-language** - English and Chinese (中文) support
- ⌨️ **Keyboard Shortcuts** - Power-user efficiency
  - `Ctrl+N` - Add new entry
  - `Ctrl+S` - Save changes
  - `Ctrl+F` - Focus search
  - `Ctrl+B` - Quick backup
  - `Ctrl+D` - Flush DNS
  - `Esc` - Close modal
- 🎨 **Modern UI** - Glassmorphism design with smooth animations
- 📱 **Responsive** - Optimized for all screen sizes

---

## 📥 Installation

### From Releases
Download the latest release for your platform:

| Platform | File | Size |
|----------|------|------|
| Windows | `HostPilot-Setup.exe` | ~120 MB |
| macOS | `HostPilot.dmg` | ~130 MB |
| Linux | `HostPilot.AppImage` | ~116 MB |

### From Source

```bash
# Clone the repository
git clone https://github.com/unn-Known1/hostpilot.git
cd hostpilot

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build
```

---

## 🖥️ Usage

### Getting Started
1. Launch HostPilot
2. Your hosts file will be automatically loaded
3. Start adding, editing, or organizing entries

### Adding a New Entry
1. Click **Add Entry** or press `Ctrl+N`
2. Fill in IP Address and Hostname
3. Optionally add a comment and select a group
4. Click **Add** to save

### Managing Groups
1. Hover over an entry to reveal action buttons
2. Use the group dropdown to assign entries
3. Click group headers to expand/collapse

### Applying Presets
1. Click the **Bookmark** icon in the header
2. Select a preset template (Local Dev, Ad Block, Privacy)
3. Entries will be merged (no duplicates)

### Flushing DNS
Click the **Zap** icon or press `Ctrl+D` to clear DNS cache

---

## 🏗️ Technology Stack

| Layer | Technology |
|-------|------------|
| Desktop Runtime | Electron 28.2.0 |
| UI Framework | React 18.2.0 |
| Styling | TailwindCSS 4.0 |
| Build Tool | Vite 5.1.4 |
| Bundler | electron-builder 24.13.3 |
| Icons | Lucide React |
| Logging | electron-log |

---

## 📁 Project Structure

```
hostpilot/
├── src/
│   ├── main/
│   │   ├── main.cjs      # Electron main process
│   │   └── preload.cjs   # IPC bridge
│   └── renderer/
│       ├── App.jsx       # Main React component
│       ├── index.css     # Global styles
│       └── main.jsx      # React entry point
├── dist/                 # Built frontend
├── release/              # Production builds
├── package.json
├── vite.config.js
├── postcss.config.js
└── index.html
```

---

## ⚙️ Configuration

### Group Configuration
Groups are defined in `src/main/main.cjs` and can be customized:

```javascript
const groups = [
  { id: 'development', name: 'development', label: 'Development', icon: 'code', color: '#10b981' },
  { id: 'staging', name: 'staging', label: 'Staging', icon: 'server', color: '#f59e0b' },
  { id: 'production', name: 'production', label: 'Production', icon: 'cloud', color: '#ef4444' },
  { id: 'blocklist', name: 'blocklist', label: 'Blocklist', icon: 'shield', color: '#6366f1' },
  { id: 'custom', name: 'custom', label: 'Custom', icon: 'folder', color: '#8b5cf6' }
];
```

### Preset Templates
Preset templates can be customized in `getPresets()` function:

```javascript
const presets = [
  {
    id: 'local-dev',
    name: 'local-dev',
    label: 'Local Development',
    description: 'Common localhost development mappings',
    entries: [
      { ip: '127.0.0.1', hostname: 'localhost', comment: 'Localhost' },
      // ... more entries
    ]
  }
];
```

---

## 🌐 Cross-Platform Notes

### Windows
- Hosts file location: `C:\Windows\System32\drivers\etc\hosts`
- DNS flush: `ipconfig /flushdns`
- Requires admin privileges to modify hosts file

### macOS
- Hosts file location: `/etc/hosts`
- DNS flush: `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`
- Requires sudo privileges

### Linux
- Hosts file location: `/etc/hosts`
- DNS flush: `sudo systemd-resolve --flush-caches` or `sudo service nscd restart`

---

## 🐛 Troubleshooting

### "Unable to write to hosts file"
- **Windows**: Run as Administrator
- **macOS/Linux**: Run with sudo privileges or adjust file permissions

### "Hosts file not found"
- Ensure the hosts file exists at the standard location
- On Windows: Create at `C:\Windows\System32\drivers\etc\hosts`
- On macOS/Linux: Create at `/etc/hosts`

### Build issues
- Delete `node_modules` and run `npm install` again
- Ensure you have Node.js 18+ installed

---

## 📝 Changelog

### v2.0.0 (Major Update)
- ✨ Added group/category management
- ✨ Added preset templates
- ✨ Added DNS cache flush
- ✨ Added syntax validation
- ✨ Added warning system
- ✨ Added multi-language support (EN/ZH)
- ✨ Added keyboard shortcuts
- ✨ Enhanced UI with glassmorphism
- ✨ Improved animations

### v1.0.0 (Initial Release)
- Basic hosts file management
- Dark/light mode
- Backup/restore
- Import/export

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [Electron](https://electronjs.org/) - Cross-platform desktop runtime
- [React](https://reactjs.org/) - UI framework
- [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS
- [Lucide](https://lucide.dev/) - Beautiful open-source icons

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/unn-Known1">unn-Known1</a>
</p>
