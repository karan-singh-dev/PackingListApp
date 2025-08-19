import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../../redux/slices/LoginSlice';
import { setUserInfo } from '../../redux/slices/UserSlice';
import API from '../../components/API';

const LogIn = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState(null); // keep user id state

  const dispatch = useDispatch();
  const { loading, error: reduxError } = useSelector((state) => state.login);

  // ✅ Call WebSocket hook at top level, it will auto-run when userId changes

  


  const handleLogin = () => {
    setLocalError('');

    if (!username.trim() || !password.trim()) {
      setLocalError('Username and password are required.');
      return;
    }

    submitLogin();
  };

  const submitLogin = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const resultAction = await dispatch(loginUser({ username, password }));

      if (loginUser.fulfilled.match(resultAction)) {
        // fetch user info
        API.get('/api/user/users/me')
          .then((response) => {
            console.log(response.data);
            dispatch(setUserInfo(response.data));
            setUserId(response.data.id); // ✅ triggers WebSocket hook
          })
          .catch((error) => {
            console.error('Failed to fetch user info:', error);
            setLocalError('Failed to fetch user profile.');
          });

        console.log('Login success:', resultAction.payload);
      } else {
        console.error('Login failed:', resultAction.payload);
        setLocalError(resultAction.payload?.message || 'Login failed.');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setLocalError('Unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
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
          placeholder="Username"
          autoCapitalize="none"
          placeholderTextColor="#aaa"
          value={username}
          onChangeText={setUsername}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#aaa"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {(localError || reduxError) && (
          <Text style={styles.errorText}>{localError || reduxError}</Text>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            (!username || !password || loading || isSubmitting) && { opacity: 0.6 },
          ]}
          onPress={handleLogin}
          disabled={!username || !password || loading || isSubmitting}
        >
          {loading || isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
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
