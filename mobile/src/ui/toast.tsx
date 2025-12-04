// toast-native.tsx
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewProps,
  TextProps,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { X } from 'lucide-react-native';
import { forwardRef } from 'react';

// ====== Types (compatible with your toast store) ======

export type ToastProps = {
  variant?: 'default' | 'destructive';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export type ToastActionElement = React.ReactElement<typeof ToastAction>;

// ====== Theme values to match Tailwind/vars ======

const BG = '#020617'; // bg-background
const FG = '#F9FAFB'; // text-foreground
const BORDER = '#1F2937'; // border
const MUTED = '#9CA3AF'; // text-muted-foreground

const DESTRUCTIVE_BG = '#DC2626'; // bg-destructive
const DESTRUCTIVE_BORDER = '#B91C1C'; // border-destructive
const DESTRUCTIVE_FG = '#FEE2E2'; // text-destructive-foreground

// ====== ToastProvider ======
// In RN we don't need Radix's Provider; this is a simple passthrough.
// You can still wrap your app with it to keep the same usage.
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <>{children}</>;
};

// ====== ToastViewport ======
// Matches:
// "fixed top-0 ... flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]"
type ToastViewportProps = ViewProps & {
  children?: React.ReactNode;
};

export const ToastViewport = forwardRef<View, ToastViewportProps>(
  ({ style, children, ...props }, ref) => {
    return (
      <View
        ref={ref}
        pointerEvents='box-none'
        style={[styles.viewport, style]}
        {...props}
      >
        {children}
      </View>
    );
  }
);
ToastViewport.displayName = 'ToastViewport';

// ====== Toast ======
// Matches the Radix Root with variant styling.
export const Toast = forwardRef<View, ToastProps>(
  ({ style, variant = 'default', children, ...props }, ref) => {
    const isDestructive = variant === 'destructive';

    return (
      <View
        ref={ref}
        style={[
          styles.toastBase,
          isDestructive ? styles.toastDestructive : styles.toastDefault,
          style,
        ]}
        // keep the API shape similar
        {...props}
      >
        {children}
      </View>
    );
  }
);
Toast.displayName = 'Toast';

// ====== ToastAction ======
// Matches:
// "inline-flex h-8 ... rounded-md border bg-transparent px-3 text-sm font-medium ..."
type ToastActionProps = {
  children?: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export const ToastAction = forwardRef<TouchableOpacity, ToastActionProps>(
  ({ children, onPress, style, textStyle }, ref) => {
    return (
      <TouchableOpacity
        ref={ref}
        onPress={onPress}
        activeOpacity={0.8}
        style={[styles.actionButton, style]}
      >
        <Text style={[styles.actionText, textStyle]}>{children}</Text>
      </TouchableOpacity>
    );
  }
);
ToastAction.displayName = 'ToastAction';

// ====== ToastClose ======
// Matches:
// "absolute right-2 top-2 ... p-1 text-foreground/50 opacity-0 group-hover:opacity-100 ..."
type ToastCloseProps = {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export const ToastClose = forwardRef<TouchableOpacity, ToastCloseProps>(
  ({ onPress, style }, ref) => {
    return (
      <TouchableOpacity
        ref={ref}
        onPress={onPress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={[styles.closeButton, style]}
      >
        <X size={16} color='rgba(249,250,251,0.5)' />
      </TouchableOpacity>
    );
  }
);
ToastClose.displayName = 'ToastClose';

// ====== ToastTitle ======
// Matches: "text-sm font-semibold"
type ToastTitleProps = TextProps & {
  children?: React.ReactNode;
};

export const ToastTitle = forwardRef<Text, ToastTitleProps>(
  ({ style, children, ...props }, ref) => {
    return (
      <Text
        ref={ref}
        style={[styles.title, style]}
        numberOfLines={1}
        {...props}
      >
        {children}
      </Text>
    );
  }
);
ToastTitle.displayName = 'ToastTitle';

// ====== ToastDescription ======
// Matches: "text-sm opacity-90"
type ToastDescriptionProps = TextProps & {
  children?: React.ReactNode;
};

export const ToastDescription = forwardRef<Text, ToastDescriptionProps>(
  ({ style, children, ...props }, ref) => {
    return (
      <Text
        ref={ref}
        style={[styles.description, style]}
        numberOfLines={3}
        {...props}
      >
        {children}
      </Text>
    );
  }
);
ToastDescription.displayName = 'ToastDescription';

// ====== Styles ======

const styles = StyleSheet.create({
  // Viewport container – fixed overlay, top on small, bottom-right on bigger.
  viewport: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    padding: 16, // p-4
    maxHeight: '100%',
    // default: column-reverse (most recent at bottom)
    flexDirection: 'column-reverse',
    // On "larger screens" we can't do media queries easily,
    // but you can tweak this if you use Dimensions to switch.
    // For now this mimics a mobile layout: top full-width.
  },

  // Toast base – approximates Tailwind classes from toastVariants
  toastBase: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24, // p-6
    paddingVertical: 16,
    paddingRight: 32, // pr-8
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 8,
    // shadow-lg
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  toastDefault: {
    backgroundColor: BG,
    borderColor: BORDER,
  },
  toastDestructive: {
    backgroundColor: DESTRUCTIVE_BG,
    borderColor: DESTRUCTIVE_BORDER,
  },

  // Action button
  actionButton: {
    height: 32, // h-8
    paddingHorizontal: 12, // px-3
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(156,163,175,0.4)', // group-[.destructive]:border-muted/40
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: FG,
  },

  // Close button
  closeButton: {
    position: 'absolute',
    right: 8, // right-2
    top: 8, // top-2
    padding: 4, // p-1
    borderRadius: 6,
  },

  title: {
    fontSize: 14,
    fontWeight: '600',
    color: FG,
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
    color: MUTED,
    opacity: 0.9,
  },
});
