import { db } from '@/utils/database';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface Expense {
  id: number;
  amount: number;
  date: string;
  category: string;
  paymentMethod: string;
  description: string;
}

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadExpenses();
    loadCategories();
  }, []);

  useEffect(() => {
    const applyFilters = () => {
      let filtered = [...expenses];

      // Text search filter
      if (searchQuery) {
        filtered = filtered.filter(expense =>
          expense.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          expense.amount.toString().includes(searchQuery) ||
          expense.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Category filter
      if (selectedCategory) {
        filtered = filtered.filter(expense => expense.category === selectedCategory);
      }

      // Date range filter
      if (startDate) {
        filtered = filtered.filter(expense => expense.date >= startDate);
      }
      if (endDate) {
        filtered = filtered.filter(expense => expense.date <= endDate);
      }

      setFilteredExpenses(filtered);
    };

    applyFilters();
  }, [searchQuery, selectedCategory, startDate, endDate, expenses]);

  const loadCategories = () => {
    try {
      const result = db.getAllSync('SELECT DISTINCT name FROM categories ORDER BY name') as any[];
      setCategories(result.map(row => row.name));
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadExpenses = () => {
    try {
      const result = db.getAllSync('SELECT * FROM expenses ORDER BY date DESC');
      setExpenses(result as Expense[]);
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setStartDate('');
    setEndDate('');
    setFilterModalVisible(false);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchQuery) count++;
    if (selectedCategory) count++;
    if (startDate || endDate) count++;
    return count;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <View style={styles.expenseCard}>
      <View style={styles.expenseHeader}>
        <Text style={styles.expenseAmount}>₹{item.amount.toFixed(2)}</Text>
        <Text style={styles.expenseDate}>{formatDate(item.date)}</Text>
      </View>
      <View style={styles.expenseDetails}>
        <Text style={styles.expenseCategory}>{item.category}</Text>
        <Text style={styles.expensePayment}>{item.paymentMethod}</Text>
      </View>
      {item.description ? (
        <Text style={styles.expenseDescription}>{item.description}</Text>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>All Expenses</Text>
      
      <TextInput
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search expenses..."
      />

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Text style={styles.filterButtonText}>
            Filters {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
          </Text>
        </TouchableOpacity>

        {getActiveFiltersCount() > 0 && (
          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={clearFilters}
          >
            <Text style={styles.clearFiltersText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Active filters display */}
      <View style={styles.activeFiltersContainer}>
        {selectedCategory && (
          <View style={styles.activeFilter}>
            <Text style={styles.activeFilterText}>Category: {selectedCategory}</Text>
            <TouchableOpacity onPress={() => setSelectedCategory('')}>
              <Text style={styles.removeFilterText}>×</Text>
            </TouchableOpacity>
          </View>
        )}
        {(startDate || endDate) && (
          <View style={styles.activeFilter}>
            <Text style={styles.activeFilterText}>
              Date: {startDate || 'Start'} to {endDate || 'End'}
            </Text>
            <TouchableOpacity onPress={() => { setStartDate(''); setEndDate(''); }}>
              <Text style={styles.removeFilterText}>×</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        data={filteredExpenses}
        renderItem={renderExpenseItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.expensesList}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No expenses found</Text>
        }
      />

      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => router.push('./add-expense')}
      >
        <Text style={styles.addButtonText}>+ Add New Expense</Text>
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter Expenses</Text>

            <Text style={styles.filterLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
              <TouchableOpacity
                style={[
                  styles.categoryFilterButton,
                  !selectedCategory && styles.selectedCategoryFilter
                ]}
                onPress={() => setSelectedCategory('')}
              >
                <Text style={[
                  styles.categoryFilterText,
                  !selectedCategory && styles.selectedCategoryFilterText
                ]}>
                  All
                </Text>
              </TouchableOpacity>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryFilterButton,
                    selectedCategory === category && styles.selectedCategoryFilter
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[
                    styles.categoryFilterText,
                    selectedCategory === category && styles.selectedCategoryFilterText
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.filterLabel}>Date Range</Text>
            <View style={styles.dateRangeContainer}>
              <View style={styles.dateInputContainer}>
                <Text style={styles.dateLabel}>From:</Text>
                <TextInput
                  style={styles.dateInput}
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>
              <View style={styles.dateInputContainer}>
                <Text style={styles.dateLabel}>To:</Text>
                <TextInput
                  style={styles.dateInput}
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalApplyButton}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.modalApplyText}>Apply</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalClearButton}
                onPress={clearFilters}
              >
                <Text style={styles.modalClearText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    marginBottom: 20,
    marginTop: 40,
    color: '#333',
  },
  searchInput: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  filterButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    marginRight: 10,
  },
  filterButtonText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  clearFiltersButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  clearFiltersText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  activeFilter: {
    backgroundColor: '#E3F2FD',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 5,
  },
  activeFilterText: {
    color: '#1976D2',
    fontSize: 12,
    marginRight: 5,
  },
  removeFilterText: {
    color: '#1976D2',
    fontSize: 16,
    fontWeight: 'bold',
  },
  expensesList: {
    flex: 1,
  },
  expenseCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  expenseDate: {
    fontSize: 14,
    color: '#666',
  },
  expenseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  expenseCategory: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  expensePayment: {
    fontSize: 14,
    color: '#666',
  },
  expenseDescription: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 5,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 50,
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
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
    color: '#333',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
    color: '#333',
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryFilterButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedCategoryFilter: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryFilterText: {
    fontSize: 14,
    color: '#333',
  },
  selectedCategoryFilterText: {
    color: 'white',
  },
  dateRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dateInputContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
    color: '#333',
  },
  dateInput: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 6,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 6,
    flex: 1,
    marginRight: 5,
  },
  modalCancelText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#333',
  },
  modalApplyButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 5,
  },
  modalApplyText: {
    textAlign: 'center',
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
  },
  modalClearButton: {
    backgroundColor: '#FF9500',
    padding: 12,
    borderRadius: 6,
    flex: 1,
    marginLeft: 5,
  },
  modalClearText: {
    textAlign: 'center',
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
  },
});