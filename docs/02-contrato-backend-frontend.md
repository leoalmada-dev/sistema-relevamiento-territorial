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
POST /api/relevamientos
GET /api/relevamientos/{id}
PATCH /api/relevamientos/{id}/borrador
POST /api/relevamientos/{id}/finalizar
```

Uso esperado:

- `POST /api/relevamientos`: crear un relevamiento.
- `GET /api/relevamientos/{id}`: consultar o recuperar un relevamiento.
- `PATCH /api/relevamientos/{id}/borrador`: preguardar avance parcial.
- `POST /api/relevamientos/{id}/finalizar`: guardado final con coordenadas.

## Supervisión futura

Endpoint borrador futuro:

```text
GET /api/relevamientos?zona=&cuadrante=&grupo=&estado=
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
PATCH /api/relevamientos/{id}/borrador
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

- `POST /api/relevamientos`
- `GET /api/relevamientos/{id}`
- `PATCH /api/relevamientos/{id}/borrador`
- `POST /api/relevamientos/{id}/finalizar`

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
