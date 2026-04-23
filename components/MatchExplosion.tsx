import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Profile } from '../data/profiles';

const { width: W, height: H } = Dimensions.get('window');

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

const RISE_COUNT = 14;
type RisingHeart = {
  x: Animated.Value; y: Animated.Value;
  opacity: Animated.Value; scale: Animated.Value;
  startX: number; delay: number;
};
function makeRisingHearts(): RisingHeart[] {
  return Array.from({ length: RISE_COUNT }, () => ({
    x: new Animated.Value(0), y: new Animated.Value(0),
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0.5 + Math.random() * 0.8),
    startX: (Math.random() - 0.5) * W * 0.85,
    delay: Math.random() * 500,
  }));
}

type Props = { profile: Profile; onDismiss: () => void; onShootShot: () => void };

export default function MatchExplosion({ profile, onDismiss, onShootShot }: Props) {
  const particles = useRef<Particle[]>(makeParticles()).current;
  const hearts = useRef<RisingHeart[]>(makeRisingHearts()).current;

  // 5 shockwave rings
  const rings = useRef(
    Array.from({ length: 5 }, () => ({
      s: new Animated.Value(0.1),
      o: new Animated.Value(1),
    }))
  ).current;

  const heartRingS = useRef(new Animated.Value(0)).current;
  const heartRingO = useRef(new Animated.Value(1)).current;
  const heartRing2S = useRef(new Animated.Value(0)).current;
  const heartRing2O = useRef(new Animated.Value(0.7)).current;

  // Double flash
  const flash1O = useRef(new Animated.Value(0)).current;
  const flash2O = useRef(new Animated.Value(0)).current;

  const bgO = useRef(new Animated.Value(0)).current;
  const bgPulse = useRef(new Animated.Value(0)).current;

  // Text
  const titleScale = useRef(new Animated.Value(0)).current;
  const titleO = useRef(new Animated.Value(0)).current;
  const subO = useRef(new Animated.Value(0)).current;
  const subY = useRef(new Animated.Value(20)).current;
  const hintO = useRef(new Animated.Value(0)).current;

  const outroOpacity = useRef(new Animated.Value(1)).current;
  const outroRunning = useRef(false);

  const playOutro = () => {
    if (outroRunning.current) return;
    outroRunning.current = true;
    Animated.timing(outroOpacity, { toValue: 0, duration: 300, useNativeDriver: true })
      .start(() => onDismiss());
  };

  useEffect(() => {
    // Double flash: big hit + echo
    Animated.sequence([
      Animated.timing(flash1O, { toValue: 1, duration: 40, useNativeDriver: true }),
      Animated.timing(flash1O, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.delay(80),
      Animated.timing(flash2O, { toValue: 0.5, duration: 30, useNativeDriver: true }),
      Animated.timing(flash2O, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start();

    // BG
    Animated.timing(bgO, { toValue: 0.88, duration: 100, useNativeDriver: true }).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bgPulse, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(bgPulse, { toValue: 0, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    });

    // 5 staggered shockwave rings
    rings.forEach((r, i) => {
      Animated.sequence([
        Animated.delay(i * 60),
        Animated.parallel([
          Animated.timing(r.s, { toValue: 12, duration: 550, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(r.o, { toValue: 0, duration: 550, useNativeDriver: true }),
        ]),
      ]).start();
    });

    // Two expanding heart rings
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

    // Particles — fast stagger, big spread
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

    // Rising hearts
    hearts.forEach(h => {
      Animated.sequence([
        Animated.delay(h.delay),
        Animated.parallel([
          Animated.timing(h.opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.timing(h.y, { toValue: -H * 0.75, duration: 1800, useNativeDriver: true }),
          Animated.timing(h.x, { toValue: (Math.random() - 0.5) * 80, duration: 1800, useNativeDriver: true }),
          Animated.sequence([
            Animated.delay(1000),
            Animated.timing(h.opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
          ]),
        ]),
      ]).start();
    });

    // Title: explosive scale-in bounce
    Animated.sequence([
      Animated.delay(70),
      Animated.parallel([
        Animated.spring(titleScale, { toValue: 1, friction: 4, tension: 220, useNativeDriver: true }),
        Animated.timing(titleO, { toValue: 1, duration: 80, useNativeDriver: true }),
      ]),
    ]).start();

    // Subtitle
    Animated.sequence([
      Animated.delay(320),
      Animated.parallel([
        Animated.timing(subO, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(subY, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]),
    ]).start();

    // Hint
    Animated.sequence([
      Animated.delay(900),
      Animated.timing(hintO, { toValue: 0.5, duration: 300, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(playOutro, 2800);
    return () => clearTimeout(timer);
  }, []);

  const bgColor = bgPulse.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,0,0,0.88)', 'rgba(100,0,40,0.88)'],
  });

  return (
    <TouchableWithoutFeedback onPress={playOutro}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: outroOpacity }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: bgColor, opacity: bgO }]} />

        <Animated.View style={[StyleSheet.absoluteFill, styles.flash, { opacity: flash1O }]} pointerEvents="none" />
        <Animated.View style={[StyleSheet.absoluteFill, styles.flash, { opacity: flash2O }]} pointerEvents="none" />

        {/* Shockwave rings */}
        <View style={styles.center} pointerEvents="none">
          {rings.map((r, i) => (
            <Animated.View key={i} style={[styles.ring, { opacity: r.o, transform: [{ scale: r.s }] }]} />
          ))}
        </View>

        {/* Two expanding heart rings */}
        <View style={styles.center} pointerEvents="none">
          <Animated.Text style={[styles.heartRing, { opacity: heartRingO, transform: [{ scale: heartRingS }] }]}>♡</Animated.Text>
          <Animated.Text style={[styles.heartRing, { color: '#FF69B4', opacity: heartRing2O, transform: [{ scale: heartRing2S }] }]}>♡</Animated.Text>
        </View>

        {/* Particles */}
        <View style={styles.center} pointerEvents="none">
          {particles.map((p, i) => {
            const rotate = p.rotate.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', `${Math.random() > 0.5 ? 600 : -600}deg`],
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

        {/* Rising hearts */}
        {hearts.map((h, i) => (
          <Animated.Text key={i} pointerEvents="none" style={[styles.risingHeart, {
            left: W / 2 + h.startX,
            bottom: H * 0.12,
            opacity: h.opacity,
            transform: [{ translateY: h.y }, { translateX: h.x }, { scale: h.scale }],
          }]}>♥</Animated.Text>
        ))}

        {/* Text */}
        <View style={styles.textBlock} pointerEvents="none">
          <Animated.View style={{ opacity: titleO, transform: [{ scale: titleScale }] }}>
            <Text style={styles.titleLine1}>IT'S A</Text>
            <Text style={styles.titleLine2}>MATCH!</Text>
          </Animated.View>

          <Animated.Text style={[styles.sub, { opacity: subO, transform: [{ translateY: subY }] }]}>
            You and {profile.name} liked each other
          </Animated.Text>

          <Animated.View style={{ opacity: hintO }}>
            <TouchableOpacity onPress={onShootShot} activeOpacity={0.75} style={styles.shotBtn}>
              <Text style={styles.shotBtnText}>Tap to shoot your shot!</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
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
  risingHeart: {
    position: 'absolute',
    fontSize: 26,
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
  shotBtn: {
    marginTop: 8,
  },
  shotBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
