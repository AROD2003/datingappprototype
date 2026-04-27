import { useRef, useState } from 'react';
import {
	ActivityIndicator,
	Dimensions,
	Image,
	Modal,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import NumberPicker from '../components/NumberPicker';
import { INTERESTS_LIST, DISTANCES } from '../data/constants';
import { uploadPhoto, isLocalUri } from '../lib/storage';

export default function MyProfileScreen() {
	const insets = useSafeAreaInsets();
	const { signOut, user } = useAuth();
	const { profile, updateProfile } = useProfile();

	const [editing, setEditing] = useState(false);
	const [saving, setSaving] = useState(false);
	const [previewing, setPreviewing] = useState(false);

	const [name, setName] = useState('');
	const [bio, setBio] = useState('');
	const [interests, setInterests] = useState<string[]>([]);
	const [distance, setDistance] = useState(25);
	const [ageMin, setAgeMin] = useState(18);
	const [ageMax, setAgeMax] = useState(35);
	const [photos, setPhotos] = useState<(string | null)[]>(Array(6).fill(null));
	const [photoBase64s, setPhotoBase64s] = useState<(string | null)[]>(Array(6).fill(null));
	const scrollRef = useRef<ScrollView>(null);

	const TILE_SIZE = (Dimensions.get('window').width - 40 - 16) / 3;

	if (!profile) return null;

	const startEdit = () => {
		setName(profile.name);
		setBio(profile.bio ?? '');
		setInterests(profile.interests ?? []);
		setDistance(profile.distance_preference ?? 25);
		setAgeMin(profile.age_min ?? 18);
		setAgeMax(profile.age_max ?? 35);
		const existing = profile.photos ?? [];
		setPhotos([...existing, ...Array(6 - existing.length).fill(null)].slice(0, 6));
		setPhotoBase64s(Array(6).fill(null));
		setEditing(true);
	};

	const cancelEdit = () => { setEditing(false); setPhotoBase64s(Array(6).fill(null)); };

	const saveEdit = async () => {
		if (!user) return;
		setSaving(true);

		// Upload any locally picked photos to Supabase Storage
		const finalPhotos = await Promise.all(
			photos.map(async (uri, i) => {
				if (!uri) return null;
				if (isLocalUri(uri)) {
					const base64 = photoBase64s[i];
						if (!base64) return uri;
					const uploaded = await uploadPhoto(user.id, uri, base64);
					return uploaded ?? uri;
				}
				return uri; // already a remote URL
			})
		);

		await updateProfile({
			name: name.trim(),
			bio: bio.trim(),
			interests,
			distance_preference: distance,
			age_min: ageMin,
			age_max: ageMax,
			photos: finalPhotos.filter(Boolean) as string[],
		});
		setSaving(false);
		setEditing(false);
	};

	const pickPhoto = async (index: number) => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ['images'],
			allowsEditing: true,
			aspect: [3, 4],
			quality: 0.85,
			base64: true,
		});
		if (!result.canceled && result.assets[0]) {
			const asset = result.assets[0];
			setPhotos(prev => {
				const next = [...prev];
				next[index] = asset.uri;
				return next;
			});
			setPhotoBase64s(prev => {
				const next = [...prev];
				next[index] = asset.base64 ?? null;
				return next;
			});
		}
	};

	const removePhoto = (index: number) => {
		setPhotos(prev => {
			const next = [...prev];
			next[index] = null;
			return next;
		});
	};

	const toggleInterest = (interest: string) => {
		setInterests(prev =>
			prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
		);
	};

	const displayPhotos: (string | null)[] = [
		...(profile.photos ?? []),
		...Array(Math.max(0, 6 - (profile.photos?.length ?? 0))).fill(null),
	].slice(0, 6);

	const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=FF2D55&color=fff&size=400`;

	return (
		<View style={styles.container}>
			<ScrollView
				ref={scrollRef}
				style={styles.flex}
				contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 100 }}
				showsVerticalScrollIndicator={false}
			>
				{/* Header */}
				<View style={styles.headerRow}>
					<Text style={styles.heading}>Profile</Text>
					{editing ? (
						<View style={styles.editActions}>
							<TouchableOpacity onPress={cancelEdit} style={styles.cancelBtn}>
								<Text style={styles.cancelText}>Cancel</Text>
							</TouchableOpacity>
							<TouchableOpacity onPress={saveEdit} style={styles.saveBtn} disabled={saving}>
								{saving
									? <ActivityIndicator color="#fff" size="small" />
									: <Text style={styles.saveText}>Save</Text>
								}
							</TouchableOpacity>
						</View>
					) : (
						<View style={styles.headerBtns}>
							<TouchableOpacity onPress={() => setPreviewing(true)} style={styles.previewBtn}>
								<Text style={styles.previewBtnText}>Preview</Text>
							</TouchableOpacity>
							<TouchableOpacity onPress={startEdit} style={styles.editBtn}>
								<Text style={styles.editBtnText}>Edit</Text>
							</TouchableOpacity>
						</View>
					)}
				</View>

				{/* Photo grid */}
				<View style={styles.photoGrid}>
					{Array.from({ length: 6 }, (_, i) => {
						const uri = editing ? photos[i] : displayPhotos[i];
						return (
							<TouchableOpacity
								key={i}
								style={[styles.photoTile, { width: TILE_SIZE, height: TILE_SIZE * 1.3 }]}
								onPress={() => editing && pickPhoto(i)}
								activeOpacity={editing ? 0.7 : 1}
							>
								{uri ? (
									<>
										<Image source={{ uri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
										{editing && (
											<TouchableOpacity style={styles.removeBtn} onPress={() => removePhoto(i)}>
												<Text style={styles.removeBtnText}>✕</Text>
											</TouchableOpacity>
										)}
									</>
								) : (
									<View style={styles.photoPlaceholder}>
										<Text style={styles.photoPlaceholderIcon}>+</Text>
									</View>
								)}
							</TouchableOpacity>
						);
					})}
				</View>

				{/* Name + meta */}
				<View style={styles.section}>
					{editing ? (
						<TextInput
							style={styles.nameInput}
							value={name}
							onChangeText={setName}
							autoCapitalize="words"
							placeholderTextColor="rgba(255,255,255,0.22)"
						/>
					) : (
						<Text style={styles.name}>{profile.name}, {profile.age}</Text>
					)}
					<Text style={styles.meta}>{profile.gender} · Looking for {profile.looking_for}</Text>
				</View>

				{/* Bio */}
				<View style={[styles.section, { marginBottom: 8 }]}>
					<Text style={styles.sectionLabel}>About me</Text>
					{editing ? (
						<>
							<TextInput
								style={styles.bioInput}
								value={bio}
								onChangeText={setBio}
								multiline
								maxLength={300}
								placeholderTextColor="rgba(255,255,255,0.22)"
								placeholder="Write something about yourself..."
							/>
							<Text style={styles.charCount}>{bio.length}/300</Text>
						</>
					) : (
						<Text style={styles.bio}>{profile.bio || 'No bio yet'}</Text>
					)}
				</View>

				{/* Distance */}
				<View style={styles.section}>
					<Text style={styles.sectionLabel}>Max distance</Text>
					{editing ? (
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
					) : (
						<Text style={styles.settingValue}>{profile.distance_preference} miles</Text>
					)}
				</View>

				{/* Age range */}
				<View style={styles.section}>
					<Text style={styles.sectionLabel}>Age range</Text>
					{editing ? (
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
					) : (
						<Text style={styles.settingValue}>{profile.age_min}–{profile.age_max} years</Text>
					)}
				</View>

				{/* Interests */}
				<View style={styles.section}>
					<Text style={styles.sectionLabel}>Interests</Text>
					{editing ? (
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
					) : (
						<View style={styles.tagsGrid}>
							{(profile.interests ?? []).length > 0
								? (profile.interests ?? []).map(tag => (
									<View key={tag} style={styles.tagActive}>
										<Text style={styles.tagTextActive}>{tag}</Text>
									</View>
								))
								: <Text style={styles.bio}>No interests added yet</Text>
							}
						</View>
					)}
				</View>

				{/* Logout */}
				<View style={styles.section}>
					<TouchableOpacity style={styles.logoutBtn} onPress={signOut} activeOpacity={0.7}>
						<Text style={styles.logoutText}>Log out</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>

			{/* Preview modal — reflects live edit state when editing */}
			<Modal visible={previewing} animationType="slide" statusBarTranslucent>
				{(() => {
					const previewName = editing ? name.trim() || profile.name : profile.name;
					const previewBio = editing ? bio.trim() : (profile.bio ?? '');
					const previewInterests = editing ? interests : (profile.interests ?? []);
					const previewUri = (editing ? photos : displayPhotos).find(Boolean) ?? avatarFallback;
					return (
						<View style={styles.previewRoot}>
							<Image source={{ uri: previewUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
							<LinearGradient colors={['transparent', 'rgba(0,0,0,0.88)']} style={styles.previewGradient} />
							<TouchableOpacity style={[styles.previewClose, { top: insets.top + 12 }]} onPress={() => setPreviewing(false)}>
								<Text style={styles.previewCloseText}>✕</Text>
							</TouchableOpacity>
							<View style={[styles.previewInfo, { paddingBottom: insets.bottom + 24 }]}>
								<Text style={styles.previewName}>{previewName}, {profile.age}</Text>
								{!!previewBio && <Text style={styles.previewBio}>{previewBio}</Text>}
								{previewInterests.length > 0 && (
									<View style={styles.previewTags}>
										{previewInterests.map(tag => (
											<View key={tag} style={styles.previewTag}>
												<Text style={styles.previewTagText}>{tag}</Text>
											</View>
										))}
									</View>
								)}
							</View>
						</View>
					);
				})()}
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#0f0f0f',
	},
	flex: {
		flex: 1,
	},
	headerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 20,
		paddingTop: 16,
		marginBottom: 20,
	},
	heading: {
		color: '#fff',
		fontSize: 26,
		fontWeight: '800',
	},
	headerBtns: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	previewBtn: {
		backgroundColor: '#1e1e1e',
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: '#2a2a2a',
	},
	previewBtnText: {
		color: 'rgba(255,255,255,0.6)',
		fontSize: 14,
		fontWeight: '600',
	},
	editBtn: {
		backgroundColor: '#1e1e1e',
		paddingHorizontal: 18,
		paddingVertical: 8,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: '#2a2a2a',
	},
	editBtnText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '600',
	},
	editActions: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	cancelBtn: {
		paddingHorizontal: 8,
		paddingVertical: 8,
	},
	cancelText: {
		color: 'rgba(255,255,255,0.4)',
		fontSize: 15,
	},
	saveBtn: {
		backgroundColor: '#FF2D55',
		paddingHorizontal: 20,
		paddingVertical: 8,
		borderRadius: 20,
		minWidth: 64,
		alignItems: 'center',
	},
	saveText: {
		color: '#fff',
		fontSize: 15,
		fontWeight: '700',
	},
	photoGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		paddingHorizontal: 20,
		marginBottom: 20,
	},
	photoTile: {
		borderRadius: 14,
		overflow: 'hidden',
		backgroundColor: '#1a1a1a',
	},
	photoPlaceholder: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.08)',
		borderRadius: 14,
		borderStyle: 'dashed',
	},
	photoPlaceholderIcon: {
		color: 'rgba(255,255,255,0.2)',
		fontSize: 28,
		fontWeight: '300',
	},
	removeBtn: {
		position: 'absolute',
		top: 6,
		right: 6,
		backgroundColor: 'rgba(0,0,0,0.55)',
		borderRadius: 12,
		width: 24,
		height: 24,
		alignItems: 'center',
		justifyContent: 'center',
	},
	removeBtnText: {
		color: '#fff',
		fontSize: 11,
		fontWeight: '700',
	},
	section: {
		paddingHorizontal: 20,
		marginBottom: 28,
	},
	sectionLabel: {
		color: '#555',
		fontSize: 12,
		fontWeight: '700',
		textTransform: 'uppercase',
		letterSpacing: 1.2,
		marginBottom: 12,
	},
	name: {
		color: '#fff',
		fontSize: 24,
		fontWeight: '800',
		textAlign: 'center',
		marginBottom: 4,
	},
	nameInput: {
		color: '#fff',
		fontSize: 24,
		fontWeight: '800',
		textAlign: 'center',
		borderBottomWidth: 1,
		borderBottomColor: '#FF2D55',
		paddingBottom: 4,
		marginBottom: 4,
	},
	meta: {
		color: '#555',
		fontSize: 14,
		textAlign: 'center',
	},
	bio: {
		color: '#aaa',
		fontSize: 21,
		lineHeight: 29,
	},
	bioInput: {
		backgroundColor: '#1e1e1e',
		borderRadius: 14,
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.07)',
		padding: 14,
		color: '#fff',
		fontSize: 15,
		lineHeight: 22,
		minHeight: 100,
		textAlignVertical: 'top',
	},
	charCount: {
		color: 'rgba(255,255,255,0.22)',
		fontSize: 12,
		textAlign: 'right',
		marginTop: 4,
	},
	tagsGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	tag: {
		backgroundColor: '#1e1e1e',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.1)',
		borderRadius: 20,
		paddingHorizontal: 14,
		paddingVertical: 7,
	},
	tagActive: {
		backgroundColor: 'rgba(255,45,85,0.12)',
		borderWidth: 1,
		borderColor: '#FF2D55',
		borderRadius: 20,
		paddingHorizontal: 14,
		paddingVertical: 7,
	},
	tagText: {
		color: 'rgba(255,255,255,0.45)',
		fontSize: 17,
		fontWeight: '500',
	},
	tagTextActive: {
		color: '#FF2D55',
		fontSize: 17,
		fontWeight: '600',
	},
	settingValue: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},

	optionRow: {
		flexDirection: 'row',
		gap: 6,
	},
	optionBtn: {
		flex: 1,
		backgroundColor: '#1e1e1e',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.1)',
		borderRadius: 10,
		paddingVertical: 10,
		alignItems: 'center',
	},
	optionBtnActive: {
		backgroundColor: 'rgba(255,45,85,0.15)',
		borderColor: '#FF2D55',
	},
	optionText: {
		color: 'rgba(255,255,255,0.45)',
		fontSize: 18,
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
		color: 'rgba(255,255,255,0.35)',
		fontSize: 12,
		fontWeight: '700',
		letterSpacing: 1,
		textTransform: 'uppercase',
		textAlign: 'center',
	},
	logoutBtn: {
		borderWidth: 1,
		borderColor: 'rgba(255,45,85,0.35)',
		borderRadius: 14,
		paddingVertical: 16,
		alignItems: 'center',
	},
	logoutText: {
		color: '#FF2D55',
		fontSize: 16,
		fontWeight: '700',
		letterSpacing: 0.5,
	},
	previewRoot: {
		flex: 1,
		backgroundColor: '#000',
	},
	previewGradient: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		height: '55%',
	},
	previewClose: {
		position: 'absolute',
		right: 16,
		backgroundColor: 'rgba(0,0,0,0.45)',
		borderRadius: 20,
		width: 36,
		height: 36,
		alignItems: 'center',
		justifyContent: 'center',
	},
	previewCloseText: {
		color: '#fff',
		fontSize: 15,
		fontWeight: '700',
	},
	previewInfo: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		paddingHorizontal: 24,
		paddingTop: 24,
	},
	previewName: {
		color: '#fff',
		fontSize: 32,
		fontWeight: '800',
		marginBottom: 8,
	},
	previewBio: {
		color: 'rgba(255,255,255,0.75)',
		fontSize: 15,
		lineHeight: 22,
		marginBottom: 14,
	},
	previewTags: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	previewTag: {
		backgroundColor: 'rgba(255,255,255,0.15)',
		borderRadius: 20,
		paddingHorizontal: 12,
		paddingVertical: 6,
	},
	previewTagText: {
		color: '#fff',
		fontSize: 13,
		fontWeight: '500',
	},
});
