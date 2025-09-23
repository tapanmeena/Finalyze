import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { db } from './database';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadExpenses();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = expenses.filter(expense =>
        expense.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.amount.toString().includes(searchQuery)
      );
      setFilteredExpenses(filtered);
    } else {
      setFilteredExpenses(expenses);
    }
  }, [searchQuery, expenses]);

  const loadExpenses = () => {
    db.transaction((tx: any) => {
      tx.executeSql(
        'SELECT * FROM expenses ORDER BY date DESC',
        [],
        (_: any, { rows }: any) => {
          const expenseList: Expense[] = [];
          for (let i = 0; i < rows.length; i++) {
            expenseList.push(rows.item(i));
          }
          setExpenses(expenseList);
        },
        (error: any) => {
          console.error('Error loading expenses:', error);
        }
      );
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <View style={styles.expenseCard}>
      <View style={styles.expenseHeader}>
        <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
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
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
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
});