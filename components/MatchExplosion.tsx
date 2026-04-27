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

const TAB_HEART_X = W / 2;
const TAB_HEART_Y = H - 52;

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

// Suck hearts spawn spread around the explosion area, matching the visual radius of particles
const SUCK_COUNT = 36;
type SuckHeart = {
  opacity: Animated.Value;
  scale: Animated.Value;
  x: Animated.Value; // absolute translateX from startX to target
  y: Animated.Value; // absolute translateY from startY to target
  startX: number;
  startY: number;
  spawnDelay: number; // when to appear (relative to suck phase start)
  travelDur: number;
  size: number;
  color: string;
};

const SUCK_COLORS = ['#FF2D55', '#FF6B6B', '#FF69B4', '#FF3CAC', '#FF1493', '#FF80AB'];

function makeSuckHearts(): SuckHeart[] {
  return Array.from({ length: SUCK_COUNT }, (_, i) => {
    const angle = (i / SUCK_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
    const dist = W * (0.1 + Math.random() * 0.45);
    const startX = W / 2 + Math.cos(angle) * dist;
    const startY = H / 2 + Math.sin(angle) * dist * 0.75;
    return {
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.3 + Math.random() * 0.7),
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      startX,
      startY,
      spawnDelay: Math.random() * 350,
      travelDur: 550 + Math.random() * 350,
      size: 8 + Math.random() * 12,
      color: SUCK_COLORS[i % SUCK_COLORS.length],
    };
  });
}

type Props = { profile: Profile; onDismiss: () => void; onShootShot: () => void };

