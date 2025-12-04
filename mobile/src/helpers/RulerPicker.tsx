import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
  LayoutChangeEvent,
} from 'react-native';

type RulerPickerProps = {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  unit: string;
  step?: number;
  decimalPlaces?: number;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STEP_WIDTH = 16;
const MARK_WIDTH = 2;
const LABEL_WIDTH = 40;

export const RulerPicker: React.FC<RulerPickerProps> = ({
  value,
  onChange,
  min,
  max,
  unit,
  step = 0.1,
  decimalPlaces = 1,
}) => {
  const scrollRef = useRef<FlatList<number>>(null);
  const initialScrollDone = useRef(false);
  const onChangeRef = useRef(onChange);

  const totalSteps = Math.round((max - min) / step);
  const [containerWidth, setContainerWidth] = useState<number>(SCREEN_WIDTH);
  const padding = containerWidth / 2 - STEP_WIDTH / 2;

  const roundVal = useCallback(
    (v: number) => Number(v.toFixed(decimalPlaces)),
    [decimalPlaces]
  );
  const clampVal = useCallback(
    (v: number) => Math.min(Math.max(v, min), max),
    [min, max]
  );
  const formatLabel = useCallback(
    (v: number) => roundVal(v).toFixed(decimalPlaces),
    [roundVal, decimalPlaces]
  );
  const indexFromValue = useCallback(
    (v: number) => Math.round((v - min) / step),
    [min, step]
  );
  const snappedValue = useMemo(
    () => roundVal(clampVal(value)),
    [clampVal, roundVal, value]
  );
  const initialIndex = useMemo(
    () => Math.min(Math.max(indexFromValue(snappedValue), 0), totalSteps),
    [indexFromValue, snappedValue, totalSteps]
  );

  const scrollToValue = useCallback(
    (target: number, animated: boolean) => {
      const idx = indexFromValue(clampVal(target));
      const clampedIdx = Math.min(Math.max(idx, 0), totalSteps);

      scrollRef.current?.scrollToOffset({
        offset: clampedIdx * STEP_WIDTH,
        animated,
      });
    },
    [clampVal, indexFromValue, totalSteps]
  );

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    setContainerWidth((prev) => {
      if (Math.abs(prev - width) < 0.5) return prev;
      return width;
    });
  }, []);

  const lastWidthRef = useRef<number>(SCREEN_WIDTH);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // keep ruler aligned with current value
  useEffect(() => {
    if (Math.abs(snappedValue - value) > 1e-6) {
      onChangeRef.current?.(snappedValue);
    }

    const widthChanged = Math.abs(lastWidthRef.current - containerWidth) > 0.5;

    const frame = requestAnimationFrame(() => {
      scrollToValue(snappedValue, initialScrollDone.current && !widthChanged);
      initialScrollDone.current = true;
      lastWidthRef.current = containerWidth;
    });

    return () => cancelAnimationFrame(frame);
  }, [containerWidth, snappedValue, value, scrollToValue]);

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / STEP_WIDTH);
    const raw = min + idx * step;
    const clamped = clampVal(raw);
    const rounded = roundVal(clamped);
    if (Math.abs(rounded - value) > 1e-6) onChangeRef.current?.(rounded);
  };

  const marks = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i <= totalSteps; i++) arr.push(i);
    return arr;
  }, [totalSteps]);

  const renderMark = useCallback(
    ({ item }: { item: number }) => {
      const markValue = roundVal(min + item * step);
      const nearestIntDiff = Math.abs(markValue - Math.round(markValue));
      const nearestHalfDiff = Math.abs(markValue * 2 - Math.round(markValue * 2));
      const isMain = nearestIntDiff < step / 2; // main ticks on whole numbers
      const isMid = !isMain && nearestHalfDiff < step; // mid ticks on .5
      return (
        <View style={[styles.markWrapper, { width: STEP_WIDTH }]}>
          <View
            style={[
              styles.mark,
              isMain && styles.markMain,
              isMid && styles.markMid,
            ]}
          />
          {isMain && (
            <Text style={styles.markLabel}>{formatLabel(markValue)}</Text>
          )}
        </View>
      );
    },
    [formatLabel, min, roundVal, step]
  );

  const keyExtractor = useCallback((item: number) => item.toString(), []);

  return (
    <View style={styles.root}>
      <View style={styles.valueRow}>
        <Text style={styles.valueText}>
          {formatLabel(snappedValue)}
          <Text style={styles.valueUnit}> {unit}</Text>
        </Text>
      </View>

      <View style={styles.rulerContainer} onLayout={handleLayout}>
        <View style={styles.centerIndicatorLine} />
        <View style={styles.centerIndicatorDot} />

        <FlatList
          ref={scrollRef}
          data={marks}
          keyExtractor={keyExtractor}
          renderItem={renderMark}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={STEP_WIDTH}
          decelerationRate='fast'
          onMomentumScrollEnd={handleMomentumEnd}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: STEP_WIDTH,
            offset: STEP_WIDTH * index,
            index,
          })}
          initialNumToRender={Math.ceil(SCREEN_WIDTH / STEP_WIDTH) + 6}
          windowSize={10}
          maxToRenderPerBatch={24}
          removeClippedSubviews
          contentContainerStyle={{
            paddingLeft: padding,
            paddingRight: padding,
            alignItems: 'flex-start',
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { width: '100%' },
  valueRow: { alignItems: 'center', marginBottom: 10 },
  valueText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  valueUnit: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  rulerContainer: {
    height: 80,
    position: 'relative',
    justifyContent: 'center',
  },
  centerIndicatorLine: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -1,
    width: 2,
    height: 40,
    backgroundColor: '#6366F1',
    borderRadius: 999,
    zIndex: 2,
  },
  centerIndicatorDot: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -4,
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#6366F1',
    zIndex: 2,
  },
  markWrapper: {
    alignItems: 'center',
  },
  mark: {
    width: MARK_WIDTH,
    height: 16,
    backgroundColor: 'rgba(148,163,184,0.4)',
  },
  markMid: {
    height: 24,
    backgroundColor: 'rgba(148,163,184,0.7)',
  },
  markMain: {
    height: 32,
    backgroundColor: '#F9FAFB',
  },
  markLabel: {
    marginTop: 2,
    fontSize: 12,
    color: '#9CA3AF',
    minWidth: LABEL_WIDTH,
    textAlign: 'center',
  },
});
