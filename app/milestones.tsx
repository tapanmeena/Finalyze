import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { db } from '../utils/database';

interface Milestone {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  type: 'savings' | 'budget' | 'streak' | 'category';
  achieved: boolean;
  achievedDate?: string;
  icon: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  earnedDate: string;
  icon: string;
}

export default function MilestonesScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);

  useEffect(() => {
    const loadData = () => {
      loadTotalExpenses();
      generateMilestones();
      loadAchievements();
    };

    loadData();
  }, []);

  const loadTotalExpenses = () => {
    try {
      const result = db.getFirstSync('SELECT SUM(amount) as total FROM expenses') as any;
      const total = result?.total || 0;
      setTotalExpenses(total);
    } catch (error) {
      console.error('Error loading total expenses:', error);
    }
  };

  const generateMilestones = () => {
    try {
      // Get current month expenses
      const currentMonth = new Date().toISOString().slice(0, 7);
      const monthResult = db.getFirstSync(
        'SELECT SUM(amount) as total FROM expenses WHERE date LIKE ?',
        [`${currentMonth}%`]
      ) as any;
      const monthTotal = monthResult?.total || 0;

      // Get expense count
      const countResult = db.getFirstSync('SELECT COUNT(*) as count FROM expenses') as any;
      const expenseCount = countResult?.count || 0;

      // Get categories count
      const categoryResult = db.getFirstSync('SELECT COUNT(DISTINCT category) as count FROM expenses') as any;
      const categoryCount = categoryResult?.count || 0;

      const generatedMilestones: Milestone[] = [
        {
          id: '1',
          title: 'First Expense',
          description: 'Log your first expense',
          target: 1,
          current: Math.min(expenseCount, 1),
          type: 'streak',
          achieved: expenseCount >= 1,
          icon: '🎯',
        },
        {
          id: '2',
          title: 'Budget Tracker',
          description: 'Keep monthly expenses under $500',
          target: 500,
          current: monthTotal,
          type: 'budget',
          achieved: monthTotal > 0 && monthTotal < 500,
          icon: '💰',
        },
        {
          id: '3',
          title: 'Expense Expert',
          description: 'Log 10 expenses',
          target: 10,
          current: Math.min(expenseCount, 10),
          type: 'streak',
          achieved: expenseCount >= 10,
          icon: '📊',
        },
        {
          id: '4',
          title: 'Category Explorer',
          description: 'Use 5 different categories',
          target: 5,
          current: Math.min(categoryCount, 5),
          type: 'category',
          achieved: categoryCount >= 5,
          icon: '🗂️',
        },
        {
          id: '5',
          title: 'Spending Master',
          description: 'Log 50 expenses',
          target: 50,
          current: Math.min(expenseCount, 50),
          type: 'streak',
          achieved: expenseCount >= 50,
          icon: '🏆',
        },
        {
          id: '6',
          title: 'Budget Champion',
          description: 'Keep monthly expenses under $1000',
          target: 1000,
          current: monthTotal,
          type: 'budget',
          achieved: monthTotal > 500 && monthTotal < 1000,
          icon: '👑',
        },
      ];

      setMilestones(generatedMilestones);
    } catch (error) {
      console.error('Error generating milestones:', error);
    }
  };

  const loadAchievements = () => {
    // For now, generate achievements based on completed milestones
    const sampleAchievements: Achievement[] = [
      {
        id: '1',
        title: 'Getting Started',
        description: 'Logged your first expense!',
        earnedDate: '2025-09-20',
        icon: '🎉',
      },
      {
        id: '2',
        title: 'Consistent Tracker',
        description: 'Logged expenses for 3 days in a row',
        earnedDate: '2025-09-22',
        icon: '🔥',
      },
    ];

    setAchievements(sampleAchievements);
  };

  const getProgressPercentage = (current: number, target: number): number => {
    return Math.min((current / target) * 100, 100);
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 100) return theme.colors.success;
    if (percentage >= 75) return theme.colors.warning;
    return theme.colors.primary;
  };

  const handleCreateCustomMilestone = () => {
    Alert.alert(
      'Custom Milestone',
      'Feature coming soon! You&apos;ll be able to create your own milestones and goals.',
      [{ text: 'OK' }]
    );
  };

  const renderMilestone = (milestone: Milestone) => {
    const progress = getProgressPercentage(milestone.current, milestone.target);
    const progressColor = getProgressColor(progress);

    return (
      <View
        key={milestone.id}
        style={[
          styles.milestoneCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: milestone.achieved ? theme.colors.success : theme.colors.border,
          },
        ]}
      >
        <View style={styles.milestoneHeader}>
          <Text style={styles.milestoneIcon}>{milestone.icon}</Text>
          <View style={styles.milestoneInfo}>
            <Text style={[styles.milestoneTitle, { color: theme.colors.text }]}>
              {milestone.title}
            </Text>
            <Text style={[styles.milestoneDescription, { color: theme.colors.textSecondary }]}>
              {milestone.description}
            </Text>
          </View>
          {milestone.achieved && (
            <View style={[styles.achievedBadge, { backgroundColor: theme.colors.success }]}>
              <Text style={styles.achievedText}>✓</Text>
            </View>
          )}
        </View>

        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                  backgroundColor: progressColor,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
            {milestone.type === 'budget' 
              ? `$${milestone.current.toFixed(2)} / $${milestone.target}`
              : `${milestone.current} / ${milestone.target}`
            }
          </Text>
        </View>
      </View>
    );
  };

  const renderAchievement = (achievement: Achievement) => (
    <View
      key={achievement.id}
      style={[
        styles.achievementCard,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.success },
      ]}
    >
      <Text style={styles.achievementIcon}>{achievement.icon}</Text>
      <View style={styles.achievementInfo}>
        <Text style={[styles.achievementTitle, { color: theme.colors.text }]}>
          {achievement.title}
        </Text>
        <Text style={[styles.achievementDescription, { color: theme.colors.textSecondary }]}>
          {achievement.description}
        </Text>
        <Text style={[styles.achievementDate, { color: theme.colors.textSecondary }]}>
          Earned: {achievement.earnedDate}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Milestones</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            🎯 Progress Tracking
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            Track your financial goals and celebrate your achievements
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
              ${totalExpenses.toFixed(2)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Total Tracked
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.statNumber, { color: theme.colors.success }]}>
              {milestones.filter(m => m.achieved).length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Achieved
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.statNumber, { color: theme.colors.warning }]}>
              {achievements.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Unlocked
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Current Milestones
          </Text>
          {milestones.map(renderMilestone)}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            🏆 Achievements Unlocked
          </Text>
          {achievements.length > 0 ? (
            achievements.map(renderAchievement)
          ) : (
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              Complete milestones to unlock achievements!
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleCreateCustomMilestone}
        >
          <Text style={styles.createButtonText}>+ Create Custom Milestone</Text>
        </TouchableOpacity>
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  milestoneCard: {
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  milestoneIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  milestoneDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  achievedBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievedText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 10,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'right',
  },
  achievementCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  achievementIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  achievementDate: {
    fontSize: 12,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 40,
  },
  createButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 30,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});