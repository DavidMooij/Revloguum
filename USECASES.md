# Revloguum: Funktionale Anwendungsfälle

Dieses Dokument beschreibt aus Sicht der Nutzerinnen und Nutzer, was in Revloguum getan werden kann. Es beschreibt Abläufe, Varianten, Voraussetzungen, Eingabeprüfungen und Ergebnisse, aber keine technische Umsetzung.

## Haftungsausschluss

**This software is provided "as is", without warranty of any kind. Use it at your own risk.**

Revloguum übernimmt keine Gewähr für die Richtigkeit, Vollständigkeit oder rechtzeitige Anzeige von Erinnerungen, Berechnungen, Berichten, gespeicherten Angaben und Dokumentationen. Markdown-Dateien in diesem Repository können unvollständig, veraltet oder falsch sein. Sie beschreiben beabsichtigtes oder beobachtetes Verhalten, sind aber keine verbindliche Zusicherung, dass sich die Software exakt wie dokumentiert verhält. Die App und ihre Dokumentation ersetzen keine professionelle technische, rechtliche, versicherungsbezogene, steuerliche oder finanzielle Beratung. Soweit gesetzlich zulässig, haften Autorinnen, Autoren und Mitwirkende nicht für Schäden, Datenverlust, versäumte Wartungen, versäumte Zahlungen oder andere Folgen der Nutzung der Software oder ihrer Dokumentation. Die vollständigen Gewährleistungs- und Haftungsbedingungen stehen in der [MIT-Lizenz](LICENSE).

## 1. Grundlagen

### 1.1 Zielgruppe

Revloguum richtet sich an Personen, die eines oder mehrere Fahrzeuge verwalten und deren Services, Tankvorgänge, Zahlungen und laufende Kosten nachvollziehbar dokumentieren möchten.

### 1.2 Grundannahmen

- Die App kann ohne Benutzerkonto verwendet werden.
- Die persönlichen Fahrzeugdaten bleiben lokal auf dem Gerät.
- Viele Aktionen benötigen ein bereits angelegtes Fahrzeug.
- Deutsch und Englisch stehen als Oberflächensprachen zur Verfügung.
- Geldbeträge werden in Schweizer Franken dargestellt.
- Kilometerstände werden fahrzeugbezogen geführt.

### 1.3 Zentrale Bereiche

- Das Dashboard zeigt den aktuellen Zustand des ausgewählten Fahrzeugs.
- Die Garage enthält alle angelegten Fahrzeuge.
- Die Einstellungen enthalten Exporte, Datensicherung, Erinnerungen und Verwaltungsfunktionen.
- Fahrzeugspezifische Unterseiten enthalten Servicehistorie, Tankhistorie, Zahlungshistorie und Auswertungen.

## 2. App starten und Grundzustand laden

### UC-001: App öffnen

**Ziel:** Die zuletzt vorhandenen Fahrzeugdaten und Einstellungen verwenden.

**Ablauf:**

1. Die Person öffnet Revloguum.
2. Die App lädt lokale Daten und persönliche Anzeigeeinstellungen.
3. Bestehende Erinnerungen werden mit den aktuellen Fahrzeugdaten abgeglichen.
4. Nach erfolgreichem Laden erscheint die Hauptnavigation.

**Varianten und Ergebnisse:**

- Sind noch keine Fahrzeuge vorhanden, zeigt das Dashboard einen leeren Zustand mit einer Möglichkeit zum Anlegen des ersten Fahrzeugs.
- Können die lokalen Daten nicht geöffnet werden, wird statt der normalen App eine Fehlermeldung angezeigt.
- Kehrt die App aus dem Hintergrund zurück, werden geplante Erinnerungen erneut abgeglichen.

## 3. Dashboard

### UC-010: Fahrzeugstatus überblicken

**Voraussetzung:** Mindestens ein Fahrzeug ist vorhanden.

**Ablauf:**

1. Die Person öffnet das Dashboard.
2. Sie sieht das aktuell ausgewählte Fahrzeug mit Name und Kilometerstand.
3. Sie sieht den letzten Tankvorgang oder einen Hinweis, wenn noch keiner existiert.
4. Sie sieht, ob Services überfällig sind.
5. Sie sieht den nächsten anstehenden Service.
6. Sie sieht, ob Zahlungen überfällig sind.
7. Sie sieht die nächste anstehende wiederkehrende Zahlung.
8. Sie sieht einen kurzen, zum Kilometerstand passenden Fahrzeughinweis.
9. Sie kann die jeweilige Kachel öffnen, um zur passenden Historie zu gelangen.

**Sonderfälle:**

- Ohne konfigurierte Serviceintervalle wird kein künstlicher Fälligkeitstermin behauptet.
- Ohne wiederkehrende Zahlungen wird ein entsprechender Leerhinweis gezeigt.
- Überfällige Punkte werden deutlich von unkritischen Zuständen unterschieden.

### UC-011: Aktives Fahrzeug wechseln

**Voraussetzung:** Mehrere Fahrzeuge sind vorhanden.

**Ablauf:**

1. Die Person öffnet die Fahrzeugauswahl im Dashboard.
2. Sie wählt ein anderes Fahrzeug.
3. Das Dashboard lädt Tankstatus, Services, Zahlungen und Fälligkeiten des gewählten Fahrzeugs.
4. Nachfolgende Schnellaktionen beziehen sich auf dieses Fahrzeug.

