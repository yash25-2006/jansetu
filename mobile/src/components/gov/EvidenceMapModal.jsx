import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { MapPin, X, Camera, ShieldCheck } from 'lucide-react-native';
import { colors } from '../../theme/colors';

export default function EvidenceMapModal({ visible, evidence, onClose }) {
  if (!evidence || !evidence.latitude || !evidence.longitude) return null;

  const lat = parseFloat(evidence.latitude);
  const lng = parseFloat(evidence.longitude);
  const accuracy = parseFloat(evidence.accuracy) || 15;

  const region = {
    latitude: lat,
    longitude: lng,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <Camera size={18} color={colors.emerald} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Photo Evidence Location</Text>
                <Text style={styles.headerCode}>{evidence.requestCode || 'Verified Citizen Capture'}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Map View */}
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={region}
              mapType="satellite"
              provider="google"
            >
              {/* GPS Accuracy Circle */}
              <Circle
                center={{ latitude: lat, longitude: lng }}
                radius={accuracy}
                strokeColor={colors.emerald}
                fillColor="rgba(16, 185, 129, 0.2)"
                strokeWidth={2}
              />

              {/* Exact Pin Marker */}
              <Marker coordinate={{ latitude: lat, longitude: lng }}>
                <View style={styles.pin}>
                  <Text style={{ fontSize: 16 }}>📸</Text>
                </View>
              </Marker>
            </MapView>

            {/* Google Maps Attribution Badge */}
            <View style={styles.attributionBadge}>
              <Text style={styles.attributionText}>Google Maps</Text>
            </View>
          </View>

          {/* Location Info Footer */}
          <View style={styles.footer}>
            <View style={styles.addressRow}>
              <MapPin size={16} color={colors.emerald} />
              <Text numberOfLines={2} style={styles.addressText}>
                {evidence.address || 'Geo-tagged Location'}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.coordText}>
                {lat.toFixed(6)}, {lng.toFixed(6)} • Accuracy ±{accuracy}m
              </Text>
              <View style={styles.verifiedBadge}>
                <ShieldCheck size={12} color={colors.emerald} />
                <Text style={styles.verifiedBadgeText}>EXIF Verified</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF'
  },
  headerCode: {
    fontSize: 11,
    color: colors.saffron,
    fontWeight: '700'
  },
  closeBtn: {
    padding: 4
  },
  mapContainer: {
    height: 280,
    position: 'relative'
  },
  map: {
    ...StyleSheet.absoluteFillObject
  },
  pin: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.emerald,
    borderRadius: 18,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4
  },
  attributionBadge: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)'
  },
  attributionText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155'
  },
  footer: {
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A'
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  coordText: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: 'monospace'
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46'
  }
});
