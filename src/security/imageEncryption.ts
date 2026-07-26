import * as FileSystem from "expo-file-system/legacy";
import {
  randomBytes,
  createCipheriv,
  Buffer,
  createDecipheriv,
} from "react-native-quick-crypto";
import { getDatabaseKey } from "./keyManager";

function bufferToHex(buffer: Buffer) {
  return buffer.toString("hex");
}

function hexToBuffer(hex: string) {
  const bytes = new Uint8Array(hex.length / 2);

  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }

  return Buffer.from(bytes);
}

export async function encryptImage(uri: string): Promise<string> {
  const keyHex = await getDatabaseKey();

  const key = hexToBuffer(keyHex);

  const iv = Buffer.from(randomBytes(12));

  const cipher = createCipheriv("aes-256-gcm", key, iv);

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(base64, "base64")),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  const payload = {
    iv: bufferToHex(iv),
    tag: bufferToHex(tag),
    data: encrypted.toString("hex"),
  };

  const dir = FileSystem.documentDirectory + "revlog_images/";

  const info = await FileSystem.getInfoAsync(dir);

  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, {
      intermediates: true,
    });
  }

  const filename = dir + Date.now() + ".enc";

  await FileSystem.writeAsStringAsync(filename, JSON.stringify(payload), {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return filename;
}

export async function decryptImage(encryptedPath: string): Promise<string> {
  const keyHex = await getDatabaseKey();

  const key = hexToBuffer(keyHex);

  const raw = await FileSystem.readAsStringAsync(encryptedPath, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const payload = JSON.parse(raw);

  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    hexToBuffer(payload.iv),
  );

  decipher.setAuthTag(hexToBuffer(payload.tag));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.data, "hex")),
    decipher.final(),
  ]);

  const filename = encryptedPath.split("/").pop();

  const ext = encryptedPath.includes(".png") ? "png" : "jpg";

  const temp = FileSystem.cacheDirectory + "revlog_preview_" + filename + "." + ext;

  await FileSystem.writeAsStringAsync(temp, decrypted.toString("base64"), {
    encoding: FileSystem.EncodingType.Base64,
  });

  return temp;
}
