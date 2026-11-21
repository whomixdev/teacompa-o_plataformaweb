# Te Acompaño

Plataforma de orientación en salud para personas mayores y sus familias en Lima. El directorio reúne 20 sedes con sus fuentes institucionales. Permite revisar los servicios, la cobertura, los requisitos y la ruta en Google Maps.

## Desarrollo y publicación

Ejecuta `python -m http.server 8000 --directory public` y abre `http://localhost:8000`. Usa `npm test` para las pruebas y `npm run build` para copiar el sitio a `dist/`. GitHub Pages sirve el contenido de `public/` desde la raíz de la rama `gh-pages`. Los enlaces internos son relativos.

## Datos y cuentas

Las fichas de `public/js/facilities.js` incluyen el alcance del horario, el canal de atención y los enlaces oficiales. Las guías por seguro están en `public/js/coverage.js`. Cada establecimiento administra su agenda. Una visita guardada en Te Acompaño es un recordatorio que la persona registra tras obtener su turno.

El perfil, las visitas y sus listas se conservan en IndexedDB en el navegador de origen. La sesión pertenece a la pestaña. La cuenta de demostración de Juan Carlos conserva sus citas de ejemplo. Las cuentas nuevas pueden crearse en «Iniciar sesión» → «Registrarme gratis». Un perfil personal preparado se activa con su archivo cifrado y su contraseña. Mantén estos archivos personales fuera del repositorio.

El formulario de reportes usa FormSubmit con confirmación inicial del buzón receptor. Si el servicio no confirma la solicitud, el formulario conserva los datos y permite redactar el mismo reporte en la aplicación de correo.
