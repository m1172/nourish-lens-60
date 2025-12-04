import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type AlertProps = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  children?: React.ReactNode;
};

export function Alert({ title, description, variant = 'default', children }: AlertProps) {
  const destructive = variant === 'destructive';
  return (
    <View style={[styles.container, destructive && styles.containerDestructive]}>
      {title ? <Text style={[styles.title, destructive && styles.titleDestructive]}>{title}</Text> : null}
      {description ? (
        <Text style={[styles.description, destructive && styles.descriptionDestructive]}>{description}</Text>
      ) : null}
      {children}
    </View>
  );
}

export function AlertTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function AlertDescription({ children }: { children: React.ReactNode }) {
  return <Text style={styles.description}>{children}</Text>;
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  containerDestructive: {
    borderColor: '#ef4444',
    backgroundColor: '#fee2e2',
  },
  title: { fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  titleDestructive: { color: '#b91c1c' },
  description: { color: '#475569' },
  descriptionDestructive: { color: '#991b1b' },
});
