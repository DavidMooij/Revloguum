# Revloguum: Functional Use Cases

This document describes, from a user perspective, what can be done in Revloguum. It outlines workflows, variants, prerequisites, input validations, and outcomes, but does not describe technical implementation.

## Disclaimer

**This software is provided "as is", without warranty of any kind. Use it at your own risk.**

Revloguum makes no warranty regarding the accuracy, completeness, or timeliness of reminders, calculations, reports, saved entries, or documentation. Markdown files in this repository may be incomplete, outdated, or incorrect. They describe intended or observed behavior but are not a binding guarantee that the software will behave exactly as documented. The app and its documentation do not replace professional technical, legal, insurance, tax, or financial advice. To the extent permitted by law, authors and contributors are not liable for damages, data loss, missed maintenance, missed payments, or other consequences arising from use of the software or its documentation. Full warranty and liability terms are available in the [MIT License](LICENSE).

## 1. Fundamentals

### 1.1 Target audience

Revloguum targets people who manage one or more vehicles and want to document services, refuelings, payments, and ongoing costs in a traceable way.

### 1.2 Assumptions

- The app can be used without an account.
- Personal vehicle data remains local to the device.
- Many actions require a vehicle to be created first.
- German and English are available as UI languages.
- Monetary amounts are displayed in Swiss francs (CHF).
- Odometer readings are tracked per vehicle.

### 1.3 Core areas

- The Dashboard shows the current state of the selected vehicle.
- The Garage contains all created vehicles.
- Settings contain exports, backups, reminders, and management functions.
- Vehicle-specific subpages contain service history, fuel history, payment history, and analytics.

## 2. Launching the app and loading the initial state

### UC-001: Open app

**Goal:** Use the most recently available vehicle data and settings.

**Flow:**

1. The user opens Revloguum.
2. The app loads local data and personal display settings.
3. Existing reminders are reconciled with current vehicle data.
4. After successful loading the main navigation appears.

**Variants and outcomes:**

- If no vehicles exist yet, the Dashboard shows an empty state with an option to create the first vehicle.
- If local data cannot be opened, an error screen is shown instead of the normal app.
- When returning from background, scheduled reminders are rechecked.

## 3. Dashboard

### UC-010: Overview vehicle status

**Prerequisite:** At least one vehicle exists.

**Flow:**

1. The user opens the Dashboard.
2. They see the currently selected vehicle with name and odometer.
3. They see the last refueling or a hint if none exists.
4. They see whether services are overdue.
5. They see the next upcoming service.
6. They see whether payments are overdue.
7. They see the next upcoming recurring payment.
8. They see a short vehicle note relevant to the odometer.
9. They can open any tile to go to the matching history.

**Edge cases:**

- If no service intervals are configured, no artificial due date is displayed.
- If there are no recurring payments, an appropriate empty hint is shown.
- Overdue items are clearly distinguished from non-critical states.

### UC-011: Switch active vehicle

**Prerequisite:** Multiple vehicles exist.

**Flow:**

1. The user opens the vehicle selector on the Dashboard.
2. They choose another vehicle.
3. The Dashboard loads fuel status, services, payments and due items for the selected vehicle.
4. Subsequent quick actions apply to that vehicle.

### UC-012: Create first vehicle from Dashboard

**Prerequisite:** No vehicle exists yet.

**Flow:**

1. The Dashboard shows the empty state.
2. The user chooses "Add vehicle".
3. The vehicle creation form opens.

### UC-013: Quick refuel entry

**Prerequisite:** An active vehicle is selected.

**Flow:**

1. The user triggers the quick-refuel action.
2. The step-by-step refuel input opens for the active vehicle.
3. After saving, the Dashboard, odometer, and refuel analytics are updated.

## 4. Garage and vehicles

### UC-020: View all vehicles

**Flow:**

1. The user opens the Garage.
2. Each created vehicle is shown with its essential data.
3. For multiple vehicles the user can switch between vehicle cards.
4. An additional card allows creating another vehicle.
5. The pencil icon on a vehicle card opens editing of core data.
6. The four tiles open service history, fuel history, payment history or analytics.
7. Tapping the free area of the vehicle card opens vehicle management.

