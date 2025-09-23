import React, { useEffect, useState } from "react";
import {
    Alert,
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
import { db } from "../utils/database";

interface Category {
  id: number;
  name: string;
  isCustom: boolean;
  createdAt: string;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = () => {
    try {
      const result = db.getAllSync(
        'SELECT * FROM categories ORDER BY isCustom ASC, name ASC'
      ) as Category[];
      
      // Filter out any invalid categories and ensure proper data types
      const validCategories = result.filter(cat => 
        cat && cat.name && typeof cat.name === 'string' && cat.name.trim().length > 0
      ).map(cat => ({
        ...cat,
        isCustom: Boolean(cat.isCustom), // Ensure boolean type
        name: String(cat.name).trim() // Ensure string type
      }));
      
      console.log('Loaded categories:', validCategories);
      setCategories(validCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    }
  };  const handleSaveCategory = () => {
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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Manage Categories</Text>
      <Text style={styles.subtitle}>Customize your expense categories</Text>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setEditingCategory(null);
          setCategoryName("");
          setModalVisible(true);
        }}
      >
        <Text style={styles.addButtonText}>+ Add Custom Category</Text>
      </TouchableOpacity>

      <View style={styles.categoriesContainer}>
        <Text style={styles.sectionTitle}>Your Categories</Text>
        {categories.length === 0 ? (
          <Text style={styles.noCustomText}>Loading categories...</Text>
        ) : (
          categories.map((category, index) => {
            // Ensure clean data
            const cleanName = (category.name || '').toString().replace(/[^\x20-\x7E]/g, '').trim();
            const isCustomCategory = Boolean(category.isCustom);
            
            if (!cleanName) return null;
            
            return (
              <View key={`category-${category.id}-${index}`} style={styles.categoryCard}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{cleanName}</Text>
                  <Text style={styles.categoryType}>
                    {isCustomCategory ? 'Custom' : 'Default'}
                  </Text>
                </View>

                {isCustomCategory && (
                  <View style={styles.categoryActions}>
                    <TouchableOpacity 
                      style={styles.editButton} 
                      onPress={() => handleEditCategory(category)}
                    >
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.deleteButton} 
                      onPress={() => handleDeleteCategory(category)}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}

        {categories.filter((cat) => cat.isCustom).length === 0 && (
          <Text style={styles.noCustomText}>No custom categories yet. Add your first custom category above!</Text>
        )}
      </View>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{editingCategory ? "Edit Category" : "Add New Category"}</Text>

                <Text style={styles.inputLabel}>Category Name</Text>
                <TextInput style={styles.input} value={categoryName} onChangeText={setCategoryName} placeholder="Enter category name..." maxLength={50} />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setModalVisible(false);
                      setCategoryName("");
                      setEditingCategory(null);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveCategory}>
                    <Text style={styles.saveButtonText}>{editingCategory ? "Update" : "Save"}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  categoryCard: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  categoryType: {
    fontSize: 14,
    color: "#666",
  },
  categoryActions: {
    flexDirection: "row",
  },
  editButton: {
    backgroundColor: "#FF9500",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  editButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  noCustomText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "90%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 10,
    color: "#333",
  },
  input: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginRight: 10,
  },
  cancelButtonText: {
    textAlign: "center",
    fontSize: 16,
    color: "#333",
  },
  saveButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    flex: 1,
  },
  saveButtonText: {
    textAlign: "center",
    fontSize: 16,
    color: "white",
    fontWeight: "bold",
  },
});
