export type Video = {
  id: string;
  title: string;
  channel: string;
  views: string;
  timestamp: string;
  duration: string;
  thumbnail: string;
  avatar: string;
};

export const VIDEOS: Video[] = [
  {
    id: '1',
    title: 'Building a Full-Stack App in 1 Hour',
    channel: 'CodeWithMe',
    views: '1.2M views',
    timestamp: '3 days ago',
    duration: '1:02:34',
    thumbnail: 'https://picsum.photos/seed/vid1/640/360',
    avatar: 'https://picsum.photos/seed/ch1/100/100',
  },
  {
    id: '2',
    title: 'Top 10 Places to Visit in 2025',
    channel: 'TravelVibes',
    views: '890K views',
    timestamp: '1 week ago',
    duration: '14:22',
    thumbnail: 'https://picsum.photos/seed/vid2/640/360',
    avatar: 'https://picsum.photos/seed/ch2/100/100',
  },
  {
    id: '3',
    title: 'Making the Perfect Pasta from Scratch',
    channel: 'Chef Marco',
    views: '3.4M views',
    timestamp: '2 weeks ago',
    duration: '22:08',
    thumbnail: 'https://picsum.photos/seed/vid3/640/360',
    avatar: 'https://picsum.photos/seed/ch3/100/100',
  },
  {
    id: '4',
    title: 'Lo-fi Hip Hop Beats to Study/Relax To',
    channel: 'ChillBeats',
    views: '12M views',
    timestamp: '1 month ago',
    duration: '3:21:05',
    thumbnail: 'https://picsum.photos/seed/vid4/640/360',
    avatar: 'https://picsum.photos/seed/ch4/100/100',
  },
  {
    id: '5',
    title: 'React Native Crash Course 2025',
    channel: 'DevAcademy',
    views: '540K views',
    timestamp: '5 days ago',
    duration: '2:15:44',
    thumbnail: 'https://picsum.photos/seed/vid5/640/360',
    avatar: 'https://picsum.photos/seed/ch5/100/100',
  },
  {
    id: '6',
    title: 'Electric Cars in 2025 — Worth It?',
    channel: 'AutoReview',
    views: '2.1M views',
    timestamp: '2 days ago',
    duration: '18:55',
    thumbnail: 'https://picsum.photos/seed/vid6/640/360',
    avatar: 'https://picsum.photos/seed/ch6/100/100',
  },
  {
    id: '7',
    title: 'Morning Yoga Routine for Beginners',
    channel: 'ZenFlow',
    views: '7.8M views',
    timestamp: '3 weeks ago',
    duration: '28:12',
    thumbnail: 'https://picsum.photos/seed/vid7/640/360',
    avatar: 'https://picsum.photos/seed/ch7/100/100',
  },
  {
    id: '8',
    title: 'How AI is Changing the World',
    channel: 'FutureTech',
    views: '4.5M views',
    timestamp: '6 days ago',
    duration: '31:48',
    thumbnail: 'https://picsum.photos/seed/vid8/640/360',
    avatar: 'https://picsum.photos/seed/ch8/100/100',
  },
];
