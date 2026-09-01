# Revloguum Privacy Notice

## Summary

Revloguum is designed as a local-first vehicle journal. It does not require an account, and the application code does not send personal vehicle records to a Revloguum-operated backend or analytics service.

This notice describes the current open-source application. A distributor who modifies the app, adds services, or publishes a build under a different identity must update this notice accordingly.

## Data Stored by the App

Depending on how the app is used, local data can include:

- vehicle make, model, year, nickname, type, photo, and odometer values;
- service history, service intervals, costs, notes, dates, and photos;
- fuel amounts, prices, odometer values, dates, and notes;
- one-time payments, recurring payment intervals, categories, dates, and notes;
- document titles, categories, dates, notes, and image pages;
- notification preferences and interface preferences.

Core records are stored in the app's local database. Persistent photos and document pages are stored in the app's private storage. See [SECURITY.md](SECURITY.md) for encryption details and limitations.

## Data Not Collected by Revloguum

The current application code contains no Revloguum account system, advertising SDK, analytics integration, or application backend for uploading personal vehicle data. The project maintainer therefore does not receive those records through the app.

Operating systems, app stores, build/distribution providers, devices, and user-selected sharing destinations may process technical or shared data under their own policies. Those services are outside the Revloguum application's control.

## Permissions

### Camera

Camera access is requested only when the user chooses to photograph a service image or document page. Denying access prevents direct capture but does not prevent normal use of the rest of the app.

### Photo Library

Photo-library access is used when the user chooses a vehicle image, service image, or document page. Revloguum processes only items selected through the platform picker.

### Notifications

Notification permission is requested when local reminders are enabled. Service and payment reminder text is generated from local data and scheduled with the operating system. Lock-screen visibility is controlled by device settings.

### Files and Sharing

The system document picker is used to select a backup for import. The system sharing interface is used when the user chooses to save or send a backup or PDF report.

## Exports and User-Directed Sharing

- `.rvlg` backups are encrypted with a password supplied by the user.
- Backup passwords are not recoverable by the app or maintainer.
- PDF reports are not encrypted and can include vehicle data, costs, notes, photos, and document pages.
- Once a file is shared or saved outside the app, its retention and protection are controlled by the selected destination and the user.

Review PDF options and recipients before sharing sensitive records. Use a strong, unique password for backups.

## Temporary Plaintext Data

To display or export protected media, the app decrypts it into memory and may write preview files to its cache. Generated PDFs and picker copies can also exist in app cache. Mobile operating systems generally manage cache lifetime, but immediate or forensic deletion is not guaranteed.

## Retention and Deletion

Data remains on the device until the user edits or deletes it, uses the in-app delete-all flow, clears app storage, or uninstalls the app according to operating-system behavior.

- Deleting a document removes its database record and attempts to remove its encrypted pages.
- Deleting a vehicle, service, or payment removes associated records and attempts to remove associated managed media.
- The delete-all flow clears user records and managed image directories.
- Copies previously exported, shared, backed up by the operating system, or stored by another app are not controlled by this deletion.

## Security

No storage mechanism can protect data on a fully compromised or unlocked device. Review the complete threat model and reporting process in [SECURITY.md](SECURITY.md).

## Changes to This Notice

Changes that add network services, telemetry, accounts, new permissions, or materially different storage behavior must update this notice in the same release.