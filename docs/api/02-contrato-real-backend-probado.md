# API-2B — Contrato real probado con backend

Este documento registra el contrato real observado y probado contra el backend de prueba del sistema de relevamiento territorial.

No reemplaza todavía la integración frontend/backend. Su objetivo es dejar evidencia técnica y diferencias detectadas antes de implementar servicios, adapters o validaciones formales en frontend.

## Estado del bloque

~~~text
Bloque: API-2B-DOC
Tipo: documentación
Alcance: contrato real probado
Implementación frontend: no incluida
Backend code: no incluido
~~~

## Base URL probada

~~~text
http://10.100.66.32:8000/api/v1
~~~

## Rutas GET reales probadas

### GET /ping

Resultado observado desde navegador:

~~~text
HTTP 200
pong
~~~

### GET /zonas

Resultado observado:

~~~json
[
  { "id": 1, "nombre": "Zona 1" },
  { "id": 2, "nombre": "Zona 2" },
  { "id": 3, "nombre": "Zona 3" }
]
~~~

### GET /zonas/1/cuadrantes

Resultado observado:

~~~json
[
  { "id": 1, "nombre": "A", "img": "/zona1/cuadranteA.webp" },
  { "id": 2, "nombre": "Abis", "img": "/zona1/cuadranteAbis.webp" },
  { "id": 3, "nombre": "B", "img": "/zona1/cuadranteB.webp" }
]
~~~

La respuesta real contiene más cuadrantes. El formato observado es array directo.

### GET /cuadrantes/1/predios

Resultado observado:

~~~json
[
  {
    "id": 1,
    "calle": "Arq Emilio Boix y Merino",
    "nro_puerta": 2206,
    "padron": 0,
    "lote": 0,
    "manzana": 0,
    "obs": "sin obs",
    "nombre_cuadrante": "A"
  }
]
~~~

La respuesta real contiene más predios. El formato observado es array directo.

### GET /predios/1

Resultado observado:

~~~json
{
  "id": 1,
  "calle": "Arq Emilio Boix y Merino",
  "nro_puerta": 2206,
  "padron": 0,
  "lote": 0,
  "manzana": 0,
  "obs": "sin obs",
  "nombre_cuadrante": "A"
}
~~~

## Compatibilidad territorial con frontend actual

Las rutas territoriales reales son compatibles en términos generales con los adapters actuales porque:

- las colecciones vienen como array directo;
- zona usa `id`/`nombre`;
- cuadrante usa `id`/`nombre`/`img`;
- predio usa `id`/`calle`/`nro_puerta`/`padron`/`lote`/`manzana`/`obs`/`nombre_cuadrante`;
- el adapter actual ya contempla `nro_puerta`, `obs` y `nombre_cuadrante`.

Punto a revisar más adelante:

El campo `img` viene como `/zona1/cuadranteA.webp`.
Debe confirmarse si el frontend debe combinarlo con `VITE_CUADRANTE_IMAGE_BASE_URL` o si la API devolverá URL completa.

## Rutas POST reales informadas por backend

- `POST /borrador/create`
- `POST /borrador/sincronizar`
- `POST /relevamiento/create`
- `POST /relevamiento/create/offline`

## Rutas POST probadas en API-2B

- `POST /borrador/create`
- `GET /borrador/get/{id}`
- `POST /borrador/sincronizar`
- `POST /relevamiento/create`

No se probó:

- `POST /relevamiento/create/offline`

Motivo:

La ruta offline existe en backend, pero queda fuera de alcance para el frontend actual por decisión de prioridad.

## POST /borrador/create

Resultado probado:

~~~text
HTTP 200
message: datos actualizados correctamente
errors: []
~~~

Respuesta observada:

~~~json
{
  "code": 200,
  "message": "datos actualizados correctamente",
  "datos": {
    "id": 1,
    "current_section": "cierre_finalizacion",
    "draft_version": 1,
    "saved_at_client": null,
    "draft": {},
    "completed": false
  },
  "errors": []
}
~~~

La respuesta real devuelve el JSON de draft completo. En este documento se omite el contenido completo por brevedad.

Identificador devuelto:

~~~text
datos.id
~~~

Comportamiento observado:

`/borrador/create` acepta y guarda JSON con valores actuales del frontend post reunión.

En la prueba aceptó, entre otros:

