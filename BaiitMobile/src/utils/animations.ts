import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  FadeOutDown,
  FadeOutUp,
  LinearTransition,
  SlideInRight,
  SlideInLeft,
  SlideOutRight,
  SlideOutLeft,
  ZoomIn,
  ZoomOut,
  withSpring,
  withTiming,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { animation } from '../themes/tokens';

export const AnimatedView = Animated.View;
export const AnimatedText = Animated.Text;
export const AnimatedImage = Animated.Image;
export const AnimatedScrollView = Animated.ScrollView;

export const presets = {
  fadeIn: FadeIn.duration(animation.duration.normal),
  fadeInFast: FadeIn.duration(animation.duration.fast),
  fadeInSlow: FadeIn.duration(animation.duration.slow),
  
  fadeInUp: FadeInUp.duration(animation.duration.normal).springify().damping(20).stiffness(100),
  fadeInUpFast: FadeInUp.duration(animation.duration.fast),
  fadeInUpSlow: FadeInUp.duration(animation.duration.slow),
  
  fadeInDown: FadeInDown.duration(animation.duration.normal).springify().damping(20).stiffness(100),
  fadeInDownFast: FadeInDown.duration(animation.duration.fast),
  fadeInDownSlow: FadeInDown.duration(animation.duration.slow),
  
  fadeOut: FadeOut.duration(animation.duration.normal),
  fadeOutFast: FadeOut.duration(animation.duration.fast),
  fadeOutSlow: FadeOut.duration(animation.duration.slow),
  
  fadeOutUp: FadeOutUp.duration(animation.duration.normal),
  fadeOutDown: FadeOutDown.duration(animation.duration.normal),
  
  slideInRight: SlideInRight.duration(animation.duration.normal).springify().damping(20).stiffness(100),
  slideInLeft: SlideInLeft.duration(animation.duration.normal).springify().damping(20).stiffness(100),
  slideOutRight: SlideOutRight.duration(animation.duration.normal),
  slideOutLeft: SlideOutLeft.duration(animation.duration.normal),
  
  zoomIn: ZoomIn.duration(animation.duration.normal).springify().damping(15).stiffness(150),
  zoomInFast: ZoomIn.duration(animation.duration.fast),
  zoomOut: ZoomOut.duration(animation.duration.normal),
  
  layout: LinearTransition.springify().damping(20).stiffness(100),
  layoutFast: LinearTransition.duration(animation.duration.fast),
};

export const createSpringConfig = (
  damping: number = animation.spring.gentle.damping,
  stiffness: number = animation.spring.gentle.stiffness
) => ({
  damping,
  stiffness,
});

export const createTimingConfig = (
  duration: number = animation.duration.normal,
  easing: any = Easing.out(Easing.cubic)
) => ({
  duration,
  easing,
});

export const useScaleAnimation = (initialScale: number = 1) => {
  const scale = useSharedValue(initialScale);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const scaleIn = (toValue: number = 0.95) => {
    scale.value = withSpring(toValue, createSpringConfig(15, 180));
  };
  
  const scaleOut = (toValue: number = 1) => {
    scale.value = withSpring(toValue, createSpringConfig(15, 180));
  };
  
  return { scale, animatedStyle, scaleIn, scaleOut };
};

export const useOpacityAnimation = (initialOpacity: number = 1) => {
  const opacity = useSharedValue(initialOpacity);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
  
  const fadeIn = (toValue: number = 1) => {
    opacity.value = withTiming(toValue, { duration: animation.duration.normal });
  };
  
  const fadeOut = (toValue: number = 0) => {
    opacity.value = withTiming(toValue, { duration: animation.duration.fast });
  };
  
  return { opacity, animatedStyle, fadeIn, fadeOut };
};

export const useSlideAnimation = (direction: 'up' | 'down' | 'left' | 'right' = 'up') => {
  const translateValue = useSharedValue(direction === 'down' || direction === 'right' ? -50 : 50);
  const opacity = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => {
    const transform = direction === 'up' || direction === 'down'
      ? [{ translateY: translateValue.value }]
      : [{ translateX: translateValue.value }];
    
    return {
      opacity: opacity.value,
      transform,
    };
  });
  
  const slideIn = () => {
    translateValue.value = withSpring(0, createSpringConfig(20, 100));
    opacity.value = withTiming(1, { duration: animation.duration.normal });
  };
  
  const slideOut = () => {
    translateValue.value = withTiming(direction === 'down' || direction === 'right' ? -50 : 50);
    opacity.value = withTiming(0, { duration: animation.duration.fast });
  };
  
  return { translateValue, opacity, animatedStyle, slideIn, slideOut };
};

export const useProgressAnimation = () => {
  const progress = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));
  
  const setProgress = (value: number, animated: boolean = true) => {
    if (animated) {
      progress.value = withTiming(value, { duration: animation.duration.slow });
    } else {
      progress.value = value;
    }
  };
  
  return { progress, animatedStyle, setProgress };
};

export const useShimmerAnimation = () => {
  const shimmerPosition = useSharedValue(-1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{
      translateX: interpolate(
        shimmerPosition.value,
        [-1, 1],
        [-200, 200],
        Extrapolation.CLAMP
      ),
    }],
  }));
  
  const startShimmer = () => {
    shimmerPosition.value = withTiming(1, { duration: 1000 });
  };
  
  const resetShimmer = () => {
    shimmerPosition.value = -1;
  };
  
  return { shimmerPosition, animatedStyle, startShimmer, resetShimmer };
};

export const staggerDelay = (index: number, baseDelay: number = 50) => {
  return index * baseDelay;
};
