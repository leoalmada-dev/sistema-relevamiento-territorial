import { Alert, Badge, Card, Col, ListGroup, Row, Stack } from 'react-bootstrap';
import type { CierreRelevamientoFormState } from '../types/cierreRelevamiento';
import type { PersonasContactosPorHogarState } from '../types/personaContacto';
import type { ResultadoVisitaFormState } from '../types/resultadoVisita';
import type { PredioDetalle } from '../types/territorio';
import {
  estadoHogarLabels,
  getEstadoHogar,
  hogarEstaEntrevistado,
  type HogarFormState,
  type ViviendaFormState,
} from '../types/viviendaHogar';

const resultadoVisitaLabels: Record<string, string> = {
  ENTREVISTA_REALIZADA: 'Se procede a la entrevista',
  SE_NIEGA: 'Se niega a brindar información',
  NO_SE_ENCUENTRA: 'No se encuentra',
};

const siNoNoSabeLabels: Record<string, string> = {
  SI: 'Sí',
  NO: 'No',
  NO_SABE: 'No sabe',
};

const vinculoEntreHogaresLabels: Record<string, string> = {
  FAMILIARES: 'Familiares',
  UNIDADES_INDEPENDIENTES: 'Unidades independientes',
  OTROS: 'Otros',
};

const formaAccesoLabels: Record<string, string> = {
  VIVIA_ASENTAMIENTO: 'Vivía cuando era asentamiento',
  COMPRA_INFORMAL: 'Compra informal',
  ALQUILER: 'Alquiler',
  PRESTAMO_TEMPORAL: 'Préstamo temporal',
  ME_LO_DIERON: 'Me lo dieron',
  REALOJO_CANDELARIA: 'Realojo Candelaria',
  OTRO: 'Otro',
};

const atencionMedicaLabels: Record<string, string> = {
  ASSE: 'ASSE',
  PRIVADO: 'Privado',
  AMBOS: 'Ambos',
  NINGUNO: 'Ninguno',
  NO_SABE: 'No sabe',
};

function formatLabel(
  value: string | undefined,
  labels: Record<string, string>,
  fallback = 'Sin dato',
) {
  if (!value) {
    return fallback;
  }

  return labels[value] ?? fallback;
}

type ResumenRelevamientoProps = {
  selectedPredio: PredioDetalle | null;
  resultadoVisita: ResultadoVisitaFormState;
  vivienda: ViviendaFormState;
  hogares: HogarFormState[];
  personasContactosPorHogar: PersonasContactosPorHogarState;
  cierre: CierreRelevamientoFormState;
};

