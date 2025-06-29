import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';

const Splash = () => {
    const fadeAnim = useRef(new Animated.Value(0)).current; // Start invisible

    useEffect(() => {
        // Fade in
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();

        // Fade out after 2.5s (before 3s total)
        setTimeout(() => {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }).start();
        }, 2500);
    }, [fadeAnim]);

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <View style={styles.logoContainer}>
                <Image
                    source={require('../assets/images/logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </View>
            <Text style={styles.title}>PackingList Pro</Text>
            <Text style={styles.subtitle}>
                Simplifying Import & Export Operations
            </Text>
        </Animated.View>
    );
};

export default Splash;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#012B4B', // deep navy for shipping theme
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    logoContainer: {
        marginBottom: 20,
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 20,
        elevation: 10,
    },
    logo: {
        width: 100,
        height: 100,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#F8C630', // gold/yellow accent for professionalism
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#E0E0E0',
        textAlign: 'center',
    },
});
