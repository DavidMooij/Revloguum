# Revloguum Security Policy

## Supported Versions

Security fixes are developed for the latest version on the default branch. Older builds may not receive fixes.

## Reporting a Vulnerability

Use GitHub private vulnerability reporting for this repository when it is available. Include the affected version, platform, reproduction steps, impact, and any suggested remediation.

Do not publish exploit details, private vehicle data, decrypted files, passwords, keys, or backup contents in a public issue. If private reporting is unavailable, open a minimal public issue asking the maintainer for a private contact channel without including sensitive details.

## Security Scope and Goals

Revloguum is intended to be a local-first mobile application. Its security goals are to:

- protect persisted vehicle data from casual offline access;
- keep encryption keys out of application files and source code;
- protect exported backups with a user-supplied password;
- detect modification of authenticated encrypted media and backups;
- avoid server-side exposure of personal vehicle data by design.

Sensitive data includes vehicle details, odometer history, service records, fuel entries, payments, notes, vehicle and service photos, document metadata, document pages, and exported reports or backups.

## Current Implementation

The following describes how the current source code is intended to work. It is not a guarantee that the implementation is complete, defect-free, correctly integrated into every build, or resistant to a determined attacker. Independent review and device-level verification are still required.

### Database

- [app.json](app.json) configures Expo SQLite to use SQLCipher.
- The source code attempts to generate a random 32-byte database key on first use.
- The implementation requests the key from platform keychain/keystore storage rather than intentionally writing it to the database or source tree.
- The database initialization code requests foreign keys, secure deletion, cipher memory security, and full synchronous writes.

Relevant code: [database.ts](src/data/db/database.ts), [keyGenerator.ts](src/security/keyGenerator.ts), and [keyManager.ts](src/security/keyManager.ts).

### Persistent Images and Document Pages

- The source code attempts to encrypt new vehicle photos, service photos, and document pages individually before storing managed copies in the app's persistent directory.
- The media helper is implemented using AES-256-GCM and requests a fresh random 12-byte IV and authentication tag for each file.
- Document pages are routed through the same helper as other managed images.
- Import code is intended to encrypt imported media again with the destination device's database key.

Relevant code: [imageEncryption.ts](src/security/imageEncryption.ts) and [SQLiteDocumentRepo.ts](src/data/repositories/SQLiteDocumentRepo.ts).

### Backups

- Backup code is intended to include database records and referenced media and document pages.
- The current implementation requests a 32-byte random salt and uses PBKDF2-HMAC-SHA256 with 650,000 iterations to derive a 256-bit key from the user's password.
- It uses AES-256-GCM with a requested fresh 12-byte IV for the backup payload.
- Import code attempts to reject an invalid envelope, wrong password, authentication failure, malformed core data, or missing document-page data.
- Import is implemented with merge/replace-by-identifier semantics rather than a destructive full-database replacement.
- The code includes a compatibility path for backups created using the historical authenticated app identifier.

Backup compatibility is security-sensitive. Authenticated metadata, envelope versions, KDF parameters, and cipher parameters must not be changed without an explicit compatibility path for existing `.rvlg` files.

Relevant code: [useExport.ts](src/hooks/useExport.ts).

These descriptions have not been independently audited and must not be treated as a promise that data is encrypted in every state or build.

### Local Notifications

Reminder content is generated locally from vehicle, service, and payment data. Notifications are scheduled through the operating system. Notification previews may expose their text on a lock screen according to the user's system settings.

## Plaintext Boundaries

Encryption at rest does not mean data is encrypted at every moment:

- Data is decrypted in application memory while it is displayed or processed.
- Image and document previews are written to the app cache after decryption.
- Generated PDF reports are plaintext files in the app cache and remain plaintext when shared or saved.
- The operating system may copy selected imports and generated exports into temporary cache locations.
- A backup password protects the `.rvlg` backup but does not protect a generated PDF.

Users should treat unlocked devices, notification previews, screenshots, PDFs, and external share destinations as sensitive.

## Privacy and Data Handling

