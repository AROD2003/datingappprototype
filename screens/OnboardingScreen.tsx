import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import {
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NumberPicker from '../components/NumberPicker';
import { useProfile } from '../context/ProfileContext';
import { INTERESTS_LIST, DISTANCES, GENDERS, LOOKING_FOR } from '../data/constants';

const TOTAL_STEPS = 5;

export default function OnboardingScreen() {
	const insets = useSafeAreaInsets();
	const { createProfile } = useProfile();

	const [step, setStep] = useState(1);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [name, setName] = useState('');
	const [age, setAge] = useState('');
	const [bio, setBio] = useState('');
	const [interests, setInterests] = useState<string[]>([]);
	const [gender, setGender] = useState('');
	const [lookingFor, setLookingFor] = useState('');
	const [distance, setDistance] = useState(25);
	const [ageMin, setAgeMin] = useState(18);
	const [ageMax, setAgeMax] = useState(35);
	const scrollRef = useRef<ScrollView>(null);

	const canNext = () => {
		if (step === 1) {
			const parsedAge = parseInt(age);
			return name.trim().length > 0 && parsedAge >= 18 && parsedAge <= 100;
		}
		if (step === 2) return true;
		if (step === 3) return interests.length > 0;
		if (step === 4) return gender !== '' && lookingFor !== '';
		if (step === 5) return true;
		return false;
	};

	const handleNext = async () => {
		if (step < TOTAL_STEPS) {
			setError(null);
			setStep(s => s + 1);
			return;
		}
		setLoading(true);
		setError(null);
		const { error } = await createProfile({
			name: name.trim(),
			age: parseInt(age),
			bio: bio.trim(),
			photos: [],
			interests,
			gender,
			looking_for: lookingFor,
			distance_preference: distance,
			age_min: ageMin,
			age_max: ageMax,
		});
		if (error) {
			setError(error);
			setLoading(false);
		}
	};

	const toggleInterest = (interest: string) => {
		setInterests(prev =>
			prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
		);
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			style={styles.root}
		>
			<View style={[styles.inner, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 }]}>

				{/* Progress */}
				<View style={styles.progress}>
					{Array.from({ length: TOTAL_STEPS }, (_, i) => (
						<View key={i} style={[styles.dot, i + 1 <= step && styles.dotActive]} />
					))}
				</View>

				<ScrollView
					ref={scrollRef}
					showsVerticalScrollIndicator={false}
					style={styles.content}
					contentContainerStyle={styles.contentInner}
					keyboardShouldPersistTaps="handled"
				>
					{step === 1 && (
						<>
							<Text style={styles.title}>What's your name?</Text>
							<TextInput
								style={styles.input}
								placeholder="First name"
								placeholderTextColor="rgba(255,255,255,0.22)"
								value={name}
								onChangeText={setName}
								autoCapitalize="words"
								autoCorrect={false}
							/>
							<Text style={[styles.title, { marginTop: 32 }]}>How old are you?</Text>
							<TextInput
								style={styles.input}
								placeholder="Age"
								placeholderTextColor="rgba(255,255,255,0.22)"
								value={age}
								onChangeText={t => setAge(t.replace(/[^0-9]/g, ''))}
								keyboardType="number-pad"
								maxLength={3}
							/>
						</>
					)}

					{step === 2 && (
						<>
							<Text style={styles.title}>Tell us about yourself</Text>
							<Text style={styles.subtitle}>This shows up on your profile</Text>
							<TextInput
								style={[styles.input, styles.bioInput]}
								placeholder="Write something interesting..."
								placeholderTextColor="rgba(255,255,255,0.22)"
								value={bio}
								onChangeText={setBio}
								multiline
								maxLength={300}
							/>
							<Text style={styles.charCount}>{bio.length}/300</Text>
						</>
					)}

					{step === 3 && (
						<>
							<Text style={styles.title}>What are you into?</Text>
							<Text style={styles.subtitle}>Pick at least one</Text>
							<View style={styles.tagsGrid}>
								{INTERESTS_LIST.map(interest => (
									<TouchableOpacity
										key={interest}
										style={[styles.tag, interests.includes(interest) && styles.tagActive]}
										onPress={() => toggleInterest(interest)}
										activeOpacity={0.7}
									>
										<Text style={[styles.tagText, interests.includes(interest) && styles.tagTextActive]}>
											{interest}
										</Text>
									</TouchableOpacity>
								))}
							</View>
						</>
					)}

					{step === 4 && (
						<>
							<Text style={styles.title}>I am a...</Text>
							<View style={styles.optionRow}>
								{GENDERS.map(g => (
									<TouchableOpacity
										key={g}
										style={[styles.optionBtn, gender === g && styles.optionBtnActive]}
										onPress={() => setGender(g)}
										activeOpacity={0.7}
									>
										<Text style={[styles.optionText, gender === g && styles.optionTextActive]}>{g}</Text>
									</TouchableOpacity>
								))}
							</View>

							<Text style={[styles.title, { marginTop: 36 }]}>Looking for...</Text>
							<View style={styles.optionRow}>
								{LOOKING_FOR.map(l => (
									<TouchableOpacity
										key={l}
										style={[styles.optionBtn, lookingFor === l && styles.optionBtnActive]}
										onPress={() => setLookingFor(l)}
										activeOpacity={0.7}
									>
										<Text style={[styles.optionText, lookingFor === l && styles.optionTextActive]}>{l}</Text>
									</TouchableOpacity>
								))}
							</View>
						</>
					)}

					{step === 5 && (
						<>
							<Text style={styles.title}>Max distance</Text>
							<View style={styles.optionRow}>
								{DISTANCES.map(d => (
									<TouchableOpacity
										key={d}
										style={[styles.optionBtn, distance === d && styles.optionBtnActive]}
										onPress={() => setDistance(d)}
										activeOpacity={0.7}
									>
										<Text style={[styles.optionText, distance === d && styles.optionTextActive]}>{d} mi</Text>
									</TouchableOpacity>
								))}
							</View>

							<Text style={[styles.title, { marginTop: 36 }]}>Age range</Text>
							<View style={styles.ageRange}>
								<View style={styles.ageRow}>
									<Text style={styles.ageLabel}>Min</Text>
									<NumberPicker
										value={ageMin}
										onChange={setAgeMin}
										min={18}
										max={99}
										disabledAbove={ageMax}
									/>
								</View>
								<View style={styles.ageRow}>
									<Text style={styles.ageLabel}>Max</Text>
									<NumberPicker
										value={ageMax}
										onChange={setAgeMax}
										min={18}
										max={100}
										disabledBelow={ageMin}
									/>
								</View>
							</View>
						</>
					)}

					{error && (
						<View style={styles.errorBox}>
							<Text style={styles.errorText}>{error}</Text>
						</View>
					)}
				</ScrollView>

				{/* Navigation */}
				<View style={styles.navRow}>
					{step > 1 && (
						<TouchableOpacity style={styles.backBtn} onPress={() => setStep(s => s - 1)}>
							<Text style={styles.backBtnText}>Back</Text>
						</TouchableOpacity>
					)}
					<Pressable
						style={[styles.nextBtnWrapper, !canNext() && { opacity: 0.4 }, step === 1 && { flex: 1 }]}
						onPress={handleNext}
						disabled={!canNext() || loading}
					>
						<LinearGradient
							colors={['#FF2D55', '#FF6B8A']}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 0 }}
							style={styles.nextBtn}
						>
							{loading
								? <ActivityIndicator color="#fff" />
								: <Text style={styles.nextBtnText}>{step === TOTAL_STEPS ? "let's go ♥" : 'Next'}</Text>
							}
						</LinearGradient>
					</Pressable>
				</View>

			</View>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: '#0f0f0f',
	},
	inner: {
		flex: 1,
		paddingHorizontal: 24,
	},
	progress: {
		flexDirection: 'row',
		gap: 8,
		justifyContent: 'center',
		marginBottom: 36,
	},
	dot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: '#2a2a2a',
	},
	dotActive: {
		backgroundColor: '#FF2D55',
		width: 24,
		borderRadius: 4,
	},
	content: {
		flex: 1,
	},
	contentInner: {
		paddingBottom: 16,
	},
	title: {
		color: '#fff',
		fontSize: 24,
		fontWeight: '800',
		marginBottom: 16,
	},
	subtitle: {
		color: 'rgba(255,255,255,0.4)',
		fontSize: 14,
		marginTop: -10,
		marginBottom: 16,
	},
	input: {
		backgroundColor: '#1e1e1e',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.07)',
		borderRadius: 14,
		paddingVertical: 16,
		paddingHorizontal: 20,
		color: '#fff',
		fontSize: 16,
	},
	bioInput: {
		height: 140,
		textAlignVertical: 'top',
	},
	charCount: {
		color: 'rgba(255,255,255,0.25)',
		fontSize: 12,
		textAlign: 'right',
		marginTop: 6,
	},
	tagsGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 10,
	},
	tag: {
		backgroundColor: '#1e1e1e',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.12)',
		borderRadius: 20,
		paddingHorizontal: 16,
		paddingVertical: 9,
	},
	tagActive: {
		backgroundColor: 'rgba(255,45,85,0.15)',
		borderColor: '#FF2D55',
	},
	tagText: {
		color: 'rgba(255,255,255,0.55)',
		fontSize: 14,
		fontWeight: '500',
	},
	tagTextActive: {
		color: '#FF2D55',
		fontWeight: '700',
	},
	optionRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 10,
	},
	optionBtn: {
		backgroundColor: '#1e1e1e',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.12)',
		borderRadius: 12,
		paddingHorizontal: 20,
		paddingVertical: 12,
	},
	optionBtnActive: {
		backgroundColor: 'rgba(255,45,85,0.15)',
		borderColor: '#FF2D55',
	},
	optionText: {
		color: 'rgba(255,255,255,0.55)',
		fontSize: 15,
		fontWeight: '500',
	},
	optionTextActive: {
		color: '#FF2D55',
		fontWeight: '700',
	},
	ageRange: {
		flexDirection: 'row',
		gap: 4,
	},
	ageRow: {
		flex: 1,
		gap: 8,
	},
	ageLabel: {
		color: 'rgba(255,255,255,0.4)',
		fontSize: 12,
		fontWeight: '700',
		letterSpacing: 1,
		textTransform: 'uppercase',
		textAlign: 'center',
	},
	errorBox: {
		backgroundColor: 'rgba(255,45,85,0.12)',
		borderWidth: 1,
		borderColor: 'rgba(255,45,85,0.3)',
		borderRadius: 12,
		padding: 12,
		marginTop: 16,
	},
	errorText: {
		color: '#FF2D55',
		fontSize: 13,
		textAlign: 'center',
	},
	navRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingTop: 16,
	},
	backBtn: {
		paddingVertical: 16,
		paddingHorizontal: 8,
	},
	backBtnText: {
		color: 'rgba(255,255,255,0.4)',
		fontSize: 16,
		fontWeight: '600',
	},
	nextBtnWrapper: {
		flex: 1,
		borderRadius: 14,
		overflow: 'hidden',
	},
	nextBtn: {
		paddingVertical: 17,
		alignItems: 'center',
		borderRadius: 14,
	},
	nextBtnText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '700',
		letterSpacing: 1,
	},
});
