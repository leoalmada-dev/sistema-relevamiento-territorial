/// <reference types="vite/client" />

interface Window {
  AndroidApp?: {
    getPosicion: () => string;
    getUltimaLatitud?: () => number;
    getUltimaLongitud?: () => number;
  };
}
