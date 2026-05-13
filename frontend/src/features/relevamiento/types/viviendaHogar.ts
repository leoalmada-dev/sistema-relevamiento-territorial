export type ViviendaFormState = {
  cantidadHogaresDeclarada: string;
  vinculoEntreHogares: string;
  observacionesVivienda: string;
};

export type HogarFormState = {
  id: string;
  numeroHogar: string;
  tiempoViveBarrio: string;
  beneficiarioRegularizacion: string;
  formaAccesoVivienda: string;
  formaAccesoOtro: string;
  titularVivienda: string;
  conformeCaracteristicas: string;
};

export const viviendaInicial: ViviendaFormState = {
  cantidadHogaresDeclarada: '',
  vinculoEntreHogares: '',
  observacionesVivienda: '',
};

export function crearHogarInicial(numeroHogar: number): HogarFormState {
  return {
    id: `hogar-${numeroHogar}-${Date.now()}`,
    numeroHogar: String(numeroHogar),
    tiempoViveBarrio: '',
    beneficiarioRegularizacion: '',
    formaAccesoVivienda: '',
    formaAccesoOtro: '',
    titularVivienda: '',
    conformeCaracteristicas: '',
  };
}
