# Fases frontend

## Estado actual frontend

- FE-1 completado: base técnica frontend.
- FE-2 completado: layout tablet y navegación inicial.
- FE-3 completado: selección territorial con mocks.
- FE-4 completado: resultado de visita y corte temprano visual.
- FE-5 completado: vivienda y hogares con estado temporal.
- FE-6 completado: personas y contactos por hogar con estado temporal.
- FE-7 completado: servicios y salud por hogar con estado temporal.
- FE-8 completado: observaciones generales, coordenadas placeholder y revisión final simulada.
- FE-9 completado: borrador local MVP con localStorage.
- FE-10A completado: integración territorial real configurable por entorno.
- La lectura territorial puede usar API real o mocks locales según `VITE_TERRITORIO_DATA_SOURCE`.
- Base API documentada: `http://10.100.0.10/sistema-censo/api/v1`.
- Rutas territoriales integradas: `/zonas`, `/zonas/{id}/cuadrantes`, `/cuadrantes/{id}/predios`, `/predios/{id}`.
- Desde terminal, si hay proxy institucional, puede requerirse `curl --noproxy "*"` para evitar bloqueo sobre rutas internas.
- Relevamientos, guardado servidor, borrador servidor y finalización real siguen fuera de alcance.
- Si aparecen errores de red, certificado o CORS en navegador, corresponden a backend/infraestructura o configuración de ambiente.
- No hay geolocalización real, mapa real, pin real ni finalización real todavía.

## FE-0 — Documentación mínima frontend

Objetivo: crear los documentos mínimos del frontend.

Alcance: contrato, estructura, flujo, modelo temporal, integración pendiente y fases.

Fuera de alcance: código, app React, dependencias, mocks implementados.

Resultado esperado: documentación lista para iniciar frontend.

Dependencias: DOCS-0.

## FE-1 — Estructura base frontend

Objetivo: crear base técnica del frontend.

Alcance: estructura inicial, carpetas, layout base y rutas si corresponde.

Fuera de alcance: formulario completo, API real, dependencias no aprobadas.

Resultado esperado: frontend inicial ordenado.

Dependencias: FE-0.

## FE-2 — Layout tablet y navegación

Objetivo: crear flujo navegable pensado para tablets.

Alcance: layout, navegación, avance/retroceso y contenedores.

Fuera de alcance: campos definitivos y backend real.

Resultado esperado: recorrido visual inicial.

Dependencias: FE-1.

## FE-3 — Selección territorial con mocks

Objetivo: seleccionar zona, cuadrante y predio con datos simulados.

Alcance: mocks, services internos y pantallas de selección.

Fuera de alcance: endpoints reales.

Resultado esperado: selección territorial funcional.

Dependencias: FE-2.

## FE-4 — Formulario por secciones

Objetivo: implementar flujo de las 4 secciones.

Alcance: resultado de visita, vivienda, hogares, datos por hogar, observaciones y coordenadas básicas.

Fuera de alcance: validaciones finales y backend real.

Resultado esperado: formulario navegable por secciones.

Dependencias: FE-3.

## FE-5 — Hogares múltiples

Objetivo: soportar varios hogares por predio.

Alcance: agregar hogares y cargar personas, contactos, servicios, salud y observaciones por hogar.

Fuera de alcance: modelo backend definitivo.

Resultado esperado: relevamiento con múltiples hogares.

Dependencias: FE-4.

## FE-6 — Borrador local y estados visuales

Objetivo: evitar pérdida de datos y mostrar estado de guardado.

Alcance: guardado local, recuperación, guardando, guardado, pendiente, error y finalizado.

Fuera de alcance: sincronización offline compleja.

Resultado esperado: borrador recuperable y estados claros.

Dependencias: FE-5.

## FE-7 — Coordenadas y cierre

Objetivo: preparar cierre del relevamiento.

Alcance: coordenadas básicas, observaciones generales, revisión final y confirmación.

Fuera de alcance: mapa avanzado y tracking en tiempo real.

Resultado esperado: flujo completo hasta cierre simulado.

Dependencias: FE-6.

## FE-8 — Integración backend real

Objetivo: reemplazar mocks por API real cuando exista contrato.

Alcance: ajustar services, adapters y types si corresponde.

Fuera de alcance: rediseñar todo el flujo sin justificación.

Resultado esperado: frontend conectado al backend.

Dependencias: contrato backend final.

<!-- API-3B-CONFIG-AMBIENTES:START -->
## Estado post API-3A — Finalización real mínima por entorno

Después de API-3A, el frontend ya cuenta con una integración mínima de finalización real contra backend, pero solo se activa por configuración de entorno.

Estado vigente:

- La finalización local sigue siendo el modo seguro por defecto.
- `local` significa finalización sin backend, no `localhost`.
- `backend` activa el flujo real contra API.
- El flujo real probado es `POST /borrador/create` → `datos.id` → `POST /relevamiento/create` con `draft.id`.
- El borrador local con `localStorage` sigue vigente y separado del borrador servidor.
- El formulario no debe limpiar datos ni borrar el borrador local si falla la finalización backend.
- El guardado servidor al avanzar de sección sigue pendiente.
- `/borrador/sincronizar` sigue fuera de uso para la primera integración online.
- `/relevamiento/create/offline` sigue fuera de alcance para nuestro frontend actual.
- React Hook Form, Zod, geolocalización real, mapa y pin siguen fuera de este bloque.

Configuración recomendada para demo/desarrollo visual:

~~~env
VITE_TERRITORIO_DATA_SOURCE=mock
VITE_RELEVAMIENTO_FINALIZATION_MODE=local
VITE_API_BASE_URL=
VITE_CUADRANTE_IMAGE_BASE_URL=
~~~

Configuración para backend de prueba:

~~~env
VITE_TERRITORIO_DATA_SOURCE=api
VITE_RELEVAMIENTO_FINALIZATION_MODE=backend
VITE_API_BASE_URL=http://10.100.66.32:8000/api/v1
~~~

Riesgo operativo:

Desde desarrollo local puede haber bloqueo por CORS si backend/infraestructura no habilita el origen del navegador.
<!-- API-3B-CONFIG-AMBIENTES:END -->
