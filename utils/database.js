import * as SQLite from 'expo-sqlite';

// Open the database
const db = SQLite.openDatabaseSync('expenses.db');

const recreateDatabase = () => {
    try {
        console.log('Recreating database with Phase 2 schema...');
        
        // Drop existing tables
        db.execSync('DROP TABLE IF EXISTS recurring_expenses');
        db.execSync('DROP TABLE IF EXISTS bills');
        db.execSync('DROP TABLE IF EXISTS expense_suggestions');
        db.execSync('DROP TABLE IF EXISTS budgets');
        db.execSync('DROP TABLE IF EXISTS categories');
        db.execSync('DROP TABLE IF EXISTS expenses');
        
        // Create expenses table (enhanced for Phase 2)
        db.execSync(`
            CREATE TABLE expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                amount REAL NOT NULL,
                date TEXT NOT NULL,
                category TEXT NOT NULL,
                paymentMethod TEXT NOT NULL,
                description TEXT,
                isRecurring BOOLEAN DEFAULT 0,
                recurringId INTEGER,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (recurringId) REFERENCES recurring_expenses(id)
            );
        `);
        
        // Create categories table with isCustom column
        db.execSync(`
            CREATE TABLE categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                isCustom BOOLEAN DEFAULT 0,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create budgets table
        db.execSync(`
            CREATE TABLE budgets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT NOT NULL,
                amount REAL NOT NULL,
                period TEXT NOT NULL DEFAULT 'monthly',
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(category, period)
            );
        `);

        // NEW: Create recurring expenses table
        db.execSync(`
            CREATE TABLE recurring_expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                amount REAL NOT NULL,
                category TEXT NOT NULL,
                paymentMethod TEXT NOT NULL,
                description TEXT,
                frequency TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
                nextDueDate TEXT NOT NULL,
                isActive BOOLEAN DEFAULT 1,
                lastProcessed TEXT,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // NEW: Create bills table
        db.execSync(`
            CREATE TABLE bills (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                amount REAL NOT NULL,
                category TEXT NOT NULL,
                dueDate TEXT NOT NULL, -- Day of month (1-31) for monthly bills
                frequency TEXT NOT NULL DEFAULT 'monthly', -- 'monthly', 'quarterly', 'yearly'
                isRecurring BOOLEAN DEFAULT 1,
                reminderDays INTEGER DEFAULT 3, -- Days before due date to remind
                lastPaidDate TEXT,
                isPaid BOOLEAN DEFAULT 0,
                notes TEXT,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // NEW: Create expense suggestions table (for smart categorization)
        db.execSync(`
            CREATE TABLE expense_suggestions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                description TEXT NOT NULL,
                suggestedCategory TEXT NOT NULL,
                confidence REAL DEFAULT 1.0, -- 0.0 to 1.0
                usageCount INTEGER DEFAULT 1,
                lastUsed TEXT DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(description, suggestedCategory)
            );
        `);

        // Insert default categories
        const defaultCategories = [
            'Food', 'Transport', 'Entertainment', 'Shopping', 
            'Bills', 'Healthcare', 'Other', 'Subscriptions', 'Utilities'
        ];

        defaultCategories.forEach(category => {
            db.runSync(
                'INSERT INTO categories (name, isCustom) VALUES (?, ?)',
                [category, 0]
            );
        });

        // Insert sample recurring expenses for demonstration
        const sampleRecurring = [
            { amount: 1200, category: 'Bills', paymentMethod: 'Card', description: 'Rent', frequency: 'monthly', nextDueDate: '2025-10-01' },
            { amount: 9.99, category: 'Subscriptions', paymentMethod: 'Card', description: 'Netflix', frequency: 'monthly', nextDueDate: '2025-09-25' },
            { amount: 100, category: 'Utilities', paymentMethod: 'Card', description: 'Electricity', frequency: 'monthly', nextDueDate: '2025-09-28' },
        ];

        sampleRecurring.forEach(expense => {
            db.runSync(
                'INSERT INTO recurring_expenses (amount, category, paymentMethod, description, frequency, nextDueDate) VALUES (?, ?, ?, ?, ?, ?)',
                [expense.amount, expense.category, expense.paymentMethod, expense.description, expense.frequency, expense.nextDueDate]
            );
        });

        // Insert sample bills
        const sampleBills = [
            { name: 'Internet Bill', amount: 60, category: 'Utilities', dueDate: '15', frequency: 'monthly', reminderDays: 5 },
            { name: 'Phone Bill', amount: 45, category: 'Utilities', dueDate: '25', frequency: 'monthly', reminderDays: 3 },
            { name: 'Insurance', amount: 150, category: 'Bills', dueDate: '1', frequency: 'monthly', reminderDays: 7 },
        ];

        sampleBills.forEach(bill => {
            db.runSync(
                'INSERT INTO bills (name, amount, category, dueDate, frequency, reminderDays) VALUES (?, ?, ?, ?, ?, ?)',
                [bill.name, bill.amount, bill.category, bill.dueDate, bill.frequency, bill.reminderDays]
            );
        });
        
        console.log('Phase 2 database created successfully with sample data');
    } catch (error) {
        console.error('Error recreating database:', error);
    }
};

const initDB = () => {
    try {
        // Create expenses table
        db.execSync(`
            CREATE TABLE IF NOT EXISTS expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                amount REAL NOT NULL,
                date TEXT NOT NULL,
                category TEXT NOT NULL,
                paymentMethod TEXT NOT NULL,
                description TEXT
            );
        `);
        
        // Create categories table
        db.execSync(`
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Check if we need Phase 2 schema (check for new tables)
        try {
            const tables = db.getAllSync("SELECT name FROM sqlite_master WHERE type='table'");
            const tableNames = tables.map(t => t.name);
            
            const hasPhase2Tables = tableNames.includes('recurring_expenses') && 
                                  tableNames.includes('bills') && 
                                  tableNames.includes('expense_suggestions');
            
            if (!hasPhase2Tables) {
                console.log('Phase 2 tables missing, upgrading database...');
                recreateDatabase();
                return;
            }

            // Check if isCustom column exists in categories
            const columns = db.getAllSync("PRAGMA table_info(categories)");
            const hasIsCustom = columns.some(col => col.name === 'isCustom');
            
            if (!hasIsCustom) {
                console.log('Database schema outdated, recreating...');
                recreateDatabase();
                return;
            }
        } catch (error) {
            console.log('Error checking database schema, recreating...', error);
            recreateDatabase();
            return;
        }

        // Create budgets table
        db.execSync(`
            CREATE TABLE IF NOT EXISTS budgets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT NOT NULL,
                amount REAL NOT NULL,
                period TEXT NOT NULL DEFAULT 'monthly',
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(category, period)
            );
        `);

        // Insert default categories if not exists
        const defaultCategories = [
            'Food', 'Transport', 'Entertainment', 'Shopping', 
            'Bills', 'Healthcare', 'Other', 'Subscriptions', 'Utilities'
        ];

        defaultCategories.forEach(category => {
            try {
                db.runSync(
                    'INSERT OR IGNORE INTO categories (name, isCustom) VALUES (?, ?)',
                    [category, 0]
                );
            } catch (_error) {
                console.log(`Category ${category} already exists`);
            }
        });
        
        console.log('Database initialized successfully with Phase 2 support');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
};

