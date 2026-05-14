import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Card, Col, Form, Row, Spinner, Stack } from 'react-bootstrap';
import {
  getCuadrantesByZona,
  getPredioById,
  getPrediosByCuadrante,
  getTerritorioSourceLabel,
  getZonas,
} from '../services/territorioService';
import type {
  CuadranteOption,
  PredioDetalle,
  PredioOption,
  ZonaOption,
} from '../types/territorio';

type TerritorialSelectorProps = {
  selectedPredioId: string;
  onPredioSelected: (predioId: string, predioDetalle: PredioDetalle | null) => void;
};

export function TerritorialSelector({
  selectedPredioId,
  onPredioSelected,
}: TerritorialSelectorProps) {
  const [zonas, setZonas] = useState<ZonaOption[]>([]);
  const [cuadrantes, setCuadrantes] = useState<CuadranteOption[]>([]);
  const [predios, setPredios] = useState<PredioOption[]>([]);
  const [selectedZonaId, setSelectedZonaId] = useState('');
  const [selectedCuadranteId, setSelectedCuadranteId] = useState('');
  const [predioDetalle, setPredioDetalle] = useState<PredioDetalle | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const sourceLabel = getTerritorioSourceLabel();

  const selectedZona = useMemo(
    () => zonas.find((zona) => zona.id === selectedZonaId) ?? null,
    [selectedZonaId, zonas],
  );

  const selectedCuadrante = useMemo(
    () => cuadrantes.find((cuadrante) => cuadrante.id === selectedCuadranteId) ?? null,
    [cuadrantes, selectedCuadranteId],
  );

  useEffect(() => {
    let active = true;

    setLoading(true);
    setErrorMessage('');

    getZonas()
      .then((nextZonas) => {
        if (!active) {
          return;
        }

        setZonas(nextZonas);
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'No se pudieron cargar las zonas desde la fuente territorial.',
        );
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleZonaChange = (zonaId: string) => {
    setSelectedZonaId(zonaId);
    setSelectedCuadranteId('');
    setCuadrantes([]);
    setPredios([]);
    setPredioDetalle(null);
    onPredioSelected('', null);

    if (!zonaId) {
      return;
    }

    setLoading(true);
    setErrorMessage('');

    getCuadrantesByZona(zonaId)
      .then(setCuadrantes)
      .catch((error: unknown) => {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'No se pudieron cargar los cuadrantes desde la fuente territorial.',
        );
      })
      .finally(() => setLoading(false));
  };

  const handleCuadranteChange = (cuadranteId: string) => {
    setSelectedCuadranteId(cuadranteId);
    setPredios([]);
    setPredioDetalle(null);
    onPredioSelected('', null);

    if (!cuadranteId) {
      return;
    }

    setLoading(true);
    setErrorMessage('');

    getPrediosByCuadrante(cuadranteId)
      .then(setPredios)
      .catch((error: unknown) => {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'No se pudieron cargar los predios desde la fuente territorial.',
        );
      })
      .finally(() => setLoading(false));
  };

  const handlePredioChange = (predioId: string) => {
    setPredioDetalle(null);
    onPredioSelected(predioId, null);

    if (!predioId) {
      return;
    }

    setLoading(true);
    setErrorMessage('');

    getPredioById(predioId)
      .then((nextPredioDetalle) => {
        setPredioDetalle(nextPredioDetalle);
        onPredioSelected(predioId, nextPredioDetalle);
      })
      .catch((error: unknown) => {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'No se pudo cargar el detalle del predio desde la fuente territorial.',
        );
        onPredioSelected(predioId, null);
      })
      .finally(() => setLoading(false));
  };

  return (
    <Card className="border-0 bg-light">
      <Card.Body>
        <Stack gap={3}>
          <div className="d-flex flex-column flex-md-row justify-content-between gap-2">
            <div>
              <Badge bg="primary" className="mb-2">
                Territorio
              </Badge>
              <h3 className="h5 mb-1">Selección territorial</h3>
              <p className="text-secondary mb-0">
                Fuente actual: <strong>{sourceLabel}</strong>. La pantalla no consume datos
                directamente; usa services y adapters.
              </p>
            </div>

            {loading ? (
              <div className="text-secondary d-flex align-items-center gap-2">
                <Spinner size="sm" />
                Cargando
              </div>
            ) : null}
          </div>

          {errorMessage ? (
            <Alert variant="danger" className="mb-0">
              {errorMessage} Si la fuente es API real, revisar red interna, certificado o CORS.
            </Alert>
          ) : null}

          <Row className="g-3">
            <Col md={4}>
              <Form.Group controlId="zona">
                <Form.Label>Zona</Form.Label>
                <Form.Select
                  value={selectedZonaId}
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
                  value={selectedCuadranteId}
                  onChange={(event) => handleCuadranteChange(event.target.value)}
                  disabled={!selectedZonaId}
                >
                  <option value="">Seleccionar cuadrante</option>
                  {cuadrantes.map((cuadrante) => (
                    <option key={cuadrante.id} value={cuadrante.id}>
                      {cuadrante.nombre || cuadrante.letra}
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
                  disabled={!selectedCuadranteId}
                >
                  <option value="">Seleccionar predio</option>
                  {predios.map((predio) => (
                    <option key={predio.id} value={predio.id}>
                      {predio.calle} {predio.numeroPuertaTeorico}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {selectedZona || selectedCuadrante ? (
            <Alert variant="secondary" className="mb-0">
              {selectedZona ? (
                <>
                  Zona seleccionada: <strong>{selectedZona.nombre}</strong>.
                </>
              ) : null}{' '}
              {selectedCuadrante ? (
                <>
                  Cuadrante seleccionado: <strong>{selectedCuadrante.nombre}</strong>.
                </>
              ) : null}
            </Alert>
          ) : null}

          {predioDetalle ? (
            <Card>
              <Card.Header className="bg-white">
                <strong>Datos precargados del predio</strong>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  <Col md={4}>
                    <div className="text-secondary small">Calle</div>
                    <div className="fw-semibold">{predioDetalle.calle || 'Sin dato'}</div>
                  </Col>

                  <Col md={4}>
                    <div className="text-secondary small">Número teórico</div>
                    <div className="fw-semibold">
                      {predioDetalle.numeroPuertaTeorico || 'Sin dato'}
                    </div>
                  </Col>

                  <Col md={4}>
                    <div className="text-secondary small">Padrón</div>
                    <div className="fw-semibold">{predioDetalle.padron || 'Sin dato'}</div>
                  </Col>

                  <Col md={4}>
                    <div className="text-secondary small">Manzana</div>
                    <div className="fw-semibold">{predioDetalle.manzana || 'Sin dato'}</div>
                  </Col>

                  <Col md={4}>
                    <div className="text-secondary small">Lote</div>
                    <div className="fw-semibold">{predioDetalle.lote || 'Sin dato'}</div>
                  </Col>

                  <Col md={4}>
                    <div className="text-secondary small">Referencia</div>
                    <div className="fw-semibold">
                      {predioDetalle.referencia || 'Sin referencia'}
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ) : null}
        </Stack>
      </Card.Body>
    </Card>
  );
}
