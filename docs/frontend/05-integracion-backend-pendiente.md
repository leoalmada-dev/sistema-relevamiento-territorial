# Integración backend pendiente

## Objetivo

Definir cómo debe avanzar el frontend mientras el backend no tiene contrato final cerrado.

## Estado

Los endpoints documentados en DOCS-0 son borrador inicial.

No deben tratarse como contrato final.

## Regla principal

El frontend debe consumir funciones internas de services, no endpoints directos.

## Services internos esperados

Estos nombres son funciones internas frontend, no endpoints reales:

```text
getZonas()
getCuadrantesByZona()
getPrediosByCuadrante()
getPredio()
crearRelevamiento()
obtenerRelevamiento()
guardarBorrador()
finalizarRelevamiento()
```

## Mocks

Mientras no exista backend real:

- los datos territoriales pueden venir de mocks;
- el relevamiento puede guardarse localmente;
- la finalización puede simularse;
- los errores pueden simularse para validar estados visuales.

## Adapters

Los adapters deben aislar cambios entre:

```text
modelo temporal frontend
mock frontend
contrato backend futuro
```

## No hacer

- No llamar `fetch` desde pantallas.
- No hardcodear endpoints como definitivos.
- No mezclar mocks dentro de componentes visuales.
- No asumir payloads finales.
- No asumir nombres finales del backend.
