import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { memo, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MatchExplosion from './MatchExplosion';
import { Profile } from '../data/profiles';

const { width: W, height: H } = Dimensions.get('window');
const FRAG_COUNT = 12;
const FRAG_ANGLES = Array.from({ length: FRAG_COUNT }, (_, i) => (i / FRAG_COUNT) * Math.PI * 2);


type Props = {
  profile: Profile;
  onLike: () => void;
  matched: boolean;
  locked?: boolean;
  likeSignal?: number;
  wiggleSignal?: number;
  onShootShot?: () => void;
  onArrowPress?: () => void;
  topInset?: number;
  storyBarOpacity?: Animated.Value;
};

function ProfileCard({ profile, onLike, matched, locked, likeSignal, wiggleSignal, onShootShot, onArrowPress, topInset = 44, storyBarOpacity }: Props) {
  const [showInfo, setShowInfo] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  const lockRotate = useRef(new Animated.Value(0)).current;
  const runningAnims = useRef<Animated.CompositeAnimation[]>([]);
  const hapticTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    profile.photos.forEach(uri => Image.prefetch(uri));
    return () => {
      runningAnims.current.forEach(a => a.stop());
      if (hapticTimer.current) clearTimeout(hapticTimer.current);
    };
  }, []);

const likeTextScaleX = useRef(new Animated.Value(0)).current;
  const likeTextScaleY = useRef(new Animated.Value(0)).current;
  const likeTextOpacity = useRef(new Animated.Value(0)).current;
  const frags = useRef(
    FRAG_ANGLES.map(() => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (matched) setShowExplosion(true);
  }, [matched]);

  useEffect(() => {
    if (!wiggleSignal) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    lockRotate.setValue(0);
    const anim = Animated.sequence([
      Animated.timing(lockRotate, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(lockRotate, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(lockRotate, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(lockRotate, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(lockRotate, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]);
    runningAnims.current.push(anim);
    anim.start();
  }, [wiggleSignal]);

  const advancePhoto = (dir: 1 | -1) => {
    const next = photoIndex + dir;
    if (next < 0 || next >= profile.photos.length) return;
    setPhotoIndex(next);
  };

  const triggerLike = () => {
    const mainAnim = Animated.sequence([
      Animated.parallel([
        Animated.sequence([
          Animated.parallel([
            Animated.timing(likeTextScaleX, { toValue: 2.0, duration: 50, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(likeTextScaleY, { toValue: 1.25, duration: 50, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(likeTextScaleX, { toValue: 0.9, duration: 35, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            Animated.timing(likeTextScaleY, { toValue: 0.92, duration: 35, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(likeTextScaleX, { toValue: 1.0, duration: 25, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(likeTextScaleY, { toValue: 1.0, duration: 25, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          ]),
        ]),
        Animated.timing(likeTextOpacity, { toValue: 1, duration: 25, useNativeDriver: true }),
      ]),
      Animated.delay(130),
      Animated.timing(likeTextOpacity, { toValue: 0, duration: 30, useNativeDriver: true }),
    ]);
    runningAnims.current.push(mainAnim);
    mainAnim.start();

    // Haptic on LIKED! appearance
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (hapticTimer.current) clearTimeout(hapticTimer.current);
    hapticTimer.current = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 290);

    // Hearts burst after bounce settles
    const BURST_DELAY = 290;
    const targetXs = frags.map((_, i) => Math.cos(FRAG_ANGLES[i]) * (20 + Math.random() * 55));
    const targetYs = frags.map((_, i) => Math.sin(FRAG_ANGLES[i]) * (20 + Math.random() * 55));

    frags.forEach((f, i) => {
      setTimeout(() => {
        Animated.parallel([
          Animated.sequence([
            Animated.timing(f.opacity, { toValue: 0.6, duration: 20, useNativeDriver: false }),
            Animated.delay(160),
            Animated.timing(f.opacity, { toValue: 0, duration: 130, useNativeDriver: false }),
          ]),
          Animated.spring(f.scale, { toValue: 0.5 + Math.random() * 0.9, friction: 5, tension: 280, useNativeDriver: false }),
          Animated.timing(f.x, { toValue: targetXs[i], duration: 310, easing: Easing.out(Easing.quad), useNativeDriver: false }),
          Animated.timing(f.y, { toValue: targetYs[i], duration: 310, easing: Easing.out(Easing.quad), useNativeDriver: false }),
        ]).start();
      }, BURST_DELAY);
    });

    onLike();
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (likeSignal) triggerLike(); }, [likeSignal]);

  return (
    <View style={styles.card}>
        <Image source={{ uri: profile.photos[photoIndex] }} style={styles.photo} resizeMode="cover" />

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.88)']}
          style={styles.gradient}
        />

        {/* Story bars */}
        <Animated.View style={[styles.storyBars, { top: topInset + 8, opacity: storyBarOpacity ?? 1 }]}>
          {profile.photos.map((_, i) => (
            <View key={i} style={[styles.storyBar, i <= photoIndex && styles.storyBarActive]} />
          ))}
        </Animated.View>

        {/* Photo arrows — TouchableOpacity so they don't trigger double-tap logic */}
        {photoIndex > 0 && (
          <TouchableOpacity style={styles.arrowLeft} onPressIn={onArrowPress} onPress={() => advancePhoto(-1)} activeOpacity={0.7} hitSlop={{ top: 60, bottom: 60, left: 10, right: 50 }}>
            <Text style={styles.arrowText}>‹</Text>
          </TouchableOpacity>
        )}
        {photoIndex < profile.photos.length - 1 && (
          <TouchableOpacity style={styles.arrowRight} onPressIn={onArrowPress} onPress={() => advancePhoto(1)} activeOpacity={0.7} hitSlop={{ top: 60, bottom: 60, left: 50, right: 10 }}>
            <Text style={styles.arrowText}>›</Text>
          </TouchableOpacity>
        )}

        {/* LIKED! text + heart burst */}
        <Animated.Text style={[styles.likeText, {
          opacity: likeTextOpacity,
          transform: [{ scaleX: likeTextScaleX }, { scaleY: likeTextScaleY }],
        }]} pointerEvents="none">LIKED!</Animated.Text>

        <View style={styles.fragAnchor} pointerEvents="none">
          {frags.map((f, i) => (
            <Animated.Text
              key={i}
              style={{
                position: 'absolute',
                fontSize: 8 + (i % 3) * 3,
                color: '#fff',
                opacity: f.opacity,
                transform: [{ translateX: f.x }, { translateY: f.y }, { scale: f.scale }],
              }}
            >♥</Animated.Text>
          ))}
        </View>

        {/* Tap zone placeholder — interaction handled by FeedScreen gesture overlay */}
        <View style={styles.tapZone} />

        {/* Profile info */}
        <View style={styles.bottom}>
          <View style={styles.nameRow}>
            {profile.verified && <Text style={styles.verified}>✓</Text>}
            <Text style={styles.name}>{profile.name}, {profile.age}</Text>
            <Text style={styles.infoToggle} onPress={() => setShowInfo(v => !v)}>
              {showInfo ? 'less ' : 'more '}
              <Text style={styles.infoToggleArrow}>{showInfo ? '↓' : '↑'}</Text>
            </Text>
          </View>

          {profile.distance && <Text style={styles.location}>📍 {profile.distance}</Text>}

          {showInfo && (
            <>
              <Text style={styles.bio}>{profile.bio}</Text>
              <View style={styles.tags}>
                {profile.interests.map(tag => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

        </View>

        {showExplosion && (
          <MatchExplosion
            profile={profile}
            onDismiss={() => setShowExplosion(false)}
            onShootShot={() => { setShowExplosion(false); onShootShot?.(); }}
          />
        )}

        {locked && (
          <View style={styles.lockedOverlay} pointerEvents="none">
            <Animated.Text style={[styles.lockedIcon, {
            transform: [{ rotate: lockRotate.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-18deg', '0deg', '18deg'] }) }],
          }]}>🔒</Animated.Text>
            <Text style={styles.lockedText}>Locked</Text>
          </View>
        )}
      </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: W,
    height: H,
    backgroundColor: '#111',
  },
  photo: {
    ...StyleSheet.absoluteFillObject,
    width: W,
    height: H,
  },
  gradient: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    height: H * 0.55,
  },
  tapZone: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    // Stops at the top of the arrow buttons so rapid photo tapping never triggers a like
    bottom: 230,
  },
  storyBars: {
    position: 'absolute',
    left: 10,
    right: 10,
    flexDirection: 'row',
    gap: 4,
  },
  storyBar: {
    flex: 1,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  storyBarActive: {
    backgroundColor: '#fff',
  },
  arrowLeft: {
    position: 'absolute',
    bottom: H * 0.21,
    left: 0,
    paddingHorizontal: 4,
    paddingVertical: 70,
  },
  arrowRight: {
    position: 'absolute',
    bottom: H * 0.21,
    right: 0,
    paddingHorizontal: 4,
    paddingVertical: 70,
  },
  arrowText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 80,
    fontWeight: '100',
    transform: [{ scaleY: 1.8 }],
  },
  likeText: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: H * 0.5 - 20,
    textAlign: 'center',
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'LilitaOne_400Regular',
    letterSpacing: -1,
  },
  fragAnchor: {
    position: 'absolute',
    top: H * 0.5 - 20,
    left: W / 2,
    width: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    position: 'absolute',
    bottom: H * 0.14,
    left: 0, right: 0,
    paddingHorizontal: 22,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
  },
  verified: {
    color: '#4FC3F7',
    fontSize: 22,
    fontWeight: '900',
  },
  location: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 10,
  },
  bio: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tagText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  infoToggle: {
    position: 'absolute',
    left: -22,
    right: -22,
    textAlign: 'center',
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  infoToggleArrow: {
    fontSize: 18,
    fontWeight: '400',
  },
  tapHint: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  lockedIcon: {
    fontSize: 52,
  },
  lockedText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});

export default memo(ProfileCard);
