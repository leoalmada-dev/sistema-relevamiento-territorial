import { useEffect, useRef, useState } from 'react';
import { Accordion, Alert, Button, Card, Stack } from 'react-bootstrap';
import { ContactoFormCard } from './ContactoFormCard';
import { PersonaFormCard } from './PersonaFormCard';
import { ServiciosSaludSection } from './ServiciosSaludSection';
import { ConfirmActionModal } from '../../../shared/components/ConfirmActionModal';
import {
  crearContactoInicial,
  crearPersonaInicial,
  crearPersonasContactosHogarInicial,
  type ContactoFormState,
  type PersonaFormState,
  type PersonasContactosHogarState,
  type PersonasContactosPorHogarState,
} from '../types/personaContacto';
import {
  estadoHogarLabels,
  getEstadoHogar,
  hogarEstaEntrevistado,
  type HogarFormState,
} from '../types/viviendaHogar';

type PersonasContactosSectionProps = {
  hogares: HogarFormState[];
  personasContactosPorHogar: PersonasContactosPorHogarState;
  onChange: (nextState: PersonasContactosPorHogarState) => void;
};

type PersonasContactosConfirmAction =
  | { type: 'remove-persona'; hogarId: string; personaId: string }
  | { type: 'remove-contacto'; hogarId: string; contactoId: string };

function hasCompletedValue(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value);
  }

  return String(value ?? '').trim().length > 0;
}

function getHogarLabel(hogar: HogarFormState, index: number): string {
  return `Hogar ${hogar.numeroHogar || index + 1}`;
}

function getServiciosSaludResumen(datosHogar: PersonasContactosHogarState): string {
  const tieneServicios = Object.values(datosHogar.servicios).some(hasCompletedValue);
  const tieneSaludBasica =
    hasCompletedValue(datosHogar.salud.servicioAtencionMedica) &&
    hasCompletedValue(datosHogar.salud.tieneEmergenciaMovil);

  if (tieneServicios && tieneSaludBasica) {
    return 'con datos';
  }

  if (tieneServicios || tieneSaludBasica) {
    return 'parcial';
  }

  return 'pendiente';
}

function hasDatosPrevios(datosHogar: PersonasContactosHogarState): boolean {
  return Boolean(
    datosHogar.personas.length > 0 ||
      datosHogar.contactos.length > 0 ||
      Object.values(datosHogar.servicios).some(hasCompletedValue) ||
      Object.values(datosHogar.salud).some(hasCompletedValue),
  );
}

function normalizeAccordionEventKey(eventKey: unknown): string[] {
  if (Array.isArray(eventKey)) {
    return eventKey.map((key) => String(key)).filter(Boolean);
  }

  if (eventKey === null || eventKey === undefined || eventKey === '') {
    return [];
  }

  return [String(eventKey)];
}

