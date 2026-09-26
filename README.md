# Ulima-Web

Landing de ULima++, la app para alumnos de la Universidad de Lima. Se publica en
https://ulimaweb.vercel.app/ desde la rama `main`.

ULima++ es un proyecto académico de alumnos del curso Ingeniería de Software II. No es una app
oficial de la Universidad de Lima ni la representa.

## Verla en local

Es un sitio estático, sin build ni dependencias. Basta con servir la carpeta raíz.

```bash
python3 -m http.server 8000
# o bien
npx serve .
```

Después se abre http://localhost:8000/. Abrir `index.html` con doble clic también funciona, pero
algunos navegadores bloquean la consulta a la API de GitHub desde `file://` y la página muestra
entonces los datos de respaldo del APK.

Para revisar una intro concreta del logo se agrega `?intro=ensamble`, `?intro=incremento` o
`?intro=codigo` a la dirección. Sin el parámetro, cada visita sortea una de las tres.

La página sigue el tema claro u oscuro del sistema. El botón de la barra superior lo cambia y el
navegador recuerda la elección, así que en una computadora en modo claro basta con tocarlo una
vez para ver la página con el fondo oscuro.

## Qué hace cada archivo

| Archivo | Qué hace |
| --- | --- |
| `index.html` | Contenido de la página, metadatos (Open Graph, Twitter, favicon, canonical) y un script mínimo en `<head>` que aplica el tema guardado antes del primer pintado. |
| `styles.css` | Estilos. Por defecto las secciones van apiladas (celular, tableta y sin JS). Con JS y 900 px o más se activa el teléfono fijo al centro. Incluye el modo claro y oscuro y el modo sin movimiento. |
| `main.js` | Se carga con `defer`. Maneja el conmutador de tema, lee en vivo la versión, el peso y la fecha del APK desde la API pública de GitHub, anima el logo de la entrada y cambia la captura del teléfono según el paso que se lee. |
| `assets/capturas/` | Capturas reales de la app en WebP, en versión clara y oscura, con 360 y 720 px de ancho. La página elige la del tema activo y el ancho según la pantalla. |
| `assets/qr-apk.svg` | Código QR que apunta a la descarga del APK. Se generó una vez con el paquete `qrcode` de npm y se verificó decodificándolo. |
| `assets/og-ulimaplus.jpg` | Imagen de 1200 x 630 px para compartir la página en redes, hecha con dos capturas reales. |
| `assets/favicon.svg`, `assets/favicon-32.png`, `assets/apple-touch-icon.png` | Ícono de la pestaña y de la pantalla de inicio, con el logo y sus «++». |

## Datos del APK

El botón descarga siempre
https://github.com/meltiruiz/ULima_Frontend_IS2/releases/download/latest/ULimaPlus.apk.

`main.js` consulta `releases/tags/latest` de ese repositorio y toma del asset `ULimaPlus.apk` el
peso en MB decimales y la fecha, en la hora de Lima, y de las notas del release el número de build.
Guarda el resultado diez minutos en `sessionStorage`. Si la API falla, limita o tarda más de seis
segundos, quedan los valores de respaldo que ya trae `index.html` en los elementos con
`data-build`, `data-size` y `data-date`. Conviene actualizarlos cuando salga un build nuevo.

## Capturas

Las pantallas del teléfono no se dibujan en HTML. Son capturas de la app renderizadas desde su
propio código con datos ficticios, a 1170 x 2532 px, con una prueba de Flutter que se corre en una
rama local del frontend y no se publica. Solo las pantallas de Android de los dos primeros pasos de
instalación son esquemas simples en SVG, dentro de `index.html`, que toman los colores del tema.
Para reemplazar una captura se convierte el PNG nuevo a los dos anchos, por ejemplo con `cwebp`.

```bash
cwebp -q 72 -m 6 -sharp_yuv -metadata none -resize 360 0 malla-claro.png -o assets/capturas/malla-claro-360.webp
cwebp -q 72 -m 6 -sharp_yuv -metadata none -resize 720 0 malla-claro.png -o assets/capturas/malla-claro-720.webp
```

## Accesibilidad

- Un solo `h1`, regiones con `header`, `nav`, `main` y `footer`, y un enlace para saltar al contenido.
- Cada captura lleva un texto alternativo que describe lo que muestra, y los dos esquemas de
  Android se leen como imagen con su descripción. Con el teléfono fijo, las capturas del teléfono
  son decorativas y el lector de pantalla lee las que acompañan a cada texto.
- Los números de los pasos de instalación son decorativos y cada título lleva un «Paso 1.» oculto
  para el lector de pantalla.
- Textos con contraste de 4,5 a 1 o más y foco visible en todos los controles. En escritorio, el
  paso activo es el del texto más cercano al centro de la ventana, así que el texto que se lee
  siempre está a contraste pleno. Los textos vecinos que asoman por arriba o por abajo quedan
  atenuados a propósito hasta que llegan al centro.
- Con «reducir movimiento» activado en el sistema no hay animaciones y el logo queda quieto.