### UC-021: Create vehicle

**Flow:**

1. The user starts "Add vehicle".
2. They select vehicle type: motorcycle, car, or other.
3. They can pick a vehicle image from the gallery.
4. They enter make and model.
5. They may add manufacture year and a nickname.
6. They enter the current odometer reading.
7. They enter the default tank capacity.
8. They may set a default price per litre.
9. They save the vehicle.

**Required fields and validations:**

- Make must not be empty.
- Model must not be empty.
- Odometer must be a valid non-negative number.
- Default tank capacity must be a valid number greater than zero.
- Invalid values prevent saving and are indicated in the form.

**Outcome:** The vehicle appears in the Garage and can be used as the active vehicle.

### UC-022: Select or replace vehicle image

**Flow:**

1. The user taps the image area in the vehicle form.
2. They choose an image from the device gallery.
3. A preview replaces the placeholder or previous image.
4. On save the new image is assigned to the vehicle.

**Variant:** If editing completes without a new image, the existing image remains.

### UC-023: Use vehicle card and quick actions

**Flow:**

1. The user opens the Garage and switches to the desired vehicle card.
2. They see image, label and current odometer.
3. Via the four tiles they open service history, fuel history, payment history or analytics.
4. The pencil opens vehicle core data editing.
5. Tapping the rest of the card opens compact vehicle management with three targets: service intervals, payment intervals and vehicle documents.

### UC-024: Edit vehicle

**Flow:**

1. The user opens editing via the pencil on the vehicle card.
2. Existing core data is prefilled.
3. They change any values.
4. They save changes.

**Outcome:** Overviews and future entries use the updated values. A manually set odometer serves as a lower bound; a higher odometer from remaining service or fuel entries remains authoritative.

Service intervals, payment intervals and vehicle documents are edited separately in vehicle management.

### UC-025: Configure service interval for a vehicle

**Goal:** Monitor a service type by time, mileage, or both.

**Flow:**

1. The user opens vehicle management from the free area of the vehicle card.
2. They choose "Service intervals" and open that subpage.
3. They add a service type.
4. They set a mileage interval, a time interval, or both values.
5. They can add additional service types.
6. They can edit or remove an existing interval row.
7. When there are valid unsaved changes the Save button appears.
8. They save the intervals; the Save button then disappears.

**Outcome:** The Dashboard and reminders can determine upcoming or overdue services based on the most recent matching execution.

### UC-026: Configure recurring payment for a vehicle

**Flow:**

1. The user opens vehicle management and selects "Payment intervals".
2. On its subpage they add a payment interval.
3. They select a payment type.
4. They enter the expected amount.
5. They choose monthly, yearly, or a custom day interval.
6. They set the start date.
7. They can add, edit or remove intervals.
8. When there are valid unsaved changes the Save button appears.
9. They save the intervals; the Save button then disappears.

**Outcome:** Next due date, monthly estimate and optional payment reminders can be calculated.

### UC-027: Delete vehicle

**Flow:**

1. The user initiates deletion in vehicle editing.
2. A confirmation dialog highlights that the action is final.
3. The user confirms or cancels.

**Outcome on confirmation:** The vehicle is removed from the Garage. Related histories are no longer available for selection.

## 5. Service entries

### UC-030: Record a single service

**Prerequisite:** At least one vehicle exists.

**Flow:**

1. The user starts a new entry via the plus button in a service history.
2. The affected vehicle is preselected.
3. They choose a service type.
4. They may add costs and notes.
5. They enter the odometer reading.
6. They pick the date.
7. They may add images from the gallery or camera.
8. They save the entry.

**Validations:**

- At least one service type must be chosen.
- Odometer must be a valid non-negative number.
- Optional costs must be entered as a valid amount.

**Outcome:** The entry appears in service history and can affect due dates and the vehicle odometer.

### UC-031: Record multiple services as a single workshop visit

**Flow:**

1. The user begins a new service entry.
2. They add additional service blocks using "Add service".
3. For each block they pick type, optional cost and optional notes.
4. Date, odometer and images apply to the entire visit.
5. They save all services together.

