import { useTheme } from "@/contexts/ThemeContext";
import { db, initDB } from "@/utils/database";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Dimensions, Platform, RefreshControl, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const { width } = Dimensions.get("window");

interface ExpenseSum {
  today: number;
  thisWeek: number;
  thisMonth: number;
}

interface RecentExpense {
  id: number;
  amount: number;
  category: string;
  description: string;
  date: string;
}

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  route: string;
}

export default function ModernDashboard() {
  const [expenseSums, setExpenseSums] = useState<ExpenseSum>({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
  });
  const [recentExpenses, setRecentExpenses] = useState<RecentExpense[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState("");

  const router = useRouter();
  const { theme } = useTheme();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const loadData = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadExpenseSums(), loadRecentExpenses()]);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    initDB();
    loadData();
    setGreeting(getGreeting());
  }, [loadData]);

  const loadExpenseSums = () => {
    const today = new Date().toISOString().split("T")[0];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    try {
      const todayResult = db.getFirstSync("SELECT SUM(amount) as total FROM expenses WHERE date = ?", [today]) as any;
      const todayTotal = todayResult?.total || 0;

      const weekResult = db.getFirstSync("SELECT SUM(amount) as total FROM expenses WHERE date >= ?", [weekAgo.toISOString().split("T")[0]]) as any;
      const weekTotal = weekResult?.total || 0;

      const monthResult = db.getFirstSync("SELECT SUM(amount) as total FROM expenses WHERE date >= ?", [monthAgo.toISOString().split("T")[0]]) as any;
      const monthTotal = monthResult?.total || 0;

      setExpenseSums({
        today: todayTotal,
        thisWeek: weekTotal,
        thisMonth: monthTotal,
      });
    } catch (error) {
      console.error("Error loading expense sums:", error);
    }
  };

  const loadRecentExpenses = () => {
    try {
      const result = db.getAllSync(
        "SELECT id, amount, category, description, date FROM expenses ORDER BY date DESC, id DESC LIMIT 5"
      ) as RecentExpense[];
      setRecentExpenses(result);
    } catch (error) {
      console.error("Error loading recent expenses:", error);
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: "1",
      title: "Quick Add",
      subtitle: "Log expense",
      icon: "add-circle",
      color: theme.colors.primary,
      route: "/add-expense",
    },
    {
      id: "2",
      title: "Categories",
      subtitle: "Manage",
      icon: "grid",
      color: theme.colors.secondary,
      route: "/categories",
    },
    {
      id: "3",
      title: "Budgets",
      subtitle: "Set limits",
      icon: "wallet",
      color: theme.colors.accent,
      route: "/budget",
    },
    {
      id: "4",
      title: "Bills",
      subtitle: "Track due",
      icon: "receipt",
      color: theme.colors.warning,
      route: "/bills",
    },
  ];

  const navigateToRoute = (route: string) => {
    switch (route) {
      case "/add-expense":
        router.push("/add-expense");
        break;
      case "/categories":
        router.push("/categories");
        break;
      case "/budget":
        router.push("/budget");
        break;
      case "/bills":
        router.push("/bills");
        break;
      default:
        break;
    }
  };

  const renderBalanceCard = () => (
    <LinearGradient colors={[theme.colors.primary, theme.colors.secondary]} style={styles.balanceCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <View style={styles.balanceHeader}>
        <View>
          <Text style={styles.greetingText}>{greeting}!</Text>
          <Text style={styles.balanceLabel}>This Month&apos;s Spending</Text>
        </View>
        <TouchableOpacity style={styles.settingsButton} onPress={() => router.push("/insights")}>
          <Ionicons name="analytics-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <Text style={styles.balanceAmount}>₹{expenseSums.thisMonth.toFixed(2)}</Text>

      <View style={styles.balanceFooter}>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceSubLabel}>Today</Text>
          <Text style={styles.balanceSubAmount}>₹{expenseSums.today.toFixed(2)}</Text>
        </View>
        <View style={styles.balanceDivider} />
        <View style={styles.balanceItem}>
          <Text style={styles.balanceSubLabel}>This Week</Text>
          <Text style={styles.balanceSubAmount}>₹{expenseSums.thisWeek.toFixed(2)}</Text>
        </View>
      </View>
    </LinearGradient>
  );

  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[styles.quickActionCard, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigateToRoute(action.route)}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: action.color + "20" }]}>
              <Ionicons name={action.icon as any} size={24} color={action.color} />
            </View>
            <Text style={[styles.quickActionTitle, { color: theme.colors.text }]}>{action.title}</Text>
            <Text style={[styles.quickActionSubtitle, { color: theme.colors.textSecondary }]}>{action.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderRecentExpenses = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Expenses</Text>
        <TouchableOpacity onPress={() => router.push("/expenses")}>
          <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>See All</Text>
        </TouchableOpacity>
      </View>

      {recentExpenses.length > 0 ? (
        <View style={[styles.expensesContainer, { backgroundColor: theme.colors.surface }]}>
          {recentExpenses.map((expense, index) => (
            <View key={expense.id}>
              <View style={styles.expenseItem}>
                <View style={styles.expenseLeft}>
                  <View style={[styles.expenseIcon, { backgroundColor: theme.colors.primary + "20" }]}>
                    <Text style={styles.expenseIconText}>{expense.category.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.expenseDetails}>
                    <Text style={[styles.expenseDescription, { color: theme.colors.text }]}>{expense.description || expense.category}</Text>
                    <Text style={[styles.expenseDate, { color: theme.colors.textSecondary }]}>{new Date(expense.date).toLocaleDateString()}</Text>
                  </View>
                </View>
                <Text style={[styles.expenseAmount, { color: theme.colors.error }]}>-₹{expense.amount.toFixed(2)}</Text>
              </View>
              {index < recentExpenses.length - 1 && <View style={[styles.expenseDivider, { backgroundColor: theme.colors.border }]} />}
            </View>
          ))}
        </View>
      ) : (
        <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="receipt-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>No expenses yet</Text>
          <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>Start tracking your spending</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={theme.colors.primary} />}
      >
        {renderBalanceCard()}
        {renderQuickActions()}
        {renderRecentExpenses()}

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
  balanceCard: {
    margin: 20,
    marginTop: Platform.OS === "android" ? 40 : 20,
    padding: 24,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  settingsButton: {
    padding: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: "bold",
    color: "white",
    marginBottom: 20,
  },
  balanceFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  balanceItem: {
    flex: 1,
  },
  balanceDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 16,
  },
  balanceSubLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 4,
  },
  balanceSubAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickActionCard: {
    width: (width - 60) / 2,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
  },
  expensesContainer: {
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  expenseLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  expenseIconText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#666",
  },
  expenseDetails: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  expenseDate: {
    fontSize: 12,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  expenseDivider: {
    height: 1,
    marginVertical: 4,
  },
  emptyState: {
    padding: 40,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
  },
  bottomSpacing: {
    height: 20,
  },
});
