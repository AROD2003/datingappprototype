import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Video } from '../data/videos';

type Props = {
  video: Video;
  onPress: (video: Video) => void;
};

export default function VideoCard({ video, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(video)} activeOpacity={0.85}>
      <View style={styles.thumbnailContainer}>
        <Image source={{ uri: video.thumbnail }} style={styles.thumbnail} />
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{video.duration}</Text>
        </View>
      </View>
      <View style={styles.info}>
        <Image source={{ uri: video.avatar }} style={styles.avatar} />
        <View style={styles.meta}>
          <Text style={styles.title} numberOfLines={2}>{video.title}</Text>
          <Text style={styles.channel}>{video.channel}</Text>
          <Text style={styles.stats}>{video.views} · {video.timestamp}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 20,
  },
  thumbnailContainer: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#2a2a2a',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  info: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2a2a2a',
  },
  meta: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 2,
  },
  channel: {
    color: '#aaa',
    fontSize: 13,
  },
  stats: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 1,
  },
});