export default function MatchExplosion({ profile, onDismiss, onShootShot }: Props) {
  const particles = useRef<Particle[]>(makeParticles()).current;
  const hearts = useRef<RisingHeart[]>(makeRisingHearts()).current;
  const suckHearts = useRef<SuckHeart[]>(makeSuckHearts()).current;

  const rings = useRef(
    Array.from({ length: 5 }, () => ({ s: new Animated.Value(0.1), o: new Animated.Value(1) }))
  ).current;

  const heartRingS = useRef(new Animated.Value(0)).current;
  const heartRingO = useRef(new Animated.Value(1)).current;
  const heartRing2S = useRef(new Animated.Value(0)).current;
  const heartRing2O = useRef(new Animated.Value(0.7)).current;

  const flash1O = useRef(new Animated.Value(0)).current;
  const flash2O = useRef(new Animated.Value(0)).current;
  const bgO = useRef(new Animated.Value(0)).current;
  const bgPulse = useRef(new Animated.Value(0)).current;

  const titleScale = useRef(new Animated.Value(0)).current;
  const titleO = useRef(new Animated.Value(0)).current;
  const subO = useRef(new Animated.Value(0)).current;
  const subY = useRef(new Animated.Value(20)).current;
  const hintO = useRef(new Animated.Value(0)).current;

  // Separate fade for main explosion content vs suck layer
  const mainOpacity = useRef(new Animated.Value(1)).current;
  const outroRunning = useRef(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startSuckPhase = (fast = false) => {
    // Fade out the explosion content
    Animated.timing(mainOpacity, {
      toValue: 0,
      duration: fast ? 200 : 500,
      useNativeDriver: true,
    }).start();

    // Animate every suck heart to converge on the matches icon
    suckHearts.forEach(h => {
      const dx = TAB_HEART_X - h.startX;
      const dy = TAB_HEART_Y - h.startY;
      const delay = fast ? h.spawnDelay * 0.3 : h.spawnDelay;
      const dur = fast ? h.travelDur * 0.6 : h.travelDur;

      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          // Appear
          Animated.timing(h.opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
          // Travel toward target with acceleration
          Animated.timing(h.x, { toValue: dx, duration: dur, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.timing(h.y, { toValue: dy, duration: dur, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          // Shrink + fade as they arrive
          Animated.sequence([
            Animated.delay(dur * 0.5),
            Animated.parallel([
              Animated.timing(h.scale, { toValue: 0, duration: dur * 0.5, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
              Animated.timing(h.opacity, { toValue: 0, duration: dur * 0.5, useNativeDriver: true }),
            ]),
          ]),
        ]),
      ]).start();
    });

    const totalDur = fast ? 900 : 1400;
    dismissTimer.current = setTimeout(() => onDismiss(), totalDur);
  };

  const playOutro = () => {
    if (outroRunning.current) return;
    outroRunning.current = true;
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    startSuckPhase(true);
  };

  useEffect(() => {
    // Flash
    Animated.sequence([
      Animated.timing(flash1O, { toValue: 1, duration: 40, useNativeDriver: true }),
      Animated.timing(flash1O, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.delay(80),
      Animated.timing(flash2O, { toValue: 0.5, duration: 30, useNativeDriver: true }),
      Animated.timing(flash2O, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start();

    // BG
    Animated.timing(bgO, { toValue: 0.88, duration: 100, useNativeDriver: true }).start(() => {
      Animated.loop(Animated.sequence([
        Animated.timing(bgPulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(bgPulse, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])).start();
    });

    // Shockwave rings
    rings.forEach((r, i) => {
      Animated.sequence([
        Animated.delay(i * 60),
        Animated.parallel([
          Animated.timing(r.s, { toValue: 12, duration: 550, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(r.o, { toValue: 0, duration: 550, useNativeDriver: true }),
        ]),
      ]).start();
    });

    // Heart rings
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

    // Particles
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

    // Text
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

    Animated.sequence([
      Animated.delay(900),
      Animated.timing(hintO, { toValue: 0.5, duration: 300, useNativeDriver: true }),
    ]).start();

    // Suck hearts begin appearing while the explosion is still visible (overlap)
    // They fade in at their scattered positions as the explosion is winding down
    const preSpawnTimer = setTimeout(() => {
      suckHearts.forEach(h => {
        Animated.sequence([
          Animated.delay(h.spawnDelay),
          Animated.timing(h.opacity, { toValue: 0.7, duration: 200, useNativeDriver: true }),
        ]).start();
      });
    }, 1400);

    // Then kick off the full suck-in convergence
    const suckTimer = setTimeout(() => {
      if (!outroRunning.current) {
        outroRunning.current = true;
        startSuckPhase(false);
      }
    }, 2000);

    return () => {
      clearTimeout(preSpawnTimer);
      clearTimeout(suckTimer);
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, []);

  const bgColor = bgPulse.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,0,0,0.88)', 'rgba(100,0,40,0.88)'],
  });

  return (
    <TouchableWithoutFeedback onPress={playOutro}>
      <View style={StyleSheet.absoluteFill}>

        {/* Main explosion — fades out as suck hearts converge */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: mainOpacity }]}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: bgColor, opacity: bgO }]} />
          <Animated.View style={[StyleSheet.absoluteFill, styles.flash, { opacity: flash1O }]} pointerEvents="none" />
          <Animated.View style={[StyleSheet.absoluteFill, styles.flash, { opacity: flash2O }]} pointerEvents="none" />

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

          {hearts.map((h, i) => (
            <Animated.Text key={i} pointerEvents="none" style={[styles.risingHeart, {
              left: W / 2 + h.startX,
              bottom: H * 0.12,
              opacity: h.opacity,
              transform: [{ translateY: h.y }, { translateX: h.x }, { scale: h.scale }],
            }]}>♥</Animated.Text>
          ))}

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
                <Text style={styles.shotBtnText}>Shoot your shot!</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Suck hearts — rendered above main content so they persist through the fade */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {suckHearts.map((h, i) => (
            <Animated.Text key={i} style={{
              position: 'absolute',
              left: h.startX,
              top: h.startY,
              fontSize: h.size,
              color: h.color,
              opacity: h.opacity,
              transform: [{ translateX: h.x }, { translateY: h.y }, { scale: h.scale }],
            }}>♥</Animated.Text>
          ))}
        </View>

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
  shotBtn: { marginTop: 8 },
  shotBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
