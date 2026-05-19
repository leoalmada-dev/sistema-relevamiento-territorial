import { useEffect, useMemo, useState } from 'react';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
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

function getCuadranteImageValue(cuadrante: CuadranteOption | null) {
  if (!cuadrante) {
    return '';
  }

  return cuadrante.imagen || `cuadrante${cuadrante.letra}.webp`;
}

function isAbsoluteImageUrl(imageValue: string) {
  return /^https?:\/\//i.test(imageValue);
}

function getCuadranteImageFile(cuadrante: CuadranteOption | null) {
  const imageValue = getCuadranteImageValue(cuadrante).trim();

  if (!imageValue || isAbsoluteImageUrl(imageValue)) {
    return imageValue;
  }

  const imagePathParts = imageValue.replace(/^\/+/, '').split('/').filter(Boolean);

  return imagePathParts[imagePathParts.length - 1] ?? '';
}

function getCuadranteImageUrl(cuadrante: CuadranteOption | null) {
  const imageFile = getCuadranteImageFile(cuadrante);

  if (!imageFile) {
    return '';
  }

  if (isAbsoluteImageUrl(imageFile)) {
    return imageFile;
  }

  const baseUrl = getCuadranteImageBaseUrl();

  if (!baseUrl) {
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
    <Modal show={show} onHide={onHide} centered size="xl" fullscreen="md-down">
      <Modal.Header closeButton>
        <Modal.Title className="h5">
          Imagen de referencia del {cuadranteLabel}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-2 p-md-3">
        {imageUrl && !imageLoadFailed ? (
          <div
            className="bg-light border rounded overflow-hidden"
            style={{ height: 'min(72vh, 760px)', touchAction: 'none' }}
          >
            <TransformWrapper initialScale={1} minScale={1} maxScale={5}>
              <TransformComponent
                wrapperStyle={{
                  width: '100%',
                  height: '100%',
                }}
                contentStyle={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={imageUrl}
                  alt={`Imagen de referencia del ${cuadranteLabel}`}
                  className="img-fluid rounded"
                  style={{
                    maxHeight: '70vh',
                    maxWidth: '100%',
                    objectFit: 'contain',
                    userSelect: 'none',
                    touchAction: 'none',
                  }}
                  draggable={false}
                  onError={() => setImageLoadFailed(true)}
                />
              </TransformComponent>
            </TransformWrapper>
          </div>
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
