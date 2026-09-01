import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { colors } from "../../../theme/colors";
import { radius, spacing } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";
import EncryptedImage from "../EncryptedImage";

interface Props {
  pages: string[];
  onChange: (pages: string[]) => void;
  onError: (message: string) => void;
}

export default function DocumentPagesEditor({
  pages,
  onChange,
  onError,
}: Props) {
  const { t } = useTranslation();

  const addFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      onChange([...pages, ...result.assets.map((asset) => asset.uri)]);
    }
  };

  const addFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      onError(t("documents.cameraPermission"));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      onChange([...pages, result.assets[0].uri]);
    }
  };

  const movePage = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= pages.length) return;
    const next = [...pages];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const removePage = (index: number) => {
    onChange(pages.filter((_, pageIndex) => pageIndex !== index));
  };

  return (
    <>
      <Text style={styles.label}>{t("documents.pagesLabel")}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.pageRow}>
          {pages.map((path, index) => (
            <View key={`${path}-${index}`} style={styles.pageItem}>
              <EncryptedImage path={path} style={styles.preview} />
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => movePage(index, -1)}
                  disabled={index === 0}
                >
                  <Icon
                    name="chevron-left"
                    size={11}
                    color={index === 0 ? colors.border2 : colors.text1}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removePage(index)}>
                  <Icon name="times" size={12} color={colors.dangerText} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => movePage(index, 1)}
                  disabled={index === pages.length - 1}
                >
                  <Icon
                    name="chevron-right"
                    size={11}
                    color={
                      index === pages.length - 1
                        ? colors.border2
                        : colors.text1
                    }
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={styles.sourceRow}>
        <TouchableOpacity style={styles.sourceButton} onPress={addFromGallery}>
          <Icon name="images" size={15} color={colors.accent} />
          <Text style={styles.sourceText}>{t("documents.gallery")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sourceButton} onPress={addFromCamera}>
          <Icon name="camera" size={15} color={colors.accent} />
          <Text style={styles.sourceText}>{t("documents.camera")}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.overline,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  pageRow: { flexDirection: "row", gap: spacing.sm },
  pageItem: {
    width: 92,
    backgroundColor: colors.bg2,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  preview: { width: 92, height: 112 },
  actions: {
    height: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  sourceRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  sourceButton: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border1,
    backgroundColor: colors.bg2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  sourceText: { ...typography.button, color: colors.text1 },
});