// AnchorLedger — Electron main process.
// Boots the desktop window, wires up a system tray "notification icon",
// relays native push notifications (with sound) requested by the renderer,
// and keeps the app alive in the background so real-time alerts keep firing.

const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  Notification,
  nativeImage,
  ipcMain,
  shell,
} = require('electron')
const path = require('node:path')
const fs = require('node:fs')

const APP_NAME = 'AnchorLedger'
// Only treat this as a "dev" launch when a Vite dev server URL is actually
// provided (electron:dev sets it). A bare `electron .` then loads the built
// dist instead of trying — and failing — to reach a dev server that isn't up.
const devServerUrl = process.env.VITE_DEV_SERVER_URL || null
const isDev = Boolean(devServerUrl)

// Resolve the brand icon for the window, tray and notifications. Prefer the
// source/build icon (dev + bare `electron .`); fall back to the packaged copy
// shipped via extraResources.
function resolveIconPath() {
  const buildIcon = path.join(__dirname, '..', 'build', 'icon.png')
  if (fs.existsSync(buildIcon)) return buildIcon
  return path.join(process.resourcesPath, 'icon.png')
}

const iconPath = resolveIconPath()
const appIcon = nativeImage.createFromPath(iconPath)

let mainWindow = null
let tray = null
let isQuitting = false

// Windows: set an explicit AppUserModelID so native notifications show the
// app name/icon correctly instead of "electron.app.…".
if (process.platform === 'win32') {
  app.setAppUserModelId('com.anchorledger.desktop')
}

// Ensure only a single instance runs (so the tray + background notifier are unique).
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    showMainWindow()
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 940,
    minHeight: 640,
    show: false,
    backgroundColor: '#0b1120',
    icon: appIcon,
    title: APP_NAME,
    autoHideMenuBar: true,
    // Frameless so we can render a custom title bar with branded window
    // controls (minimize / maximize / close) inside the React app.
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      // Keep timers/notification logic running while minimized to tray.
      backgroundThrottling: false,
    },
  })

  const distIndex = path.join(__dirname, '..', 'dist', 'index.html')

  if (isDev) {
    mainWindow.loadURL(devServerUrl)
  } else {
    mainWindow.loadFile(distIndex)
  }

  // If the dev server isn't reachable, fall back to the built dist so the
  // window never just sits there blank.
  mainWindow.webContents.on('did-fail-load', (_e, errorCode, _desc, validatedURL) => {
    // -3 (ABORTED) fires on normal in-app navigations; ignore it.
    if (errorCode === -3) return
    if (isDev && validatedURL && validatedURL.startsWith('http') && fs.existsSync(distIndex)) {
      mainWindow.loadFile(distIndex)
    }
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // Open external links (job boards etc.) in the user's real browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })

  // Closing the window hides to tray instead of quitting, so the app keeps
  // delivering real-time notifications in the background.
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow.hide()
      if (process.platform === 'darwin') app.dock?.hide()
    }
  })

  // Keep the custom title bar's maximize/restore icon in sync with reality.
  const sendMaximizeState = () => {
    mainWindow?.webContents.send(
      'desktop:window-maximized-changed',
      mainWindow.isMaximized(),
    )
  }
  mainWindow.on('maximize', sendMaximizeState)
  mainWindow.on('unmaximize', sendMaximizeState)
}

function showMainWindow() {
  if (!mainWindow) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  if (!mainWindow.isVisible()) mainWindow.show()
  if (process.platform === 'darwin') app.dock?.show()
  mainWindow.focus()
}

function createTray() {
  // A small icon for the tray; Windows prefers ~16-32px.
  const trayImage = appIcon.isEmpty()
    ? nativeImage.createEmpty()
    : appIcon.resize({ width: 18, height: 18 })

  tray = new Tray(trayImage.isEmpty() ? appIcon : trayImage)
  tray.setToolTip(APP_NAME)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open AnchorLedger',
      click: () => showMainWindow(),
    },
    {
      label: 'Run financial check',
      click: () => {
        showMainWindow()
        mainWindow?.webContents.send('desktop:run-financial-check')
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true
        app.quit()
      },
    },
  ])

  tray.setContextMenu(contextMenu)
  tray.on('click', () => {
    if (mainWindow?.isVisible() && mainWindow.isFocused()) {
      mainWindow.hide()
    } else {
      showMainWindow()
    }
  })
}

// ---- Native notification relay -------------------------------------------

function showNativeNotification(options = {}) {
  if (!Notification.isSupported()) return false

  const notification = new Notification({
    title: options.title || APP_NAME,
    body: options.body || '',
    icon: appIcon.isEmpty() ? undefined : appIcon,
    // silent:false lets the OS play its own notification sound; the renderer
    // additionally plays a synthesized chime for a consistent experience.
    silent: Boolean(options.silent),
    urgency: options.urgency || 'normal',
    timeoutType: options.requireInteraction ? 'never' : 'default',
  })

  notification.on('click', () => {
    showMainWindow()
    mainWindow?.webContents.send('desktop:notification-clicked', {
      tag: options.tag || null,
    })
  })

  notification.show()
  return true
}

ipcMain.handle('desktop:notify', (_event, options) => {
  return showNativeNotification(options || {})
})

ipcMain.handle('desktop:set-badge', (_event, count) => {
  const value = Number(count) || 0
  if (process.platform === 'darwin') {
    app.dock?.setBadge(value > 0 ? String(value) : '')
  }
  // Windows: reflect unread count as a tray tooltip hint.
  if (tray) {
    tray.setToolTip(value > 0 ? `${APP_NAME} — ${value} alert(s)` : APP_NAME)
  }
  if (typeof app.setBadgeCount === 'function') {
    app.setBadgeCount(value)
  }
  return true
})

ipcMain.handle('desktop:get-info', () => ({
  isDesktop: true,
  platform: process.platform,
  version: app.getVersion(),
  notificationsSupported: Notification.isSupported(),
}))

ipcMain.on('desktop:focus', () => showMainWindow())

// ---- Custom title bar window controls -------------------------------------

ipcMain.on('desktop:window-minimize', () => mainWindow?.minimize())

ipcMain.handle('desktop:window-maximize-toggle', () => {
  if (!mainWindow) return false
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow.maximize()
  }
  return mainWindow.isMaximized()
})

ipcMain.handle('desktop:window-is-maximized', () =>
  mainWindow ? mainWindow.isMaximized() : false,
)

// Closing routes through the normal 'close' handler, which hides to tray so
// background notifications keep firing.
ipcMain.on('desktop:window-close', () => mainWindow?.close())

// ---- App lifecycle --------------------------------------------------------

app.whenReady().then(() => {
  createWindow()
  createTray()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else {
      showMainWindow()
    }
  })
})

app.on('before-quit', () => {
  isQuitting = true
})

// Keep running in the tray even when all windows are closed.
app.on('window-all-closed', () => {
  // Intentionally do not quit on non-macOS so the tray notifier persists.
})