### UC-012: Ersten Fahrzeugdatensatz vom Dashboard anlegen

**Voraussetzung:** Es ist noch kein Fahrzeug vorhanden.

**Ablauf:**

1. Das Dashboard zeigt den leeren Zustand.
2. Die Person wählt „Fahrzeug hinzufügen“.
3. Das Formular zum Anlegen eines Fahrzeugs wird geöffnet.

### UC-013: Tankvorgang per Schnellaktion erfassen

**Voraussetzung:** Ein aktives Fahrzeug ist ausgewählt.

**Ablauf:**

1. Die Person betätigt die Tank-Schnellaktion.
2. Die schrittweise Tankeingabe öffnet sich für das aktive Fahrzeug.
3. Nach dem Speichern werden Dashboard, Kilometerstand und Tankauswertungen aktualisiert.

## 4. Garage und Fahrzeuge

### UC-020: Alle Fahrzeuge ansehen

**Ablauf:**

1. Die Person öffnet die Garage.
2. Jedes angelegte Fahrzeug wird mit seinen wesentlichen Angaben dargestellt.
3. Bei mehreren Fahrzeugen kann zwischen den Fahrzeugkarten gewechselt werden.
4. Eine zusätzliche Karte ermöglicht das Anlegen eines weiteren Fahrzeugs.
5. Der Stift auf einer Fahrzeugkarte öffnet die Bearbeitung der Stammdaten.
6. Die vier Kacheln öffnen Servicehistorie, Tankhistorie, Zahlungshistorie oder Auswertung.
7. Die freie Fläche der Fahrzeugkarte öffnet die Fahrzeugverwaltung.

### UC-021: Fahrzeug anlegen

**Ablauf:**

1. Die Person startet „Fahrzeug hinzufügen“.
2. Sie wählt den Fahrzeugtyp Motorrad, Auto oder Sonstiges.
3. Sie kann ein Fahrzeugbild aus der Galerie auswählen.
4. Sie gibt Hersteller und Modell ein.
5. Sie kann Baujahr und Spitzname ergänzen.
6. Sie gibt den aktuellen Kilometerstand ein.
7. Sie gibt die Standard-Tankmenge ein.
8. Sie kann einen Standardpreis pro Liter hinterlegen.
9. Sie speichert das Fahrzeug.

**Pflichtangaben und Prüfungen:**

- Hersteller darf nicht leer sein.
- Modell darf nicht leer sein.
- Kilometerstand muss eine gültige, nicht negative Zahl sein.
- Die Standard-Tankmenge muss eine gültige Zahl grösser als null sein.
- Ungültige Angaben verhindern das Speichern und werden im Formular kenntlich gemacht.

**Ergebnis:** Das Fahrzeug erscheint in der Garage und kann als aktives Fahrzeug verwendet werden.

### UC-022: Fahrzeugbild auswählen oder ersetzen

**Ablauf:**

1. Die Person tippt im Fahrzeugformular auf den Bildbereich.
2. Sie wählt ein Bild aus der Gerätegalerie.
3. Eine Vorschau ersetzt den bisherigen Platzhalter oder das bisherige Bild.
4. Beim Speichern wird das neue Bild dem Fahrzeug zugeordnet.

**Variante:** Wird das Bearbeiten ohne neues Bild abgeschlossen, bleibt das vorhandene Bild erhalten.

### UC-023: Fahrzeugkarte und Schnellzugriffe verwenden

**Ablauf:**

1. Die Person öffnet die Garage und wechselt zur gewünschten Fahrzeugkarte.
2. Sie sieht Bild, Bezeichnung und aktuellen Kilometerstand.
3. Über die vier Kacheln öffnet sie Servicehistorie, Tankhistorie, Zahlungshistorie oder Auswertung.
4. Über den Stift öffnet sie die Bearbeitung der Fahrzeugstammdaten.
5. Durch Antippen der übrigen Kartenfläche öffnet sie eine kompakte Fahrzeugverwaltung mit drei Zielen: Serviceintervalle, Zahlungsintervalle und Fahrzeugdokumente.

### UC-024: Fahrzeug bearbeiten

**Ablauf:**

1. Die Person öffnet die Bearbeitung über den Stift auf der Fahrzeugkarte.
2. Die vorhandenen Stammdaten sind vorausgefüllt.
3. Sie ändert beliebige Angaben.
4. Sie speichert die Änderungen.

**Ergebnis:** Übersichten und zukünftige Eingaben verwenden die geänderten Angaben. Der manuell gesetzte Kilometerstand bildet die Untergrenze; ein höherer Kilometerstand aus verbleibenden Service- oder Tankeinträgen bleibt weiterhin massgeblich.

Serviceintervalle, Zahlungsintervalle und Fahrzeugdokumente werden getrennt in der Fahrzeugverwaltung bearbeitet.

### UC-025: Serviceintervall am Fahrzeug konfigurieren

**Ziel:** Einen Servicetyp anhand von Zeit, Kilometerstand oder beiden Grössen überwachen.

**Ablauf:**

1. Die Person öffnet über die freie Fläche der Fahrzeugkarte die Fahrzeugverwaltung.
2. Sie wählt „Service-Intervalle“ und öffnet die eigene Unterseite.
3. Sie fügt einen Servicetyp hinzu.
4. Sie legt einen Kilometerabstand, einen Zeitabstand oder beide Werte fest.
5. Sie kann weitere Servicetypen ergänzen.
6. Sie kann eine bestehende Intervallzeile ändern oder entfernen.
7. Sobald gültige ungespeicherte Änderungen vorliegen, erscheint der Speicherbutton.
8. Sie speichert die Intervalle; danach verschwindet der Speicherbutton wieder.