// Expense management functions
export const addExpense = (amount, date, category, paymentMethod, description = '') => {
    const result = db.runSync(
        'INSERT INTO expenses (amount, date, category, paymentMethod, description) VALUES (?, ?, ?, ?, ?)',
        [amount, date, category, paymentMethod, description]
    );
    return result.insertId;
};

export const getAllExpenses = () => {
    return db.getAllSync('SELECT * FROM expenses ORDER BY date DESC');
};

export const deleteExpense = (id) => {
    db.runSync('DELETE FROM expenses WHERE id = ?', [id]);
};

// Category management functions
export const addCategory = (name, isCustom = true) => {
    const result = db.runSync(
        'INSERT INTO categories (name, isCustom) VALUES (?, ?)',
        [name, isCustom ? 1 : 0]
    );
    return result.insertId;
};

export const getAllCategories = () => {
    return db.getAllSync('SELECT * FROM categories ORDER BY name');
};

export const deleteCategory = (id) => {
    db.runSync('DELETE FROM categories WHERE id = ?', [id]);
};

// Budget management functions
export const setBudget = (category, amount, period = 'monthly') => {
    const result = db.runSync(
        'INSERT OR REPLACE INTO budgets (category, amount, period) VALUES (?, ?, ?)',
        [category, amount, period]
    );
    return result.insertId;
};

export const getBudget = (category, period = 'monthly') => {
    return db.getFirstSync(
        'SELECT * FROM budgets WHERE category = ? AND period = ?',
        [category, period]
    );
};

export const getAllBudgets = () => {
    return db.getAllSync('SELECT * FROM budgets ORDER BY category');
};

// Helper function to calculate next due date
const calculateNextDue = (frequency) => {
    const now = new Date();
    switch (frequency) {
        case 'daily':
            now.setDate(now.getDate() + 1);
            break;
        case 'weekly':
            now.setDate(now.getDate() + 7);
            break;
        case 'monthly':
            now.setMonth(now.getMonth() + 1);
            break;
        case 'yearly':
            now.setFullYear(now.getFullYear() + 1);
            break;
        default:
            now.setMonth(now.getMonth() + 1); // Default to monthly
    }
    return now.toISOString().split('T')[0]; // Return YYYY-MM-DD format
};

// Recurring Expenses Functions
export const addRecurringExpense = (name, amount, category, frequency, description = '') => {
    const nextDue = calculateNextDue(frequency);
    const result = db.runSync(
        'INSERT INTO recurring_expenses (amount, category, paymentMethod, description, frequency, nextDueDate, isActive) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [amount, category, 'Auto-recurring', `${name} - ${description}`, frequency, nextDue, 1]
    );
    return result.insertId;
};

