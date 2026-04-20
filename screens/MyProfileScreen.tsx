import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MY_PROFILE = {
  name: 'Alex',
  age: 27,
  location: 'Los Angeles, CA',
  bio: 'Adventure seeker & coffee lover. Let\'s make memories ✨',
  interests: ['Travel', 'Coffee', 'Music', 'Hiking', 'Photography'],
  photo: 'https://randomuser.me/api/portraits/men/75.jpg',
};

export default function MyProfileScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 90 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.heading}>Profile</Text>

      {/* Photo */}
      <View style={styles.photoContainer}>
        <Image source={{ uri: MY_PROFILE.photo }} style={styles.photo} />
        <TouchableOpacity style={styles.editPhoto}>
          <Text style={styles.editPhotoText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Name & location */}
      <Text style={styles.name}>{MY_PROFILE.name}, {MY_PROFILE.age}</Text>
      <Text style={styles.location}>📍 {MY_PROFILE.location}</Text>

      {/* Bio */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>About me</Text>
        <Text style={styles.bio}>{MY_PROFILE.bio}</Text>
      </View>

      {/* Interests */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Interests</Text>
        <View style={styles.tags}>
          {MY_PROFILE.interests.map(tag => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Settings</Text>
        {[
          { label: 'Notifications', icon: '🔔' },
          { label: 'Privacy', icon: '🔒' },
          { label: 'Distance Preference', icon: '📍' },
          { label: 'Age Range', icon: '🎂' },
          { label: 'Logout', icon: '🚪' },
        ].map(item => (
          <TouchableOpacity key={item.label} style={styles.settingRow} activeOpacity={0.7}>
            <Text style={styles.settingIcon}>{item.icon}</Text>
            <Text style={styles.settingLabel}>{item.label}</Text>
            <Text style={styles.settingChevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  heading: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    paddingHorizontal: 20,
    paddingTop: 16,
    marginBottom: 20,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#FF2D55',
    backgroundColor: '#222',
  },
  editPhoto: {
    marginTop: 8,
    backgroundColor: '#1e1e1e',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  editPhotoText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  name: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  location: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  bio: {
    color: '#ddd',
    fontSize: 15,
    lineHeight: 22,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#FF2D55',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  tagText: {
    color: '#FF2D55',
    fontSize: 13,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#222',
    gap: 14,
  },
  settingIcon: {
    fontSize: 18,
    width: 26,
    textAlign: 'center',
  },
  settingLabel: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },
  settingChevron: {
    color: '#555',
    fontSize: 22,
  },
});
