export type Profile = {
  id: string;
  name: string;
  age: number;
  bio: string;
  interests: string[];
  photos: string[];
  location?: string;
  distance?: string;
  verified?: boolean;
};

export const PROFILES: Profile[] = [
  {
    id: '1',
    name: 'Sofia',
    age: 26,
    location: 'Los Angeles, CA',
    distance: '2 miles away',
    bio: 'Sunsets, sushi, and spontaneous road trips. Let\'s get lost together 🌅',
    interests: ['Travel', 'Yoga', 'Foodie', 'Music'],
    photos: [
      'https://i.pravatar.cc/600?img=1',
      'https://picsum.photos/seed/sofia2/600/900',
      'https://picsum.photos/seed/sofia3/600/900',
      'https://picsum.photos/seed/sofia4/600/900',
    ],
    verified: true,
  },
  {
    id: '2',
    name: 'Jake',
    age: 28,
    location: 'Los Angeles, CA',
    distance: '5 miles away',
    bio: 'Surfer by day, chef by night. Will cook for you 🍳',
    interests: ['Surfing', 'Cooking', 'Dogs', 'Hiking'],
    photos: [
      'https://i.pravatar.cc/600?img=12',
      'https://picsum.photos/seed/jake2/600/900',
      'https://picsum.photos/seed/jake3/600/900',
    ],
    verified: false,
  },
  {
    id: '3',
    name: 'Maya',
    age: 24,
    location: 'Santa Monica, CA',
    distance: '8 miles away',
    bio: 'Artist & coffee addict. Looking for my muse ☕🎨',
    interests: ['Art', 'Coffee', 'Concerts', 'Photography'],
    photos: [
      'https://i.pravatar.cc/600?img=5',
      'https://picsum.photos/seed/maya2/600/900',
      'https://picsum.photos/seed/maya3/600/900',
      'https://picsum.photos/seed/maya4/600/900',
    ],
    verified: true,
  },
  {
    id: '4',
    name: 'Carlos',
    age: 30,
    location: 'Venice, CA',
    distance: '3 miles away',
    bio: 'Architect by day, salsa dancer by night. Let\'s build something together 💃',
    interests: ['Dancing', 'Architecture', 'Travel', 'Wine'],
    photos: [
      'https://i.pravatar.cc/600?img=15',
      'https://picsum.photos/seed/carlos2/600/900',
      'https://picsum.photos/seed/carlos3/600/900',
    ],
    verified: true,
  },
  {
    id: '5',
    name: 'Emma',
    age: 27,
    location: 'Beverly Hills, CA',
    distance: '12 miles away',
    bio: 'Book nerd who also loves brunch. Swipe right if you know a good mimosa spot 🥂',
    interests: ['Reading', 'Brunch', 'Pilates', 'Podcasts'],
    photos: [
      'https://i.pravatar.cc/600?img=9',
      'https://picsum.photos/seed/emma2/600/900',
      'https://picsum.photos/seed/emma3/600/900',
      'https://picsum.photos/seed/emma4/600/900',
    ],
    verified: false,
  },
  {
    id: '6',
    name: 'Aiden',
    age: 25,
    location: 'Culver City, CA',
    distance: '7 miles away',
    bio: 'Software engineer who actually touches grass. Big fan of hiking & bad puns 🌲',
    interests: ['Hiking', 'Gaming', 'Tech', 'Comedy'],
    photos: [
      'https://i.pravatar.cc/600?img=33',
      'https://picsum.photos/seed/aiden2/600/900',
      'https://picsum.photos/seed/aiden3/600/900',
    ],
    verified: false,
  },
  {
    id: '7',
    name: 'Zoe',
    age: 29,
    location: 'Malibu, CA',
    distance: '15 miles away',
    bio: 'Marine biologist 🐠 Ocean lover. Let\'s explore the deep together.',
    interests: ['Ocean', 'Scuba', 'Fitness', 'Cooking'],
    photos: [
      'https://i.pravatar.cc/600?img=47',
      'https://picsum.photos/seed/zoe2/600/900',
      'https://picsum.photos/seed/zoe3/600/900',
      'https://picsum.photos/seed/zoe4/600/900',
    ],
    verified: true,
  },
  {
    id: '8',
    name: 'Liam',
    age: 31,
    location: 'Pasadena, CA',
    distance: '20 miles away',
    bio: 'Musician & dog dad. My golden retriever will love you first 🐶🎸',
    interests: ['Music', 'Dogs', 'Coffee', 'Concerts'],
    photos: [
      'https://i.pravatar.cc/600?img=52',
      'https://picsum.photos/seed/liam2/600/900',
      'https://picsum.photos/seed/liam3/600/900',
    ],
    verified: true,
  },
  {
    id: '9',
    name: 'Ava',
    age: 23,
    location: 'West Hollywood, CA',
    distance: '4 miles away',
    bio: 'Actor & yoga teacher. Here for a real connection, not just a good time 🙏',
    interests: ['Acting', 'Yoga', 'Meditation', 'Foodie'],
    photos: [
      'https://i.pravatar.cc/600?img=44',
      'https://picsum.photos/seed/ava2/600/900',
      'https://picsum.photos/seed/ava3/600/900',
      'https://picsum.photos/seed/ava4/600/900',
    ],
    verified: false,
  },
  {
    id: '10',
    name: 'Noah',
    age: 27,
    location: 'Silver Lake, CA',
    distance: '6 miles away',
    bio: 'Filmmaker chasing stories and the perfect taco 🌮🎬',
    interests: ['Film', 'Tacos', 'Vinyl', 'Art'],
    photos: [
      'https://i.pravatar.cc/600?img=59',
      'https://picsum.photos/seed/noah2/600/900',
      'https://picsum.photos/seed/noah3/600/900',
    ],
    verified: true,
  },
];
