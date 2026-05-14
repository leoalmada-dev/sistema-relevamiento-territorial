import type { RelevamientoLocalDraft } from '../types/relevamientoDraft';

export const LOCAL_DRAFT_STORAGE_KEY = 'relevamientoTerritorial:draft:v1';

/**
 * Borrador local MVP.
 *
 * Seguridad y alcance:
 * - localStorage se usa solo para no perder la carga durante el MVP.
 * - No es una solución segura definitiva para datos personales o sensibles.
 * - No representa offline completo.
 * - No representa guardado en servidor.
 * - El uso real depende de tablets autorizadas y controladas por infraestructura.
 * - Más adelante puede requerirse una estrategia más robusta, por ejemplo IndexedDB,
 *   cifrado, limpieza automática o sincronización controlada.
 * - En FE-9 se maneja un único borrador local activo con una key versionada.
 */
export function getLocalDraft(): RelevamientoLocalDraft | null {
  try {
    const rawDraft = window.localStorage.getItem(LOCAL_DRAFT_STORAGE_KEY);

    if (!rawDraft) {
      return null;
    }

    const parsedDraft = JSON.parse(rawDraft) as Partial<RelevamientoLocalDraft>;

    if (parsedDraft.version !== 1 || !parsedDraft.savedAt) {
      return null;
    }

    return parsedDraft as RelevamientoLocalDraft;
  } catch {
    return null;
  }
}

export function saveLocalDraft(draft: RelevamientoLocalDraft): boolean {
  try {
    window.localStorage.setItem(LOCAL_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function clearLocalDraft(): boolean {
  try {
    window.localStorage.removeItem(LOCAL_DRAFT_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function hasLocalDraft(): boolean {
  return getLocalDraft() !== null;
}
