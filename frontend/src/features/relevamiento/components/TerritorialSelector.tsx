import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner, Stack } from 'react-bootstrap';
import {
  crearPredio,
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
  selectedPredio: PredioDetalle | null;
  selectedCuadrante: CuadranteOption | null;
  onPredioSelected: (predioId: string, predioDetalle: PredioDetalle | null) => void;
  onCuadranteSelected?: (cuadrante: CuadranteOption | null) => void;
  onRequestTerritorialChange?: (applyChange: () => void) => void;
};

const MANUAL_PREDIO_OPTION_VALUE = '__PREDIO_MANUAL__';

function buildManualPredioId(cuadranteId: string) {
  return `predio-manual-${cuadranteId}`;
}

function isManualPredioId(predioId: string) {
  return predioId.startsWith('predio-manual-');
}

export function TerritorialSelector({
  selectedPredioId,
  selectedPredio,
  selectedCuadrante,
  onPredioSelected,
  onCuadranteSelected,
  onRequestTerritorialChange,
}: TerritorialSelectorProps) {
  const [zonas, setZonas] = useState<ZonaOption[]>([]);
  const [cuadrantes, setCuadrantes] = useState<CuadranteOption[]>([]);
  const [predios, setPredios] = useState<PredioOption[]>([]);
  const [selectedZonaId, setSelectedZonaId] = useState('');
  const [selectedCuadranteId, setSelectedCuadranteId] = useState('');
  const [predioDetalle, setPredioDetalle] = useState<PredioDetalle | null>(null);
  const [manualPredioCalle, setManualPredioCalle] = useState('');
  const [manualPredioNumero, setManualPredioNumero] = useState('');
  const [manualPredioReferencia, setManualPredioReferencia] = useState('');
  const [creatingPredio, setCreatingPredio] = useState(false);
  const [createPredioError, setCreatePredioError] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const sourceLabel = getTerritorioSourceLabel();

  const selectedZona = useMemo(
    () => zonas.find((zona) => zona.id === selectedZonaId) ?? null,
    [selectedZonaId, zonas],
  );

  const selectedCuadranteInterno = useMemo(
    () => cuadrantes.find((cuadrante) => cuadrante.id === selectedCuadranteId) ?? null,
    [cuadrantes, selectedCuadranteId],
  );

  const callesDisponiblesPredioManual = useMemo(
    () =>
      Array.from(
        new Set(
          predios
            .map((predio) => predio.calle.trim())
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b, 'es')),
    [predios],
  );

  const selectedPredioOptionValue = isManualPredioId(selectedPredioId)
    ? MANUAL_PREDIO_OPTION_VALUE
    : selectedPredioId;

  const isManualPredioSelected = selectedPredioOptionValue === MANUAL_PREDIO_OPTION_VALUE;

  const resetManualPredio = () => {
    setManualPredioCalle('');
    setManualPredioNumero('');
    setManualPredioReferencia('');
    setCreatePredioError('');
  };

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
            : 'No se pudieron cargar las zonas. Verifique la conexión e intente nuevamente.',
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

  useEffect(() => {
    if (!selectedPredio || !selectedCuadrante) {
      return;
    }

    let active = true;

    setSelectedZonaId(selectedCuadrante.zonaId);
    setSelectedCuadranteId(selectedCuadrante.id);
    setPredioDetalle(selectedPredio);

    if (selectedPredio.origen === 'manual') {
      setManualPredioCalle(selectedPredio.calle);
      setManualPredioNumero(selectedPredio.numeroPuertaTeorico);
      setManualPredioReferencia(selectedPredio.referencia ?? '');
    } else {
      resetManualPredio();
    }

    setLoading(true);
    setErrorMessage('');

    Promise.all([
      getCuadrantesByZona(selectedCuadrante.zonaId),
      getPrediosByCuadrante(selectedCuadrante.id),
    ])
      .then(([nextCuadrantes, nextPredios]) => {
        if (!active) {
          return;
        }

        setCuadrantes(nextCuadrantes);
        setPredios(nextPredios);
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'No se pudo restaurar visualmente la selección territorial.',
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
  }, [selectedCuadrante, selectedPredio]);

  const runTerritorialChange = (applyChange: () => void) => {
    if (onRequestTerritorialChange) {
      onRequestTerritorialChange(applyChange);
      return;
    }

    applyChange();
  };

  const buildManualPredioDetalle = (
    calle: string,
    numeroPuertaTeorico: string,
    referencia: string,
  ): PredioDetalle | null => {
    const calleNormalizada = calle.trim();
    const numeroNormalizado = numeroPuertaTeorico.trim();

    if (
      !selectedCuadranteInterno ||
      !selectedCuadranteId ||
      !calleNormalizada ||
      !numeroNormalizado
    ) {
      return null;
    }

    return {
      id: buildManualPredioId(selectedCuadranteId),
      cuadranteId: selectedCuadranteId,
      calle: calleNormalizada,
      numeroPuertaTeorico: numeroNormalizado,
      padron: '',
      manzana: '',
      lote: '',
      referencia: referencia.trim() || 'Predio ingresado manualmente',
      nombreCuadrante: selectedCuadranteInterno.nombre,
      origen: 'manual',
    };
  };

  const updateManualPredio = (
    calle: string,
    numeroPuertaTeorico: string,
    referencia: string,
  ) => {
    const manualPredioId = buildManualPredioId(selectedCuadranteId);
    const nextPredioDetalle = buildManualPredioDetalle(
      calle,
      numeroPuertaTeorico,
      referencia,
    );

    setPredioDetalle(nextPredioDetalle);
    onPredioSelected(manualPredioId, nextPredioDetalle);
  };

  const handleZonaChange = (zonaId: string) => {
    runTerritorialChange(() => {
      setSelectedZonaId(zonaId);
      setSelectedCuadranteId('');
      setCuadrantes([]);
      setPredios([]);
      setPredioDetalle(null);
      resetManualPredio();
      onCuadranteSelected?.(null);
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
              : 'No se pudieron cargar los cuadrantes. Verifique la conexión e intente nuevamente.',
          );
        })
        .finally(() => setLoading(false));
    });
  };

  const handleCuadranteChange = (cuadranteId: string) => {
    runTerritorialChange(() => {
      const nextCuadrante =
        cuadrantes.find((cuadrante) => cuadrante.id === cuadranteId) ?? null;

      setSelectedCuadranteId(cuadranteId);
      setPredios([]);
      setPredioDetalle(null);
      resetManualPredio();
      onCuadranteSelected?.(nextCuadrante);
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
              : 'No se pudieron cargar los predios. Verifique la conexión e intente nuevamente.',
          );
        })
        .finally(() => setLoading(false));
    });
  };

  const handlePredioChange = (predioId: string) => {
    runTerritorialChange(() => {
      setPredioDetalle(null);

      if (!predioId) {
        resetManualPredio();
        onPredioSelected('', null);
        return;
      }

      if (predioId === MANUAL_PREDIO_OPTION_VALUE) {
        const manualPredioId = buildManualPredioId(selectedCuadranteId);
        const nextPredioDetalle = buildManualPredioDetalle(
          manualPredioCalle,
          manualPredioNumero,
          manualPredioReferencia,
        );

        setPredioDetalle(nextPredioDetalle);
        onPredioSelected(manualPredioId, nextPredioDetalle);
        return;
      }

      resetManualPredio();
      onPredioSelected(predioId, null);

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
              : 'No se pudo cargar el detalle del predio. Verifique la conexión e intente nuevamente.',
          );
          onPredioSelected(predioId, null);
        })
        .finally(() => setLoading(false));
    });
  };

  const handleManualPredioCalleChange = (calle: string) => {
    setManualPredioCalle(calle);
    setCreatePredioError('');
    updateManualPredio(calle, manualPredioNumero, manualPredioReferencia);
  };

  const handleManualPredioNumeroChange = (numeroPuertaTeorico: string) => {
    setManualPredioNumero(numeroPuertaTeorico);
    setCreatePredioError('');
    updateManualPredio(manualPredioCalle, numeroPuertaTeorico, manualPredioReferencia);
  };

  const handleManualPredioReferenciaChange = (referencia: string) => {
    setManualPredioReferencia(referencia);
    setCreatePredioError('');
    updateManualPredio(manualPredioCalle, manualPredioNumero, referencia);
  };

  const handleCrearPredio = async () => {
    const calle = manualPredioCalle.trim();
    const nroPuerta = manualPredioNumero.trim();

    if (!selectedCuadranteId) {
      setCreatePredioError('Seleccioná un cuadrante antes de crear el predio.');
      return;
    }

    if (!calle) {
      setCreatePredioError('Ingresá la calle del predio.');
      return;
    }

    if (!nroPuerta) {
      setCreatePredioError('Ingresá el número de puerta del predio.');
      return;
    }

    setCreatingPredio(true);
    setCreatePredioError('');

    try {
      const predioCreado = await crearPredio({
        calle,
        nroPuerta,
        idCuadrante: selectedCuadranteId,
      });

      const { origen: _origenManual, ...predioCreadoSinOrigen } = predioCreado;
      void _origenManual;

      const predioCreadoReal: PredioDetalle = {
        ...predioCreadoSinOrigen,
        cuadranteId: predioCreadoSinOrigen.cuadranteId || selectedCuadranteId,
        nombreCuadrante:
          predioCreadoSinOrigen.nombreCuadrante || selectedCuadranteInterno?.nombre,
      };

      const predioCreadoOption: PredioOption = {
        id: predioCreadoReal.id,
        cuadranteId: predioCreadoReal.cuadranteId,
        calle: predioCreadoReal.calle,
        numeroPuertaTeorico: predioCreadoReal.numeroPuertaTeorico,
        padron: predioCreadoReal.padron,
      };

      setPredios((currentPredios) => [
        predioCreadoOption,
        ...currentPredios.filter((predio) => predio.id !== predioCreadoReal.id),
      ]);

      setPredioDetalle(predioCreadoReal);
      setManualPredioCalle('');
      setManualPredioNumero('');
      setManualPredioReferencia('');
      setCreatePredioError('');
      onPredioSelected(predioCreadoReal.id, predioCreadoReal);
    } catch (error) {
      setCreatePredioError(
        error instanceof Error && error.message
          ? error.message
          : 'No se pudo conectar con el servidor para crear el predio. Revisá la conexión e intentá nuevamente.',
      );
    } finally {
      setCreatingPredio(false);
    }
  };

  return (
    <Card className="border-0 bg-light">
      <Card.Body>
        <Stack gap={3}>
          <div className="d-flex flex-column flex-md-row justify-content-between gap-2">
            <div>
              <Badge bg="primary" className="mb-2">
                Predio
              </Badge>
              <h3 className="h5 mb-1">Seleccione el predio a relevar</h3>
              <p className="text-secondary mb-0">
                Elija zona, cuadrante y predio para precargar los datos disponibles.
              </p>
            </div>

            <div className="text-secondary small d-flex align-items-center gap-2">
              {loading ? (
                <>
                  <Spinner size="sm" />
                  Cargando datos
                </>
              ) : (
                <>Origen: {sourceLabel}</>
              )}
            </div>
          </div>

          {errorMessage ? (
            <Alert variant="danger" className="mb-0">
              {errorMessage}
            </Alert>
          ) : null}

          {!loading && !errorMessage && zonas.length === 0 ? (
            <Alert variant="warning" className="mb-0">
              No hay zonas disponibles para seleccionar.
            </Alert>
          ) : null}

          <Row className="g-3">
            <Col md={4}>
              <Form.Group controlId="zona">
                <Form.Label>Zona *</Form.Label>
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
                <Form.Label>Cuadrante *</Form.Label>
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
                {selectedZonaId && !loading && cuadrantes.length === 0 ? (
                  <Form.Text>No hay cuadrantes disponibles para la zona seleccionada.</Form.Text>
                ) : null}
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group controlId="predio">
                <Form.Label>Predio *</Form.Label>
                <Form.Select
                  value={selectedPredioOptionValue}
                  onChange={(event) => handlePredioChange(event.target.value)}
                  disabled={!selectedCuadranteId}
                >
                  <option value="">Seleccionar predio</option>
                  {predios.map((predio) => (
                    <option key={predio.id} value={predio.id}>
                      {predio.calle} {predio.numeroPuertaTeorico}
                    </option>
                  ))}
                  {selectedCuadranteId ? (
                    <option value={MANUAL_PREDIO_OPTION_VALUE}>
                      Agregar predio manualmente
                    </option>
                  ) : null}
                </Form.Select>
                {selectedCuadranteId && !loading && predios.length === 0 ? (
                  <Form.Text>
                    No hay predios disponibles para el cuadrante seleccionado.
                  </Form.Text>
                ) : null}
              </Form.Group>
            </Col>
          </Row>

          {isManualPredioSelected ? (
            <Card className="border">
              <Card.Header className="bg-white">
                <strong>Predio ingresado manualmente</strong>
              </Card.Header>
              <Card.Body>
                <Stack gap={3}>                <Alert variant="warning" className="mb-0">
                  Complete calle y número, y luego cree el predio para registrarlo en el sistema central.
                  Hasta crearlo, este dato se mantiene como predio no listado.
                </Alert>
                {createPredioError ? (
                  <Alert variant="danger" className="mb-0">
                    {createPredioError}
                  </Alert>
                ) : null}

                  <Row className="g-3">
                    <Col md={5}>
                      <Form.Group controlId="predio-manual-calle">
                    <Form.Label>Calle</Form.Label>
                    <Form.Control
                      value={manualPredioCalle}
                      onChange={(event) => handleManualPredioCalleChange(event.target.value)}
                      placeholder="Ingrese calle"
                      list="predio-manual-calles"
                    />
                    {callesDisponiblesPredioManual.length > 0 ? (
                      <datalist id="predio-manual-calles">
                        {callesDisponiblesPredioManual.map((calle) => (
                          <option key={calle} value={calle} />
                        ))}
                      </datalist>
                    ) : null}
                  </Form.Group>
                    </Col>

                    <Col md={3}>
                      <Form.Group controlId="predio-manual-numero">
                        <Form.Label>Número</Form.Label>
                        <Form.Control
                          value={manualPredioNumero}
                          onChange={(event) => handleManualPredioNumeroChange(event.target.value)}
                          placeholder="Ingrese número"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group controlId="predio-manual-referencia">
                        <Form.Label>Referencia</Form.Label>
                        <Form.Control
                          value={manualPredioReferencia}
                          onChange={(event) =>
                            handleManualPredioReferenciaChange(event.target.value)
                          }
                          placeholder="Opcional"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Stack>
              </Card.Body>
            </Card>
          ) : null}

          {selectedZona || selectedCuadranteInterno ? (
            <Alert variant="secondary" className="mb-0">
              {selectedZona ? (
                <>
                  Zona seleccionada: <strong>{selectedZona.nombre}</strong>.
                </>
              ) : null}{' '}
              {selectedCuadranteInterno ? (
                <>
                  Cuadrante seleccionado: <strong>{selectedCuadranteInterno.nombre}</strong>.
                </>
              ) : null}
            </Alert>
          ) : null}

          {predioDetalle ? (
            <Card>
              <Card.Header className="bg-white">
                <strong>Datos del predio</strong>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  <Col md={4}>
                    <div className="text-secondary small">Calle</div>
                    <div className="fw-semibold">{predioDetalle.calle || 'Sin dato'}</div>
                  </Col>

                  <Col md={4}>
                    <div className="text-secondary small">Número de puerta</div>
                    <div className="fw-semibold">
                      {predioDetalle.numeroPuertaTeorico || 'Sin dato'}
                    </div>
                  </Col>

                  <Col md={4}>
                    <div className="text-secondary small">Referencia</div>
                    <div className="fw-semibold">
                      {predioDetalle.referencia || 'Sin referencia'}
                    </div>
                  </Col>
                </Row>

                <div className="d-flex flex-column flex-md-row justify-content-end gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleCrearPredio}
                    disabled={creatingPredio}
                  >
                    {creatingPredio ? 'Creando predio...' : 'Crear predio'}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          ) : null}
        </Stack>
      </Card.Body>
    </Card>
  );
}
