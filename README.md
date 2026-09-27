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
`?intro=codigo` a la dirección. Sin el parámetro, cada visita sortea una de las tres, nunca la misma
de la visita anterior, que el navegador guarda en `localStorage` con la clave `ulimaplus-intro`.
Sin almacenamiento, el sorteo es entre las tres. Cualquier otro valor, como `?intro=constructor`,
se ignora y deja el sorteo.

La página sigue el tema claro u oscuro del sistema. El botón de la barra superior lo cambia y el
navegador recuerda la elección, así que en una computadora en modo claro basta con tocarlo una
vez para ver la página con el fondo oscuro.

## Cómo se recorre

La portada lleva el logo entero, la estrella de ocho rombos y «ULIMA++», que respira en reposo, y
el teléfono con el arranque de la app. El logo del arranque entra con una de las tres intros de la
app, Ensamble, Incremento o Código, y mientras la página espera repite la espera en bucle de su
intro, también el cursor que parpadea en Código. La salida hacia la app empieza una sola vez, en la
compu al bajar y en el celular sola al terminar la intro, y desde ahí corre por tiempo hasta el
final, así nunca queda a medias. Bajar antes de tiempo no corta la intro, porque solo adelanta la
salida hasta su fin (como mucho 1,33 s después del arranque nativo), igual que en la app, que la
empieza en max(fin de la intro, carga). En la salida, el panel naranja se recoge hasta la cabecera,
la estrella vuela a la estrella de la cabecera, los «++» caen sobre los del texto «ULIMA++» y la
malla sube a su lugar.

Después, el teléfono queda fijo mientras se lee y cambia de captura con cada paso.

- En la compu, con 900 px o más de ancho y 560 px o más de alto, va al centro y los textos pasan a
  su lado.
- En el celular y la tableta en vertical, con menos de 900 px de ancho y 500 px o más de alto, va
  arriba, bajo la barra y más chico, y el texto de cada paso sube por debajo con las mismas lupas,
  anillos y cambios de pantalla que en la compu.
- Un celular apaisado, ancho pero bajo, y la página sin JS muestran las capturas apiladas, cada una
  junto a su texto.

Ulises, con la imagen del chatbot de la app, va posado junto al teléfono y comenta cada paso en su
burbuja. Lo que dice sale de `data-uli`, en cada paso y en la portada, y de `data-uli-c` en la
portada del celular, que invita a bajar porque ahí no está el aviso «Baja y la app se abre». Cada
burbuja comenta lo que queda en la lupa al final del recorrido de su paso. Entre pasos vuela en arco
por fuera de la pantalla y, si cambia de lado, cruza por encima del teléfono. En la compu se posa
del lado contrario al texto, y en la instalación sobre el panel del QR. En el celular se apoya en el
canto derecho del teléfono, sobre el marco, y su burbuja va en la columna libre de al lado. En reposo
respira y parpadea, y al hablar asiente. Lo que dice también está en el texto de cada paso
(`.udice`), que se lee con las capturas apiladas y, con el teléfono fijo, queda para los lectores
de pantalla.

La burbuja busca el lugar que menos pisa junto a Ulises. La pantalla del teléfono y los módulos del
código QR pesan cien veces más que el resto, así que la burbuja nunca los pisa si hay otro lugar, y
también evita el texto activo y el botón de pausa. Sobre el panel del QR prueba además un ancho que
quepa en el hueco a cada lado de Ulises, porque en una compu baja no hay lugar encima de él, y junto
al teléfono, el hueco entero hasta el borde de la ventana. Si aun así no cabe libre, prueba una
burbuja compacta, con letra de 13,5 px, también en un celular bajo, donde así no pisa el botón de
pausa. En una compu de 600 px de alto puede rozar el borde de arriba del panel del QR y el margen
blanco del código, nunca sus módulos, porque con un patrón de posición tapado el código puede dejar
de leerse. Si ningún lugar evita el vidrio, los módulos del QR y el borde de la
ventana, la burbuja espera oculta hasta que haya lugar, como en el primer paso de la instalación en
una compu de 960 x 560 px. Se ubica con `translate`, y su cola queda
anclada en la esquina de arriba a la izquierda y llega a su lado también con `translate` (`--px` y
`--py`), así que ni cambiar de lugar ni cambiar la cola de lado suma desplazamientos de diseño
(CLS).

