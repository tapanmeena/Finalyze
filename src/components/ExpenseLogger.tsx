import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';
import Database from '../database/Database';

const ExpenseLogger = () => {
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState('');
    const [category, setCategory] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = () => {
        Database.insertExpense(parseFloat(amount), date, category, paymentMethod, description);
        // Clear inputs after submission
        setAmount('');
        setDate('');
        setCategory('');
        setPaymentMethod('');
        setDescription('');
    };

    return (
        <View style={styles.container}>
            <TextInput placeholder="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" />
            <TextInput placeholder="Date" value={date} onChangeText={setDate} />
            <TextInput placeholder="Category" value={category} onChangeText={setCategory} />
            <TextInput placeholder="Payment Method" value={paymentMethod} onChangeText={setPaymentMethod} />
            <TextInput placeholder="Description" value={description} onChangeText={setDescription} />
            <Button title="Log Expense" onPress={handleSubmit} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
});

export default ExpenseLogger;