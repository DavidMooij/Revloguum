import React, { useRef } from 'react';
import { PanResponder, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

interface Props {
  onClose: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function ModalDragHandle({ onClose, disabled = false, style }: Props) {
  const onCloseRef = useRef(onClose);
  const disabledRef = useRef(disabled);
  onCloseRef.current = onClose;
  disabledRef.current = disabled;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) => !disabledRef.current && dy > 6 && Math.abs(dy) > Math.abs(dx),
      onPanResponderRelease: (_, { dy, vy }) => {
        if (!disabledRef.current && (dy > 64 || (dy > 24 && vy > 1))) onCloseRef.current();
      }
    })
  ).current;

  return <View {...panResponder.panHandlers} hitSlop={{ top: 20, bottom: 20, left: 80, right: 80 }} style={[styles.handle, style]} />;
}

const styles = StyleSheet.create({
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2
  }
});