En el chat de la sección llega un «67» de un compañero, a los 4,9 s de empezar el paso, y en el
celular ese paso es más alto para que no se pase de largo. Una lupa lo agranda, el teléfono se
inclina 2 s como el truco de la app y Ulises responde «SIX SEVEN!!!» (`data-uli67`), que va con
`lang="en"` en su burbuja y en el texto del paso. Con movimiento
reducido, con la pausa o al tocar el texto, la respuesta va en la misma burbuja, debajo de su
comentario del paso, y si el vaivén ya empezó se corta al instante. Con la pausa puesta, el 67 llega
quieto, con la conversación ya subida. La pantalla `chat-67` es la captura del chat con la
conversación subida 38 puntos y la burbuja nueva dibujada en SVG, con las medidas y los colores de
las burbujas de la captura. El SVG va encima de la captura, que deja a la vista su línea y su barra
«Escribe un mensaje» desde los 767 puntos, y al subir la conversación una franja del color del chat
tapa la línea y la barra de la copia que sube, así no se repiten. La captura que va dentro del SVG
baja solo en el tema activo.

## Qué hace cada archivo

| Archivo | Qué hace |
| --- | --- |
| `index.html` | Contenido de la página, metadatos (Open Graph, Twitter, favicon, canonical) y un script mínimo en `<head>` que aplica el tema guardado y la pausa de la visita antes del primer pintado. Cada paso lleva en `data-beats` las zonas de su captura que se resaltan y en `data-uli` lo que dice Ulises. |
| `styles.css` | Estilos. Por defecto las secciones van apiladas (sin JS y en un celular apaisado). Con JS, 900 px o más de ancho y 560 px o más de alto se activa el teléfono fijo al centro, con el teléfono achicado hasta caber entero en la ventana, y con menos de 900 px de ancho y 500 px o más de alto, el teléfono fijo arriba. Incluye el marco del teléfono, los detalles animados sobre las capturas, a Ulises y su burbuja, el modo claro y oscuro y el modo sin movimiento. |
| `main.js` | Se carga con `defer`. Maneja el conmutador de tema, lee en vivo la versión, el peso y la fecha del APK desde la API pública de GitHub, anima el logo de la entrada, cambia la captura del teléfono según el paso que se lee, recorre en cada paso las zonas de la captura que explica el texto y mueve a Ulises y su burbuja. |
| `assets/capturas/` | Capturas reales de la app en WebP, en versión clara y oscura, con 360 y 720 px de ancho. La página elige la del tema activo y el ancho según la pantalla. |
| `assets/ulises-96.webp`, `assets/ulises-192.webp` | Ulises, con la imagen del chatbot de la app, para el que acompaña al teléfono y el de cada texto. |
| `assets/qr-apk.svg` | Código QR que apunta a la descarga del APK. Se generó una vez con el paquete `qrcode` de npm y se verificó decodificándolo. |
| `assets/og-ulimaplus.jpg` | Imagen de 1200 x 630 px para compartir la página en redes, hecha con dos capturas reales, la vista de mapa de la malla y el horario, con el mismo marco de teléfono que la página. Las metaetiquetas la piden con `?v=3`, así las redes no siguen mostrando la versión anterior guardada en su caché; al cambiarla otra vez conviene subir ese número. |
| `assets/favicon.svg`, `assets/favicon-32.png`, `assets/apple-touch-icon.png` | Ícono de la pestaña y de la pantalla de inicio, con el logo y sus «++». |
| `googlefa47f1607a3cd81d.html` | Archivo con el que Google Search Console verifica la propiedad del sitio. Google lo vuelve a consultar cada cierto tiempo, así que no se borra, no se renombra ni se edita, aunque la verificación ya esté hecha. |

