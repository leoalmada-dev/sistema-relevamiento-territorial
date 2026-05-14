export type CierreRelevamientoFormState = {
  observacionesGenerales: string;
  latitud: string;
  longitud: string;
  horaCaptura: string;
};

export const cierreRelevamientoInicial: CierreRelevamientoFormState = {
  observacionesGenerales: '',
  latitud: '',
  longitud: '',
  horaCaptura: '',
};
