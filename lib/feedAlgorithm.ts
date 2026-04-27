import { supabase } from './supabase';

export type FeedProfile = {
	id: string;
	name: string;
	age: number;
	bio: string;
	photos: string[];
	interests: string[];
	gender: string;
	distance_preference: number;
	age_min: number;
	age_max: number;
	boosted_until: string | null;
};

// Shuffle an array in-place (Fisher-Yates)
function shuffle<T>(arr: T[]): T[] {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

/**
 * Fetch the feed for the current user.
 * - Mutual gender preference filter
 * - Mutual age range filter
 * - Exclude already-liked profiles
 * - Require at least one photo
 * - Shuffled, boosted profiles surfaced first
 */
export async function fetchFeedProfiles(userId: string): Promise<FeedProfile[]> {
	// 1. Get the current user's profile
	const { data: me, error: meError } = await supabase
		.from('profiles')
		.select('age, gender, looking_for, age_min, age_max')
		.eq('id', userId)
		.single();

	if (meError || !me) return [];

	// 2. Get IDs this user has already liked
	const { data: likedRows } = await supabase
		.from('likes')
		.select('liked_id')
		.eq('liker_id', userId);

	const likedIds = new Set((likedRows ?? []).map((r: { liked_id: string }) => r.liked_id));
	likedIds.add(userId); // exclude self

	// 3. Fetch candidate profiles using the current user's filters
	//    (server-side: age range + gender preference of me)
	let query = supabase
		.from('profiles')
		.select('id, name, age, bio, photos, interests, gender, looking_for, distance_preference, age_min, age_max, boosted_until')
		.neq('id', userId)
		.gte('age', me.age_min)
		.lte('age', me.age_max);

	// Filter by what I'm looking for
	if (me.looking_for !== 'Everyone') {
		// looking_for is "Men" | "Women" — map to gender values
		const targetGender = me.looking_for === 'Men' ? 'Man' : 'Woman';
		query = query.eq('gender', targetGender);
	}

	const { data: candidates, error: candidatesError } = await query;
	if (candidatesError || !candidates) return [];

	// 4. Client-side: mutual filter — B must also be interested in me
	const now = new Date();
	const myGender = me.gender;

	const filtered = candidates.filter((p: FeedProfile & { looking_for: string }) => {
		if (likedIds.has(p.id)) return false;
		if (!p.photos || p.photos.length === 0) return false;
		if (p.looking_for !== 'Everyone') {
			const theyWant = p.looking_for === 'Men' ? 'Man' : 'Woman';
			if (theyWant !== myGender) return false;
		}
		if (me.age < p.age_min || me.age > p.age_max) return false;
		return true;
	});

	// 5. Separate boosted vs regular, shuffle each group
	const boosted = filtered.filter(
		(p: FeedProfile) => p.boosted_until && new Date(p.boosted_until) > now
	);
	const regular = filtered.filter(
		(p: FeedProfile) => !p.boosted_until || new Date(p.boosted_until) <= now
	);

	return [...shuffle(boosted), ...shuffle(regular)];
}

/**
 * Record a like. Returns { matched: true, matchId } if it created a match,
 * or { matched: false } if it's just a like.
 */
export async function recordLike(
	likerId: string,
	likedId: string
): Promise<{ matched: boolean; matchId?: string }> {
	// Insert the like (ignore if duplicate)
	const { error: likeError } = await supabase
		.from('likes')
		.insert({ liker_id: likerId, liked_id: likedId });

	if (likeError && likeError.code !== '23505') {
		// 23505 = unique_violation (already liked) — treat as OK
		console.warn('recordLike error', likeError);
		return { matched: false };
	}

	// Check if the other person already liked us
	const { data: reverse } = await supabase
		.from('likes')
		.select('id')
		.eq('liker_id', likedId)
		.eq('liked_id', likerId)
		.maybeSingle();

	if (!reverse) return { matched: false };

	// Mutual like — create or fetch the match record
	// Use upsert with a stable ordering (smaller id first) to avoid duplicates
	const u1 = likerId < likedId ? likerId : likedId;
	const u2 = likerId < likedId ? likedId : likerId;

	const { data: match } = await supabase
		.from('matches')
		.upsert({ user1_id: u1, user2_id: u2 }, { onConflict: 'user1_id,user2_id' })
		.select('id')
		.single();

	return { matched: true, matchId: match?.id };
}

/**
 * How many likes has this user sent today (UTC day)?
 */
export async function getDailyLikesUsed(userId: string): Promise<number> {
	const startOfDay = new Date();
	startOfDay.setUTCHours(0, 0, 0, 0);

	const { count } = await supabase
		.from('likes')
		.select('id', { count: 'exact', head: true })
		.eq('liker_id', userId)
		.gte('created_at', startOfDay.toISOString());

	return count ?? 0;
}
