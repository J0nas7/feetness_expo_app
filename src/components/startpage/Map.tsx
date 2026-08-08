import { createStartpageStyles } from '@/styles/modules/StartpageStyles';
import { MyTheme } from '@/types/theme';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView from 'react-native-maps';

interface MapProps {
    theme: MyTheme;
    location: Location.LocationObject | null
}

export const Map: React.FC<MapProps> = (props) => {
    const styles = createStartpageStyles(props.theme);
    const mapRef = React.useRef<MapView>(null);
    const [mapReady, setMapReady] = React.useState(false);
    const userLatitude = props.location?.coords.latitude;
    const userLongitude = props.location?.coords.longitude;
    const userRegion = userLatitude !== undefined && userLongitude !== undefined ? {
        latitude: userLatitude,
        longitude: userLongitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    } : null;

    React.useEffect(() => {
        if (mapReady && userLatitude !== undefined && userLongitude !== undefined) {
            mapRef.current?.animateToRegion({
                latitude: userLatitude,
                longitude: userLongitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }, 500);
        }
    }, [mapReady, userLatitude, userLongitude]);

    return (
        <View style={styles.mapContainer}>
            <MapView
                ref={mapRef}
                style={[
                    StyleSheet.absoluteFill,
                    {
                        backgroundColor: props.theme.colors.border,
                        opacity: 0.98,
                    }
                ]}
                showsUserLocation
                followsUserLocation
                onMapReady={() => setMapReady(true)}
                initialRegion={userRegion ?? {
                    latitude: 55.6761,
                    longitude: 12.5683,
                    latitudeDelta: 0.25,
                    longitudeDelta: 0.25,
                }}
            />

            {/* Gradient transition */}
            <LinearGradient
                colors={['transparent', props.theme.colors.background]}
                style={styles.mapGradient}
                locations={[0, 1]}
                pointerEvents="none"
            />
        </View>
    )
}
