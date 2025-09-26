import { useCurrency } from '@/contexts/CurrencyContext';
import { Theme, useTheme } from '@/contexts/ThemeContext';
import { db } from '@/utils/database';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface BudgetItem {
  id: number;
  category: string;
  amount: number;
  period: string;
}

interface BudgetProgress {
  category: string;
  budgetAmount: number;
  spent: number;
  remaining: number;
  percentage: number;
}

export default function BudgetScreen() {
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [budgetProgress, setBudgetProgress] = useState<BudgetProgress[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [editingBudget, setEditingBudget] = useState<BudgetItem | null>(null);
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { formatCurrency, formatNumber, currencySymbol } = useCurrency();

  useEffect(() => {
    loadBudgets();
    loadCategories();
    loadBudgetProgress();
  }, []);

  const loadCategories = () => {
    try {
      const result = db.getAllSync('SELECT name FROM categories ORDER BY name') as any[];
      setCategories(result.map(row => row.name));
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadBudgets = () => {
    try {
      const result = db.getAllSync('SELECT * FROM budgets ORDER BY category') as BudgetItem[];
      setBudgets(result);
    } catch (error) {
      console.error('Error loading budgets:', error);
    }
  };

  const loadBudgetProgress = () => {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthStart = firstDayOfMonth.toISOString().split('T')[0];

    try {
      const budgetData = db.getAllSync('SELECT * FROM budgets') as BudgetItem[];
      const progress: BudgetProgress[] = [];

      budgetData.forEach(budget => {
        const spentResult = db.getFirstSync(
          'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE category = ? AND date >= ?',
          [budget.category, monthStart]
        ) as any;

        const spent = spentResult?.total || 0;
        const remaining = budget.amount - spent;
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

        progress.push({
          category: budget.category,
          budgetAmount: budget.amount,
          spent: spent,
          remaining: remaining,
          percentage: Math.min(percentage, 100)
        });
      });

      setBudgetProgress(progress);
    } catch (error) {
      console.error('Error loading budget progress:', error);
    }
  };

  const handleSaveBudget = () => {
    if (!selectedCategory || !budgetAmount) {
      Alert.alert('Error', 'Please select a category and enter a budget amount');
      return;
    }

    const amount = parseFloat(budgetAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid budget amount');
      return;
    }

    try {
      if (editingBudget) {
        db.runSync(
          'UPDATE budgets SET amount = ? WHERE id = ?',
          [amount, editingBudget.id]
        );
      } else {
        db.runSync(
          'INSERT OR REPLACE INTO budgets (category, amount, period) VALUES (?, ?, ?)',
          [selectedCategory, amount, 'monthly']
        );
      }

      setModalVisible(false);
      setSelectedCategory('');
      setBudgetAmount('');
      setEditingBudget(null);
      loadBudgets();
      loadBudgetProgress();
      
      Alert.alert('Success', `Budget ${editingBudget ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to save budget');
      console.error('Database error:', error);
    }
  };

  const handleEditBudget = (budget: BudgetItem) => {
    setEditingBudget(budget);
    setSelectedCategory(budget.category);
    setBudgetAmount(budget.amount.toString());
    setModalVisible(true);
  };

  const handleDeleteBudget = (budgetId: number) => {
    Alert.alert(
      'Delete Budget',
      'Are you sure you want to delete this budget?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            try {
              db.runSync('DELETE FROM budgets WHERE id = ?', [budgetId]);
              loadBudgets();
              loadBudgetProgress();
              Alert.alert('Success', 'Budget deleted successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete budget');
              console.error('Database error:', error);
            }
          }
        }
      ]
    );
  };

  const getProgressColor = (percentage: number) => {
    if (percentage <= 50) return theme.colors.success;
    if (percentage <= 80) return theme.colors.warning;
    return theme.colors.error;
  };

  const renderBudgetProgress = () => {
    if (budgetProgress.length === 0) {
      return (
        <Text style={styles.noDataText}>No budgets set yet. Create your first budget!</Text>
      );
    }

    return budgetProgress.map((item, index) => (
      <View key={item.category} style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.categoryName}>{item.category}</Text>
          <TouchableOpacity
            onPress={() => {
              const budget = budgets.find(b => b.category === item.category);
              if (budget) handleEditBudget(budget);
            }}
          >
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.progressInfo}>
          <Text style={styles.budgetAmount}>
            {`Budget: ${formatCurrency(item.budgetAmount)}`}
          </Text>
          <Text style={styles.spentAmount}>
            {`Spent: ${formatCurrency(item.spent)}`}
          </Text>
          <Text style={[
            styles.remainingAmount,
            { color: item.remaining >= 0 ? theme.colors.success : theme.colors.error }
          ]}>
            {item.remaining >= 0 ? 'Remaining' : 'Over budget'}: {formatCurrency(Math.abs(item.remaining))}
          </Text>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${item.percentage}%`,
                  backgroundColor: getProgressColor(item.percentage),
                },
              ]}
            />
          </View>
          <Text style={styles.progressPercentage}>
            {`${formatNumber(item.percentage, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`}
          </Text>
        </View>
      </View>
    ));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Budget Management</Text>
      <Text style={styles.subtitle}>Track your monthly spending limits</Text>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setEditingBudget(null);
          setSelectedCategory('');
          setBudgetAmount('');
          setModalVisible(true);
        }}
      >
        <Text style={styles.addButtonText}>+ Add New Budget</Text>
      </TouchableOpacity>

      <View style={styles.progressContainer}>
        {renderBudgetProgress()}
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingBudget ? 'Edit Budget' : 'Add New Budget'}
            </Text>

            <Text style={styles.inputLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelector}>
              {categories.filter(cat => !editingBudget || cat === editingBudget.category).map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category && styles.selectedCategoryButton
                  ]}
                  onPress={() => setSelectedCategory(category)}
                  disabled={!!editingBudget}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    selectedCategory === category && styles.selectedCategoryButtonText
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Monthly Budget Amount</Text>
            <TextInput
              style={styles.input}
              value={budgetAmount}
              onChangeText={setBudgetAmount}
              placeholder={`${currencySymbol}0.00`}
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setSelectedCategory('');
                  setBudgetAmount('');
                  setEditingBudget(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveBudget}
              >
                <Text style={styles.saveButtonText}>
                  {editingBudget ? 'Update' : 'Save'}
                </Text>
              </TouchableOpacity>

              {editingBudget && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => {
                    setModalVisible(false);
                    handleDeleteBudget(editingBudget.id);
                  }}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 10,
      marginTop: 40,
      color: theme.colors.text,
    },
    subtitle: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 30,
      color: theme.colors.textSecondary,
    },
    addButton: {
      backgroundColor: theme.colors.primary,
      padding: 15,
      borderRadius: 10,
      alignItems: 'center',
      marginBottom: 20,
    },
    addButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    progressContainer: {
      flex: 1,
    },
    progressCard: {
      backgroundColor: theme.colors.card,
      padding: 20,
      borderRadius: 10,
      marginBottom: 15,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    categoryName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    editText: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: '500',
    },
    progressInfo: {
      marginBottom: 15,
    },
    budgetAmount: {
      fontSize: 16,
      color: theme.colors.text,
      marginBottom: 5,
    },
    spentAmount: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: 5,
    },
    remainingAmount: {
      fontSize: 16,
      fontWeight: '500',
    },
    progressBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    progressBarBackground: {
      flex: 1,
      height: 10,
      backgroundColor: theme.colors.border,
      borderRadius: 5,
      overflow: 'hidden',
      marginRight: 10,
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 5,
    },
    progressPercentage: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
      minWidth: 50,
      textAlign: 'right',
    },
    noDataText: {
      textAlign: 'center',
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginTop: 50,
      fontStyle: 'italic',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.colors.modalOverlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.colors.card,
      padding: 20,
      borderRadius: 10,
      width: '90%',
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 20,
      color: theme.colors.text,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 10,
      color: theme.colors.text,
    },
    categorySelector: {
      marginBottom: 20,
    },
    categoryButton: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: 20,
      marginRight: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    selectedCategoryButton: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    categoryButtonText: {
      fontSize: 14,
      color: theme.colors.text,
    },
    selectedCategoryButtonText: {
      color: '#ffffff',
    },
    input: {
      backgroundColor: theme.colors.surface,
      padding: 15,
      borderRadius: 10,
      fontSize: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 20,
      color: theme.colors.text,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    cancelButton: {
      backgroundColor: theme.colors.surface,
      padding: 15,
      borderRadius: 10,
      flex: 1,
      marginRight: 10,
    },
    cancelButtonText: {
      textAlign: 'center',
      fontSize: 16,
      color: theme.colors.text,
    },
    saveButton: {
      backgroundColor: theme.colors.primary,
      padding: 15,
      borderRadius: 10,
      flex: 1,
    },
    saveButtonText: {
      textAlign: 'center',
      fontSize: 16,
      color: '#ffffff',
      fontWeight: 'bold',
    },
    deleteButton: {
      backgroundColor: theme.colors.error,
      padding: 15,
      borderRadius: 10,
      flex: 1,
      marginLeft: 10,
    },
    deleteButtonText: {
      textAlign: 'center',
      fontSize: 16,
      color: '#ffffff',
      fontWeight: 'bold',
    },
  });