import { useTheme } from "@/contexts/ThemeContext";
import { db } from "@/utils/database";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Animated,
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Category {
  id: number;
  name: string;
  isCustom: boolean;
  createdAt: string;
}

export default function Categories() {
  const { theme } = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Animation values
  const fadeAnim = React.useMemo(() => new Animated.Value(0), []);
  const slideAnim = React.useMemo(() => new Animated.Value(50), []);

  useEffect(() => {
    loadCategories();

    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Helper function to get category icon
  const getCategoryIcon = (categoryName: string) => {
    const iconMap: { [key: string]: string } = {
      Food: "restaurant",
      Transport: "directions-car",
      Entertainment: "movie",
      Shopping: "shopping-bag",
      Bills: "receipt",
      Healthcare: "local-hospital",
      Education: "school",
      Travel: "flight",
      Groceries: "shopping-cart",
      Other: "category",
    };
    return iconMap[categoryName] || "label";
  };

  const loadCategories = () => {
    try {
      const result = db.getAllSync("SELECT * FROM categories ORDER BY isCustom ASC, name ASC") as Category[];

      // Filter out any invalid categories and ensure proper data types
      const validCategories = result
        .filter((cat) => cat && cat.name && typeof cat.name === "string" && cat.name.trim().length > 0)
        .map((cat) => ({
          ...cat,
          isCustom: Boolean(cat.isCustom), // Ensure boolean type
          name: String(cat.name).trim(), // Ensure string type
        }));

      setCategories(validCategories);
    } catch (error) {
      console.error("Error loading categories:", error);
      setCategories([]);
    }
  };
  const handleSaveCategory = () => {
    if (!categoryName.trim()) {
      Alert.alert("Error", "Please enter a category name");
      return;
    }

    // Check if category already exists
    const existingCategory = categories.find((cat) => cat.name.toLowerCase() === categoryName.trim().toLowerCase());

    if (existingCategory && !editingCategory) {
      Alert.alert("Error", "A category with this name already exists");
      return;
    }

    if (existingCategory && editingCategory && existingCategory.id !== editingCategory.id) {
      Alert.alert("Error", "A category with this name already exists");
      return;
    }

    try {
      if (editingCategory) {
        // Update existing category
        db.runSync("UPDATE categories SET name = ? WHERE id = ?", [categoryName.trim(), editingCategory.id]);

        // Also update any existing expenses with the old category name
        db.runSync("UPDATE expenses SET category = ? WHERE category = ?", [categoryName.trim(), editingCategory.name]);

        // Update any existing budgets with the old category name
        db.runSync("UPDATE budgets SET category = ? WHERE category = ?", [categoryName.trim(), editingCategory.name]);
      } else {
        // Create new category
        db.runSync("INSERT INTO categories (name, isCustom) VALUES (?, ?)", [categoryName.trim(), 1]);
      }

      setModalVisible(false);
      setCategoryName("");
      setEditingCategory(null);
      loadCategories();

      Alert.alert("Success", `Category ${editingCategory ? "updated" : "created"} successfully!`);
    } catch (error) {
      Alert.alert("Error", "Failed to save category");
      console.error("Database error:", error);
    }
  };

  const handleEditCategory = (category: Category) => {
    if (!category.isCustom) {
      Alert.alert("Error", "Default categories cannot be edited");
      return;
    }

    setEditingCategory(category);
    setCategoryName(category.name);
    setModalVisible(true);
  };

  const handleDeleteCategory = (category: Category) => {
    if (!category.isCustom) {
      Alert.alert("Error", "Default categories cannot be deleted");
      return;
    }

    // Check if category is being used in expenses
    try {
      const expenseCount = db.getFirstSync("SELECT COUNT(*) as count FROM expenses WHERE category = ?", [category.name]) as any;

      const budgetCount = db.getFirstSync("SELECT COUNT(*) as count FROM budgets WHERE category = ?", [category.name]) as any;

      if (expenseCount.count > 0 || budgetCount.count > 0) {
        Alert.alert(
          "Cannot Delete",
          `This category is being used in ${expenseCount.count} expense(s) and ${budgetCount.count} budget(s). Please remove or reassign them first.`
        );
        return;
      }

      Alert.alert("Delete Category", `Are you sure you want to delete "${category.name}"?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            try {
              db.runSync("DELETE FROM categories WHERE id = ?", [category.id]);
              loadCategories();
              Alert.alert("Success", "Category deleted successfully!");
            } catch (error) {
              Alert.alert("Error", "Failed to delete category");
              console.error("Database error:", error);
            }
          },
        },
      ]);
    } catch (error) {
      console.error("Error checking category usage:", error);
      Alert.alert("Error", "Failed to check category usage");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Categories Section */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <MaterialIcons name="category" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.sectionContent}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Your Categories</Text>
              <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
                {categories.length} categories • {categories.filter((cat) => cat.isCustom).length} custom
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.addHeaderButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setEditingCategory(null);
                setCategoryName("");
                setModalVisible(true);
              }}
            >
              <MaterialIcons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {categories.length === 0 ? (
          <Animated.View
            style={[
              styles.emptyCard,
              {
                backgroundColor: theme.colors.surface,
                opacity: fadeAnim,
              },
            ]}
          >
            <MaterialIcons name="category" size={48} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>Loading categories...</Text>
          </Animated.View>
        ) : (
          <View style={styles.categoriesGrid}>
            {categories.map((category, index) => {
              const cleanName = (category.name || "")
                .toString()
                .replace(/[^\x20-\x7E]/g, "")
                .trim();
              const isCustomCategory = Boolean(category.isCustom);

              if (!cleanName) return null;

              return (
                <Animated.View
                  key={`category-${category.id}-${index}`}
                  style={[
                    styles.categoryCard,
                    {
                      backgroundColor: theme.colors.surface,
                      transform: [{ translateY: slideAnim }],
                      opacity: fadeAnim,
                    },
                  ]}
                >
                  <View style={styles.categoryHeader}>
                    <View style={[styles.categoryIconContainer, { backgroundColor: theme.colors.primary + "20" }]}>
                      <MaterialIcons name={getCategoryIcon(cleanName) as any} size={24} color={theme.colors.primary} />
                    </View>
                    <View style={styles.categoryInfo}>
                      <Text style={[styles.categoryName, { color: theme.colors.text }]}>{cleanName}</Text>
                      <View style={styles.categoryTypeContainer}>
                        <View
                          style={[
                            styles.categoryTypeBadge,
                            {
                              backgroundColor: isCustomCategory ? theme.colors.success + "20" : theme.colors.textSecondary + "20",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.categoryTypeText,
                              {
                                color: isCustomCategory ? theme.colors.success : theme.colors.textSecondary,
                              },
                            ]}
                          >
                            {isCustomCategory ? "Custom" : "Default"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {isCustomCategory && (
                    <View style={styles.categoryActions}>
                      <TouchableOpacity
                        style={[styles.editButton, { backgroundColor: theme.colors.warning + "20" }]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          handleEditCategory(category);
                        }}
                      >
                        <MaterialIcons name="edit" size={16} color={theme.colors.warning} />
                        <Text style={[styles.editButtonText, { color: theme.colors.warning }]}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.deleteButton, { backgroundColor: theme.colors.error + "20" }]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          handleDeleteCategory(category);
                        }}
                      >
                        <MaterialIcons name="delete" size={16} color={theme.colors.error} />
                        <Text style={[styles.deleteButtonText, { color: theme.colors.error }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </Animated.View>
              );
            })}
          </View>
        )}

        {categories.filter((cat) => cat.isCustom).length === 0 && categories.length > 0 && (
          <Animated.View
            style={[
              styles.emptyCustomCard,
              {
                backgroundColor: theme.colors.surface,
                opacity: fadeAnim,
              },
            ]}
          >
            <MaterialIcons name="add-circle-outline" size={48} color={theme.colors.primary} />
            <Text style={[styles.emptyCustomText, { color: theme.colors.text }]}>No custom categories yet</Text>
            <Text style={[styles.emptyCustomSubtext, { color: theme.colors.textSecondary }]}>
              Tap the + button above to create your first custom category
            </Text>
          </Animated.View>
        )}
      </ScrollView>

      {/* Modern Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <Animated.View
                style={[
                  styles.modalContent,
                  {
                    backgroundColor: theme.colors.surface,
                    opacity: fadeAnim,
                  },
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{editingCategory ? "Edit Category" : "Add New Category"}</Text>
                  <TouchableOpacity
                    style={[styles.modalCloseButton, { backgroundColor: theme.colors.background }]}
                    onPress={() => {
                      setModalVisible(false);
                      setCategoryName("");
                      setEditingCategory(null);
                    }}
                  >
                    <MaterialIcons name="close" size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Category Name</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                        color: theme.colors.text,
                      },
                    ]}
                    value={categoryName}
                    onChangeText={setCategoryName}
                    placeholder="Enter category name..."
                    placeholderTextColor={theme.colors.textSecondary}
                    maxLength={50}
                  />
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.cancelButton, { backgroundColor: theme.colors.background }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setModalVisible(false);
                      setCategoryName("");
                      setEditingCategory(null);
                    }}
                  >
                    <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      handleSaveCategory();
                    }}
                  >
                    <MaterialIcons name="check" size={20} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.saveButtonText}>{editingCategory ? "Update" : "Save"}</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Modern Header Styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 2,
  },
  addHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  // Section Styles
  section: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    backgroundColor: "rgba(0, 122, 255, 0.1)",
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 2,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  // Categories Grid
  categoriesGrid: {
    gap: 16,
  },
  categoryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  categoryTypeContainer: {
    flexDirection: "row",
  },
  categoryTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryTypeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  categoryActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  editButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  // Empty States
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
    lineHeight: 22,
  },
  emptyCustomCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 20,
  },
  emptyCustomText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 16,
  },
  emptyCustomSubtext: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  input: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  modalButtons: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 4,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  // Legacy styles (keeping for compatibility)
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    marginTop: 40,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    color: "#666",
  },
  addButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  categoriesContainer: {
    flex: 1,
  },
  noCustomText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
    marginTop: 20,
  },
});
