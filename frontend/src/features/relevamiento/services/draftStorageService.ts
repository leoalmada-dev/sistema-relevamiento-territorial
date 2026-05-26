import type {
  RelevamientoLocalDraft,
  RelevamientoLocalDraftIndexItem,
} from '../types/relevamientoDraft';

export const LOCAL_DRAFT_STORAGE_KEY = 'relevamientoTerritorial:draft:v1';
export const LOCAL_DRAFTS_INDEX_STORAGE_KEY = 'relevamientoTerritorial:drafts:index:v1';
export const LOCAL_DRAFT_ITEM_STORAGE_KEY_PREFIX = 'relevamientoTerritorial:drafts:item:v1:';

/**
 * Borrador local MVP.
 *
 * Límites conocidos:
 * - localStorage se usa solo para no perder la carga durante el MVP.
 * - No es una solución segura definitiva para datos personales o sensibles.
 * - No representa offline completo.
 * - La recuperación por predio de este servicio es local a esta tablet/navegador.
 */
function getLocalDraftItemStorageKey(draftKey: string) {
  return `${LOCAL_DRAFT_ITEM_STORAGE_KEY_PREFIX}${draftKey}`;
}

function normalizeDraftKeyPart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getPredioFieldValue(
  predio: RelevamientoLocalDraft['selectedPredio'],
  fieldNames: string[],
) {
  if (!predio) {
    return '';
  }

  const predioRecord = predio as unknown as Record<string, unknown>;

  for (const fieldName of fieldNames) {
    const value = predioRecord[fieldName];

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }

  return '';
}

function buildPredioLabel(draft: Pick<RelevamientoLocalDraft, 'selectedPredio' | 'selectedPredioId'>) {
  const selectedPredio = draft.selectedPredio;

  if (!selectedPredio) {
    return draft.selectedPredioId || 'Predio sin identificar';
  }

  const direccion = getPredioFieldValue(selectedPredio, [
    'direccion',
    'direccionCompleta',
    'domicilio',
  ]);

  if (direccion) {
    return direccion;
  }

  const calle = getPredioFieldValue(selectedPredio, [
    'calle',
    'nombreCalle',
    'calleNombre',
  ]);
  const numero = getPredioFieldValue(selectedPredio, [
    'numeroPuertaTeorico',
    'numeroPuerta',
    'numero',
    'numeroTeorico',
    'puerta',
    'nroPuerta',
  ]);

  if (calle || numero) {
    return [calle, numero].filter(Boolean).join(' ');
  }

  return draft.selectedPredioId || selectedPredio.id || 'Predio sin identificar';
}

export function buildLocalDraftKey(
  draft: Pick<RelevamientoLocalDraft, 'selectedPredioId' | 'selectedPredio' | 'selectedCuadrante'>,
): string | null {
  const predioId = draft.selectedPredio?.id || draft.selectedPredioId;
  const calle = getPredioFieldValue(draft.selectedPredio, [
    'calle',
    'nombreCalle',
    'calleNombre',
  ]);
  const numero = getPredioFieldValue(draft.selectedPredio, [
    'numeroPuertaTeorico',
    'numeroPuerta',
    'numero',
    'numeroTeorico',
    'puerta',
    'nroPuerta',
  ]);
  const cuadranteId =
    draft.selectedCuadrante?.id ||
    getPredioFieldValue(draft.selectedPredio, ['cuadranteId', 'idCuadrante']);

  const looksManual =
    draft.selectedPredio?.origen === 'manual' ||
    draft.selectedPredioId.toLowerCase().includes('manual') ||
    predioId.toLowerCase().includes('manual');

  if (looksManual && cuadranteId && (calle || numero)) {
    const manualParts = [
      'manual',
      normalizeDraftKeyPart(cuadranteId),
      normalizeDraftKeyPart(calle || 'sin-calle'),
      normalizeDraftKeyPart(numero || 'sin-numero'),
    ].filter(Boolean);

    return manualParts.join(':');
  }

  if (predioId) {
    return `predio:${normalizeDraftKeyPart(predioId)}`;
  }

  if (cuadranteId && (calle || numero)) {
    const manualParts = [
      'manual',
      normalizeDraftKeyPart(cuadranteId),
      normalizeDraftKeyPart(calle || 'sin-calle'),
      normalizeDraftKeyPart(numero || 'sin-numero'),
    ].filter(Boolean);

    return manualParts.join(':');
  }

  return null;
}

