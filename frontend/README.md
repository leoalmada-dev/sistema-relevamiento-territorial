# Frontend

Frontend web/PWA futura para tablets del Sistema de Relevamiento Territorial.

## Estado

FE-10A: integración territorial real.

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
- datos precargados del predio seleccionado;
- resultado de visita visual con corte temprano;
- vivienda y hogares con estado temporal en React;
- personas y contactos asociados a cada hogar;
- servicios y salud asociados a cada hogar;
- observaciones generales, coordenadas placeholder y revisión final simulada;
- borrador local MVP con localStorage.

No incluye todavía:

- persistencia real de vivienda y hogares;
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


## Configuración de API territorial

Crear un archivo `.env` local a partir de `.env.example` cuando se trabaje contra la red interna.

Valores esperados:

- VITE_API_BASE_URL=http://10.100.0.10/sistema-censo/api/v1
- VITE_TERRITORIO_DATA_SOURCE=api
- VITE_CUADRANTE_IMAGE_BASE_URL=http://10.100.0.10/sistema-censo/zona1

Para trabajar sin red interna se puede usar:

- VITE_TERRITORIO_DATA_SOURCE=mock

La visualización de imágenes de cuadrante usa:

- VITE_CUADRANTE_IMAGE_BASE_URL=http://10.100.0.10/sistema-censo/zona1

La integración real actual cubre únicamente lectura territorial:

- /zonas
- /zonas/{id}/cuadrantes
- /cuadrantes/{id}/predios
- /predios/{id}

Nota operativa: si se prueba la API desde terminal en un equipo con proxy, puede ser necesario usar curl con --noproxy "*" para evitar bloqueo Fortinet sobre rutas internas.

Relevamientos, guardado servidor, borrador servidor y finalización real siguen fuera de alcance.

## Publicación en GitHub Pages

El frontend puede publicarse como sitio estático usando GitHub Pages.

Para la publicación pública se debe construir en modo `github-pages`, usando datos mock y sin depender de la red interna.

Valores esperados para el build público:

~~~text
VITE_TERRITORIO_DATA_SOURCE=mock
VITE_API_BASE_URL=
VITE_CUADRANTE_IMAGE_BASE_URL=
~~~

La base pública esperada para Vite es:

~~~text
/sistema-relevamiento-territorial/
~~~

El build público no debe consumir la API interna 10.100.x.x ni imágenes internas. Si no se configura base de imágenes, el visualizador de cuadrante muestra el mensaje de imagen no disponible.

<!-- API-3B-CONFIG-AMBIENTES:START -->
## Configuración de ambientes frontend/backend

Después de API-3A, la finalización del relevamiento queda controlada por entorno.

~~~text
VITE_RELEVAMIENTO_FINALIZATION_MODE=local
VITE_RELEVAMIENTO_FINALIZATION_MODE=backend
~~~

Importante:

- `local` no significa `localhost`.
- `local` significa finalización sin backend.
- `backend` significa finalización real contra API.
- En modo `backend`, `VITE_API_BASE_URL` es obligatorio.
- En modo `backend`, si el backend falla, el formulario y el borrador local no se limpian.
- Desde una PC local contra un servidor de prueba puede haber errores de CORS aunque la API responda desde navegador o servidor.

### GitHub Pages / demo pública

La demo pública debe usar datos mock y finalización local:

~~~env
VITE_TERRITORIO_DATA_SOURCE=mock
VITE_RELEVAMIENTO_FINALIZATION_MODE=local
VITE_API_BASE_URL=
VITE_CUADRANTE_IMAGE_BASE_URL=
~~~

El workflow actual de GitHub Pages no define explícitamente `VITE_RELEVAMIENTO_FINALIZATION_MODE`, pero el frontend usa `local` como valor por defecto. Por eso la demo pública no debería llamar backend.

### Desarrollo local visual sin backend

Para trabajar solo la interfaz:

~~~env
VITE_TERRITORIO_DATA_SOURCE=mock
VITE_RELEVAMIENTO_FINALIZATION_MODE=local
VITE_API_BASE_URL=
VITE_CUADRANTE_IMAGE_BASE_URL=
~~~

### Desarrollo local contra backend de prueba

Para probar integración real:

~~~env
VITE_TERRITORIO_DATA_SOURCE=api
VITE_RELEVAMIENTO_FINALIZATION_MODE=backend
VITE_API_BASE_URL=http://10.100.66.32:8000/api/v1
~~~

Advertencia: desde `http://localhost:5173` el navegador puede bloquear la comunicación por CORS si Laravel/infraestructura no permite ese origen.

### Servidor final interno

Pendiente de confirmar por infraestructura. Si frontend y API quedan bajo el mismo origen, podrían usarse URLs relativas:

~~~env
VITE_TERRITORIO_DATA_SOURCE=api
VITE_RELEVAMIENTO_FINALIZATION_MODE=backend
VITE_API_BASE_URL=/api/v1
~~~

o:

~~~env
VITE_API_BASE_URL=/sistema-censo/api/v1
~~~

según el path final definido.

### App Android embebida

Pendiente de confirmar si la app abre una URL HTTP/HTTPS del servidor o si carga assets locales.

Si abre una URL del servidor, debería usar la misma configuración del servidor final interno. Si carga assets locales, puede requerir URL absoluta de API y configuración CORS específica para WebView.
<!-- API-3B-CONFIG-AMBIENTES:END -->
