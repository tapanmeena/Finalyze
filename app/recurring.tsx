import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { addRecurringExpense, deleteRecurringExpense, getAllRecurringExpenses, processRecurringExpenses, toggleRecurringExpense } from '../utils/database';

interface RecurringExpense {
  id: number;
  name: string;
  amount: number;
  category: string;
  frequency: string;
  isActive: boolean;
  nextDue: string;
  description?: string;
}

export default function RecurringExpensesScreen() {
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newExpense, setNewExpense] = useState({
    name: '',
    amount: '',
    category: 'Bills',
    frequency: 'monthly',
    description: '',
    isActive: true,
  });

  const frequencies = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  const categories = [
    'Bills', 'Subscriptions', 'Utilities', 'Rent', 'Insurance',
    'Food', 'Transport', 'Entertainment', 'Healthcare', 'Other'
  ];

  useEffect(() => {
    loadRecurringExpenses();
    // Process any due recurring expenses when screen loads
    processRecurringExpenses();
  }, []);

  const loadRecurringExpenses = () => {
    try {
      const expenses = getAllRecurringExpenses();
      setRecurringExpenses(expenses);
    } catch (error) {
      console.error('Error loading recurring expenses:', error);
      Alert.alert('Error', 'Failed to load recurring expenses');
    }
  };

  const handleAddExpense = () => {
    if (!newExpense.name || !newExpense.amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      addRecurringExpense(
        newExpense.name,
        parseFloat(newExpense.amount),
        newExpense.category,
        newExpense.frequency,
        newExpense.description
      );
      setModalVisible(false);
      setNewExpense({
        name: '',
        amount: '',
        category: 'Bills',
        frequency: 'monthly',
        description: '',
        isActive: true,
      });
      loadRecurringExpenses();
      Alert.alert('Success', 'Recurring expense added successfully!');
    } catch (error) {
      console.error('Error adding recurring expense:', error);
      Alert.alert('Error', 'Failed to add recurring expense');
    }
  };

  const handleToggleExpense = (id: number, currentStatus: boolean) => {
    try {
      toggleRecurringExpense(id, !currentStatus);
      loadRecurringExpenses();
    } catch (error) {
      console.error('Error toggling recurring expense:', error);
      Alert.alert('Error', 'Failed to update recurring expense');
    }
  };

  const handleDeleteExpense = (id: number, name: string) => {
    Alert.alert(
      'Delete Recurring Expense',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            try {
              deleteRecurringExpense(id);
              loadRecurringExpenses();
            } catch (error) {
              console.error('Error deleting recurring expense:', error);
              Alert.alert('Error', 'Failed to delete recurring expense');
            }
          },
        },
      ]
    );
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'daily': return '#FF6B6B';
      case 'weekly': return '#4ECDC4';
      case 'monthly': return '#45B7D1';
      case 'yearly': return '#96CEB4';
      default: return '#95A5A6';
    }
  };

  const formatNextDue = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  const renderRecurringExpense = ({ item }: { item: RecurringExpense }) => (
    <View style={[styles.expenseCard, !item.isActive && styles.inactiveCard]}>
      <View style={styles.expenseHeader}>
        <View style={styles.expenseInfo}>
          <Text style={[styles.expenseName, !item.isActive && styles.inactiveText]}>
            {item.name}
          </Text>
          <Text style={[styles.expenseAmount, !item.isActive && styles.inactiveText]}>
            ${item.amount.toFixed(2)}
          </Text>
        </View>
        <Switch
          value={item.isActive}
          onValueChange={() => handleToggleExpense(item.id, item.isActive)}
          trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
          thumbColor={item.isActive ? '#ffffff' : '#f4f3f4'}
        />
      </View>

      <View style={styles.expenseDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Category:</Text>
          <Text style={styles.detailValue}>{item.category}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Frequency:</Text>
          <View style={[styles.frequencyBadge, { backgroundColor: getFrequencyColor(item.frequency) }]}>
            <Text style={styles.frequencyText}>{item.frequency}</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Next Due:</Text>
          <Text style={[
            styles.detailValue,
            item.nextDue && formatNextDue(item.nextDue).includes('Overdue') && styles.overdueText
          ]}>
            {formatNextDue(item.nextDue)}
          </Text>
        </View>
        {item.description && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Description:</Text>
            <Text style={styles.detailValue}>{item.description}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteExpense(item.id, item.name)}
      >
        <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Recurring Expenses</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {recurringExpenses.filter(e => e.isActive).length} active recurring expenses
        </Text>
        <Text style={styles.summaryAmount}>
          Monthly total: ${recurringExpenses
            .filter(e => e.isActive && e.frequency === 'monthly')
            .reduce((sum, e) => sum + e.amount, 0)
            .toFixed(2)}
        </Text>
      </View>

      <FlatList
        data={recurringExpenses}
        renderItem={renderRecurringExpense}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#BDC3C7" />
            <Text style={styles.emptyText}>No recurring expenses yet</Text>
            <Text style={styles.emptySubtext}>
              Add your first recurring expense to start automating your budget tracking
            </Text>
          </View>
        }
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContainer}>
              <ScrollView 
                contentContainerStyle={styles.modalScrollContent}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Recurring Expense</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Expense name (e.g., Netflix Subscription)"
              value={newExpense.name}
              onChangeText={(text) => setNewExpense({...newExpense, name: text})}
            />

            <TextInput
              style={styles.input}
              placeholder="Amount"
              value={newExpense.amount}
              onChangeText={(text) => setNewExpense({...newExpense, amount: text})}
              keyboardType="numeric"
            />

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Category:</Text>
              <FlatList
                data={categories}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.categoryChip,
                      newExpense.category === item && styles.selectedChip
                    ]}
                    onPress={() => setNewExpense({...newExpense, category: item})}
                  >
                    <Text style={[
                      styles.chipText,
                      newExpense.category === item && styles.selectedChipText
                    ]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item}
              />
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Frequency:</Text>
              <FlatList
                data={frequencies}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.frequencyChip,
                      newExpense.frequency === item.value && styles.selectedChip
                    ]}
                    onPress={() => setNewExpense({...newExpense, frequency: item.value})}
                  >
                    <Text style={[
                      styles.chipText,
                      newExpense.frequency === item.value && styles.selectedChipText
                    ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.value}
              />
            </View>

            <TextInput
              style={[styles.input, styles.descriptionInput]}
              placeholder="Description (optional)"
              value={newExpense.description}
              onChangeText={(text) => setNewExpense({...newExpense, description: text})}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleAddExpense}>
              <Text style={styles.saveButtonText}>Add Recurring Expense</Text>
            </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    padding: 5,
  },
  summary: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  summaryText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  list: {
    flex: 1,
    padding: 20,
  },
  expenseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inactiveCard: {
    opacity: 0.6,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  expenseAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  inactiveText: {
    color: '#999',
  },
  expenseDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
  },
  frequencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  frequencyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  overdueText: {
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  deleteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#F8F9FA',
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  categoryChip: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  frequencyChip: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  selectedChip: {
    backgroundColor: '#4CAF50',
  },
  chipText: {
    fontSize: 14,
    color: '#333',
  },
  selectedChipText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});