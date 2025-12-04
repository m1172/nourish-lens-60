import {
  TouchableOpacity,
  GestureResponderEvent,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';

type RouteName = string;

type NavLinkProps = {
  to: RouteName;
  onPress?: (e: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  children: (opts: { isActive: boolean }) => React.ReactNode;
};

export function NavLink({ to, onPress, style, children }: NavLinkProps) {
  const navigation = useNavigation<any>();
  const state = useNavigationState((state) => state);
  const currentRouteName: string | undefined =
    state?.routes?.[state.index]?.name;

  const isActive = currentRouteName === to;

  const handlePress = (e: GestureResponderEvent) => {
    if (onPress) onPress(e);
    navigation.navigate(to as never);
  };

  return (
    <TouchableOpacity style={style} activeOpacity={0.8} onPress={handlePress}>
      {children({ isActive })}
    </TouchableOpacity>
  );
}
