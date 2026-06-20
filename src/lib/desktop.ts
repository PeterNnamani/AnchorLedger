// Renderer-side desktop integration: a thin, typed wrapper over the Electron
// preload bridge with a graceful fallback to the Web Notification API when the
// app runs in a plain browser. Also synthesizes a notification chime so the
// "sound" is consistent across platforms without shipping any audio assets.

export type NotificationUrgency = 'low' | 'normal' | 'critical'

export interface DesktopNotifyOptions {
  title: string
  body: string
  tag?: string
  urgency?: NotificationUrgency
  silent?: boolean
  requireInteraction?: boolean
}

interface AnchorDesktopApi {
  isDesktop: true
  notify: (options: DesktopNotifyOptions) => Promise<boolean>
  setBadge: (count: number) => Promise<boolean>
  focus: () => void
  getInfo: () => Promise<{
    isDesktop: boolean
    platform: string
    version: string
    notificationsSupported: boolean
  }>
  onNotificationClicked: (cb: (payload: { tag: string | null }) => void) => () => void
  onRunFinancialCheck: (cb: () => void) => () => void
  windowMinimize: () => void
  windowToggleMaximize: () => Promise<boolean>
  windowClose: () => void
  windowIsMaximized: () => Promise<boolean>
  onWindowMaximizedChange: (cb: (isMaximized: boolean) => void) => () => void
}

declare global {
  interface Window {
    anchorDesktop?: AnchorDesktopApi
  }
}

const PREF_KEY = 'anchorledger_notifications'

interface NotificationPrefs {
  enabled: boolean
  sound: boolean
}

const DEFAULT_PREFS: NotificationPrefs = { enabled: true, sound: true }

export function getNotificationPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(PREF_KEY)
    if (!raw) return { ...DEFAULT_PREFS }
    const parsed = JSON.parse(raw) as Partial<NotificationPrefs>
    return {
      enabled: parsed.enabled ?? DEFAULT_PREFS.enabled,
      sound: parsed.sound ?? DEFAULT_PREFS.sound,
    }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

export function saveNotificationPrefs(prefs: NotificationPrefs): void {
  localStorage.setItem(PREF_KEY, JSON.stringify(prefs))
}

export function isDesktop(): boolean {
  return typeof window !== 'undefined' && window.anchorDesktop?.isDesktop === true
}

/** Ask the browser for notification permission when not running in Electron. */
export async function ensurePermission(): Promise<boolean> {
  if (isDesktop()) return true
  if (typeof Notification === 'undefined') return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

// --- Sound synthesis -------------------------------------------------------

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return null
    if (!audioCtx) audioCtx = new Ctx()
    return audioCtx
  } catch {
    return null
  }
}

/**
 * Plays a short two-tone "ding" chime. `urgency` shapes the timbre so a
 * critical alert sounds more insistent than a gentle reminder.
 */
export function playNotificationSound(urgency: NotificationUrgency = 'normal'): void {
  const ctx = getAudioContext()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()

  const now = ctx.currentTime
  const master = ctx.createGain()
  master.gain.value = 0.0001
  master.connect(ctx.destination)

  const tones =
    urgency === 'critical'
      ? [880, 1175, 880]
      : urgency === 'low'
        ? [659.25, 783.99]
        : [783.99, 1046.5]

  const step = 0.13
  const peak = urgency === 'critical' ? 0.28 : 0.18

  tones.forEach((freq, i) => {
    const start = now + i * step
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, start)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + step * 0.95)
    osc.connect(gain)
    gain.connect(master)
    osc.start(start)
    osc.stop(start + step)
  })

  master.gain.setValueAtTime(1, now)
}

// --- Notification dispatch -------------------------------------------------

/**
 * Fires a notification through Electron when available, otherwise through the
 * Web Notification API. Honors the user's enabled/sound preferences and plays
 * the synthesized chime.
 */
export async function notify(options: DesktopNotifyOptions): Promise<boolean> {
  const prefs = getNotificationPrefs()
  if (!prefs.enabled) return false

  if (prefs.sound && !options.silent) {
    playNotificationSound(options.urgency ?? 'normal')
  }

  if (isDesktop() && window.anchorDesktop) {
    // Let the OS sound stay quiet since we play our own chime above.
    return window.anchorDesktop.notify({ ...options, silent: true })
  }

  const granted = await ensurePermission()
  if (!granted || typeof Notification === 'undefined') return false

  const n = new Notification(options.title, {
    body: options.body,
    tag: options.tag,
    icon: '/icon.png',
    requireInteraction: options.requireInteraction,
    silent: true,
  })
  n.onclick = () => {
    window.focus()
    n.close()
  }
  return true
}

/** Update the tray/dock unread badge (no-op in a plain browser). */
export function setBadge(count: number): void {
  if (isDesktop() && window.anchorDesktop) {
    void window.anchorDesktop.setBadge(count)
  }
}

// --- Custom title bar window controls --------------------------------------

export const windowControls = {
  minimize(): void {
    window.anchorDesktop?.windowMinimize()
  },
  async toggleMaximize(): Promise<boolean> {
    if (!window.anchorDesktop) return false
    return window.anchorDesktop.windowToggleMaximize()
  },
  close(): void {
    window.anchorDesktop?.windowClose()
  },
  async isMaximized(): Promise<boolean> {
    if (!window.anchorDesktop) return false
    return window.anchorDesktop.windowIsMaximized()
  },
  onMaximizedChange(cb: (isMaximized: boolean) => void): () => void {
    if (!window.anchorDesktop) return () => {}
    return window.anchorDesktop.onWindowMaximizedChange(cb)
  },
}
