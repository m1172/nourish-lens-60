// Picker.tsx (React Native)
import { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

type PickerProps = {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  unit?: string;
  step?: number;
};

const ITEM_HEIGHT = 60;
const PICKER_HEIGHT = 240;

export const Picker: React.FC<PickerProps> = ({
  value,
  onChange,
  min,
  max,
  unit = '',
  step = 1,
}) => {
  const scrollRef = useRef<ScrollView>(null);
   const initialScrollDone = useRef(false);

  const items = useMemo(() => {
    const list: number[] = [];
    for (let v = min; v <= max + 1e-6; v += step) {
      list.push(Number(v.toFixed(4)));
    }
    return list;
  }, [min, max, step]);

  const indexFromValue = (v: number) => Math.round((v - min) / step);

  // initial scroll
  useEffect(() => {
    const i = indexFromValue(value);
    if (initialScrollDone.current) return;
    initialScrollDone.current = true;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: i * ITEM_HEIGHT,
        animated: false,
      });
    });
  }, [value, min, max, step]);

  // scroll when external value changes
  useEffect(() => {
    const i = indexFromValue(value);
    scrollRef.current?.scrollTo({
      y: i * ITEM_HEIGHT,
      animated: true,
    });
  }, [value, min, step]);

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const i = Math.round(y / ITEM_HEIGHT);
    const val = min + i * step;
    const clamped = Math.min(max, Math.max(min, val));
    if (Math.abs(clamped - value) > 1e-6) onChange(clamped);
  };

  return (
    <View style={styles.container}>
      {/* center highlight */}
      <View style={styles.centerHighlight} pointerEvents='none' />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate='fast'
        onMomentumScrollEnd={handleMomentumEnd}
        contentContainerStyle={styles.scrollInner}
      >
        {items.map((item) => {
          const isSelected = Math.abs(item - value) < step / 2;
          const isNear = !isSelected && Math.abs(item - value) <= step * 1.5;
          return (
            <View key={item} style={styles.item}>
              <Text
                style={[
                  styles.itemText,
                  isSelected && styles.itemTextSelected,
                  isNear && !isSelected && styles.itemTextNear,
                ]}
              >
                {item}
                {isSelected && !!unit && (
                  <Text style={styles.itemUnit}> {unit}</Text>
                )}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: PICKER_HEIGHT,
    width: '100%',
    overflow: 'hidden',
  },
  scrollInner: {
    paddingTop: (PICKER_HEIGHT - ITEM_HEIGHT) / 2,
    paddingBottom: (PICKER_HEIGHT - ITEM_HEIGHT) / 2,
  },
  centerHighlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: (PICKER_HEIGHT - ITEM_HEIGHT) / 2,
    height: ITEM_HEIGHT,
    backgroundColor: 'rgba(148,163,184,0.2)',
    borderRadius: 16,
    zIndex: -1,
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 24,
    fontWeight: '600',
    color: 'rgba(148,163,184,0.4)',
  },
  itemTextNear: {
    color: 'rgba(148,163,184,0.7)',
    fontSize: 26,
  },
  itemTextSelected: {
    color: '#F9FAFB',
    fontSize: 32,
  },
  itemUnit: {
    fontSize: 18,
    color: 'rgba(148,163,184,0.9)',
  },
});
