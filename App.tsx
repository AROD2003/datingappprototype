import { useEffect, useRef, useState } from 'react';
import { useFonts, LilitaOne_400Regular } from '@expo-google-fonts/lilita-one';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProfileProvider, useProfile } from './context/ProfileContext';
import ErrorBoundary from './components/ErrorBoundary';
import { supabase } from './lib/supabase';
import { Profile } from './data/profiles';
import { registerPushToken, sendPushNotification } from './lib/notifications';
import FeedScreen from './screens/FeedScreen';
import MatchesScreen, { MatchesScreenHandle } from './screens/MatchesScreen';
import MyProfileScreen from './screens/MyProfileScreen';
import ChatScreen from './screens/ChatScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import LoginScreen from './screens/auth/LoginScreen';
import SignupScreen from './screens/auth/SignupScreen';

type Tab = 'feed' | 'matches' | 'profile';

function BottomBar({
	active,
	onPress,
	matchCount,
}: {
	active: Tab;
	onPress: (t: Tab) => void;
	matchCount: number;
}) {
	const tabs: { id: Tab; icon: string; activeIcon: string; label: string }[] = [
		{ id: 'feed', icon: '🔥', activeIcon: '🔥', label: 'Discover' },
		{ id: 'matches', icon: '🤍', activeIcon: '🤍', label: 'Matches' },
		{ id: 'profile', icon: '👤', activeIcon: '👤', label: 'Profile' },
	];

	return (
		<View style={[styles.bar, { paddingBottom: 12 }]}>
			{tabs.map(tab => (
				<TouchableOpacity
					key={tab.id}
					style={styles.tabBtn}
					onPress={() => onPress(tab.id)}
					activeOpacity={0.7}
				>
					<View style={styles.iconWrap}>
						{tab.id === 'feed' ? (
							<View style={[styles.discoverRow, { opacity: active === tab.id ? 1 : 0.4 }]}>
								<Text style={styles.discoverText}>D</Text>
								<View style={styles.discoverIWrap}>
									<Text style={styles.discoverHeart}>♥</Text>
									<Text style={styles.discoverText}>ı</Text>
								</View>
								<Text style={styles.discoverText}>scover</Text>
							</View>
						) : tab.id === 'profile' ? (
							<View style={[styles.discoverRow, active === tab.id ? { opacity: 1 } : { opacity: 0.4 }]}>
								<Text style={styles.discoverText}>Prof</Text>
								<View style={styles.discoverIWrap}>
									<Text style={styles.discoverHeart}>♥</Text>
									<Text style={styles.discoverText}>ı</Text>
								</View>
								<Text style={styles.discoverText}>le</Text>
							</View>
						) : tab.id === 'matches' ? (
							<Text style={[styles.matchHeart, !(active === tab.id) && { opacity: 0.4 }]}>
								♥
							</Text>
						) : (
							<Text style={[styles.tabIcon, active === tab.id && styles.tabIconActive]}>
								{tab.icon}
							</Text>
						)}
						{tab.id === 'matches' && matchCount > 0 && (
							<View style={styles.badge}>
								<Text style={styles.badgeText}>{matchCount > 9 ? '9+' : matchCount}</Text>
							</View>
						)}
					</View>
					{tab.id === 'matches' && (
						<Text style={[styles.tabLabel, active === tab.id && styles.tabLabelActive]}>
							{tab.label}
						</Text>
					)}
				</TouchableOpacity>
			))}
		</View>
	);
}

