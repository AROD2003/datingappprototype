import { useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProfileCard from '../components/ProfileCard';
import { PROFILES, Profile } from '../data/profiles';

const { width: W, height: H } = Dimensions.get('window');
const MAX_SCROLL_BACK = 2;
const TAP_ZONE_BOTTOM_CUTOFF = 140;

type Props = {
  onMatch: (profile: Profile) => void;
  onShootShot: (profile: Profile) => void;
};

export default function FeedScreen({ onMatch, onShootShot }: Props) {
  const insets = useSafeAreaInsets();

  // Animated scroll offset (negative = scrolled down)
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollYVal = useRef(0);
  const dragStart = useRef(0);

  // Which card we're committed to (updated immediately on swipe end)
  const currentIdx = useRef(0);
  const maxIdx = useRef(0);

  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [lockedThreshold, setLockedThreshold] = useState(0);
  const lockedThresholdRef = useRef(0);
  const [likeSignals, setLikeSignals] = useState<{ [id: string]: number }>({});
  const [wiggleSignals, setWiggleSignals] = useState<{ [id: string]: number }>({});
  const wiggleFired = useRef(false);

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => { scrollYVal.current = value; });
    return () => scrollY.removeListener(id);
  }, []);

  const playMatchSound = async () => {
    const { sound } = await Audio.Sound.createAsync(require('../assets/match.wav'));
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate(status => {
      if (status.isLoaded && status.didJustFinish) sound.unloadAsync();
    });
  };

  const fireMatchHaptics = () => {
    // Explosive flutter: rapid heavy bursts then softer trailing pulses
    const pattern = [0, 60, 110, 150, 180, 230, 270, 320, 380, 450];
    const styles = [
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
      setTimeout(() => Haptics.impactAsync(styles[i]), delay);
    });
  };

  const handleLike = (profile: Profile) => {
    if (matchedIds.has(profile.id)) return;
    if (Math.random() > 0.35) {
      setMatchedIds(prev => new Set([...prev, profile.id]));
      onMatch(profile);
      playMatchSound();
      fireMatchHaptics();
    }
  };

  const snapToIndex = (idx: number) => {
    const clamped = Math.max(0, Math.min(idx, PROFILES.length - 1));
    currentIdx.current = clamped; // commit immediately so double-tap targets right card
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
      wiggleFired.current = false;
    })
    .onUpdate((e) => {
      const raw = dragStart.current + e.translationY;
      const min = -(PROFILES.length - 1) * H;
      const backLimit = Math.max(0, lockedThresholdRef.current - 1);
      const max = -backLimit * H;
      if (raw > max && !wiggleFired.current && lockedThresholdRef.current > 0) {
        wiggleFired.current = true;
        const lockedProfile = PROFILES[backLimit];
        if (lockedProfile) setWiggleSignals(prev => ({ ...prev, [lockedProfile.id]: (prev[lockedProfile.id] ?? 0) + 1 }));
      }
      scrollY.setValue(Math.max(min, Math.min(max, raw)));
    })
    .onEnd((e) => {
      const vy = e.velocityY;
      const backLimit = Math.max(0, lockedThresholdRef.current - 1);
      let target = currentIdx.current;
      if (vy < -300) target = Math.min(PROFILES.length - 1, currentIdx.current + 1);
      else if (vy > 300) target = Math.max(backLimit, currentIdx.current - 1);
      else target = Math.round(-scrollYVal.current / H);
      snapToIndex(Math.max(backLimit, target));
    });

  // Fires simultaneously with pan — no UIScrollView to block it
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(300)
    .runOnJS(true)
    .onStart((e) => {
      if (e.y > H - TAP_ZONE_BOTTOM_CUTOFF) return;
      // Exclude arrow zones on left and right edges
      if (e.x < 60 || e.x > W - 60) return;
      // currentIdx is already the destination card even mid-animation
      const profile = PROFILES[currentIdx.current];
      if (!profile) return;
      // Don't like locked profiles
      if (currentIdx.current < lockedThresholdRef.current) return;
      setLikeSignals(prev => ({ ...prev, [profile.id]: (prev[profile.id] ?? 0) + 1 }));
    });

  const composed = Gesture.Simultaneous(pan, doubleTap);

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]} pointerEvents="none">
        <View style={styles.logoRow}>
          <Text style={styles.logo}>V</Text>
          <View style={styles.iWrap}>
            <Text style={styles.logoHeart}>♥</Text>
            <Text style={styles.logo}>I</Text>
          </View>
          <Text style={styles.logo}>RT</Text>
        </View>
      </View>

      <GestureDetector gesture={composed}>
        <View style={styles.scrollArea}>
          <Animated.View
            style={[styles.track, { transform: [{ translateY: scrollY }] }]}
          >
            {PROFILES.map((profile, index) => (
              <View key={profile.id} style={[styles.cardSlot, { top: index * H }]}>
                <ProfileCard
                  profile={profile}
                  onLike={() => handleLike(profile)}
                  onShootShot={() => onShootShot(profile)}
                  wiggleSignal={wiggleSignals[profile.id]}
                  matched={matchedIds.has(profile.id)}
                  locked={index < lockedThreshold}
                  likeSignal={likeSignals[profile.id]}
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
  topBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    paddingHorizontal: 14,
    paddingBottom: 10,
    zIndex: 20,
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
    height: PROFILES.length * H,
  },
  cardSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: H,
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
