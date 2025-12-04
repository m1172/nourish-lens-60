import React from 'react';
import { Image, Text, View, StyleSheet } from 'react-native';

type AvatarProps = {
  uri?: string | null;
  alt?: string;
  size?: number;
};

export function Avatar({ uri, alt, size = 40 }: AvatarProps) {
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  const initials = alt ? alt.slice(0, 2).toUpperCase() : '?';
  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.fallbackText}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: '#0f172a',
    fontWeight: '700',
  },
});
