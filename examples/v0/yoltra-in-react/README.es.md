# Yoltra vs Redux Toolkit – Demo en React Vite

> &nbsp;&nbsp;[ 🇵🇹 Versão Portuguesa](./README.pt.md)&nbsp; | &nbsp;[ 🇺🇸 English Version](./README.md)&nbsp; | &nbsp;[ 🇫🇷 Version française](./README.fr.md) 

Una pequena demostracion enfocada en React que aloja **ambas implementaciones de estado** lado a
lado -- la prueba definitiva esta en la comparacion de flamegraph:

- **Yoltra** (store orientado a eventos con eventos basados en canales y suscripciones de grano fino)
- **Redux Toolkit (RTK)** (stack estandar de Redux con `createSlice` + `createAsyncThunk`)

Usa este proyecto para ejecutar la UI localmente y reproducir el
**[Análisis del Profiler de React](./redux-yoltra-profiler.es.md)**.

## Estructura del proyecto

Ambas implementaciones exponen la misma UI y flujos de usuario (listar, agregar, actualizar,
eliminar). La aplicación de comparación monta cada página bajo rutas separadas para que puedas
perfilarlas de forma aislada.

- Ruta **/yoltra** → Página de Yoltra envuelta en su propio provider
- Ruta **/rtk** → Página de RTK envuelta en su propio provider

La aplicación es un proyecto **Vite** que vive dentro de un monorepo **Rush**.

## Prerequisitos

- **Node.js**: Se recomienda LTS (ej. 18.x).
- **pnpm**: usado por Rush para la gestión de dependencias
  ```bash
  npm i -g pnpm
  ```
- **Rush** (CLI global)
  ```bash
  npm i -g @microsoft/rush
  ```

## Clonar e inicializar

Clona este repositorio, luego navega a la carpeta del repo y ejecuta los siguientes comandos en
la terminal:

```bash

# Instalar todas las dependencias del monorepo
rush install          # o: rush update

# (opcional) Construir todo
rush build
```

## Ejecutar la aplicación (desarrollo)

La aplicación de comparación es una app Vite que enruta a cada implementación.

```bash
cd examples/yoltra-in-react
rushx dev             # igual que: pnpm dev
```

Abre **http://localhost:5173** (o lo que Vite imprima).

- Visita **/yoltra** para la página de Yoltra.
- Visita **/rtk** para la página de RTK.

## Build de producción y vista previa (para números estables de profiling)

Los builds de desarrollo incluyen verificaciones extra (ej., efectos del Modo Estricto de React
y transformaciones de desarrollo). Para tiempos más estables, perfila un build de
**producción**:

```bash
cd examples/yoltra-in-react
rushx build           # Build de producción con Vite
rushx preview         # Sirve el build de producción
# por defecto: http://localhost:4173
```

Luego abre `/yoltra` o `/rtk` en el servidor de vista previa.

## Usando el Profiler de React

1. **Instala React DevTools** en tu navegador (Chrome/Edge/Firefox).
2. Abre tu aplicación, luego abre DevTools → pestaña **Profiler**.
3. En la barra de herramientas del Profiler:
   - Activa **"Record profiling"**.
   - Presiona `Refresh` para que el profiler también capture la etapa de carga
   - (Opcional) Habilita _"Record why each component rendered"_ para obtener información más
     detallada.
4. Interactúa con la página para capturar frames específicos:
5. Inspecciona el flamegraph para cada commit:
   - ¿Qué componentes se re-renderizaron?
   - ¿Cuánto tiempo tomó el commit?
   - ¿Cuánto del árbol fue invalidado?

### Exportar perfiles

En el Profiler, haz clic en **Save profile…** para exportar un `.json` que puedes guardar para
reproducibilidad.

## Fuente de datos

El ejemplo de fetch usa MSW con datos simulados de
`https://jsonplaceholder.typicode.com/todos?id=0` por defecto. Puedes cambiar esto en las
acciones/hooks si es necesario. El acceso a la red no es requerido por defecto y debe ser
permitido por tu navegador / proxy de desarrollo si deshabilitas MSW.

## Licencia

Esta demostración es para propósitos de comparación/documentación. Consulta la raíz del
repositorio para detalles de la licencia.
