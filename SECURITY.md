# Revloguum Security Model

## Scope

This document describes how Revloguum protects local user data, what threats are in scope, and what limitations remain.

Revloguum is a local-first mobile app. Core vehicle data is stored on-device.

## Security Goals

- Keep stored vehicle data confidential at rest
- Protect backups outside the device with password-based encryption
- Avoid server-side exposure by design
- Preserve integrity of encrypted payloads

## Architecture Summary

Main controls:
- SQLCipher-encrypted SQLite database
- Secure key storage via platform keychain/keystore integration
- Encrypted image files on local storage
- Encrypted export format for backups

Related implementation areas:
- [app.json](app.json)
- [src/security/keyManager.ts](src/security/keyManager.ts)
- [src/security/imageEncryption.ts](src/security/imageEncryption.ts)
- [src/data/db/database.ts](src/data/db/database.ts)
- [src/hooks/useExport.ts](src/hooks/useExport.ts)

## Data Classification

Sensitive user data includes:
- Vehicle details and odometer history
- Service and repair history
- Fuel entries
- Cost entries
- Vehicle images and attachments
- Exported backup payloads

## Threat Model

### Assets
- Encrypted local database file
- Encryption keys and key derivation artifacts
- Encrypted image blobs
- Encrypted backup files

### Adversaries Considered
- Opportunistic attacker with physical access to a locked device
- Attacker with copied app files (database/images/backup files)
- Cloud/storage leakage of exported backup files

### Out of Scope / Non-goals
- Fully compromised runtime environment (rooted/jailbroken device with elevated malware)
- User-installed keyloggers/screen capture malware on unlocked device
- Social engineering of backup passwords
- Weak, reused, or guessable backup passwords chosen by users

## Controls

### 1) Database Encryption at Rest
- SQLCipher is enabled for SQLite
- Database uses AES-based transparent page encryption through SQLCipher
- Unkeyed access to the database file should fail as unreadable SQLite content

### 2) Key Management
- Database key is generated randomly
- Key material is stored in secure OS facilities through keychain/keystore abstraction
- Key is not persisted in plain files, AsyncStorage, or source code

### 3) Image Protection
- Images are encrypted individually before persistent storage
- Encryption mode uses authenticated encryption (AES-GCM)
- Stored media blobs are not plain gallery images by default

### 4) Backup Protection
- Export format is encrypted end-to-end with user password
- Password-derived key uses PBKDF2-HMAC-SHA256
- Payload encryption uses AES-GCM (confidentiality + integrity)
- Stolen backup without password should remain unreadable

## Cryptographic Parameters

Backup format parameters:
- Salt: 32 bytes
- IV/nonce: 12 bytes
- KDF: PBKDF2-HMAC-SHA256
- Iterations: 650000
- Cipher: AES-256-GCM

Local media protection:
- Cipher: AES-256-GCM
- Random IV per encrypted file

## Trust Boundaries

- Inside trusted boundary:
  - App process during normal execution
  - OS-backed secure key storage APIs
- Outside trusted boundary:
  - External file shares
  - Backup destinations
  - Devices with privilege escalation or active runtime compromise

## Residual Risk

Even with strong at-rest encryption, data may be exposed if:
- Device is compromised while app is unlocked
- Malicious software can read process memory or intercept user input
- Backup password is weak or reused

This is a normal limitation of local encryption applications.

## Verification Guidance

Recommended checks for security-sensitive releases:
- Confirm SQLCipher build remains enabled after native dependency changes
- Verify unkeyed DB open fails as expected
- Validate backup decrypt fails on wrong password
- Validate altered backup fails authentication
- Verify imported images are re-encrypted for local storage

## Hardening Opportunities

Potential future improvements:
- Optional biometric re-authentication gate for sensitive actions
- Inactivity lock for backup/export operations
- Optional secure wipe workflow for all local artifacts
- Independent security review before production-scale rollout

## Responsible Disclosure

If you discover a vulnerability, report it privately to the project maintainer first and avoid public disclosure until a fix is available.