import { useSyncExternalStore } from 'react'
import { api } from './api'

// Real people from the backend (/api/contacts — the user's Gmail correspondents /
// People CRM). Used to suggest meeting attendees WITH their email, so a meeting's
// notes can actually be sent to them. Empty until loaded (honest — no dummy).
export type ContactLite = { id: string; name: string; email?: string; company?: string }

let contacts: ContactLite[] | null = null
const listeners = new Set<() => void>()
const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}

const EMPTY: ContactLite[] = []
// contacts is set once and then stable, so getSnapshot is safe.
const snapshot = (): ContactLite[] => contacts ?? EMPTY
export const useContacts = () => useSyncExternalStore(subscribe, snapshot)
export const allContacts = snapshot

type ServerContact = { id?: string; name?: string; email?: string; company?: string }

/** Look up a known contact's email by display name (exact, case-insensitive). */
export const emailForName = (name: string): string | undefined => {
  const n = name.trim().toLowerCase()
  return snapshot().find((c) => c.name.trim().toLowerCase() === n)?.email
}

/** Load the user's real contacts. Best-effort — stays empty on error. */
export const hydrateContacts = async (): Promise<void> => {
  try {
    const res = await api.contacts()
    contacts = ((res.contacts as ServerContact[]) || [])
      .filter((c) => c && (c.name || c.email))
      .map((c, i) => ({
        id: c.id || `contact-${i}`,
        name: (c.name || c.email || 'Unknown').trim(),
        email: c.email || undefined,
        company: c.company || undefined,
      }))
    listeners.forEach((fn) => fn())
  } catch {
    /* keep empty */
  }
}
