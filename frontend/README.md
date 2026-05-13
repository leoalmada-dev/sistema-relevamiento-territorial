# Frontend

Frontend web/PWA futura para tablets del Sistema de Relevamiento Territorial.

## Estado

FE-3: selección territorial con mocks.

Incluye:

- React;
- Vite;
- TypeScript;
- Bootstrap;
- React-Bootstrap;
- estructura inicial de carpetas;
- layout base pensado para tablet;
- navegación placeholder entre las 4 secciones del relevamiento;
- selección territorial Zona → Cuadrante → Predio con mocks locales;
- datos precargados del predio seleccionado.

No incluye todavía:

- formulario real;
- selección territorial conectada a backend real;
- hogares funcionales;
- personas por hogar;
- guardado local;
- mocks funcionales;
- services reales;
- adapters reales;
- conexión backend;
- geolocalización;
- PIN;
- PWA;
- mapas;
- panel operativo.

## Uso local

Desde esta carpeta:

```bash
npm install
npm run dev
```

Build de validación:

```bash
npm run build
```

## Regla de arquitectura

Las pantallas no deben consumir backend directamente.

El flujo esperado será:

```text
Pantallas React
  ↓
Hooks / estado frontend
  ↓
Modelo temporal frontend
  ↓
Services
  ↓
Adapters
  ↓
Mock actual o API futura
```

## Regla visual

La base visual usa Bootstrap y React-Bootstrap.

Evitar CSS artesanal por componente salvo necesidad justificada.
