# React Native UI Flow and Components

Purpose: Premium UI ohne Chaos, mit klarer Wiederverwendung.

## Layout Strategy
- Große UX-Änderungen als neue Komponenten kapseln, nicht in bestehende Screens hineindrücken.
- Screen bleibt Orchestrator, Komponenten enthalten die UI-Details.
- Wiederkehrende Action-Grids, Header-Muster und Cards zentralisieren.

## Styling Strategy
- Keine harten fontSize-Zahlen in Screen-Styles.
- typography/typeScale Tokens nutzen.
- spacing/radius/colors aus Theme nutzen.

## Modal and Edit Flows
- Ein Modal kann Create und Edit unterstützen, wenn Inputs sauber vorbefüllt werden.
- Long-Press Actions konsistent halten (zuerst edit/delete anbieten, dann action ausführen).

## Swipe and Card UX
- Swipe-Pages mit klarer Positionierung der Kernaktionen.
- Add-Flow als gleichwertige Karte integrieren, wenn es dem mental model hilft.
- Visuelle Unruhe reduzieren: wenige, klare Fokusflächen.

## Component Extraction Trigger
Extrahieren, wenn mindestens eines zutrifft:
- Gleiches UI in 2+ Screens.
- Ein Style-Block > 40 Zeilen mit gemischter Verantwortung.
- Ein Screen enthält sowohl Datenlogik als auch mehrere große Render-Abschnitte.
