import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type State = { hasError: boolean };

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
	constructor(props: { children: React.ReactNode }) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(): State {
		return { hasError: true };
	}

	render() {
		if (this.state.hasError) {
			return (
				<View style={styles.container}>
					<Text style={styles.icon}>💔</Text>
					<Text style={styles.title}>something went wrong</Text>
					<Text style={styles.sub}>an unexpected error occurred</Text>
					<Pressable style={styles.btn} onPress={() => this.setState({ hasError: false })}>
						<Text style={styles.btnText}>try again</Text>
					</Pressable>
				</View>
			);
		}
		return this.props.children;
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#0f0f0f',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 12,
		paddingHorizontal: 32,
	},
	icon: {
		fontSize: 52,
		marginBottom: 8,
	},
	title: {
		color: '#fff',
		fontSize: 22,
		fontWeight: '700',
		letterSpacing: 1,
		textTransform: 'lowercase',
	},
	sub: {
		color: 'rgba(255,255,255,0.35)',
		fontSize: 14,
		textAlign: 'center',
	},
	btn: {
		marginTop: 16,
		paddingVertical: 12,
		paddingHorizontal: 32,
		borderWidth: 1,
		borderColor: '#FF2D55',
		borderRadius: 50,
	},
	btnText: {
		color: '#FF2D55',
		fontSize: 14,
		letterSpacing: 1.5,
		textTransform: 'lowercase',
	},
});
