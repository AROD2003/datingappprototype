import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import VideoCard from '../components/VideoCard';
import { Video, VIDEOS } from '../data/videos';

type Props = {
  video: Video;
  onBack: () => void;
  onVideoPress: (video: Video) => void;
};

export default function VideoPlayerScreen({ video, onBack, onVideoPress }: Props) {
  const insets = useSafeAreaInsets();
  const related = VIDEOS.filter(v => v.id !== video.id);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
        {/* Video Player (thumbnail placeholder) */}
        <View style={styles.playerContainer}>
          <Image source={{ uri: video.thumbnail }} style={styles.player} />
          <View style={styles.playOverlay}>
            <View style={styles.playButton}>
              <Text style={styles.playIcon}>▶</Text>
            </View>
          </View>
        </View>

        {/* Video Info */}
        <View style={styles.infoSection}>
          <Text style={styles.title}>{video.title}</Text>
          <Text style={styles.stats}>{video.views} · {video.timestamp}</Text>

          {/* Channel Row */}
          <View style={styles.channelRow}>
            <Image source={{ uri: video.avatar }} style={styles.avatar} />
            <View style={styles.channelInfo}>
              <Text style={styles.channelName}>{video.channel}</Text>
              <Text style={styles.subscriberCount}>1.2M subscribers</Text>
            </View>
            <TouchableOpacity style={styles.subscribeBtn}>
              <Text style={styles.subscribeBtnText}>Subscribe</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionsRow} contentContainerStyle={{ gap: 10 }}>
            {[
              { icon: '👍', label: '24K' },
              { icon: '👎', label: 'Dislike' },
              { icon: '↗️', label: 'Share' },
              { icon: '💾', label: 'Save' },
              { icon: '✂️', label: 'Clip' },
            ].map(action => (
              <TouchableOpacity key={action.label} style={styles.actionBtn}>
                <Text style={styles.actionIcon}>{action.icon}</Text>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.divider} />

        {/* Up Next */}
        <Text style={styles.upNextLabel}>Up next</Text>
        {related.map(v => (
          <VideoCard key={v.id} video={v} onPress={onVideoPress} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  backBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  playerContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    position: 'relative',
  },
  player: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 22,
    marginLeft: 4,
  },
  infoSection: {
    padding: 14,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 4,
  },
  stats: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 14,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  subscriberCount: {
    color: '#aaa',
    fontSize: 12,
  },
  subscribeBtn: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  subscribeBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 13,
  },
  actionsRow: {
    flexGrow: 0,
  },
  actionBtn: {
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: {
    fontSize: 16,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#222',
    marginVertical: 8,
  },
  upNextLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
});
