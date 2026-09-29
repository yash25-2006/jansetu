import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { Globe, MapPin, TrendingUp, Sparkles, Building2, Flame } from 'lucide-react-native';
import { colors } from '../../theme/colors';

import rawHotspots from '../../../../data/sample/state_hotspots.json';

export const NATIONAL_STATE_HOTSPOTS = rawHotspots.map((h) => ({
  ...h,
  latitude: h.center ? h.center[0] : h.latitude,
  longitude: h.center ? h.center[1] : h.longitude
}));

export default function GovIndiaNationalMap({
  selectedState = null,
  onSelectState = () => {},
  countsByState = {}
}) {
  const [selectedSpot, setSelectedSpot] = useState(
    NATIONAL_STATE_HOTSPOTS.find((s) => s.name === selectedState) || null
  );

  const initialRegion = {
    latitude: 21.5937,
    longitude: 78.9629,
    latitudeDelta: 16.0,
    longitudeDelta: 16.0
  };

  const handleMarkerPress = (spot) => {
    setSelectedSpot(spot);
    onSelectState(spot.name);
  };

  return (
    <View style={styles.container}>
      {/* Map Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Globe size={18} color={colors.saffron} />
          <Text style={styles.headerTitle}>National Geospatial Demand Hub</Text>
        </View>
        <Text style={styles.headerSubtitle}>Across India</Text>
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
          provider="google"
          showsCompass={true}
        >
          {NATIONAL_STATE_HOTSPOTS.map((spot) => {
            const dynamicCount = (countsByState[spot.name] || 0) + spot.baseDemand;
            const isSelected = (selectedSpot?.name === spot.name) || (selectedState === spot.name);

            return (
              <Marker
                key={spot.code}
                coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
                onPress={() => handleMarkerPress(spot)}
              >
                <View style={[styles.markerPin, isSelected && styles.markerPinActive]}>
                  <Text style={styles.markerText}>{dynamicCount}</Text>
                </View>
                <Callout>
                  <View style={styles.callout}>
                    <Text style={styles.calloutTitle}>{spot.name}</Text>
                    <Text style={styles.calloutSub}>Demands: {dynamicCount}</Text>
                    <Text style={styles.calloutSub}>Top: {spot.topCategory}</Text>
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

      {/* State Quick Switcher Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statePills}>
        {NATIONAL_STATE_HOTSPOTS.map((spot) => {
          const isSelected = (selectedSpot?.name === spot.name) || (selectedState === spot.name);
          const count = (countsByState[spot.name] || 0) + spot.baseDemand;

          return (
            <TouchableOpacity
              key={spot.code}
              onPress={() => handleMarkerPress(spot)}
              style={[styles.statePill, isSelected && styles.statePillActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.statePillName, isSelected && styles.statePillNameActive]}>
                {spot.name}
              </Text>
              <View style={[styles.statePillCount, isSelected && styles.statePillCountActive]}>
                <Text style={[styles.statePillCountText, isSelected && styles.statePillCountTextActive]}>
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Selected State Detail Card */}
      {selectedSpot && (
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View>
              <Text style={styles.detailStateName}>{selectedSpot.name}</Text>
              <Text style={styles.detailCapital}>Capital: {selectedSpot.capital}</Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>{selectedSpot.level}</Text>
            </View>
          </View>

          <View style={styles.detailGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Top Category</Text>
              <Text style={styles.detailValue}>{selectedSpot.topCategory}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Priority Score</Text>
              <Text style={[styles.detailValue, { color: colors.saffron }]}>
                {selectedSpot.priorityScore} / 100
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Infra Gap</Text>
              <Text style={styles.detailValue}>{selectedSpot.infraGap}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Population Reach</Text>
              <Text style={styles.detailValue}>{selectedSpot.popImpact}</Text>
            </View>
          </View>
        </View>
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
    height: 260,
    position: 'relative'
  },
  map: {
    ...StyleSheet.absoluteFillObject
  },
  markerPin: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3
  },
  markerPinActive: {
    backgroundColor: '#E11D48',
    borderColor: '#FEE2E2',
    transform: [{ scale: 1.15 }]
  },
  markerText: {
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
  statePills: {
    padding: 10,
    gap: 8
  },
  statePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    gap: 6
  },
  statePillActive: {
    backgroundColor: colors.primary
  },
  statePillName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155'
  },
  statePillNameActive: {
    color: '#FFF'
  },
  statePillCount: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10
  },
  statePillCountActive: {
    backgroundColor: colors.saffron
  },
  statePillCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F172A'
  },
  statePillCountTextActive: {
    color: '#002B49'
  },
  detailCard: {
    margin: 12,
    marginTop: 4,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 10
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  detailStateName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A'
  },
  detailCapital: {
    fontSize: 11,
    color: '#64748B'
  },
  levelBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E40AF'
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  detailItem: {
    width: '48%',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 8
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B'
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2
  }
});
