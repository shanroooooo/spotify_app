import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle, TouchableOpacityProps } from 'react-native';
import { theme } from '../theme/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({ children, style }) => (
  <View style={[styles.card, style]}>
    {children}
  </View>
);

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary';
  title: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  title, 
  style, 
  ...props 
}) => (
  <TouchableOpacity 
    style={[
      styles.button, 
      variant === 'primary' ? styles.primaryButton : styles.secondaryButton,
      style
    ]} 
    {...props}
  >
    <Text style={[
      styles.buttonText,
      variant === 'primary' ? styles.primaryButtonText : styles.secondaryButtonText
    ]}>
      {title}
    </Text>
  </TouchableOpacity>
);

interface TitleProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export const Title: React.FC<TitleProps> = ({ children, style }) => (
  <Text style={[styles.title, style]}>
    {children}
  </Text>
);

interface SubtitleProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export const Subtitle: React.FC<SubtitleProps> = ({ children, style }) => (
  <Text style={[styles.subtitle, style]}>
    {children}
  </Text>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  button: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: theme.colors.background,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.h2,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
}); 