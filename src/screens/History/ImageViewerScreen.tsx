import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { useRoute } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../app/navigation/routes";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { ZoomableImage } from "./components/ZoomableImage";
import { colors } from "../../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "ImageViewer">;

const { width } = Dimensions.get("window");

export default function ImageViewerScreen() {
  const route = useRoute<Props["route"]>();
  const { images, initialIndex } = route.params;

  const index = useSharedValue(initialIndex);
  const translateX = useSharedValue(-initialIndex * width);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = -index.value * width + e.translationX;
    })
    .onEnd((e) => {
      const direction = e.translationX > 50 ? -1 : e.translationX < -50 ? 1 : 0;

      index.value = Math.max(
        0,
        Math.min(images.length - 1, index.value + direction),
      );

      translateX.value = withSpring(-index.value * width, {
        damping: 30,
        stiffness: 260,
        mass: 0.9,
        overshootClamping: true,
      });
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.root}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.container, animStyle]}>
          {images.map((uri, i) => (
            <View key={i} style={styles.imageWrap}>
              <ZoomableImage uri={uri} />
            </View>
          ))}
        </Animated.View>
      </GestureDetector>

      {images.length > 1 && (
        <View style={styles.dotsContainer}>
          {images.map((_, i) => (
            <Dot key={i} i={i} index={index} />
          ))}
        </View>
      )}
    </View>
  );
}

function Dot({ i, index }: { i: number; index: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const active = Math.round(index.value) === i;

    return {
      width: active ? 8 : 6,
      height: active ? 8 : 6,
      opacity: active ? 1 : 0.4,
      backgroundColor: active ? colors.white : colors.text3,
      transform: [{ scale: active ? 1.2 : 1 }],
    };
  });

  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "black",
  },

  container: {
    flexDirection: "row",
    flex: 1,
  },

  imageWrap: {
    width,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  dotsContainer: {
    position: "absolute",
    bottom: 30,
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,

    paddingHorizontal: 10,
    paddingVertical: 6,

    backgroundColor: colors.bg1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border1,
  },

  dot: {
    borderRadius: 999,
  },
});
