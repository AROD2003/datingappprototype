import { useState } from 'react';
import {
	Alert,
	Linking,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { supabase } from '../lib/supabase';

type Props = {
	onBack: () => void;
};

const SUPPORT_EMAIL = 'support@virt.app';

export default function SettingsScreen({ onBack }: Props) {
	const insets = useSafeAreaInsets();
	const { user, signOut } = useAuth();
	const { profile, updateProfile } = useProfile();

	const [hidden, setHidden] = useState(profile?.hidden ?? false);
	const [matchNotifs, setMatchNotifs] = useState(true);
	const [messageNotifs, setMessageNotifs] = useState(true);

	const toggleHidden = async (val: boolean) => {
		setHidden(val);
		await updateProfile({ hidden: val });
	};

	const handleChangeEmail = () => {
		Alert.prompt(
			'Change email',
			'Enter your new email address',
			async (newEmail) => {
				if (!newEmail?.trim()) return;
				const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
				if (error) Alert.alert('Error', error.message);
				else Alert.alert('Check your inbox', 'A confirmation link has been sent to your new email.');
			},
			'plain-text',
			user?.email ?? '',
		);
	};

	const handleChangePassword = () => {
		Alert.prompt(
			'Change password',
			'Enter your new password (min 6 characters)',
			async (newPassword) => {
				if (!newPassword || newPassword.length < 6) {
					Alert.alert('Too short', 'Password must be at least 6 characters.');
					return;
				}
				const { error } = await supabase.auth.updateUser({ password: newPassword });
				if (error) Alert.alert('Error', error.message);
				else Alert.alert('Done', 'Your password has been updated.');
			},
			'secure-text',
		);
	};

	const handleBugReport = () => {
		Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Bug Report&body=Describe the bug here...`);
	};

	const handleSuggestion = () => {
		Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Suggestion&body=My suggestion is...`);
	};

	const handleDeleteAccount = () => {
		Alert.alert(
			'Delete account',
			'This will permanently delete your profile, photos, matches, and messages. This cannot be undone.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						if (!user) return;
						// Delete profile (cascades to likes, matches, messages)
						await supabase.from('profiles').delete().eq('id', user.id);
						await signOut();
					},
				},
			],
		);
	};

	return (
		<View style={[styles.root, { paddingTop: insets.top }]}>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
					<Text style={styles.backIcon}>‹</Text>
				</TouchableOpacity>
				<Text style={styles.title}>Settings</Text>
				<View style={styles.backBtn} />
			</View>

			<ScrollView
				contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
				showsVerticalScrollIndicator={false}
			>
				{/* Account */}
				<SectionHeader label="Account" />
				<Row label="Email" value={user?.email ?? ''} onPress={handleChangeEmail} />
				<Row label="Change password" onPress={handleChangePassword} />

				{/* Discovery */}
				<SectionHeader label="Discovery" />
				<ToggleRow
					label="Show me in discovery"
					sublabel="Turn off to hide your profile from the feed"
					value={!hidden}
					onChange={(val) => toggleHidden(!val)}
				/>

				{/* Notifications */}
				<SectionHeader label="Notifications" />
				<ToggleRow
					label="New matches"
					value={matchNotifs}
					onChange={setMatchNotifs}
				/>
				<ToggleRow
					label="New messages"
					value={messageNotifs}
					onChange={setMessageNotifs}
				/>

				{/* Support */}
				<SectionHeader label="Support" />
				<Row label="Report a bug" onPress={handleBugReport} />
				<Row label="Send a suggestion" onPress={handleSuggestion} />

				{/* Legal */}
				<SectionHeader label="Legal" />
				<Row label="Privacy policy" onPress={() => Linking.openURL('https://virt.app/privacy')} />
				<Row label="Terms of service" onPress={() => Linking.openURL('https://virt.app/terms')} />

				{/* Account actions */}
				<SectionHeader label="" />
				<TouchableOpacity style={styles.logoutBtn} onPress={signOut} activeOpacity={0.7}>
					<Text style={styles.logoutText}>Log out</Text>
				</TouchableOpacity>

				<TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount} activeOpacity={0.7}>
					<Text style={styles.deleteText}>Delete account</Text>
				</TouchableOpacity>
			</ScrollView>
		</View>
	);
}

function SectionHeader({ label }: { label: string }) {
	return (
		<View style={styles.sectionHeader}>
			{label ? <Text style={styles.sectionLabel}>{label.toUpperCase()}</Text> : null}
		</View>
	);
}

function Row({ label, value, onPress }: { label: string; value?: string; onPress?: () => void }) {
	return (
		<TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
			<Text style={styles.rowLabel}>{label}</Text>
			<View style={styles.rowRight}>
				{value ? <Text style={styles.rowValue} numberOfLines={1}>{value}</Text> : null}
				<Text style={styles.chevron}>›</Text>
			</View>
		</TouchableOpacity>
	);
}

function ToggleRow({ label, sublabel, value, onChange }: {
	label: string;
	sublabel?: string;
	value: boolean;
	onChange: (val: boolean) => void;
}) {
	return (
		<View style={styles.row}>
			<View style={styles.toggleLabelWrap}>
				<Text style={styles.rowLabel}>{label}</Text>
				{sublabel ? <Text style={styles.rowSublabel}>{sublabel}</Text> : null}
			</View>
			<Switch
				value={value}
				onValueChange={onChange}
				trackColor={{ false: '#333', true: '#FF2D55' }}
				thumbColor="#fff"
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: '#0f0f0f',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingBottom: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: 'rgba(255,255,255,0.08)',
	},
	backBtn: {
		width: 40,
	},
	backIcon: {
		color: '#fff',
		fontSize: 40,
		fontWeight: '200',
		lineHeight: 40,
		marginTop: -4,
	},
	title: {
		color: '#fff',
		fontSize: 17,
		fontWeight: '700',
	},
	sectionHeader: {
		paddingHorizontal: 20,
		paddingTop: 28,
		paddingBottom: 8,
	},
	sectionLabel: {
		color: '#555',
		fontSize: 12,
		fontWeight: '700',
		letterSpacing: 1.2,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 20,
		paddingVertical: 16,
		backgroundColor: '#161616',
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: 'rgba(255,255,255,0.05)',
	},
	rowLabel: {
		color: '#fff',
		fontSize: 16,
	},
	rowSublabel: {
		color: '#555',
		fontSize: 12,
		marginTop: 3,
		maxWidth: 240,
	},
	rowRight: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		maxWidth: '50%',
	},
	rowValue: {
		color: '#555',
		fontSize: 14,
	},
	chevron: {
		color: '#444',
		fontSize: 22,
		fontWeight: '300',
	},
	toggleLabelWrap: {
		flex: 1,
		paddingRight: 12,
	},
	logoutBtn: {
		marginHorizontal: 20,
		marginTop: 32,
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.12)',
		borderRadius: 14,
		paddingVertical: 16,
		alignItems: 'center',
	},
	logoutText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
	deleteBtn: {
		marginHorizontal: 20,
		marginTop: 12,
		borderWidth: 1,
		borderColor: 'rgba(255,45,85,0.3)',
		borderRadius: 14,
		paddingVertical: 16,
		alignItems: 'center',
	},
	deleteText: {
		color: '#FF2D55',
		fontSize: 16,
		fontWeight: '600',
	},
});