**Ergebnis:** Dashboard und Erinnerungen können bevorstehende oder überfällige Services anhand der letzten passenden Durchführung bestimmen.

### UC-026: Wiederkehrende Zahlung am Fahrzeug konfigurieren

**Ablauf:**

1. Die Person öffnet die Fahrzeugverwaltung und wählt „Payment-Intervalle“.
2. Auf der eigenen Unterseite fügt sie ein Zahlungsintervall hinzu.
3. Sie wählt einen Zahlungstyp.
4. Sie gibt den erwarteten Betrag ein.
5. Sie wählt monatlich, jährlich oder einen benutzerdefinierten Tagesabstand.
6. Sie legt den Ausgangstermin fest.
7. Sie kann weitere Intervalle ergänzen, ändern oder entfernen.
8. Sobald gültige ungespeicherte Änderungen vorliegen, erscheint der Speicherbutton.
9. Sie speichert die Intervalle; danach verschwindet der Speicherbutton wieder.

**Ergebnis:** Die nächste Fälligkeit, die monatliche Schätzung und optionale Zahlungserinnerungen können berechnet werden.

### UC-027: Fahrzeug löschen

**Ablauf:**

1. Die Person startet das Löschen in der Fahrzeugbearbeitung.
2. Ein Bestätigungsdialog weist auf die endgültige Aktion hin.
3. Die Person bestätigt oder bricht ab.

**Ergebnis bei Bestätigung:** Das Fahrzeug wird aus der Garage entfernt. Zugehörige Historien stehen danach nicht mehr zur Auswahl.

## 5. Serviceeinträge

### UC-030: Einzelnen Service erfassen

**Voraussetzung:** Mindestens ein Fahrzeug ist vorhanden.

**Ablauf:**

1. Die Person startet über den Plus-Button einer Servicehistorie einen neuen Eintrag.
2. Das betroffene Fahrzeug ist vorausgewählt.
3. Sie wählt einen Servicetyp.
4. Sie kann Kosten und Notizen ergänzen.
5. Sie gibt den Kilometerstand ein.
6. Sie wählt das Datum.
7. Sie kann Bilder aus der Galerie oder über die Kamera hinzufügen.
8. Sie speichert den Eintrag.

**Prüfungen:**

- Mindestens ein Servicetyp muss gewählt sein.
- Der Kilometerstand muss eine gültige, nicht negative Zahl sein.
- Optionale Kosten müssen als gültiger Betrag eingegeben werden.

**Ergebnis:** Der Eintrag erscheint in der Servicehistorie und kann Fälligkeiten sowie den Fahrzeugkilometerstand beeinflussen.

### UC-031: Mehrere Services als gemeinsamen Werkstattbesuch erfassen

**Ablauf:**

1. Die Person beginnt einen neuen Serviceeintrag.
2. Sie fügt über „Weiterer Service“ zusätzliche Serviceblöcke hinzu.
3. Für jeden Block wählt sie Typ, optionale Kosten und optionale Notizen.
4. Datum, Kilometerstand und Bilder gelten gemeinsam für den Besuch.
5. Sie speichert alle Services zusammen.

**Ergebnis:** Die Services werden in der Historie als zusammengehörige Gruppe dargestellt, bleiben in der Detailansicht aber einzeln nachvollziehbar.

### UC-032: Fotos zu einem Service hinzufügen

**Galerieablauf:**

1. Die Person wählt „Galerie“.
2. Sie wählt ein oder mehrere Bilder.
3. Vorschaubilder erscheinen im Formular.

**Kameraablauf:**

1. Die Person wählt „Kamera“.
2. Falls nötig, fragt die App nach Kamerazugriff.
3. Bei erteilter Berechtigung nimmt die Person ein Bild auf.
4. Das Bild erscheint in der Vorschau.

**Varianten:**

- Ein Vorschaubild kann vor dem Speichern wieder entfernt werden.
- Wird die Kameraberechtigung abgelehnt, informiert die App darüber und speichert den Service ohne neues Kamerabild weiter.

### UC-033: Servicedatum auswählen

**Ablauf:**

1. Die Person öffnet das Datumsfeld.
2. Tag, Monat und Jahr können schrittweise verändert oder direkt eingegeben werden.
3. Sie bestätigt das Datum.
4. Das gewählte Datum wird im Serviceformular angezeigt.

### UC-034: Servicehistorie ansehen

**Ablauf:**

1. Die Person öffnet die Servicehistorie eines Fahrzeugs.
2. Einträge werden chronologisch und bei gemeinsamen Besuchen gruppiert dargestellt.
3. Beim Scrollen werden bei Bedarf weitere Einträge geladen.
4. Durch Antippen einer Gruppe wird die Detailansicht geöffnet.
5. Über den schwebenden Plus-Button wird ein neuer Eintrag angelegt.

**Leerer Zustand:** Ohne Einträge weist die Ansicht darauf hin, dass noch keine Services erfasst wurden.

### UC-035: Servicehistorie filtern und durchsuchen

**Ablauf:**

1. Die Person kann einen oder mehrere Servicetypen auswählen.
2. Sie kann die letzten 30 Tage, 90 Tage, 365 Tage oder den gesamten Zeitraum wählen.
3. Sie kann einen Suchtext eingeben.
4. Die Liste zeigt nur passende Einträge.
5. Mit „Filter löschen“ kehrt sie zur vollständigen Historie zurück.

