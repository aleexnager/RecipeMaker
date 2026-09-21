# RecipeMaker

Web app (PWA) para gestionar tu despensa, tus utensilios de cocina y descubrir qué recetas puedes preparar con lo que ya tienes.

## Funcionalidades

- **Despensa**: añade ingredientes escaneando su código de barras (Open Food Facts, con categorización automática) o dándolos de alta manualmente con sus valores nutricionales.
- **Utensilios**: marca qué utensilios tienes disponibles (sartén, horno, airfryer, wok, batidora, Thermomix, etc.) para que se tengan en cuenta al buscar recetas.
- **Recetas**: crea recetas con ingredientes, cantidades, pasos, tiempo de preparación/cocción, raciones y utensilios necesarios.
- **Qué puedo cocinar**: filtra recetas por tiempo disponible, por si puedes hacerlas ya con tu despensa actual, o por si dispones de los utensilios necesarios.
- **Nutrición**: cálculo automático de calorías, proteínas, grasas, carbohidratos, fibra, azúcares y sal por receta, total y por ración.

## Stack técnico

- React + TypeScript + Vite, como PWA instalable (`vite-plugin-pwa`).
- Tailwind CSS para el UI.
- Dexie (IndexedDB) para almacenamiento 100% local, sin backend.
- `@zxing/browser` para el escaneo de códigos de barras con la cámara.
- [Open Food Facts](https://world.openfoodfacts.org/) como base de datos abierta de productos para el escaneo.

Todos los datos (despensa, ingredientes, recetas, utensilios) se guardan localmente en el navegador del dispositivo; no hay servidor propio ni sincronización entre dispositivos.

## Desarrollo

```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # build de producción (typecheck + build)
npm run lint      # oxlint
npm run preview  # sirve el build de producción
```
