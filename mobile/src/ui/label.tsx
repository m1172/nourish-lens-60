import { forwardRef } from 'react';
import { Text, StyleSheet, TextProps } from 'react-native';

type LabelProps = TextProps & {
  htmlFor?: string;
};

export const Label = forwardRef<Text, LabelProps>(
  ({ style, children, ...rest }, ref) => {
    return (
      <Text ref={ref} style={[styles.label, style]} {...rest}>
        {children}
      </Text>
    );
  }
);

Label.displayName = 'Label';

const styles = StyleSheet.create({
  label: {
    fontSize: 14, // text-sm
    fontWeight: '500',
    color: '#E5E7EB', // near text-foreground
    marginBottom: 4,
  },
});
