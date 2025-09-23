import { addBill, deleteBill, getAllBills, markBillAsPaid } from '@/utils/database';
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
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

interface Bill {
  id: number;
  name: string;
  amount: number;
  category: string;
  dueDate: string;
  frequency: string;
  reminderDays: number;
  isPaid: boolean;
  lastPaidDate?: string;
  notes?: string;
}

export default function BillsScreen() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newBill, setNewBill] = useState({
    name: '',
    amount: '',
    category: 'Bills',
    dueDate: '1',
    frequency: 'monthly',
    reminderDays: '3',
    notes: '',
  });

  const frequencies = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  const categories = [
    'Bills', 'Utilities', 'Rent', 'Insurance', 'Subscriptions',
    'Internet', 'Phone', 'Healthcare', 'Other'
  ];

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = () => {
    try {
      const billsData = getAllBills();
      setBills(billsData);
    } catch (error) {
      console.error('Error loading bills:', error);
      Alert.alert('Error', 'Failed to load bills');
    }
  };

  const handleAddBill = () => {
    if (!newBill.name || !newBill.amount || !newBill.dueDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      addBill(
        newBill.name,
        parseFloat(newBill.amount),
        newBill.dueDate,
        newBill.category,
        newBill.notes
      );
      setModalVisible(false);
      setNewBill({
        name: '',
        amount: '',
        category: 'Bills',
        dueDate: '1',
        frequency: 'monthly',
        reminderDays: '3',
        notes: '',
      });
      loadBills();
      Alert.alert('Success', 'Bill added successfully!');
    } catch (error) {
      console.error('Error adding bill:', error);
      Alert.alert('Error', 'Failed to add bill');
    }
  };

  const handleMarkAsPaid = (id: number, name: string) => {
    Alert.alert(
      'Mark as Paid',
      `Mark "${name}" as paid and add to expenses?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Paid',
          onPress: () => {
            try {
              markBillAsPaid(id);
              loadBills();
              Alert.alert('Success', 'Bill marked as paid and added to expenses');
            } catch (error) {
              console.error('Error marking bill as paid:', error);
              Alert.alert('Error', 'Failed to mark bill as paid');
            }
          },
        },
      ]
    );
  };

  const handleDeleteBill = (id: number, name: string) => {
    Alert.alert(
      'Delete Bill',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            try {
              deleteBill(id);
              loadBills();
            } catch (error) {
              console.error('Error deleting bill:', error);
              Alert.alert('Error', 'Failed to delete bill');
            }
          },
        },
      ]
    );
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'monthly': return '#4CAF50';
      case 'quarterly': return '#FF9800';
      case 'yearly': return '#9C27B0';
      default: return '#95A5A6';
    }
  };

  const getDueStatus = (dueDate: string, isPaid: boolean) => {
    if (isPaid) return { text: 'Paid', color: '#4CAF50' };
    
    const today = new Date();
    const currentDay = today.getDate();
    const dueDateNum = parseInt(dueDate);
    
    if (currentDay === dueDateNum) return { text: 'Due Today', color: '#FF6B6B' };
    if (currentDay > dueDateNum) return { text: 'Overdue', color: '#F44336' };
    
    const daysUntilDue = dueDateNum - currentDay;
    if (daysUntilDue <= 3) return { text: `Due in ${daysUntilDue} days`, color: '#FF9800' };
    
    return { text: `Due on ${dueDate}`, color: '#666' };
  };

  const renderBill = ({ item }: { item: Bill }) => {
    const dueStatus = getDueStatus(item.dueDate, item.isPaid);
    
    return (
      <View style={[styles.billCard, item.isPaid && styles.paidCard]}>
        <View style={styles.billHeader}>
          <View style={styles.billInfo}>
            <Text style={[styles.billName, item.isPaid && styles.paidText]}>
              {item.name}
            </Text>
            <Text style={[styles.billAmount, item.isPaid && styles.paidText]}>
              ${item.amount.toFixed(2)}
            </Text>
          </View>
          {!item.isPaid && (
            <TouchableOpacity
              style={styles.payButton}
              onPress={() => handleMarkAsPaid(item.id, item.name)}
            >
              <Ionicons name="checkmark-circle-outline" size={24} color="#4CAF50" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.billDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category:</Text>
            <Text style={styles.detailValue}>{item.category}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Due Date:</Text>
            <Text style={[styles.detailValue, { color: dueStatus.color }]}>
              {dueStatus.text}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Frequency:</Text>
            <View style={[styles.frequencyBadge, { backgroundColor: getFrequencyColor(item.frequency) }]}>
              <Text style={styles.frequencyText}>{item.frequency}</Text>
            </View>
          </View>
          {item.notes && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Notes:</Text>
              <Text style={styles.detailValue}>{item.notes}</Text>
            </View>
          )}
          {item.lastPaidDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last Paid:</Text>
              <Text style={styles.detailValue}>{item.lastPaidDate}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteBill(item.id, item.name)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    );
  };

  const unpaidBills = bills.filter(bill => !bill.isPaid);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Bills Tracker</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Unpaid Bills</Text>
          <Text style={styles.summaryCount}>{unpaidBills.length}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Due</Text>
          <Text style={styles.summaryAmount}>
            ${unpaidBills.reduce((sum, bill) => sum + bill.amount, 0).toFixed(2)}
          </Text>
        </View>
      </View>

      <FlatList
        data={bills}
        renderItem={renderBill}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#BDC3C7" />
            <Text style={styles.emptyText}>No bills tracked yet</Text>
            <Text style={styles.emptySubtext}>
              Add your first bill to start tracking due dates and payments
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
              <Text style={styles.modalTitle}>Add New Bill</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Bill name (e.g., Electric Bill)"
              value={newBill.name}
              onChangeText={(text) => setNewBill({...newBill, name: text})}
            />

            <TextInput
              style={styles.input}
              placeholder="Amount"
              value={newBill.amount}
              onChangeText={(text) => setNewBill({...newBill, amount: text})}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="Due date (day of month, 1-31)"
              value={newBill.dueDate}
              onChangeText={(text) => setNewBill({...newBill, dueDate: text})}
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
                      newBill.category === item && styles.selectedChip
                    ]}
                    onPress={() => setNewBill({...newBill, category: item})}
                  >
                    <Text style={[
                      styles.chipText,
                      newBill.category === item && styles.selectedChipText
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
                      newBill.frequency === item.value && styles.selectedChip
                    ]}
                    onPress={() => setNewBill({...newBill, frequency: item.value})}
                  >
                    <Text style={[
                      styles.chipText,
                      newBill.frequency === item.value && styles.selectedChipText
                    ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.value}
              />
            </View>

            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Notes (optional)"
              value={newBill.notes}
              onChangeText={(text) => setNewBill({...newBill, notes: text})}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleAddBill}>
              <Text style={styles.saveButtonText}>Add Bill</Text>
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
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  summaryCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  list: {
    flex: 1,
    padding: 20,
  },
  billCard: {
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
  paidCard: {
    opacity: 0.7,
    backgroundColor: '#F0F8FF',
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  billInfo: {
    flex: 1,
  },
  billName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  billAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  paidText: {
    color: '#999',
  },
  payButton: {
    padding: 4,
  },
  billDetails: {
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
  notesInput: {
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