import { useCurrency } from "@/contexts/CurrencyContext";
import { useTheme } from "@/contexts/ThemeContext";
import { db } from "@/utils/database";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useState } from "react";
import { Animated, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface CategoryInsight {
  category: string;
  amount: number;
  percentage: number;
  trend: "up" | "down" | "stable";
}

interface Insight {
  id: string;
  type: "tip" | "warning" | "achievement" | "trend";
  title: string;
  description: string;
  icon: string;
}

export default function InsightsScreen() {
  const { theme } = useTheme();
  const { formatCurrency, formatNumber } = useCurrency();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [topCategories, setTopCategories] = useState<CategoryInsight[]>([]);

  const fadeAnim = React.useMemo(() => new Animated.Value(0), []);
  const slideAnim = React.useMemo(() => new Animated.Value(50), []);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "warning":
        return "warning";
      case "achievement":
        return "celebration";
      case "tip":
        return "lightbulb";
      case "trend":
        return "trending-up";
      default:
        return "info";
    }
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: string } = {
      Food: "restaurant",
      Transport: "directions-car",
      Entertainment: "movie",
      Shopping: "shopping-bag",
      Bills: "receipt",
      Healthcare: "local-hospital",
      Other: "category",
    };
    return iconMap[category] || "category";
  };

  const loadTopCategories = useCallback(() => {
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

      const totalResult = db.getFirstSync("SELECT SUM(amount) as total FROM expenses WHERE date LIKE ?", [`${currentMonth}%`]) as any;
      const monthTotal = totalResult?.total || 0;

      const categoryInsights: CategoryInsight[] = result.map((row) => {
        const percentage = monthTotal > 0 ? (row.total / monthTotal) * 100 : 0;
        return {
          category: row.category,
          amount: row.total,
          percentage: Math.min(100, percentage),
          trend: "stable" as const,
        };
      });

      setTopCategories(categoryInsights);
    } catch (error) {
      console.error("Error loading top categories:", error);
    }
  }, []);

  const generateInsights = useCallback(() => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthStr = lastMonth.toISOString().slice(0, 7);

      const currentResult = db.getFirstSync("SELECT SUM(amount) as total FROM expenses WHERE date LIKE ?", [`${currentMonth}%`]) as any;
      const currentTotal = currentResult?.total || 0;

      const lastResult = db.getFirstSync("SELECT SUM(amount) as total FROM expenses WHERE date LIKE ?", [`${lastMonthStr}%`]) as any;
      const lastTotal = lastResult?.total || 0;

      const countResult = db.getFirstSync("SELECT COUNT(*) as count FROM expenses") as any;
      const expenseCount = countResult?.count || 0;

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

      if (lastTotal > 0 && currentTotal > 0) {
        const change = ((currentTotal - lastTotal) / lastTotal) * 100;
        const changeFormatted = formatNumber(change, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        });

        if (change > 10) {
          generatedInsights.push({
            id: "1",
            type: "warning",
            title: "Spending Alert",
            description: `Your spending is ${changeFormatted}% higher than last month. Consider reviewing your budget.`,
            icon: "⚠️",
          });
        } else if (change < -10) {
          generatedInsights.push({
            id: "2",
            type: "achievement",
            title: "Great Savings!",
            description: `You've reduced spending by ${formatNumber(Math.abs(change), {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}% compared to last month. Well done!`,
            icon: "🎉",
          });
        }
      }

      if (categoryResult && currentTotal > 0 && categoryResult.total > currentTotal * 0.4) {
        const categoryShare = (categoryResult.total / currentTotal) * 100;
        generatedInsights.push({
          id: "3",
          type: "tip",
          title: "Category Focus",
          description: `${categoryResult.category} represents ${formatNumber(categoryShare, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}% of your spending. Consider setting a specific budget for this category.`,
          icon: "📊",
        });
      }

      if (expenseCount >= 20) {
        generatedInsights.push({
          id: "4",
          type: "tip",
          title: "Tracking Habits",
          description: `You've logged ${formatNumber(expenseCount, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })} expenses! You&apos;re building great financial awareness habits.`,
          icon: "💪",
        });
      }

      const weekendResult = db.getFirstSync(
        `SELECT SUM(amount) as total FROM expenses 
         WHERE date LIKE ? AND (
           strftime('%w', date) = '0' OR strftime('%w', date) = '6'
         )`,
        [`${currentMonth}%`]
      ) as any;
      const weekendTotal = weekendResult?.total || 0;

      if (currentTotal > 0 && weekendTotal > currentTotal * 0.3) {
        const weekendShare = (weekendTotal / currentTotal) * 100;
        generatedInsights.push({
          id: "5",
          type: "tip",
          title: "Weekend Spending",
          description: `${formatNumber(weekendShare, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}% of your spending happens on weekends. Planning weekend activities in advance might help manage costs.`,
          icon: "📅",
        });
      }

      const today = new Date();
      const daysElapsed = Math.max(today.getDate(), 1);
      const dailyAverage = currentTotal / daysElapsed;
      const projectedMonthly = dailyAverage * 30;

      generatedInsights.push({
        id: "6",
        type: "trend",
        title: "Daily Average",
        description: `Your daily average spending this month is ${formatCurrency(dailyAverage)}. This puts you on track for ${formatCurrency(projectedMonthly)} monthly spending.`,
        icon: "📈",
      });

      setInsights(generatedInsights);
    } catch (error) {
      console.error("Error generating insights:", error);
    }
  }, [formatCurrency, formatNumber]);

  useEffect(() => {
    loadTopCategories();
    generateInsights();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, loadTopCategories, generateInsights]);

  const getInsightColor = (type: string) => {
    switch (type) {
      case "warning":
        return theme.colors.error;
      case "achievement":
        return theme.colors.success;
      case "tip":
        return theme.colors.primary;
      case "trend":
        return theme.colors.accent;
      default:
        return theme.colors.textSecondary;
    }
  };

  const renderInsight = (insight: Insight, index: number) => (
    <Animated.View
      key={insight.id}
      style={[
        styles.insightCard,
        {
          backgroundColor: theme.colors.surface,
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      <View style={styles.insightHeader}>
        <View style={[styles.insightIconContainer, { backgroundColor: getInsightColor(insight.type) + "20" }]}>
          <MaterialIcons name={getInsightIcon(insight.type) as any} size={24} color={getInsightColor(insight.type)} />
        </View>
        <View style={styles.insightContent}>
          <View style={styles.insightTitleRow}>
            <Text style={[styles.insightTitle, { color: theme.colors.text }]}>{insight.title}</Text>
            <View style={[styles.insightBadge, { backgroundColor: getInsightColor(insight.type) }]}>
              <Text style={styles.insightBadgeText}>{insight.type.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={[styles.insightDescription, { color: theme.colors.textSecondary }]}>{insight.description}</Text>
        </View>
      </View>
    </Animated.View>
  );

  const renderCategoryInsight = (category: CategoryInsight, index: number) => (
    <Animated.View
      key={category.category}
      style={[
        styles.categoryCard,
        {
          backgroundColor: theme.colors.surface,
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      <View style={styles.categoryInsightHeader}>
        <View style={styles.categoryIconContainer}>
          <MaterialIcons name={getCategoryIcon(category.category) as any} size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.categoryContent}>
          <Text style={[styles.categoryTitle, { color: theme.colors.text }]}>{category.category}</Text>
          <Text style={[styles.categoryAmount, { color: theme.colors.primary }]}>
            {formatCurrency(category.amount)}
          </Text>
        </View>
        <View style={styles.categoryStats}>
          <Text style={[styles.categoryPercentage, { color: theme.colors.success }]}>
            {`${formatNumber(category.percentage, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`}
          </Text>
          <Text style={[styles.categoryLabel, { color: theme.colors.textSecondary }]}>of total</Text>
        </View>
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
      </View>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Modern Header */}
      <Animated.View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            opacity: fadeAnim,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Financial Insights</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>AI-powered spending analysis</Text>
        </View>

        <TouchableOpacity
          style={[styles.refreshButton, { backgroundColor: theme.colors.background }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            loadTopCategories();
            generateInsights();
          }}
        >
          <MaterialIcons name="refresh" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Personalized Insights Section */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <MaterialIcons name="lightbulb" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.sectionContent}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Personalized Insights</Text>
              <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>Smart analysis of your spending patterns</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.insightsContainer}>
          {insights.length > 0 ? (
            insights.map((insight, index) => renderInsight(insight, index))
          ) : (
            <Animated.View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: theme.colors.surface,
                  opacity: fadeAnim,
                },
              ]}
            >
              <MaterialIcons name="insights" size={48} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>Start logging expenses to receive personalized insights!</Text>
            </Animated.View>
          )}
        </View>

        {/* Top Categories Section */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <MaterialIcons name="bar-chart" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.sectionContent}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Top Spending Categories</Text>
              <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>Your biggest expense categories this month</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.categoriesContainer}>
          {topCategories.length > 0 ? (
            topCategories.map((category, index) => renderCategoryInsight(category, index))
          ) : (
            <Animated.View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: theme.colors.surface,
                  opacity: fadeAnim,
                },
              ]}
            >
              <MaterialIcons name="category" size={48} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No spending data available for this month.</Text>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Modern Header Styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 20,
    paddingBottom: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  // Section Styles
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    backgroundColor: "rgba(0, 122, 255, 0.1)",
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 2,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  // Insights Styles
  insightsContainer: {
    marginBottom: 30,
  },
  insightCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  insightIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  insightContent: {
    flex: 1,
  },
  insightTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 12,
  },
  insightBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  insightBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
  },
  insightDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  // Category Styles
  categoriesContainer: {
    marginBottom: 30,
  },
  categoryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  categoryInsightHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    marginRight: 16,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  categoryAmount: {
    fontSize: 20,
    fontWeight: "bold",
  },
  categoryStats: {
    alignItems: "flex-end",
  },
  categoryPercentage: {
    fontSize: 18,
    fontWeight: "bold",
  },
  categoryLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  categoryDetails: {
    marginTop: 12,
  },
  percentageBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  percentageFill: {
    height: "100%",
    borderRadius: 3,
  },
  // Empty State Styles
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
    lineHeight: 22,
  },
});
