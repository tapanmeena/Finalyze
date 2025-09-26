import { useCurrency } from "@/contexts/CurrencyContext";
import { useTheme } from "@/contexts/ThemeContext";
import { db } from "@/utils/database";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface CategoryExpense {
  category: string;
  total: number;
  percentage: number;
}

export default function Analytics() {
  const [categoryData, setCategoryData] = useState<CategoryExpense[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [chartType, setChartType] = useState<"bar" | "pie">("bar");
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");

  const { theme } = useTheme();
  const { formatCurrency, formatNumber } = useCurrency();
  const fadeAnim = React.useMemo(() => new Animated.Value(0), []);

  const loadAnalytics = React.useCallback(() => {
    // Calculate date range based on selected timeRange
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default: // month
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    try {
      const result = db.getAllSync("SELECT category, SUM(amount) as total FROM expenses WHERE date >= ? GROUP BY category ORDER BY total DESC", [
        startDate.toISOString().split("T")[0],
      ]) as any[];

      let grandTotal = 0;
      const categories: CategoryExpense[] = result.map((row) => {
        grandTotal += row.total;
        return {
          category: row.category,
          total: row.total,
          percentage: 0, // Will calculate after we have grand total
        };
      });

      // Calculate percentages
      const categoriesWithPercentage = categories.map((cat) => ({
        ...cat,
        percentage: grandTotal > 0 ? (cat.total / grandTotal) * 100 : 0,
      }));

      setCategoryData(categoriesWithPercentage);
      setTotalExpenses(grandTotal);
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
  }, [timeRange]);

  useEffect(() => {
    loadAnalytics();

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [loadAnalytics, fadeAnim]);

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

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case "week":
        return "Last 7 Days";
      case "year":
        return "Last Year";
      default:
        return "Last Month";
    }
  };

  const getBarColor = (index: number) => {
    const colors = ["#007AFF", "#34C759", "#FF9500", "#FF3B30", "#AF52DE", "#5AC8FA", "#FFCC00"];
    return colors[index % colors.length];
  };

  const renderPieChart = () => {
    if (categoryData.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No expense data available</Text>
          <Text style={styles.noDataSubtext}>Add some expenses to see your spending breakdown in a pie chart format.</Text>
          <Text style={styles.noDataSubtext}>💡 Tip: Use the &quot;Dev Tools&quot; button on the dashboard to add sample data for testing.</Text>
        </View>
      );
    }

    // Create a donut-style pie chart visualization
    return (
      <View style={styles.pieChartContainer}>
        {/* Donut chart representation */}
        <View style={styles.donutChartContainer}>
          <View style={styles.donutChart}>
            {categoryData.map((item, index) => {
              // Calculate rotation for visual distribution
              const rotation = categoryData.slice(0, index).reduce((acc, curr) => acc + curr.percentage * 3.6, 0);

              return (
                <View
                  key={`donut-${item.category}`}
                  style={[
                    styles.donutSegment,
                    {
                      backgroundColor: getBarColor(index),
                      transform: [{ rotate: `${rotation}deg` }],
                    },
                  ]}
                />
              );
            })}
            <View style={styles.donutCenter}>
              <Text style={styles.donutCenterText}>Total</Text>
              <Text style={styles.donutCenterAmount}>{formatCurrency(totalExpenses, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</Text>
            </View>
          </View>
        </View>

        {/* Horizontal bar visualization */}
        <View style={styles.pieVisualContainer}>
          <Text style={styles.pieChartSubtitle}>Spending Breakdown</Text>
          {categoryData.map((item, index) => (
            <View key={`pie-visual-${item.category}`} style={styles.pieVisualRow}>
              <View
                style={[
                  styles.pieVisualBar,
                  {
                    width: `${Math.max(8, item.percentage)}%`,
                    backgroundColor: getBarColor(index),
                  },
                ]}
              />
              <Text style={styles.pieBarLabel}>
                {item.category} - {`${formatNumber(item.percentage, {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}%`}
              </Text>
            </View>
          ))}
        </View>

        {/* Detailed legend */}
        <View style={styles.pieLegendContainer}>
          <Text style={styles.pieChartSubtitle}>Category Details</Text>
          {categoryData.map((item, index) => (
            <View key={item.category} style={styles.pieSegmentContainer}>
              <View style={[styles.pieColorBox, { backgroundColor: getBarColor(index) }]} />
              <Text style={styles.pieLegend}>{item.category}</Text>
              <Text style={styles.piePercentage}>
                {`${formatNumber(item.percentage, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`}
              </Text>
              <Text style={styles.pieAmount}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderBarChart = () => {
    if (categoryData.length === 0) {
      return (
        <View style={[styles.noDataContainer, { backgroundColor: theme.colors.background + "80" }]}>
          <MaterialIcons name="trending-up" size={48} color={theme.colors.textSecondary} />
          <Text style={[styles.noDataText, { color: theme.colors.text }]}>No expense data available</Text>
          <Text style={[styles.noDataSubtext, { color: theme.colors.textSecondary }]}>Add some expenses to see your spending breakdown</Text>
        </View>
      );
    }

    return (
      <View style={styles.barChartContainer}>
        {categoryData.map((item, index) => (
          <View key={item.category} style={[styles.categoryRow, { backgroundColor: theme.colors.background }]}>
            <View style={styles.categoryInfo}>
              <View style={styles.categoryHeader}>
                <MaterialIcons name={getCategoryIcon(item.category) as any} size={20} color={getBarColor(index)} />
                <Text style={[styles.categoryName, { color: theme.colors.text }]}>{item.category}</Text>
              </View>
              <View style={styles.categoryAmountContainer}>
                <Text style={[styles.categoryAmount, { color: theme.colors.text }]}>{formatCurrency(item.total)}</Text>
                <Text style={[styles.categoryPercentage, { color: theme.colors.textSecondary }]}>
                  {`${formatNumber(item.percentage, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`}
                </Text>
              </View>
            </View>
            <View style={[styles.barContainer, { backgroundColor: theme.colors.border }]}>
              <View
                style={[
                  styles.bar,
                  {
                    width: `${Math.max(5, item.percentage)}%`,
                    backgroundColor: getBarColor(index),
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
        {/* Modern Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Analytics</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{getTimeRangeLabel()} Overview</Text>
          </View>
          <TouchableOpacity
            style={[styles.refreshButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => {
              loadAnalytics();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            activeOpacity={0.8}
          >
            <MaterialIcons name="refresh" size={22} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Time Range Selector */}
          <View style={[styles.timeRangeCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Time Period</Text>
            <View style={styles.timeRangeSelector}>
              {(["week", "month", "year"] as const).map((range) => (
                <TouchableOpacity
                  key={range}
                  style={[
                    styles.timeRangeButton,
                    {
                      backgroundColor: timeRange === range ? theme.colors.primary : "transparent",
                      borderColor: theme.colors.border,
                    },
                  ]}
                  onPress={() => {
                    setTimeRange(range);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.timeRangeButtonText,
                      {
                        color: timeRange === range ? "white" : theme.colors.text,
                        fontWeight: timeRange === range ? "600" : "400",
                      },
                    ]}
                  >
                    {range === "week" ? "7 Days" : range === "month" ? "Month" : "Year"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Total Spending Card */}
          <View style={[styles.totalCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.totalHeader}>
              <MaterialIcons name="account-balance-wallet" size={24} color={theme.colors.primary} />
              <Text style={[styles.totalLabel, { color: theme.colors.textSecondary }]}>Total Spent</Text>
            </View>
            <Text style={[styles.totalAmount, { color: theme.colors.primary }]}>
              {formatCurrency(totalExpenses)}
            </Text>
            <View style={[styles.totalDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.totalStats}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>{categoryData.length}</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Categories</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {formatCurrency(categoryData.length > 0 ? totalExpenses / categoryData.length : 0, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Avg/Category</Text>
              </View>
            </View>
          </View>

          {/* Chart Container */}
          <View style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.chartHeader}>
              <View style={styles.chartTitleContainer}>
                <MaterialIcons name="bar-chart" size={20} color={theme.colors.primary} />
                <Text style={[styles.chartTitle, { color: theme.colors.text }]}>Spending by Category</Text>
              </View>
              <View style={[styles.chartToggle, { backgroundColor: theme.colors.background }]}>
                <TouchableOpacity
                  style={[styles.toggleButton, chartType === "bar" && { backgroundColor: theme.colors.primary }]}
                  onPress={() => {
                    setChartType("bar");
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="bar-chart" size={16} color={chartType === "bar" ? "white" : theme.colors.textSecondary} />
                  <Text style={[styles.toggleButtonText, { color: chartType === "bar" ? "white" : theme.colors.textSecondary }]}>Bar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleButton, chartType === "pie" && { backgroundColor: theme.colors.primary }]}
                  onPress={() => {
                    setChartType("pie");
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="pie-chart" size={16} color={chartType === "pie" ? "white" : theme.colors.textSecondary} />
                  <Text style={[styles.toggleButtonText, { color: chartType === "pie" ? "white" : theme.colors.textSecondary }]}>Pie</Text>
                </TouchableOpacity>
              </View>
            </View>

            {chartType === "bar" ? renderBarChart() : renderPieChart()}
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    paddingBottom: 24,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
    fontWeight: "400",
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  timeRangeCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  timeRangeSelector: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    marginHorizontal: 2,
  },
  timeRangeButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  totalCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  totalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    marginLeft: 8,
    fontWeight: "500",
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  totalDivider: {
    height: 1,
    marginVertical: 16,
  },
  totalStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chartCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  chartTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  chartToggle: {
    flexDirection: "row",
    borderRadius: 8,
    padding: 3,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 1,
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  barChartContainer: {
    gap: 12,
  },
  categoryRow: {
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  categoryInfo: {
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  categoryAmountContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryAmount: {
    fontSize: 15,
    fontWeight: "500",
  },
  categoryPercentage: {
    fontSize: 14,
    fontWeight: "500",
  },
  barContainer: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: 4,
    minWidth: 8,
  },
  noDataContainer: {
    alignItems: "center",
    padding: 40,
    borderRadius: 12,
    marginVertical: 20,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  // Pie chart styles (keeping existing ones for compatibility)
  pieChartContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  pieVisualContainer: {
    width: "100%",
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
  },
  pieVisualRow: {
    marginVertical: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  pieVisualBar: {
    height: 20,
    borderRadius: 10,
    minWidth: 20,
    marginRight: 10,
  },
  pieBarLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  donutChartContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  donutChart: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#e0e0e0",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  donutSegment: {
    position: "absolute",
    width: 8,
    height: 40,
    borderRadius: 4,
    top: 10,
  },
  donutCenter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  donutCenterText: {
    fontSize: 12,
    fontWeight: "500",
  },
  donutCenterAmount: {
    fontSize: 14,
    fontWeight: "bold",
  },
  pieLegendContainer: {
    width: "100%",
    marginTop: 10,
  },
  pieChartSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 15,
    textAlign: "center",
  },
  pieSegmentContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  pieColorBox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    marginRight: 12,
  },
  pieLegend: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  piePercentage: {
    fontSize: 14,
    fontWeight: "600",
    minWidth: 50,
    textAlign: "right",
    marginRight: 10,
  },
  pieAmount: {
    fontSize: 14,
    fontWeight: "600",
    minWidth: 70,
    textAlign: "right",
  },
});
