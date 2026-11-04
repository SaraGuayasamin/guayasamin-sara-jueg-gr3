# Pulso Neón

Juego de ritmo y reflejos al estilo *Geometry Dash*, hecho con **Phaser 3** para el taller
"Setup, Desarrollo y Despliegue con Phaser 3" (ISWD823).

**Autora:** Sara Lizbeth Guayasamin Nacimba

**Jugar:** https://2026b-sof-jueg-gr3.github.io/guayasamin-sara-jueg-gr3/

## Cómo se juega

El cubo avanza solo. Tú decides cuándo saltar, y cualquier golpe te devuelve al inicio del nivel.

| Acción | Control |
| --- | --- |
| Saltar / subir con la nave | `ESPACIO`, `↑`, `W`, clic o toque |
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
| `index.html` | Página e importación de Phaser por CDN |
| `game.js` | Configuración de Phaser, escenas, cámara, entrada y gráficos |
| `sim.js` | Física determinista a paso fijo, sin dependencias |
| `levels.js` | Diseño de los niveles |
| `audio.js` | Música y efectos generados con Web Audio |
| `tests/verificar-niveles.js` | Bot que comprueba que cada nivel se puede completar |

## Ejecutar en local

Abre la carpeta en VS Code y usa **Open with Live Server** sobre `index.html`.

Para comprobar los niveles (requiere Node.js):

```bash
node --stack-size=30000 tests/verificar-niveles.js
```