### UC-036: Servicedetails ansehen

**Ablauf:**

1. Die Person öffnet einen Eintrag oder eine Servicegruppe.
2. Sie sieht Fahrzeug, Datum, Kilometerstand und Erfassungszeitpunkt.
3. Bei einer Gruppe sieht sie alle enthaltenen Servicetypen einzeln.
4. Kosten und Notizen werden angezeigt, sofern vorhanden.
5. Zugeordnete Bilder werden als Galerie dargestellt.
6. Zugeordnete Dokumente werden mit Titel, Datum, Kategorie und Seitenzahl dargestellt.
7. Die Person kann den Eintrag bearbeiten oder löschen.

### UC-037: Servicebild im Vollbild ansehen

**Ablauf:**

1. Die Person tippt in den Servicedetails auf ein Bild.
2. Das Bild wird gross angezeigt.
3. Bei mehreren Bildern kann zwischen ihnen gewechselt werden.
4. Die Vollbildansicht kann wieder geschlossen werden.

### UC-038: Service oder Servicegruppe bearbeiten

**Ablauf:**

1. Die Person wählt in der Historie per langem Druck „Bearbeiten“ oder nutzt die Bearbeitung in den Details.
2. Das Serviceformular öffnet sich mit den bisherigen Werten.
3. Sie ändert Typen, Kosten, Notizen, Kilometerstand, Datum oder Bilder.
4. Sie speichert die Änderungen.

**Ergebnis:** Die bisherige Einzel- oder Gruppendarstellung wird durch die bearbeitete Fassung ersetzt.

### UC-039: Service oder Servicegruppe löschen

**Ablauf:**

1. Die Person startet das Löschen über einen langen Druck oder die Detailansicht.
2. Die App weist darauf hin, dass die Aktion nicht rückgängig gemacht werden kann.
3. Sie bestätigt oder bricht ab.

**Ergebnis bei Bestätigung:** Bei einem gruppierten Werkstattbesuch wird die gesamte Gruppe gelöscht.

Nach der Löschung wird der Fahrzeugkilometerstand aus dem manuell gesetzten Basiswert sowie den verbleibenden Service- und Tankeinträgen neu bestimmt.

## 6. Tankvorgänge

### UC-040: Tankvorgang schrittweise erfassen

**Voraussetzung:** Ein Fahrzeug ist ausgewählt.

**Schritt 1 – Kilometerstand:**

1. Die Person gibt den Kilometerstand über das Zahlenfeld ein.
2. Der letzte Tank-Kilometerstand wird als Orientierung angezeigt, sofern vorhanden.
3. Bei einem neuen Eintrag darf der Wert nicht unter dem aktuellen Fahrzeugkilometerstand liegen.

**Schritt 2 – Liter:**

1. Die Standard-Tankmenge des Fahrzeugs ist vorausgewählt.
2. Die Person erhöht oder verringert die Menge in kleinen oder grossen Schritten.
3. Sie kann zur Standardmenge zurückkehren.
4. Eine Füllstandsanzeige setzt die Menge ins Verhältnis zur hinterlegten Standard-Tankmenge.

**Schritt 3 – Preis:**

1. Die Person wählt zwischen Gesamtpreis und Preis pro Liter.
2. Im Gesamtpreis-Modus gibt sie den bezahlten Gesamtbetrag ein und sieht den errechneten Literpreis.
3. Im Literpreis-Modus passt sie den Preis schrittweise an und sieht den errechneten Gesamtbetrag.

**Schritt 4 – Bestätigung und Notizen:**

1. Kilometerstand, Liter, Literpreis und Gesamtbetrag werden zusammengefasst.
2. Die Person kann optional eine Notiz ergänzen, etwa Tankstelle, Kraftstoffsorte oder Reisebezug.
3. Sie speichert den Tankvorgang.

**Ergebnis:** Der Eintrag erscheint in der Tankhistorie. Ein höherer Kilometerstand aktualisiert das Fahrzeug.

### UC-041: Tankerfassung vor dem Speichern korrigieren oder abbrechen

- Mit „Zurück“ kann die Person zu jedem vorherigen Schritt zurückgehen.
- Über das Schliessen-Symbol oder den Bereich ausserhalb des Fensters kann sie die Eingabe abbrechen.
- Nicht gespeicherte Eingaben werden beim erneuten Öffnen zurückgesetzt.
- Alle Schritte behalten dieselbe Fensterhöhe, damit die Bedienung beim Weitergehen nicht springt.

### UC-042: Tankhistorie ansehen

**Ablauf:**

1. Die Person öffnet die Tankhistorie eines Fahrzeugs.
2. Die Übersicht zeigt Gesamtliter, Gesamtkosten, Durchschnittsverbrauch und durchschnittlichen Literpreis für den aktuellen Filter.
3. Jeder Eintrag zeigt Liter, Kilometerstand, Literpreis, Gesamtbetrag und Datum.
4. Notizen werden angezeigt, sofern vorhanden.
5. Der schwebende Plus-Button öffnet eine neue Tankeingabe.

### UC-043: Tankhistorie filtern und durchsuchen

**Ablauf:**

