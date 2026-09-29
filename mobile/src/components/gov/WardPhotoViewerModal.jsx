import React from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { X } from 'lucide-react-native';

export default function WardPhotoViewerModal({ visible, photoViewer, onClose }) {
  if (!photoViewer) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.metaRow}>
            <View style={styles.codeBadge}>
              <Text style={styles.codeBadgeText}>{photoViewer.requestCode || 'EVIDENCE'}</Text>
            </View>
            <Text numberOfLines={1} style={styles.titleText}>
              {photoViewer.title || 'Citizen Photo Evidence'}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Image Container */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: photoViewer.url }}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={onClose} style={styles.closeModalBtn}>
            <Text style={styles.closeModalText}>Close Preview</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'space-between',
    padding: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1
  },
  codeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  codeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF'
  },
  titleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
    flex: 1
  },
  closeBtn: {
    padding: 6
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12
  },
  footer: {
    alignItems: 'center',
    marginBottom: 20
  },
  closeModalBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20
  },
  closeModalText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF'
  }
});
