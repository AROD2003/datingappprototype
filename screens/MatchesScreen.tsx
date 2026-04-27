import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Dimensions, FlatList, Image, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Profile } from '../data/profiles';
import { supabase } from '../lib/supabase';

const { width: W } = Dimensions.get('window');

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  return `${Math.floor(diffHours / 24)}d`;
}

type LikedYouProfile = {
  id: string;
  name: string;
  age: number;
  photos: string[];
};

type Props = {
  matches: Profile[];
  matchIds: Record<string, string>;
  isPremium: boolean;
  userId: string;
  onOpenChat: (profile: Profile) => void;
};

export type MatchesScreenHandle = {
  goToMessages: () => void;
};

const MatchesScreen = forwardRef<MatchesScreenHandle, Props>(function MatchesScreen({ matches, matchIds, isPremium, userId, onOpenChat }, ref) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [activeTab, setActiveTab] = useState<0 | 1 | 2>(0);
  const [lastMessages, setLastMessages] = useState<Record<string, { text: string; time: string }>>({});
  const [likedYou, setLikedYou] = useState<LikedYouProfile[]>([]);

  // Fetch last message for each match, then subscribe to new ones
  useEffect(() => {
    const matchIdList = Object.values(matchIds);
    if (matchIdList.length === 0) return;

    // Fetch the most recent message per match in one query
    supabase
      .from('messages')
      .select('match_id, content, created_at')
      .in('match_id', matchIdList)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!data) return;
        const seen = new Set<string>();
        const latest: Record<string, { text: string; time: string }> = {};
        data.forEach((msg: { match_id: string; content: string; created_at: string }) => {
          if (!seen.has(msg.match_id)) {
            seen.add(msg.match_id);
            latest[msg.match_id] = {
              text: msg.content,
              time: formatTime(msg.created_at),
            };
          }
        });
        setLastMessages(latest);
      });

    // Realtime: update last message when a new one arrives
    const channel = supabase
      .channel('matches-last-msg')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const msg = payload.new as { match_id: string; content: string; created_at: string };
        if (!matchIdList.includes(msg.match_id)) return;
        setLastMessages(prev => ({
          ...prev,
          [msg.match_id]: { text: msg.content, time: formatTime(msg.created_at) },
        }));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [matchIds]);

  // Fetch profiles who liked the current user (excluding mutual matches)
  useEffect(() => {
    if (!userId) return;
    const matchedIds = new Set(matches.map(m => m.id));
    supabase
      .from('likes')
      .select('liker_id')
      .eq('liked_id', userId)
      .then(async ({ data }) => {
        if (!data || data.length === 0) return;
        const likerIds = data
          .map((r: { liker_id: string }) => r.liker_id)
          .filter((id: string) => !matchedIds.has(id));
        if (likerIds.length === 0) return;
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, age, photos')
          .in('id', likerIds);
        if (profiles) setLikedYou(profiles as LikedYouProfile[]);
      });
  }, [userId, matches]);

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

  const messages = matches.map(m => {
    const matchId = matchIds[m.id];
    const last = matchId ? lastMessages[matchId] : undefined;
    return {
      id: m.id,
      name: m.name,
      photo: m.photos[0],
      last: last?.text ?? 'Say hello 👋',
      time: last?.time ?? 'now',
    };
  });

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
          { label: 'Liked You', count: likedYou.length },
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
                  {item.distance ? <Text style={styles.matchDist}>{item.distance}</Text> : null}
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
          {likedYou.length === 0 ? (
            <View style={styles.likedYouEmpty}>
              <Text style={styles.likedYouIcon}>💘</Text>
              <Text style={styles.likedYouTitle}>No likes yet</Text>
              <Text style={styles.likedYouSub}>People who liked you will appear here</Text>
            </View>
          ) : (
            <FlatList
              data={likedYou}
              keyExtractor={item => item.id}
              numColumns={2}
              contentContainerStyle={styles.grid}
              initialNumToRender={6}
              renderItem={({ item }) => (
                <View style={styles.matchCell}>
                  <Image source={{ uri: item.photos[0] }} style={[styles.matchPhoto, !isPremium && styles.lockedPhoto]} blurRadius={isPremium ? 0 : 18} />
                  {!isPremium && (
                    <View style={styles.lockedOverlay}>
                      <Text style={styles.lockedEmoji}>🔒</Text>
                      <Text style={styles.lockedLabel}>Upgrade to see</Text>
                    </View>
                  )}
                  {isPremium && (
                    <View style={styles.matchInfo}>
                      <Text style={styles.matchName}>{item.name}, {item.age}</Text>
                    </View>
                  )}
                </View>
              )}
            />
          )}
          {!isPremium && likedYou.length > 0 && (
            <View style={styles.upgradeBanner}>
              <Text style={styles.upgradeBannerText}>Upgrade to see everyone who liked you</Text>
              <TouchableOpacity style={styles.upgradeBtn} activeOpacity={0.8}>
                <Text style={styles.upgradeBtnText}>Upgrade · $9.99/mo</Text>
              </TouchableOpacity>
            </View>
          )}
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
  lockedPhoto: {
    opacity: 0.55,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  lockedEmoji: {
    fontSize: 36,
  },
  lockedLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  upgradeBanner: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255,45,85,0.95)',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    gap: 12,
  },
  upgradeBannerText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  upgradeBtn: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  upgradeBtnText: {
    color: '#FF2D55',
    fontSize: 15,
    fontWeight: '800',
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
