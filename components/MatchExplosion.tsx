import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Profile } from '../data/profiles';

const { width: W, height: H } = Dimensions.get('window');

const DEFAULT_TAB_HEART_X = W / 2;
const DEFAULT_TAB_HEART_Y = H - 58;

const PARTICLE_COUNT = 40;
const PARTICLE_SYMBOLS = ['♥', '♥', '✦', '✦', '■', '●', '★'];
const COLORS = [
  '#FF2D55', '#FF6B6B', '#FFD700', '#FF69B4',
  '#FF4500', '#FFA500', '#FF1493', '#FF8C00',
  '#FF3CAC', '#FFEB3B', '#F44336', '#E91E63',
  '#FF80AB', '#FF6D00', '#fff', '#FF2D55', '#FFD700',
];

type Particle = {
  x: Animated.Value; y: Animated.Value;
  opacity: Animated.Value; scale: Animated.Value;
  rotate: Animated.Value;
  symbol: string; color: string; size: number;
  tx: number; ty: number; dur: number;
};

function makeParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
    const dist = W * 0.3 + Math.random() * W * 0.75;
    return {
      x: new Animated.Value(0), y: new Animated.Value(0),
      opacity: new Animated.Value(0), scale: new Animated.Value(0),
      rotate: new Animated.Value(0),
      symbol: PARTICLE_SYMBOLS[Math.floor(Math.random() * PARTICLE_SYMBOLS.length)],
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 10 + Math.random() * 20,
      tx: Math.cos(angle) * dist,
      ty: Math.sin(angle) * dist,
      dur: 280 + Math.random() * 320,
    };
  });
}

const HEART_COUNT = 50;
const HEART_COLORS = ['#FF2D55', '#FF1010', '#FF6B6B', '#FF69B4', '#FF3CAC', '#fff', '#FF80AB'];

type HeartParticle = {
  x: Animated.Value; y: Animated.Value;
  opacity: Animated.Value; scale: Animated.Value;
  rotate: Animated.Value;
  color: string; size: number;
  tx: number; ty: number; dur: number; delay: number;
};