export function ResumenRelevamiento({
  selectedPredio,
  resultadoVisita,
  vivienda,
  hogares,
  personasContactosPorHogar,
  cierre,
}: ResumenRelevamientoProps) {
  return (
    <Stack gap={3}>
      <Card>
        <Card.Header className="bg-white">
          <strong>Resumen territorial y visita</strong>
        </Card.Header>
        <ListGroup variant="flush">
          <ListGroup.Item>
            <div className="d-flex flex-column gap-1">
              <div>
                <strong>Predio:</strong>{' '}
                {selectedPredio
                  ? `${selectedPredio.calle} ${selectedPredio.numeroPuertaTeorico}`
                  : 'Sin predio seleccionado'}
              </div>
              {selectedPredio?.origen === 'manual' ? (
                <span className="text-secondary small">Predio ingresado manualmente</span>
              ) : null}
            </div>
          </ListGroup.Item>
          <ListGroup.Item>
            <strong>Resultado de visita:</strong>{' '}
            {formatLabel(resultadoVisita.resultado, resultadoVisitaLabels, 'Sin resultado seleccionado')}
          </ListGroup.Item>
        </ListGroup>
      </Card>

      <Card>
        <Card.Header className="bg-white">
          <strong>Vivienda</strong>
        </Card.Header>
        <ListGroup variant="flush">
          <ListGroup.Item>
            <strong>Cantidad de hogares declarada:</strong>{' '}
            {vivienda.cantidadHogaresDeclarada || 'Sin dato'}
          </ListGroup.Item>
          <ListGroup.Item>
            <strong>Vínculo entre hogares:</strong>{' '}
            {formatLabel(vivienda.vinculoEntreHogares, vinculoEntreHogaresLabels)}
          </ListGroup.Item>
          <ListGroup.Item>
            <strong>Observaciones de vivienda:</strong>{' '}
            {vivienda.observacionesVivienda || 'Sin observaciones'}
          </ListGroup.Item>
        </ListGroup>
      </Card>

      <Card>
        <Card.Header className="bg-white">
          <strong>Hogares cargados</strong>
        </Card.Header>
        <Card.Body>
          {hogares.length > 0 ? (
            <Stack gap={3}>
              {hogares.map((hogar, index) => {
                const datosHogar = personasContactosPorHogar[hogar.id];
                const personas = datosHogar?.personas ?? [];
                const contactos = datosHogar?.contactos ?? [];
                const servicios = datosHogar?.servicios;
                const salud = datosHogar?.salud;
                const personasConVinculoBarrio = personas.filter(
                  (persona) => persona.vinculoBarrioFamilia,
                );
  const estadoHogar = getEstadoHogar(hogar);
  const estaEntrevistado = hogarEstaEntrevistado(hogar);

                return (
                  <Card key={hogar.id} className="border">
                    <Card.Body>
                      <Row className="g-3">
                        <Col md={4}>
                          <Badge bg="secondary" className="mb-2">
                            Hogar {hogar.numeroHogar || index + 1}
                          </Badge>
                          <p className="mb-1">
                            <strong>Tiempo en barrio:</strong>{' '}
                            {hogar.tiempoViveBarrio || 'Sin dato'}
                          </p>
                          <p className="mb-1">
                            <strong>Titular vivienda:</strong>{' '}
                            {hogar.titularVivienda || 'Sin dato'}
                          </p>
                          <p className="mb-0">
                            <strong>Forma de acceso:</strong>{' '}
                            {formatLabel(hogar.formaAccesoVivienda, formaAccesoLabels)}
                          </p>
                        </Col>

                        <Col md={4}>
                          <p className="mb-1">
                            <strong>Personas:</strong> {personas.length}
                          </p>
                          <p className="mb-1">
                            <strong>Contactos:</strong> {contactos.length}
                          </p>
                          <p className="mb-0">
                            <strong>Referente:</strong>{' '}
                            {personas.find((persona) => persona.esReferente)
                              ? `${personas.find((persona) => persona.esReferente)?.nombre} ${personas.find((persona) => persona.esReferente)?.apellido}`
                              : 'Sin referente marcado'}
                          </p>
                        </Col>

                        <Col md={4}>
                          <p className="mb-1">
                            <strong>Luz / agua:</strong>{' '}
                            {formatLabel(servicios?.tieneLuzAgua, siNoNoSabeLabels)}
                          </p>
                          <p className="mb-1">
                            <strong>Cable / internet:</strong>{' '}
                            {formatLabel(servicios?.tieneCableInternet, siNoNoSabeLabels)}
                          </p>
                          <p className="mb-0">
                            <strong>Atención médica:</strong>{' '}
                            {formatLabel(salud?.servicioAtencionMedica, atencionMedicaLabels)}
                          </p>
                        </Col>
                      </Row>

                      {!estaEntrevistado ? (
            <Alert variant="warning" className="mt-3 mb-0">
              Este hogar quedó registrado como no entrevistado. Los datos de
              personas, referente, salud y servicios no son obligatorios hasta
              retomarlo.
            </Alert>
          ) : null}

          {personasConVinculoBarrio.length > 0 ? (
                        <div className="border-top pt-3 mt-3">
                          <strong>Vínculo con el barrio / familia en la zona:</strong>
                          <ul className="mb-0 mt-2">
                            {personasConVinculoBarrio.map((persona) => (
                              <li key={persona.id}>
                                {[persona.nombre, persona.apellido].filter(Boolean).join(' ') ||
                                  'Persona sin nombre'}
                                : {persona.vinculoBarrioFamilia}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </Card.Body>
                  </Card>
                );
              })}
            </Stack>
          ) : (
            <Alert variant="secondary" className="mb-0">
              Todavía no hay hogares cargados.
            </Alert>
          )}
        </Card.Body>
      </Card>

      <Card>
        <Card.Header className="bg-white">
          <strong>Observaciones generales y ubicación a confirmar</strong>
        </Card.Header>
        <ListGroup variant="flush">
          <ListGroup.Item>
            <strong>Observaciones generales:</strong>{' '}
            {cierre.observacionesGenerales || 'Sin observaciones'}
          </ListGroup.Item>
          <ListGroup.Item>
            <strong>Latitud:</strong> {cierre.latitud || 'Sin dato'}
          </ListGroup.Item>
          <ListGroup.Item>
            <strong>Longitud:</strong> {cierre.longitud || 'Sin dato'}
          </ListGroup.Item>
          <ListGroup.Item>
            <strong>Hora de captura:</strong> {cierre.horaCaptura || 'Sin dato'}
          </ListGroup.Item>
        </ListGroup>
      </Card>
    </Stack>
  );
}
