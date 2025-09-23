import * as SQLite from 'expo-sqlite';

// Open the database
const db = SQLite.openDatabaseSync('expenses.db');

const recreateDatabase = () => {
    try {
        console.log('Recreating database with updated schema...');
        
        // Drop existing tables
        db.execSync('DROP TABLE IF EXISTS budgets');
        db.execSync('DROP TABLE IF EXISTS categories');
        db.execSync('DROP TABLE IF EXISTS expenses');
        
        // Create expenses table
        db.execSync(`
            CREATE TABLE expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                amount REAL NOT NULL,
                date TEXT NOT NULL,
                category TEXT NOT NULL,
                paymentMethod TEXT NOT NULL,
                description TEXT
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

        // Insert default categories
        const defaultCategories = [
            'Food', 'Transport', 'Entertainment', 'Shopping', 
            'Bills', 'Healthcare', 'Other'
        ];

        defaultCategories.forEach(category => {
            db.runSync(
                'INSERT INTO categories (name, isCustom) VALUES (?, ?)',
                [category, 0]
            );
        });
        
        console.log('Database recreated successfully');
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

        // Check if isCustom column exists, if not recreate database
        try {
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
            'Bills', 'Healthcare', 'Other'
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
        
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
};

export { db, initDB, recreateDatabase };