**Outcome:** Services appear grouped in history but remain individually auditable in details.

### UC-032: Add photos to a service

**Gallery flow:**

1. The user selects "Gallery".
2. They choose one or several images.
3. Preview thumbnails appear in the form.

**Camera flow:**

1. The user selects "Camera".
2. If required the app requests camera access.
3. With permission the user takes a photo.
4. The image appears in preview.

**Variants:**

- A preview image can be removed before saving.
- If camera permission is denied the app informs the user and continues saving the service without a new camera image.

### UC-033: Choose service date

**Flow:**

1. The user opens the date field.
2. Day, month and year can be changed stepwise or entered directly.
3. They confirm the date.
4. The chosen date is shown in the service form.

### UC-034: View service history

**Flow:**

1. The user opens a vehicle's service history.
2. Entries are shown chronologically and grouped for combined visits.
3. Additional entries are loaded when scrolling if needed.
4. Tapping a group opens the detail view.
5. The floating plus button creates a new entry.

**Empty state:** If no entries exist the view indicates that no services have been recorded.

### UC-035: Filter and search service history

**Flow:**

1. The user can select one or more service types.
2. They may choose the last 30 days, 90 days, 365 days or the entire period.
3. They can enter a search text.
4. The list shows matching entries only.
5. "Clear filters" returns to the full history.

### UC-036: View service details

**Flow:**

1. The user opens an entry or a service group.
2. They see vehicle, date, odometer and creation timestamp.
3. For a group they see every included service type separately.
4. Costs and notes are shown if present.
5. Associated images are displayed as a gallery.
6. Attached documents are shown with title, date, category and page count.
7. The user can edit or delete the entry.

### UC-037: View service image fullscreen

**Flow:**

1. The user taps an image in service details.
2. The image is shown large.
3. With multiple images they can switch between them.
4. The fullscreen view can be closed.

### UC-038: Edit service or service group

**Flow:**

1. The user selects "Edit" via long press in history or uses edit in details.
2. The service form opens with previous values.
3. They change types, costs, notes, odometer, date or images.
4. They save changes.

**Outcome:** The previous single or grouped representation is replaced by the edited version.

### UC-039: Delete service or service group

**Flow:**

1. The user starts deletion via long press or the detail view.
2. The app warns that the action is irreversible.
3. They confirm or cancel.

**Outcome on confirmation:** For a grouped workshop visit the entire group is deleted.

After deletion the vehicle odometer is recalculated from the manually set baseline and the remaining service and fuel entries.

## 6. Fuel entries

### UC-040: Stepwise refuel entry

**Prerequisite:** A vehicle is selected.

**Step 1 – Odometer:**

1. The user enters the odometer value using the numeric field.
2. The last refuel odometer is shown as orientation if available.
3. For a new entry the value must not be below the vehicle's current odometer.

**Step 2 – Litres:**

1. The vehicle's default tank capacity is preselected.
2. The user increases or decreases the amount in small or large steps.
3. They can revert to the default amount.
4. A fill-level indicator relates the amount to the stored default tank capacity.

**Step 3 – Price:**

1. The user chooses between total price and price per litre.
2. In total-price mode they enter the paid total and see the calculated price per litre.
3. In price-per-litre mode they adjust the price and see the calculated total.

**Step 4 – Confirmation and notes:**

1. Odometer, litres, price-per-litre and total amount are summarised.
2. The user may add an optional note, e.g. station, fuel type or trip context.
3. They save the refuel entry.

**Outcome:** The entry appears in fuel history. A higher odometer updates the vehicle.

### UC-041: Correct or cancel refuel before saving

- The user can go back to any previous step using "Back".
- They can cancel the input via the close icon or tapping outside the dialog.
- Unsaved inputs are reset on re-opening.
- All steps keep the same dialog height to avoid visual jumps while progressing.

### UC-042: View fuel history

**Flow:**

1. The user opens a vehicle's fuel history.
2. The overview shows total litres, total cost, average consumption and average price per litre for the current filter.
3. Each entry shows litres, odometer, price per litre, total amount and date.
4. Notes are shown if present.
5. The floating plus button opens a new refuel entry.

