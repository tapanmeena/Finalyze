import { useTheme } from '@/contexts/ThemeContext';
import { db } from '@/utils/database';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SpendingTrend {
  period: string;
  amount: number;
  change: number;
}

interface CategoryInsight {
  category: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

interface Insight {
  id: string;
  type: 'tip' | 'warning' | 'achievement' | 'trend';
  title: string;
  description: string;
  icon: string;
}

export default function InsightsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [topCategories, setTopCategories] = useState<CategoryInsight[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<SpendingTrend[]>([]);

  useEffect(() => {
    const loadInsightsData = () => {
      loadTopCategories();
      loadWeeklyTrends();
      generateInsights();
    };

    loadInsightsData();
  }, []);

  const loadTopCategories = () => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const result = db.getAllSync(
        `SELECT category, SUM(amount) as total, COUNT(*) as count 
         FROM expenses 
         WHERE date LIKE ? 
         GROUP BY category 
         ORDER BY total DESC 
         LIMIT 5`,
        [`${currentMonth}%`]
      ) as any[];

      const totalResult = db.getFirstSync(
        'SELECT SUM(amount) as total FROM expenses WHERE date LIKE ?',
        [`${currentMonth}%`]
      ) as any;
      const monthTotal = totalResult?.total || 0;

      const categoryInsights: CategoryInsight[] = result.map((row) => ({
        category: row.category,
        amount: row.total,
        percentage: monthTotal > 0 ? (row.total / monthTotal) * 100 : 0,
        trend: 'stable' as const, // Would need historical data for real trends
      }));

      setTopCategories(categoryInsights);
    } catch (error) {
      console.error('Error loading top categories:', error);
    }
  };

  const loadWeeklyTrends = () => {
    try {
      const trends: SpendingTrend[] = [];
      const today = new Date();
      
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - (i * 7) - 6);
        const weekEnd = new Date(today);
        weekEnd.setDate(today.getDate() - (i * 7));

        const result = db.getFirstSync(
          'SELECT SUM(amount) as total FROM expenses WHERE date BETWEEN ? AND ?',
          [weekStart.toISOString().split('T')[0], weekEnd.toISOString().split('T')[0]]
        ) as any;

        const amount = result?.total || 0;
        trends.push({
          period: `Week ${4 - i}`,
          amount,
          change: i === 3 ? 0 : amount - (trends[trends.length - 1]?.amount || 0),
        });
      }

      setWeeklyTrend(trends);
    } catch (error) {
      console.error('Error loading weekly trends:', error);
    }
  };

  const generateInsights = () => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthStr = lastMonth.toISOString().slice(0, 7);

      // Get current and last month totals
      const currentResult = db.getFirstSync(
        'SELECT SUM(amount) as total FROM expenses WHERE date LIKE ?',
        [`${currentMonth}%`]
      ) as any;
      const currentTotal = currentResult?.total || 0;

      const lastResult = db.getFirstSync(
        'SELECT SUM(amount) as total FROM expenses WHERE date LIKE ?',
        [`${lastMonthStr}%`]
      ) as any;
      const lastTotal = lastResult?.total || 0;

      // Get expense count
      const countResult = db.getFirstSync('SELECT COUNT(*) as count FROM expenses') as any;
      const expenseCount = countResult?.count || 0;

      // Get most expensive category
      const categoryResult = db.getFirstSync(
        `SELECT category, SUM(amount) as total 
         FROM expenses 
         WHERE date LIKE ? 
         GROUP BY category 
         ORDER BY total DESC 
         LIMIT 1`,
        [`${currentMonth}%`]
      ) as any;

      const generatedInsights: Insight[] = [];

      // Monthly comparison insight
      if (lastTotal > 0 && currentTotal > 0) {
        const change = ((currentTotal - lastTotal) / lastTotal) * 100;
        if (change > 10) {
          generatedInsights.push({
            id: '1',
            type: 'warning',
            title: 'Spending Alert',
            description: `Your spending is ${change.toFixed(1)}% higher than last month. Consider reviewing your budget.`,
            icon: '⚠️',
          });
        } else if (change < -10) {
          generatedInsights.push({
            id: '2',
            type: 'achievement',
            title: 'Great Savings!',
            description: `You&apos;ve reduced spending by ${Math.abs(change).toFixed(1)}% compared to last month. Well done!`,
            icon: '🎉',
          });
        }
      }

      // Category insight
      if (categoryResult && categoryResult.total > currentTotal * 0.4) {
        generatedInsights.push({
          id: '3',
          type: 'tip',
          title: 'Category Focus',
          description: `${categoryResult.category} represents ${((categoryResult.total / currentTotal) * 100).toFixed(1)}% of your spending. Consider setting a specific budget for this category.`,
          icon: '📊',
        });
      }

      // Frequency insight
      if (expenseCount >= 20) {
        generatedInsights.push({
          id: '4',
          type: 'tip',
          title: 'Tracking Habits',
          description: `You&apos;ve logged ${expenseCount} expenses! You&apos;re building great financial awareness habits.`,
          icon: '💪',
        });
      }

      // Weekend spending insight
      const weekendResult = db.getFirstSync(
        `SELECT SUM(amount) as total FROM expenses 
         WHERE date LIKE ? AND (
           strftime('%w', date) = '0' OR strftime('%w', date) = '6'
         )`,
        [`${currentMonth}%`]
      ) as any;
      const weekendTotal = weekendResult?.total || 0;

      if (weekendTotal > currentTotal * 0.3) {
        generatedInsights.push({
          id: '5',
          type: 'tip',
          title: 'Weekend Spending',
          description: `${((weekendTotal / currentTotal) * 100).toFixed(1)}% of your spending happens on weekends. Planning weekend activities in advance might help manage costs.`,
          icon: '📅',
        });
      }

      // Daily average insight
      const today = new Date();
      const daysInMonth = today.getDate();
      const dailyAverage = currentTotal / daysInMonth;

      generatedInsights.push({
        id: '6',
        type: 'trend',
        title: 'Daily Average',
        description: `Your daily average spending this month is $${dailyAverage.toFixed(2)}. This puts you on track for $${(dailyAverage * 30).toFixed(2)} monthly spending.`,
        icon: '📈',
      });

      setInsights(generatedInsights);
    } catch (error) {
      console.error('Error generating insights:', error);
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'warning':
        return theme.colors.error;
      case 'achievement':
        return theme.colors.success;
      case 'tip':
        return theme.colors.primary;
      case 'trend':
        return theme.colors.accent;
      default:
        return theme.colors.textSecondary;
    }
  };

  const renderInsight = (insight: Insight) => (
    <View
      key={insight.id}
      style={[
        styles.insightCard,
        {
          backgroundColor: theme.colors.surface,
          borderLeftColor: getInsightColor(insight.type),
        },
      ]}
    >
      <View style={styles.insightHeader}>
        <Text style={styles.insightIcon}>{insight.icon}</Text>
        <View style={styles.insightContent}>
          <Text style={[styles.insightTitle, { color: theme.colors.text }]}>
            {insight.title}
          </Text>
          <Text style={[styles.insightDescription, { color: theme.colors.textSecondary }]}>
            {insight.description}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderCategoryInsight = (category: CategoryInsight) => (
    <View
      key={category.category}
      style={[styles.categoryCard, { backgroundColor: theme.colors.surface }]}
    >
      <View style={styles.categoryHeader}>
        <Text style={[styles.categoryName, { color: theme.colors.text }]}>
          {category.category}
        </Text>
        <Text style={[styles.categoryAmount, { color: theme.colors.primary }]}>
          ${category.amount.toFixed(2)}
        </Text>
      </View>
      <View style={styles.categoryDetails}>
        <View style={[styles.percentageBar, { backgroundColor: theme.colors.border }]}>
          <View
            style={[
              styles.percentageFill,
              {
                width: `${category.percentage}%`,
                backgroundColor: theme.colors.primary,
              },
            ]}
          />
        </View>
        <Text style={[styles.percentageText, { color: theme.colors.textSecondary }]}>
          {category.percentage.toFixed(1)}% of total spending
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
        <Text style={[styles.title, { color: theme.colors.text }]}>Financial Insights</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            💡 Personalized Insights
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            AI-powered analysis of your spending patterns and habits
          </Text>
        </View>

        <View style={styles.insightsContainer}>
          {insights.length > 0 ? (
            insights.map(renderInsight)
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Start logging expenses to receive personalized insights!
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            📊 Top Spending Categories
          </Text>
          {topCategories.length > 0 ? (
            topCategories.map(renderCategoryInsight)
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No spending data available for this month.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            📈 Weekly Spending Trend
          </Text>
          <View style={[styles.trendCard, { backgroundColor: theme.colors.surface }]}>
            {weeklyTrend.map((trend, index) => (
              <View key={trend.period} style={styles.trendItem}>
                <Text style={[styles.trendPeriod, { color: theme.colors.textSecondary }]}>
                  {trend.period}
                </Text>
                <Text style={[styles.trendAmount, { color: theme.colors.text }]}>
                  ${trend.amount.toFixed(2)}
                </Text>
                {index > 0 && (
                  <Text
                    style={[
                      styles.trendChange,
                      {
                        color: trend.change >= 0 ? theme.colors.error : theme.colors.success,
                      },
                    ]}
                  >
                    {trend.change >= 0 ? '+' : ''}${trend.change.toFixed(2)}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            🔮 Spending Forecast
          </Text>
          <View style={[styles.forecastCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.forecastText, { color: theme.colors.textSecondary }]}>
              Based on your current spending patterns, advanced forecasting features will be available soon.
              This will include month-end projections and budget recommendations.
            </Text>
          </View>
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
    marginBottom: 20,
  },
  insightsContainer: {
    marginBottom: 30,
  },
  insightCard: {
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  insightIcon: {
    fontSize: 24,
    marginRight: 15,
    marginTop: 2,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  insightDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  categoryCard: {
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
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  categoryDetails: {
    marginTop: 10,
  },
  percentageBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  percentageFill: {
    height: '100%',
    borderRadius: 3,
  },
  percentageText: {
    fontSize: 12,
  },
  trendCard: {
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  trendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  trendPeriod: {
    fontSize: 14,
    flex: 1,
  },
  trendAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  trendChange: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  forecastCard: {
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  forecastText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyCard: {
    padding: 40,
    borderRadius: 15,
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
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});