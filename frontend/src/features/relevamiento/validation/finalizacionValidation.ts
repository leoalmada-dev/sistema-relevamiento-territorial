import type { CierreRelevamientoFormState } from '../types/cierreRelevamiento';
import type { PersonasContactosPorHogarState } from '../types/personaContacto';
import type { ResultadoVisitaFormState } from '../types/resultadoVisita';
import type { CuadranteOption, PredioDetalle } from '../types/territorio';
import {
  estadoHogarLabels,
  getEstadoHogar,
  hogarEstaEntrevistado,
  type HogarFormState,
  type ViviendaFormState,
} from '../types/viviendaHogar';

export type FinalizacionValidationError = {
  campo: string;
  mensaje: string;
};

export type FinalizacionValidationResult = {
  valid: boolean;
  errors: FinalizacionValidationError[];
};

export type FinalizacionValidationInput = {
  selectedPredio: PredioDetalle | null;
  selectedCuadrante: CuadranteOption | null;
  resultadoVisita: ResultadoVisitaFormState;
  vivienda: ViviendaFormState;
  hogares: HogarFormState[];
  personasContactosPorHogar: PersonasContactosPorHogarState;
  cierre: CierreRelevamientoFormState;
};

const MAX_HOGARES_DECLARADOS = 5;

const SIN_HOGAR_ENTREVISTADO_FINALIZACION_MESSAGE =
  'Para finalizar una entrevista realizada debe existir al menos un hogar entrevistado. Si no se pudo entrevistar ningún hogar, corresponde cerrar la visita desde la Sección 1.';

const HOGARES_PENDIENTES_FINALIZACION_MESSAGE =
  'Hay hogares pendientes. La carga debe quedar guardada como borrador para retomarla luego.';

const RESULTADOS_VISITA_VALIDOS = new Set([
  'ENTREVISTA_REALIZADA',
  'SE_NIEGA',
  'NO_SE_ENCUENTRA',
]);

function isBlank(value: string) {
  return value.trim() === '';
}

function hasCompletedValue(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value);
  }

  return String(value ?? '').trim().length > 0;
}

function hogarTieneDatosOperativosReales(
  input: FinalizacionValidationInput,
  hogar: HogarFormState,
) {
  const estadoHogar = getEstadoHogar(hogar);

  if (estadoHogar === 'PENDIENTE') {
    return true;
  }

  const datosHogar = input.personasContactosPorHogar[hogar.id];
  const camposBasicos = [
    hogar.observacionEstadoHogar,
    hogar.tiempoViveBarrio,
    hogar.beneficiarioRegularizacion,
    hogar.formaAccesoVivienda,
    hogar.formaAccesoOtro,
    hogar.titularVivienda,
    hogar.conformeCaracteristicas,
    hogar.cantidadPersonasDeclaradas,
  ];

  return Boolean(
    camposBasicos.some(hasCompletedValue) ||
      (datosHogar?.personas.length ?? 0) > 0 ||
      (datosHogar?.contactos.length ?? 0) > 0 ||
      Object.values(datosHogar?.servicios ?? {}).some(hasCompletedValue) ||
      Object.values(datosHogar?.salud ?? {}).some(hasCompletedValue),
  );
}

function getHogaresRealesConIndice(input: FinalizacionValidationInput) {
  return input.hogares
    .map((hogar, index) => ({ hogar, index }))
    .filter(({ hogar }) => hogarTieneDatosOperativosReales(input, hogar));
}