## Datos del APK

El botón descarga siempre
https://github.com/meltiruiz/ULima_Frontend_IS2/releases/download/latest/ULimaPlus.apk.

`main.js` consulta `releases/tags/latest` de ese repositorio y toma del asset `ULimaPlus.apk` el
peso en MB decimales y la fecha, en la hora de Lima, y de las notas del release el número de build.
Guarda el resultado diez minutos en `sessionStorage`. Si la API falla, limita o tarda más de seis
segundos, quedan los valores de respaldo que ya trae `index.html` en los elementos con
`data-build`, `data-size` y `data-date`. Conviene actualizarlos cuando salga un build nuevo. Hoy
traen el build 76, de 72,1 MB, del 26 de septiembre de 2026, el primero con la bienvenida de Ulises.

## Capturas

Las pantallas del teléfono no se dibujan en HTML. Son capturas de la app renderizadas desde su
propio código con datos ficticios, a 1170 x 2532 px, con una prueba de Flutter que se corre en una
rama local del frontend y no se publica. Hoy son las del build 76, con la estrella del logo en la
cabecera. La prueba llega a cada pantalla por el mismo camino que un alumno, con toques y
arrastres, y además de la pantalla principal de cada paso guarda las intermedias que el recorrido
alterna. Entre ellas están la lista de la malla con su botón «Vista mapa», el mapa al 60 % con los
niveles 7, 8 y 9 enteros, la calculadora con las notas de la ULima antes y después de anotar el
Examen Final en la hoja «Registrar Nota», la pantalla «Notas oficiales», el aviso «Hay un cruce» al
guardar un bloque, la hoja de un bloque en el horario y el día cancelado que deja, la pestaña de
asesorías antes y después de tocar «Asistiré» y el mensaje propio, el diálogo «¿Eliminar
mensaje?», la lápida del chat, y la bienvenida con Ulises y el login dentro de su conversación,
primero con el código y después con la contraseña. Solo las pantallas de Android de los dos
primeros pasos de instalación son esquemas simples en SVG, dentro de `index.html`, que toman los
colores del tema.

Para reemplazar una captura se convierte el PNG nuevo a los dos anchos, por ejemplo con `cwebp`.
Las pantallas con `data-hi` (la malla, su vista de mapa, el horario, el día cancelado, la
calculadora antes y después del Examen Final, la ficha del curso, la bienvenida y la contraseña)
tienen además una versión de 1170 px, que solo baja cuando una lupa amplía 1,3 veces o más, como la
fila «Notas oficiales», las filas «ULima», el botón «Actualizar» de la asistencia o la pregunta de
la contraseña en el celular, o las columnas del mapa. Las demás no amplían tanto y no la necesitan.

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
después sobre la oscura. Sin el atributo, la tinta es clara en los dos temas. Con la misma forma,
`data-mk` dice si las lupas y los anillos van en naranja (`n`) o en blanco (`b`), porque sobre la
bienvenida clara, naranja de borde a borde, el naranja no se ve. Sin el atributo van en naranja.

La salida del arranque termina sobre la cabecera de la malla, así que sus destinos están medidos en
esa captura. La estrella de la cabecera mide 26 dp de punta a punta y tiene su centro en (33, 65),
y el texto «ULIMA++» empieza 10 dp después. Si la cabecera de la app cambia, hay que medir de nuevo
`HX`, `HY`, `KE` y `PP_X` en `main.js` y las ventanas `sp-hole-wm` y `sp-hole-pp` de `index.html`,
por las que se asoma el texto de la captura.

## Detalles animados

