import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { db } from '../utils/database';

interface CategoryExpense {
  category: string;
  total: number;
  percentage: number;
}

export default function Analytics() {
  const [categoryData, setCategoryData] = useState<CategoryExpense[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = () => {
    // Get total expenses for the current month
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    try {
      const result = db.getAllSync(
        'SELECT category, SUM(amount) as total FROM expenses WHERE date >= ? GROUP BY category ORDER BY total DESC',
        [monthAgo.toISOString().split('T')[0]]
      ) as any[];

      let grandTotal = 0;
      const categories: CategoryExpense[] = result.map(row => {
        grandTotal += row.total;
        return {
          category: row.category,
          total: row.total,
          percentage: 0, // Will calculate after we have grand total
        };
      });

      // Calculate percentages
      const categoriesWithPercentage = categories.map(cat => ({
        ...cat,
        percentage: grandTotal > 0 ? (cat.total / grandTotal) * 100 : 0,
      }));

      setCategoryData(categoriesWithPercentage);
      setTotalExpenses(grandTotal);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const getBarColor = (index: number) => {
    const colors = [
      '#007AFF',
      '#34C759',
      '#FF9500',
      '#FF3B30',
      '#AF52DE',
      '#5AC8FA',
      '#FFCC00',
    ];
    return colors[index % colors.length];
  };

  const renderBarChart = () => {
    if (categoryData.length === 0) {
      return (
        <Text style={styles.noDataText}>No expense data available</Text>
      );
    }

    return categoryData.map((item, index) => (
      <View key={item.category} style={styles.barContainer}>
        <View style={styles.barLabel}>
          <Text style={styles.categoryName}>{item.category}</Text>
          <Text style={styles.categoryAmount}>
            ${item.total.toFixed(2)} ({item.percentage.toFixed(1)}%)
          </Text>
        </View>
        <View style={styles.barBackground}>
          <View
            style={[
              styles.barFill,
              {
                width: `${item.percentage}%`,
                backgroundColor: getBarColor(index),
              },
            ]}
          />
        </View>
      </View>
    ));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Spending Analytics</Text>
      <Text style={styles.subtitle}>Current Month Overview</Text>

      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Total Spent</Text>
        <Text style={styles.totalAmount}>${totalExpenses.toFixed(2)}</Text>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Spending by Category</Text>
        {renderBarChart()}
      </View>
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
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 40,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  totalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  totalLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  chartContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  barContainer: {
    marginBottom: 15,
  },
  barLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  categoryAmount: {
    fontSize: 14,
    color: '#666',
  },
  barBackground: {
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 10,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
});