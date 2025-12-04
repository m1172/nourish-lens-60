import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
};

export const Card: React.FC<CardProps> = ({ children, style, onPress }) => {
  const Wrapper: any = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
      style={[styles.card, style]}
    >
      {children}
    </Wrapper>
  );
};

type SectionProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export const CardHeader: React.FC<SectionProps> = ({ children, style }) => (
  <View style={[styles.cardHeader, style]}>{children}</View>
);

export const CardContent: React.FC<SectionProps> = ({ children, style }) => (
  <View style={[styles.cardContent, style]}>{children}</View>
);

export const CardFooter: React.FC<SectionProps> = ({ children, style }) => (
  <View style={[styles.cardFooter, style]}>{children}</View>
);

type CardTextProps = {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
};

export const CardTitle: React.FC<CardTextProps> = ({ children, style }) => (
  <Text style={[styles.cardTitle, style]}>{children}</Text>
);

export const CardDescription: React.FC<CardTextProps> = ({
  children,
  style,
}) => <Text style={[styles.cardDescription, style]}>{children}</Text>;

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1F2937', // border
    backgroundColor: '#020617', // bg-card
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardHeader: {
    padding: 24,
  },
  cardContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  cardFooter: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  cardDescription: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
