import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import {
	ActivityIndicator,
	Animated,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

type Props = {
	onGoToLogin: () => void;
};

export default function SignupScreen({ onGoToLogin }: Props) {
	const { signUp } = useAuth();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');
	const [focusedField, setFocusedField] = useState<'email' | 'password' | 'confirm' | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const btnScale = useRef(new Animated.Value(1)).current;

	function pressIn() {
		Animated.spring(btnScale, { toValue: 0.96, speed: 80, bounciness: 0, useNativeDriver: true }).start();
	}

	function pressOut() {
		Animated.spring(btnScale, { toValue: 1, speed: 15, bounciness: 14, useNativeDriver: true }).start();
	}

	async function handleSignup() {
		if (!email || !password || !confirm) {
			setError('Please fill in all fields.');
			return;
		}
		if (password !== confirm) {
			setError('Passwords do not match.');
			return;
		}
		if (password.length < 6) {
			setError('Password must be at least 6 characters.');
			return;
		}
		setLoading(true);
		setError(null);
		const { error } = await signUp(email, password);
		if (error) {
			setError(error);
		} else {
			setSuccess(true);
		}
		setLoading(false);
	}

	if (success) {
		return (
			<View style={styles.root}>
				<View style={styles.successContainer}>
					<Text style={styles.successHeart}>♥</Text>
					<Text style={styles.successTitle}>you're in</Text>
					<Text style={styles.successSub}>welcome to virt{'\n'}log in to get started</Text>
					<Pressable onPress={onGoToLogin} style={styles.backBtn}>
						<Text style={styles.backBtnText}>go to log in</Text>
					</Pressable>
				</View>
			</View>
		);
	}

	return (
		<View style={styles.root}>
			<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>

				{/* Logo */}
				<View style={styles.logoSection}>
					<View style={styles.logoRow}>
						<Text style={styles.logoText}>V</Text>
						<View style={styles.iWrap}>
							<Text style={styles.logoHeart}>♥</Text>
							<Text style={styles.logoText}>I</Text>
						</View>
						<Text style={styles.logoText}>RT</Text>
					</View>
					<Text style={styles.tagline}>join the community</Text>
				</View>

				{/* Form */}
				<View style={styles.form}>
					{error && (
						<View style={styles.errorBox}>
							<Text style={styles.errorText}>{error}</Text>
						</View>
					)}

					<TextInput
						style={[styles.input, focusedField === 'email' && styles.inputFocused]}
						placeholder="email"
						placeholderTextColor="rgba(255,255,255,0.22)"
						value={email}
						onChangeText={setEmail}
						onFocus={() => setFocusedField('email')}
						onBlur={() => setFocusedField(null)}
						keyboardType="email-address"
						autoCapitalize="none"
						autoCorrect={false}
					/>
					<TextInput
						style={[styles.input, focusedField === 'password' && styles.inputFocused]}
						placeholder="password"
						placeholderTextColor="rgba(255,255,255,0.22)"
						value={password}
						onChangeText={setPassword}
						onFocus={() => setFocusedField('password')}
						onBlur={() => setFocusedField(null)}
						secureTextEntry
					/>
					<TextInput
						style={[styles.input, focusedField === 'confirm' && styles.inputFocused]}
						placeholder="confirm password"
						placeholderTextColor="rgba(255,255,255,0.22)"
						value={confirm}
						onChangeText={setConfirm}
						onFocus={() => setFocusedField('confirm')}
						onBlur={() => setFocusedField(null)}
						secureTextEntry
					/>

					<Animated.View style={[styles.btnWrapper, { transform: [{ scale: btnScale }] }]}>
						<Pressable onPressIn={pressIn} onPressOut={pressOut} onPress={handleSignup} disabled={loading}>
							<LinearGradient
								colors={['#FF2D55', '#FF6B8A']}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 0 }}
								style={styles.signupBtn}
							>
								{loading
									? <ActivityIndicator color="#fff" />
									: <Text style={styles.signupBtnText}>create account</Text>
								}
							</LinearGradient>
						</Pressable>
					</Animated.View>

					<Pressable style={styles.loginLink} onPress={onGoToLogin}>
						<Text style={styles.loginLinkText}>already have an account? log in</Text>
					</Pressable>
				</View>

			</KeyboardAvoidingView>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: '#0f0f0f',
	},
	inner: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 32,
	},
	logoSection: {
		alignItems: 'center',
		marginBottom: 48,
	},
	logoRow: {
		flexDirection: 'row',
		alignItems: 'flex-end',
	},
	logoText: {
		color: '#fff',
		fontSize: 52,
		fontWeight: '900',
		letterSpacing: 4,
	},
	iWrap: {
		alignItems: 'center',
	},
	logoHeart: {
		color: '#FF2D55',
		fontSize: 16,
		lineHeight: 18,
		marginBottom: -4,
	},
	tagline: {
		color: 'rgba(255,255,255,0.18)',
		fontSize: 13,
		letterSpacing: 4,
		marginTop: 14,
		textTransform: 'lowercase',
	},
	form: {
		width: '100%',
		gap: 14,
	},
	errorBox: {
		backgroundColor: 'rgba(255, 45, 85, 0.12)',
		borderWidth: 1,
		borderColor: 'rgba(255, 45, 85, 0.3)',
		borderRadius: 12,
		padding: 12,
	},
	errorText: {
		color: '#FF2D55',
		fontSize: 13,
		textAlign: 'center',
	},
	input: {
		backgroundColor: '#1e1e1e',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.07)',
		borderRadius: 14,
		paddingVertical: 16,
		paddingHorizontal: 20,
		color: '#ffffff',
		fontSize: 15,
		letterSpacing: 0.5,
	},
	inputFocused: {
		borderColor: '#FF2D55',
		backgroundColor: 'rgba(255, 45, 85, 0.06)',
	},
	btnWrapper: {
		borderRadius: 14,
		overflow: 'hidden',
		marginTop: 4,
	},
	signupBtn: {
		paddingVertical: 17,
		alignItems: 'center',
		borderRadius: 14,
	},
	signupBtnText: {
		color: '#ffffff',
		fontSize: 16,
		fontWeight: '700',
		letterSpacing: 2,
		textTransform: 'lowercase',
	},
	loginLink: {
		alignItems: 'center',
		paddingVertical: 12,
	},
	loginLinkText: {
		color: 'rgba(255,255,255,0.35)',
		fontSize: 14,
		letterSpacing: 1,
		textTransform: 'lowercase',
	},
	successContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 32,
		gap: 16,
	},
	successHeart: {
		color: '#FF2D55',
		fontSize: 64,
		marginBottom: 8,
	},
	successTitle: {
		color: '#fff',
		fontSize: 28,
		fontWeight: '800',
		letterSpacing: 3,
		textTransform: 'lowercase',
	},
	successSub: {
		color: 'rgba(255,255,255,0.4)',
		fontSize: 14,
		textAlign: 'center',
		lineHeight: 22,
		letterSpacing: 0.5,
	},
	backBtn: {
		marginTop: 16,
		paddingVertical: 12,
		paddingHorizontal: 32,
		borderWidth: 1,
		borderColor: '#FF2D55',
		borderRadius: 50,
	},
	backBtnText: {
		color: '#FF2D55',
		fontSize: 14,
		letterSpacing: 1.5,
		textTransform: 'lowercase',
	},
});
