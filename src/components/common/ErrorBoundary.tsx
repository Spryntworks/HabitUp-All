import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HabitUpLogo } from './HabitUpLogo';
import { AlertCircle, RotateCcw, Trash2, ChevronDown, ChevronUp } from 'lucide-react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  handleClearCacheAndReset = async () => {
    try {
      await AsyncStorage.multiRemove([
        'habitup_current_user_v1',
        'habitup_is_authenticated_v1',
        'habitup_social_friends_v1',
        'habitup_social_feed_v1',
        'habitup_public_habits_catalog_v1',
      ]);
    } catch (e) {
      console.warn('Could not clear cache:', e);
    }
    this.handleReset();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage = this.state.error?.message || 'An unexpected error occurred.';
      const componentStack = this.state.errorInfo?.componentStack || '';

      return (
        <SafeAreaView style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.logoRow}>
              <HabitUpLogo size="md" themeMode="dark" />
            </View>

            <View style={styles.card}>
              <View style={styles.iconCircle}>
                <AlertCircle size={36} color="#EF4444" />
              </View>

              <Text style={styles.title}>Oops! Something went wrong</Text>
              <Text style={styles.subtitle}>
                HabitUp encountered an unexpected error while rendering. Your data is safe.
              </Text>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={this.handleReset}
                  activeOpacity={0.8}
                >
                  <RotateCcw size={18} color="#FFFFFF" />
                  <Text style={styles.primaryBtnText}>Reload HabitUp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={this.handleClearCacheAndReset}
                  activeOpacity={0.8}
                >
                  <Trash2 size={16} color="#94A3B8" />
                  <Text style={styles.secondaryBtnText}>Clear Cache & Restart</Text>
                </TouchableOpacity>
              </View>

              {/* Technical Details Accordion */}
              <TouchableOpacity
                style={styles.detailsToggle}
                onPress={() => this.setState({ showDetails: !this.state.showDetails })}
                activeOpacity={0.7}
              >
                <Text style={styles.detailsToggleText}>
                  {this.state.showDetails ? 'Hide technical details' : 'Show technical details'}
                </Text>
                {this.state.showDetails ? (
                  <ChevronUp size={16} color="#818CF8" />
                ) : (
                  <ChevronDown size={16} color="#818CF8" />
                )}
              </TouchableOpacity>

              {this.state.showDetails && (
                <View style={styles.detailsBox}>
                  <Text style={styles.detailsErrorText}>{errorMessage}</Text>
                  {componentStack ? (
                    <Text style={styles.detailsStackText}>{componentStack.trim()}</Text>
                  ) : null}
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoRow: {
    marginBottom: 28,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#131C2E',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    height: 50,
    backgroundColor: '#7C5CFF',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    height: 46,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryBtnText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    paddingVertical: 4,
  },
  detailsToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#818CF8',
  },
  detailsBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#0A0F1D',
    borderRadius: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  detailsErrorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F87171',
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  detailsStackText: {
    fontSize: 10,
    fontWeight: '400',
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
