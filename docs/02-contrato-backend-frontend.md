# Contrato mínimo backend/frontend

## Estado

Borrador inicial compartido.

Este documento no define contrato final de API, payloads definitivos ni modelo de base definitivo.

## Objetivo

Alinear frontend y backend sobre el flujo mínimo necesario para avanzar en paralelo.

## Datos base para precargar

Endpoints borrador:

```text
Base real:

http://10.100.0.10/sistema-censo/api/v1

Recursos relativos:

GET /zonas
GET /zonas/{id}/cuadrantes
GET /cuadrantes/{id}/predios
GET /predios/{id}
```

Uso esperado:

- `GET /zonas`: listar zonas.
- `GET /zonas/{id}/cuadrantes`: listar cuadrantes de una zona.
- `GET /cuadrantes/{id}/predios`: listar predios de un cuadrante.
- `GET /predios/{id}`: devolver datos del predio para precargar calle, número de puerta, padrón y otros datos disponibles.

## Relevamientos

Endpoints borrador:

```text
POST /relevamientos
GET /relevamientos/{id}
PATCH /relevamientos/{id}/borrador
POST /relevamientos/{id}/finalizar
```

Uso esperado:

- `POST /relevamientos`: crear un relevamiento.
- `GET /relevamientos/{id}`: consultar o recuperar un relevamiento.
- `PATCH /relevamientos/{id}/borrador`: preguardar avance parcial.
- `POST /relevamientos/{id}/finalizar`: guardado final con coordenadas.

## Supervisión futura

Endpoint borrador futuro:

```text
GET /relevamientos?zona=&cuadrante=&grupo=&estado=
```

No es prioritario para la primera implementación, pero debe quedar previsto.

## Reglas compartidas

- Frontend no debe asumir payloads finales todavía.
- Backend no debe asumir pantallas finales todavía.
- Los nombres de endpoints son borrador inicial.
- Servicios, contactos, salud y observaciones del hogar deben poder registrarse por hogar.
- Observaciones generales pueden existir a nivel de relevamiento.
- El preguardado debe permitir guardar avances por sección.
- El guardado final debe incluir coordenadas si corresponde.

## Límite del contrato

Este documento sirve para orientar el trabajo inicial.

Antes de integrar frontend y backend, se deberá cerrar un contrato más preciso con:

- payloads;
- respuestas;
- errores;
- estados;
- validaciones;
- reglas de recuperación de borradores.

## API-1A — Contrato base de borrador por secciones

Se define como contrato inicial que el frontend enviará al backend un snapshot completo del borrador actual al avanzar entre secciones.

Endpoint principal propuesto:

~~~text
PATCH /relevamientos/{id}/borrador
~~~

Motivo de la decisión:

- backend no necesita mergear fragmentos parciales;
- se reduce riesgo de pérdida de datos;
- se adapta al flujo actual del frontend;
- permite recuperar el formulario completo;
- permite guardar inicialmente en un campo JSON, por ejemplo `borrador_json`.

Secciones válidas:

- `inicio_predio_visita`
- `vivienda_hogares`
- `datos_por_hogar`
- `cierre_finalizacion`

Endpoints candidatos documentados:

- `POST /relevamientos`
- `GET /relevamientos/{id}`
- `PATCH /relevamientos/{id}/borrador`
- `POST /relevamientos/{id}/finalizar`

Estados mínimos para MVP:

- `BORRADOR`
- `FINALIZADO`

Estados futuros pendientes:

- `PENDIENTE_REVISITA`
- `ANULADO`

Documento específico:

~~~text
docs/api/01-contrato-relevamientos.md
~~~

Este contrato no define modelo definitivo de base de datos ni implica que los endpoints ya estén implementados.

## API-2B — Contrato real probado con backend

Se agregó documentación separada del contrato real probado contra el backend de prueba:

~~~text
docs/api/02-contrato-real-backend-probado.md
~~~

Resumen de hallazgos:

- Base de prueba: `http://10.100.66.32:8000/api/v1`.
- Las rutas GET territoriales reales responden con arrays/objetos directos.
- `POST /borrador/create` devuelve el identificador del borrador en `datos.id`.
- `GET /borrador/get/{id}` recupera el borrador guardado.
- `POST /borrador/sincronizar` existe, pero queda sin utilidad fija para la primera integración online.
- `POST /relevamiento/create` finaliza/persiste el relevamiento.
- `/relevamiento/create` requiere el identificador del borrador en `draft.id`.
- `/relevamiento/create/offline` queda fuera de alcance para el frontend actual.

Diferencias relevantes frente al contrato inicial:

- El contrato inicial proponía `PATCH /relevamientos/{id}/borrador`.
- El backend real usa `POST /borrador/create`.
- El contrato inicial proponía `POST /relevamientos/{id}/finalizar`.
- El backend real usa `POST /relevamiento/create`.
- El identificador probado para finalizar viaja como `draft.id`.

La integración frontend debe basarse en el contrato real probado o en una nueva versión acordada con backend.
