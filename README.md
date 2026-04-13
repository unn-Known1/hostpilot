# HostPilot v2.1.0

A powerful, beautiful cross-platform GUI for managing hosts file with enterprise-grade features.

## Features

### Core Features
- **Hosts File Management** - Read, edit, and save system hosts file
- **Group Management** - Organize entries by Development, Staging, Production, Blocklist, Custom
- **Real-time Validation** - IP and hostname validation with visual feedback
- **Syntax Warnings** - Detect issues in your hosts file

### System Monitoring
- **System Info** - View platform, architecture, hostname, username
- **Uptime Tracking** - Monitor system uptime
- **Memory Usage** - Real-time memory statistics
- **Running Processes** - View active system processes
- **Host History** - Track all changes to hosts file (last 50 actions)

### Presets
- **Local Development** - Common localhost mappings
- **Ad Blocking** - Block advertising domains
- **Privacy Protection** - Block tracking & analytics

### UI Features
- **Light/Dark Theme** - Toggle between themes (persisted)
- **Multi-language** - English and Chinese (EN/中文)
- **Keyboard Shortcuts** - Ctrl+N (Add), Ctrl+S (Save), Ctrl+F (Search), Ctrl+B (Backup), Ctrl+E (Presets), Ctrl+D (DNS Flush)
- **Group Statistics** - View active/total counts per group
- **Notifications** - Toast notifications for actions

## Installation

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

## Development

```bash
# Start Vite dev server and Electron
npm run dev

# Build React only
npm run build:react

# Build for specific platform
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+N | Add new entry |
| Ctrl+S | Save hosts file |
| Ctrl+F | Focus search |
| Ctrl+B | Create backup |
| Ctrl+E | Open presets |
| Ctrl+D | Flush DNS cache |
| Esc | Close modals |

## Tech Stack

- **Electron 28** - Cross-platform desktop runtime
- **React 18** - UI framework
- **TailwindCSS 4** - Modern styling
- **Vite 5** - Fast build tool
- **Lucide React** - Icon library
- **electron-builder** - Packaging

## Project Structure

```
hostpilot/
├── src/
│   ├── main/
│   │   ├── main.cjs      # Electron main process
│   │   └── preload.cjs   # IPC bridge
│   └── renderer/
│       ├── App.jsx       # Main React component
│       ├── main.jsx      # React entry point
│       └── index.css     # Styles
├── index.html
├── package.json
├── vite.config.js
└── postcss.config.js
```

## License

MIT License - See LICENSE file