### UC-043: Filter and search fuel history

**Flow:**

1. The user searches notes or costs using the search field.
2. They may limit to 30 days, 90 days, one year or the entire period.
3. A visible indicator shows when a filter is active.
4. Active filters can be cleared together.

### UC-044: Edit a fuel entry

**Flow:**

1. The user long-presses a fuel entry.
2. They choose "Edit".
3. The step-by-step input opens with odometer, litres, amount and note.
4. They change values and save.

### UC-045: Delete a fuel entry

**Flow:**

1. The user long-presses a fuel entry.
2. They choose "Delete".
3. They confirm the final deletion.
4. History and fuel statistics are updated.
5. The vehicle odometer falls back to the highest remaining service or fuel reading, but at least to the manually set baseline.

## 7. Payments and other vehicle costs

### UC-050: Record a payment or expense

**Flow:**

1. The user opens the payment history.
2. They tap the floating plus button.
3. They select a payment type.
4. They enter amount and date.
5. They may add a note.
6. They may associate the entry with a configured recurring payment.
7. They save the entry.

**Outcome:** The expense appears in the history and is included in cost overviews. If associated with an interval, the matching due item is considered paid.

### UC-051: View payment history

**Flow:**

1. The user sees the total paid amount.
2. They see the monthly cost estimate calculated from intervals.
3. Payments are shown chronologically.
4. The floating plus button is available at the same position as in service and fuel histories.

### UC-052: Filter and search payment history

**Flow:**

1. The user searches by note, amount or payment type label.
2. They select one or more payment types.
3. They limit the period to 30 days, 90 days, one year or all entries.
4. They can clear all filters together.

### UC-053: Edit a payment

**Flow:**

1. The user opens an existing payment entry for editing.
2. Type, amount, date, note and interval association are prefilled.
3. They adjust the values and save.
4. Totals and due items are recalculated.

### UC-054: Delete a payment

**Flow:**

1. The user triggers the delete action on the entry.
2. A confirmation dialog warns about final deletion.
3. After confirmation the entry is removed and totals are updated.

## 8. Analytics

### UC-060: View total costs and key metrics

**Flow:**

1. The user opens a vehicle's analytics.
2. They see total recorded costs and their distribution.
3. They see cost per kilometre, average consumption, average price per litre and total litres.
4. They see the monthly estimate of recurring payments.
5. They see the number of recorded services.

### UC-061: Compare cost distributions

- Total cost distribution compares service, fuel, insurance, maintenance and other payments.
- Service-type distribution shows which service categories caused the highest recorded costs.
- Payment-type distribution shows how other expenses map to configured payment types.
- Categories without costs are not shown as artificial segments.

### UC-062: View temporal developments

- Fuel costs are compared across the last six calendar months.
- Payment costs are compared across the last six calendar months.
- Payment costs are also compared across the last five calendar years.
- Total costs from fuel, services and payments are compared for the last six months.
- Price per litre is shown as a time series along refuel data.
- Calculated consumption is shown as a time series between consecutive refuels.
- Monthly mileage derived from refuel odometers is shown as a time series.
- Month and date labels follow the chosen app language.

### UC-063: Enlarge a chart

1. The user taps the enlarge icon on a time or bar chart.
2. The chart opens in a large view with title and unit.
3. They close the view with the close icon.

### UC-064: Analyse tyre history

**Prerequisite:** Service entries of type "tyres" have been recorded.

**Flow:**

1. The user sees the number of documented tyre changes.
2. From the second change onward the kilometre difference to the previous change is shown.
3. Positive intervals are used to compute an average tyre life.
4. Date, odometer and optional notes for each tyre change remain visible.

### UC-065: Interpret analytics accuracy

- Consumption between two refuels is only meaningful if the refuel fill levels are comparable, typically full refuels. There is currently no dedicated “full tank” flag.
- Monthly kilometres are derived from existing refuel odometer readings. If no refuel occurred in a month, the next visible difference may span multiple months.
- "Cost per kilometre" uses recorded total costs relative to the current odometer. For used vehicles taken over, this value is not identical to cost per kilometre since app usage started.
- Analytics only show data that was actually recorded. Missing fuel, service or payment entries are not estimated.
- Recurring payments are included as an estimate in monthly metrics; only recorded payment entries count as actually paid costs.

