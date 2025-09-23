import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { db, initDB } from './database';

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

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Spend Log Dashboard</Text>
      
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Today</Text>
          <Text style={styles.summaryAmount}>${expenseSums.today.toFixed(2)}</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>This Week</Text>
          <Text style={styles.summaryAmount}>${expenseSums.thisWeek.toFixed(2)}</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>This Month</Text>
          <Text style={styles.summaryAmount}>${expenseSums.thisMonth.toFixed(2)}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => router.push('./add-expense')}
      >
        <Text style={styles.addButtonText}>+ Add Expense</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.viewButton}
        onPress={() => router.push('./expenses')}
      >
        <Text style={styles.viewButtonText}>View All Expenses</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.analyticsButton}
        onPress={() => router.push('./analytics')}
      >
        <Text style={styles.analyticsButtonText}>View Analytics</Text>
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
  },
  analyticsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
