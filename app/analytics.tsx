import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
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
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

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

  const renderPieChart = () => {
    if (categoryData.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No expense data available</Text>
          <Text style={styles.noDataSubtext}>
            Add some expenses to see your spending breakdown in a pie chart format.
          </Text>
          <Text style={styles.noDataSubtext}>
            💡 Tip: Use the &quot;Dev Tools&quot; button on the dashboard to add sample data for testing.
          </Text>
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
                    }
                  ]}
                />
              );
            })}
            <View style={styles.donutCenter}>
              <Text style={styles.donutCenterText}>Total</Text>
              <Text style={styles.donutCenterAmount}>${totalExpenses.toFixed(0)}</Text>
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
                  }
                ]}
              />
              <Text style={styles.pieBarLabel}>
                {item.category} - {item.percentage.toFixed(1)}%
              </Text>
            </View>
          ))}
        </View>

        {/* Detailed legend */}
        <View style={styles.pieLegendContainer}>
          <Text style={styles.pieChartSubtitle}>Category Details</Text>
          {categoryData.map((item, index) => (
            <View key={item.category} style={styles.pieSegmentContainer}>
              <View
                style={[
                  styles.pieColorBox,
                  { backgroundColor: getBarColor(index) }
                ]}
              />
              <Text style={styles.pieLegend}>{item.category}</Text>
              <Text style={styles.piePercentage}>
                {item.percentage.toFixed(1)}%
              </Text>
              <Text style={styles.pieAmount}>
                ${item.total.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderBarChart = () => {
    if (categoryData.length === 0) {
      return (
        <Text style={styles.noDataText}>No expense data available</Text>
      );
    }

    return categoryData.map((item, index) => (
      <View key={item.category} style={styles.categoryRow}>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>{item.category}</Text>
          <Text style={styles.categoryAmount}>
            ${item.total.toFixed(2)} ({item.percentage.toFixed(1)}%)
          </Text>
        </View>
        <View style={styles.barContainer}>
          <View
            style={[
              styles.bar,
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
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Spending by Category</Text>
          <View style={styles.chartToggle}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                chartType === 'bar' && styles.activeToggleButton
              ]}
              onPress={() => setChartType('bar')}
            >
              <Text style={[
                styles.toggleButtonText,
                chartType === 'bar' && styles.activeToggleButtonText
              ]}>
                Bar Chart
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                chartType === 'pie' && styles.activeToggleButton
              ]}
              onPress={() => setChartType('pie')}
            >
              <Text style={[
                styles.toggleButtonText,
                chartType === 'pie' && styles.activeToggleButtonText
              ]}>
                Pie Chart
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {chartType === 'bar' ? renderBarChart() : renderPieChart()}
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
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 20,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  totalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  chartToggle: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 3,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeToggleButton: {
    backgroundColor: '#007AFF',
  },
  toggleButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeToggleButtonText: {
    color: '#fff',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  categoryInfo: {
    flex: 1,
    marginRight: 10,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  categoryAmount: {
    fontSize: 14,
    color: '#666',
  },
  barContainer: {
    flex: 2,
    height: 30,
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 15,
  },
  pieChartContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  pieVisualContainer: {
    width: '100%',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
  },
  pieVisualRow: {
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pieVisualBar: {
    height: 20,
    borderRadius: 10,
    minWidth: 20,
    marginRight: 10,
  },
  pieBarLabel: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  donutChartContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  donutChart: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutSegment: {
    position: 'absolute',
    width: 8,
    height: 40,
    borderRadius: 4,
    top: 10,
  },
  donutCenter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  donutCenterText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  donutCenterAmount: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  pieLegendContainer: {
    width: '100%',
    marginTop: 10,
  },
  pieChartSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  pieSegmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#f9f9f9',
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
    color: '#333',
    fontWeight: '500',
  },
  piePercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    minWidth: 50,
    textAlign: 'right',
    marginRight: 10,
  },
  pieAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    minWidth: 70,
    textAlign: 'right',
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
  },
  noDataContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noDataSubtext: {
    textAlign: 'center',
    color: '#888',
    fontSize: 14,
    marginTop: 10,
    lineHeight: 20,
  },
});