import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { typography, typeScale } from '../../theme/typography';
import AlertModal from './AlertModal';
import EncryptedImage from './EncryptedImage';

interface Props {
  label: string;
  images: string[];
  onChange: (images: string[]) => void;
}

export default function PhotoAttachmentsField({ label, images, onChange }: Props) {
  const { t } = useTranslation();
  const [cameraAlert, setCameraAlert] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8
    });
    if (!result.canceled) onChange([...images, ...result.assets.map((asset) => asset.uri)]);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setCameraAlert(true);
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) onChange([...images, result.assets[0].uri]);
  };

  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.imageRow}>
        {images.map((path, index) => (
          <View key={`${path}-${index}`} style={styles.imageWrapper}>
            <EncryptedImage path={path} style={styles.image} />
            <TouchableOpacity onPress={() => onChange(images.filter((_, imageIndex) => imageIndex !== index))} style={styles.removeBtn}>
              <Text style={styles.removeText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <View style={styles.sourceRow}>
        <TouchableOpacity onPress={pickImage} style={styles.sourceButton}>
          <Icon name="images" size={15} color={colors.accent} />
          <Text style={styles.sourceText}>{t('addEntry.gallery')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={takePhoto} style={styles.sourceButton}>
          <Icon name="camera" size={15} color={colors.accent} />
          <Text style={styles.sourceText}>{t('addEntry.camera')}</Text>
        </TouchableOpacity>
      </View>
      <AlertModal
        visible={cameraAlert}
        onClose={() => setCameraAlert(false)}
        icon="camera"
        iconColor={colors.warningText}
        title={t('addEntry.cameraPermission')}
        message={t('addEntry.cameraPermissionMessage')}
        actions={[{ label: t('common.ok'), variant: 'secondary', onPress: () => {} }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.md },
  label: { ...typography.caption, marginBottom: spacing.sm },
  imageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  imageWrapper: {
    width: 86,
    height: 86,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.bg2,
    position: 'relative'
  },
  image: { width: '100%', height: '100%' },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  removeText: {
    color: 'white',
    fontSize: typeScale.bodyMedium,
    lineHeight: 14,
    fontWeight: '700'
  },
  sourceRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  sourceButton: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border1,
    backgroundColor: colors.bg2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm
  },
  sourceText: { ...typography.button, color: colors.text1 }
});
