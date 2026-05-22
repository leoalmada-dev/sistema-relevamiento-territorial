# Pendientes y preguntas

## Objetivo

Registrar decisiones abiertas que no deben inventarse durante el desarrollo.

## Backend/API

- Definir payload de `POST /relevamientos`.
- Definir payload de `PATCH /relevamientos/{id}/borrador`.
- Definir payload de `POST /relevamientos/{id}/finalizar`.
- Definir estructura de errores.
- Definir estados finales del relevamiento.
- Definir si el backend guarda borradores por sección o documento completo.
- Definir cómo se recupera un borrador existente.

## Modelo de datos

- Confirmar modelo final de Zona, Cuadrante y Predio.
- Confirmar datos precargados del predio.
- Confirmar relación final entre Predio, Relevamiento, Vivienda y Hogares.
- Confirmar campos definitivos de Hogar.
- Confirmar campos definitivos de Persona.
- Confirmar campos definitivos de Contactos, Servicios y Salud por hogar.
- Confirmar alcance de observaciones generales.

## Frontend

- Definir estructura final de pantallas.
- Definir modelo temporal frontend.
- Definir estrategia de guardado local.
- Definir estados visuales de guardado, error, pendiente y finalizado.
- Definir cómo se mostrará el corte temprano de Sección 1.

## Operación

- Definir cómo se identifica la tablet.
- Definir si habrá PIN simple.
- Definir cómo se asocia tablet con grupo operativo.
- Definir si la asociación se administra por base de datos o panel mínimo.

## Coordenadas

- Confirmar si las coordenadas son obligatorias para finalizar.
- Definir qué pasa si falla la captura de coordenadas.
- Definir si habrá pin manual, geolocalización automática o ambas.

## Fuera del MVP por ahora

- Usuarios personales robustos.
- App móvil nativa.
- Geolocalización en tiempo real.
- Mapa avanzado.
- Reportes complejos.
- Gráficas.
- Acceso externo de Intendencia.
- Offline completo de varios días.

## Pendientes API-1A — Borrador de relevamiento

Quedan pendientes de definición antes de implementar relevamientos reales:

- cómo se identifica `tablet_id`;
- cómo se asocia `grupo_operativo_id`;
- si backend infiere tablet/grupo operativo o si frontend debe enviarlo;
- si habrá PIN simple y cómo afecta la creación del relevamiento;
- si `PENDIENTE_REVISITA` entra en MVP;
- si `ANULADO` entra en MVP;
- si `SE_NIEGA` y `NO_SE_ENCUENTRA` finalizan el relevamiento o quedan en otro estado;
- si las coordenadas son obligatorias para todos los casos;
- qué validaciones son obligatorias al finalizar;
- si backend normaliza hogares/personas/contactos/servicios/salud al finalizar o conserva inicialmente el JSON;
- qué errores debe devolver backend ante borrador inválido, sección inválida o relevamiento inexistente.

No cerrar estas decisiones dentro de API-1A sin nuevo contrato.

## Pendientes API-2B — Contrato real probado con backend

A partir de las pruebas contra backend de prueba queda pendiente resolver antes de integrar:

- Definir si frontend mantiene `cedula` y se mapea a `documento`, o si se renombra el campo.
- Definir si sexo/género se mapea por adapter a los valores del backend.
- Definir si `vinculoBarrioFamilia` se mapea a `vinculo_barrio`.
- Definir si `tiempo_vive_barrio` debe pasar a entero o si backend aceptará texto.
- Confirmar si `parentesco_con_referente` debe enviarse siempre como string.
- Confirmar tratamiento oficial de predio manual.
- Confirmar si `/relevamiento/create` debería aceptar `borrador_id` top-level además de `draft.id`.
- Confirmar si errores 500 observados serán convertidos en 422 de validación.
- Dejar `/relevamiento/create/offline` fuera de alcance hasta definir offline real.

Hallazgo probado:

~~~text
POST /borrador/create → devuelve datos.id.
POST /relevamiento/create → requiere draft.id = datos.id.
~~~

<!-- API-3B-CONFIG-AMBIENTES:START -->
## Pendientes API-3B — Ambientes frontend/backend

Quedan pendientes de confirmar con backend, infraestructura y app antes del despliegue final:

- Definir URL final del frontend.
- Definir URL final de la API vista desde el navegador.
- Confirmar si frontend y Laravel se servirán desde el mismo origen.
- Confirmar si la API final quedará bajo `/sistema-censo/api/v1` o `/api/v1`.
- Confirmar si habrá Nginx/Apache sirviendo frontend y proxyando API.
- Confirmar si el servidor final usará HTTP o HTTPS.
- Definir si CORS se configurará en Laravel o se evitará sirviendo frontend y API bajo el mismo origen.
- Confirmar si la app Android embebida abrirá una URL HTTP/HTTPS del servidor o assets locales.
- Confirmar cuál será el origen del WebView en Android.
- Confirmar si la WebView necesitará URL absoluta de API o podrá usar URL relativa.
- Documentar valores finales de `VITE_API_BASE_URL`.
- Documentar valores finales de `VITE_CUADRANTE_IMAGE_BASE_URL`.

Decisiones ya tomadas para la configuración frontend:

- `VITE_RELEVAMIENTO_FINALIZATION_MODE=local` significa finalización sin backend.
- `local` no significa `localhost`.
- `VITE_RELEVAMIENTO_FINALIZATION_MODE=backend` activa finalización real contra API.
- En modo `backend`, `VITE_API_BASE_URL` debe estar configurado.
- No debe existir fallback silencioso a `local` cuando el modo elegido es `backend`.
- GitHub Pages/demo pública debe usar mock y finalización local.
<!-- API-3B-CONFIG-AMBIENTES:END -->
