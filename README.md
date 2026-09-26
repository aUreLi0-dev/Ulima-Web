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
| `index.html` | Contenido de la página, metadatos (Open Graph, Twitter, favicon, canonical) y un script mínimo en `<head>` que aplica el tema guardado antes del primer pintado. Cada paso lleva en `data-beats` las zonas de su captura que se resaltan. |
| `styles.css` | Estilos. Por defecto las secciones van apiladas (celular, tableta y sin JS). Con JS, 900 px o más de ancho y 560 px o más de alto se activa el teléfono fijo al centro, así un celular apaisado, ancho pero bajo, sigue con las capturas apiladas, con el teléfono achicado hasta caber entero en la ventana. Incluye el marco del teléfono, los detalles animados sobre las capturas, el modo claro y oscuro y el modo sin movimiento. |
| `main.js` | Se carga con `defer`. Maneja el conmutador de tema, lee en vivo la versión, el peso y la fecha del APK desde la API pública de GitHub, anima el logo de la entrada, cambia la captura del teléfono según el paso que se lee y recorre en cada paso las zonas de la captura que explica el texto. |
| `assets/capturas/` | Capturas reales de la app en WebP, en versión clara y oscura, con 360 y 720 px de ancho. La página elige la del tema activo y el ancho según la pantalla. |
| `assets/qr-apk.svg` | Código QR que apunta a la descarga del APK. Se generó una vez con el paquete `qrcode` de npm y se verificó decodificándolo. |
| `assets/og-ulimaplus.jpg` | Imagen de 1200 x 630 px para compartir la página en redes, hecha con dos capturas reales, la vista de mapa de la malla y el horario, con el mismo marco de teléfono que la página. Las metaetiquetas la piden con `?v=2`, así las redes no siguen mostrando la versión anterior guardada en su caché; al cambiarla otra vez conviene subir ese número. |
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
rama local del frontend y no se publica. La prueba llega a cada pantalla por el mismo camino que un
alumno, con toques y arrastres, y además de la pantalla principal de cada paso guarda las
intermedias que el recorrido alterna. Entre ellas están la lista de la malla con su botón «Vista
mapa», el mapa al 60 % con los niveles 7, 8 y 9 enteros, la calculadora antes y después de anotar
el Examen Final en la hoja «Registrar Nota», el aviso «Hay un cruce» al guardar un bloque, la hoja
de un bloque en el horario y el día cancelado que deja, la pestaña de asesorías antes y después de
tocar «Asistiré» y el mensaje propio, el diálogo «¿Eliminar mensaje?» y la lápida del chat. Solo
las pantallas de Android de los dos primeros pasos de instalación son esquemas simples en SVG,
dentro de `index.html`, que toman los colores del tema.

Para reemplazar una captura se convierte el PNG nuevo a los dos anchos, por ejemplo con `cwebp`.
Las pantallas con `data-hi` (la malla, su vista de mapa, el horario, el día cancelado y la
calculadora final) tienen además una versión de 1170 px, que solo baja cuando una lupa amplía 1,3
veces o más, como en la insignia de la PC2, el birrete o las columnas del mapa.

```bash
cwebp -q 72 -m 6 -sharp_yuv -metadata none -resize 360 0 malla-claro.png -o assets/capturas/malla-claro-360.webp
cwebp -q 72 -m 6 -sharp_yuv -metadata none -resize 720 0 malla-claro.png -o assets/capturas/malla-claro-720.webp
cwebp -q 70 -m 6 -sharp_yuv -metadata none malla-claro.png -o assets/capturas/malla-claro-1170.webp
```

En el teléfono fijo, las pantallas de los pasos 2 en adelante llevan su fuente en `data-src` y
`data-srcset`, y `main.js` las carga cuando su paso se acerca, así la página no baja todas al
abrirse. La malla del tema activo baja sin esperar, porque es la primera pantalla que se ve.

