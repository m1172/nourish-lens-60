import { useState, ReactNode, createContext } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ChevronDown } from 'lucide-react-native';

type AccordionProps = { children: ReactNode };
type AccordionItemProps = { id: string; children: ReactNode };
type AccordionTriggerProps = { children: ReactNode };
type AccordionContentProps = { children: ReactNode };

const AccordionContext = createContext<{
  openId: string | null;
  setOpenId: (id: string | null) => void;
  currentId: string | null;
}>({ openId: null, setOpenId: () => {}, currentId: null });

const Accordion = ({ children }: AccordionProps) => {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <AccordionContext.Provider value={{ openId, setOpenId, currentId: null }}>
      <View style={styles.root}>{children}</View>
    </AccordionContext.Provider>
  );
};

const AccordionItem = ({ id, children }: AccordionItemProps) => (
  <AccordionContext.Consumer>
    {(ctx) => (
      <AccordionContext.Provider value={{ ...ctx, currentId: id }}>
        <View style={styles.item}>{children}</View>
      </AccordionContext.Provider>
    )}
  </AccordionContext.Consumer>
);

const AccordionTrigger = ({ children }: AccordionTriggerProps) => (
  <AccordionContext.Consumer>
    {({ openId, setOpenId, currentId }) => {
      const isOpen = openId === currentId;
      return (
        <TouchableOpacity
          onPress={() => setOpenId(isOpen ? null : currentId || null)}
          style={styles.trigger}
        >
          <Text style={styles.triggerText}>{children}</Text>
          <ChevronDown
            color='#0f172a'
            size={18}
            style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
          />
        </TouchableOpacity>
      );
    }}
  </AccordionContext.Consumer>
);

const AccordionContent = ({ children }: AccordionContentProps) => (
  <AccordionContext.Consumer>
    {({ openId, currentId }) =>
      openId === currentId ? (
        <View style={styles.content}>{children}</View>
      ) : null
    }
  </AccordionContext.Consumer>
);

const styles = StyleSheet.create({
  root: { width: '100%' },
  item: { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e2e8f0' },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  triggerText: { fontWeight: '600', color: '#0f172a' },
  content: { paddingVertical: 8 },
});

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