export const getAllRecurringExpenses = () => {
    // Map the database columns to match our interface
    const results = db.getAllSync('SELECT *, description as name, nextDueDate as nextDue FROM recurring_expenses ORDER BY description');
    return results.map(row => ({
        ...row,
        name: row.description.split(' - ')[0] || row.description, // Extract name from description
        nextDue: row.nextDueDate
    }));
};

export const deleteRecurringExpense = (id) => {
    db.runSync('DELETE FROM recurring_expenses WHERE id = ?', [id]);
};

export const toggleRecurringExpense = (id, isActive) => {
    db.runSync('UPDATE recurring_expenses SET isActive = ? WHERE id = ?', [isActive ? 1 : 0, id]);
};

export const processRecurringExpenses = () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Get all active recurring expenses that are due today or overdue
    const dueExpenses = db.getAllSync(
        'SELECT * FROM recurring_expenses WHERE isActive = 1 AND nextDueDate <= ?',
        [today]
    );
    
    dueExpenses.forEach(expense => {
        // Add the expense to the regular expenses table
        addExpense(expense.amount, today, expense.category, expense.paymentMethod, expense.description);
        
        // Update the next due date
        const nextDue = calculateNextDue(expense.frequency);
        db.runSync('UPDATE recurring_expenses SET nextDueDate = ? WHERE id = ?', [nextDue, expense.id]);
    });
    
    return dueExpenses.length;
};

// Bills Functions
export const addBill = (name, amount, dueDate, category, description = '') => {
    const result = db.runSync(
        'INSERT INTO bills (name, amount, dueDate, category, notes) VALUES (?, ?, ?, ?, ?)',
        [name, amount, dueDate, category, description]
    );
    return result.insertId;
};

export const getAllBills = () => {
    return db.getAllSync('SELECT * FROM bills ORDER BY dueDate');
};

export const markBillAsPaid = (id) => {
    const today = new Date().toISOString().split('T')[0];
    db.runSync('UPDATE bills SET isPaid = 1, lastPaidDate = ? WHERE id = ?', [today, id]);
    
    // Also add it as an expense
    const bill = db.getFirstSync('SELECT * FROM bills WHERE id = ?', [id]);
    if (bill) {
        addExpense(bill.amount, today, bill.category, 'Bill Payment', `${bill.name} - ${bill.notes || 'Bill payment'}`);
    }
};

export const deleteBill = (id) => {
    db.runSync('DELETE FROM bills WHERE id = ?', [id]);
};

// Expense Suggestions Functions
export const addExpenseSuggestion = (description, suggestedCategory, confidence) => {
    const result = db.runSync(
        'INSERT INTO expense_suggestions (description, suggestedCategory, confidence, usageCount) VALUES (?, ?, ?, ?)',
        [description, suggestedCategory, confidence, 1]
    );
    return result.insertId;
};

export const getSuggestionForExpense = (description) => {
    if (!description || description.trim() === '') return null;
    
    const descriptionLower = description.toLowerCase();
    
    // Find suggestions where description contains keywords
    const suggestions = db.getAllSync('SELECT * FROM expense_suggestions ORDER BY confidence DESC, usageCount DESC');
    
    for (const suggestion of suggestions) {
        const suggestionDesc = suggestion.description.toLowerCase();
        if (descriptionLower.includes(suggestionDesc) || suggestionDesc.includes(descriptionLower)) {
            // Increment usage count
            db.runSync('UPDATE expense_suggestions SET usageCount = usageCount + 1, lastUsed = ? WHERE id = ?', [new Date().toISOString(), suggestion.id]);
            return suggestion.suggestedCategory;
        }
    }
    
    return null;
};

export const getAllExpenseSuggestions = () => {
    return db.getAllSync('SELECT * FROM expense_suggestions ORDER BY usageCount DESC, confidence DESC');
};

export const deleteExpenseSuggestion = (id) => {
    db.runSync('DELETE FROM expense_suggestions WHERE id = ?', [id]);
};

// Utility function for sample data generation
export const generateSampleData = () => {
    // Add some sample expenses
    const sampleExpenses = [
        { amount: 25.50, date: '2024-01-15', category: 'Food', paymentMethod: 'Card', description: 'Lunch at restaurant' },
        { amount: 150.00, date: '2024-01-14', category: 'Shopping', paymentMethod: 'Card', description: 'Clothing purchase' },
        { amount: 8.99, date: '2024-01-13', category: 'Transport', paymentMethod: 'Cash', description: 'Bus fare' },
    ];

    sampleExpenses.forEach(expense => {
        addExpense(expense.amount, expense.date, expense.category, expense.paymentMethod, expense.description);
    });

    console.log('Sample data generated successfully');
};

export { db, initDB, recreateDatabase };
