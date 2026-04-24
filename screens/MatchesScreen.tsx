import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Dimensions, FlatList, Image, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Profile } from '../data/profiles';

const { width: W } = Dimensions.get('window');

type Props = {
  matches: Profile[];
  onOpenChat: (profile: Profile) => void;
};

export type MatchesScreenHandle = {
  goToMessages: () => void;
};

const MatchesScreen = forwardRef<MatchesScreenHandle, Props>(function MatchesScreen({ matches, onOpenChat }, ref) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [activeTab, setActiveTab] = useState<0 | 1 | 2>(0);

  const goTo = (idx: 0 | 1 | 2) => {
    scrollRef.current?.scrollTo({ x: idx * W, animated: true });
    setActiveTab(idx);
  };

  useImperativeHandle(ref, () => ({
    goToMessages: () => goTo(1),
  }));

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / W);
    setActiveTab(idx as 0 | 1 | 2);
  };

  const messages = matches.map(m => ({
    id: m.id,
    name: m.name,
    photo: m.photos[0],
    last: 'Say hello 👋',
    time: 'now',
  }));

  if (matches.length === 0) {
    return (
      <View style={[styles.empty, { paddingTop: insets.top }]}>
        <Text style={styles.emptyIcon}>💘</Text>
        <Text style={styles.emptyTitle}>No matches yet</Text>
        <Text style={styles.emptySub}>Keep swiping on virt!</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Tab header */}
      <View style={styles.tabRow}>
        {([
          { label: 'Matches', count: matches.length },
          { label: 'Messages', count: 0 },
          { label: 'Liked You', count: 0 },
        ] as const).map(({ label, count }, idx) => (
          <TouchableOpacity key={label} style={styles.tabItem} onPress={() => goTo(idx as 0 | 1 | 2)} activeOpacity={0.7}>
            <View style={styles.tabLabelRow}>
              <Text style={[styles.tabText, activeTab === idx && styles.tabTextActive]}>{label}</Text>
              {count > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{count > 99 ? '99+' : count}</Text>
                </View>
              )}
            </View>
            {activeTab === idx && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={16}
        style={styles.pager}
      >
        {/* Matches page */}
        <View style={styles.page}>
          <FlatList
            data={matches}
            keyExtractor={item => item.id}
            numColumns={2}
            contentContainerStyle={styles.grid}
            initialNumToRender={6}
            maxToRenderPerBatch={4}
            windowSize={5}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.matchCell} activeOpacity={0.85} onPress={() => onOpenChat(item)}>
                <Image source={{ uri: item.photos[0] }} style={styles.matchPhoto} />
                <View style={styles.matchInfo}>
                  <Text style={styles.matchName}>{item.name}, {item.age}</Text>
                  <Text style={styles.matchDist}>{item.distance}</Text>
                </View>
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Messages page */}
        <View style={styles.page}>
          <FlatList
            data={messages}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.msgList}
            initialNumToRender={8}
            maxToRenderPerBatch={6}
            windowSize={5}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.msgRow} activeOpacity={0.75} onPress={() => { const p = matches.find(m => m.id === item.id); if (p) onOpenChat(p); }}>
                <Image source={{ uri: item.photo }} style={styles.msgAvatar} />
                <View style={styles.msgBody}>
                  <View style={styles.msgTop}>
                    <Text style={styles.msgName}>{item.name}</Text>
                    <Text style={styles.msgTime}>{item.time}</Text>
                  </View>
                  <Text style={styles.msgLast} numberOfLines={1}>{item.last}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Liked You page */}
        <View style={styles.page}>
          <View style={styles.likedYouEmpty}>
            <Text style={styles.likedYouIcon}>💘</Text>
            <Text style={styles.likedYouTitle}>See who likes you</Text>
            <Text style={styles.likedYouSub}>People who liked you will appear here</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
});

export default MatchesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    marginBottom: 4,
    gap: 24,
  },
  tabItem: {
    paddingBottom: 10,
    alignItems: 'center',
  },
  tabLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabBadge: {
    backgroundColor: '#FF2D55',
    borderRadius: 8,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  tabText: {
    color: '#555',
    fontSize: 18,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#FF2D55',
    borderRadius: 2,
  },
  pager: {
    flex: 1,
  },
  page: {
    width: W,
    flex: 1,
  },
  grid: {
    paddingHorizontal: 10,
    paddingBottom: 100,
    gap: 10,
  },
  matchCell: {
    flex: 1,
    margin: 5,
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#222',
  },
  matchPhoto: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  matchInfo: {
    position: 'absolute',
    bottom: 10,
    left: 10,
  },
  matchName: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  matchDist: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  newBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FF2D55',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  msgList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: 14,
  },
  msgAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#333',
  },
  msgBody: {
    flex: 1,
  },
  msgTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  msgName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  msgTime: {
    color: '#555',
    fontSize: 12,
  },
  msgLast: {
    color: '#666',
    fontSize: 14,
  },
  likedYouEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  likedYouIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  likedYouTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  likedYouSub: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  empty: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySub: {
    color: '#888',
    fontSize: 15,
  },
});
