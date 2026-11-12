# Pulso Neón

Juego de ritmo y reflejos al estilo *Geometry Dash*, hecho con **Phaser 3** para el taller
"Setup, Desarrollo y Despliegue con Phaser 3" (ISWD823).

**Autora:** Sara Lizbeth Guayasamin Nacimba

**Landing page:** https://saraguayasamin.github.io/guayasamin-sara-jueg-gr3/

**Jugar directo:** https://saraguayasamin.github.io/guayasamin-sara-jueg-gr3/juego/

## Cómo se juega

Lumi corre sola al ritmo de la música. Tú decides cuándo saltar y cuándo lanzar su poder, y cualquier golpe te devuelve al inicio del nivel.

El poder es una onda de energía que destruye muros agrietados y naves enemigas. Gasta una de las 3 cargas de alma, que se recuperan con el tiempo y al destruir algo. Las naves aparecen de la nada, avisadas por una alerta `!`: se esquivan o se derriban.

| Acción | Control |
| --- | --- |
| Saltar / subir con la nave | `ESPACIO`, `↑`, `W`, clic o toque |
| Lanzar el poder | `X`, `Z`, `F`, clic derecho o botón PODER en pantalla táctil |
| Elegir nivel | `←` `→` |
| Modo práctica (en el menú) | `P` |
| Pausa | `ESC` o `P` |
| Sonido | `M` |

## Niveles

| Nivel | Dificultad | Qué añade |
| --- | --- | --- |
| Primer Pulso | Fácil | Pinchos, bloques, huecos, trampolines y esferas |
| Gravedad Cero | Media | Portales y esferas que invierten la gravedad |
| Tormenta | Difícil | Nave, túneles y portales de velocidad |

Cada nivel esconde 3 estrellas opcionales. El récord y las estrellas se guardan en el navegador.

## Estructura

| Archivo | Contenido |
| --- | --- |
| `index.html` | Landing page (el "menú de inicio" con historia, clasificación y créditos) |
| `juego/index.html` | Página del juego e importación de Phaser por CDN |
| `juego/game.js` | Configuración de Phaser, escenas, cámara, entrada y gráficos |
| `juego/sim.js` | Física determinista a paso fijo, sin dependencias |
| `juego/levels.js` | Diseño de los niveles |
| `juego/audio.js` | Música y efectos generados con Web Audio |
| `tests/verificar-niveles.js` | Bot que comprueba que cada nivel se puede completar |
| `.github/workflows/desplegar-pages.yml` | CI/CD: verifica los niveles y despliega el sitio en GitHub Pages |

## Ejecutar en local

Abre la carpeta en VS Code y usa **Open with Live Server** sobre `index.html` (landing) o `juego/index.html` (juego).

Para comprobar los niveles (requiere Node.js):

```bash
node --stack-size=30000 tests/verificar-niveles.js
```