## 9. Custom service and payment types

### UC-070: View and manage service types

1. The user opens service types in Settings.
2. System types and custom types are shown together.
3. System types keep their predefined labels and icons.
4. Custom types can be added, edited and deleted.

### UC-071: Add a custom service type

1. The user starts "Add".
2. They enter a name.
3. They select an icon.
4. They save the type.

**Validation:** A blank name cannot be saved.

### UC-072: Edit or delete a custom service type

- While editing the name and icon can be changed.
- A confirmation is required before deletion.
- Non-deletable system types are protected against accidental changes.
- A custom service type used by existing service entries cannot be deleted.
- If save or delete fails, the existing type remains unchanged.

### UC-073: View and manage payment types

1. The user opens payment types in Settings.
2. Built-in and custom types are displayed.
3. Custom types can be added with a name and icon.
4. Custom types can be edited or deleted after confirmation.
5. The type is then available in payments, intervals, filters and analytics.

**Variant:** A payment type still used by payments or intervals cannot be deleted.

## 10. Reminders

### UC-080: Configure payment reminders

1. The user opens notification settings.
2. They enable payment reminders.
3. They set how many days before due date to remind.
4. They choose repetition: daily, every three days, weekly or a custom day interval.
5. They save the settings.

### UC-081: Configure reminders for upcoming services

1. The user enables reminders for upcoming services.
2. They set a lead time in days.
3. They set a lead in kilometres.
4. They determine the repetition interval.
5. They save the settings.

### UC-082: Configure reminders for overdue services

1. The user enables reminders for overdue services.
2. They set after how many days or kilometres past due they want to be reminded.
3. They determine the repetition interval.
4. They save the settings.

### UC-083: Grant or deny notification permission

- Once at least one reminder type is active, the OS may request notification permission.
- On grant, appropriate local reminders are scheduled.
- On denial, app data and settings remain intact but no system notifications are shown.
- The app remains usable even if scheduling fails.

### UC-084: Receive reminders in the chosen language

1. When scheduling, the app composes title, vehicle name, service name and message in the currently chosen language.
2. If the user switches German or English, existing scheduled reminders are recreated.
3. The OS shows the already translated texts; it does not translate them itself.

## 11. PDF report

### UC-090: Assemble vehicle report

1. The user opens "Export PDF".
2. They select the vehicle for the report.
3. They decide separately whether to include service history, fuel history and payment history.
4. They may include or exclude photos.
5. They may include or exclude cost amounts.
6. They may include or exclude notes.
7. They may include or exclude documents.
8. They decide separately whether to embed document image pages.
9. They start generation.

**Validation:** At least one content area must be selected.

### UC-091: Generate and share PDF

1. During generation the app shows a processing state.
2. After successful generation the device's share or save picker opens.
3. The user can save or share the report in an available target app.
4. On error a clear error message is shown.

## 12. Backup and restore

### UC-100: Create encrypted backup

1. The user selects "Export data".
2. They enter a user-chosen password.
3. Export cannot start without a password.
4. The app prepares vehicles, services, fuel entries, payments, intervals, custom types, documents and image pages as a backup file.
5. After completion the app confirms the file is ready.
6. The user opens the system dialog to save or share the file.

**Important note:** The password is required for later import. The app does not provide recovery for a forgotten export password.

### UC-101: Import backup

1. The user selects "Import data".
2. They enter the backup password.
3. They choose a Revloguum backup file on the device.
4. The app validates file and password.
5. Valid contents are imported.
6. Records with the same identifier are replaced by the backup state; other existing data remains.
7. Vehicle lists and views are updated after successful import.
8. Document pages are re-protected on the device during import.

**Error cases:**

- No password: Import will not start.
- Selection cancelled: No data is changed.
- Wrong password or corrupted file: No unconfirmed content is shown; the app reports the error.
- File not in expected backup format: Import is rejected.

## 13. Presentation and interaction

### UC-110: Change language

