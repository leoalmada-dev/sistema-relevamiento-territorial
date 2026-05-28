import {
  saludInicial,
  serviciosInicial,
  type SaludFormState,
  type ServiciosFormState,
} from './serviciosSalud';

export type PersonaFormState = {
  id: string;
  nombre: string;
  apellido: string;
  cedula: string;
  edad: string;
  sexo: string;
  ascendenciaEtnicoRacial: string;
  ocupacion: string;
  presentaDiscapacidad: string;
  tipoDiscapacidad: string;
  esReferente: boolean;
  parentescoConReferente: string;
  vinculoBarrioFamilia: string;
  observaciones: string;
};

export type ContactoFormState = {
  id: string;
  orden: string;
  telefono: string;
  nombreReferencia: string;
  observaciones: string;
};

export type PersonasContactosHogarState = {
  personas: PersonaFormState[];
  contactos: ContactoFormState[];
  servicios: ServiciosFormState;
  salud: SaludFormState;
};

export type PersonasContactosPorHogarState = Record<string, PersonasContactosHogarState>;

export function crearPersonaInicial(numeroPersona: number): PersonaFormState {
  return {
    id: `persona-${numeroPersona}-${Date.now()}`,
    nombre: '',
    apellido: '',
    cedula: '',
    edad: '',
    sexo: '',
    ascendenciaEtnicoRacial: '',
    ocupacion: '',
    presentaDiscapacidad: '',
    tipoDiscapacidad: '',
    esReferente: false,
    parentescoConReferente: '',
    vinculoBarrioFamilia: '',
    observaciones: '',
  };
}

export function crearContactoInicial(numeroContacto: number): ContactoFormState {
  return {
    id: `contacto-${numeroContacto}-${Date.now()}`,
    orden: String(numeroContacto),
    telefono: '',
    nombreReferencia: '',
    observaciones: '',
  };
}

export function crearPersonasContactosHogarInicial(): PersonasContactosHogarState {
  return {
    personas: [],
    contactos: [],
    servicios: { ...serviciosInicial },
    salud: { ...saludInicial },
  };
}
