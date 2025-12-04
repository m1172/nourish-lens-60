import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Check } from 'lucide-react-native';

type Item = { label: string; detail: string };

type Props = {
  items: Item[];
  onComplete?: () => void;
};

const R = 10;
const CIRC = 2 * Math.PI * R;

const FADE_DELAY = 200;
const FADE_DURATION = 300;
const PROGRESS_PER_ITEM_MS = 2000; // ~3–4s per line

const CustomizingStep: React.FC<Props> = ({ items, onComplete }) => {
  const [customizingProgress, setCustomizingProgress] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const itemVisAnims = useRef<Animated.Value[]>([]);
  const defaultVis = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const id = progressAnim.addListener(({ value }) =>
      setCustomizingProgress(value)
    );
    return () => progressAnim.removeListener(id);
  }, [progressAnim]);

  useEffect(() => {
    setCustomizingProgress(0);
    progressAnim.stopAnimation();
    progressAnim.setValue(0);

    itemVisAnims.current = items.map(() => new Animated.Value(0));

    const fadeIn = Animated.stagger(
      FADE_DELAY,
      itemVisAnims.current.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: FADE_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      )
    );

    const progress = Animated.timing(progressAnim, {
      toValue: 100,
      duration: Math.max(
        PROGRESS_PER_ITEM_MS,
        items.length * PROGRESS_PER_ITEM_MS
      ),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });

    let completeTimeout: ReturnType<typeof setTimeout> | null = null;
    const combo = Animated.parallel([fadeIn, progress], {
      stopTogether: true,
    });

    combo.start(({ finished }) => {
      if (finished) {
        completeTimeout = setTimeout(() => onComplete && onComplete(), 400);
      }
    });

    return () => {
      combo.stop();
      itemVisAnims.current.forEach((a) => a.stopAnimation());
      if (completeTimeout) clearTimeout(completeTimeout);
    };
  }, [items, onComplete, progressAnim]);

  const itemProgressInterpolators = useMemo(
    () =>
      items.map((_, idx) =>
        progressAnim.interpolate({
          inputRange: [idx * 25, idx * 25 + 25],
          outputRange: ['0%', '100%'],
          extrapolate: 'clamp',
        })
      ),
    [items, progressAnim]
  );

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Customizing your program</Text>
      <View style={styles.list}>
        {items.map((item, idx) => {
          const itemProgress = Math.max(0, customizingProgress - idx * 25);
          const isComplete = customizingProgress > idx * 25 + 25;
          const isProcessing = itemProgress > 0 && itemProgress <= 25;
          const visibility = itemVisAnims.current[idx] ?? defaultVis;
          const translateY = visibility.interpolate({
            inputRange: [0, 1],
            outputRange: [10, 0],
          });

          const dashOffset = CIRC * (1 - itemProgress / 25);
          const fillWidth = itemProgressInterpolators[idx];

          return (
            <Animated.View
              key={item.label}
              style={[
                styles.item,
                {
                  opacity: visibility,
                  transform: [{ translateY }],
                },
              ]}
            >
              <View style={styles.itemRow}>
                <Text style={styles.itemLabel}>{item.label}:</Text>
                <View style={styles.itemRight}>
                  <Text style={styles.itemDetail}>{item.detail}</Text>
                  {isProcessing && (
                    <View style={styles.circleWrapper}>
                      <Svg width={24} height={24} viewBox='0 0 24 24'>
                        <Circle
                          cx='12'
                          cy='12'
                          r={R}
                          stroke='rgba(148,163,184,0.3)'
                          strokeWidth={4}
                          fill='none'
                        />
                        <Circle
                          cx='12'
                          cy='12'
                          r={R}
                          stroke='#6366F1'
                          strokeWidth={4}
                          fill='none'
                          strokeDasharray={`${CIRC}`}
                          strokeDashoffset={dashOffset}
                          strokeLinecap='round'
                          transform='rotate(-90 12 12)'
                        />
                      </Svg>
                    </View>
                  )}
                  {isComplete && <Check size={18} color='#6366F1' />}
                </View>
              </View>
              <View style={styles.progressBg}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: fillWidth,
                    },
                  ]}
                />
              </View>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

export default CustomizingStep;

const styles = StyleSheet.create({
  root: {
    paddingVertical: 24,
    gap: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#F9FAFB',
  },
  list: { gap: 16, paddingVertical: 8 },
  item: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLabel: { color: '#9CA3AF', fontSize: 14 },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemDetail: {
    color: '#F9FAFB',
    fontWeight: '600',
    fontSize: 14,
  },
  circleWrapper: { width: 24, height: 24 },
  progressBg: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#1F2937',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
  },
});
