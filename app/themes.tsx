import { Theme, ThemeKey, themes, useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ThemeScreen() {
  const { theme, currentTheme, setTheme } = useTheme();
  const router = useRouter();

  const renderThemeOption = (themeKey: ThemeKey, themeData: Theme) => {
    const isSelected = currentTheme === themeKey;

    return (
      <TouchableOpacity
        key={themeKey}
        style={[
          styles.themeOption,
          {
            backgroundColor: theme.colors.surface,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
            borderWidth: isSelected ? 3 : 1,
          },
        ]}
        onPress={() => setTheme(themeKey)}
      >
        <View style={styles.themeHeader}>
          <Text style={[styles.themeName, { color: theme.colors.text }]}>
            {themeData.name}
          </Text>
          {isSelected && (
            <View style={[styles.selectedBadge, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.selectedText}>✓</Text>
            </View>
          )}
        </View>

        <View style={styles.colorPreview}>
          <View style={[styles.colorSwatch, { backgroundColor: themeData.colors.primary }]} />
          <View style={[styles.colorSwatch, { backgroundColor: themeData.colors.secondary }]} />
          <View style={[styles.colorSwatch, { backgroundColor: themeData.colors.accent }]} />
          <View style={[styles.colorSwatch, { backgroundColor: themeData.colors.success }]} />
          <View style={[styles.colorSwatch, { backgroundColor: themeData.colors.warning }]} />
        </View>

        <Text style={[styles.themeDescription, { color: theme.colors.textSecondary }]}>
          {getThemeDescription(themeKey)}
        </Text>
      </TouchableOpacity>
    );
  };

  const getThemeDescription = (themeKey: ThemeKey): string => {
    switch (themeKey) {
      case 'light':
        return 'Clean and bright appearance for daytime use';
      case 'dark':
        return 'Easy on the eyes for low-light environments';
      case 'ocean':
        return 'Cool blues and calming ocean-inspired colors';
      case 'sunset':
        return 'Warm oranges and vibrant sunset hues';
      case 'forest':
        return 'Natural greens and earth-tone colors';
      default:
        return 'A beautiful color scheme for your app';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Choose Theme</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Available Themes
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            Select a theme to customize your app&apos;s appearance
          </Text>
        </View>

        <View style={styles.themesContainer}>
          {Object.entries(themes).map(([key, themeData]) =>
            renderThemeOption(key as ThemeKey, themeData)
          )}
        </View>



        <View style={styles.infoSection}>
          <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
            About Themes
          </Text>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            Themes change the color scheme throughout the entire app. Your selection is automatically saved and will be applied the next time you open the app.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    lineHeight: 24,
  },
  themesContainer: {
    marginBottom: 30,
  },
  themeOption: {
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  themeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  themeName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  selectedBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  colorPreview: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  colorSwatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  themeDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoSection: {
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
  },
});