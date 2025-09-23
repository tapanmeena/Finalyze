import {
    addExpenseSuggestion,
    deleteExpenseSuggestion,
    getAllExpenseSuggestions,
    getSuggestionForExpense
} from '@/utils/database';
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

interface ExpenseSuggestion {
  id: number;
  description: string;
  suggestedCategory: string;
  confidence: number;
  usageCount: number;
  lastUsed: string;
}

export default function SmartCategorizationScreen() {
  const [suggestions, setSuggestions] = useState<ExpenseSuggestion[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [newSuggestion, setNewSuggestion] = useState({
    description: '',
    suggestedCategory: '',
    confidence: '1.0',
  });
  const [testDescription, setTestDescription] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);

  const categories = [
    'Food', 'Transport', 'Entertainment', 'Shopping', 
    'Bills', 'Healthcare', 'Other', 'Subscriptions', 'Utilities'
  ];

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = () => {
    try {
      const suggestionsData = getAllExpenseSuggestions();
      setSuggestions(suggestionsData);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      Alert.alert('Error', 'Failed to load suggestions');
    }
  };

  const handleAddSuggestion = () => {
    if (!newSuggestion.description || !newSuggestion.suggestedCategory) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const confidence = parseFloat(newSuggestion.confidence);
    if (confidence < 0 || confidence > 1) {
      Alert.alert('Error', 'Confidence must be between 0.0 and 1.0');
      return;
    }

    try {
      addExpenseSuggestion(
        newSuggestion.description,
        newSuggestion.suggestedCategory,
        confidence
      );
      setModalVisible(false);
      setNewSuggestion({
        description: '',
        suggestedCategory: '',
        confidence: '1.0',
      });
      loadSuggestions();
      Alert.alert('Success', 'Suggestion added successfully!');
    } catch (error) {
      console.error('Error adding suggestion:', error);
      Alert.alert('Error', 'Failed to add suggestion');
    }
  };

  const handleDeleteSuggestion = (id: number, description: string) => {
    Alert.alert(
      'Delete Suggestion',
      `Are you sure you want to delete the suggestion for "${description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            try {
              deleteExpenseSuggestion(id);
              loadSuggestions();
            } catch (error) {
              console.error('Error deleting suggestion:', error);
              Alert.alert('Error', 'Failed to delete suggestion');
            }
          },
        },
      ]
    );
  };

  const handleTestSuggestion = () => {
    if (!testDescription.trim()) {
      Alert.alert('Error', 'Please enter a description to test');
      return;
    }

    try {
      const result = getSuggestionForExpense(testDescription);
      setTestResult(result);
    } catch (error) {
      console.error('Error testing suggestion:', error);
      Alert.alert('Error', 'Failed to test suggestion');
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#4CAF50'; // High confidence - green
    if (confidence >= 0.6) return '#FF9800'; // Medium confidence - orange
    return '#F44336'; // Low confidence - red
  };

  const formatLastUsed = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  const renderSuggestion = ({ item }: { item: ExpenseSuggestion }) => (
    <View style={styles.suggestionCard}>
      <View style={styles.suggestionHeader}>
        <View style={styles.suggestionInfo}>
          <Text style={styles.suggestionDescription} numberOfLines={2}>
            &ldquo;{item.description}&rdquo;
          </Text>
          <Text style={styles.suggestionCategory}>
            → {item.suggestedCategory}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteSuggestion(item.id, item.description)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      <View style={styles.suggestionDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Confidence:</Text>
          <View style={[
            styles.confidenceBadge, 
            { backgroundColor: getConfidenceColor(item.confidence) }
          ]}>
            <Text style={styles.confidenceText}>
              {(item.confidence * 100).toFixed(0)}%
            </Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Used:</Text>
          <Text style={styles.detailValue}>{item.usageCount} times</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Last Used:</Text>
          <Text style={styles.detailValue}>{formatLastUsed(item.lastUsed)}</Text>
        </View>
      </View>
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
        <Text style={styles.title}>Smart Categorization</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Suggestions</Text>
          <Text style={styles.summaryCount}>{suggestions.length}</Text>
        </View>
        <TouchableOpacity
          style={styles.testButton}
          onPress={() => setTestModalVisible(true)}
        >
          <Ionicons name="flask-outline" size={20} color="#FFFFFF" />
          <Text style={styles.testButtonText}>Test Suggestions</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={24} color="#2196F3" />
        <Text style={styles.infoText}>
          Smart categorization learns from your expense descriptions to automatically suggest categories for future expenses.
        </Text>
      </View>

      <FlatList
        data={suggestions}
        renderItem={renderSuggestion}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bulb-outline" size={64} color="#BDC3C7" />
            <Text style={styles.emptyText}>No suggestions yet</Text>
            <Text style={styles.emptySubtext}>
              Add some suggestions to help automatically categorize your expenses
            </Text>
          </View>
        }
      />

      {/* Add Suggestion Modal */}
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
                    <Text style={styles.modalTitle}>Add Suggestion Rule</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                      <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.inputLabel}>Description/Keywords:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., starbucks, coffee, restaurant"
                    value={newSuggestion.description}
                    onChangeText={(text) => setNewSuggestion({...newSuggestion, description: text})}
                  />

                  <Text style={styles.inputLabel}>Suggested Category:</Text>
                  <View style={styles.pickerContainer}>
              <FlatList
                data={categories}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.categoryChip,
                      newSuggestion.suggestedCategory === item && styles.selectedChip
                    ]}
                    onPress={() => setNewSuggestion({...newSuggestion, suggestedCategory: item})}
                  >
                    <Text style={[
                      styles.chipText,
                      newSuggestion.suggestedCategory === item && styles.selectedChipText
                    ]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item}
              />
            </View>

            <Text style={styles.inputLabel}>Confidence (0.0 - 1.0):</Text>
            <TextInput
              style={styles.input}
              placeholder="1.0"
              value={newSuggestion.confidence}
              onChangeText={(text) => setNewSuggestion({...newSuggestion, confidence: text})}
              keyboardType="numeric"
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleAddSuggestion}>
              <Text style={styles.saveButtonText}>Add Suggestion</Text>
            </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Test Suggestion Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={testModalVisible}
        onRequestClose={() => setTestModalVisible(false)}
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
                    <Text style={styles.modalTitle}>Test Suggestions</Text>
                    <TouchableOpacity onPress={() => setTestModalVisible(false)}>
                      <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.inputLabel}>Enter expense description:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Starbucks coffee purchase"
                    value={testDescription}
                    onChangeText={setTestDescription}
                  />

                  <TouchableOpacity style={styles.testActionButton} onPress={handleTestSuggestion}>
                    <Text style={styles.testActionButtonText}>Test Suggestion</Text>
                  </TouchableOpacity>

                  {testResult !== null && (
                    <View style={styles.testResultContainer}>
                      <Text style={styles.testResultLabel}>Suggested Category:</Text>
                      <Text style={[
                        styles.testResultText,
                        { color: testResult ? '#4CAF50' : '#FF6B6B' }
                      ]}>
                        {testResult || 'No suggestion found'}
                      </Text>
                    </View>
                  )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  summaryItem: {
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
    color: '#2196F3',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
    marginLeft: 12,
    lineHeight: 20,
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  suggestionCard: {
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
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  suggestionInfo: {
    flex: 1,
    marginRight: 10,
  },
  suggestionDescription: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  suggestionCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  deleteButton: {
    padding: 4,
  },
  suggestionDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
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
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
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
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
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
  pickerContainer: {
    marginBottom: 16,
  },
  categoryChip: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
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
  testActionButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  testActionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  testResultContainer: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  testResultLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  testResultText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});