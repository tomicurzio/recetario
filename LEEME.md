# Recetario: notas para seguir trabajando

App web solo para celular (en compu se bloquea) para guardar recetas propias y cocinarlas paso a paso. Está escrita en español rioplatense (voseo).

## Archivos

- `public/index.html`: la app armada, un solo archivo. Es lo que se publica en Firebase Hosting.
- `firebase.json`, `.firebaserc`, `firestore.rules`: configuración de Firebase (hosting y reglas de seguridad).
- `fuente/`: el código separado en partes. `index.html` se arma con:
  ```
  cd fuente && cat head.html pre.js mid.js post.js > src.html && python3 build.py && rm src.html
  ```
  Para publicar (desde la raíz del repo):
  ```
  firebase deploy --only hosting,firestore:rules
  ```
  - `head.html`: estilos (tokens de color, tipografía, botones, vidrio) y el esqueleto HTML.
  - `pre.js`: íconos, ilustraciones y funciones chicas.
  - `mid.js`: guardado de datos, navegación entre pantallas y escalado de cantidades.
  - `post.js`: todas las pantallas, hojas, avisos y acciones.
  - `build.py`: mete los íconos que se usan y las ilustraciones (de `draws.json`) dentro del HTML.
  - `img/`: las tres ilustraciones (pasta, tarta, sopa).

## Cómo funciona hoy

- JavaScript sin frameworks.
- Cuentas con Firebase Authentication: Google o link por mail, sin contraseña.
- Datos en Firestore: `recipes/<id>` (públicas para quien tenga sesión; solo quien la subió la edita o la borra, campo `ownerId`) y `users/<uid>` (nombre, favoritas y progreso en modo cocina, privado).
- Las fotos se guardan dentro de la receta (no se usa Firebase Storage, que pide plan pago).
- Mantiene la pantalla prendida mientras cocinás.
- Cuando termina un timer, suena un aviso y el teléfono vibra.
- Se pueden importar recetas desde un archivo CSV.
- Las fotos se achican a 900 px antes de guardarse.

## Probar sin cuenta

Con un servidor local (`python3 -m http.server -d public`), abrí `http://localhost:8000/?demo`: entra como "Tomás" sin Firebase y guarda todo en el navegador. Desde la consola, `__demo.go('pantalla')` lleva a cualquier pantalla. Solo funciona en localhost.

## Diseño (Figma "Cooking", página Pantallas)

- **Tipografía:** Instrument Sans, solo Regular y Medium.
- **Color:** azul #3A5171 como acento.
- **Títulos:** de un solo color.
- **Vidrio:** solo en los elementos que flotan.
- **Layout:** auto layout en todo.
- **Botones:** sin íconos en los botones con texto.
- **Modo cocina:** un paso por pantalla, con el número grande.
- **Timer:** h:mm:ss cuando falta una hora o más, m:ss cuando falta menos. El tamaño queda fijo para que entre en una línea.
- **Fuera de alcance:** no hay filtros por categoría, ni importar desde foto o link, ni lista de compras.

## Lo próximo (decidido, sin hacer)

- Sacarla de claude.ai y hacerla un sitio aparte, gratis:
  - hosting en Cloudflare Pages o GitHub Pages;
  - Supabase o Firebase para cuentas, datos y fotos.
- Entrar con Google o con un link por mail, sin contraseña.
- Todas las recetas son públicas entre quienes usan la app. Cada persona se guarda las que quiere con el corazón (favoritas). No existe la opción de compartir un recetario.
- Ya está diseñado en Figma, en la sección "Cuenta y perfil":
  - Bienvenida, Tu email, Revisá tu mail y Tu nombre;
  - la pantalla de inicio con la inicial del perfil;
  - Perfil;
  - el caso "Este recetario es privado" (falta decidir si se queda).
- Pendiente en la app: la pantalla de receta como en Figma (la portada más alta y el botón justo debajo de los ingredientes) y botones de texto sin íconos.
