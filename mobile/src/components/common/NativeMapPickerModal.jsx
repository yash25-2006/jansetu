import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { reverseGeocodeCoords } from '../../utils/reverseGeocoder';
import { COLORS } from '../../theme/colors';

export default function NativeMapPickerModal({
  isOpen,
  initialCoords = null,
  onLocationSelected,
  onClose
}) {
  if (!isOpen) return null;

  const defaultLat = initialCoords?.latitude || 18.5204;
  const defaultLng = initialCoords?.longitude || 73.8567;

  const [region, setRegion] = useState({
    latitude: defaultLat,
    longitude: defaultLng,
    latitudeDelta: 0.008,
    longitudeDelta: 0.008
  });

  const [markerCoord, setMarkerCoord] = useState({
    latitude: defaultLat,
    longitude: defaultLng
  });

  const [resolvedAddress, setResolvedAddress] = useState('Resolving location details...');
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    handleCoordChange(defaultLat, defaultLng);
  }, []);

  const handleCoordChange = async (lat, lng) => {
    setMarkerCoord({ latitude: lat, longitude: lng });
    setIsResolving(true);
    try {
      const res = await reverseGeocodeCoords(lat, lng);
      setResolvedAddress(res.formattedAddress);
    } catch (e) {
      setResolvedAddress(`Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setIsResolving(false);
    }
  };

  const handleConfirm = () => {
    if (onLocationSelected) {
      onLocationSelected({
        latitude: markerCoord.latitude,
        longitude: markerCoord.longitude,
        address: resolvedAddress
      });
    }
    onClose();
  };

  return (
    <Modal visible={isOpen} transparent={false} animationType="slide">
      <View style={styles.container}>
        {/* Header Bar */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>📍 Pin Problem Location</Text>
            <Text style={styles.headerSubtitle}>Drag or tap on map to mark exact issue spot</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Map Container */}
        <View style={styles.mapContainer}>
          {MapView ? (
            <MapView
              provider={PROVIDER_GOOGLE}
              mapType="hybrid"
              style={StyleSheet.absoluteFillObject}
              initialRegion={region}
              onPress={(e) => {
                if (e.nativeEvent && e.nativeEvent.coordinate) {
                  handleCoordChange(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude);
                }
              }}
            >
              <Marker
                draggable
                coordinate={markerCoord}
                title="Problem Location"
                description={resolvedAddress}
                pinColor="#DC2626"
                onDragEnd={(e) => {
                  if (e.nativeEvent && e.nativeEvent.coordinate) {
                    handleCoordChange(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude);
                  }
                }}
              />
            </MapView>
          ) : (
            <View style={styles.mapFallback}>
              <Text style={styles.mapFallbackText}>Interactive Map Active</Text>
              <Text style={styles.mapFallbackCoords}>
                Lat: {markerCoord.latitude.toFixed(5)}, Lng: {markerCoord.longitude.toFixed(5)}
              </Text>
            </View>
          )}

          {/* Clean Google Maps Attribution Badge */}
          <View style={styles.attributionBadge}>
            <Text style={styles.attributionText}>Google Maps</Text>
          </View>

          {/* Floating Instructions Banner */}
          <View style={styles.instructionsBanner}>
            <Text style={styles.instructionsText}>
              📍 Tap anywhere to place marker or drag pin
            </Text>
          </View>
        </View>

        {/* Resolved Address & Actions */}
        <View style={styles.footerCard}>
          <View style={styles.addressBox}>
            <Text style={styles.addressLabel}>SELECTED PROBLEM LOCATION</Text>
            {isResolving ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 4 }} />
            ) : (
              <Text style={styles.addressText} numberOfLines={2}>
                {resolvedAddress}
              </Text>
            )}
            <Text style={styles.coordText}>
              Lat: {markerCoord.latitude.toFixed(5)}, Lng: {markerCoord.longitude.toFixed(5)}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={handleConfirm}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmBtnText}>✓ Confirm Problem Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#002B49'
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 18,
    paddingBottom: 14,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800'
  },
  headerSubtitle: {
    color: '#CBD5E1',
    fontSize: 11,
    marginTop: 2
  },
  closeBtn: {
    padding: 6
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold'
  },
  mapContainer: {
    flex: 1,
    position: 'relative'
  },
  mapFallback: {
    flex: 1,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center'
  },
  mapFallbackText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold'
  },
  mapFallbackCoords: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4
  },
  attributionBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)'
  },
  attributionText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155'
  },
  instructionsBanner: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20
  },
  instructionsText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold'
  },
  footerCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5
  },
  addressBox: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12
  },
  addressLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#9F1239',
    letterSpacing: 0.5,
    marginBottom: 4
  },
  addressText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#881337',
    lineHeight: 18
  },
  coordText: {
    fontSize: 10,
    color: '#BE123C',
    marginTop: 4,
    fontFamily: 'monospace'
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center'
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14
  }
});
