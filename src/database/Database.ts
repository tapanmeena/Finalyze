import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('expenses.db');

const init = () => {
    db.transaction(tx => {
        tx.executeSql(
            'CREATE TABLE IF NOT EXISTS expenses (id INTEGER PRIMARY KEY NOT NULL, amount REAL NOT NULL, date TEXT NOT NULL, category TEXT NOT NULL, paymentMethod TEXT NOT NULL, description TEXT);
        ');
    });
};

export const insertExpense = (amount, date, category, paymentMethod, description) => {
    db.transaction(tx => {
        tx.executeSql(
            'INSERT INTO expenses (amount, date, category, paymentMethod, description) VALUES (?, ?, ?, ?, ?);',
            [amount, date, category, paymentMethod, description]
        );
    });
};

export const fetchExpenses = (callback) => {
    db.transaction(tx => {
        tx.executeSql(
            'SELECT * FROM expenses;',
            [],
            (_, result) => {
                callback(result.rows._array);
            }
        );
    });
};

export default { init, insertExpense, fetchExpenses };