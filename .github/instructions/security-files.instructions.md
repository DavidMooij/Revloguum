---
name: "Security and encrypted files"
description: "Use when changing encryption, key management, images, document pages, backup import/export, PDF generation, file sharing, permissions, or secure deletion in Revloguum."
applyTo: "src/security/**/*.ts,src/hooks/useExport.ts,src/hooks/usePdfExport.ts,src/data/repositories/SQLiteDocumentRepo.ts,src/screens/Documents/**/*.tsx,src/screens/components/documents/**/*.tsx,SECURITY.md,PRIVACY.md"
---
# Security and encrypted files

- Use the central helpers in `src/security/imageEncryption.ts` for persistent vehicle images, service images, and document pages. Never persist gallery or camera source URIs as the final stored file.
- Treat decrypted previews as temporary cache artifacts. Do not describe them as permanently encrypted while they are being viewed or exported.
- Generate a fresh random IV for every AES-GCM encryption operation. Never reuse or log keys, IVs, passwords, plaintext, or decrypted file paths.
- Keep the database key in the platform keychain/keystore through `src/security/keyManager.ts`.
- Keep backup compatibility deliberate. Changing authenticated metadata or encryption parameters can make existing backups unreadable; version such changes and provide an explicit compatibility path.
- Backup export must fail if a referenced persistent page cannot be read. Import must validate required page payloads before mutating the database.
- Imported images and document pages must be encrypted again with the destination device key before being persisted.
- PDF options must distinguish metadata inclusion from embedding potentially large image pages when the UI offers that distinction.
- Deleting or replacing owners, documents, or images must clean up encrypted files without deleting files still referenced by a replacement record.
- Update `SECURITY.md`, `PRIVACY.md`, and manual verification guidance whenever storage, permissions, cryptography, sharing, or data flow changes.
