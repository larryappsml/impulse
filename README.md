# Impulse — diario de hábitos (PWA)
App web instalable, sin servidor ni cuenta. Datos en `localStorage` del dispositivo. HTML/CSS/JS sin librerías.
Demo: https://larryappsml.github.io/impulse/ (añade `?demo` para cargar 90 días de ejemplo en un navegador vacío).

## Funciones (v1.7 · fase 7)
Catálogo de 55 hábitos en 8 categorías con buscador · Impulse score 0-100 con desglose y explicación · check-in matinal/nocturno · impacto de hábitos sobre score/sueño/calidad/energía/ánimo · calendario anual · mejores rachas · resumen semanal · iconos SVG propios · modo oscuro opcional · splash.

## Novedades de v1.7
Favoritos: fija hábitos desde Añadir para mostrarlos al principio del Diario, sin alterar su historial. Los insights comparan solo registros explícitos y requieren al menos cinco observaciones de cada grupo. Se conserva la experiencia PWA gratuita y los datos en el dispositivo.

## Novedades de v1.6
Impulse Score con pesos fijos: constancia 40 %, sueño 25 %, actividad 20 %, bienestar 15 %. Los apartados ausentes no redistribuyen sus puntos y la puntuación se etiqueta como provisional. La constancia diaria usa todos los hábitos programados, no solo los registrados. Esto evita puntuaciones artificialmente altas con uno o dos registros.

## Novedades de v1.5
Perspectiva semanal contextual con cobertura y días registrados, cálculos de actividad que excluyen entradas ausentes, y aviso de actualización de versión en la PWA. Una app de la pantalla de inicio puede seguir sirviendo recursos de una versión anterior hasta que el service worker actualice y la app vuelva a cargarse.

## Novedades de v1.4
Los hábitos a evitar de tipo sí/no requieren marcar **No** (evitado) o **Sí** (ocurrió). Sin registro no cuentan como cumplidos. Los límites de cantidad permiten registrar cero explícitamente. La constancia del score se calcula con registros disponibles. El Diario indica cuántos hábitos se han registrado. Las tendencias respetan huecos de datos y se mantiene la exportación CSV en Ajustes.

## Funciones previas
Hábitos sí/no y de cantidad (mínimo o **a evitar** con máximo) · frecuencia diaria o días concretos (los no programados no rompen rachas) · reordenar · ánimo/energía 1-5 y nota diaria · tendencias 7/30/90 d (sin contar hoy) y correlaciones (≥14 días) · recordatorio diario · háptica · exportar/importar JSON · offline.

## Recordatorios: límites
Sin servidor de push no se puede programar una notificación exacta:
- Con la app abierta o al abrirla tras la hora elegida: notificación (si hay permiso) + aviso en el Diario.
- Chrome/Edge Android con la app instalada: Periodic Background Sync intenta avisar en segundo plano (frecuencia la decide el navegador, ~1 vez/12 h o menos, según uso).
- iPhone/iPad: notificaciones solo con la app añadida a la pantalla de inicio (iOS/iPadOS 16.4+); no hay Periodic Sync, así que solo avisa al abrirla. `navigator.vibrate` no existe en iOS (sin háptica).
- Firefox / Safari escritorio: sin Periodic Sync.

## Tests
`npm i playwright-core` y, con la app servida en :8765 (`python3 -m http.server 8765`), `node tests/t.js`.
