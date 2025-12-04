import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Crumb = { label: string };

type BreadcrumbProps = {
  items: Crumb[];
  separator?: string;
};

export function Breadcrumb({ items, separator = '/' }: BreadcrumbProps) {
  return (
    <View style={styles.row}>
      {items.map((item, idx) => (
        <View key={item.label} style={styles.row}>
          <Text style={styles.text}>{item.label}</Text>
          {idx < items.length - 1 ? <Text style={styles.separator}> {separator} </Text> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  text: { color: '#0f172a', fontWeight: '600' },
  separator: { color: '#94a3b8' },
});
