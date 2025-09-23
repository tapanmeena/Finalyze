import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { db, initDB, recreateDatabase } from '../utils/database';

interface ExpenseSum {
  today: number;
  thisWeek: number;
  thisMonth: number;
}

export default function Dashboard() {
  const [expenseSums, setExpenseSums] = useState<ExpenseSum>({
    today: 0,
    thisWeek: 0,
    thisMonth: 0
  });
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    initDB();
    loadExpenseSums();
  }, []);

  const loadExpenseSums = () => {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    try {
      // Today's expenses
      const todayResult = db.getFirstSync('SELECT SUM(amount) as total FROM expenses WHERE date = ?', [today]) as any;
      const todayTotal = todayResult?.total || 0;

      // This week's expenses
      const weekResult = db.getFirstSync('SELECT SUM(amount) as total FROM expenses WHERE date >= ?', [weekAgo.toISOString().split('T')[0]]) as any;
      const weekTotal = weekResult?.total || 0;

      // This month's expenses
      const monthResult = db.getFirstSync('SELECT SUM(amount) as total FROM expenses WHERE date >= ?', [monthAgo.toISOString().split('T')[0]]) as any;
      const monthTotal = monthResult?.total || 0;

      setExpenseSums({
        today: todayTotal,
        thisWeek: weekTotal,
        thisMonth: monthTotal
      });
    } catch (error) {
      console.error('Error loading expense sums:', error);
    }
  };

  const handleRecreateDatabase = () => {
    Alert.alert(
      'Database Options',
      'Choose an option:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add Sample Data', 
          onPress: () => {
            try {
              // Add sample expenses for testing
              const sampleExpenses = [
                { amount: 25.50, category: 'Food', paymentMethod: 'Card', description: 'Lunch at restaurant', date: '2025-09-20' },
                { amount: 60.00, category: 'Transport', paymentMethod: 'Card', description: 'Gas for car', date: '2025-09-21' },
                { amount: 120.00, category: 'Shopping', paymentMethod: 'Card', description: 'Groceries', date: '2025-09-21' },
                { amount: 45.00, category: 'Entertainment', paymentMethod: 'Cash', description: 'Movie tickets', date: '2025-09-22' },
                { amount: 80.00, category: 'Bills', paymentMethod: 'Card', description: 'Electricity bill', date: '2025-09-22' },
                { amount: 15.00, category: 'Food', paymentMethod: 'Card', description: 'Coffee shop', date: '2025-09-23' },
                { amount: 200.00, category: 'Healthcare', paymentMethod: 'Card', description: 'Doctor visit', date: '2025-09-23' },
              ];

              sampleExpenses.forEach(expense => {
                db.runSync(
                  'INSERT INTO expenses (amount, date, category, paymentMethod, description) VALUES (?, ?, ?, ?, ?)',
                  [expense.amount, expense.date, expense.category, expense.paymentMethod, expense.description]
                );
              });

              loadExpenseSums();
              Alert.alert('Success', 'Sample data added successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to add sample data: ' + error);
            }
          }
        },
        { 
          text: 'Recreate DB', 
          style: 'destructive',
          onPress: () => {
            try {
              recreateDatabase();
              loadExpenseSums();
              Alert.alert('Success', 'Database recreated successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to recreate database: ' + error);
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Spend Log Dashboard</Text>
      
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface, shadowColor: theme.colors.shadow }]}>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Today</Text>
          <Text style={[styles.summaryAmount, { color: theme.colors.text }]}>${expenseSums.today.toFixed(2)}</Text>
        </View>
        
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface, shadowColor: theme.colors.shadow }]}>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>This Week</Text>
          <Text style={[styles.summaryAmount, { color: theme.colors.text }]}>${expenseSums.thisWeek.toFixed(2)}</Text>
        </View>
        
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface, shadowColor: theme.colors.shadow }]}>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>This Month</Text>
          <Text style={[styles.summaryAmount, { color: theme.colors.text }]}>${expenseSums.thisMonth.toFixed(2)}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.push('./add-expense')}
      >
        <Text style={styles.addButtonText}>+ Add Expense</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.viewButton, { backgroundColor: theme.colors.secondary }]}
        onPress={() => router.push('./expenses')}
      >
        <Text style={styles.viewButtonText}>View All Expenses</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.analyticsButton, { backgroundColor: theme.colors.accent }]}
        onPress={() => router.push('./analytics')}
      >
        <Text style={styles.analyticsButtonText}>View Analytics</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.recurringButton, { backgroundColor: theme.colors.warning }]}
        onPress={() => router.push('./recurring')}
      >
        <Text style={styles.recurringButtonText}>Recurring Expenses</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.billsButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.push('./bills')}
      >
        <Text style={styles.billsButtonText}>Bills Tracker</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.suggestionsButton, { backgroundColor: '#9C27B0' }]}
        onPress={() => router.push('./suggestions')}
      >
        <Text style={styles.suggestionsButtonText}>Smart Categories</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.budgetButton, { backgroundColor: '#5856D6' }]}
        onPress={() => router.push('./budget')}
      >
        <Text style={styles.budgetButtonText}>Manage Budget</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.categoriesButton, { backgroundColor: '#AF52DE' }]}
        onPress={() => router.push('./categories')}
      >
        <Text style={styles.categoriesButtonText}>Manage Categories</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.themesButton, { backgroundColor: theme.colors.accent }]}
        onPress={() => router.push('./themes')}
      >
        <Text style={styles.themesButtonText}>🎨 Themes & Appearance</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.milestonesButton, { backgroundColor: theme.colors.success }]}
        onPress={() => router.push('./milestones')}
      >
        <Text style={styles.milestonesButtonText}>🏆 Milestones & Progress</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.insightsButton, { backgroundColor: '#FF6B35' }]}
        onPress={() => router.push('./insights')}
      >
        <Text style={styles.insightsButtonText}>💡 Financial Insights</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.debugButton, { backgroundColor: theme.colors.error }]}
        onPress={handleRecreateDatabase}
      >
        <Text style={styles.debugButtonText}>🔧 Dev Tools (Sample Data)</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 40,
    color: '#333',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
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
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  addButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  viewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  analyticsButton: {
    backgroundColor: '#FF9500',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  analyticsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recurringButton: {
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  recurringButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  billsButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  billsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  suggestionsButton: {
    backgroundColor: '#9C27B0',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  suggestionsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  budgetButton: {
    backgroundColor: '#5856D6',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  budgetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoriesButton: {
    backgroundColor: '#AF52DE',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  categoriesButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  debugButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  debugButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  themesButton: {
    backgroundColor: '#FF9500',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  themesButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  milestonesButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  milestonesButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  insightsButton: {
    backgroundColor: '#FF6B35',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  insightsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
