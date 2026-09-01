import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import type { RootStackParamList } from "../../../app/navigation/routes";
import type {
  DocumentOwnerType,
  VehicleDocument,
} from "../../../domain/entities/Document";
import { getDatabase } from "../../../data/db/database";
import { SQLiteDocumentRepo } from "../../../data/repositories/SQLiteDocumentRepo";
import { deleteEncryptedImage } from "../../../security/imageEncryption";
import { colors } from "../../../theme/colors";
import { radius, spacing } from "../../../theme/spacing";
import { typography, typeScale } from "../../../theme/typography";
import { formatDate } from "../../../utils/date";
import AlertModal from "../AlertModal";
import EncryptedImage from "../EncryptedImage";
import DocumentEditorModal from "./DocumentEditorModal";

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  vehicleId: string;
  ownerType: DocumentOwnerType;
  ownerId: string;
  title?: string;
}

export default function DocumentSection({
  vehicleId,
  ownerType,
  ownerId,
  title,
}: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<VehicleDocument | null>(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VehicleDocument | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const db = await getDatabase();
      const repo = new SQLiteDocumentRepo(db);
      const rows =
        ownerType === "service"
          ? await repo.getForServiceEntry(ownerId)
          : await repo.getForOwner(ownerType, ownerId);
      setDocuments(rows);
    } finally {
      setLoading(false);
    }
  }, [ownerId, ownerType]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const openEditor = (document: VehicleDocument | null) => {
    setEditing(document);
    setEditorVisible(true);
  };

  const deleteDocument = async () => {
    if (!deleteTarget) return;
    try {
      const db = await getDatabase();
      const paths = await new SQLiteDocumentRepo(db).delete(deleteTarget.id);
      await Promise.all(paths.map((path) => deleteEncryptedImage(path)));
      setDeleteTarget(null);
      await load();
    } catch (cause) {
      setError((cause as Error).message);
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <Icon name="file-alt" size={13} color={colors.accent} />
          <Text style={styles.sectionTitle}>
            {title ?? t("documents.title")}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.addBox} onPress={() => openEditor(null)}>
        <Icon name="plus" size={14} color={colors.accent} />
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loading} />
      ) : documents.length === 0 ? (
        <Text style={styles.empty}>{t("documents.empty")}</Text>
      ) : (
        documents.map((document) => (
          <View key={document.id} style={styles.documentRow}>
            <TouchableOpacity
              style={styles.documentContent}
              onPress={() =>
                document.pages.length > 0 &&
                navigation.navigate("ImageViewer", {
                  images: document.pages.map((page) => page.path),
                  initialIndex: 0,
                })
              }
              onLongPress={() => openEditor(document)}
              activeOpacity={0.8}
            >
              {document.pages[0] ? (
                <EncryptedImage
                  path={document.pages[0].path}
                  style={styles.thumbnail}
                />
              ) : (
                <View style={styles.thumbnailPlaceholder}>
                  <Icon name="file-alt" size={18} color={colors.text2} />
                </View>
              )}
              <View style={styles.documentText}>
                <Text style={styles.documentTitle} numberOfLines={1}>
                  {document.title}
                </Text>
                <Text style={styles.documentMeta} numberOfLines={1}>
                  {formatDate(document.dateTs)}
                  {document.category ? ` · ${document.category}` : ""}
                  {` · ${t("documents.pages", { count: document.pages.length })}`}
                </Text>
                {document.notes ? (
                  <Text style={styles.documentNotes} numberOfLines={1}>
                    {document.notes}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rowAction}
              onPress={() => openEditor(document)}
              hitSlop={8}
            >
              <Icon name="pen" size={12} color={colors.text2} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rowAction}
              onPress={() => setDeleteTarget(document)}
              hitSlop={8}
            >
              <Icon name="trash-alt" size={12} color={colors.dangerText} />
            </TouchableOpacity>
          </View>
        ))
      )}

      <DocumentEditorModal
        visible={editorVisible}
        document={editing}
        vehicleId={vehicleId}
        ownerType={ownerType}
        ownerId={ownerId}
        onClose={() => {
          setEditorVisible(false);
          setEditing(null);
        }}
        onSaved={load}
        onError={setError}
      />

      <AlertModal
        visible={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        icon="trash-alt"
        iconColor={colors.dangerText}
        title={t("documents.deleteTitle")}
        message={t("common.cannotBeUndone")}
        actions={[
          { label: t("common.cancel"), variant: "secondary", onPress: () => {} },
          {
            label: t("common.delete"),
            variant: "danger",
            onPress: deleteDocument,
          },
        ]}
      />
      <AlertModal
        visible={!!error}
        onClose={() => setError(null)}
        icon="exclamation-triangle"
        iconColor={colors.dangerText}
        title={t("common.error")}
        message={error ?? ""}
        actions={[
          { label: t("common.ok"), variant: "secondary", onPress: () => {} },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  header: { flexDirection: "row", alignItems: "center" },
  headerTitle: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  sectionTitle: { ...typography.overline },
  addBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  loading: { marginVertical: spacing.lg },
  empty: {
    fontSize: typeScale.bodySmall,
    color: colors.text2,
    fontStyle: "italic",
  },
  documentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border1,
    padding: spacing.sm,
  },
  documentContent: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  thumbnail: { width: 48, height: 56, borderRadius: radius.sm },
  thumbnailPlaceholder: {
    width: 48,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.bg3,
    alignItems: "center",
    justifyContent: "center",
  },
  documentText: { flex: 1, minWidth: 0 },
  documentTitle: { ...typography.bodyStrong, color: colors.text0 },
  documentMeta: {
    fontSize: typeScale.caption,
    color: colors.text2,
    marginTop: spacing.xxs,
  },
  documentNotes: {
    fontSize: typeScale.captionLarge,
    color: colors.text1,
    marginTop: 3,
  },
  rowAction: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});