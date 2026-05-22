import type { CierreRelevamientoFormState } from '../types/cierreRelevamiento';
import type { PersonasContactosPorHogarState } from '../types/personaContacto';
import type { ResultadoVisitaFormState } from '../types/resultadoVisita';
import type { CuadranteOption, PredioDetalle } from '../types/territorio';
import type { HogarFormState, ViviendaFormState } from '../types/viviendaHogar';

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

function isBlank(value: string) {
  return value.trim() === '';
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

function validatePredioResultadoYCierre(
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
  }

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

function validateEntrevistaRealizada(
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
    }

    if (cantidadDeclarada !== input.hogares.length) {
      addError(
        errors,
        'hogares',
        'La cantidad de hogares declarada debe coincidir con los hogares cargados.',
      );
    }
  }

  if (isBlank(input.vivienda.vinculoEntreHogares)) {
    addError(
      errors,
      'vivienda.vinculoEntreHogares',
      'Vivienda: seleccione el vínculo entre hogares.',
    );
  }

  const documentos = new Map<string, number>();

  input.hogares.forEach((hogar, hogarIndex) => {
    const hogarLabel = `Hogar ${hogarIndex + 1}`;

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

    const datosHogar = input.personasContactosPorHogar[hogar.id];
    const personas = datosHogar?.personas ?? [];

    if (personas.length === 0) {
      addError(
        errors,
        `hogares.${hogarIndex}.personas`,
        `${hogarLabel}: debe tener al menos una persona cargada.`,
      );
    }

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

export function validateFinalizacionRelevamiento(
  input: FinalizacionValidationInput,
): FinalizacionValidationResult {
  const errors: FinalizacionValidationError[] = [];

  validatePredioResultadoYCierre(input, errors);

  if (input.resultadoVisita.resultado === 'ENTREVISTA_REALIZADA') {
    validateEntrevistaRealizada(input, errors);
  } else if (
    input.resultadoVisita.resultado !== '' &&
    input.resultadoVisita.resultado !== 'SE_NIEGA' &&
    input.resultadoVisita.resultado !== 'NO_SE_ENCUENTRA'
  ) {
    addError(
      errors,
      'resultadoVisita.resultado',
      'Seleccione un resultado de visita válido.',
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