function getLocalDraftsIndexFromStorage(): RelevamientoLocalDraftIndexItem[] {
  const rawDraftsIndex = window.localStorage.getItem(LOCAL_DRAFTS_INDEX_STORAGE_KEY);

  if (!rawDraftsIndex) {
    return [];
  }

  const parsedDraftsIndex = JSON.parse(rawDraftsIndex);

  if (!Array.isArray(parsedDraftsIndex)) {
    return [];
  }

  return parsedDraftsIndex.filter(
    (item): item is RelevamientoLocalDraftIndexItem =>
      Boolean(item) &&
      typeof item === 'object' &&
      typeof item.draftKey === 'string' &&
      typeof item.predioLabel === 'string' &&
      typeof item.selectedPredioId === 'string' &&
      typeof item.currentSectionId === 'string' &&
      typeof item.savedAt === 'string' &&
      typeof item.cantidadHogares === 'number',
  );
}

function saveLocalDraftsIndex(index: RelevamientoLocalDraftIndexItem[]) {
  window.localStorage.setItem(LOCAL_DRAFTS_INDEX_STORAGE_KEY, JSON.stringify(index));
}

export function getLocalDraftsIndex(): RelevamientoLocalDraftIndexItem[] {
  try {
    return getLocalDraftsIndexFromStorage().sort(
      (firstDraft, secondDraft) =>
        new Date(secondDraft.savedAt).getTime() - new Date(firstDraft.savedAt).getTime(),
    );
  } catch {
    return [];
  }
}

export function getLocalDraftByKey(draftKey: string): RelevamientoLocalDraft | null {
  try {
    const rawDraft = window.localStorage.getItem(getLocalDraftItemStorageKey(draftKey));

    if (!rawDraft) {
      return null;
    }

    return JSON.parse(rawDraft) as RelevamientoLocalDraft;
  } catch {
    return null;
  }
}

export function saveLocalDraftSnapshot(draft: RelevamientoLocalDraft): boolean {
  try {
    const draftKey = buildLocalDraftKey(draft);

    if (!draftKey) {
      return false;
    }

    const savedAt = draft.savedAt || new Date().toISOString();
    const indexItem: RelevamientoLocalDraftIndexItem = {
      draftKey,
      predioLabel: buildPredioLabel(draft),
      selectedPredioId: draft.selectedPredioId,
      selectedPredio: draft.selectedPredio,
      selectedCuadrante: draft.selectedCuadrante ?? null,
      currentSectionId: draft.currentSectionId,
      savedAt,
      cantidadHogares: draft.hogares.length,
      serverDraftId: draft.serverDraftId ?? null,
      serverDraftVersion: draft.serverDraftVersion ?? null,
    };

    window.localStorage.setItem(
      getLocalDraftItemStorageKey(draftKey),
      JSON.stringify({
        ...draft,
        savedAt,
      }),
    );

    const previousIndex = getLocalDraftsIndexFromStorage();
    const nextIndex = [
      indexItem,
      ...previousIndex.filter((item) => item.draftKey !== draftKey),
    ];

    saveLocalDraftsIndex(nextIndex);

    return true;
  } catch {
    return false;
  }
}

export function removeLocalDraftByKey(draftKey: string): boolean {
  try {
    window.localStorage.removeItem(getLocalDraftItemStorageKey(draftKey));

    const nextIndex = getLocalDraftsIndexFromStorage().filter(
      (item) => item.draftKey !== draftKey,
    );

    saveLocalDraftsIndex(nextIndex);

    return true;
  } catch {
    return false;
  }
}

export function getLocalDraft(): RelevamientoLocalDraft | null {
  try {
    const rawDraft = window.localStorage.getItem(LOCAL_DRAFT_STORAGE_KEY);

    if (!rawDraft) {
      return null;
    }

    return JSON.parse(rawDraft) as RelevamientoLocalDraft;
  } catch {
    return null;
  }
}

export function saveLocalDraft(draft: RelevamientoLocalDraft): boolean {
  try {
    const savedAt = draft.savedAt || new Date().toISOString();
    const draftToSave = {
      ...draft,
      savedAt,
    };

    window.localStorage.setItem(LOCAL_DRAFT_STORAGE_KEY, JSON.stringify(draftToSave));
    saveLocalDraftSnapshot(draftToSave);

    return true;
  } catch {
    return false;
  }
}

export function clearLocalDraft(): boolean {
  try {
    const activeDraft = getLocalDraft();
    const activeDraftKey = activeDraft ? buildLocalDraftKey(activeDraft) : null;

    window.localStorage.removeItem(LOCAL_DRAFT_STORAGE_KEY);

    if (activeDraftKey) {
      removeLocalDraftByKey(activeDraftKey);
    }

    return true;
  } catch {
    return false;
  }
}

export function hasLocalDraft(): boolean {
  return getLocalDraft() !== null;
}
