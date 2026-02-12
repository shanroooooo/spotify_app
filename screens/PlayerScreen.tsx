import React from 'react';
import { View, Text, Image, StyleSheet, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const PlayerScreen = () => {
    const navigation = useNavigation();

    const handlePlayPause = () => {
        // Logic to play or pause the track
    };

    const handleSkip = () => {
        // Logic to skip to the next track
    };

    return (
        <View style={styles.container}>
            <Image 
                source={{ uri: 'https://i.pinimg.com/originals/00/00/00/00000000000000000000000000000000.jpg' }} 
                style={styles.albumArt} 
            />
            <Text style={styles.trackTitle}>Track Title</Text>
            <Text style={styles.artistName}>Artist Name</Text>
            <View style={styles.controls}>
                <Button title="Play/Pause" onPress={handlePlayPause} />
                <Button title="Skip" onPress={handleSkip} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    albumArt: {
        width: 200,
        height: 200,
        borderRadius: 10,
        marginBottom: 20,
    },
    trackTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    artistName: {
        fontSize: 18,
        color: 'gray',
    },
    controls: {
        flexDirection: 'row',
        marginTop: 20,
    },
});

export default PlayerScreen;