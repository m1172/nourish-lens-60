import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';

type Variant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link';
type Size = 'default' | 'sm' | 'lg' | 'icon';

export type ButtonProps = {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  variant?: Variant;
  size?: Size;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

const PRIMARY = '#6366F1';
const PRIMARY_FG = '#FFFFFF';
const DESTRUCTIVE = '#DC2626';
const BG = '#020617';
const ACCENT_BG = '#111827';
const ACCENT_FG = '#F9FAFB';

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  disabled,
  variant = 'default',
  size = 'default',
  style,
  textStyle,
}) => {
  const vStyles = variantStyles[variant];
  const sStyles = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        vStyles.button,
        sStyles.button,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.textBase, vStyles.text, textStyle]}>{children}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    gap: 8,
  },
  textBase: {
    fontSize: 14,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});

const variantStyles: Record<Variant, { button: ViewStyle; text: TextStyle }> = {
  default: {
    button: {
      backgroundColor: PRIMARY,
    },
    text: {
      color: PRIMARY_FG,
    },
  },
  destructive: {
    button: {
      backgroundColor: DESTRUCTIVE,
    },
    text: {
      color: PRIMARY_FG,
    },
  },
  outline: {
    button: {
      borderWidth: 1,
      borderColor: '#4B5563',
      backgroundColor: BG,
    },
    text: {
      color: ACCENT_FG,
    },
  },
  secondary: {
    button: {
      backgroundColor: '#1F2937',
    },
    text: {
      color: ACCENT_FG,
    },
  },
  ghost: {
    button: {
      backgroundColor: 'transparent',
    },
    text: {
      color: PRIMARY,
    },
  },
  link: {
    button: {
      backgroundColor: 'transparent',
    },
    text: {
      color: PRIMARY,
      textDecorationLine: 'underline',
    },
  },
};

const sizeStyles: Record<Size, { button: ViewStyle }> = {
  default: {
    button: {
      height: 40,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
  },
  sm: {
    button: {
      height: 36,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
  },
  lg: {
    button: {
      height: 44,
      paddingHorizontal: 24,
      paddingVertical: 10,
    },
  },
  icon: {
    button: {
      height: 40,
      width: 40,
    },
  },
};
