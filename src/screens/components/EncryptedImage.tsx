import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Image, type ImageStyle } from "expo-image";
import { decryptImage } from "@/security/imageEncryption";
import { colors } from "../../theme/colors";

interface Props {
  path: string | null;
  style?: ImageStyle;
  contentFit?: "cover" | "contain";
}

export default function EncryptedImage({
  path,
  style,
  contentFit = "cover",
}: Props) {
  const [uri, setUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    setUri(null);
    setLoading(true);
    if (!path) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const result = path.endsWith(".enc") ? await decryptImage(path) : path;
        if (isActive) setUri(result);
      } catch {
      } finally {
        if (isActive) setLoading(false);
      }
    })();
    return () => {
      isActive = false;
    };
  }, [path]);

  if (loading) {
    return (
      <View style={[style, styles.center]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  if (!uri) return null;

  return <Image source={{ uri }} style={style} contentFit={contentFit} />;
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg2,
  },
});
