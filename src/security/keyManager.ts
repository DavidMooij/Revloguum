import * as Keychain from "react-native-keychain";

import { generateDatabaseKey } from "./keyGenerator";

const SERVICE_KEY = "com.revlog.database";
const USERNAME = "revlog";

export async function getDatabaseKey(): Promise<string> {
  const existing = await Keychain.getGenericPassword({
    service: SERVICE_KEY,
  });

  if (existing) {
    return existing.password;
  }

  const key = generateDatabaseKey();

  await Keychain.setGenericPassword(USERNAME, key, {
    service: SERVICE_KEY,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
  });

  return key;
}

export async function deleteDatabaseKey(): Promise<void> {
  await Keychain.resetGenericPassword({
    service: SERVICE_KEY,
  });
}