- `forma_acceso_vivienda: COMPRA_INFORMAL`
- `sexo: MUJER`
- `sexo: VARON_TRANS`
- `parentesco_con_referente: FAMILIAR`
- `conforme_caracteristicas: texto libre`
- `vinculo_barrio_familia: texto libre`

Importante:

`/borrador/create` guarda el JSON con menos validación estricta que `/relevamiento/create`.

## GET /borrador/get/{id}

Resultado probado para el borrador 1:

~~~text
HTTP 200
message: datos ubicados
errors: []
~~~

Respuesta observada:

~~~json
{
  "code": 200,
  "message": "datos ubicados",
  "datos": {
    "current_section": "cierre_finalizacion",
    "draft_version": 1,
    "saved_at_client": null,
    "draft": {},
    "completed": false
  },
  "errors": []
}
~~~

La respuesta real devuelve el draft guardado. En este documento se omite el contenido completo por brevedad.

## POST /borrador/sincronizar

Payload probado:

~~~json
{
  "id": 1,
  "draft_version": 1,
  "marca_prueba": "PRUEBA_TECNICA_FRONTEND_NO_USAR"
}
~~~

Resultado observado:

~~~text
HTTP 200
message: No existe borrador o Error Inesperado
datos: []
errors: []
~~~

Interpretación funcional:

Según criterio informado durante la prueba, esta ruta está pensada para escenarios donde se guarda localmente por falta de conexión y luego se sincroniza contra el servidor.

Queda documentada como ruta existente, pero sin utilidad fija para la integración frontend inmediata.

No se considera bloqueante para la primera integración online.

## POST /relevamiento/create

Objetivo real observado:

`/relevamiento/create` representa la finalización/persistencia estricta de un relevamiento a partir de un borrador.

Flujo mínimo probado:

1. `POST /borrador/create`
2. tomar `datos.id` de la respuesta
3. `POST /relevamiento/create` con `draft.id = datos.id`

Identificador requerido:

La prueba final de aislamiento confirmó que `/relevamiento/create` requiere el identificador del borrador dentro de:

~~~text
draft.id
~~~

Contrato real probado:

~~~json
{
  "draft_version": 1,
  "current_section": "cierre_finalizacion",
  "finalized_at_client": "fecha_cliente",
  "draft": {
    "id": 6
  }
}
~~~

Pruebas de identificación realizadas:

### Variante A — id top-level

Resultado: HTTP 500.

Conclusión: no funciona aislado.

### Variante B — borrador_id top-level

Resultado: HTTP 500.

Conclusión: no funciona aislado.

### Variante C — draft.id

Resultado: HTTP 200.

Message: relevamiento guardado correctamente.

Conclusión: funciona y alcanza para asociar el relevamiento al borrador.

No se probó Variante D porque el criterio de parada detuvo la prueba al encontrar la primera variante válida.

Respuesta exitosa observada:

~~~json
{
  "code": 200,
  "message": "relevamiento guardado correctamente",
  "datos": [],
  "errors": []
}
~~~

## Diferencias detectadas entre frontend actual y /relevamiento/create

`/relevamiento/create` valida y persiste de forma más estricta que `/borrador/create`.

Diferencias observadas:

- `tiempo_vive_barrio` debe ser entero.
- `sexo` debe usar valores con espacios y tilde según backend.
- persona requiere `documento`, no `cedula`.
- `documento` debe ser string.
- `documento` debe ser único.
- `parentesco_con_referente` no puede llegar null.
- backend persiste `vinculo_barrio`.
- `/relevamiento/create` necesita `draft.id` con el id del borrador.

## Valores de género esperados por backend

Valores informados para backend:

- `VARÓN`
- `MUJER`
- `MUJER TRANS`
- `VARÓN TRANS`
- `NO SABE / NO RESPONDE`
- `OTRA`

Frontend actual post reunión usa estructura interna distinta en algunos casos:

- `MUJER`
- `MUJER_TRANS`
- `VARON`
- `VARON_TRANS`
- `OTRA`
- `NO_SABE_NO_RESPONDE`

Decisión pendiente:

Definir si frontend cambia valores internos o si se crea adapter de salida hacia backend.

Recomendación conservadora:

Mantener UI como está y resolver mapeo en adapter de salida hacia API.

## Campo documento / cédula

Backend espera:

~~~text
documento
~~~

Frontend actual usa:

