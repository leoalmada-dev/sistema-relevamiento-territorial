import { useMemo, useState } from 'react';
import { Alert, Badge, Card, Col, Form, ListGroup, Row, Stack } from 'react-bootstrap';
import {
  getCuadrantesByZona,
  getPredioById,
  getPrediosByCuadrante,
  getZonas,
} from '../services/territorioService';
import type { PredioDetalle } from '../types/territorio';

type TerritorialSelectorProps = {
  selectedPredioId: string;
  onPredioSelected: (predioId: string, predioDetalle: PredioDetalle | null) => void;
};

export function TerritorialSelector({
  selectedPredioId,
  onPredioSelected,
}: TerritorialSelectorProps) {
  const zonas = useMemo(() => getZonas(), []);
  const [zonaId, setZonaId] = useState('');
  const [cuadranteId, setCuadranteId] = useState('');

  const cuadrantes = useMemo(() => {
    if (!zonaId) {
      return [];
    }

    return getCuadrantesByZona(zonaId);
  }, [zonaId]);

  const predios = useMemo(() => {
    if (!cuadranteId) {
      return [];
    }

    return getPrediosByCuadrante(cuadranteId);
  }, [cuadranteId]);

  const predioDetalle = useMemo(() => {
    if (!selectedPredioId) {
      return null;
    }

    return getPredioById(selectedPredioId);
  }, [selectedPredioId]);

  const handleZonaChange = (nextZonaId: string) => {
    setZonaId(nextZonaId);
    setCuadranteId('');
    onPredioSelected('', null);
  };

  const handleCuadranteChange = (nextCuadranteId: string) => {
    setCuadranteId(nextCuadranteId);
    onPredioSelected('', null);
  };

  const handlePredioChange = (nextPredioId: string) => {
    const nextPredioDetalle = nextPredioId ? getPredioById(nextPredioId) : null;
    onPredioSelected(nextPredioId, nextPredioDetalle);
  };

  return (
    <Card className="border-0 bg-light">
      <Card.Body>
        <Stack gap={3}>
          <div>
            <Badge bg="primary" className="mb-2">
              Selección territorial mock
            </Badge>
            <h3 className="h5 mb-1">Zona, cuadrante y predio</h3>
            <p className="text-secondary mb-0">
              Datos locales temporales. No hay conexión con backend en esta etapa.
            </p>
          </div>

          <Row className="g-3">
            <Col md={4}>
              <Form.Group controlId="zona">
                <Form.Label>Zona</Form.Label>
                <Form.Select
                  value={zonaId}
                  onChange={(event) => handleZonaChange(event.target.value)}
                >
                  <option value="">Seleccionar zona</option>
                  {zonas.map((zona) => (
                    <option key={zona.id} value={zona.id}>
                      {zona.nombre}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group controlId="cuadrante">
                <Form.Label>Cuadrante</Form.Label>
                <Form.Select
                  value={cuadranteId}
                  onChange={(event) => handleCuadranteChange(event.target.value)}
                  disabled={!zonaId}
                >
                  <option value="">Seleccionar cuadrante</option>
                  {cuadrantes.map((cuadrante) => (
                    <option key={cuadrante.id} value={cuadrante.id}>
                      {cuadrante.nombre}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group controlId="predio">
                <Form.Label>Predio</Form.Label>
                <Form.Select
                  value={selectedPredioId}
                  onChange={(event) => handlePredioChange(event.target.value)}
                  disabled={!cuadranteId}
                >
                  <option value="">Seleccionar predio</option>
                  {predios.map((predio) => (
                    <option key={predio.id} value={predio.id}>
                      {predio.descripcion}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {predioDetalle ? (
            <Card>
              <Card.Header className="bg-white">
                <strong>Datos precargados del predio seleccionado</strong>
              </Card.Header>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <strong>Calle:</strong> {predioDetalle.calle}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Número teórico de puerta:</strong> {predioDetalle.numeroPuertaTeorico}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Padrón:</strong> {predioDetalle.padron}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Manzana:</strong> {predioDetalle.manzana}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Lote:</strong> {predioDetalle.lote}
                </ListGroup.Item>
              </ListGroup>
            </Card>
          ) : (
            <Alert variant="secondary" className="mb-0">
              Seleccioná zona, cuadrante y predio para ver los datos precargados disponibles.
            </Alert>
          )}
        </Stack>
      </Card.Body>
    </Card>
  );
}