Las capturas traen 24 pt libres arriba y 16 pt abajo. Ahí la página dibuja con HTML y CSS la barra
de estado (la hora 9:41, la señal, el wifi y la batería), la cámara y la barra de inicio, así que
las capturas no llevan marco. En cada pantalla, `data-sb` y `data-hb` dicen si la tinta de la barra
de estado y la de la barra de inicio va oscura (`o`) o clara (`c`), primero sobre la captura clara y
después sobre la oscura. Sin el atributo, la tinta es clara en los dos temas.

## Detalles animados

Cada paso tiene en `data-beats` los momentos que recorre la pantalla mientras su texto está activo,
separados por `|`. Un momento es una o varias zonas `x y ancho alto` en puntos de la captura, que
mide 390 x 844, separadas por coma. Una zona puede llevar un quinto número con el radio de sus
esquinas, que por defecto es 14 y con la mitad del lado la vuelve un círculo, y una marca para su
anillo, `~t` (al medio del borde de arriba), `~b` (al medio del de abajo), `~o` (del lado opuesto al
texto) o `~n` (sin anillo). Además, el momento puede llevar estas marcas.

- `pantalla:` al comienzo, cuando el momento se ve en otra captura que la del paso
  (`data-screen`). Sin ella, el momento usa la captura del paso.
- `*` antes de todo, para marcar un momento principal, que dura 1,5 s en lugar de 0,7 s. Con
  «reducir movimiento» se ven a la vez los principales, o el último si ninguno lo está.
- `=zoom` en una zona, para fijar cuánto la amplía su lupa. Las columnas del mapa llevan `=1.7`,
  porque sus nombres son chicos aunque la zona sea grande, y así se leen curso por curso.
- `@x y` al final, para sumar un anillo sobre un elemento chico, o `@x y ancho alto`, para rodearlo
  con una píldora de 3 puntos de aire, como la insignia de una evaluación.
- `^y ...` al final, para descubrir la conversación de la captura hasta cada una de esas alturas
  antes de resaltar la zona. Solo sirve en una pantalla con `data-rev="arriba abajo"`, donde una
  tapa del color del fondo del chat cubre las burbujas y se corre hacia abajo.

```html
<article class="step" data-screen="ulises" data-side="r"
  data-beats="horario: 7.3 693.3 69.4 69.4 34.7 | ulises: 46 274 319.8 89 ~o ^369 759 | *ulises: 46 453 319.8 278 ~o">
```

En cada momento el resto de la pantalla se oscurece un instante, con un 10 % de negro en el tema
claro y un 50 % en el oscuro, y después queda bajo un velo más suave, de un 6 % y un 25 %. La zona
sube en una lupa con un borde que late. La lupa amplía apenas las zonas grandes y hasta 2,6 veces
las chicas, como la insignia de una evaluación, una línea de texto o el birrete, y si no cabe se
corre lo justo para quedar dentro de la pantalla. Un anillo toca desde afuera un borde libre de la
zona, del lado del texto cuando hay lugar y si no arriba o abajo, así nunca cae sobre lo que
explica. Las zonas que empiezan junto a la cabecera naranja de la app llevan `~b`, porque arriba el
anillo se confundiría con ella. Si la lupa queda más baja que el anillo, como la insignia sin zoom,
el anillo va del todo afuera. En el texto se marca la frase que tiene el mismo número en `data-b`
(una frase puede llevar varios, separados por espacio). En escritorio, una línea punteada une el
texto con el canto del teléfono a la altura de ese anillo, sin entrar a la pantalla, y su punta sube
o baja por el canto de un anillo al siguiente. Al terminar el recorrido, el velo se levanta del todo
y quedan la lupa y el anillo sobre la pantalla en color. El velo se recorta con `clip-path` y las
lupas y los anillos nacen en su lugar y se mueven con `transform`, así que nada cambia la geometría
de la página ni suma desplazamientos de diseño (CLS).

El recorrido empieza a los 0,3 s de llegar al paso, los momentos de paso duran 0,7 s y el cambio de
pantalla, 0,25 s, así el primer momento principal de cada paso llega antes de los 2,5 s, aun para
quien baja sin detenerse. Al hacer clic en el texto de un paso o tocarlo sin arrastrar, o al
llevarle el foco con el teclado, y en celular también al tocar su captura, el recorrido se detiene y
deja su estado final. Pasar el mouse no lo detiene, porque el cursor suele quedar sobre el texto
mientras se lee, y desplazar la página, con la rueda o con el dedo, tampoco.

