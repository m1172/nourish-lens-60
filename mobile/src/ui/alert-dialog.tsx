import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';

type AlertDialogProps = {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
};

const AlertDialog = ({ open, onOpenChange, children }: AlertDialogProps) => (
  <Modal transparent visible={open} animationType="fade" onRequestClose={() => onOpenChange?.(false)}>
    <View style={styles.overlay}>
      <View style={styles.content}>{children}</View>
    </View>
  </Modal>
);

const AlertDialogTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const AlertDialogPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const AlertDialogOverlay = ({ children }: { children?: React.ReactNode }) => (
  <View style={styles.overlay}>{children}</View>
);

const AlertDialogContent = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.content}>{children}</View>
);

const AlertDialogHeader = ({ children }: { children: React.ReactNode }) => (
  <View style={{ marginBottom: 8 }}>{children}</View>
);
const AlertDialogFooter = ({ children }: { children: React.ReactNode }) => (
  <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>{children}</View>
);

const AlertDialogTitle = ({ children }: { children: React.ReactNode }) => (
  <Text style={styles.title}>{children}</Text>
);
const AlertDialogDescription = ({ children }: { children: React.ReactNode }) => (
  <Text style={styles.description}>{children}</Text>
);

const AlertDialogAction = ({
  children,
  onPress,
}: {
  children: React.ReactNode;
  onPress?: () => void;
}) => (
  <TouchableOpacity style={[styles.button, styles.primary]} onPress={onPress}>
    <Text style={styles.buttonText}>{children}</Text>
  </TouchableOpacity>
);

const AlertDialogCancel = ({
  children,
  onPress,
}: {
  children: React.ReactNode;
  onPress?: () => void;
}) => (
  <TouchableOpacity style={[styles.button, styles.outline]} onPress={onPress}>
    <Text style={styles.outlineText}>{children}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  content: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  title: { color: '#f8fafc', fontSize: 18, fontWeight: '700' },
  description: { color: '#cbd5e1', marginTop: 6 },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primary: { backgroundColor: '#6366F1' },
  outline: { borderWidth: 1, borderColor: '#334155' },
  buttonText: { color: '#fff', fontWeight: '700' },
  outlineText: { color: '#e2e8f0', fontWeight: '700' },
});

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
