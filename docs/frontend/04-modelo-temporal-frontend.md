# Modelo temporal frontend

## Objetivo

Definir un modelo interno temporal para desarrollar el frontend sin asumir el modelo final del backend.

Este modelo no es contrato de API ni modelo definitivo de base de datos.

## Modelo aprobado

```text
RelevamientoDraft
├── datosOperacion
├── ubicacionTerritorial
├── resultadoVisita
├── vivienda
├── hogares[]
│   ├── personas[]
│   ├── contactos[]
│   ├── servicios
│   ├── salud
│   └── observaciones
├── observacionesGenerales
├── coordenadas
└── estado
```

## Reglas

- `RelevamientoDraft` representa la carga completa.
- `HogarDraft` representa cada hogar dentro del predio.
- Un relevamiento puede tener varios hogares.
- Personas pertenecen a un hogar.
- Contactos pertenecen a un hogar.
- Servicios pertenecen a un hogar.
- Salud pertenece a un hogar.
- Observaciones del hogar pertenecen a un hogar.
- Vivienda pertenece al relevamiento completo.
- Coordenadas pertenecen al relevamiento completo.
- Observaciones generales pertenecen al relevamiento completo.

## Tipos temporales esperados

```text
RelevamientoDraft
HogarDraft
PersonaDraft
ContactoDraft
ServiciosDraft
SaludDraft
CoordenadasDraft
```

## Estados frontend sugeridos

```text
editando
guardando
guardado_local
pendiente_sincronizacion
error_guardado
finalizado
```

## Regla de adaptación

Cuando exista contrato backend real, el modelo temporal se mapeará desde adapters.

```text
RelevamientoDraft
  ↓ adapter
Payload backend futuro
```
