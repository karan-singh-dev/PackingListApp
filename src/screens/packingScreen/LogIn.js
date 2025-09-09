import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../../redux/slices/LoginSlice';
import { setUserInfo } from '../../redux/slices/UserSlice';
import API from '../../components/API';
import LinearGradient from 'react-native-linear-gradient';

const LogIn = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispatch = useDispatch();
  const { loading, error: reduxError } = useSelector((state) => state.login);

  const handleLogin = async () => {
    setLocalError('');

    if (!username.trim() || !password.trim()) {
      setLocalError('Username and password are required.');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const resultAction = await dispatch(
        loginUser({ username: username.trim(), password: password.trim() })
      );

      if (loginUser.fulfilled.match(resultAction)) {
        API.get('/api/user/users/me')
          .then((response) => {
            dispatch(setUserInfo(response.data));
          })
          .catch(() => {
            setLocalError('Failed to fetch user profile.');
          });
      } else {
        setLocalError(resultAction.payload?.message || 'Login failed.');
      }
    } catch (error) {
      setLocalError('Unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LinearGradient
      colors={['#1E3C72', '#2A5298']}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* App Branding */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/logo.png')} // 🔹 Place your logo in assets
            style={styles.logo}
          />
          <Text style={styles.appName}>SKG</Text>
          <Text style={styles.tagline}>NOW EXPORT IN YOUR POCKET</Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="Username"
            autoCapitalize="none"
            placeholderTextColor="#888"
            value={username}
            onChangeText={setUsername}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
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
              ( loading || isSubmitting) && { opacity: 0.6 },
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
    </LinearGradient>
  );
};

export default LogIn;

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
    // marginBottom: 15,
    resizeMode: 'contain',
  },
  appName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
  },
  tagline: {
    fontSize: 14,
    color: '#e0e0e0',
    marginTop: 4,
  },
  card: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  input: {
    height: 48,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#1E3C72',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
});