1. Die Person durchsucht Notizen oder Kosten über das Suchfeld.
2. Sie kann auf 30 Tage, 90 Tage, ein Jahr oder den gesamten Zeitraum begrenzen.
3. Ein sichtbarer Punkt zeigt an, dass ein Filter aktiv ist.
4. Aktive Filter können gemeinsam zurückgesetzt werden.

### UC-044: Tankvorgang bearbeiten

**Ablauf:**

1. Die Person drückt lange auf einen Tankeintrag.
2. Sie wählt „Bearbeiten“.
3. Die schrittweise Eingabe öffnet sich mit Kilometerstand, Litern, Betrag und Notiz.
4. Sie ändert Werte und speichert.

### UC-045: Tankvorgang löschen

**Ablauf:**

1. Die Person drückt lange auf einen Tankeintrag.
2. Sie wählt „Löschen“.
3. Sie bestätigt den endgültigen Löschvorgang.
4. Historie und Tankstatistik werden aktualisiert.
5. Der Fahrzeugkilometerstand fällt auf den höchsten verbleibenden Service- oder Tankstand zurück, mindestens jedoch auf den manuell gesetzten Basiswert.

## 7. Zahlungen und weitere Fahrzeugkosten

### UC-050: Zahlung oder Ausgabe erfassen

**Ablauf:**

1. Die Person öffnet die Zahlungshistorie.
2. Sie betätigt den schwebenden Plus-Button.
3. Sie wählt einen Zahlungstyp.
4. Sie gibt Betrag und Datum ein.
5. Sie kann eine Notiz ergänzen.
6. Sie kann den Eintrag einer konfigurierten wiederkehrenden Zahlung zuordnen.
7. Sie speichert den Eintrag.

**Ergebnis:** Die Ausgabe erscheint in der Historie und wird in Kostenübersichten berücksichtigt. Bei Zuordnung zu einem Intervall gilt die passende Fälligkeit als bezahlt.

### UC-051: Zahlungshistorie ansehen

**Ablauf:**

1. Die Person sieht den insgesamt bezahlten Betrag.
2. Sie sieht die aus Intervallen berechnete monatliche Kostenschätzung.
3. Zahlungen werden chronologisch dargestellt.
4. Der schwebende Plus-Button ist an derselben Position wie in Service- und Tankhistorie verfügbar.

### UC-052: Zahlungshistorie filtern und durchsuchen

**Ablauf:**

1. Die Person sucht nach Notiz, Betrag oder Bezeichnung des Zahlungstyps.
2. Sie wählt einen oder mehrere Zahlungstypen.
3. Sie begrenzt den Zeitraum auf 30 Tage, 90 Tage, ein Jahr oder alle Einträge.
4. Sie kann alle Filter gemeinsam löschen.

### UC-053: Zahlung bearbeiten

**Ablauf:**

1. Die Person öffnet einen bestehenden Zahlungseintrag zur Bearbeitung.
2. Typ, Betrag, Datum, Notiz und Intervallzuordnung sind vorausgefüllt.
3. Sie passt die Angaben an und speichert.
4. Summen und Fälligkeiten werden neu berechnet.

### UC-054: Zahlung löschen

**Ablauf:**

1. Die Person startet beim Eintrag die Löschaktion.
2. Ein Bestätigungsdialog weist auf die endgültige Löschung hin.
3. Nach Bestätigung verschwindet der Eintrag und die Summen werden aktualisiert.

## 8. Auswertungen

### UC-060: Gesamtkosten und Kennzahlen ansehen

**Ablauf:**

1. Die Person öffnet die Auswertung eines Fahrzeugs.
2. Sie sieht die gesamten erfassten Kosten und deren Verteilung.
3. Sie sieht Kosten pro Kilometer, Durchschnittsverbrauch, Durchschnittspreis pro Liter und Gesamtliter.
4. Sie sieht die monatliche Schätzung wiederkehrender Zahlungen.
5. Sie sieht die Anzahl erfasster Services.

### UC-061: Kostenverteilungen vergleichen

- Die Gesamtkostenverteilung vergleicht Service, Kraftstoff, Versicherung, Wartung und sonstige Zahlungen.
- Die Servicetyp-Verteilung zeigt, welche Servicearten die höchsten erfassten Kosten verursacht haben.
- Die Zahlungstyp-Verteilung zeigt, wie sich weitere Ausgaben auf die vorhandenen Zahlungstypen verteilen.
- Kategorien ohne Kosten werden nicht als künstliche Segmente dargestellt.

### UC-062: Zeitliche Entwicklungen ansehen

- Kraftstoffkosten werden für die letzten sechs Kalendermonate verglichen.
- Zahlungskosten werden für die letzten sechs Kalendermonate verglichen.
- Zahlungskosten werden zusätzlich für die letzten fünf Kalenderjahre verglichen.
- Gesamtkosten aus Kraftstoff, Services und Zahlungen werden für die letzten sechs Monate verglichen.
- Der Literpreis wird entlang der Tankdaten als Zeitreihe gezeigt.
- Der berechnete Verbrauch wird zwischen aufeinanderfolgenden Tankständen als Zeitreihe gezeigt.
- Die aus Tank-Kilometerständen abgeleitete Monatsfahrleistung wird als Zeitreihe gezeigt.
- Monats- und Datumsbezeichnungen folgen der gewählten App-Sprache.

### UC-063: Diagramm vergrössern

1. Die Person tippt bei einem Zeit- oder Balkendiagramm auf das Vergrössern-Symbol.
2. Das Diagramm wird in einer grossen Ansicht mit Titel und Einheit dargestellt.
3. Sie schliesst die Ansicht über das Schliessen-Symbol.