Cada paso tiene en `data-beats` los momentos que recorre la pantalla mientras su texto está activo,
separados por `|`. Un momento es una o varias zonas `x y ancho alto` en puntos de la captura, que
mide 390 x 844, separadas por coma. Una zona puede llevar un quinto número con el radio de sus
esquinas, que por defecto es 14 y con la mitad del lado la vuelve un círculo, y una marca para su
anillo, `~t` (al medio del borde de arriba), `~b` (al medio del de abajo), `~o` (del lado opuesto al
texto), `~r` (del lado derecho, en la compu y en el celular) o `~n` (sin anillo). Además, el momento
puede llevar estas marcas.

- `pantalla:` al comienzo, cuando el momento se ve en otra captura que la del paso
  (`data-screen`). Sin ella, el momento usa la captura del paso.
- `*` antes de todo, para marcar un momento principal, que dura 1,5 s en lugar de 0,7 s. Con
  «reducir movimiento» se ven a la vez los principales, o el último si ninguno lo está.
- `=zoom` en una zona, para fijar cuánto la amplía su lupa. Las columnas del mapa llevan `=1.7`,
  porque sus nombres son chicos aunque la zona sea grande, y así se leen curso por curso. La verde,
  que es la más alta, lleva `=1.6`, así su lupa deja a la vista las fichas del avance y su anillo
  cabe abajo, en el espacio libre sobre los electivos. Un segundo valor, como en `=1.25:1.7`, fija
  el zoom del teléfono chico del celular, y un `!` al final lo conserva con movimiento reducido,
  como en la lupa del 67 (`=2.4:3.2!`), que sin ella no se lee.
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
las chicas, como la insignia de una evaluación, una línea de texto o un botón, y si no cabe se
corre lo justo para quedar dentro de la pantalla. En un teléfono chico, el de arriba en el celular
o una captura apilada de menos de 250 px de ancho, las lupas amplían 1,5 veces más, hasta 3,4, sin
salir de la pantalla, y las zonas anchas, como las tarjetas, que ya ocupan todo el ancho, no crecen
más. La lupa de la fila «Notas oficiales» mira solo su ícono y sus dos renglones, así amplía 1,25
veces en la compu y 1,7 en el celular (`=1.25:1.7`), lo más que puede sin tapar «Cursos con notas».

Un anillo toca desde afuera un borde libre de la zona, del lado del texto cuando hay lugar y si no
arriba o abajo, así nunca cae sobre lo que explica. En el celular, con el texto debajo del teléfono,
va del lado derecho. Las zonas que empiezan junto a la cabecera naranja de la app llevan `~b`,
porque arriba el anillo se confundiría con ella, y la fila «Notas oficiales» también, para que el
anillo caiga en el hueco entre la fila y la tarjeta del curso. La insignia «EVAL PC2» del horario y
el día cancelado de las prácticas también llevan `~b`, así el anillo queda dentro de su bloque, bajo
la insignia o bajo «Este día está cancelado», y no sobre el bloque de arriba ni montado en el borde
de la lupa. La insignia amplía 2,6 veces en la compu y 2,5 en el celular (`=2.6:2.5`), lo más que
puede sin tapar el final de «INGENIERÍA DE SOFTWARE II». El botón «Asistiré · Cancelar» amplía 1,25
veces en la compu y 1,35 en el celular (`=1.25:1.35`), así su lupa no tapa «12 asistirán» y se ve
que la asesoría suma un asistente. La lupa del 67 lleva `~r`, porque en la
compu y en el celular solo el lado derecho de la burbuja nueva queda libre, y los botones de la
bienvenida van sin anillo (`~n`), porque su anillo caería sobre el canto de «Sí, entrar» y se
confundiría con él. Si la lupa queda más baja que el anillo, como la insignia sin zoom, el anillo va
del todo afuera. En el texto se marca la frase que tiene el mismo número en `data-b` (una frase
puede llevar varios, separados por espacio). En la compu, una línea punteada une el texto con el
canto del teléfono a la altura de ese anillo, sin entrar a la pantalla, y su punta sube o baja por
el canto de un anillo al siguiente. Al terminar el recorrido, el velo se levanta del todo y quedan
la lupa y el anillo sobre la pantalla en color. El velo se recorta con `clip-path` y las lupas y los
anillos nacen en su lugar y se mueven con `transform`, así que nada cambia la geometría de la página
ni suma desplazamientos de diseño (CLS).