1. The user opens language settings.
2. They choose German or English.
3. Visible texts update immediately.
4. Chart labels and newly scheduled reminders also use the new language.

### UC-111: Use Clear View mode

1. The user enables Clear View in Settings.
2. Supported surfaces use a more readable layout and adjusted colors.
3. The setting persists across app restarts.
4. Turning it off again returns to the normal presentation.

### UC-112: Toggle haptic feedback

1. The user toggles haptic feedback in Settings.
2. When enabled the app acknowledges selected inputs, successes and errors with short device vibrations.
3. When disabled all actions remain usable without haptic cues.

### UC-113: View privacy status

In Settings the user can see that local data and images are stored protected, that no network access is intended for core data and that no usage analytics for personal vehicle data is active.

### UC-114: View app information

1. The user opens "About Revloguum".
2. A dialog shows app information and version.
3. The dialog can be closed without changing data.

## 14. Delete all data

### UC-120: Prepare full local data deletion

1. The user selects "Delete all data".
2. The app shows a randomly generated confirmation code.
3. The user must enter the code exactly into the input field.
4. Until the code matches the final delete action remains disabled.

### UC-121: Permanently delete all local data

1. The user enters the correct confirmation code.
2. They confirm deletion.
3. Vehicles, histories, custom types, intervals, documents and associated image files are removed.
4. The vehicle selection is cleared.
5. The app then shows the empty state without vehicles.

**Abort:** Closing the dialog or entering an incorrect code leaves all data unchanged.

## 15. Common behaviour rules

### UC-130: Consistent creation of new history entries

- Service, fuel and payment histories each use a floating plus button at bottom right.
- The button always applies to the vehicle of the open history.
- After successful save the user returns to the appropriate context.

### UC-131: Understand lists without data

- Empty vehicle, service, fuel and payment lists show a dedicated hint instead of a blank area.
- An empty filtered state does not mean there is no data at all.
- Resetting filters restores the full list.

### UC-132: Safeguard final actions

- Deleting individual entries requires confirmation.
- Deleting a vehicle requires confirmation.
- Deleting all app data additionally requires entering an exact confirmation code.
- Cancel closes the dialog without changing data.

### UC-133: Recognise longer operations

- When loading large histories additional entries may be loaded incrementally.
- During saving, import, export and PDF generation the app shows a busy or processing state.
- Errors are displayed in a way that allows the user to continue working or retry the action.

## 16. Vehicle and entry documents

### UC-140: Add a vehicle document

1. The user opens vehicle management from the free area of the vehicle card.
2. They choose "Vehicle documents" and open the dedicated subpage.
3. They enter a document title.
4. They may add category, date and a note.
5. They select one or more pages from the gallery or photograph pages directly.
6. They can remove pages and change the order.
7. They save the document.

**Examples:** Insurance policy, vehicle registration, torque table, owner manual or warranty document.

### UC-141: Attach a document to a service

1. The user opens details of an existing service or workshop visit.
2. They add a document in the "Service documents" area.
3. They enter a title and at least one image page.
4. Optionally they add category, date and a note.
5. The document remains attached to the service even after editing the entry.

### UC-142: Attach a receipt or document to a payment

1. The user opens payment history.
2. They choose the document icon on the relevant entry.
3. They add an invoice, receipt, policy or other proof with one or more pages.
4. The document is exclusively associated with that payment entry.

### UC-143: View and edit a document

- Tapping opens the document page-by-page in fullscreen.
- With multiple pages the user can switch between pages and enlarge a page.
- Title, category, date and note can be edited.
- Pages can be added, removed and reordered.
- Document pages are stored protected like other app images.

### UC-144: Delete a document

1. The user initiates the delete action on the document.
2. The app requests confirmation.
3. After confirmation the document and image pages are removed.
4. If the related service, payment or vehicle is deleted instead, related documents are also removed.

### UC-145: Backup and include documents in reports

- The encrypted backup contains document metadata and all pages.
- On import the pages are re-protected for the target device.
- In the PDF export document metadata can be chosen independently of the image pages.
- Vehicle, service and payment documents are labeled with their association in the report.
