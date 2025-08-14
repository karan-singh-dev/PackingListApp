import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient'; // install if not already

const Splash = () => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();

        setTimeout(() => {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }).start();
        }, 2500);
    }, [fadeAnim]);

    return (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
            <LinearGradient
                colors={['#0072BC', '#004080']}
                style={styles.container}
            >
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../assets/images/logo.png')} // your new icon (1024x1024 recommended)
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>
                <Text style={styles.title}>GlobePact</Text>
                <Text style={styles.subtitle}>
                    Simplifying Global Trade
                </Text>
            </LinearGradient>
        </Animated.View>
    );
};

export default Splash;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    logoContainer: {
        marginBottom: 20,
        padding: 15,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    logo: {
        width: 140,
        height: 140,
    },
    title: {
        fontSize: 30,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#B0D9F6',
        textAlign: 'center',
    },
});
