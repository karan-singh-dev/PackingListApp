import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useDispatch } from 'react-redux';
import { setToken } from '../../redux/LoginSlice';
// import { setToken } from '../../redux/ClientDataSlice';

const LogIn = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const dispatch = useDispatch();
    const handleLogin = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        setError('');

        if (!email.trim() || !password.trim()) {
            setError('Email and password are required.');

        } else if (!emailRegex.test(email.trim())) {
            setError('Please enter a valid email address.');

        } else {
            dispatch(setToken('kjdkksdkadkkada'));
            console.log('Logging in with:', email, password);
            setError('');
        }

    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.card}>
                <Text style={styles.title}>Welcome Back 👋</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#aaa"
                    value={email}
                    onChangeText={setEmail}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#aaa"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Login</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

export default LogIn;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        marginBottom: 30,
    },
    input: {
        height: 50,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#333',
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#4A90E2',
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '500',
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginBottom: 10,
    },
});
