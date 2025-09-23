import * as SQLite from 'expo-sqlite';

// Open the database
const db = SQLite.openDatabaseSync('expenses.db');

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
                name TEXT NOT NULL UNIQUE
            );
        `);
        
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
};

export { db, initDB };