function Main() {
	const { user } = useAuth();
	const { profile } = useProfile();
	const [activeTab, setActiveTab] = useState<Tab>('feed');
	const [matches, setMatches] = useState<Profile[]>([]);
	const [matchIds, setMatchIds] = useState<Record<string, string>>({});

	useEffect(() => {
		if (!user) return;
		registerPushToken(user.id);
		supabase
			.from('matches')
			.select('id, user1_id, user2_id')
			.or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
			.then(async ({ data: matchRows }) => {
				if (!matchRows || matchRows.length === 0) return;
				const rows = matchRows as { id: string; user1_id: string; user2_id: string }[];
				const otherIds = rows.map(m =>
					m.user1_id === user.id ? m.user2_id : m.user1_id
				);
				const { data: profileRows } = await supabase
					.from('profiles')
					.select('id, name, age, bio, photos, interests')
					.in('id', otherIds);
				if (!profileRows) return;
				const idMap: Record<string, string> = {};
				rows.forEach(m => {
					const otherId = m.user1_id === user.id ? m.user2_id : m.user1_id;
					idMap[otherId] = m.id;
				});
				setMatches(profileRows as Profile[]);
				setMatchIds(idMap);
			});
	}, [user]);

	const [chatProfile, setChatProfile] = useState<Profile | null>(null);
	const matchesRef = useRef<MatchesScreenHandle>(null);

	const handleMatch = (matched: Profile, matchId: string) => {
		setMatches(prev => {
			if (prev.find(p => p.id === matched.id)) return prev;
			return [matched, ...prev];
		});
		if (matchId) {
			setMatchIds(prev => ({ ...prev, [matched.id]: matchId }));
		}
		// Notify the other person they got a match
		sendPushNotification(matched.id, "You've got a match! 💘", `${profile?.name ?? 'Someone'} liked you back`);
	};

	const handleShootShot = (_profile: Profile) => {
		setActiveTab('matches');
		setTimeout(() => matchesRef.current?.goToMessages(), 100);
	};

	if (chatProfile) {
		return (
			<View style={styles.root}>
				<ChatScreen
					matchProfile={chatProfile}
					matchId={matchIds[chatProfile.id] ?? null}
					onBack={() => setChatProfile(null)}
				/>
			</View>
		);
	}

	return (
		<View style={styles.root}>
			{activeTab === 'feed' && <FeedScreen onMatch={handleMatch} onShootShot={handleShootShot} />}
			{activeTab === 'matches' && (
				<MatchesScreen
					ref={matchesRef}
					matches={matches}
					matchIds={matchIds}
					isPremium={profile?.is_premium ?? false}
					userId={user?.id ?? ''}
					onOpenChat={setChatProfile}
				/>
			)}
			{activeTab === 'profile' && <MyProfileScreen />}

			<BottomBar
				active={activeTab}
				onPress={setActiveTab}
				matchCount={matches.length}
			/>
		</View>
	);
}

function RootNavigator() {
	const { session, loading: authLoading } = useAuth();
	const { hasProfile, loading: profileLoading } = useProfile();
	const [authScreen, setAuthScreen] = useState<'login' | 'signup'>('login');

	if (authLoading || (session && profileLoading)) {
		return (
			<View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
				<ActivityIndicator color="#FF2D55" />
			</View>
		);
	}

	if (!session) {
		return authScreen === 'login'
			? <LoginScreen onGoToSignup={() => setAuthScreen('signup')} />
			: <SignupScreen onGoToLogin={() => setAuthScreen('login')} />;
	}

	if (!hasProfile) {
		return <OnboardingScreen />;
	}

	return <Main />;
}

export default function App() {
	const [fontsLoaded] = useFonts({ LilitaOne_400Regular });
	if (!fontsLoaded) return null;

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaProvider>
				<ErrorBoundary>
					<AuthProvider>
						<ProfileProvider>
							<RootNavigator />
						</ProfileProvider>
					</AuthProvider>
				</ErrorBoundary>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: '#0f0f0f',
	},
	bar: {
		position: 'absolute',
		bottom: 18,
		left: 20,
		right: 20,
		flexDirection: 'row',
		backgroundColor: 'rgba(18,18,18,0.96)',
		borderRadius: 36,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: 'rgba(255,255,255,0.08)',
		paddingTop: 10,
		overflow: 'hidden',
	},
	tabBtn: {
		flex: 1,
		alignItems: 'center',
		gap: 3,
	},
	iconWrap: {
		position: 'relative',
	},
	tabIcon: {
		fontSize: 24,
		opacity: 0.4,
	},
	matchHeart: {
		color: '#ffffff',
		fontSize: 40,
		textShadowColor: 'rgba(255,255,255,0.9)',
		textShadowOffset: { width: 0, height: 0 },
		textShadowRadius: 6,
	},
	discoverRow: {
		flexDirection: 'row',
		alignItems: 'flex-end',
	},
	discoverIWrap: {
		alignItems: 'center',
	},
	discoverHeart: {
		color: '#fff',
		fontSize: 10,
		lineHeight: 11,
		marginBottom: -4,
	},
	discoverText: {
		color: '#fff',
		fontSize: 17,
		fontWeight: '700',
		lineHeight: 18,
		letterSpacing: -0.5,
	},
	tabIconActive: {
		opacity: 1,
	},
	tabLabel: {
		color: '#555',
		fontSize: 11,
		fontWeight: '500',
	},
	tabLabelActive: {
		color: '#fff',
	},
	badge: {
		position: 'absolute',
		top: -4,
		right: -8,
		backgroundColor: '#FF2D55',
		borderRadius: 8,
		minWidth: 16,
		height: 16,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 4,
	},
	badgeText: {
		color: '#fff',
		fontSize: 10,
		fontWeight: '800',
	},
});
