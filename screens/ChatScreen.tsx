import { useEffect, useRef, useState } from 'react';
import {
	FlatList,
	Image,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { sendPushNotification } from '../lib/notifications';
import { Profile } from '../data/profiles';

type Message = {
	id: string;
	sender_id: string;
	content: string;
	created_at: string;
};

type Props = {
	matchProfile: Profile;
	matchId: string | null;
	onBack: () => void;
};

export default function ChatScreen({ matchProfile, matchId, onBack }: Props) {
	const insets = useSafeAreaInsets();
	const { user } = useAuth();
	const { profile } = useProfile();
	const [messages, setMessages] = useState<Message[]>([]);
	const [text, setText] = useState('');
	const [sending, setSending] = useState(false);
	const [fetchError, setFetchError] = useState(false);
	const flatListRef = useRef<FlatList>(null);

	useEffect(() => {
		if (!matchId) return;

		supabase
			.from('messages')
			.select('*')
			.eq('match_id', matchId)
			.order('created_at', { ascending: true })
			.then(({ data, error }) => {
				if (error) { setFetchError(true); return; }
				if (data) setMessages(data);
			});

		const channel = supabase
			.channel(`messages:${matchId}`)
			.on(
				'postgres_changes',
				{ event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
				(payload) => {
					setMessages(prev => [...prev, payload.new as Message]);
				}
			)
			.subscribe();

		return () => { supabase.removeChannel(channel); };
	}, [matchId]);

	const sendMessage = async () => {
		if (!text.trim() || !matchId || !user) return;
		setSending(true);
		const content = text.trim();
		setText('');
		await supabase.from('messages').insert({
			match_id: matchId,
			sender_id: user.id,
			content,
		});
		sendPushNotification(
			matchProfile.id,
			profile?.name ?? 'New message',
			content,
		);
		setSending(false);
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			style={styles.root}
		>
			{/* Header */}
			<View style={[styles.header, { paddingTop: insets.top + 8 }]}>
				<TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
					<Text style={styles.backIcon}>‹</Text>
				</TouchableOpacity>
				<Image source={{ uri: matchProfile.photos[0] }} style={styles.avatar} />
				<View>
					<Text style={styles.headerName}>{matchProfile.name}</Text>
					<Text style={styles.headerSub}>New match ♥</Text>
				</View>
			</View>

			{/* Messages */}
			{!matchId ? (
				<View style={styles.emptyState}>
					<Text style={styles.emptyIcon}>💬</Text>
					<Text style={styles.emptyTitle}>Start the conversation</Text>
					<Text style={styles.emptySub}>Messaging is available once both of you join the app</Text>
				</View>
			) : fetchError ? (
				<View style={styles.emptyState}>
					<Text style={styles.emptyIcon}>⚠️</Text>
					<Text style={styles.emptyTitle}>Couldn't load messages</Text>
					<Text style={styles.emptySub}>Check your connection and try again</Text>
				</View>
			) : (
				<FlatList
					ref={flatListRef}
					data={messages}
					keyExtractor={item => item.id}
					contentContainerStyle={styles.messageList}
					onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
					ListEmptyComponent={
						<View style={styles.emptyState}>
							<Text style={styles.emptyIcon}>♥</Text>
							<Text style={styles.emptyTitle}>You matched!</Text>
							<Text style={styles.emptySub}>Say something nice</Text>
						</View>
					}
					renderItem={({ item }) => {
						const isMe = item.sender_id === user?.id;
						return (
							<View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
								<Text style={styles.bubbleText}>{item.content}</Text>
							</View>
						);
					}}
				/>
			)}

			{/* Input */}
			<View style={[styles.inputRow, { paddingBottom: insets.bottom + 8 }]}>
				<TextInput
					style={styles.input}
					placeholder={matchId ? 'Say something...' : 'Messaging not available yet'}
					placeholderTextColor="rgba(255,255,255,0.22)"
					value={text}
					onChangeText={setText}
					multiline
					maxLength={500}
					editable={!!matchId}
					onSubmitEditing={sendMessage}
				/>
				<Pressable
					style={[styles.sendBtn, (!text.trim() || !matchId) && { opacity: 0.35 }]}
					onPress={sendMessage}
					disabled={!text.trim() || !matchId || sending}
				>
					<Text style={styles.sendIcon}>↑</Text>
				</Pressable>
			</View>
		</KeyboardAvoidingView>
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
		paddingHorizontal: 16,
		paddingBottom: 14,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: 'rgba(255,255,255,0.08)',
		gap: 12,
	},
	backBtn: {
		padding: 4,
	},
	backIcon: {
		color: '#fff',
		fontSize: 40,
		fontWeight: '200',
		lineHeight: 40,
		marginTop: -6,
	},
	avatar: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: '#333',
	},
	headerName: {
		color: '#fff',
		fontSize: 17,
		fontWeight: '700',
	},
	headerSub: {
		color: '#FF2D55',
		fontSize: 12,
		fontWeight: '500',
		marginTop: 1,
	},
	messageList: {
		paddingHorizontal: 16,
		paddingTop: 16,
		paddingBottom: 16,
		flexGrow: 1,
	},
	emptyState: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingBottom: 100,
	},
	emptyIcon: {
		fontSize: 48,
		marginBottom: 14,
	},
	emptyTitle: {
		color: '#fff',
		fontSize: 20,
		fontWeight: '700',
		marginBottom: 8,
	},
	emptySub: {
		color: '#555',
		fontSize: 14,
		textAlign: 'center',
		paddingHorizontal: 32,
		lineHeight: 20,
	},
	bubble: {
		maxWidth: '78%',
		borderRadius: 18,
		paddingVertical: 10,
		paddingHorizontal: 14,
		marginBottom: 8,
	},
	bubbleMe: {
		alignSelf: 'flex-end',
		backgroundColor: '#FF2D55',
		borderBottomRightRadius: 4,
	},
	bubbleThem: {
		alignSelf: 'flex-start',
		backgroundColor: '#1e1e1e',
		borderBottomLeftRadius: 4,
	},
	bubbleText: {
		color: '#fff',
		fontSize: 15,
		lineHeight: 21,
	},
	inputRow: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		paddingHorizontal: 16,
		paddingTop: 10,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: 'rgba(255,255,255,0.08)',
		gap: 10,
	},
	input: {
		flex: 1,
		backgroundColor: '#1e1e1e',
		borderRadius: 22,
		paddingHorizontal: 16,
		paddingVertical: 10,
		color: '#fff',
		fontSize: 15,
		maxHeight: 100,
	},
	sendBtn: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: '#FF2D55',
		alignItems: 'center',
		justifyContent: 'center',
	},
	sendIcon: {
		color: '#fff',
		fontSize: 20,
		fontWeight: '800',
	},
});
