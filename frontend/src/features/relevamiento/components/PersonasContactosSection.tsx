import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Row, Stack } from 'react-bootstrap';
import { ContactoFormCard } from './ContactoFormCard';
import { PersonaFormCard } from './PersonaFormCard';
import { ServiciosSaludSection } from './ServiciosSaludSection';
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

export function PersonasContactosSection({
  hogares,
  personasContactosPorHogar,
  onChange,
}: PersonasContactosSectionProps) {
  const [selectedHogarId, setSelectedHogarId] = useState('');

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

  const selectedHogar = useMemo(
    () => hogares.find((hogar) => hogar.id === selectedHogarId) ?? null,
    [hogares, selectedHogarId],
  );

  const datosHogar = useMemo<PersonasContactosHogarState>(() => {
    if (!selectedHogarId) {
      return crearPersonasContactosHogarInicial();
    }

    return personasContactosPorHogar[selectedHogarId] ?? crearPersonasContactosHogarInicial();
  }, [personasContactosPorHogar, selectedHogarId]);

  const updateDatosHogar = (nextDatosHogar: PersonasContactosHogarState) => {
    if (!selectedHogarId) {
      return;
    }

    onChange({
      ...personasContactosPorHogar,
      [selectedHogarId]: nextDatosHogar,
    });
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

  const removePersona = (personaId: string) => {
    updateDatosHogar({
      ...datosHogar,
      personas: datosHogar.personas.filter((persona) => persona.id !== personaId),
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

  const removeContacto = (contactoId: string) => {
    updateDatosHogar({
      ...datosHogar,
      contactos: datosHogar.contactos.filter((contacto) => contacto.id !== contactoId),
    });
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
                Hogar seleccionado
              </Badge>
              <h3 className="h5 mb-1">Personas y contactos por hogar</h3>
              <p className="text-secondary mb-0">
                Seleccione el hogar para cargar sus integrantes, contactos, servicios y salud.
              </p>
            </div>

            <Row className="g-3">
              <Col md={6}>
                <Form.Group controlId="hogar-personas-contactos">
                  <Form.Label>Hogar a completar</Form.Label>
                  <Form.Select
                    value={selectedHogarId}
                    onChange={(event) => setSelectedHogarId(event.target.value)}
                  >
                    {hogares.map((hogar, index) => (
                      <option key={hogar.id} value={hogar.id}>
                        Hogar {hogar.numeroHogar || index + 1}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Alert variant="info" className="mb-0">
                  {selectedHogar ? (
                    <>
                      Completando datos del <strong>Hogar {selectedHogar.numeroHogar}</strong>.
                    </>
                  ) : (
                    'Seleccioná un hogar para completar.'
                  )}
                </Alert>
              </Col>
            </Row>
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
                <h3 className="h5 mb-1">Integrantes del hogar</h3>
                <p className="text-secondary mb-0">
                  Personas integrantes del hogar seleccionado.
                </p>
              </div>

              <div>
                <Button variant="primary" onClick={addPersona}>
                  Agregar persona
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
                    onRemove={removePersona}
                  />
                ))}
              </Stack>
            ) : (
              <Alert variant="secondary" className="mb-0">
                Todavía no hay personas cargadas para este hogar.
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
                <h3 className="h5 mb-1">Contactos del hogar</h3>
                <p className="text-secondary mb-0">
                  Objetivo inicial: cargar en lo posible hasta dos contactos por hogar.
                </p>
              </div>

              <div>
                <Button variant="primary" onClick={addContacto}>
                  Agregar contacto
                </Button>
              </div>
            </div>

            {datosHogar.contactos.length > 2 ? (
              <Alert variant="warning" className="mb-0">
                Hay más de dos contactos cargados. No se bloquea en esta etapa, pero el
                objetivo operativo inicial son dos contactos por hogar.
              </Alert>
            ) : (
              <Alert variant="info" className="mb-0">
                Contactos cargados para este hogar: <strong>{datosHogar.contactos.length}</strong>.
                Objetivo inicial: hasta dos.
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
                    onRemove={removeContacto}
                  />
                ))}
              </Stack>
            ) : (
              <Alert variant="secondary" className="mb-0">
                Todavía no hay contactos cargados para este hogar.
              </Alert>
            )}
          </Stack>
        </Card.Body>
      </Card>

      <ServiciosSaludSection
        servicios={datosHogar.servicios}
        salud={datosHogar.salud}
        onServiciosChange={updateServicios}
        onSaludChange={updateSalud}
      />
    </Stack>
  );
}
