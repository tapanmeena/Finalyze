import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { db } from './database';

const ExpenseLogger = () => {
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState('');
    const [category, setCategory] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [description, setDescription] = useState('');

    const logExpense = () => {
        db.transaction(tx => {
            tx.executeSql(
                'INSERT INTO expenses (amount, date, category, paymentMethod, description) VALUES (?, ?, ?, ?, ?)',
                [amount, date, category, paymentMethod, description],
                () => { console.log('Expense logged successfully'); },
                (_, error) => { console.log('Error logging expense:', error); }
            );
        });
    };

    return (
        <View style={styles.container}>
            <Text>Log Expense</Text>
            <TextInput placeholder="Amount" value={amount} onChangeText={setAmount} style={styles.input} />
            <TextInput placeholder="Date" value={date} onChangeText={setDate} style={styles.input} />
            <TextInput placeholder="Category" value={category} onChangeText={setCategory} style={styles.input} />
            <TextInput placeholder="Payment Method" value={paymentMethod} onChangeText={setPaymentMethod} style={styles.input} />
            <TextInput placeholder="Description" value={description} onChangeText={setDescription} style={styles.input} />
            <Button title="Log Expense" onPress={logExpense} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        marginBottom: 10,
        padding: 10,
    },
});

export default ExpenseLogger;