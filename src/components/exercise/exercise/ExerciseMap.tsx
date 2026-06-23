import { MyTheme } from '@/types/theme';
import { useTheme } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

interface ExerciseMapProps {
    location: { latitude: number; longitude: number } | null;
    segments: { coords: { latitude: number; longitude: number }[]; pace: number }[];
    startPoint: { latitude: number; longitude: number } | undefined;
    mapRef: React.RefObject<MapView | null>
}

export const ExerciseMap: React.FC<ExerciseMapProps> = (props) => {
    const theme = useTheme() as MyTheme;

    const styles = StyleSheet.create({
        mapGradient: {
            position: 'absolute',
            bottom: 0,
            height: 150, // controls softness of transition
            width: '100%',
        },
    })

    return (
        <>
            <MapView
                ref={props.mapRef}
                style={{ width: '100%', height: '100%' }}
                followsUserLocation
                showsUserLocation
                region={{
                    latitude: props.location?.latitude || 0,
                    longitude: props.location?.longitude || 0,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                }}
            >
                {props.segments.map((seg, idx) => (
                    <Polyline
                        key={idx}
                        coordinates={seg.coords}
                        strokeColor={"#2e8fcc"}
                        strokeWidth={4}
                    />
                ))}
                {props.startPoint && <Marker coordinate={props.startPoint} title="Start" pinColor="green" />}
            </MapView>

            {/* Gradient transition */}
            <LinearGradient
                colors={['transparent', theme.colors.background]}
                style={styles.mapGradient}
                locations={[0, 1]}
                pointerEvents="none"
            />
        </>
    );
}
