// Cross-platform dev launcher: starts the Vite dev server, waits until it is
// reachable, then boots Electron pointed at it. No extra deps required.

import { spawn } from 'node:child_process'
import net from 'node:net'
import process from 'node:process'

// Vite binds to "localhost", which resolves to IPv6 (::1) on some systems and
// IPv4 (127.0.0.1) on others. Probe both so the launcher works everywhere.
const HOSTS = ['127.0.0.1', '::1']
const PORT = 5173
const DEV_URL = `http://localhost:${PORT}`
const isWindows = process.platform === 'win32'

function run(command, args, extraEnv = {}) {
  return spawn(command, args, {
    stdio: 'inherit',
    shell: isWindows,
    env: { ...process.env, ...extraEnv },
  })
}

function tryConnect(port, host) {
  return new Promise((resolve) => {
    const socket = net.connect(port, host)
    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('error', () => {
      socket.destroy()
      resolve(false)
    })
  })
}

function waitForPort(port, hosts, timeoutMs = 30000) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const attempt = async () => {
      for (const host of hosts) {
        if (await tryConnect(port, host)) {
          resolve()
          return
        }
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Timed out waiting for ${hosts.join(', ')}:${port}`))
      } else {
        setTimeout(attempt, 300)
      }
    }
    attempt()
  })
}

const vite = run('npm', ['run', 'dev'])

let electron = null
let shuttingDown = false

function shutdown(code = 0) {
  if (shuttingDown) return
  shuttingDown = true
  if (electron && !electron.killed) electron.kill()
  if (vite && !vite.killed) vite.kill()
  process.exit(code)
}

try {
  await waitForPort(PORT, HOSTS)
  electron = run('npm', ['run', 'electron'], { VITE_DEV_SERVER_URL: DEV_URL })
  electron.on('exit', (code) => shutdown(code ?? 0))
} catch (error) {
  console.error('[electron-dev]', error.message)
  shutdown(1)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
vite.on('exit', () => shutdown(0))