El recorrido empieza a los 0,3 s de llegar al paso, los momentos de paso duran 0,7 s y el cambio de
pantalla, 0,25 s, así el primer momento principal de cada paso llega antes de los 2,5 s, aun para
quien baja sin detenerse. Entre dos momentos, la lupa y el anillo que salen se apagan en su lugar en
0,15 s y los nuevos entran a los 0,16 s. La lupa nueva se vuelve opaca en 0,1 s sin zoom, donde
calza con la captura de abajo, y recién después crece, así la copia ampliada y la captura nunca
muestran el texto doble, y hasta un momento de paso la muestra entera y con su zoom antes de seguir.
El último momento es el que queda en reposo, por eso cada paso termina en una pantalla en color. Una
pantalla que la app oscurece, como el aviso «Hay un cruce» del horario, va antes como momento de
paso, y el recorrido vuelve después al horario para reposar sobre el bloque de las prácticas. En
Notas, el recorrido pasa por «Notas oficiales» (`/mis-notas`), con la franja «Actualizar desde la
ULima», antes de simular el Examen Final, y sus lupas miran la franja y las filas, no la insignia
«Final», que en la semana 5 sale en rojo porque suma lo publicado sin normalizar. La última lectura
de la ULima es de las 08:42, antes de las 9:41 de la barra de estado. En el curso, el primer momento
amplía el botón «Actualizar» de la asistencia, que recarga desde la ULima, con su anillo, junto al
primer anuncio, y la frase «tu asistencia, que actualizas desde la ULima» se marca a la vez. En
«Instala y entra», Ulises recibe junto al logo con «¿Ya usas ULima++?» y el recorrido sigue al login
dentro de la conversación, con «Continuar con Google», el código y, al final, la contraseña con
«Entrar», que es lo que comenta Ulises desde el chat.

Al hacer clic en el texto de un paso o tocarlo sin arrastrar, o al llevarle el foco con el teclado,
y con las capturas apiladas también al tocar su captura, el recorrido se detiene y deja su estado
final. Pasar el mouse no lo detiene, porque el cursor suele quedar sobre el texto mientras se lee,
y desplazar la página, con la rueda o con el dedo, tampoco.

El botón «Pausar animaciones» va en la barra superior en la compu, abajo a la derecha del teléfono
fijo en el celular, donde muestra solo su ícono y guarda el rótulo para el lector de pantalla, y al
comienzo de Funciones con las capturas apiladas. Termina todos los recorridos en su
estado final, muestra ya terminados los que siguen y apaga lo que late, como los halos, los
anillos, el resplandor del teléfono, la flecha de la portada, el logo en reposo y a Ulises. El panel
del QR aparece en su lugar, sin subir, así Ulises, que se posa sobre él, tampoco se desliza. La tecla
Escape también pausa, y la pausa dura toda la visita. El mismo botón, que pasa a decir «Reanudar
animaciones», vuelve a recorrer el paso a la vista. El rótulo cambia por clase, y el script del
`<head>` pone esa clase antes del primer pintado cuando la pausa quedó guardada, así el botón no
cambia de ancho al abrir la página.

Las pantallas intermedias también son capturas reales. Un cambio dentro de la misma pantalla, como
una pestaña, un botón que cambia de estado o una hoja que se abre, lleva `data-cf` en su pantalla
del teléfono fijo y entra en su lugar en 0,2 s, sin deslizarse y encima de la anterior, que espera
entera debajo, así las dos nunca se ven a medias a la vez. Con las capturas apiladas, cada figura
suma encima las pantallas intermedias de su paso y corre el mismo recorrido cuando queda a la
vista, sin tocar el desplazamiento. Entre dos pantallas intermedias, la que sale también espera
bajo la que entra, y las dos quedan encima de la tapa de las burbujas de Ulises, que solo cubre su
propia captura. En el paso 1 de la instalación, el esquema de Chrome muestra la descarga que avanza
hasta «Abrir» cuando el recorrido enciende su aviso, y en el paso 2 el permiso se enciende cuando el
recorrido llega a él. Las clases `is-dl` e `is-off` van en el vidrio, así la lupa y la figura
apilada muestran el mismo cambio.

