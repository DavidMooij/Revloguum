import React, { useEffect, useState } from "react";
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
import { useTranslation } from "react-i18next";
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
import DatePickerField from "../../AddEntry/components/DatePickerField";
import DocumentPagesEditor from "./DocumentPagesEditor";

interface Props {
  visible: boolean;
  document: VehicleDocument | null;
  vehicleId: string;
  ownerType: DocumentOwnerType;
  ownerId: string;
  onClose: () => void;
  onSaved: () => Promise<void>;
  onError: (message: string) => void;
}

export default function DocumentEditorModal({
  visible,
  document,
  vehicleId,
  ownerType,
  ownerId,
  onClose,
  onSaved,
  onError,
}: Props) {
  const { t } = useTranslation();
  const [documentTitle, setDocumentTitle] = useState("");
  const [category, setCategory] = useState("");
  const [dateTs, setDateTs] = useState(Date.now());
  const [notes, setNotes] = useState("");
  const [pages, setPages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setDocumentTitle(document?.title ?? "");
    setCategory(document?.category ?? "");
    setDateTs(document?.dateTs ?? Date.now());
    setNotes(document?.notes ?? "");
    setPages(document?.pages.map((page) => page.path) ?? []);
  }, [document, visible]);

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
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={styles.modalSheet}
          onPress={(event) => event.stopPropagation()}
        >
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
            <DocumentPagesEditor
              pages={pages}
              onChange={setPages}
              onError={onError}
            />
          </ScrollView>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>{t("common.cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveButton,
                (!documentTitle.trim() || pages.length === 0 || saving) &&
                  styles.disabled,
              ]}
              onPress={save}
              disabled={!documentTitle.trim() || pages.length === 0 || saving}
            >
              {saving ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.saveText}>{t("common.save")}</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  modalSheet: {
    maxHeight: "92%",
    backgroundColor: colors.bg1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border2,
    alignSelf: "center",
  },
  modalTitle: {
    ...typography.buttonLarge,
    color: colors.text0,
    textAlign: "center",
  },
  fieldLabel: {
    ...typography.overline,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    height: 48,
    backgroundColor: colors.bg3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border1,
    color: colors.text0,
    paddingHorizontal: spacing.md,
    fontSize: typeScale.body,
  },
  notesInput: {
    height: 72,
    textAlignVertical: "top",
    paddingTop: spacing.sm,
  },
  modalActions: { flexDirection: "row", gap: spacing.md },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.bg3,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { ...typography.button, color: colors.text0 },
  saveButton: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { ...typography.button, color: colors.white },
  disabled: { opacity: 0.4 },
});