### UC-064: Reifenhistorie auswerten

**Voraussetzung:** Services des Typs Reifen wurden erfasst.

**Ablauf:**

1. Die Person sieht die Anzahl dokumentierter Reifenwechsel.
2. Ab dem zweiten Wechsel wird die Kilometerdifferenz zum vorherigen Wechsel angezeigt.
3. Aus positiven, vorhandenen Intervallen wird eine durchschnittliche Reifenlebensdauer gebildet.
4. Datum, Kilometerstand und optionale Notizen jedes Reifenwechsels bleiben sichtbar.

### UC-065: Aussagekraft der Auswertungen einordnen

- Der Verbrauch zwischen zwei Tankvorgängen ist nur dann als realer Verbrauch aussagekräftig, wenn die Tankstände vergleichbar sind, typischerweise bei Volltankungen. Eine eigene Volltank-Markierung gibt es derzeit nicht.
- Die Monatskilometer werden aus vorhandenen Tank-Kilometerständen abgeleitet. Gibt es in einem Monat keinen Tankvorgang, kann die nächste sichtbare Differenz Fahrstrecke aus mehreren Monaten enthalten.
- „Kosten pro Kilometer“ verwendet die erfassten Gesamtkosten im Verhältnis zum aktuellen Kilometerstand. Bei gebraucht übernommenen Fahrzeugen ist dieser Wert nicht identisch mit den Kosten pro Kilometer seit Beginn der App-Nutzung.
- Auswertungen zeigen nur Daten, die tatsächlich erfasst wurden. Fehlende Tank-, Service- oder Zahlungseinträge können nicht geschätzt werden.
- Wiederkehrende Zahlungen fliessen als Schätzung in die Monatskennzahl ein; als tatsächlich bezahlte Kosten gelten nur erfasste Zahlungseinträge.

## 9. Eigene Service- und Zahlungstypen

### UC-070: Servicetypen ansehen und verwalten

1. Die Person öffnet in den Einstellungen die Servicetypen.
2. Systemtypen und eigene Typen werden gemeinsam angezeigt.
3. Systemtypen behalten ihre vorgegebenen Bezeichnungen und Symbole.
4. Eigene Typen können hinzugefügt, bearbeitet und gelöscht werden.

### UC-071: Eigenen Servicetyp hinzufügen

1. Die Person startet „Hinzufügen“.
2. Sie gibt einen Namen ein.
3. Sie wählt ein Symbol.
4. Sie speichert den Typ.

**Prüfung:** Ein leerer Name kann nicht gespeichert werden.

### UC-072: Eigenen Servicetyp bearbeiten oder löschen

- Beim Bearbeiten können Name und Symbol geändert werden.
- Vor dem Löschen wird eine Bestätigung verlangt.
- Nicht löschbare Systemtypen werden vor versehentlichen Änderungen geschützt.
- Ein eigener Servicetyp, der noch von Serviceeinträgen verwendet wird, kann nicht gelöscht werden.
- Schlägt Speichern oder Löschen fehl, bleibt der vorhandene Typ erhalten.

### UC-073: Zahlungstypen ansehen und verwalten

1. Die Person öffnet in den Einstellungen die Zahlungstypen.
2. Vorgegebene und eigene Typen werden angezeigt.
3. Eigene Typen können mit Name und Symbol ergänzt werden.
4. Eigene Typen können bearbeitet oder nach Bestätigung gelöscht werden.
5. Der Typ steht anschliessend in Zahlungen, Intervallen, Filtern und Auswertungen zur Verfügung.

**Variante:** Ein Zahlungstyp, der noch von Zahlungen oder Intervallen verwendet wird, kann nicht gelöscht werden.

## 10. Erinnerungen

### UC-080: Zahlungserinnerungen konfigurieren

1. Die Person öffnet die Benachrichtigungseinstellungen.
2. Sie aktiviert Zahlungserinnerungen.
3. Sie legt fest, wie viele Tage vor der Fälligkeit erinnert wird.
4. Sie wählt die Wiederholung täglich, alle drei Tage, wöchentlich oder in einem eigenen Tagesabstand.
5. Sie speichert die Einstellungen.

### UC-081: Erinnerungen für bevorstehende Services konfigurieren

1. Die Person aktiviert Erinnerungen für bevorstehende Services.
2. Sie legt einen Vorlauf in Tagen fest.
3. Sie legt einen Vorlauf in Kilometern fest.
4. Sie bestimmt den Wiederholungsabstand.
5. Sie speichert die Einstellungen.

### UC-082: Erinnerungen für überfällige Services konfigurieren

1. Die Person aktiviert Erinnerungen für überfällige Services.
2. Sie legt fest, nach wie vielen Tagen oder Kilometern über Fälligkeit erinnert wird.
3. Sie bestimmt den Wiederholungsabstand.
4. Sie speichert die Einstellungen.

### UC-083: Benachrichtigungsberechtigung erteilen oder verweigern

- Sobald mindestens eine Erinnerungsart aktiv ist, kann das Betriebssystem nach der Benachrichtigungsberechtigung fragen.
- Bei Erteilung werden passende lokale Erinnerungen geplant.
- Bei Verweigerung bleiben die App-Daten und Einstellungen erhalten, es erscheinen aber keine Systembenachrichtigungen.
- Die App bleibt auch bei einem Fehler der Benachrichtigungsplanung bedienbar.

