import * as Keychain from 'react-native-keychain';

const SERVICE_KEY = 'com.revlog.dbencryptionkey';
const USERNAME = 'revlog_db';

function generateKey(): string {
  const array = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < 32; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function getDatabaseKey(): Promise<string> {
  try {
    const existing = await Keychain.getGenericPassword({ service: SERVICE_KEY });
    if (existing && existing.password) {
      return existing.password;
    }
  } catch {
    // not found yet
  }

  const newKey = generateKey();
  await Keychain.setGenericPassword(USERNAME, newKey, {
    service: SERVICE_KEY,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return newKey;
}

export async function deleteKey(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SERVICE_KEY });
}

export async function setDatabaseKey(key: string): Promise<void> {
  await Keychain.setGenericPassword(USERNAME, key, {
    service: SERVICE_KEY,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}
