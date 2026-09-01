import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import type { RootStackParamList } from "../../../app/navigation/routes";
import type {
  DocumentOwnerType,
  VehicleDocument,
} from "../../../domain/entities/Document";
import { getDatabase } from "../../../data/db/database";
import { SQLiteDocumentRepo } from "../../../data/repositories/SQLiteDocumentRepo";
import {
  deleteEncryptedImage,
  encryptImage,
} from "../../../security/imageEncryption";
import { colors } from "../../../theme/colors";
import { radius, spacing } from "../../../theme/spacing";
import { typography, typeScale } from "../../../theme/typography";
import { formatDate } from "../../../utils/date";
import DatePickerField from "../../AddEntry/components/DatePickerField";
import AlertModal from "../AlertModal";
import EncryptedImage from "../EncryptedImage";

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
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => openEditor(null)}
          hitSlop={8}
        >
          <Icon name="plus" size={13} color={colors.accent} />
        </TouchableOpacity>
      </View>

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
          { label: t("common.delete"), variant: "danger", onPress: deleteDocument },
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

function DocumentEditorModal({
  visible,
  document,
  vehicleId,
  ownerType,
  ownerId,
  onClose,
  onSaved,
  onError,
}: Props & {
  visible: boolean;
  document: VehicleDocument | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
  onError: (message: string) => void;
}) {
  const { t } = useTranslation();
  const [documentTitle, setDocumentTitle] = useState("");
  const [category, setCategory] = useState("");
  const [dateTs, setDateTs] = useState(Date.now());
  const [notes, setNotes] = useState("");
  const [pages, setPages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (!visible) return;
    setDocumentTitle(document?.title ?? "");
    setCategory(document?.category ?? "");
    setDateTs(document?.dateTs ?? Date.now());
    setNotes(document?.notes ?? "");
    setPages(document?.pages.map((page) => page.path) ?? []);
  }, [document, visible]);

  const addFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setPages((current) => [
        ...current,
        ...result.assets.map((asset) => asset.uri),
      ]);
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
      setPages((current) => [...current, result.assets[0].uri]);
    }
  };

  const movePage = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= pages.length) return;
    setPages((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const save = async () => {
    if (!documentTitle.trim() || pages.length === 0) return;
    setSaving(true);
    const newlyEncryptedPaths: string[] = [];
    let persisted = false;
    try {
      const encryptedPaths: string[] = [];
      for (const path of pages) {
        if (path.endsWith(".enc")) {
          encryptedPaths.push(path);
        } else {
          const encryptedPath = await encryptImage(path);
          encryptedPaths.push(encryptedPath);
          newlyEncryptedPaths.push(encryptedPath);
        }
      }
      const db = await getDatabase();
      const repo = new SQLiteDocumentRepo(db);
      if (document) {
        const removedPaths = document.pages
          .map((page) => page.path)
          .filter((path) => !encryptedPaths.includes(path));
        await repo.update(document.id, {
          title: documentTitle,
          category: category || null,
          dateTs,
          notes: notes || null,
          pagePaths: encryptedPaths,
        });
        persisted = true;
        await Promise.all(
          removedPaths.map((path) => deleteEncryptedImage(path).catch(() => {})),
        );
      } else {
        await repo.insert({
          vehicleId,
          ownerType,
          ownerId,
          title: documentTitle,
          category: category || null,
          dateTs,
          notes: notes || null,
          pagePaths: encryptedPaths,
        });
        persisted = true;
      }
      onClose();
      await onSaved();
    } catch (cause) {
      if (!persisted) {
        await Promise.all(
          newlyEncryptedPaths.map((path) =>
            deleteEncryptedImage(path).catch(() => {}),
          ),
        );
      }
      onError((cause as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>
            {document ? t("documents.edit") : t("documents.add")}
          </Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>{t("documents.name")}</Text>
            <TextInput
              style={styles.input}
              value={documentTitle}
              onChangeText={setDocumentTitle}
              placeholder={t("documents.namePlaceholder")}
              placeholderTextColor={colors.text2}
            />
            <Text style={styles.fieldLabel}>{t("documents.category")}</Text>
            <TextInput
              style={styles.input}
              value={category}
              onChangeText={setCategory}
              placeholder={t("documents.categoryPlaceholder")}
              placeholderTextColor={colors.text2}
            />
            <DatePickerField value={dateTs} onChange={setDateTs} />
            <Text style={styles.fieldLabel}>{t("documents.notes")}</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder={t("documents.notesPlaceholder")}
              placeholderTextColor={colors.text2}
              multiline
            />
            <Text style={styles.fieldLabel}>{t("documents.pagesLabel")}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.pageRow}>
                {pages.map((path, index) => (
                  <View key={`${path}-${index}`} style={styles.pageItem}>
                    <EncryptedImage path={path} style={styles.pagePreview} />
                    <View style={styles.pageActions}>
                      <TouchableOpacity onPress={() => movePage(index, -1)} disabled={index === 0}>
                        <Icon name="chevron-left" size={11} color={index === 0 ? colors.border2 : colors.text1} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setPages((current) => current.filter((_, pageIndex) => pageIndex !== index))}>
                        <Icon name="times" size={12} color={colors.dangerText} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => movePage(index, 1)} disabled={index === pages.length - 1}>
                        <Icon name="chevron-right" size={11} color={index === pages.length - 1 ? colors.border2 : colors.text1} />
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
          </ScrollView>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>{t("common.cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveButton,
                (!documentTitle.trim() || pages.length === 0 || saving) && styles.disabled,
              ]}
              onPress={save}
              disabled={!documentTitle.trim() || pages.length === 0 || saving}
            >
              {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveText}>{t("common.save")}</Text>}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerTitle: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  sectionTitle: { ...typography.overline },
  addButton: { width: 32, height: 32, borderRadius: radius.sm, backgroundColor: colors.bg2, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border1 },
  loading: { marginVertical: spacing.lg },
  empty: { fontSize: typeScale.bodySmall, color: colors.text2, fontStyle: "italic" },
  documentRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.bg2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border1, padding: spacing.sm },
  documentContent: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  thumbnail: { width: 48, height: 56, borderRadius: radius.sm },
  thumbnailPlaceholder: { width: 48, height: 56, borderRadius: radius.sm, backgroundColor: colors.bg3, alignItems: "center", justifyContent: "center" },
  documentText: { flex: 1, minWidth: 0 },
  documentTitle: { ...typography.bodyStrong, color: colors.text0 },
  documentMeta: { fontSize: typeScale.caption, color: colors.text2, marginTop: 2 },
  documentNotes: { fontSize: typeScale.captionLarge, color: colors.text1, marginTop: 3 },
  rowAction: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.65)" },
  modalSheet: { maxHeight: "92%", backgroundColor: colors.bg1, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, gap: spacing.md },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border2, alignSelf: "center" },
  modalTitle: { ...typography.buttonLarge, color: colors.text0, textAlign: "center" },
  fieldLabel: { ...typography.overline, marginTop: spacing.md, marginBottom: spacing.xs },
  input: { height: 48, backgroundColor: colors.bg3, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border1, color: colors.text0, paddingHorizontal: spacing.md, fontSize: typeScale.body },
  notesInput: { height: 72, textAlignVertical: "top", paddingTop: spacing.sm },
  pageRow: { flexDirection: "row", gap: spacing.sm },
  pageItem: { width: 92, backgroundColor: colors.bg2, borderRadius: radius.sm, overflow: "hidden" },
  pagePreview: { width: 92, height: 112 },
  pageActions: { height: 32, flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  sourceRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  sourceButton: { flex: 1, height: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border1, backgroundColor: colors.bg2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  sourceText: { ...typography.button, color: colors.text1 },
  modalActions: { flexDirection: "row", gap: spacing.md },
  cancelButton: { flex: 1, height: 48, borderRadius: radius.md, backgroundColor: colors.bg3, alignItems: "center", justifyContent: "center" },
  cancelText: { ...typography.button, color: colors.text0 },
  saveButton: { flex: 1, height: 48, borderRadius: radius.md, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  saveText: { ...typography.button, color: colors.white },
  disabled: { opacity: 0.4 },
});