### UC-084: Erinnerungen in der gewählten Sprache erhalten

1. Beim Planen setzt die App Titel, Fahrzeugname, Servicename und Nachricht in der aktuell gewählten Sprache zusammen.
2. Wechselt die Person Deutsch oder Englisch, werden bestehende geplante Erinnerungen neu erstellt.
3. Das Betriebssystem zeigt die bereits fertig übersetzten Texte an; es übersetzt sie nicht selbst.

## 11. PDF-Bericht

### UC-090: Fahrzeugbericht zusammenstellen

1. Die Person öffnet „PDF exportieren“.
2. Sie wählt das Fahrzeug für den Bericht.
3. Sie entscheidet getrennt, ob Servicehistorie, Tankhistorie und Zahlungshistorie enthalten sein sollen.
4. Sie kann Fotos ein- oder ausschliessen.
5. Sie kann Kostenbeträge ein- oder ausschliessen.
6. Sie kann Notizen ein- oder ausschliessen.
7. Sie kann Dokumente ein- oder ausschliessen.
8. Sie entscheidet separat, ob die Bildseiten der Dokumente eingebettet werden.
9. Sie startet die Erstellung.

**Prüfung:** Mindestens ein Inhaltsbereich muss ausgewählt sein.

### UC-091: PDF erstellen und weitergeben

1. Während der Erstellung zeigt die App einen Verarbeitungszustand.
2. Nach erfolgreicher Erstellung öffnet sich die Teilen- oder Speichern-Auswahl des Geräts.
3. Die Person kann den Bericht in einer verfügbaren Ziel-App speichern oder weitergeben.
4. Bei einem Fehler erscheint eine verständliche Fehlermeldung.

## 12. Datensicherung und Wiederherstellung

### UC-100: Verschlüsselte Datensicherung erstellen

1. Die Person wählt „Daten exportieren“.
2. Sie gibt ein selbst gewähltes Passwort ein.
3. Ohne Passwort kann der Export nicht gestartet werden.
4. Die App bereitet Fahrzeuge, Services, Tankvorgänge, Zahlungen, Intervalle, eigene Typen, Dokumente und Bildseiten als Sicherungsdatei vor.
5. Nach Abschluss bestätigt die App, dass die Datei bereit ist.
6. Die Person öffnet den Systemdialog zum Speichern oder Teilen der Datei.

**Wichtiger Nutzungshinweis:** Das Passwort wird zum späteren Import benötigt. Die App bietet keine Wiederherstellung eines vergessenen Exportpassworts.

### UC-101: Datensicherung importieren

1. Die Person wählt „Daten importieren“.
2. Sie gibt das Passwort der Sicherung ein.
3. Sie wählt eine Revloguum-Sicherungsdatei auf dem Gerät.
4. Die App prüft Datei und Passwort.
5. Gültige Inhalte werden übernommen.
6. Datensätze mit derselben Kennung werden durch den Stand der Sicherung ersetzt; andere vorhandene Daten bleiben erhalten.
7. Fahrzeuglisten und Ansichten werden nach erfolgreichem Import aktualisiert.
8. Dokumentseiten werden beim Import erneut geschützt auf dem Gerät gespeichert.

**Fehlerfälle:**

- Kein Passwort: Import wird nicht gestartet.
- Auswahl abgebrochen: Es werden keine Daten verändert.
- Falsches Passwort oder beschädigte Datei: Es werden keine unbestätigten Inhalte angezeigt; die App meldet den Fehler.
- Datei gehört nicht zum erwarteten Sicherungsformat: Import wird abgelehnt.

## 13. Darstellung und Bedienung

### UC-110: Sprache wechseln

1. Die Person öffnet die Spracheinstellung.
2. Sie wählt Deutsch oder Englisch.
3. Sichtbare Texte wechseln unmittelbar.
4. Diagrammbeschriftungen und neu geplante Erinnerungen verwenden ebenfalls die neue Sprache.

### UC-111: Clear-View-Modus verwenden

1. Die Person aktiviert Clear View in den Einstellungen.
2. Unterstützte Oberflächen verwenden eine besser lesbare Darstellung und angepasste Farben.
3. Die Einstellung bleibt für spätere App-Starts erhalten.
4. Durch erneutes Ausschalten kehrt die normale Darstellung zurück.

### UC-112: Haptisches Feedback ein- oder ausschalten

1. Die Person schaltet haptisches Feedback in den Einstellungen ein oder aus.
2. Im eingeschalteten Zustand quittiert die App ausgewählte Eingaben, Erfolge und Fehler durch kurze Geräteimpulse.
3. Im ausgeschalteten Zustand bleiben alle Aktionen ohne diese Impulse bedienbar.

### UC-113: Datenschutzstatus ansehen

In den Einstellungen kann die Person sehen, dass lokale Daten und Bilder geschützt gespeichert werden, dass kein Netzwerkzugriff für die Kerndaten vorgesehen ist und dass keine Nutzungsanalyse für persönliche Fahrzeugdaten aktiv ist.

### UC-114: App-Informationen ansehen

1. Die Person öffnet „Über Revloguum“.
2. Ein Dialog zeigt Informationen zur App und ihrer Version.
3. Der Dialog kann ohne Änderung von Daten geschlossen werden.

## 14. Alle Daten löschen

### UC-120: Vollständige lokale Datenlöschung vorbereiten

