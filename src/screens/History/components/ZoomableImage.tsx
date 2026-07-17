import React from "react";
import { Dimensions } from "react-native";
import { Image } from "expo-image";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

export function ZoomableImage({ uri }: { uri: string }) {
  const scale = useSharedValue(1);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = e.scale;
    })
    .onEnd(() => {
      if (scale.value < 1) scale.value = withTiming(1);
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = scale.value > 1 ? withTiming(1) : withTiming(2);
    });

  const composed = Gesture.Simultaneous(pinch, doubleTap);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={{ width, height }}>
        <Animated.View style={[{ flex: 1 }, animStyle]}>
          <Image source={{ uri }} style={{ width, height }} contentFit="contain" />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}