This section describes the current open-source application. Distributors who modify the app, add services, or publish a build under another identity must review and update it.

### Locally Stored Data

Depending on use, the app may store vehicle details and odometer values; service, fuel, cost, and payment records; notes and dates; photos and document pages; reminder settings; and interface preferences. The implementation is designed to keep core records in the local app database and managed media in app storage.

### Data Collection

The current source code contains no Revloguum account system, advertising SDK, analytics integration, or application backend intended to receive personal vehicle records. This does not control data processing by operating systems, app stores, build providers, devices, forks, or destinations selected through the system sharing interface.

### Permissions

- Camera access is requested when the user chooses to capture a service image or document page.
- Photo-library access is used when the user selects a vehicle image, service image, or document page through the platform picker.
- Notification permission is requested for local reminders. The operating system controls lock-screen visibility.
- The system document picker and sharing interface are used for user-directed backup and report operations.

### Exports and Sharing

The backup implementation is intended to password-protect `.rvlg` files, but this property is not guaranteed without independent verification. Generated PDF reports are plaintext and may contain sensitive records and media. Once a file leaves the app, its retention and protection depend on the selected destination and the user.

### Retention and Deletion

Data normally remains until it is edited or deleted, the in-app delete-all flow is used, app storage is cleared, or the app is uninstalled according to operating-system behavior. Deletion code attempts to remove associated managed media, but immediate or forensic deletion from flash storage, caches, system backups, exports, or other apps is not guaranteed.

## Threat Model

### Considered

- An attacker obtains copied application files without access to the unlocked runtime or OS key storage.
- An attacker obtains an exported encrypted backup.
- Stored encrypted media or backup ciphertext is modified.
- A locked device is accessed opportunistically without its unlock credentials.

### Out of Scope

- A rooted or jailbroken device with malware able to inspect process memory or bypass OS access controls.
- Keyloggers, screen capture, accessibility abuse, or malicious keyboards on an unlocked device.
- Compromise of an external app, cloud drive, messenger, or recipient selected by the user for sharing.
- Weak, reused, disclosed, or socially engineered backup passwords.
- Guaranteed forensic erasure from flash storage, operating-system caches, backups, or external destinations.

## Release Verification

Security-sensitive releases should manually verify:

1. A fresh install creates a keyed SQLCipher database and an unkeyed open cannot read it.
2. Vehicle, service, and document images are not stored as plain JPEG or PNG files in persistent app storage.
3. A backup imports with the correct password and fails with a wrong password.
4. Modifying encrypted backup bytes causes authentication failure.
5. Vehicle, service, fuel, cost, intervals, custom types, photos, documents, and document page order survive backup and restore.
6. Imported images and document pages are encrypted under the destination device key.
7. Deleting a document or its vehicle/service/payment owner removes its managed encrypted pages.
8. PDF options include or omit notes, costs, photos, document metadata, and document pages as selected.

The repository currently has no automated security test suite. TypeScript compilation does not replace these device checks or an independent security review.

## Dependency Advisory Status

As of 2026-09-01, `npm audit --omit=dev` reports 24 transitive advisories: 19 moderate and 5 high.

- The high-severity findings are in `image-size` through Metro/Expo build tooling.
- Moderate findings are reported through React Navigation's URI parsing dependencies and Expo/Xcode tooling.
- `npm audit fix --force` proposes an incompatible Expo downgrade and must not be applied blindly.

These are upstream transitive dependencies rather than application-owned cryptographic code, but they still require review before a production binary release. Update only to versions supported by the active Expo SDK, run native regression tests after upgrading, and rerun the audit. Do not process untrusted project assets with affected build tooling.

## Hardening Opportunities

- Add automated backup compatibility and corruption tests.
- Add automated lifecycle tests for encrypted files and cascading deletion.
- Resolve or formally assess the currently reported transitive dependency advisories.
- Add optional biometric or inactivity locking for sensitive views and exports.
- Minimize and explicitly clean decrypted cache artifacts after use.
- Obtain an independent cryptographic and mobile-platform security review before making high-assurance claims.