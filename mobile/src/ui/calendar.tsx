import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { format } from 'date-fns';

type CalendarProps = {
  selected?: Date;
  onSelect?: (date: Date) => void;
};

// Minimal calendar placeholder: taps today/next/prev day
export function Calendar({ selected, onSelect }: CalendarProps) {
  const today = new Date();
  const active = selected || today;
  const prevDay = new Date(active);
  prevDay.setDate(active.getDate() - 1);
  const nextDay = new Date(active);
  nextDay.setDate(active.getDate() + 1);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select date</Text>
      <View style={styles.row}>
        <TouchableOpacity style={styles.pill} onPress={() => onSelect?.(prevDay)}>
          <Text style={styles.pillText}>Prev</Text>
        </TouchableOpacity>
        <View style={styles.active}>
          <Text style={styles.activeText}>{format(active, 'PPP')}</Text>
        </View>
        <TouchableOpacity style={styles.pill} onPress={() => onSelect?.(nextDay)}>
          <Text style={styles.pillText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  label: { color: '#475569', marginBottom: 8, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
  },
  pillText: { color: '#0f172a', fontWeight: '700' },
  active: { paddingHorizontal: 12, paddingVertical: 8 },
  activeText: { color: '#0f172a', fontWeight: '700' },
});