El botón «Pausar animaciones» va en la barra superior con el teléfono fijo y al comienzo de
Funciones con las capturas apiladas. Termina todos los recorridos en su estado final, muestra ya
terminados los que siguen y apaga lo que late, como los halos, los anillos, el resplandor del
teléfono y la flecha de la portada. La tecla Escape también pausa, y la pausa dura toda la visita.
El mismo botón, que pasa a decir «Reanudar animaciones», vuelve a recorrer el paso a la vista.

Las pantallas intermedias también son capturas reales. Un cambio dentro de la misma pantalla, como
una pestaña, un botón que cambia de estado o una hoja que se abre, lleva `data-cf` en su pantalla
del teléfono fijo y entra en su lugar en 0,2 s, sin deslizarse y encima de la anterior, que espera
entera debajo, así las dos nunca se ven a medias a la vez. En celular y tableta, cada figura suma
encima las pantallas intermedias de su paso y corre el mismo recorrido cuando queda a la vista, sin
tocar el desplazamiento. Entre dos pantallas intermedias, la que sale también espera bajo la que
entra, y las dos quedan encima de la tapa de las burbujas de Ulises, que solo cubre su propia
captura. En el paso 1 de la instalación, el esquema de Chrome muestra la descarga que avanza hasta
«Abrir» cuando el recorrido enciende su aviso, y en el paso 2 el permiso se enciende cuando el
recorrido llega a él. Las clases `is-dl` e `is-off` van en el vidrio, así la lupa y la figura del
celular muestran el mismo cambio.

Las zonas salen del `zonas.json` que la prueba de Flutter escribe junto a las capturas, así que al
cambiar una captura conviene revisar que sus zonas sigan en el mismo lugar.

## Accesibilidad

- Un solo `h1`, regiones con `header`, `nav`, `main` y `footer`, y un enlace para saltar al contenido.
- Cada captura lleva un texto alternativo que describe lo que muestra, y los dos esquemas de
  Android se leen como imagen con su descripción. Con el teléfono fijo, las capturas del teléfono
  son decorativas y el lector de pantalla lee las que acompañan a cada texto.
- Los números de los pasos de instalación son decorativos y cada título lleva un «Paso 1.» oculto
  para el lector de pantalla.
- Textos con contraste de 4,5 a 1 o más y foco visible en todos los controles. La ceja de cada paso
  y el rótulo «Próximamente» usan en el tema claro un naranja más oscuro (`--accent-sm`), porque
  quedan sobre el resplandor del teléfono. En escritorio, el
  paso activo es el del texto más cercano al centro de la ventana, así que el texto que se lee
  siempre está a contraste pleno. Los textos vecinos que asoman por arriba o por abajo quedan
  atenuados a propósito hasta que llegan al centro.
- Con «reducir movimiento» activado en el sistema no hay animaciones, el logo queda quieto y cada
  paso muestra, sin moverse, sin zoom ni oscurecer la captura, sus zonas principales a la vez, con
  un anillo por momento.
- El borde de la zona y el anillo laten unas pocas veces y se quedan quietos, y el recorrido de
  cada paso termina en unos segundos, con la captura otra vez en color. Hacer clic en el texto,
  tocarlo o llevarle el foco detiene el recorrido en su estado final.
- Como los recorridos y el resplandor se mueven más de 5 s en total, el botón «Pausar animaciones»
  (criterio 2.2.2 de WCAG) los detiene con el mouse, el dedo o el teclado. Tab lo alcanza en la
  barra, después de los enlaces, o justo después de la portada con las capturas apiladas, y Escape
  pausa desde cualquier lugar de la página.
- La barra de estado, la cámara, la barra de inicio y las copias ampliadas de cada zona son
  decorativas y quedan ocultas para el lector de pantalla.
