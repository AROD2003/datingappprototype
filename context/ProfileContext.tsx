import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export type UserProfile = {
	id: string;
	name: string;
	age: number;
	bio: string;
	photos: string[];
	interests: string[];
	gender: string;
	looking_for: string;
	distance_preference: number;
	age_min: number;
	age_max: number;
	is_premium: boolean;
};

type ProfileContextType = {
	profile: UserProfile | null;
	hasProfile: boolean;
	loading: boolean;
	createProfile: (data: Omit<UserProfile, 'id'>) => Promise<{ error: string | null }>;
	updateProfile: (updates: Partial<Omit<UserProfile, 'id'>>) => Promise<{ error: string | null }>;
};

const ProfileContext = createContext<ProfileContextType>({} as ProfileContextType);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
	const { user } = useAuth();
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!user) { setLoading(false); return; }
		setLoading(true);
		supabase
			.from('profiles')
			.select('*')
			.eq('id', user.id)
			.single()
			.then(({ data }) => {
				setProfile(data ?? null);
				setLoading(false);
			});
	}, [user]);

	const createProfile = async (data: Omit<UserProfile, 'id'>) => {
		if (!user) return { error: 'Not logged in' };
		const { data: created, error } = await supabase
			.from('profiles')
			.insert({ id: user.id, ...data })
			.select()
			.single();
		if (created) setProfile(created);
		return { error: error?.message ?? null };
	};

	const updateProfile = async (updates: Partial<Omit<UserProfile, 'id'>>) => {
		if (!user) return { error: 'Not logged in' };
		const { data: updated, error } = await supabase
			.from('profiles')
			.update(updates)
			.eq('id', user.id)
			.select()
			.single();
		if (updated) setProfile(updated);
		return { error: error?.message ?? null };
	};

	return (
		<ProfileContext.Provider value={{ profile, hasProfile: !!profile, loading, createProfile, updateProfile }}>
			{children}
		</ProfileContext.Provider>
	);
}

export const useProfile = () => useContext(ProfileContext);
