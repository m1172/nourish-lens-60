import { useState } from 'react';
import { TextInput, StyleSheet, TextInputProps, View } from 'react-native';

const BORDER = '#4B5563';
const BG = '#020617';
const TEXT = '#F9FAFB';
const MUTED = '#6B7280';
const PRIMARY = '#6366F1';

export const Input: React.FC<TextInputProps> = (props) => {
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.wrapper,
        {
          borderColor: focused ? PRIMARY : BORDER,
        },
      ]}
    >
      <TextInput
        {...props}
        style={styles.input}
        placeholderTextColor={MUTED}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderWidth: 1,
    borderRadius: 6,
    backgroundColor: BG,
  },
  input: {
    height: 40,
    paddingHorizontal: 12,
    fontSize: 15,
    color: TEXT,
  },
});
