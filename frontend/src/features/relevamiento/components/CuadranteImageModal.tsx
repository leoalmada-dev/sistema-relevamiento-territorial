import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Modal } from 'react-bootstrap';
import type { CuadranteOption } from '../types/territorio';

type CuadranteImageModalProps = {
  show: boolean;
  cuadrante: CuadranteOption | null;
  onHide: () => void;
};

const NO_IMAGE_MESSAGE = 'No hay imagen de referencia disponible para este cuadrante.';

function getCuadranteImageBaseUrl() {
  return String(import.meta.env.VITE_CUADRANTE_IMAGE_BASE_URL ?? '').replace(/\/+$/, '');
}

function getCuadranteImageFile(cuadrante: CuadranteOption | null) {
  if (!cuadrante) {
    return '';
  }

  return cuadrante.imagen || `cuadrante${cuadrante.letra}.webp`;
}

function getCuadranteImageUrl(cuadrante: CuadranteOption | null) {
  const baseUrl = getCuadranteImageBaseUrl();
  const imageFile = getCuadranteImageFile(cuadrante).replace(/^\/+/, '');

  if (!baseUrl || !imageFile) {
    return '';
  }

  return `${baseUrl}/${imageFile}`;
}

export function CuadranteImageModal({
  show,
  cuadrante,
  onHide,
}: CuadranteImageModalProps) {
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  const imageUrl = useMemo(() => getCuadranteImageUrl(cuadrante), [cuadrante]);
  const cuadranteLabel = cuadrante?.nombre || (cuadrante ? `Cuadrante ${cuadrante.letra}` : 'cuadrante');

  useEffect(() => {
    if (show) {
      setImageLoadFailed(false);
    }
  }, [show, imageUrl]);

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="h5">
          Imagen de referencia del {cuadranteLabel}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {imageUrl && !imageLoadFailed ? (
          <img
            src={imageUrl}
            alt={`Imagen de referencia del ${cuadranteLabel}`}
            className="img-fluid rounded border"
            onError={() => setImageLoadFailed(true)}
          />
        ) : (
          <Alert variant="secondary" className="mb-0">
            {NO_IMAGE_MESSAGE}
          </Alert>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
