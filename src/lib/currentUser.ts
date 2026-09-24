import { useSyncExternalStore } from 'react'

/**
 * Identidad de quien usa la app, para firmar lo que añade a la lista de la compra.
 *
 * En producción la da el login del servidor (middleware.ts): `/auth/me` devuelve el usuario de la
 * sesión. Sin servidor de autenticación (desarrollo local) se usa un nombre elegido en el dispositivo.
 * El último nombre conocido se guarda en localStorage para funcionar también sin conexión.
 */

const STORAGE_KEY = 'recipemaker.userName'

interface CurrentUserState {
  name: string | null
  /** true si el nombre viene de una sesión autenticada (no editable desde la app). */
  authenticated: boolean
}

function readStoredName(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function storeName(name: string) {
  try {
    localStorage.setItem(STORAGE_KEY, name)
  } catch {
    // Sin almacenamiento disponible: el nombre dura lo que la sesión de la pestaña.
  }
}

let state: CurrentUserState = { name: readStoredName(), authenticated: false }
const listeners = new Set<() => void>()

function setState(next: CurrentUserState) {
  state = next
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useCurrentUser() {
  return useSyncExternalStore(subscribe, () => state)
}

/** Nombre elegido en el dispositivo cuando no hay login de servidor. */
export function setLocalUserName(name: string) {
  const trimmed = name.trim()
  if (!trimmed || state.authenticated) return
  storeName(trimmed)
  setState({ name: trimmed, authenticated: false })
}

/**
 * Comprueba la sesión con el servidor. Con la app instalada (PWA) el service worker sirve la
 * interfaz desde caché sin pasar por el servidor, así que esta comprobación es la que hace
 * efectivo un cierre de sesión o la retirada de acceso a un usuario cuando hay conexión.
 * Sin conexión, o sin servidor de autenticación (desarrollo), se deja usar la app.
 */
export async function verifySession(): Promise<void> {
  let response: Response
  try {
    response = await fetch('/auth/me', {
      credentials: 'same-origin',
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    })
  } catch {
    return
  }

  if (response.status === 401) {
    const next = window.location.pathname + window.location.search
    window.location.replace(`/auth/login?next=${encodeURIComponent(next)}`)
    return new Promise(() => {}) // No renderizar la app mientras se redirige.
  }

  const isJson = response.headers.get('content-type')?.includes('application/json')
  if (!response.ok || !isJson) return

  const body = (await response.json()) as { user?: string }
  if (body.user) {
    storeName(body.user)
    setState({ name: body.user, authenticated: true })
  }
}
