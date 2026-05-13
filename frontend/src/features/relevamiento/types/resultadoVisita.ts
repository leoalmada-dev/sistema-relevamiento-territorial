export type ResultadoVisita =
  | ''
  | 'ENTREVISTA_REALIZADA'
  | 'SE_NIEGA'
  | 'NO_SE_ENCUENTRA';

export type ResultadoVisitaFormState = {
  resultado: ResultadoVisita;
  motivoNegativa: string;
  referencia: string;
  contacto: string;
  horario: string;
  observacion: string;
};

export const resultadoVisitaInicial: ResultadoVisitaFormState = {
  resultado: '',
  motivoNegativa: '',
  referencia: '',
  contacto: '',
  horario: '',
  observacion: '',
};

export function esCorteTemprano(resultado: ResultadoVisita): boolean {
  return resultado === 'SE_NIEGA' || resultado === 'NO_SE_ENCUENTRA';
}

export function permiteContinuarFormulario(resultado: ResultadoVisita): boolean {
  return resultado === 'ENTREVISTA_REALIZADA';
}
