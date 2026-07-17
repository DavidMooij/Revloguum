import { randomBytes } from "react-native-quick-crypto";

export function generateDatabaseKey(): string {
  return randomBytes(32).toString("hex");
}