~~~text
cedula
~~~

Además, backend espera que `documento` sea string y que sea único.

Decisión pendiente:

Definir si se renombra internamente el campo frontend o si se adapta `cedula -> documento` al enviar.

Recomendación conservadora:

Mantener el formulario frontend actual y mapear `cedula -> documento` en adapter de salida.

## Campo vínculo con barrio

Frontend incorporó:

~~~text
vinculo_barrio_familia
~~~

Backend persiste:

~~~text
vinculo_barrio
~~~

En pruebas se envió ambos campos para aislar comportamiento.

Decisión pendiente:

Confirmar nombre oficial de contrato.

Recomendación conservadora:

Mapear `vinculoBarrioFamilia -> vinculo_barrio` en adapter de salida.

## tiempo_vive_barrio

Frontend actual lo maneja como texto libre.

Backend validó:

~~~text
draft.hogares.0.tiempo_vive_barrio debe ser un número entero.
~~~

Decisión pendiente:

Definir si el frontend debe cambiar el campo a número/años o si backend debe aceptar texto.

Esta diferencia impacta directamente la futura integración de finalización.

## Campos que backend normaliza a null

En `/borrador/create`, la respuesta mostró varios strings vacíos devueltos como null.

Ejemplos observados:

- `motivo_negativa`
- `referencia_no_encontrado`
- `contacto_no_encontrado`
- `horario_no_encontrado`
- `observacion_no_encontrado`
- `forma_acceso_otro`
- `cedula/documento` vacío en pruebas previas
- observaciones vacías

Decisión pendiente:

Definir si frontend debe enviar null explícito o puede seguir enviando string vacío.

## Errores 500 observados

Algunas diferencias de contrato produjeron HTTP 500.

Se documentan como evidencia técnica, no como contrato deseado.

Ejemplos:

- falta de documento requerido por PersonaData;
- `parentesco_con_referente` null donde backend esperaba string;
- `vinculo_barrio` null donde base de datos no acepta null;
- falta de `draft.id` para completar borrador desde `/relevamiento/create`.

Recomendación para backend:

Transformar estos casos en respuestas 422 de validación con mensajes controlados.

## Ruta fuera de alcance: POST /relevamiento/create/offline

La ruta existe en backend, pero queda fuera de alcance para integración frontend actual.

Motivo:

El frontend actual no implementa sincronización offline completa ni cola de envíos.

Se debe documentar como futura etapa si se formaliza offline real.

## Contrato real mínimo para integración futura

### Crear / actualizar borrador

`POST /borrador/create`

Payload base:

~~~json
{
  "draft_version": 1,
  "current_section": "cierre_finalizacion",
  "finalized_at_client": "fecha_cliente_o_null",
  "draft": {
    "territorio": {},
    "visita": {},
    "vivienda": {},
    "hogares": [],
    "observaciones_generales": "",
    "coordenadas": {}
  }
}
~~~

Respuesta relevante:

~~~text
datos.id
~~~

### Finalizar relevamiento

`POST /relevamiento/create`

Payload mínimo probado:

~~~json
{
  "draft_version": 1,
  "current_section": "cierre_finalizacion",
  "finalized_at_client": "fecha_cliente",
  "draft": {
    "id": 6
  }
}
~~~

Respuesta esperada:

~~~json
{
  "code": 200,
  "message": "relevamiento guardado correctamente",
  "datos": [],
  "errors": []
}
~~~

## Decisión conceptual pendiente

Aunque backend hoy requiere:

~~~text
draft.id
~~~

contractualmente sería más claro a futuro aceptar:

~~~text
borrador_id top-level
~~~

No bloquear integración por esto. Para la realidad probada actual, documentar:

`/relevamiento/create` usa `draft.id` como identificador de borrador.

## Próximo paso recomendado

Antes de integrar frontend:

**API-2C-AUDIT — Diseñar adapter frontend -> backend**

Debe definir:

- mapeo de selectedPredio / predio manual;
- mapeo de resultadoVisita;
- mapeo de vivienda;
- mapeo de hogares;
- mapeo de personas `cedula -> documento`;
- mapeo de sexo/género;
- mapeo de `vinculoBarrioFamilia -> vinculo_barrio`;
- conversión o decisión sobre `tiempo_vive_barrio`;
- creación de borrador;
- finalización con `draft.id`.
