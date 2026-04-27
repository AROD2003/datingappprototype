import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// How notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: true,
		shouldShowBanner: true,
		shouldShowList: true,
	}),
});

/**
 * Registers for push notifications and saves the token to the user's profile.
 * Safe to call on every app launch — skips silently on simulators.
 */
export async function registerPushToken(userId: string): Promise<void> {
	if (!Device.isDevice) return; // simulators can't receive push notifications

	const { status: existing } = await Notifications.getPermissionsAsync();
	let finalStatus = existing;

	if (existing !== 'granted') {
		const { status } = await Notifications.requestPermissionsAsync();
		finalStatus = status;
	}

	if (finalStatus !== 'granted') return;

	if (Platform.OS === 'android') {
		await Notifications.setNotificationChannelAsync('default', {
			name: 'default',
			importance: Notifications.AndroidImportance.MAX,
			vibrationPattern: [0, 250, 250, 250],
		});
	}

	const token = (await Notifications.getExpoPushTokenAsync()).data;

	// Only write if changed
	await supabase
		.from('profiles')
		.update({ push_token: token })
		.eq('id', userId);
}

/**
 * Sends a push notification to a user via Expo's push service.
 * Call this server-side ideally, but works client-side for now.
 */
export async function sendPushNotification(
	toUserId: string,
	title: string,
	body: string,
): Promise<void> {
	const { data } = await supabase
		.from('profiles')
		.select('push_token')
		.eq('id', toUserId)
		.single();

	const token = data?.push_token;
	if (!token) return;

	await fetch('https://exp.host/--/api/v2/push/send', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ to: token, title, body, sound: 'default' }),
	});
}
