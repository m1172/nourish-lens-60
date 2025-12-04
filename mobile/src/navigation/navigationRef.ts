import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

let pendingActions: Array<() => void> = [];

export const onNavigationReady = () => {
  // mark ready and flush any queued navigation actions
  const actions = [...pendingActions];
  pendingActions = [];
  actions.forEach((fn) => {
    try {
      fn();
    } catch (err) {
      console.warn('Navigation action failed after ready', err);
    }
  });
};

function runOrQueue(action: () => void) {
  if (navigationRef.isReady()) {
    action();
  } else {
    pendingActions.push(action);
  }
}

export function navigate(name: string, params?: object) {
  runOrQueue(() => navigationRef.navigate(name as never, params as never));
}

export function resetRoot(routeName: string) {
  runOrQueue(() =>
    navigationRef.reset({
      index: 0,
      routes: [{ name: routeName as never }],
    })
  );
}
