# RecipeMaker

Web app (PWA) para gestionar tu despensa, tus utensilios de cocina y descubrir qué recetas puedes preparar con lo que ya tienes.

## Funcionalidades

- **Despensa**: añade ingredientes escaneando su código de barras (Open Food Facts, con categorización automática) o dándolos de alta manualmente con sus valores nutricionales.
- **Utensilios**: marca qué utensilios tienes disponibles (sartén, horno, airfryer, wok, batidora, Thermomix, etc.) para que se tengan en cuenta al buscar recetas.
- **Recetas**: crea recetas con ingredientes, cantidades, pasos, tiempo de preparación/cocción, raciones y utensilios necesarios.
- **Qué puedo cocinar**: filtra recetas por tiempo disponible, por si puedes hacerlas ya con tu despensa actual, o por si dispones de los utensilios necesarios.
- **Nutrición**: cálculo automático de calorías, proteínas, grasas, carbohidratos, fibra, azúcares y sal por receta, total y por ración.
- **Lista de la compra**: se añaden productos igual que en la despensa (buscar, escanear o crear) o con un alta rápida de texto. Cada elemento muestra quién lo añadió, y lo que se agota en la despensa se apunta solo (etiqueta "Se agotó").
- **Productos vinculados a ingredientes genéricos**: un producto escaneado (p. ej. una marca de huevos) se vincula al ingrediente genérico que usan las recetas ("Huevo"), con sugerencia automática, para que cuente al comprobar qué puedes cocinar. Las cantidades se comparan convirtiendo g ↔ ml y ud. ↔ g cuando se conoce el peso medio.
- **Acceso privado**: login propio en el servidor de Vercel; solo entran los usuarios configurados.
- **Tema claro/oscuro**: selector con tres estados (claro, oscuro, según el sistema), persistido en el dispositivo.

## Stack técnico

- React + TypeScript + Vite, como PWA instalable (`vite-plugin-pwa`).
- Tailwind CSS para el UI.
- Dexie (IndexedDB) para almacenamiento 100% local, sin backend.
- `@zxing/browser` para el escaneo de códigos de barras con la cámara.
- [Open Food Facts](https://world.openfoodfacts.org/) como base de datos abierta de productos para el escaneo.

Todos los datos (despensa, ingredientes, recetas, utensilios, lista de la compra) se guardan localmente en el navegador de cada dispositivo (IndexedDB, base de datos `recipemaker`); no hay base de datos en servidor ni sincronización entre dispositivos. Borrar los datos del sitio en el navegador los elimina.

## Desarrollo

```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # build de producción (typecheck + build)
npm run lint      # oxlint
npm run preview  # sirve el build de producción
```

## Despliegue en Vercel

Proyecto Vite estándar, detectado automáticamente por Vercel (build command `vite build`, output `dist`). El `vercel.json` incluido añade el rewrite necesario para que las rutas de React Router (p. ej. `/recipes/abc123`) funcionen al recargar o compartir un enlace directo.

### Acceso privado (obligatorio)

`middleware.ts` (Vercel Routing Middleware) protege todo el sitio: sin sesión válida solo se sirve la pantalla de login. Configura en Vercel → Settings → Environment Variables (Production y Preview) y vuelve a desplegar:

| Variable | Valor |
| --- | --- |
| `APP_USERS` | Usuarios permitidos, `nombre:contraseña` separados por comas. Ej.: `Alex:una-frase-larga,María:otra-frase-larga`. El nombre es el que aparece en la lista de la compra. |
| `AUTH_SECRET` | Cadena aleatoria de 32+ caracteres (`openssl rand -base64 48`). Cambiarla cierra todas las sesiones. |

- Sin estas variables la app responde 503 (cerrada, nunca abierta).
- Dar o quitar acceso: editar `APP_USERS` y redesplegar. Una sesión de un usuario eliminado deja de valer en su siguiente acceso con conexión.
- Sesiones de 30 días en cookie `HttpOnly`/`Secure` firmada (HMAC-SHA256). Cerrar sesión: icono de salida en la cabecera.
- En local (`npm run dev`) el middleware no se ejecuta; la app pide un nombre para la lista de la compra.

Para desplegar: importa el repositorio en [vercel.com/new](https://vercel.com/new) (framework preset "Vite", con las variables de entorno de acceso indicadas arriba) o, con la CLI, `vercel --prod` desde la raíz del proyecto.