1. Die Person wählt „Alle Daten löschen“.
2. Die App zeigt einen zufällig erzeugten Bestätigungscode.
3. Die Person muss den Code exakt in das Eingabefeld übertragen.
4. Solange der Code nicht stimmt, bleibt die endgültige Löschaktion deaktiviert.

### UC-121: Alle lokalen Daten endgültig löschen

1. Die Person gibt den richtigen Bestätigungscode ein.
2. Sie bestätigt die Löschung.
3. Fahrzeuge, Historien, eigene Typen, Intervalle, Dokumente und zugehörige Bilddateien werden entfernt.
4. Die Fahrzeugauswahl wird geleert.
5. Die App zeigt danach den Zustand ohne Fahrzeuge.

**Abbruch:** Wird der Dialog geschlossen oder stimmt der Code nicht, bleiben alle Daten unverändert.

## 15. Gemeinsame Verhaltensregeln

### UC-130: Einheitlich neue Historieneinträge anlegen

- Servicehistorie, Tankhistorie und Zahlungshistorie verwenden jeweils einen schwebenden Plus-Button unten rechts.
- Der Button bezieht sich immer auf das Fahrzeug der geöffneten Historie.
- Nach erfolgreichem Speichern kehrt die Person in den fachlich passenden Kontext zurück.

### UC-131: Listen ohne Daten verstehen

- Leere Fahrzeug-, Service-, Tank- und Zahlungslisten zeigen einen eigenen Hinweis statt einer leeren Fläche.
- Ein leerer gefilterter Zustand bedeutet nicht automatisch, dass überhaupt keine Daten existieren.
- Durch Zurücksetzen der Filter kann die vollständige Liste wiederhergestellt werden.

### UC-132: Endgültige Aktionen absichern

- Das Löschen einzelner Einträge verlangt eine Bestätigung.
- Das Löschen eines Fahrzeugs verlangt eine Bestätigung.
- Das Löschen aller App-Daten verlangt zusätzlich einen exakten Bestätigungscode.
- Abbrechen schliesst den Dialog ohne Datenänderung.

### UC-133: Längere Vorgänge erkennen

- Beim Laden grosser Historien können weitere Einträge nachgeladen werden.
- Während Speichern, Import, Export und PDF-Erstellung zeigt die App einen Warte- oder Verarbeitungszustand.
- Fehler werden so angezeigt, dass die Person in der App weiterarbeiten oder die Aktion erneut versuchen kann.

## 16. Fahrzeug- und Eintragsdokumente

### UC-140: Fahrzeugdokument hinzufügen

1. Die Person öffnet die Fahrzeugverwaltung über die freie Fläche der Fahrzeugkarte.
2. Sie wählt „Fahrzeugdokumente“ und öffnet die eigene Unterseite.
3. Sie gibt einen Dokumenttitel ein.
4. Sie kann Kategorie, Datum und Notiz ergänzen.
5. Sie wählt eine oder mehrere Seiten aus der Galerie oder fotografiert Seiten direkt.
6. Sie kann Seiten entfernen und ihre Reihenfolge ändern.
7. Sie speichert das Dokument.

**Beispiele:** Versicherungspolice, Fahrzeugausweis, Drehmomenttabelle, Bedienhinweise oder Garantiedokument.

### UC-141: Dokument an einen Service anhängen

1. Die Person öffnet die Details eines bestehenden Services oder Werkstattbesuchs.
2. Sie fügt im Bereich „Servicedokumente“ ein Dokument hinzu.
3. Sie erfasst einen Titel und mindestens eine Bildseite.
4. Optional ergänzt sie Kategorie, Datum und Notiz.
5. Das Dokument bleibt dem Service auch nach einer Bearbeitung des Eintrags zugeordnet.

### UC-142: Beleg oder Dokument an eine Zahlung anhängen

1. Die Person öffnet die Zahlungshistorie.
2. Sie wählt beim betreffenden Eintrag das Dokument-Symbol.
3. Sie fügt Rechnung, Quittung, Police oder einen anderen Beleg mit einer oder mehreren Seiten hinzu.
4. Das Dokument wird ausschliesslich diesem Zahlungseintrag zugeordnet.

### UC-143: Dokument ansehen und bearbeiten

- Durch Antippen wird das Dokument seitenweise im Vollbild geöffnet.
- Bei mehreren Seiten kann zwischen den Seiten gewechselt und eine Seite vergrössert werden.
- Titel, Kategorie, Datum und Notiz können geändert werden.
- Seiten können ergänzt, entfernt und neu geordnet werden.
- Dokumentseiten werden ebenso geschützt gespeichert wie andere Bilder der App.

### UC-144: Dokument löschen

1. Die Person startet die Löschaktion am Dokument.
2. Die App verlangt eine Bestätigung.
3. Nach der Bestätigung werden Dokument und Bildseiten entfernt.
4. Wird stattdessen der zugehörige Service, die Zahlung oder das Fahrzeug gelöscht, werden die zugehörigen Dokumente ebenfalls entfernt.

### UC-145: Dokumente sichern und in Berichte aufnehmen

- Die verschlüsselte Datensicherung enthält Dokumentmetadaten und sämtliche Seiten.
- Beim Import werden die Seiten für das Zielgerät erneut geschützt gespeichert.
- Im PDF-Export können Dokumentmetadaten unabhängig von den eigentlichen Bildseiten gewählt werden.
- Fahrzeug-, Service- und Zahlungsdokumente werden im Bericht mit ihrer Zuordnung gekennzeichnet.