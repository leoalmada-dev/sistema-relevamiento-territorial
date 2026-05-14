export type ServiciosFormState = {
  tieneLuzAgua: string;
  tieneConvenioLuzAgua: string;
  titularConvenioLuzAgua: string;
  tieneCableInternet: string;
  titularCableInternet: string;
  observacionesServicios: string;
};

export type SaludFormState = {
  servicioAtencionMedica: string;
  prestadorPrivado: string;
  centroASSE: string;
  tieneEmergenciaMovil: string;
  emergenciaMovil: string;
  observacionesSalud: string;
};

export const serviciosInicial: ServiciosFormState = {
  tieneLuzAgua: '',
  tieneConvenioLuzAgua: '',
  titularConvenioLuzAgua: '',
  tieneCableInternet: '',
  titularCableInternet: '',
  observacionesServicios: '',
};

export const saludInicial: SaludFormState = {
  servicioAtencionMedica: '',
  prestadorPrivado: '',
  centroASSE: '',
  tieneEmergenciaMovil: '',
  emergenciaMovil: '',
  observacionesSalud: '',
};
