# JE Soluciones Electrónica y Tecnología

Sitio web comercial estático para JE Soluciones. Usa HTML, CSS y JavaScript nativos, no necesita un proceso de compilación, paquetes npm, base de datos ni servicios de pago.

## Estructura

- `index.html`: portada, cobertura general, contacto y datos estructurados.
- `servicios.html`: reparación, electrónica, equipos y empresas.
- `je-ia.html`: orientación interactiva que se ejecuta en el navegador.
- `herramientas.html`: guías gratuitas; no simulan mediciones del equipo.
- `trabajos.html`: áreas de trabajo y espacio para casos y reseñas autorizados.
- `preguntas-frecuentes.html`, `privacidad.html`, `404.html`.
- `assets/css/site.css`: estilos responsive y accesibilidad visual.
- `assets/js/site.js`: menú, JE IA, herramientas y enlace de WhatsApp.
- `scripts/check_site.py`: comprobaciones locales con la biblioteca estándar de Python.
- `robots.txt`, `sitemap.xml`, `favicon.svg`, `CNAME` para el dominio previsto.

## Desarrollo local

Se necesita Python 3 para servir el sitio localmente. Desde esta carpeta ejecuta:

```powershell
python -m http.server 8000
```

Abre `http://localhost:8000`. Detén el servidor con `Ctrl+C`.

## Comprobaciones

No hay una suite de pruebas de navegador ni dependencias de compilación. Ejecuta las validaciones estáticas incluidas:

```powershell
python scripts/check_site.py
node --check assets/js/site.js
node scripts/test_jeia.js
```

La primera revisa estructura y cierres HTML, títulos, metadatos, JSON-LD, enlaces internos y fragmentos, recursos locales, sitemap, robots.txt, número de WhatsApp y los límites de seguridad del texto libre de JE IA. La segunda prueba orientaciones, codificación del borrador y una entrada con etiquetas HTML para confirmar que permanece como texto. No envían datos ni abren WhatsApp.

## WhatsApp y datos comerciales

- El número oficial `573183310300` se configura en `WHATSAPP_NUMBER`, al inicio de `assets/js/site.js`. Formato: indicativo y número, solo dígitos. Los botones abren un borrador de mensaje para que la persona lo revise y lo envíe.
- Los textos de servicios, el área de atención, contacto y preguntas están en las páginas HTML correspondientes.
- El JSON-LD de negocio local está en `index.html`. Solo contiene el nombre, URL, teléfono confirmado y áreas de servicio indicadas. Dirección, horario y coordenadas quedan fuera hasta que JE los confirme.
- Google puede requerir una dirección para ciertos resultados enriquecidos de negocio local. No se agregó ninguna porque no ha sido confirmada; no se debe inventar para superar una validación.
- Actualiza títulos, descripciones, canonicals y metadatos sociales en cada HTML si cambia el dominio o el contenido.
- Añade fotos propias optimizadas y casos o reseñas únicamente con autorización. No hay reseñas, garantías, horarios ni dirección inventados en el proyecto.

## Git

La rama principal local es `main`. Antes de enviar cambios, revisa:

```powershell
git status
git add .
git diff --cached --check
git diff --cached
```

Para iniciar el historial cuando estés listo:

```powershell
git commit -m "Crear sitio comercial de JE Soluciones"
```

Configura el remoto con la URL del repositorio que crees en GitHub. No se configuró remoto ni se hizo push.

## GitHub Pages y dominio

1. Crea un repositorio en GitHub y sube la rama `main` cuando decidas publicarla.
2. En **Settings → Pages**, publica desde `main` y la carpeta raíz (`/`). Este sitio usa rutas desde la raíz, como `/assets/css/site.css`; si se publica en la subruta de un proyecto sin dominio propio, habría que adaptar esas rutas.
3. El archivo `CNAME` ya contiene `jesolucionesdosquebradas.com`; selecciona ese dominio personalizado en Pages.
4. Configura los registros DNS indicados por GitHub, habilita HTTPS y elige una sola URL canónica (dominio raíz o `www`). Si eliges `www`, ajusta canonicals, sitemap y robots para que coincidan.
5. Después de que el DNS y HTTPS estén activos, comprueba portada, rutas internas, 404, sitemap y el borrador de WhatsApp. Añade el dominio a Search Console y envía el sitemap.

El sitio está preparado para servirse desde la raíz de `https://jesolucionesdosquebradas.com/`; incluir `CNAME` no configura DNS, conecta el dominio ni publica el sitio.