export function PersonasContactosSection({
  hogares,
  personasContactosPorHogar,
  onChange,
}: PersonasContactosSectionProps) {
  const [activeHogarIds, setActiveHogarIds] = useState<string[]>(
    hogares[0]?.id ? [hogares[0].id] : [],
  );
  const [pendingConfirmAction, setPendingConfirmAction] =
    useState<PersonasContactosConfirmAction | null>(null);
  const hogarItemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const existingHogarIds = new Set(hogares.map((hogar) => hogar.id));

    setActiveHogarIds((currentActiveIds) => {
      const nextActiveIds = currentActiveIds.filter((hogarId) =>
        existingHogarIds.has(hogarId),
      );

      if (nextActiveIds.length === currentActiveIds.length) {
        return currentActiveIds;
      }

      return nextActiveIds;
    });
  }, [hogares]);

  const getDatosHogarById = (hogarId: string): PersonasContactosHogarState =>
    personasContactosPorHogar[hogarId] ?? crearPersonasContactosHogarInicial();

  const updateDatosHogarForHogar = (
    hogarId: string,
    nextDatosHogar: PersonasContactosHogarState,
  ) => {
    const hogarExists = hogares.some((hogar) => hogar.id === hogarId);

    if (!hogarExists) {
      return;
    }

    onChange({
      ...personasContactosPorHogar,
      [hogarId]: nextDatosHogar,
    });
  };

  const scrollToHogar = (hogarId: string) => {
    window.setTimeout(() => {
      hogarItemRefs.current[hogarId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 120);
  };

  const handleAccordionSelect = (eventKey: unknown) => {
    const nextActiveIds = normalizeAccordionEventKey(eventKey);
    const openedHogarId = nextActiveIds.find(
      (hogarId) => !activeHogarIds.includes(hogarId),
    );

    setActiveHogarIds(nextActiveIds);

    if (openedHogarId) {
      scrollToHogar(openedHogarId);
    }
  };

  const addPersona = (hogarId: string) => {
    const datosHogar = getDatosHogarById(hogarId);

    updateDatosHogarForHogar(hogarId, {
      ...datosHogar,
      personas: [
        ...datosHogar.personas,
        crearPersonaInicial(datosHogar.personas.length + 1),
      ],
    });
  };

  const updatePersona = (hogarId: string, updatedPersona: PersonaFormState) => {
    const datosHogar = getDatosHogarById(hogarId);

    updateDatosHogarForHogar(hogarId, {
      ...datosHogar,
      personas: datosHogar.personas.map((persona) =>
        persona.id === updatedPersona.id ? updatedPersona : persona,
      ),
    });
  };

  const requestRemovePersona = (hogarId: string, personaId: string) => {
    setPendingConfirmAction({
      type: 'remove-persona',
      hogarId,
      personaId,
    });
  };

  const removePersona = (hogarId: string, personaId: string) => {
    const datosHogar = getDatosHogarById(hogarId);

    updateDatosHogarForHogar(hogarId, {
      ...datosHogar,
      personas: datosHogar.personas.filter((persona) => persona.id !== personaId),
    });
  };

  const addContacto = (hogarId: string) => {
    const datosHogar = getDatosHogarById(hogarId);

    updateDatosHogarForHogar(hogarId, {
      ...datosHogar,
      contactos: [
        ...datosHogar.contactos,
        crearContactoInicial(datosHogar.contactos.length + 1),
      ],
    });
  };

  const updateContacto = (hogarId: string, updatedContacto: ContactoFormState) => {
    const datosHogar = getDatosHogarById(hogarId);

    updateDatosHogarForHogar(hogarId, {
      ...datosHogar,
      contactos: datosHogar.contactos.map((contacto) =>
        contacto.id === updatedContacto.id ? updatedContacto : contacto,
      ),
    });
  };

  const requestRemoveContacto = (hogarId: string, contactoId: string) => {
    setPendingConfirmAction({
      type: 'remove-contacto',
      hogarId,
      contactoId,
    });
  };

  const removeContacto = (hogarId: string, contactoId: string) => {
    const datosHogar = getDatosHogarById(hogarId);

    updateDatosHogarForHogar(hogarId, {
      ...datosHogar,
      contactos: datosHogar.contactos.filter((contacto) => contacto.id !== contactoId),
    });
  };

  const updateServicios = (
    hogarId: string,
    servicios: PersonasContactosHogarState['servicios'],
  ) => {
    const datosHogar = getDatosHogarById(hogarId);

    updateDatosHogarForHogar(hogarId, {
      ...datosHogar,
      servicios,
    });
  };

  const updateSalud = (hogarId: string, salud: PersonasContactosHogarState['salud']) => {
    const datosHogar = getDatosHogarById(hogarId);

    updateDatosHogarForHogar(hogarId, {
      ...datosHogar,
      salud,
    });
  };

  const confirmActionContent =
    pendingConfirmAction?.type === 'remove-persona'
      ? {
          title: 'Eliminar persona',
          message: '¿Eliminar esta persona? Esta acción no se puede deshacer.',
          confirmLabel: 'Eliminar persona',
        }
      : pendingConfirmAction?.type === 'remove-contacto'
        ? {
            title: 'Eliminar contacto',
            message: '¿Eliminar este contacto? Esta acción no se puede deshacer.',
            confirmLabel: 'Eliminar contacto',
          }
        : null;

  const cancelConfirmAction = () => {
    setPendingConfirmAction(null);
  };

  const confirmPendingAction = () => {
    if (!pendingConfirmAction) {
      return;
    }

    if (pendingConfirmAction.type === 'remove-persona') {
      removePersona(pendingConfirmAction.hogarId, pendingConfirmAction.personaId);
      setPendingConfirmAction(null);
      return;
    }

    removeContacto(pendingConfirmAction.hogarId, pendingConfirmAction.contactoId);
    setPendingConfirmAction(null);
  };

  if (hogares.length === 0) {
    return (
      <Alert variant="warning" className="mb-0">
        Para cargar personas y contactos primero debe existir al menos un hogar en la Sección 2.
      </Alert>
    );
  }

  return (
    <Stack gap={3}>
      <Card className="border-0 bg-light">
        <Card.Body>
          <h3 className="h5 mb-1">Datos por hogar</h3>
          <p className="text-secondary mb-0">
            Abra cada hogar para cargar sus personas, contactos, servicios y salud. La información
            queda asociada al hogar correspondiente.
          </p>
        </Card.Body>
      </Card>

      <Accordion alwaysOpen activeKey={activeHogarIds} onSelect={handleAccordionSelect}>
        <Stack gap={3}>
          {hogares.map((hogar, index) => {
            const hogarLabel = getHogarLabel(hogar, index);
            const estadoHogar = getEstadoHogar(hogar);
            const estaEntrevistado = hogarEstaEntrevistado(hogar);
            const datosHogar = getDatosHogarById(hogar.id);
            const cantidadPersonas = datosHogar.personas.length;
            const cantidadContactos = datosHogar.contactos.length;
            const tieneReferente = datosHogar.personas.some((persona) => persona.esReferente);
            const serviciosSaludResumen = getServiciosSaludResumen(datosHogar);
            const tieneDatosPrevios = hasDatosPrevios(datosHogar);

            return (
              <div
                key={hogar.id}
                ref={(element) => {
                  hogarItemRefs.current[hogar.id] = element;
                }}
              >
                <Accordion.Item
                  eventKey={hogar.id}
                  className="border rounded-3 overflow-hidden"
                >
                  <Accordion.Header>
                    <div className="d-flex flex-column gap-1 text-start">
                      <span className="fw-semibold">{hogarLabel}</span>
                      <span className="text-secondary small">
                        Estado: {estadoHogarLabels[estadoHogar]}
                      </span>

                      {estaEntrevistado ? (
                        <span className="text-secondary small">
                          Personas: {cantidadPersonas} · Referente:{' '}
                          {tieneReferente ? 'Sí' : 'No'} · Contactos: {cantidadContactos} ·
                          Servicios y salud: {serviciosSaludResumen}
                        </span>
                      ) : (
                        <span className="text-secondary small">
                          No se exigirán personas, referente, salud ni servicios mientras el hogar
                          no esté entrevistado.
                        </span>
                      )}
                    </div>
                  </Accordion.Header>

                  <Accordion.Body>
                    {!estaEntrevistado ? (
                      <Stack gap={3}>
                        <Alert variant="warning" className="mb-0">
                          <div className="fw-semibold">
                            {hogarLabel}: {estadoHogarLabels[estadoHogar]}
                          </div>
                          <div>
                            Este hogar queda guardado como no entrevistado. No se exigirán personas,
                            referente, salud ni servicios hasta retomarlo.
                          </div>

                          {hogar.observacionEstadoHogar ? (
                            <div className="mt-2">
                              <strong>Observación:</strong> {hogar.observacionEstadoHogar}
                            </div>
                          ) : null}
                        </Alert>

                        {tieneDatosPrevios ? (
                          <Alert variant="info" className="mb-0">
                            Hay datos cargados previamente para este hogar, pero no se validarán
                            mientras el estado no sea “Se procede a la entrevista”.
                          </Alert>
                        ) : null}
                      </Stack>
                    ) : (
                      <Stack gap={4}>
                        <Card className="border-0 bg-light">
                          <Card.Body>
                            <Stack gap={3}>
                              <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
                                <div>
                                  <h4 className="h6 mb-1">Personas</h4>
                                  <p className="text-secondary mb-0">
                                    Integrantes cargados para el {hogarLabel}.
                                  </p>
                                </div>

                                <div>
                                  <Button variant="primary" onClick={() => addPersona(hogar.id)}>
                                    Agregar persona
                                  </Button>
                                </div>
                              </div>

                              {datosHogar.personas.length > 0 ? (
                                <Stack gap={3}>
                                  {datosHogar.personas.map((persona, personaIndex) => (
                                    <PersonaFormCard
                                      key={persona.id}
                                      persona={persona}
                                      index={personaIndex}
                                      onChange={(updatedPersona) =>
                                        updatePersona(hogar.id, updatedPersona)
                                      }
                                      onRemove={(personaId) =>
                                        requestRemovePersona(hogar.id, personaId)
                                      }
                                    />
                                  ))}
                                </Stack>
                              ) : (
                                <Alert variant="secondary" className="mb-0">
                                  Todavía no hay personas cargadas para el {hogarLabel}.
                                </Alert>
                              )}
                            </Stack>
                          </Card.Body>
                        </Card>

                        <Card className="border-0 bg-light">
                          <Card.Body>
                            <Stack gap={3}>
                              <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
                                <div>
                                  <h4 className="h6 mb-1">Contactos</h4>
                                  <p className="text-secondary mb-0">
                                    Contactos cargados para el {hogarLabel}. Objetivo inicial:
                                    hasta dos contactos.
                                  </p>
                                </div>

                                <div>
                                  <Button variant="primary" onClick={() => addContacto(hogar.id)}>
                                    Agregar contacto
                                  </Button>
                                </div>
                              </div>

                              {datosHogar.contactos.length > 2 ? (
                                <Alert variant="warning" className="mb-0">
                                  Hay más de dos contactos cargados para el {hogarLabel}. No se
                                  bloquea en esta etapa, pero el objetivo operativo inicial son dos
                                  contactos por hogar.
                                </Alert>
                              ) : (
                                <Alert variant="info" className="mb-0">
                                  Contactos cargados para el {hogarLabel}:{' '}
                                  <strong>{datosHogar.contactos.length}</strong>. Objetivo inicial:
                                  hasta dos.
                                </Alert>
                              )}

                              {datosHogar.contactos.length > 0 ? (
                                <Stack gap={3}>
                                  {datosHogar.contactos.map((contacto, contactoIndex) => (
                                    <ContactoFormCard
                                      key={contacto.id}
                                      contacto={contacto}
                                      index={contactoIndex}
                                      onChange={(updatedContacto) =>
                                        updateContacto(hogar.id, updatedContacto)
                                      }
                                      onRemove={(contactoId) =>
                                        requestRemoveContacto(hogar.id, contactoId)
                                      }
                                    />
                                  ))}
                                </Stack>
                              ) : (
                                <Alert variant="secondary" className="mb-0">
                                  Todavía no hay contactos cargados para el {hogarLabel}.
                                </Alert>
                              )}
                            </Stack>
                          </Card.Body>
                        </Card>

                        <Card className="border-0 bg-light">
                          <Card.Body>
                            <Stack gap={3}>
                              <div>
                                <h4 className="h6 mb-1">Servicios y salud</h4>
                                <p className="text-secondary mb-0">
                                  Datos asociados al {hogarLabel}.
                                </p>
                              </div>

                              <ServiciosSaludSection
                                hogarLabel={hogarLabel}
                                servicios={datosHogar.servicios}
                                salud={datosHogar.salud}
                                onServiciosChange={(servicios) =>
                                  updateServicios(hogar.id, servicios)
                                }
                                onSaludChange={(salud) => updateSalud(hogar.id, salud)}
                              />
                            </Stack>
                          </Card.Body>
                        </Card>
                      </Stack>
                    )}
                  </Accordion.Body>
                </Accordion.Item>
              </div>
            );
          })}
        </Stack>
      </Accordion>

      <ConfirmActionModal
        show={Boolean(confirmActionContent)}
        title={confirmActionContent?.title ?? ''}
        message={confirmActionContent?.message ?? ''}
        confirmLabel={confirmActionContent?.confirmLabel}
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={confirmPendingAction}
        onCancel={cancelConfirmAction}
      />
    </Stack>
  );
}
