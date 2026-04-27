import { useEffect, useRef, useState } from 'react';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProfileCard from '../components/ProfileCard';
import { Profile } from '../data/profiles';
import { fetchFeedProfiles, recordLike, getDailyLikesUsed, FeedProfile } from '../lib/feedAlgorithm';
import { useAuth } from '../context/AuthContext';

const { width: W, height: H } = Dimensions.get('window');
const MAX_SCROLL_BACK = 2;
const TAP_ZONE_BOTTOM_CUTOFF = 140;
const DAILY_FREE_LIKES = 50;

type Props = {
  onMatch: (profile: Profile, matchId: string) => void;
  onShootShot: (profile: Profile) => void;
};

function feedToProfile(fp: FeedProfile): Profile {
  return {
    id: fp.id,
    name: fp.name,
    age: fp.age,
    bio: fp.bio,
    photos: fp.photos,
    interests: fp.interests,
  };
}

export default function FeedScreen({ onMatch, onShootShot }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const matchPlayer = useAudioPlayer(require('../assets/match.wav'));

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [likesUsed, setLikesUsed] = useState(0);

  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollYVal = useRef(0);
  const dragStart = useRef(0);
  const panDistance = useRef(0);

  const currentIdx = useRef(0);
  const maxIdx = useRef(0);

  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const likedIds = useRef<Set<string>>(new Set());
  const [lockedThreshold, setLockedThreshold] = useState(0);
  const lockedThresholdRef = useRef(0);
  const [likeSignals, setLikeSignals] = useState<{ [id: string]: number }>({});
  const [wiggleSignals, setWiggleSignals] = useState<{ [id: string]: number }>({});
  const hapticTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const wiggleFired = useRef(false);
  const lastArrowTap = useRef(0);

  const bannerY = useRef(new Animated.Value(-200)).current;
  const bannerOpacity = useRef(new Animated.Value(1)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bannerActive = useRef(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetchFeedProfiles(user.id),
      getDailyLikesUsed(user.id),
    ]).then(([feedProfiles, used]) => {
      setProfiles(feedProfiles.map(feedToProfile));
      setLikesUsed(used);
      setLoading(false);
    });
  }, [user]);

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => { scrollYVal.current = value; });
    return () => {
      scrollY.removeListener(id);
      hapticTimers.current.forEach(clearTimeout);
      if (bannerTimer.current) clearTimeout(bannerTimer.current);
    };
  }, []);

  const playMatchSound = async () => {
    try {
      await matchPlayer.seekTo(0);
      matchPlayer.play();
    } catch { /* ignore */ }
  };

  const dismissBannerInstant = () => {
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    bannerY.stopAnimation();
    bannerY.setValue(-200);
    bannerOpacity.setValue(1);
    headerOpacity.setValue(1);
    bannerActive.current = false;
  };

  const hideLikedBanner = () => {
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    bannerOpacity.setValue(1);
    Animated.sequence([
      Animated.spring(bannerY, {
        toValue: 8,
        tension: 400,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(bannerY, {
          toValue: -200,
          duration: 320,
          easing: Easing.in(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(bannerOpacity, {
          toValue: 0,
          duration: 260,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      bannerOpacity.setValue(1);
      bannerActive.current = false;
    });
  };

  const showLikedBanner = () => {
    if (bannerActive.current) return;
    bannerActive.current = true;
    bannerY.setValue(-200);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.parallel([
      Animated.spring(bannerY, {
        toValue: 0,
        tension: 280,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(headerOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    bannerTimer.current = setTimeout(() => hideLikedBanner(), 3000);
  };

  const fireMatchHaptics = () => {
    hapticTimers.current.forEach(clearTimeout);
    hapticTimers.current = [];
    const pattern = [0, 60, 110, 150, 180, 230, 270, 320, 380, 450];
    const hapticStyles = [
      Haptics.ImpactFeedbackStyle.Heavy,
      Haptics.ImpactFeedbackStyle.Heavy,
      Haptics.ImpactFeedbackStyle.Heavy,
      Haptics.ImpactFeedbackStyle.Heavy,
      Haptics.ImpactFeedbackStyle.Medium,
      Haptics.ImpactFeedbackStyle.Heavy,
      Haptics.ImpactFeedbackStyle.Medium,
      Haptics.ImpactFeedbackStyle.Medium,
      Haptics.ImpactFeedbackStyle.Light,
      Haptics.ImpactFeedbackStyle.Light,
    ];
    pattern.forEach((delay, i) => {
      const timer = setTimeout(() => Haptics.impactAsync(hapticStyles[i]), delay);
      hapticTimers.current.push(timer);
    });
  };

  const handleLike = async (profile: Profile) => {
    if (!user || matchedIds.has(profile.id)) return;

    const result = await recordLike(user.id, profile.id);
    setLikesUsed(prev => prev + 1);

    if (result.matched) {
      setMatchedIds(prev => new Set([...prev, profile.id]));
      onMatch(profile, result.matchId ?? '');
      playMatchSound();
      fireMatchHaptics();
    }
  };

  const snapToIndex = (idx: number) => {
    const clamped = Math.max(0, Math.min(idx, profiles.length - 1));
    currentIdx.current = clamped;
    if (clamped > maxIdx.current) {
      maxIdx.current = clamped;
      const newThreshold = Math.max(0, clamped - MAX_SCROLL_BACK);
      lockedThresholdRef.current = newThreshold;
      setLockedThreshold(newThreshold);
    }
    Animated.spring(scrollY, {
      toValue: -clamped * H,
      tension: 200,
      friction: 26,
      useNativeDriver: true,
    }).start();
  };

  const pan = Gesture.Pan()
    .runOnJS(true)
    .onBegin(() => {
      scrollY.stopAnimation();
      dragStart.current = scrollYVal.current;
      panDistance.current = 0;
      wiggleFired.current = false;
    })
    .onUpdate((e) => {
      panDistance.current = Math.abs(e.translationY);
      if (panDistance.current > 8) dismissBannerInstant();
      const raw = dragStart.current + e.translationY;
      const min = -(profiles.length - 1) * H;
      const backLimit = Math.max(0, lockedThresholdRef.current - 1);
      const max = -backLimit * H;
      if (raw > max && !wiggleFired.current && lockedThresholdRef.current > 0) {
        wiggleFired.current = true;
        const lockedProfile = profiles[backLimit];
        if (lockedProfile) setWiggleSignals(prev => ({ ...prev, [lockedProfile.id]: (prev[lockedProfile.id] ?? 0) + 1 }));
      }
      scrollY.setValue(Math.max(min, Math.min(max, raw)));
    })
    .onEnd((e) => {
      const vy = e.velocityY;
      const backLimit = Math.max(0, lockedThresholdRef.current - 1);
      let target = currentIdx.current;
      if (vy < -300) target = Math.min(profiles.length - 1, currentIdx.current + 1);
      else if (vy > 300) target = Math.max(backLimit, currentIdx.current - 1);
      else target = Math.round(-scrollYVal.current / H);
      snapToIndex(Math.max(backLimit, target));
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(300)
    .runOnJS(true)
    .onStart((e) => {
      if (e.y > H - TAP_ZONE_BOTTOM_CUTOFF) return;
      if (e.x < 100 || e.x > W - 100) return;
      if (panDistance.current > 20) return;
      if (Date.now() - lastArrowTap.current < 400) return;
      const profile = profiles[currentIdx.current];
      if (!profile) return;
      if (currentIdx.current < lockedThresholdRef.current) return;
      if (likedIds.current.has(profile.id)) {
        showLikedBanner();
        return;
      }
      if (likesUsed >= DAILY_FREE_LIKES) return;
      likedIds.current.add(profile.id);
      setLikeSignals(prev => ({ ...prev, [profile.id]: (prev[profile.id] ?? 0) + 1 }));
    });

  const composed = Gesture.Simultaneous(pan, doubleTap);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#FF2D55" size="large" />
      </View>
    );
  }

  if (profiles.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyIcon}>👀</Text>
        <Text style={styles.emptyTitle}>You've seen everyone</Text>
        <Text style={styles.emptySub}>Check back later for new people nearby</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.topBar, { paddingTop: insets.top + 8, opacity: headerOpacity }]} pointerEvents="none">
        <View style={styles.logoRow}>
          <Text style={styles.logo}>V</Text>
          <View style={styles.iWrap}>
            <Text style={styles.logoHeart}>♥</Text>
            <Text style={styles.logo}>I</Text>
          </View>
          <Text style={styles.logo}>RT</Text>
        </View>
      </Animated.View>

      {likesUsed >= DAILY_FREE_LIKES && (
        <View style={[styles.limitBanner, { top: insets.top + 50 }]} pointerEvents="none">
          <Text style={styles.limitText}>Daily like limit reached · Upgrade for unlimited</Text>
        </View>
      )}

      <Animated.View
        style={[styles.likedBanner, { paddingTop: insets.top + 108, opacity: bannerOpacity, transform: [{ translateY: bannerY }] }]}
        pointerEvents="none"
      >
        <View style={styles.likedBannerRow}>
          <Text style={styles.likedBannerText}>ALREADY L</Text>
          <View style={styles.likedBannerIWrap}>
            <Text style={styles.likedBannerHeart}>♥</Text>
            <Text style={styles.likedBannerText}>I</Text>
          </View>
          <Text style={styles.likedBannerText}>KED!</Text>
        </View>
      </Animated.View>

      <GestureDetector gesture={composed}>
        <View style={styles.scrollArea}>
          <Animated.View style={[styles.track, { transform: [{ translateY: scrollY }] }]}>
            {profiles.map((profile, index) => (
              <View key={profile.id} style={[styles.cardSlot, { top: index * H }]}>
                <ProfileCard
                  profile={profile}
                  onLike={() => handleLike(profile)}
                  onShootShot={() => onShootShot(profile)}
                  wiggleSignal={wiggleSignals[profile.id]}
                  matched={matchedIds.has(profile.id)}
                  locked={index < lockedThreshold}
                  likeSignal={likeSignals[profile.id]}
                  onArrowPress={() => { lastArrowTap.current = Date.now(); }}
                  topInset={insets.top + 36}
                  storyBarOpacity={headerOpacity}
                />
              </View>
            ))}
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyIcon: { fontSize: 52 },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  emptySub: {
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  topBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    paddingHorizontal: 14,
    paddingBottom: 10,
    zIndex: 20,
  },
  limitBanner: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 25,
    alignItems: 'center',
  },
  limitText: {
    backgroundColor: 'rgba(255,45,85,0.9)',
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
  },
  scrollArea: {
    flex: 1,
    overflow: 'hidden',
  },
  track: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  cardSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: H,
  },
  likedBanner: {
    position: 'absolute',
    top: -100,
    left: 0,
    right: 0,
    zIndex: 30,
    alignItems: 'center',
    paddingBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  likedBannerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  likedBannerIWrap: {
    alignItems: 'center',
  },
  likedBannerHeart: {
    color: '#000',
    fontSize: 9,
    lineHeight: 11,
    marginBottom: -5,
    textAlign: 'center',
    marginRight: 2,
  },
  likedBannerText: {
    color: '#000',
    fontSize: 18,
    fontFamily: 'LilitaOne_400Regular',
    letterSpacing: 2,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  iWrap: {
    alignItems: 'center',
  },
  logoHeart: {
    color: '#fff',
    fontSize: 9,
    lineHeight: 11,
    marginBottom: -3,
  },
  logo: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
