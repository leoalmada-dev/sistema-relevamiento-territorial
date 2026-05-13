# Estructura frontend

## Objetivo

Proponer una estructura simple para mantener separado flujo, componentes, lógica, services, adapters y mocks.

## Estructura sugerida

```text
src/
├── app/
├── pages/
├── features/
│   └── relevamiento/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       ├── services/
│       ├── adapters/
│       ├── types/
│       └── mock/
└── shared/
    ├── components/
    ├── layout/
    └── utils/
```

## Uso de carpetas

- `app/`: configuración general, rutas y providers.
- `pages/`: pantallas generales no específicas del relevamiento.
- `features/relevamiento/`: módulo principal del formulario.
- `components/`: piezas visuales reutilizables del relevamiento.
- `pages/`: pantallas del flujo de relevamiento.
- `hooks/`: lógica de estado, navegación y guardado.
- `services/`: funciones internas del frontend.
- `adapters/`: transformación entre modelo frontend, mocks y backend futuro.
- `types/`: tipos internos temporales.
- `mock/`: datos simulados separados del código real.
- `shared/`: componentes, layout y utilidades genéricas.

## Regla

Las pantallas no deben llamar directo a `fetch` ni conocer estructuras crudas del backend.
