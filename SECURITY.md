# Revloguum Security Policy

## Supported Versions

Security fixes are developed for the latest version on the default branch. Older builds may not receive fixes.

## Reporting a Vulnerability

Use GitHub private vulnerability reporting for this repository when it is available. Include the affected version, platform, reproduction steps, impact, and any suggested remediation.

Do not publish exploit details, private vehicle data, decrypted files, passwords, keys, or backup contents in a public issue. If private reporting is unavailable, open a minimal public issue asking the maintainer for a private contact channel without including sensitive details.

## Scope and Goals

Revloguum is a local-first mobile application. Its security goals are to:

- protect persisted vehicle data from casual offline access;
- keep encryption keys out of application files and source code;
- protect exported backups with a user-supplied password;
- detect modification of authenticated encrypted media and backups;
- avoid server-side exposure of personal vehicle data by design.

Sensitive data includes vehicle details, odometer history, service records, fuel entries, payments, notes, vehicle and service photos, document metadata, document pages, and exported reports or backups.

## Implemented Controls

### Database

- Expo SQLite is built with SQLCipher enabled through [app.json](app.json).
- A random 32-byte database key is generated on first use.
- The key is requested from platform keychain/keystore storage and is not written to the database or source tree.
- Foreign keys, secure deletion, cipher memory security, and full synchronous writes are enabled when the database opens.

Relevant code: [database.ts](src/data/db/database.ts), [keyGenerator.ts](src/security/keyGenerator.ts), and [keyManager.ts](src/security/keyManager.ts).

### Persistent Images and Document Pages

- New vehicle photos, service photos, and document pages are encrypted individually before being stored in the app's persistent directory.
- Media encryption uses AES-256-GCM with a fresh random 12-byte IV and authentication tag for each file.
- Document pages use the same central encryption helper as other persistent images.
- Imported media is encrypted again with the destination device's database key.

Relevant code: [imageEncryption.ts](src/security/imageEncryption.ts) and [SQLiteDocumentRepo.ts](src/data/repositories/SQLiteDocumentRepo.ts).

### Backups

- Backup payloads contain database records and the contents of referenced media and document pages.
- A 32-byte random salt and PBKDF2-HMAC-SHA256 with 650,000 iterations derive a 256-bit key from the user's password.
- AES-256-GCM with a fresh 12-byte IV provides confidentiality and integrity for the backup payload.
- Import rejects an invalid envelope, a wrong password, failed authentication, malformed core data, or missing document-page data.
- Import uses merge/replace-by-identifier semantics; it is not a destructive full-database replacement.
- Import retains compatibility with backups created using the historical authenticated app identifier.

Backup compatibility is security-sensitive. Authenticated metadata, envelope versions, KDF parameters, and cipher parameters must not be changed without an explicit compatibility path for existing `.rvlg` files.

Relevant code: [useExport.ts](src/hooks/useExport.ts).

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

## Deletion and Retention

Normal deletion removes database records and attempts to remove their managed encrypted media. Cascading owner deletion covers vehicle, service, payment, and document relationships. The in-app "delete all data" flow clears user records and managed image directories, but it is not presented as a forensic secure-wipe guarantee.

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