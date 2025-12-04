import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
} from 'react-native';

type Variant = 'default' | 'secondary' | 'destructive' | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

const COLORS = {
  primary: '#22C55E',
  primaryForeground: '#020617',
  secondaryBg: '#1F2937',
  secondaryForeground: '#E5E7EB',
  destructiveBg: '#EF4444',
  destructiveForeground: '#FEF2F2',
  outlineBorder: '#4B5563',
  outlineText: '#F9FAFB',
};

export function Badge({
  children,
  variant = 'default',
  style,
  onPress,
}: BadgeProps) {
  const content = (
    <View style={[styles.base, getVariantStyle(variant), style]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

function getVariantStyle(variant: Variant): ViewStyle {
  switch (variant) {
    case 'default':
      return {
        backgroundColor: COLORS.primary,
        borderColor: 'transparent',
      };
    case 'secondary':
      return {
        backgroundColor: COLORS.secondaryBg,
        borderColor: 'transparent',
      };
    case 'destructive':
      return {
        backgroundColor: COLORS.destructiveBg,
        borderColor: 'transparent',
      };
    case 'outline':
    default:
      return {
        backgroundColor: 'transparent',
        borderColor: COLORS.outlineBorder,
      };
  }
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
});
