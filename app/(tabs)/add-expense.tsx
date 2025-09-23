import { useTheme } from "@/contexts/ThemeContext";
import { db, getSuggestionForExpense } from "@/utils/database";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Animated,
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
} from "react-native";

const paymentMethods = ["Cash", "Credit Card", "Debit Card", "Digital Wallet"];

export default function AddExpense() {
  const [amount, setAmount] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);

  const router = useRouter();
  const { theme } = useTheme();
  const fadeAnim = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    loadCategories();

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const loadCategories = () => {
    try {
      const result = db.getAllSync("SELECT name FROM categories ORDER BY name") as any[];
      setCategories(result.map((row) => row.name));
    } catch (error) {
      console.error("Error loading categories:", error);
      // Fallback to hardcoded categories if database fails
      setCategories(["Food", "Transport", "Entertainment", "Shopping", "Bills", "Healthcare", "Other"]);
    }
  };

  const handleSaveExpense = () => {
    if (!amount || !selectedCategory || !selectedPaymentMethod) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    try {
      db.runSync("INSERT INTO expenses (amount, date, category, paymentMethod, description) VALUES (?, ?, ?, ?, ?)", [
        expenseAmount,
        date,
        selectedCategory,
        selectedPaymentMethod,
        description,
      ]);

      Alert.alert("Success", "Expense added successfully", [{ text: "OK", onPress: () => router.back() }]);
    } catch (error) {
      Alert.alert("Error", "Failed to save expense");
      console.error("Database error:", error);
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
        console.error("Error getting suggestion:", error);
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
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      // behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={[styles.container, { backgroundColor: theme.colors.background }]}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Modern Header */}
            <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
              <TouchableOpacity
                style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
                onPress={() => {
                  router.back();
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.8}
              >
                <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
              </TouchableOpacity>

              <View style={styles.headerTitleContainer}>
                <Text style={[styles.title, { color: theme.colors.text }]}>Add Expense</Text>
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Track your spending</Text>
              </View>

              <TouchableOpacity
                style={[styles.headerActionButton, { backgroundColor: theme.colors.surface }]}
                onPress={() => {
                  // Clear all fields
                  setAmount("");
                  setSelectedCategory("");
                  setSelectedPaymentMethod("");
                  setDescription("");
                  setSuggestedCategory(null);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.8}
              >
                <MaterialIcons name="refresh" size={22} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.inputCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.inputIconRow}>
                <MaterialIcons name="attach-money" size={22} color={theme.colors.primary} style={styles.inputIcon} />
                <Text style={[styles.label, { color: theme.colors.text }]}>Amount *</Text>
              </View>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.inputIconRow}>
                <MaterialIcons name="calendar-today" size={20} color={theme.colors.primary} style={styles.inputIcon} />
                <Text style={[styles.label, { color: theme.colors.text }]}>Date *</Text>
              </View>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            <View style={[styles.inputCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.inputIconRow}>
                <MaterialIcons name="category" size={20} color={theme.colors.primary} style={styles.inputIcon} />
                <Text style={[styles.label, { color: theme.colors.text }]}>Category *</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.buttonScrollView}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      {
                        backgroundColor: selectedCategory === category ? theme.colors.primary : theme.colors.surface,
                        borderColor: selectedCategory === category ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedCategory(category);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <MaterialIcons
                      name="label"
                      size={16}
                      color={selectedCategory === category ? "white" : theme.colors.primary}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        {
                          color: selectedCategory === category ? "white" : theme.colors.text,
                          fontWeight: selectedCategory === category ? "600" : "400",
                        },
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={[
                  styles.manageCategoriesButton,
                  {
                    backgroundColor: theme.colors.accent + "20",
                    borderColor: theme.colors.accent,
                  },
                ]}
                activeOpacity={0.85}
                onPress={() => {
                  router.push("/categories");
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
              >
                <MaterialIcons name="add" size={16} color={theme.colors.accent} style={{ marginRight: 4 }} />
                <Text style={[styles.manageCategoriesText, { color: theme.colors.accent }]}>Manage Categories</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.inputCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.inputIconRow}>
                <MaterialIcons name="payment" size={20} color={theme.colors.primary} style={styles.inputIcon} />
                <Text style={[styles.label, { color: theme.colors.text }]}>Payment Method *</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.buttonScrollView}>
                {paymentMethods.map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.categoryButton,
                      {
                        backgroundColor: selectedPaymentMethod === method ? theme.colors.primary : theme.colors.surface,
                        borderColor: selectedPaymentMethod === method ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedPaymentMethod(method);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <MaterialIcons
                      name={
                        method === "Cash"
                          ? "money"
                          : method === "Credit Card"
                          ? "credit-card"
                          : method === "Debit Card"
                          ? "credit-card"
                          : "account-balance-wallet"
                      }
                      size={16}
                      color={selectedPaymentMethod === method ? "white" : theme.colors.primary}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        {
                          color: selectedPaymentMethod === method ? "white" : theme.colors.text,
                          fontWeight: selectedPaymentMethod === method ? "600" : "400",
                        },
                      ]}
                    >
                      {method}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={[styles.inputCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.inputIconRow}>
                <MaterialIcons name="notes" size={20} color={theme.colors.primary} style={styles.inputIcon} />
                <Text style={[styles.label, { color: theme.colors.text }]}>Description</Text>
              </View>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                value={description}
                onChangeText={handleDescriptionChange}
                placeholder="Optional description..."
                placeholderTextColor={theme.colors.textSecondary}
                multiline={true}
                numberOfLines={3}
              />
            </View>

            {suggestedCategory && (
              <View
                style={[
                  styles.suggestionBanner,
                  {
                    backgroundColor: theme.colors.warning + "20",
                    borderColor: theme.colors.warning,
                  },
                ]}
              >
                <View style={styles.suggestionContent}>
                  <Ionicons name="bulb-outline" size={16} color={theme.colors.warning} />
                  <Text style={[styles.suggestionText, { color: theme.colors.text }]}>
                    Suggested category: <Text style={[styles.suggestionCategory, { color: theme.colors.warning }]}>{suggestedCategory}</Text>
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    applySuggestion();
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }}
                  style={styles.suggestionApplyButton}
                >
                  <MaterialIcons name="check" size={18} color={theme.colors.warning} />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
              activeOpacity={0.85}
              onPress={() => {
                handleSaveExpense();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              }}
            >
              <MaterialIcons name="check-circle" size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.saveButtonText}>Save Expense</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: Platform.OS === "ios" ? 20 : 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "left",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "400",
    textAlign: "left",
    marginTop: 2,
    opacity: 0.8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    paddingBottom: 24,
    paddingHorizontal: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 16,
  },
  headerActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  inputCard: {
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  inputIconRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
  input: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  textArea: {
    height: 90,
    textAlignVertical: "top",
  },
  buttonScrollView: {
    marginTop: 8,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    marginRight: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
  },
  manageCategoriesButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  manageCategoriesText: {
    fontSize: 14,
    fontWeight: "600",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    borderRadius: 16,
    marginTop: 24,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  saveButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  suggestionBanner: {
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  suggestionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  suggestionText: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: "500",
  },
  suggestionCategory: {
    fontWeight: "700",
  },
  suggestionApplyButton: {
    padding: 8,
    borderRadius: 20,
  },
  // Legacy styles to maintain compatibility
  inputGroup: {
    marginBottom: 20,
  },
  selectedCategory: {
    // This will be handled inline now
  },
  selectedCategoryText: {
    // This will be handled inline now
  },
  cancelButton: {
    backgroundColor: "#FF3B30",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  cancelButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
