import React from 'react';
import { View, StyleSheet } from 'react-native';

type AspectRatioProps = {
  ratio?: number;
  children: React.ReactNode;
};

export function AspectRatio({ ratio = 16 / 9, children }: AspectRatioProps) {
  return <View style={[styles.container, { aspectRatio: ratio }]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
});
