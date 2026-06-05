export type CapturedLocationSource = 'android' | 'browser';

export type LocationCaptureErrorCode =
  | 'ANDROID_APP_UNAVAILABLE'
  | 'ANDROID_GET_POSICION_UNAVAILABLE'
  | 'ANDROID_GET_POSICION_ERROR'
  | 'ANDROID_JSON_INVALID'
  | 'ANDROID_VALIDO_FALSE'
  | 'ANDROID_COORDS_INVALID'
  | 'ANDROID_ZERO_COORDS'
  | 'BROWSER_INSECURE_CONTEXT'
  | 'BROWSER_UNAVAILABLE'
  | 'BROWSER_PERMISSION_DENIED'
  | 'BROWSER_POSITION_UNAVAILABLE'
  | 'BROWSER_TIMEOUT'
  | 'BROWSER_COORDS_INVALID';

export type LocationCaptureResult =
  | {
      ok: true;
      source: CapturedLocationSource;
      latitude: number;
      longitude: number;
      message: string;
    }
  | {
      ok: false;
      source: 'manual';
      errorCode: LocationCaptureErrorCode;
      message: string;
    };

type AndroidLocationAttempt =
  | {
      ok: true;
      latitude: number;
      longitude: number;
    }
  | {
      ok: false;
      errorCode: LocationCaptureErrorCode;
      message: string;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteCoordinate(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function coordinatesAreZero(latitude: number, longitude: number) {
  return latitude === 0 && longitude === 0;
}

function coordinatesAreInRange(latitude: number, longitude: number) {
  return (
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function parseAndroidPosition(rawPosition: unknown): AndroidLocationAttempt {
  if (typeof rawPosition !== 'string' || !rawPosition.trim()) {
    return {
      ok: false,
      errorCode: 'ANDROID_JSON_INVALID',
      message: 'AndroidApp.getPosicion no devolvió un JSON válido.',
    };
  }

  let parsedPosition: unknown;

  try {
    parsedPosition = JSON.parse(rawPosition);
  } catch {
    return {
      ok: false,
      errorCode: 'ANDROID_JSON_INVALID',
      message: 'AndroidApp.getPosicion devolvió JSON inválido.',
    };
  }

  if (!isRecord(parsedPosition)) {
    return {
      ok: false,
      errorCode: 'ANDROID_JSON_INVALID',
      message: 'AndroidApp.getPosicion devolvió una respuesta inválida.',
    };
  }

  if (parsedPosition.valido !== true) {
    return {
      ok: false,
      errorCode: 'ANDROID_VALIDO_FALSE',
      message: 'AndroidApp.getPosicion informó una ubicación no válida.',
    };
  }

  const latitude = parsedPosition.lat;
  const longitude = parsedPosition.lng;

  if (!isFiniteCoordinate(latitude) || !isFiniteCoordinate(longitude)) {
    return {
      ok: false,
      errorCode: 'ANDROID_COORDS_INVALID',
      message: 'AndroidApp.getPosicion devolvió latitud o longitud inválida.',
    };
  }

  if (coordinatesAreZero(latitude, longitude)) {
    return {
      ok: false,
      errorCode: 'ANDROID_ZERO_COORDS',
      message: 'AndroidApp.getPosicion devolvió latitud y longitud en cero.',
    };
  }

  if (!coordinatesAreInRange(latitude, longitude)) {
    return {
      ok: false,
      errorCode: 'ANDROID_COORDS_INVALID',
      message: 'AndroidApp.getPosicion devolvió coordenadas fuera de rango.',
    };
  }

  return {
    ok: true,
    latitude,
    longitude,
  };
}

function getAndroidLocation(): AndroidLocationAttempt {
  if (typeof window === 'undefined' || !window.AndroidApp) {
    return {
      ok: false,
      errorCode: 'ANDROID_APP_UNAVAILABLE',
      message: 'AndroidApp no está disponible.',
    };
  }

  const getPosicion = window.AndroidApp.getPosicion;

  if (typeof getPosicion !== 'function') {
    return {
      ok: false,
      errorCode: 'ANDROID_GET_POSICION_UNAVAILABLE',
      message: 'AndroidApp.getPosicion no está disponible.',
    };
  }

  try {
    return parseAndroidPosition(getPosicion());
  } catch {
    return {
      ok: false,
      errorCode: 'ANDROID_GET_POSICION_ERROR',
      message: 'AndroidApp.getPosicion no respondió correctamente.',
    };
  }
}

function getBrowserGeolocationErrorCode(error: GeolocationPositionError): LocationCaptureErrorCode {
  if (error.code === error.PERMISSION_DENIED) {
    return 'BROWSER_PERMISSION_DENIED';
  }

  if (error.code === error.POSITION_UNAVAILABLE) {
    return 'BROWSER_POSITION_UNAVAILABLE';
  }

  if (error.code === error.TIMEOUT) {
    return 'BROWSER_TIMEOUT';
  }

  return 'BROWSER_UNAVAILABLE';
}

function getBrowserGeolocationErrorMessage(errorCode: LocationCaptureErrorCode) {
  if (errorCode === 'BROWSER_PERMISSION_DENIED') {
    return 'Permiso de ubicación del navegador denegado o no disponible.';
  }

  if (errorCode === 'BROWSER_POSITION_UNAVAILABLE') {
    return 'No se pudo obtener la ubicación del navegador. Verifique señal GPS o conexión del dispositivo.';
  }

  if (errorCode === 'BROWSER_TIMEOUT') {
    return 'No se pudo obtener la ubicación del navegador dentro del tiempo esperado.';
  }

  return 'Ubicación del navegador no disponible.';
}

function buildManualFallbackMessage(androidMessage: string, browserMessage: string) {
  return `${androidMessage} ${browserMessage} Complete manualmente o revise el puente Android.`;
}

function getBrowserLocation(androidAttempt: AndroidLocationAttempt): Promise<LocationCaptureResult> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      resolve({
        ok: false,
        source: 'manual',
        errorCode: 'BROWSER_INSECURE_CONTEXT',
        message: buildManualFallbackMessage(
          androidAttempt.ok ? '' : androidAttempt.message,
          'La geolocalización del navegador no está disponible en HTTP.',
        ).trim(),
      });
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({
        ok: false,
        source: 'manual',
        errorCode: 'BROWSER_UNAVAILABLE',
        message: buildManualFallbackMessage(
          androidAttempt.ok ? '' : androidAttempt.message,
          'Ubicación del navegador no disponible.',
        ).trim(),
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude) ||
          coordinatesAreZero(latitude, longitude) ||
          !coordinatesAreInRange(latitude, longitude)
        ) {
          resolve({
            ok: false,
            source: 'manual',
            errorCode: 'BROWSER_COORDS_INVALID',
            message: buildManualFallbackMessage(
              androidAttempt.ok ? '' : androidAttempt.message,
              'El navegador devolvió coordenadas inválidas.',
            ).trim(),
          });
          return;
        }

        resolve({
          ok: true,
          source: 'browser',
          latitude,
          longitude,
          message: 'Ubicación cargada correctamente.',
        });
      },
      (error) => {
        const errorCode = getBrowserGeolocationErrorCode(error);

        resolve({
          ok: false,
          source: 'manual',
          errorCode,
          message: buildManualFallbackMessage(
            androidAttempt.ok ? '' : androidAttempt.message,
            getBrowserGeolocationErrorMessage(errorCode),
          ).trim(),
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  });
}

export async function captureCurrentLocation(): Promise<LocationCaptureResult> {
  const androidAttempt = getAndroidLocation();

  if (androidAttempt.ok) {
    return {
      ok: true,
      source: 'android',
      latitude: androidAttempt.latitude,
      longitude: androidAttempt.longitude,
      message: 'Ubicación cargada correctamente.',
    };
  }

  return getBrowserLocation(androidAttempt);
}
