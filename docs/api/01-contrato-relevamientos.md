# API-1A — Contrato base de borrador por secciones

## Estado

Contrato inicial propuesto para MVP.

Este documento define comunicación frontend/backend para guardar borradores de relevamiento. No define el modelo definitivo de base de datos y no implica que los endpoints ya estén implementados.

## Decisión base

Para el MVP, el frontend enviará un snapshot completo del borrador actual al guardar entre secciones.

Motivos:

- el backend no necesita mergear fragmentos parciales;
- se reduce el riesgo de perder datos;
- se adapta al flujo actual del frontend;
- permite recuperar el formulario completo;
- facilita guardar inicialmente el contenido en un campo JSON, por ejemplo `borrador_json`;
- más adelante se puede normalizar información al finalizar si se acuerda otro contrato.

## Endpoint principal de borrador

~~~text
PATCH /relevamientos/{id}/borrador
~~~

## Secciones válidas

- `inicio_predio_visita`
- `vivienda_hogares`
- `datos_por_hogar`
- `cierre_finalizacion`

## Payload base de guardado de borrador

~~~json
{
  "current_section": "vivienda_hogares",
  "draft_version": 1,
  "saved_at_client": "2026-05-15T14:30:00",
  "draft": {
    "territorio": {},
    "visita": {},
    "vivienda": {},
    "hogares": [],
    "observaciones_generales": "",
    "coordenadas": null
  }
}
~~~

## Estructura mínima del draft

~~~json
{
  "territorio": {
    "zona_id": 1,
    "cuadrante_id": 2,
    "predio_id": 10,
    "predio": {
      "id": 10,
      "calle": "Ejemplo",
      "numero_teorico_puerta": "123",
      "padron": "456",
      "manzana": "A",
      "lote": "7"
    }
  },
  "visita": {
    "resultado": "ENTREVISTA_REALIZADA",
    "motivo_negativa": "",
    "referencia_no_encontrado": "",
    "contacto_no_encontrado": "",
    "horario_no_encontrado": "",
    "observacion_no_encontrado": ""
  },
  "vivienda": {
    "cantidad_hogares_declarada": 2,
    "vinculo_entre_hogares": "FAMILIAR",
    "observaciones": ""
  },
  "hogares": [],
  "observaciones_generales": "",
  "coordenadas": {
    "latitud": null,
    "longitud": null,
    "hora_captura": null
  }
}
~~~

## Resultado de visita

Valores base:

- `ENTREVISTA_REALIZADA`
- `SE_NIEGA`
- `NO_SE_ENCUENTRA`

## Estados mínimos del relevamiento

Para MVP:

- `BORRADOR`
- `FINALIZADO`

Estados futuros pendientes:

- `PENDIENTE_REVISITA`
- `ANULADO`

## Crear relevamiento

~~~text
POST /relevamientos
~~~

## Recuperar relevamiento

~~~text
GET /relevamientos/{id}
~~~

## Guardar borrador

~~~text
PATCH /relevamientos/{id}/borrador
~~~

## Finalizar relevamiento

~~~text
POST /relevamientos/{id}/finalizar
~~~

No se cierra todavía el contrato definitivo de finalización.

## Trazabilidad tablet/grupo operativo

Decisión vigente del MVP:

- no habrá usuarios personales robustos;
- la trazabilidad principal será por tablet y grupo operativo;
- los grupos operativos no guardarán nombres ni cédulas;
- cada formulario debe registrar qué tablet y qué grupo operativo lo cargó.

## Qué no define este contrato

Este contrato no define:

- modelo definitivo de base de datos;
- migraciones;
- normalización de hogares, personas, servicios o salud;
- validaciones finales definitivas;
- autenticación;
- PIN;
- geolocalización real;
- mapa real;
- panel operativo;
- sincronización offline completa.

## Criterio operativo

API-1A debe usarse como base de conversación entre frontend y backend.

La implementación posterior debe separarse en nuevos bloques.
