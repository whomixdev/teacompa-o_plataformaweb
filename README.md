# Te Acompaño

Plataforma peruana de orientación en salud para adultos mayores y familiares. Demostración en español desarrollada con HTML5, CSS3 y JavaScript modular. Usa únicamente información ficticia.

## Abrir en la computadora

Con Python instalado, ejecuta `python -m http.server 8000 --directory public` en la carpeta del proyecto y abre `http://localhost:8000`. En Windows también puedes usar `py` en lugar de `python`. En VS Code puedes abrir `public/index.html` con Live Server. Los módulos ES y el almacenamiento requieren servir los archivos por HTTP local o HTTPS.

## Probar

Abre **Consultar mi cita → Entrar con usuario de prueba** para ver la cita confirmada de Juan Carlos Gonzales. Puedes ingresar manualmente con `UsuarioPrueba@gmail.com` y la clave pública de demostración `TeAcompanoDemo26`. Su DNI ficticio es `00000000` y el código local de consulta es `246810`.

Para probar una cuenta vacía, cierra sesión desde **Mi cuenta** y selecciona **Registrarme gratis**. Desde la portada puedes buscar una sede, comparar horarios, revisar requisitos y solicitar atención para ti o para un familiar. Una sede de ejemplo confirma la reserva localmente. Otras reciben la solicitud para revisión simulada. La posta de Villa El Salvador representa una sede sin cupos.

Las citas confirmadas futuras permiten descargar un archivo de calendario. Puedes reprogramar o cancelar una cita local. Los reportes de corrección se guardan en el dispositivo. Las claves de registro se verifican con PBKDF2 y sal individual. Este acceso corresponde exclusivamente a datos de demostración. Quien controla el navegador puede modificar sus datos. El acceso rápido de Juan Carlos es público por diseño.

## Publicar en GitHub Pages

`public/` es el sitio completo. Para publicar desde una rama, copia **el contenido** de esa carpeta a la raíz de la rama de publicación y elige la rama y `/(root)` en **Settings → Pages**. Todos los enlaces internos y recursos utilizan rutas relativas y funcionan en una URL de proyecto. Para empaquetar también puedes ejecutar `npm run build`, que copia los mismos archivos a `dist/`. La aplicación no requiere instalar dependencias.

## Pruebas e integraciones

Ejecuta `npm test` con Node 22 o posterior. Los módulos se encuentran en `public/js/`.

- **Agenda y SIS.** `data.js` contiene sedes, servicios y horarios ficticios. Sustituye esa fuente por una API verificada. `storage.js` concentra la creación, reprogramación y cancelación. Una agenda real debe resolver los cupos y la autorización en el servidor.
- **Identidad.** `account.js` maneja perfiles locales y `consult.js` simula el código de verificación. Conecta un proveedor de identidad y un servicio de verificación en servidor antes de admitir pacientes reales.
- **Ubicación.** `ui.js` solicita la ubicación únicamente bajo demanda. Las coordenadas de las sedes son ilustrativas, el minimapa es esquemático y la distancia es en línea recta. El enlace abre Google Maps con un punto ilustrativo. El cálculo de tiempos requiere un proveedor de rutas.
- **Correo y WhatsApp.** La confirmación se representa en pantalla. Conecta en servidor un canal autorizado para enviar avisos reales. El formulario de corrección también requiere un receptor para enviarlos al equipo.
- **Persistencia.** IndexedDB contiene perfiles, solicitudes y reportes de prueba. La sesión pertenece a la pestaña. El navegador no sincroniza estos registros entre dispositivos, dominios ni sitios. La eliminación de los datos del sitio borra los perfiles locales.

La imagen de portada es ilustrativa. El símbolo y el logotipo corresponden a la identidad de Te Acompaño.
