import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const ITEM_HEIGHT = 64;
const VISIBLE = 5; // must be odd so center slot is selected

type Props = {
	value: number;
	onChange: (val: number) => void;
	min: number;
	max: number;
	disabledAbove?: number; // numbers >= this are greyed out (use for min picker)
	disabledBelow?: number; // numbers <= this are greyed out (use for max picker)
};

export default function NumberPicker({ value, onChange, min, max, disabledAbove, disabledBelow }: Props) {
	const scrollRef = useRef<ScrollView>(null);
	const numbers = Array.from({ length: max - min + 1 }, (_, i) => min + i);
	const PADDING = ITEM_HEIGHT * Math.floor(VISIBLE / 2);
	const [centerIdx, setCenterIdx] = useState(value - min);

	useEffect(() => {
		const idx = Math.max(0, value - min);
		scrollRef.current?.scrollTo({ y: idx * ITEM_HEIGHT, animated: false });
		setCenterIdx(idx);
	}, []);

	const isDisabled = (n: number) => {
		if (disabledAbove !== undefined && n >= disabledAbove) return true;
		if (disabledBelow !== undefined && n <= disabledBelow) return true;
		return false;
	};

	const clampToValid = (val: number): number => {
		if (disabledAbove !== undefined && val >= disabledAbove) return disabledAbove - 1;
		if (disabledBelow !== undefined && val <= disabledBelow) return disabledBelow + 1;
		return val;
	};

	return (
		<View style={styles.container}>
			{/* highlight bar behind center item */}
			<View style={styles.highlight} pointerEvents="none" />

			{/* fade top */}
			<View style={styles.fadeTop} pointerEvents="none" />
			{/* fade bottom */}
			<View style={styles.fadeBottom} pointerEvents="none" />

			<ScrollView
				ref={scrollRef}
				showsVerticalScrollIndicator={false}
				snapToInterval={ITEM_HEIGHT}
				decelerationRate="fast"
				contentContainerStyle={{ paddingVertical: PADDING }}
				onScroll={e => {
					const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
					setCenterIdx(Math.max(0, Math.min(idx, numbers.length - 1)));
				}}
				onMomentumScrollEnd={e => {
					const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
					const raw = Math.max(0, Math.min(idx, numbers.length - 1));
					const rawVal = min + raw;
					const validVal = clampToValid(rawVal);
					const validIdx = validVal - min;

					if (validIdx !== raw) {
						scrollRef.current?.scrollTo({ y: validIdx * ITEM_HEIGHT, animated: true });
					}

					setCenterIdx(validIdx);
					onChange(validVal);
				}}
				scrollEventThrottle={16}
			>
				{numbers.map((n, i) => (
					<View key={n} style={styles.item}>
						<Text style={[
							styles.number,
							i === centerIdx && !isDisabled(n) && styles.numberSelected,
							Math.abs(i - centerIdx) === 1 && !isDisabled(n) && styles.numberNear,
							isDisabled(n) && styles.numberDisabled,
						]}>
							{n}
						</Text>
					</View>
				))}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		height: ITEM_HEIGHT * VISIBLE,
		overflow: 'hidden',
		position: 'relative',
	},
	highlight: {
		position: 'absolute',
		top: ITEM_HEIGHT * Math.floor(VISIBLE / 2),
		left: 0,
		right: 0,
		height: ITEM_HEIGHT,
		borderTopWidth: 1,
		borderBottomWidth: 1,
		borderColor: 'rgba(255,45,85,0.5)',
		backgroundColor: 'rgba(255,45,85,0.06)',
		zIndex: 1,
	},
	fadeTop: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		height: ITEM_HEIGHT * Math.floor(VISIBLE / 2),
		backgroundColor: 'transparent',
		zIndex: 2,
	},
	fadeBottom: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		height: ITEM_HEIGHT * Math.floor(VISIBLE / 2),
		zIndex: 2,
	},
	item: {
		height: ITEM_HEIGHT,
		alignItems: 'center',
		justifyContent: 'center',
	},
	number: {
		color: 'rgba(255,255,255,0.18)',
		fontSize: 16,
		fontWeight: '500',
	},
	numberNear: {
		color: 'rgba(255,255,255,0.45)',
		fontSize: 19,
		fontWeight: '600',
	},
	numberSelected: {
		color: '#fff',
		fontSize: 26,
		fontWeight: '800',
	},
	numberDisabled: {
		color: 'rgba(255,255,255,0.08)',
		fontSize: 16,
		fontWeight: '400',
	},
});
