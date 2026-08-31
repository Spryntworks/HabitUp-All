import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useHabit } from '../../context/HabitContext';
import { RotateCcw, X, CheckCircle2, AlertCircle, Info } from 'lucide-react-native';

export const Toast: React.FC = () => {
  const { toast, clearToast } = useHabit();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (toast) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      opacity.setValue(0);
      translateY.setValue(20);
    }
  }, [toast]);

  if (!toast) return null;

  const AnimatedView = Animated.View as any;

  return (
    <AnimatedView
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.content}>
        {toast.type === 'success' ? (
          <CheckCircle2 size={18} color="#34D399" />
        ) : toast.type === 'warning' ? (
          <AlertCircle size={18} color="#FBBF24" />
        ) : (
          <Info size={18} color="#38BDF8" />
        )}
        <Text style={styles.message} numberOfLines={1}>
          {toast.message}
        </Text>
      </View>

      <View style={styles.actions}>
        {toast.undoAction && (
          <TouchableOpacity
            style={styles.undoButton}
            onPress={() => {
              toast.undoAction?.();
              clearToast();
            }}
          >
            <RotateCcw size={12} color="#FCD34D" />
            <Text style={styles.undoText}>Undo</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.closeButton} onPress={clearToast}>
          <X size={16} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </AnimatedView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 85,
    left: 16,
    right: 16,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  message: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  undoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  undoText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FCD34D',
  },
  closeButton: {
    padding: 4,
  },
});
