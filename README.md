# Impulse — diario de hábitos (PWA)
App web instalable, sin servidor ni cuenta. Datos en `localStorage` del dispositivo. HTML/CSS/JS sin librerías.
Demo: https://larryappsml.github.io/impulse/ (añade `?demo` para cargar 90 días de ejemplo en un navegador vacío).

## Funciones
Hábitos sí/no y de cantidad (mínimo o **a evitar** con máximo) · frecuencia diaria o días concretos (los no programados no rompen rachas) · reordenar · ánimo/energía 1-5 y nota diaria · tendencias 7/30/90 d (sin contar hoy) y correlaciones (≥14 días) · recordatorio diario · háptica · exportar/importar JSON · offline.

## Recordatorios: límites
Sin servidor de push no se puede programar una notificación exacta:
- Con la app abierta o al abrirla tras la hora elegida: notificación (si hay permiso) + aviso en el Diario.
- Chrome/Edge Android con la app instalada: Periodic Background Sync intenta avisar en segundo plano (frecuencia la decide el navegador, ~1 vez/12 h o menos, según uso).
- iPhone/iPad: notificaciones solo con la app añadida a la pantalla de inicio (iOS/iPadOS 16.4+); no hay Periodic Sync, así que solo avisa al abrirla. `navigator.vibrate` no existe en iOS (sin háptica).
- Firefox / Safari escritorio: sin Periodic Sync.

## Tests
`npm i playwright-core` y, con la app servida en :8765 (`python3 -m http.server 8765`), `node tests/t.js`.