function makeHearts(): HeartParticle[] {
  return Array.from({ length: HEART_COUNT }, (_, i) => {
    const angle = (i / HEART_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    // Reach anywhere on screen — diagonal is ~sqrt(W²+H²)/2
    const maxDist = Math.sqrt(W * W + H * H) / 2 + 40;
    const dist = maxDist * (0.5 + Math.random() * 0.6);
    return {
      x: new Animated.Value(0), y: new Animated.Value(0),
      opacity: new Animated.Value(0), scale: new Animated.Value(0),
      rotate: new Animated.Value(0),
      color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
      size: 12 + Math.random() * 22,
      tx: Math.cos(angle) * dist,
      ty: Math.sin(angle) * dist,
      dur: 500 + Math.random() * 500,
      delay: Math.random() * 120,
    };
  });
}

type Props = { profile: Profile; onDismiss: () => void; onShootShot: () => void; onArrived?: () => void; heartPos?: { x: number; y: number } };

export default function MatchExplosion({ profile, onDismiss, onArrived, heartPos }: Props) {
  const particles = useRef<Particle[]>(makeParticles()).current;
  const hearts = useRef<HeartParticle[]>(makeHearts()).current;

  const rings = useRef(
    Array.from({ length: 5 }, () => ({ s: new Animated.Value(0.1), o: new Animated.Value(1) }))
  ).current;

  const heartRingS = useRef(new Animated.Value(0)).current;
  const heartRingO = useRef(new Animated.Value(1)).current;
  const heartRing2S = useRef(new Animated.Value(0)).current;
  const heartRing2O = useRef(new Animated.Value(0.7)).current;

  const flash1O = useRef(new Animated.Value(0)).current;
  const bgO = useRef(new Animated.Value(0)).current;

  // Text intro
  const titleScale = useRef(new Animated.Value(0)).current;
  const titleO = useRef(new Animated.Value(0)).current;
  const subO = useRef(new Animated.Value(0)).current;
  const subY = useRef(new Animated.Value(20)).current;

  // Text outro — suck into matches heart
  const titleOutroScale = useRef(new Animated.Value(1)).current;
  const titleOutroX = useRef(new Animated.Value(0)).current;
  const titleOutroY = useRef(new Animated.Value(0)).current;
  const titleOutroO = useRef(new Animated.Value(1)).current;
  const subOutroO = useRef(new Animated.Value(1)).current;

  const mainOpacity = useRef(new Animated.Value(1)).current;

  const outroRunning = useRef(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transformTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const EXPAND_DONE = 700;
  const TRANSFORM_DELAY = EXPAND_DONE + 1000;

  const runTransform = () => {
    // Target offset from screen center to the matches heart
    const targetX = (heartPos?.x ?? DEFAULT_TAB_HEART_X) - W / 2;
    const targetY = (heartPos?.y ?? DEFAULT_TAB_HEART_Y) - H / 2;

    // Sub fades out first
    Animated.timing(subOutroO, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start();

    // Letters accelerate toward the heart and shrink to nothing
    Animated.parallel([
      Animated.timing(titleOutroX, {
        toValue: targetX,
        duration: 480,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(titleOutroY, {
        toValue: targetY,
        duration: 480,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(titleOutroScale, {
        toValue: 0,
        duration: 480,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(300),
        Animated.timing(titleOutroO, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Fire pulse callback when text arrives at the heart
    setTimeout(() => onArrived?.(), 480);

    Animated.sequence([
      Animated.delay(420),
      Animated.timing(mainOpacity, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    dismissTimer.current = setTimeout(() => onDismiss(), 700);
  };

  const playOutro = () => {
    if (outroRunning.current) return;
    outroRunning.current = true;
    if (transformTimer.current) clearTimeout(transformTimer.current);
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    runTransform();
  };

  useEffect(() => {
    Animated.sequence([
      Animated.timing(flash1O, { toValue: 1, duration: 40, useNativeDriver: true }),
      Animated.timing(flash1O, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();

    Animated.timing(bgO, { toValue: 0.88, duration: 100, useNativeDriver: true }).start();

    rings.forEach((r, i) => {
      Animated.sequence([
        Animated.delay(i * 60),
        Animated.parallel([
          Animated.timing(r.s, { toValue: 12, duration: 550, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(r.o, { toValue: 0, duration: 550, useNativeDriver: true }),
        ]),
      ]).start();
    });

    Animated.parallel([
      Animated.timing(heartRingS, { toValue: 6, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(150),
        Animated.timing(heartRingO, { toValue: 0, duration: 550, useNativeDriver: true }),
      ]),
    ]).start();
    Animated.sequence([
      Animated.delay(120),
      Animated.parallel([
        Animated.timing(heartRing2S, { toValue: 4, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(200),
          Animated.timing(heartRing2O, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
      ]),
    ]).start();

    hearts.forEach(h => {
      Animated.sequence([
        Animated.delay(h.delay),
        Animated.parallel([
          Animated.timing(h.opacity, { toValue: 1, duration: 60, useNativeDriver: true }),
          Animated.timing(h.scale, { toValue: 1, duration: 150, easing: Easing.out(Easing.back(1.3)), useNativeDriver: true }),
          Animated.timing(h.x, { toValue: h.tx, duration: h.dur, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(h.y, { toValue: h.ty, duration: h.dur, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(h.rotate, { toValue: 1, duration: h.dur, useNativeDriver: true }),
          Animated.sequence([
            Animated.delay(h.dur * 0.5),
            Animated.timing(h.opacity, { toValue: 0, duration: h.dur * 0.5, useNativeDriver: true }),
          ]),
        ]),
      ]).start();
    });

    Animated.stagger(5, particles.map(p =>
      Animated.parallel([
        Animated.timing(p.opacity, { toValue: 1, duration: 25, useNativeDriver: true }),
        Animated.timing(p.scale, { toValue: 1, duration: 120, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
        Animated.timing(p.x, { toValue: p.tx, duration: p.dur, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(p.y, { toValue: p.ty, duration: p.dur, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(p.rotate, { toValue: 1, duration: p.dur, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(p.dur * 0.4),
          Animated.timing(p.opacity, { toValue: 0, duration: p.dur * 0.6, useNativeDriver: true }),
        ]),
      ])
    )).start();

    Animated.sequence([
      Animated.delay(70),
      Animated.parallel([
        Animated.spring(titleScale, { toValue: 1, friction: 4, tension: 220, useNativeDriver: true }),
        Animated.timing(titleO, { toValue: 1, duration: 80, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(320),
      Animated.parallel([
        Animated.timing(subO, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(subY, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]),
    ]).start();

    transformTimer.current = setTimeout(() => {
      if (!outroRunning.current) {
        outroRunning.current = true;
        runTransform();
      }
    }, TRANSFORM_DELAY);

    return () => {
      if (transformTimer.current) clearTimeout(transformTimer.current);
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, []);

  return (
    <TouchableWithoutFeedback onPress={playOutro}>
      <View style={StyleSheet.absoluteFill}>

        <Animated.View style={[StyleSheet.absoluteFill, { opacity: mainOpacity }]}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.88)', opacity: bgO }]} />
          <Animated.View style={[StyleSheet.absoluteFill, styles.flash, { opacity: flash1O }]} pointerEvents="none" />

          <View style={styles.center} pointerEvents="none">
            {rings.map((r, i) => (
              <Animated.View key={i} style={[styles.ring, { opacity: r.o, transform: [{ scale: r.s }] }]} />
            ))}
          </View>

          <View style={styles.center} pointerEvents="none">
            <Animated.Text style={[styles.heartRing, { opacity: heartRingO, transform: [{ scale: heartRingS }] }]}>♡</Animated.Text>
            <Animated.Text style={[styles.heartRing, { color: '#FF69B4', opacity: heartRing2O, transform: [{ scale: heartRing2S }] }]}>♡</Animated.Text>
          </View>

          <View style={styles.center} pointerEvents="none">
            {particles.map((p, i) => {
              const rotate = p.rotate.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', `${i % 2 === 0 ? 600 : -600}deg`],
              });
              return (
                <Animated.Text key={i} style={{
                  position: 'absolute',
                  fontSize: p.size, color: p.color,
                  opacity: p.opacity,
                  transform: [{ translateX: p.x }, { translateY: p.y }, { scale: p.scale }, { rotate }],
                }}>{p.symbol}</Animated.Text>
              );
            })}
          </View>

          <View style={styles.center} pointerEvents="none">
            {hearts.map((h, i) => {
              const rotate = h.rotate.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', `${i % 2 === 0 ? 360 : -360}deg`],
              });
              return (
                <Animated.Text key={i} style={{
                  position: 'absolute',
                  fontSize: h.size,
                  color: h.color,
                  opacity: h.opacity,
                  transform: [{ translateX: h.x }, { translateY: h.y }, { scale: h.scale }, { rotate }],
                }}>♥</Animated.Text>
              );
            })}
          </View>

          <View style={styles.textBlock} pointerEvents="none">
            {/* Outro layer: translates + shrinks toward the matches heart */}
            <Animated.View style={{
              alignItems: 'center',
              opacity: titleOutroO,
              transform: [
                { translateX: titleOutroX },
                { translateY: titleOutroY },
                { scale: titleOutroScale },
              ],
            }}>
              {/* Intro scale/fade applied on inner view */}
              <Animated.View style={{ opacity: titleO, transform: [{ scale: titleScale }] }}>
                <Text style={styles.titleLine1}>IT'S A</Text>
                <Text style={styles.titleLine2}>MATCH!</Text>
              </Animated.View>
            </Animated.View>

            <Animated.Text style={[styles.sub, { opacity: Animated.multiply(subO, subOutroO), transform: [{ translateY: subY }] }]}>
              You and {profile.name} liked each other
            </Animated.Text>
          </View>
        </Animated.View>

      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  flash: { backgroundColor: '#FF2D55' },
  center: {
    position: 'absolute',
    top: H / 2, left: W / 2,
    width: 0, height: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 80, height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FF2D55',
  },
  heartRing: {
    position: 'absolute',
    fontSize: 100,
    color: '#FF2D55',
  },
  textBlock: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  titleLine1: {
    fontSize: 52,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 3,
  },
  titleLine2: {
    fontSize: 68,
    fontWeight: '900',
    color: '#FF2D55',
    textAlign: 'center',
    letterSpacing: 3,
    marginTop: -8,
  },
  sub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 18,
    marginBottom: 20,
  },
});
