import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SECTIONS = [
  { icon: '🕐', label: 'History' },
  { icon: '▶️', label: 'Your videos' },
  { icon: '🔽', label: 'Downloads' },
  { icon: '⏰', label: 'Watch later' },
  { icon: '👍', label: 'Liked videos' },
  { icon: '📋', label: 'Playlists' },
];

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.heading}>Library</Text>
      {SECTIONS.map(s => (
        <TouchableOpacity key={s.label} style={styles.row} activeOpacity={0.7}>
          <Text style={styles.icon}>{s.icon}</Text>
          <Text style={styles.label}>{s.label}</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    paddingHorizontal: 16,
  },
  heading: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginVertical: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#222',
    gap: 14,
  },
  icon: {
    fontSize: 22,
    width: 30,
    textAlign: 'center',
  },
  label: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  chevron: {
    color: '#666',
    fontSize: 22,
  },
});
