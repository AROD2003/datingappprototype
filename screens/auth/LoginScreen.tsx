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
	onGoToSignup: () => void;
};

export default function LoginScreen({ onGoToSignup }: Props) {
	const { signIn } = useAuth();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const btnScale = useRef(new Animated.Value(1)).current;

	function pressIn() {
		Animated.spring(btnScale, { toValue: 0.96, speed: 80, bounciness: 0, useNativeDriver: true }).start();
	}

	function pressOut() {
		Animated.spring(btnScale, { toValue: 1, speed: 15, bounciness: 14, useNativeDriver: true }).start();
	}

	async function handleLogin() {
		if (!email || !password) {
			setError('Please fill in all fields.');
			return;
		}
		setLoading(true);
		setError(null);
		const { error } = await signIn(email, password);
		if (error) setError(error);
		setLoading(false);
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
					<Text style={styles.tagline}>find your person</Text>
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

					<Animated.View style={[styles.btnWrapper, { transform: [{ scale: btnScale }] }]}>
						<Pressable onPressIn={pressIn} onPressOut={pressOut} onPress={handleLogin} disabled={loading}>
							<LinearGradient
								colors={['#FF2D55', '#FF6B8A']}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 0 }}
								style={styles.loginBtn}
							>
								{loading
									? <ActivityIndicator color="#fff" />
									: <Text style={styles.loginBtnText}>log in</Text>
								}
							</LinearGradient>
						</Pressable>
					</Animated.View>

					<View style={styles.dividerRow}>
						<View style={styles.divider} />
						<Text style={styles.dividerText}>or</Text>
						<View style={styles.divider} />
					</View>

					<Pressable style={styles.signupBtn} onPress={onGoToSignup}>
						<Text style={styles.signupText}>create an account</Text>
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
		marginBottom: 56,
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
	loginBtn: {
		paddingVertical: 17,
		alignItems: 'center',
		borderRadius: 14,
	},
	loginBtnText: {
		color: '#ffffff',
		fontSize: 16,
		fontWeight: '700',
		letterSpacing: 2,
		textTransform: 'lowercase',
	},
	dividerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		marginVertical: 4,
	},
	divider: {
		flex: 1,
		height: 1,
		backgroundColor: 'rgba(255,255,255,0.07)',
	},
	dividerText: {
		color: 'rgba(255,255,255,0.18)',
		fontSize: 12,
		letterSpacing: 2,
	},
	signupBtn: {
		alignItems: 'center',
		paddingVertical: 12,
	},
	signupText: {
		color: 'rgba(255,255,255,0.35)',
		fontSize: 14,
		letterSpacing: 1.5,
		textTransform: 'lowercase',
	},
});
