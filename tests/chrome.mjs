import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/** Tiny Chrome DevTools client; uses Node 22's WebSocket, no npm dependency. */
export async function launchChrome() {
  const profile = await mkdtemp(join(tmpdir(), 'minihry-test-'))
  const browser = spawn(process.env.CHROME_BIN || '/usr/bin/google-chrome', [
    '--headless=new', '--no-sandbox', '--disable-dev-shm-usage',
    '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
  ], { stdio: 'ignore' })
  try {
    let port
    for (let attempt = 0; attempt < 100; attempt++) {
      try { port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break } catch {}
      if (browser.exitCode !== null) throw new Error('Chrome exited before opening DevTools')
      await sleep(100)
    }
    if (!port) throw new Error('Chrome DevTools did not start')
    const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json()
    const socket = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl)
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject })
    let sequence = 0
    const pending = new Map()
    const errors = []
    socket.onmessage = event => {
      const message = JSON.parse(event.data)
      if (message.id && pending.has(message.id)) {
        const { resolve, reject, timeout } = pending.get(message.id)
        clearTimeout(timeout)
        pending.delete(message.id)
        message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result)
      }
      if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails)
      if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') errors.push(message.params.entry)
    }
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++sequence
      const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)) }, 15000)
      pending.set(id, { resolve, reject, timeout })
      socket.send(JSON.stringify({ id, method, params }))
    })
    await send('Runtime.enable')
    await send('Page.enable')
    await send('Log.enable')
    return {
      send, errors,
      async evaluate(expression) {
        const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
        if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text)
        return result.result.value
      },
      async close() {
        socket.close()
        browser.kill('SIGTERM')
        await new Promise(resolve => browser.once('exit', resolve))
        await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
      },
    }
  } catch (error) {
    browser.kill('SIGTERM')
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
    throw error
  }
}
