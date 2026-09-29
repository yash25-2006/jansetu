import React, { useState, useEffect, useRef } from 'react';
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

import rawDistricts from '../../../../data/sample/state_districts.json';
import rawBoundaries from '../../../../data/sample/state_boundaries.json';

export const STATE_DISTRICTS_DATA = Object.fromEntries(
  Object.entries(rawDistricts).map(([state, list]) => [
    state,
    list.map((d) => ({
      ...d,
      latitude: d.coords ? d.coords[0] : d.latitude,
      longitude: d.coords ? d.coords[1] : d.longitude
    }))
  ])
);

const STATE_CENTERS = Object.fromEntries(
  Object.entries(rawBoundaries).map(([state, data]) => [
    state,
    {
      latitude: data.center ? data.center[0] : 19.7515,
      longitude: data.center ? data.center[1] : 75.7139,
      latitudeDelta: 5.5,
      longitudeDelta: 5.5
    }
  ])
);

export default function GovStateDistrictMap({
  stateName = 'Maharashtra',
  selectedDistrict = 'All',
  onSelectDistrict = () => {},
  requests = []
}) {
  const mapRef = useRef(null);
  const districts = STATE_DISTRICTS_DATA[stateName] || STATE_DISTRICTS_DATA['Maharashtra'];
  const region = STATE_CENTERS[stateName] || STATE_CENTERS['Maharashtra'];

  const getDistrictLiveCount = (dName) => {
    const liveMatch = requests.filter(
      (r) => (r.district || '').toLowerCase() === dName.toLowerCase()
    ).length;
    const base = districts.find((d) => d.name === dName)?.baseCount || 0;
    return liveMatch + base;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MapPin size={18} color={colors.saffron} />
          <Text style={styles.headerTitle}>{stateName} District Demands</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {selectedDistrict === 'All' ? 'All Districts' : selectedDistrict}
        </Text>
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          provider="google"
        >
          {districts.map((d) => {
            const count = getDistrictLiveCount(d.name);
            const isSelected = selectedDistrict === d.name;

            return (
              <Marker
                key={d.name}
                coordinate={{ latitude: d.latitude, longitude: d.longitude }}
                onPress={() => onSelectDistrict(d.name)}
              >
                <View style={[styles.markerPin, isSelected && styles.markerPinActive]}>
                  <Text style={styles.markerText}>{count}</Text>
                </View>
                <Callout>
                  <View style={styles.callout}>
                    <Text style={styles.calloutTitle}>{d.name}</Text>
                    <Text style={styles.calloutSub}>Demands: {count}</Text>
                    <Text style={styles.calloutSub}>{d.topCategory}</Text>
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

      {/* District Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPills}>
        <TouchableOpacity
          onPress={() => onSelectDistrict('All')}
          style={[styles.pill, selectedDistrict === 'All' && styles.pillActive]}
          activeOpacity={0.8}
        >
          <Text style={[styles.pillText, selectedDistrict === 'All' && styles.pillTextActive]}>
            All Districts
          </Text>
        </TouchableOpacity>

        {districts.map((d) => {
          const isSelected = selectedDistrict === d.name;
          const count = getDistrictLiveCount(d.name);

          return (
            <TouchableOpacity
              key={d.name}
              onPress={() => onSelectDistrict(d.name)}
              style={[styles.pill, isSelected && styles.pillActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>{d.name}</Text>
              <View style={[styles.pillCount, isSelected && styles.pillCountActive]}>
                <Text style={[styles.pillCountText, isSelected && styles.pillCountTextActive]}>
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
  markerPin: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFF',
    elevation: 3
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
    width: 130
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
  filterPills: {
    padding: 10,
    gap: 8
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    gap: 6
  },
  pillActive: {
    backgroundColor: colors.primary
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155'
  },
  pillTextActive: {
    color: '#FFF'
  },
  pillCount: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10
  },
  pillCountActive: {
    backgroundColor: colors.saffron
  },
  pillCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F172A'
  },
  pillCountTextActive: {
    color: '#002B49'
  }
});
