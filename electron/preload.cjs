// Secure bridge between the renderer (React app) and the Electron main process.
// Only a minimal, explicit surface is exposed on window.anchorDesktop.

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('anchorDesktop', {
  isDesktop: true,

  /** Show a native OS notification. Returns true if it was displayed. */
  notify: (options) => ipcRenderer.invoke('desktop:notify', options),

  /** Reflect an unread-alert count on the tray tooltip / dock badge. */
  setBadge: (count) => ipcRenderer.invoke('desktop:set-badge', count),

  /** Bring the main window to the foreground. */
  focus: () => ipcRenderer.send('desktop:focus'),

  /** Runtime info (platform, version, notification support). */
  getInfo: () => ipcRenderer.invoke('desktop:get-info'),

  /** Fired when the user clicks a native notification. */
  onNotificationClicked: (callback) => {
    const handler = (_event, payload) => callback(payload)
    ipcRenderer.on('desktop:notification-clicked', handler)
    return () => ipcRenderer.removeListener('desktop:notification-clicked', handler)
  },

  /** Fired when the user picks "Run financial check" from the tray menu. */
  onRunFinancialCheck: (callback) => {
    const handler = () => callback()
    ipcRenderer.on('desktop:run-financial-check', handler)
    return () => ipcRenderer.removeListener('desktop:run-financial-check', handler)
  },

  // ---- Custom title bar window controls ----
  /** Minimize the main window. */
  windowMinimize: () => ipcRenderer.send('desktop:window-minimize'),

  /** Toggle maximize/restore. Resolves to the new maximized state. */
  windowToggleMaximize: () => ipcRenderer.invoke('desktop:window-maximize-toggle'),

  /** Close (hides to tray so background alerts keep firing). */
  windowClose: () => ipcRenderer.send('desktop:window-close'),

  /** Current maximized state. */
  windowIsMaximized: () => ipcRenderer.invoke('desktop:window-is-maximized'),

  /** Subscribe to maximize/restore changes. Returns an unsubscribe fn. */
  onWindowMaximizedChange: (callback) => {
    const handler = (_event, isMaximized) => callback(isMaximized)
    ipcRenderer.on('desktop:window-maximized-changed', handler)
    return () => ipcRenderer.removeListener('desktop:window-maximized-changed', handler)
  },
})
