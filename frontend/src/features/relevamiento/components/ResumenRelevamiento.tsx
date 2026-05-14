import { Alert, Badge, Card, Col, ListGroup, Row, Stack } from 'react-bootstrap';
import type { CierreRelevamientoFormState } from '../types/cierreRelevamiento';
import type { PersonasContactosPorHogarState } from '../types/personaContacto';
import type { ResultadoVisitaFormState } from '../types/resultadoVisita';
import type { PredioDetalle } from '../types/territorio';
import type { HogarFormState, ViviendaFormState } from '../types/viviendaHogar';

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
            <strong>Predio:</strong>{' '}
            {selectedPredio
              ? `${selectedPredio.calle} ${selectedPredio.numeroPuertaTeorico}`
              : 'Sin predio seleccionado'}
          </ListGroup.Item>
          <ListGroup.Item>
            <strong>Padrón:</strong> {selectedPredio?.padron || 'Sin dato'}
          </ListGroup.Item>
          <ListGroup.Item>
            <strong>Manzana:</strong> {selectedPredio?.manzana || 'Sin dato'}
          </ListGroup.Item>
          <ListGroup.Item>
            <strong>Lote:</strong> {selectedPredio?.lote || 'Sin dato'}
          </ListGroup.Item>
          <ListGroup.Item>
            <strong>Resultado de visita:</strong>{' '}
            {resultadoVisita.resultado || 'Sin resultado seleccionado'}
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
            {vivienda.vinculoEntreHogares || 'Sin dato'}
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
                            {hogar.formaAccesoVivienda || 'Sin dato'}
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
                            {servicios?.tieneLuzAgua || 'Sin dato'}
                          </p>
                          <p className="mb-1">
                            <strong>Cable / internet:</strong>{' '}
                            {servicios?.tieneCableInternet || 'Sin dato'}
                          </p>
                          <p className="mb-0">
                            <strong>Atención médica:</strong>{' '}
                            {salud?.servicioAtencionMedica || 'Sin dato'}
                          </p>
                        </Col>
                      </Row>
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
