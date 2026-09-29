import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet
} from 'react-native';
import MapView, { Marker, Polygon, Callout } from 'react-native-maps';
import { MapPin, Building2, Flame, Layers } from 'lucide-react-native';
import { colors } from '../../theme/colors';

// Helper to generate polygon around ward center
function computeWardPolygon(lat, lng, radiusKm = 2.5) {
  const points = [];
  const numPoints = 12;
  const latRadius = radiusKm / 111.0;
  const lngRadius = radiusKm / (111.0 * Math.cos((lat * Math.PI) / 180));
  const multipliers = [1.02, 1.14, 1.08, 0.94, 1.10, 1.20, 1.12, 0.92, 1.04, 1.16, 1.06, 0.95];

  for (let i = 0; i < numPoints; i++) {
    const angle = (i * 2 * Math.PI) / numPoints;
    const factor = multipliers[i % multipliers.length];
    const pLat = lat + Math.sin(angle) * latRadius * factor;
    const pLng = lng + Math.cos(angle) * lngRadius * factor;
    points.push({ latitude: pLat, longitude: pLng });
  }
  return points;
}

export default function GovWardMap({
  region,
  office,
  hotspots = [],
  selectedHotspot = null,
  onSelectHotspot = () => {}
}) {
  const defaultLat = region?.latitude ? parseFloat(region.latitude) : 18.5158;
  const defaultLng = region?.longitude ? parseFloat(region.longitude) : 73.7711;

  const wardPolygon = computeWardPolygon(defaultLat, defaultLng, 2.2);

  const initialRegion = {
    latitude: defaultLat,
    longitude: defaultLng,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Building2 size={18} color={colors.saffron} />
          <Text style={styles.headerTitle}>Ward Delimitation & Hotspot Map</Text>
        </View>
        <Text style={styles.headerSubtitle}>{region?.name || 'Local Ward'}</Text>
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
          provider="google"
        >
          {/* Ward Administrative Delimitation Polygon */}
          <Polygon
            coordinates={wardPolygon}
            strokeColor="#2563EB"
            fillColor="rgba(37, 99, 235, 0.12)"
            strokeWidth={2}
          />

          {/* Municipal Ward Office Marker */}
          {office && (
            <Marker
              coordinate={{
                latitude: parseFloat(office.latitude || defaultLat),
                longitude: parseFloat(office.longitude || defaultLng)
              }}
            >
              <View style={styles.officeMarker}>
                <Text style={{ fontSize: 16 }}>🏛️</Text>
              </View>
              <Callout>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{office.name || 'Ward Office'}</Text>
                  <Text style={styles.calloutSub}>Municipal Administrative HQ</Text>
                </View>
              </Callout>
            </Marker>
          )}

          {/* Hotspot Markers */}
          {hotspots.map((spot, idx) => {
            const isSelected = selectedHotspot?.name === spot.name;
            const spotLat = spot.latitude || (defaultLat + (Math.sin(idx) * 0.015));
            const spotLng = spot.longitude || (defaultLng + (Math.cos(idx) * 0.015));

            return (
              <Marker
                key={spot.name || idx}
                coordinate={{ latitude: spotLat, longitude: spotLng }}
                onPress={() => onSelectHotspot(spot)}
              >
                <View style={[styles.hotspotMarker, isSelected && styles.hotspotMarkerActive]}>
                  <Text style={styles.hotspotText}>{spot.count || spot.demands || '!'}</Text>
                </View>
                <Callout>
                  <View style={styles.callout}>
                    <Text style={styles.calloutTitle}>{spot.name}</Text>
                    <Text style={styles.calloutSub}>Demands: {spot.count || spot.demands || 1}</Text>
                    <Text style={styles.calloutSub}>{spot.category || 'Civic Issue'}</Text>
                  </View>
                </Callout>
              </Marker>
            );
          })}
        </MapView>

        {/* Google Maps Attribution Badge */}
        <View style={styles.attributionBadge}>
          <Text style={styles.attributionText}>Google Maps</Text>
        </View>
      </View>

      {/* Hotspots List Pills */}
      {hotspots.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hotspotPills}>
          {hotspots.map((spot, idx) => {
            const isSelected = selectedHotspot?.name === spot.name;
            return (
              <TouchableOpacity
                key={spot.name || idx}
                onPress={() => onSelectHotspot(spot)}
                style={[styles.spotPill, isSelected && styles.spotPillActive]}
                activeOpacity={0.8}
              >
                <Flame size={12} color={isSelected ? '#FFF' : '#E11D48'} />
                <Text style={[styles.spotPillName, isSelected && styles.spotPillNameActive]}>
                  {spot.name}
                </Text>
                <View style={[styles.spotPillCount, isSelected && styles.spotPillCountActive]}>
                  <Text style={[styles.spotPillCountText, isSelected && styles.spotPillCountTextActive]}>
                    {spot.count || spot.demands || 1}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 16
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF'
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#CBD5E1'
  },
  mapContainer: {
    height: 250,
    position: 'relative'
  },
  map: {
    ...StyleSheet.absoluteFillObject
  },
  officeMarker: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4
  },
  hotspotMarker: {
    backgroundColor: '#E11D48',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFF',
    elevation: 3
  },
  hotspotMarkerActive: {
    backgroundColor: '#9F1239',
    borderColor: '#FEE2E2',
    transform: [{ scale: 1.15 }]
  },
  hotspotText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800'
  },
  callout: {
    padding: 6,
    width: 140
  },
  calloutTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A'
  },
  calloutSub: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2
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
  hotspotPills: {
    padding: 10,
    gap: 8
  },
  spotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    gap: 6
  },
  spotPillActive: {
    backgroundColor: '#E11D48',
    borderColor: '#E11D48'
  },
  spotPillName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9F1239'
  },
  spotPillNameActive: {
    color: '#FFF'
  },
  spotPillCount: {
    backgroundColor: '#FFE4E6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10
  },
  spotPillCountActive: {
    backgroundColor: '#FFF'
  },
  spotPillCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9F1239'
  },
  spotPillCountTextActive: {
    color: '#E11D48'
  }
});
