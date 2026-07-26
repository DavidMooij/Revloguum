# Security Documentation

## Overview

RevLog is a local-first application. Vehicle data is stored locally on the user's device and is not transmitted to external servers.

The application uses multiple layers of protection:

- SQLCipher encrypted SQLite database
- Hardware-backed key storage where available
- Encrypted export backups
- Individually encrypted image files
- No cloud synchronization of user data

---

# Local Database Encryption

## Technology

RevLog uses:

- Expo SQLite
- SQLCipher support
- Android Keystore / iOS Keychain through `react-native-keychain`

The database file is encrypted using SQLCipher AES-256 encryption.

Configuration:

```json
{
  "plugins": [
    [
      "expo-sqlite",
      {
        "useSQLCipher": true
      }
    ]
  ]
}
````

A native rebuild is required after enabling SQLCipher:

```bash
npx expo prebuild
npx expo run:android
```

---

# Database Key Management

The database encryption key is:

* Generated randomly
* 256-bit
* Stored in the platform secure storage

Implementation:

```
Application
    |
    |
    v
react-native-keychain
    |
    |
    +--> Android Keystore
    |
    +--> iOS Keychain
```

The key is never stored inside:

* SQLite database
* Application source code
* AsyncStorage
* Plain files

---

# Database Opening Flow

On application start:

1. Retrieve database key from secure storage
2. Open SQLite database
3. Apply SQLCipher key

Example:

```ts
const key = await getDatabaseKey();

const db = await SQLite.openDatabaseAsync(
  "revlog.db"
);

await db.execAsync(
  `PRAGMA key = "x'${key}'";`
);

await db.getFirstAsync(
  "SELECT count(*) FROM sqlite_master;"
);
```

If the key is incorrect:

```
file is not a database
```

is expected because SQLCipher cannot decrypt the database.

---

# Image Storage

Images are encrypted individually before being written to disk.

Encryption scheme:

```
AES-256-GCM

Key:
Same 256-bit key used for the database,
stored in Android Keystore / iOS Keychain

IV:
12 random bytes per image

Format:
{ iv, tag, data } — hex-encoded, stored as .enc files
```

Storage location:

```
Application private storage

revlog_images/
    1699999999999.enc
    1700000000123.enc
```

Images are decrypted only in memory when displayed, and written to a temporary
cache file that is cleared with the rest of the app cache. They are not stored
in the public gallery.

Protection comes from:

* AES-256-GCM encryption of each image file
* Android application sandbox
* iOS application container
* OS-level filesystem permissions

---

# Backup Encryption

Exported backups are encrypted independently from the local database.

Format:

```
.rvlg file

{
  version,
  salt,
  iv,
  encryptedData
}
```

Encryption:

```
Password
    |
    v
PBKDF2-HMAC-SHA256
    |
    v
AES-256-GCM
    |
    v
Encrypted backup
```

Parameters:

```
Salt:
32 bytes

IV:
12 bytes

Key:
256 bit AES

PBKDF2 iterations:
650000
```

Images included in a backup are decrypted first, then embedded as base64 inside
the payload before the whole payload is encrypted with the backup password. On
import, images are re-encrypted with the current device's key.

The backup can safely be stored outside the device.

---

# Threat Model

## Protected against

### Lost phone

If the phone is locked:

* Database key cannot be retrieved
* SQLite database remains encrypted
* Image files remain encrypted
* Application data stays inside private storage

---

### Someone copying the database file

Example:

```
revlog.db
```

Opening it with normal SQLite:

```bash
sqlite3 revlog.db
```

Result:

```
Error: file is not a database
```

Expected behavior.

---

### Someone copying image files

A copied `.enc` image file requires the device's AES-256 key to decrypt.
Without it, the file is unreadable ciphertext.

---

### Backup file theft

A stolen `.rvlg` file requires:

* Correct password
* PBKDF2 derivation
* AES-GCM authentication

Without the password:

* Data cannot be decrypted
* Modified backups are rejected

---

# Not Protected Against

## Compromised device

Examples:

* Rooted Android device
* Jailbroken iOS device
* Malware with elevated privileges
* Active debugging access while app is unlocked

Reason:

The application must decrypt data while running.

A compromised operating system can potentially access:

* Application memory
* User input
* Screen contents

This limitation applies to all local encryption applications.

---

# Security Tests Performed

## SQLCipher verification

### Test 1: Open database without key

Command:

```bash
sqlite3 revlog.db
```

Result:

```
Error: file is not a database
```

Expected.

---

### Test 2: Open database with wrong key

Application:

```ts
PRAGMA key = "wrongkey";
```

Result:

```
file is not a database
```

Expected.

---

### Test 3: Open database with correct key

Application:

```ts
PRAGMA key = "correctkey";
```

Result:

```
{
  c: 20
}
```

Database successfully decrypted.

---

# Security Decisions

## Why not implement custom database encryption?

Custom encryption would require:

* Correct cryptographic design
* Key management
* Authentication
* Migration handling
* Secure storage

SQLCipher already provides:

* Proven encryption design
* Database authentication
* Integration with SQLite

Therefore SQLCipher is preferred.

---

# Privacy Principles

RevLog follows these principles:

* Local-first data storage
* No external data transmission
* No user accounts required
* No server-side storage
* Minimal permissions
* Encryption where technically appropriate

---

# Future Improvements

Possible future enhancements:

* Add biometric unlock option
* Add automatic database locking after inactivity
* Add encrypted cloud backup support
* Add security audit before production release