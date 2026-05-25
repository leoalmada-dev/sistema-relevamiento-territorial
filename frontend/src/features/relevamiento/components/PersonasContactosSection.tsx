import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Row, Stack } from 'react-bootstrap';
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
import type { HogarFormState } from '../types/viviendaHogar';

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

export function PersonasContactosSection({
  hogares,
  personasContactosPorHogar,
  onChange,
}: PersonasContactosSectionProps) {
  const [selectedHogarId, setSelectedHogarId] = useState('');
  const [pendingConfirmAction, setPendingConfirmAction] =
    useState<PersonasContactosConfirmAction | null>(null);

  useEffect(() => {
    if (hogares.length === 0) {
      setSelectedHogarId('');
      return;
    }

    const selectedExists = hogares.some((hogar) => hogar.id === selectedHogarId);

    if (!selectedExists) {
      setSelectedHogarId(hogares[0].id);
    }
  }, [hogares, selectedHogarId]);

  const selectedHogarIndex = useMemo(
    () => hogares.findIndex((hogar) => hogar.id === selectedHogarId),
    [hogares, selectedHogarId],
  );

  const selectedHogar = selectedHogarIndex >= 0 ? hogares[selectedHogarIndex] : null;

  const selectedHogarLabel = selectedHogar
    ? getHogarLabel(selectedHogar, selectedHogarIndex)
    : 'hogar seleccionado';

  const selectedHogarPosition =
    selectedHogarIndex >= 0 ? `${selectedHogarIndex + 1} de ${hogares.length}` : '';

  const getDatosHogarById = (hogarId: string): PersonasContactosHogarState =>
    personasContactosPorHogar[hogarId] ?? crearPersonasContactosHogarInicial();

  const datosHogar = useMemo<PersonasContactosHogarState>(() => {
    if (!selectedHogarId) {
      return crearPersonasContactosHogarInicial();
    }

    return getDatosHogarById(selectedHogarId);
  }, [personasContactosPorHogar, selectedHogarId]);

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

  const updateDatosHogar = (nextDatosHogar: PersonasContactosHogarState) => {
    if (!selectedHogarId) {
      return;
    }

    updateDatosHogarForHogar(selectedHogarId, nextDatosHogar);
  };

  const addPersona = () => {
    updateDatosHogar({
      ...datosHogar,
      personas: [
        ...datosHogar.personas,
        crearPersonaInicial(datosHogar.personas.length + 1),
      ],
    });
  };

  const updatePersona = (updatedPersona: PersonaFormState) => {
    updateDatosHogar({
      ...datosHogar,
      personas: datosHogar.personas.map((persona) =>
        persona.id === updatedPersona.id ? updatedPersona : persona,
      ),
    });
  };

  const requestRemovePersona = (personaId: string) => {
    if (!selectedHogarId) {
      return;
    }

    setPendingConfirmAction({
      type: 'remove-persona',
      hogarId: selectedHogarId,
      personaId,
    });
  };

  const removePersona = (hogarId: string, personaId: string) => {
    const targetDatosHogar = getDatosHogarById(hogarId);

    updateDatosHogarForHogar(hogarId, {
      ...targetDatosHogar,
      personas: targetDatosHogar.personas.filter((persona) => persona.id !== personaId),
    });
  };

  const addContacto = () => {
    updateDatosHogar({
      ...datosHogar,
      contactos: [
        ...datosHogar.contactos,
        crearContactoInicial(datosHogar.contactos.length + 1),
      ],
    });
  };

  const updateContacto = (updatedContacto: ContactoFormState) => {
    updateDatosHogar({
      ...datosHogar,
      contactos: datosHogar.contactos.map((contacto) =>
        contacto.id === updatedContacto.id ? updatedContacto : contacto,
      ),
    });
  };

  const requestRemoveContacto = (contactoId: string) => {
    if (!selectedHogarId) {
      return;
    }

    setPendingConfirmAction({
      type: 'remove-contacto',
      hogarId: selectedHogarId,
      contactoId,
    });
  };

  const removeContacto = (hogarId: string, contactoId: string) => {
    const targetDatosHogar = getDatosHogarById(hogarId);

    updateDatosHogarForHogar(hogarId, {
      ...targetDatosHogar,
      contactos: targetDatosHogar.contactos.filter(
        (contacto) => contacto.id !== contactoId,
      ),
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

  const updateServicios = (servicios: PersonasContactosHogarState['servicios']) => {
    updateDatosHogar({
      ...datosHogar,
      servicios,
    });
  };

  const updateSalud = (salud: PersonasContactosHogarState['salud']) => {
    updateDatosHogar({
      ...datosHogar,
      salud,
    });
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
          <Stack gap={3}>
            <div>
              <Badge bg="primary" className="mb-2">
                Hogares
              </Badge>
              <h3 className="h5 mb-1">Seleccione el hogar a completar</h3>
              <p className="text-secondary mb-0">
                Toque un hogar para cargar sus personas, contactos, servicios y salud.
              </p>
            </div>

            <Row className="g-3">
              {hogares.map((hogar, index) => {
                const hogarLabel = getHogarLabel(hogar, index);
                const hogarDatos = getDatosHogarById(hogar.id);
                const isSelected = hogar.id === selectedHogarId;
                const cantidadPersonas = hogarDatos.personas.length;
                const cantidadContactos = hogarDatos.contactos.length;
                const tieneReferente = hogarDatos.personas.some((persona) => persona.esReferente);
                const tieneServicios = Object.values(hogarDatos.servicios).some(hasCompletedValue);
                const tieneSaludBasica =
                  hasCompletedValue(hogarDatos.salud.servicioAtencionMedica) &&
                  hasCompletedValue(hogarDatos.salud.tieneEmergenciaMovil);

                return (
                  <Col md={6} xl={4} key={hogar.id}>
                    <Button
                      type="button"
                      variant={isSelected ? 'primary' : 'outline-primary'}
                      className="w-100 h-100 text-start p-3"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedHogarId(hogar.id)}
                    >
                      <Stack gap={2}>
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <span className="fw-semibold">{hogarLabel}</span>
                          {isSelected ? (
                            <Badge bg="light" text="dark">
                              Editando
                            </Badge>
                          ) : (
                            <Badge bg="secondary">Seleccionar</Badge>
                          )}
                        </div>

                        <div className="d-flex flex-wrap gap-2">
                          <Badge bg={isSelected ? 'light' : 'secondary'} text={isSelected ? 'dark' : undefined}>
                            {cantidadPersonas} {cantidadPersonas === 1 ? 'persona' : 'personas'}
                          </Badge>
                          <Badge bg={tieneReferente ? 'success' : 'warning'} text={tieneReferente ? undefined : 'dark'}>
                            Referente {tieneReferente ? 'sí' : 'no'}
                          </Badge>
                          <Badge bg={isSelected ? 'light' : 'secondary'} text={isSelected ? 'dark' : undefined}>
                            {cantidadContactos} {cantidadContactos === 1 ? 'contacto' : 'contactos'}
                          </Badge>
                          <Badge bg={tieneSaludBasica ? 'success' : 'warning'} text={tieneSaludBasica ? undefined : 'dark'}>
                            Salud {tieneSaludBasica ? 'cargada' : 'pendiente'}
                          </Badge>
                          <Badge bg={tieneServicios ? 'success' : 'warning'} text={tieneServicios ? undefined : 'dark'}>
                            Servicios {tieneServicios ? 'con datos' : 'pendientes'}
                          </Badge>
                        </div>
                      </Stack>
                    </Button>
                  </Col>
                );
              })}
            </Row>

            <Alert variant="info" className="mb-0">
              {selectedHogar ? (
                <>
                  Editando <strong>{selectedHogarLabel}</strong>
                  {selectedHogarPosition ? (
                    <>
                      {' '}
                      (<strong>{selectedHogarPosition}</strong>)
                    </>
                  ) : null}
                  . Todo lo que cargue debajo quedará asociado a este hogar.
                </>
              ) : (
                'Seleccione un hogar para completar.'
              )}
            </Alert>
          </Stack>
        </Card.Body>
      </Card>

      <Card className="border-0 bg-light">
        <Card.Body>
          <Stack gap={3}>
            <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
              <div>
                <Badge bg="primary" className="mb-2">
                  Personas
                </Badge>
                <h3 className="h5 mb-1">Personas del {selectedHogarLabel}</h3>
                <p className="text-secondary mb-0">
                  Integrantes asociados al {selectedHogarLabel}.
                </p>
              </div>

              <div>
                <Button variant="primary" onClick={addPersona} disabled={!selectedHogar}>
                  Agregar persona al {selectedHogarLabel}
                </Button>
              </div>
            </div>

            {datosHogar.personas.length > 0 ? (
              <Stack gap={3}>
                {datosHogar.personas.map((persona, index) => (
                  <PersonaFormCard
                    key={persona.id}
                    persona={persona}
                    index={index}
                    onChange={updatePersona}
                    onRemove={requestRemovePersona}
                  />
                ))}
              </Stack>
            ) : (
              <Alert variant="secondary" className="mb-0">
                Todavía no hay personas cargadas para el {selectedHogarLabel}.
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
                <Badge bg="primary" className="mb-2">
                  Contactos
                </Badge>
                <h3 className="h5 mb-1">Contactos del {selectedHogarLabel}</h3>
                <p className="text-secondary mb-0">
                  Objetivo inicial: cargar en lo posible hasta dos contactos para el{' '}
                  {selectedHogarLabel}.
                </p>
              </div>

              <div>
                <Button variant="primary" onClick={addContacto} disabled={!selectedHogar}>
                  Agregar contacto al {selectedHogarLabel}
                </Button>
              </div>
            </div>

            {datosHogar.contactos.length > 2 ? (
              <Alert variant="warning" className="mb-0">
                Hay más de dos contactos cargados para el {selectedHogarLabel}. No se bloquea en
                esta etapa, pero el objetivo operativo inicial son dos contactos por hogar.
              </Alert>
            ) : (
              <Alert variant="info" className="mb-0">
                Contactos cargados para el {selectedHogarLabel}:{' '}
                <strong>{datosHogar.contactos.length}</strong>. Objetivo inicial: hasta dos.
              </Alert>
            )}

            {datosHogar.contactos.length > 0 ? (
              <Stack gap={3}>
                {datosHogar.contactos.map((contacto, index) => (
                  <ContactoFormCard
                    key={contacto.id}
                    contacto={contacto}
                    index={index}
                    onChange={updateContacto}
                    onRemove={requestRemoveContacto}
                  />
                ))}
              </Stack>
            ) : (
              <Alert variant="secondary" className="mb-0">
                Todavía no hay contactos cargados para el {selectedHogarLabel}.
              </Alert>
            )}
          </Stack>
        </Card.Body>
      </Card>

      <Stack gap={3}>
        <div>
          <Badge bg="primary" className="mb-2">
            Servicios y salud
          </Badge>
          <h3 className="h5 mb-1">Servicios y salud del {selectedHogarLabel}</h3>
          <p className="text-secondary mb-0">
            Los datos de servicios y salud que complete debajo se guardan para el{' '}
            {selectedHogarLabel}.
          </p>
        </div>

        <ServiciosSaludSection
          servicios={datosHogar.servicios}
          salud={datosHogar.salud}
          onServiciosChange={updateServicios}
          onSaludChange={updateSalud}
        />
      </Stack>

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