Las zonas salen del `zonas.json` que la prueba de Flutter escribe junto a las capturas, así que al
cambiar una captura conviene revisar que sus zonas sigan en el mismo lugar. La del botón
«Actualizar» (`actualizar`, en la ficha del curso) es su ícono y su texto con 6 puntos de aire, no
su área de toque de 48 puntos, así la lupa lo amplía hasta que se lee.

## Accesibilidad

- Un solo `h1`, regiones con `header`, `nav`, `main` y `footer`, y un enlace para saltar al contenido.
- Cada captura lleva un texto alternativo que describe lo que muestra, y los dos esquemas de
  Android se leen como imagen con su descripción. Con el teléfono fijo, las capturas del teléfono
  son decorativas y el lector de pantalla lee las que acompañan a cada texto.
- Ulises y su burbuja son decorativos. Lo que dice en cada paso está en el texto del paso, con su
  nombre y su imagen, y con el teléfono fijo queda solo para el lector de pantalla.
- Los números de los pasos de instalación son decorativos y cada título lleva un «Paso 1.» oculto
  para el lector de pantalla.
- Textos con contraste de 4,5 a 1 o más y foco visible en todos los controles. La ceja de cada paso
  y el rótulo «Nuevo» usan en el tema claro un naranja más oscuro (`--accent-sm`), porque quedan
  sobre el resplandor del teléfono. En la compu, el paso activo es el del texto más cercano al
  centro de la ventana, y en el celular, el último cuyo texto pasó la línea de lectura, a un 36 %
  de la zona libre bajo el teléfono, así que el texto que se lee siempre está a contraste pleno. Los
  textos vecinos quedan atenuados a propósito hasta que llegan a su lugar.
- Con «reducir movimiento» activado en el sistema no hay animaciones, vuelos ni vaivén. El logo
  aparece entero, la app entra de una vez, Ulises aparece en su lugar y no asiente al hablar, y cada
  paso muestra, sin moverse, sin zoom ni oscurecer la captura, sus zonas principales a la vez, con
  un anillo por momento. El 67 se muestra con su lupa y la respuesta de Ulises.
- El borde de la zona y el anillo laten unas pocas veces y se quedan quietos, y el recorrido de
  cada paso termina en unos segundos, con la captura otra vez en color. Hacer clic en el texto,
  tocarlo o llevarle el foco detiene el recorrido en su estado final.
- Como los recorridos, el resplandor, el logo y Ulises se mueven más de 5 s en total, el botón
  «Pausar animaciones» (criterio 2.2.2 de WCAG) los detiene con el mouse, el dedo o el teclado. Tab
  lo alcanza en la barra, después de los enlaces, en la compu, justo después de la barra en el
  celular y justo después de la portada con las capturas apiladas, y Escape pausa desde cualquier
  lugar de la página. Al pausar o reanudar, una región cortés (`role="status"`) dice «Animaciones en
  pausa.» o «Animaciones en marcha.», así el lector de pantalla también se entera de la pausa que
  llega con Escape, sin que nada le robe el foco.
- El aviso de la portada no parte «no es una app oficial» en dos líneas, así ninguna línea que asome
  bajo el teléfono fijo del celular dice «app oficial» sin el «no». Desde 480 px de ancho, donde la
  frase entera cabe en un renglón, «Proyecto académico de alumnos.» va arriba y la frase completa
  debajo.
- La barra de estado, la cámara, la barra de inicio y las copias ampliadas de cada zona son
  decorativas y quedan ocultas para el lector de pantalla.
