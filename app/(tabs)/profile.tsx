import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface ProfileOption {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  route: string;
  color: string;
}

interface SettingsSection {
  title: string;
  options: ProfileOption[];
}

export default function ProfileScreen() {
  const { theme, currentTheme } = useTheme();
  const router = useRouter();
  const [userName] = useState('Tapan'); // TODO: In a real app, this would come from user data

  const profileSections: SettingsSection[] = [
    {
      title: 'Appearance',
      options: [
        {
          id: '1',
          title: 'Themes',
          subtitle: `Current: ${currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1)}`,
          icon: 'color-palette',
          route: '/themes',
          color: theme.colors.primary,
        },
        {
          id: '2',
          title: 'Milestones',
          subtitle: 'Track your progress',
          icon: 'trophy',
          route: '/milestones',
          color: theme.colors.warning,
        },
      ],
    },
    {
      title: 'Financial Management',
      options: [
        {
          id: '3',
          title: 'Categories',
          subtitle: 'Manage expense categories',
          icon: 'grid',
          route: '/categories',
          color: theme.colors.secondary,
        },
        {
          id: '4',
          title: 'Budget Settings',
          subtitle: 'Set spending limits',
          icon: 'wallet',
          route: '/budget',
          color: theme.colors.accent,
        },
        {
          id: '5',
          title: 'Recurring Expenses',
          subtitle: 'Manage regular payments',
          icon: 'refresh',
          route: '/recurring',
          color: theme.colors.error,
        },
        {
          id: '6',
          title: 'Bills Tracker',
          subtitle: 'Track due dates',
          icon: 'receipt',
          route: '/bills',
          color: theme.colors.success,
        },
      ],
    },
    {
      title: 'Data & Insights',
      options: [
        {
          id: '7',
          title: 'All Expenses',
          subtitle: 'View complete history',
          icon: 'list',
          route: '/expenses',
          color: theme.colors.primary,
        },
        {
          id: '8',
          title: 'Smart Categories',
          subtitle: 'AI-powered suggestions',
          icon: 'bulb',
          route: '/suggestions',
          color: theme.colors.accent,
        },
      ],
    },
  ];

  const navigateToRoute = (route: string) => {
    switch (route) {
      case '/themes':
        router.push('/themes');
        break;
      case '/milestones':
        router.push('/milestones');
        break;
      case '/categories':
        router.push('/categories');
        break;
      case '/budget':
        router.push('/budget');
        break;
      case '/recurring':
        router.push('/recurring');
        break;
      case '/bills':
        router.push('/bills');
        break;
      case '/expenses':
        router.push('/expenses');
        break;
      case '/suggestions':
        router.push('/suggestions');
        break;
      default:
        break;
    }
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'This feature will allow you to export your expense data to CSV or PDF format.',
      [{ text: 'Coming Soon', style: 'default' }]
    );
  };

  const handleBackupData = () => {
    Alert.alert(
      'Backup Data',
      'This feature will allow you to backup your data to cloud storage.',
      [{ text: 'Coming Soon', style: 'default' }]
    );
  };

  const renderProfileHeader = () => (
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.secondary]}
      style={styles.profileHeader}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.userName}>Hello, {userName}!</Text>
      <Text style={styles.userSubtitle}>Manage your financial journey</Text>
    </LinearGradient>
  );

  const renderSection = (section: SettingsSection) => (
    <View key={section.title} style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        {section.title}
      </Text>
      <View style={[styles.sectionContent, { backgroundColor: theme.colors.surface }]}>
        {section.options.map((option, index) => (
          <View key={option.id}>
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => navigateToRoute(option.route)}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, { backgroundColor: option.color + '20' }]}>
                  <Ionicons name={option.icon as any} size={20} color={option.color} />
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionTitle, { color: theme.colors.text }]}>
                    {option.title}
                  </Text>
                  <Text style={[styles.optionSubtitle, { color: theme.colors.textSecondary }]}>
                    {option.subtitle}
                  </Text>
                </View>
              </View>
              <Ionicons 
                name="chevron-forward" 
                size={16} 
                color={theme.colors.textSecondary} 
              />
            </TouchableOpacity>
            {index < section.options.length - 1 && (
              <View style={[styles.optionDivider, { backgroundColor: theme.colors.border }]} />
            )}
          </View>
        ))}
      </View>
    </View>
  );

  const renderActionButtons = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Data Management
      </Text>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}
          onPress={handleExportData}
          activeOpacity={0.7}
        >
          <Ionicons name="download" size={24} color={theme.colors.primary} />
          <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
            Export Data
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}
          onPress={handleBackupData}
          activeOpacity={0.7}
        >
          <Ionicons name="cloud-upload" size={24} color={theme.colors.secondary} />
          <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
            Backup Data
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        barStyle={theme.dark ? 'light-content' : 'dark-content'} 
        backgroundColor={theme.colors.background}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderProfileHeader()}
        
        {profileSections.map(renderSection)}
        
        {renderActionButtons()}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  userSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sectionContent: {
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 12,
  },
  optionDivider: {
    height: 1,
    marginLeft: 68,
    marginRight: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  bottomSpacing: {
    height: 20,
  },
});