import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { db, getSuggestionForExpense } from '../utils/database';

const paymentMethods = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'Digital Wallet'
];

export default function AddExpense() {
  const [amount, setAmount] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = () => {
    try {
      const result = db.getAllSync('SELECT name FROM categories ORDER BY name') as any[];
      setCategories(result.map(row => row.name));
    } catch (error) {
      console.error('Error loading categories:', error);
      // Fallback to hardcoded categories if database fails
      setCategories(['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Other']);
    }
  };

  const handleSaveExpense = () => {
    if (!amount || !selectedCategory || !selectedPaymentMethod) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      db.runSync(
        'INSERT INTO expenses (amount, date, category, paymentMethod, description) VALUES (?, ?, ?, ?, ?)',
        [expenseAmount, date, selectedCategory, selectedPaymentMethod, description]
      );
      
      Alert.alert('Success', 'Expense added successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save expense');
      console.error('Database error:', error);
    }
  };

  const handleDescriptionChange = (text: string) => {
    setDescription(text);
    
    // Get smart suggestion when user types description
    if (text.trim().length > 3) {
      try {
        const suggestion = getSuggestionForExpense(text);
        setSuggestedCategory(suggestion);
      } catch (error) {
        console.error('Error getting suggestion:', error);
        setSuggestedCategory(null);
      }
    } else {
      setSuggestedCategory(null);
    }
  };

  const applySuggestion = () => {
    if (suggestedCategory) {
      setSelectedCategory(suggestedCategory);
      setSuggestedCategory(null);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          style={styles.container}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.title}>Add New Expense</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Amount *</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Date *</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Category *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.selectedCategory
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === category && styles.selectedCategoryText
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity 
          style={styles.manageCategoriesButton}
          onPress={() => router.push('./categories')}
        >
          <Text style={styles.manageCategoriesText}>+ Manage Categories</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Payment Method *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method}
              style={[
                styles.categoryButton,
                selectedPaymentMethod === method && styles.selectedCategory
              ]}
              onPress={() => setSelectedPaymentMethod(method)}
            >
              <Text style={[
                styles.categoryText,
                selectedPaymentMethod === method && styles.selectedCategoryText
              ]}>
                {method}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={handleDescriptionChange}
          placeholder="Optional description..."
          multiline
          numberOfLines={3}
        />
        {suggestedCategory && (
          <TouchableOpacity style={styles.suggestionBanner} onPress={applySuggestion}>
            <View style={styles.suggestionContent}>
              <Ionicons name="bulb-outline" size={16} color="#FF9800" />
              <Text style={styles.suggestionText}>
                Suggested category: <Text style={styles.suggestionCategory}>{suggestedCategory}</Text>
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#FF9800" />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveExpense}>
        <Text style={styles.saveButtonText}>Save Expense</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 40,
    color: '#333',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryButton: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedCategory: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    color: '#333',
  },
  selectedCategoryText: {
    color: 'white',
  },
  manageCategoriesButton: {
    marginTop: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  manageCategoriesText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  suggestionBanner: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  suggestionText: {
    fontSize: 14,
    color: '#E65100',
    marginLeft: 8,
  },
  suggestionCategory: {
    fontWeight: 'bold',
    color: '#FF9800',
  },
});