function parseNumber(value: string) {
  const normalizedValue = value.trim().replace(',', '.');

  if (!normalizedValue) {
    return null;
  }

  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function isNonNegativeInteger(value: string) {
  const parsedValue = parseNumber(value);

  return parsedValue !== null && Number.isInteger(parsedValue) && parsedValue >= 0;
}

function isValidLatitude(value: string) {
  const parsedValue = parseNumber(value);

  return parsedValue !== null && parsedValue >= -90 && parsedValue <= 90;
}

function isValidLongitude(value: string) {
  const parsedValue = parseNumber(value);

  return parsedValue !== null && parsedValue >= -180 && parsedValue <= 180;
}

function addError(
  errors: FinalizacionValidationError[],
  campo: string,
  mensaje: string,
) {
  errors.push({ campo, mensaje });
}

function buildValidationResult(
  errors: FinalizacionValidationError[],
): FinalizacionValidationResult {
  const seen = new Set<string>();
  const normalizedErrors = errors.filter((error) => {
    const key = `${error.campo}-${error.mensaje}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });

  return {
    valid: normalizedErrors.length === 0,
    errors: normalizedErrors,
  };
}

function validatePredioYResultado(
  input: FinalizacionValidationInput,
  errors: FinalizacionValidationError[],
) {
  if (!input.selectedPredio) {
    addError(errors, 'predio', 'Seleccione un predio.');
  } else {
    const cuadranteId = input.selectedPredio.cuadranteId || input.selectedCuadrante?.id || '';
    const zonaId = input.selectedCuadrante?.zonaId || '';

    if (isBlank(cuadranteId) || isBlank(zonaId)) {
      addError(
        errors,
        'territorio.cuadrante',
        'Territorio: no se pudo identificar el cuadrante del predio. Vuelva a seleccionar zona, cuadrante y predio.',
      );
    }
  }

  if (!input.resultadoVisita.resultado) {
    addError(errors, 'resultadoVisita', 'Seleccione el resultado de la visita.');
    return;
  }

  if (!RESULTADOS_VISITA_VALIDOS.has(input.resultadoVisita.resultado)) {
    addError(
      errors,
      'resultadoVisita.resultado',
      'Seleccione un resultado de visita válido.',
    );
  }
}

function validateCierreFields(
  input: FinalizacionValidationInput,
  errors: FinalizacionValidationError[],
) {
  if (isBlank(input.cierre.latitud)) {
    addError(errors, 'cierre.latitud', 'Cierre: complete latitud.');
  } else if (!isValidLatitude(input.cierre.latitud)) {
    addError(errors, 'cierre.latitud', 'Cierre: complete una latitud válida.');
  }

  if (isBlank(input.cierre.longitud)) {
    addError(errors, 'cierre.longitud', 'Cierre: complete longitud.');
  } else if (!isValidLongitude(input.cierre.longitud)) {
    addError(errors, 'cierre.longitud', 'Cierre: complete una longitud válida.');
  }

  if (isBlank(input.cierre.horaCaptura)) {
    addError(errors, 'cierre.horaCaptura', 'Cierre: complete hora de captura.');
  }
}

function validateViviendaHogaresFields(
  input: FinalizacionValidationInput,
  errors: FinalizacionValidationError[],
) {
  if (input.hogares.length === 0) {
    addError(errors, 'hogares', 'Debe cargar al menos un hogar.');
  }

  if (isBlank(input.vivienda.cantidadHogaresDeclarada)) {
    addError(
      errors,
      'vivienda.cantidadHogaresDeclarada',
      'Complete la cantidad de hogares declarada.',
    );
  } else if (!isNonNegativeInteger(input.vivienda.cantidadHogaresDeclarada)) {
    addError(
      errors,
      'vivienda.cantidadHogaresDeclarada',
      'La cantidad de hogares declarada debe ser un número válido.',
    );
  } else {
    const cantidadDeclarada = Number(input.vivienda.cantidadHogaresDeclarada);

    if (cantidadDeclarada <= 0) {
      addError(
        errors,
        'vivienda.cantidadHogaresDeclarada',
        'La cantidad de hogares declarada debe ser mayor a 0.',
      );
      return;
    }

    if (cantidadDeclarada > MAX_HOGARES_DECLARADOS) {
      addError(
        errors,
        'vivienda.cantidadHogaresDeclarada',
        'La cantidad de hogares declarada no puede ser mayor a 5 en esta versión.',
      );
      return;
    }

  }

  if (getHogaresRealesConIndice(input).length > 1 && isBlank(input.vivienda.vinculoEntreHogares)) {
    addError(
      errors,
      'vivienda.vinculoEntreHogares',
      'Vivienda: seleccione el vínculo entre hogares.',
    );
  }

  getHogaresRealesConIndice(input).forEach(({ hogar, index: hogarIndex }) => {
    const hogarLabel = `Hogar ${hogarIndex + 1}`;

    if (!hogarEstaEntrevistado(hogar)) {
      return;
    }

    if (isBlank(hogar.tiempoViveBarrio)) {
      addError(
        errors,
        `hogares.${hogarIndex}.tiempoViveBarrio`,
        `${hogarLabel}: complete el tiempo que vive en el barrio con un número.`,
      );
    } else if (!isNonNegativeInteger(hogar.tiempoViveBarrio)) {
      addError(
        errors,
        `hogares.${hogarIndex}.tiempoViveBarrio`,
        `${hogarLabel}: complete el tiempo que vive en el barrio con un número válido.`,
      );
    }

    if (isBlank(hogar.beneficiarioRegularizacion)) {
      addError(
        errors,
        `hogares.${hogarIndex}.beneficiarioRegularizacion`,
        `${hogarLabel}: seleccione si es beneficiario de regularización PIAI.`,
      );
    }

    if (isBlank(hogar.formaAccesoVivienda)) {
      addError(
        errors,
        `hogares.${hogarIndex}.formaAccesoVivienda`,
        `${hogarLabel}: seleccione cómo accedieron a esta vivienda.`,
      );
    }

  });
}

function validatePersonasContactosFields(
  input: FinalizacionValidationInput,
  errors: FinalizacionValidationError[],
) {
  const documentos = new Map<string, number>();

  getHogaresRealesConIndice(input).forEach(({ hogar, index: hogarIndex }) => {
    const hogarLabel = `Hogar ${hogarIndex + 1}`;

    if (!hogarEstaEntrevistado(hogar)) {
      return;
    }

    const datosHogar = input.personasContactosPorHogar[hogar.id];
    const personas = datosHogar?.personas ?? [];

    if (isBlank(datosHogar?.servicios.tieneLuzAgua ?? '')) {
      addError(
        errors,
        `hogares.${hogarIndex}.servicios.tieneLuzAgua`,
        `${hogarLabel}: seleccione si tiene luz / agua.`,
      );
    }

    if (isBlank(datosHogar?.servicios.tieneConvenioLuzAgua ?? '')) {
      addError(
        errors,
        `hogares.${hogarIndex}.servicios.tieneConvenioLuzAgua`,
        `${hogarLabel}: seleccione si tiene convenio de luz / agua.`,
      );
    }

    if (isBlank(datosHogar?.servicios.tieneCableInternet ?? '')) {
      addError(
        errors,
        `hogares.${hogarIndex}.servicios.tieneCableInternet`,
        `${hogarLabel}: seleccione si tiene cable / internet.`,
      );
    }

    if (isBlank(datosHogar?.salud.servicioAtencionMedica ?? '')) {
      addError(
        errors,
        `hogares.${hogarIndex}.salud.servicioAtencionMedica`,
        `${hogarLabel}: seleccione servicio de atención médica.`,
      );
    }

    if (isBlank(datosHogar?.salud.tieneEmergenciaMovil ?? '')) {
      addError(
        errors,
        `hogares.${hogarIndex}.salud.tieneEmergenciaMovil`,
        `${hogarLabel}: seleccione si tiene emergencia móvil.`,
      );
    }

    if (personas.length === 0) {
      addError(
        errors,
        `hogares.${hogarIndex}.personas`,
        `${hogarLabel}: debe tener al menos una persona cargada.`,
      );
    }

    const cantidadReferentes = personas.filter((persona) => persona.esReferente).length;

    if (personas.length > 0 && cantidadReferentes === 0) {
      addError(
        errors,
        `hogares.${hogarIndex}.personas.referente`,
        `${hogarLabel}: debe tener una persona referente.`,
      );
    }

    if (cantidadReferentes > 1) {
      addError(
        errors,
        `hogares.${hogarIndex}.personas.referente`,
        `${hogarLabel}: solo puede haber una persona referente.`,
      );
    }

    const contactos = datosHogar?.contactos ?? [];

    contactos.forEach((contacto, contactoIndex) => {
      if (isBlank(contacto.telefono)) {
        addError(
          errors,
          `hogares.${hogarIndex}.contactos.${contactoIndex}.telefono`,
          `Contacto ${contactoIndex + 1} del ${hogarLabel}: complete teléfono o elimine el contacto.`,
        );
      }
    });

    personas.forEach((persona, personaIndex) => {
      const personaLabel = `Persona ${personaIndex + 1} del ${hogarLabel}`;
      const documento = persona.cedula.trim();

      if (isBlank(persona.nombre)) {
        addError(
          errors,
          `hogares.${hogarIndex}.personas.${personaIndex}.nombre`,
          `${personaLabel}: falta nombre.`,
        );
      }

      if (isBlank(persona.apellido)) {
        addError(
          errors,
          `hogares.${hogarIndex}.personas.${personaIndex}.apellido`,
          `${personaLabel}: falta apellido.`,
        );
      }

      if (!documento) {
        addError(
          errors,
          `hogares.${hogarIndex}.personas.${personaIndex}.cedula`,
          `${personaLabel}: falta documento.`,
        );
      } else {
        documentos.set(documento, (documentos.get(documento) ?? 0) + 1);
      }

      if (isBlank(persona.edad)) {
        addError(
          errors,
          `hogares.${hogarIndex}.personas.${personaIndex}.edad`,
          `${personaLabel}: falta edad.`,
        );
      } else if (!isNonNegativeInteger(persona.edad)) {
        addError(
          errors,
          `hogares.${hogarIndex}.personas.${personaIndex}.edad`,
          `${personaLabel}: complete una edad válida.`,
        );
      } else if ((parseNumber(persona.edad) ?? 0) > 120) {
        addError(
          errors,
          `hogares.${hogarIndex}.personas.${personaIndex}.edad`,
          `${personaLabel}: la edad no debe ser mayor que 120.`,
        );
      }

      if (isBlank(persona.sexo)) {
        addError(
          errors,
          `hogares.${hogarIndex}.personas.${personaIndex}.sexo`,
          `${personaLabel}: seleccione género.`,
        );
      }

      if (isBlank(persona.ocupacion)) {
        addError(
          errors,
          `hogares.${hogarIndex}.personas.${personaIndex}.ocupacion`,
          `${personaLabel}: seleccione ocupación.`,
        );
      }

      if (!persona.esReferente && isBlank(persona.parentescoConReferente)) {
        addError(
          errors,
          `hogares.${hogarIndex}.personas.${personaIndex}.parentescoConReferente`,
          `${personaLabel}: seleccione parentesco con referente.`,
        );
      }
    });
  });

  const documentosDuplicados = Array.from(documentos.entries())
    .filter(([, cantidad]) => cantidad > 1)
    .map(([documento]) => documento);

  if (documentosDuplicados.length > 0) {
    addError(
      errors,
      'personas.documentosDuplicados',
      `Hay documentos duplicados en el formulario: ${documentosDuplicados.join(', ')}.`,
    );
  }
}

function validateEstadosHogaresFinalizacion(
  input: FinalizacionValidationInput,
  errors: FinalizacionValidationError[],
) {
  const hogaresReales = getHogaresRealesConIndice(input);
  const hogaresEntrevistados = hogaresReales.filter(({ hogar }) =>
    hogarEstaEntrevistado(hogar),
  );
  const hogaresPendientes = hogaresReales.filter(
    ({ hogar }) => getEstadoHogar(hogar) === 'PENDIENTE',
  );

  if (hogaresEntrevistados.length === 0) {
    addError(errors, 'hogares', SIN_HOGAR_ENTREVISTADO_FINALIZACION_MESSAGE);
  }

  if (hogaresPendientes.length === 0) {
    return;
  }

  const pendientesLabel = hogaresPendientes.map(
    ({ hogar, index }) =>
      `Hogar ${hogar.numeroHogar || index + 1}: ${estadoHogarLabels[getEstadoHogar(hogar)]}`,
  );

  addError(
    errors,
    'hogares.estadoHogar',
    `${HOGARES_PENDIENTES_FINALIZACION_MESSAGE} Hogares a retomar: ${pendientesLabel.join('; ')}.`,
  );
}


export function validateInicioPredioVisita(
  input: FinalizacionValidationInput,
): FinalizacionValidationResult {
  const errors: FinalizacionValidationError[] = [];

  validatePredioYResultado(input, errors);

  return buildValidationResult(errors);
}

export function validateViviendaHogares(
  input: FinalizacionValidationInput,
): FinalizacionValidationResult {
  const errors: FinalizacionValidationError[] = [];

  validateViviendaHogaresFields(input, errors);

  return buildValidationResult(errors);
}

export function validatePersonasContactos(
  input: FinalizacionValidationInput,
): FinalizacionValidationResult {
  const errors: FinalizacionValidationError[] = [];

  validatePersonasContactosFields(input, errors);

  return buildValidationResult(errors);
}

export function validateCierreRelevamiento(
  input: FinalizacionValidationInput,
): FinalizacionValidationResult {
  const errors: FinalizacionValidationError[] = [];

  validateCierreFields(input, errors);

  return buildValidationResult(errors);
}

export function validateFinalizacionRelevamiento(
  input: FinalizacionValidationInput,
): FinalizacionValidationResult {
  const errors: FinalizacionValidationError[] = [];

  validatePredioYResultado(input, errors);
  validateCierreFields(input, errors);

  if (input.resultadoVisita.resultado === 'ENTREVISTA_REALIZADA') {
    validateViviendaHogaresFields(input, errors);
    validatePersonasContactosFields(input, errors);
    validateEstadosHogaresFinalizacion(input, errors);
  }

  return buildValidationResult(errors);
}
