export type ViviendaFormState = {
  cantidadHogaresDeclarada: string;
  vinculoEntreHogares: string;
  observacionesVivienda: string;
};

export type EstadoHogarMvp =
  | 'ENTREVISTADO'
  | 'PENDIENTE'
  | 'NO_SE_ENCUENTRA'
  | 'SE_NIEGA';

export const estadoHogarLabels: Record<EstadoHogarMvp, string> = {
  ENTREVISTADO: 'Se procede a la entrevista',
  PENDIENTE: 'Pendiente',
  NO_SE_ENCUENTRA: 'No se encuentra',
  SE_NIEGA: 'Se niega',
};

export type HogarFormState = {
  id: string;
  numeroHogar: string;
  estadoHogar?: EstadoHogarMvp;
  observacionEstadoHogar?: string;
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

export function getEstadoHogar(
  hogar: Pick<HogarFormState, 'estadoHogar'>,
): EstadoHogarMvp {
  return hogar.estadoHogar && estadoHogarLabels[hogar.estadoHogar]
    ? hogar.estadoHogar
    : 'ENTREVISTADO';
}

export function hogarEstaEntrevistado(hogar: Pick<HogarFormState, 'estadoHogar'>) {
  return getEstadoHogar(hogar) === 'ENTREVISTADO';
}

export function hayHogaresNoEntrevistados(hogares: Pick<HogarFormState, 'estadoHogar'>[]) {
  return hogares.some((hogar) => !hogarEstaEntrevistado(hogar));
}

export function crearHogarInicial(numeroHogar: number): HogarFormState {
  return {
    id: `hogar-${numeroHogar}-${Date.now()}`,
    numeroHogar: String(numeroHogar),
    estadoHogar: 'ENTREVISTADO',
    observacionEstadoHogar: '',
    tiempoViveBarrio: '',
    beneficiarioRegularizacion: '',
    formaAccesoVivienda: '',
    formaAccesoOtro: '',
    titularVivienda: '',
    conformeCaracteristicas: '',
  };
}
