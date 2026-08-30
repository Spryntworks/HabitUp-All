import { QuickStartTemplate } from '../types';

export const QUICK_START_TEMPLATES: QuickStartTemplate[] = [
  {
    id: 'tpl-exercise',
    name: 'Exercise',
    description: '30 min workout / physical activity',
    category: 'fitness',
    icon: 'Dumbbell',
    color: '#FF4D6D', // Coral Red from design
    defaultTime: '07:00',
    frequency_type: 'daily',
    scheduled_days: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: 'tpl-read',
    name: 'Read 20 pages',
    description: 'Read book before bed or during commute',
    category: 'learning',
    icon: 'BookOpen',
    color: '#FFB800', // Sunlight Amber from design
    defaultTime: '20:00',
    frequency_type: 'daily',
    scheduled_days: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: 'tpl-meditate',
    name: 'Meditate',
    description: '10 mins mindfulness & calm breathing',
    category: 'mindfulness',
    icon: 'Sparkles',
    color: '#8B5CF6', // Lavender Purple from design
    defaultTime: '08:00',
    frequency_type: 'daily',
    scheduled_days: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: 'tpl-drink-water',
    name: 'Drink Water',
    description: '8 glasses (2.5L) for hydration & energy',
    category: 'health',
    icon: 'Droplets',
    color: '#00C2FF', // Electric Blue from design
    defaultTime: '09:00',
    frequency_type: 'daily',
    scheduled_days: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: 'tpl-study',
    name: 'Study',
    description: '1 hour focused skill or language practice',
    category: 'learning',
    icon: 'Flame',
    color: '#10B981', // Emerald Green from design
    defaultTime: '16:00',
    frequency_type: 'custom_days',
    scheduled_days: [0, 1, 2, 3, 4], // Weekdays Mon-Fri
  },
  {
    id: 'tpl-journal',
    name: 'Evening Journal',
    description: 'Gratitude, reflections & daily thoughts',
    category: 'mindfulness',
    icon: 'PenTool',
    color: '#F43F5E', // Rose from design
    defaultTime: '21:30',
    frequency_type: 'daily',
    scheduled_days: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: 'tpl-sleep-early',
    name: 'Sleep before 11 PM',
    description: 'Consistent sleep schedule & deep rest',
    category: 'health',
    icon: 'Moon',
    color: '#6366F1', // Indigo from design
    defaultTime: '22:30',
    frequency_type: 'daily',
    scheduled_days: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: 'tpl-walk',
    name: 'Walk 5k steps',
    description: 'Daily outdoor walk & fresh air',
    category: 'fitness',
    icon: 'Footprints',
    color: '#14B8A6', // Teal from design
    defaultTime: '18:00',
    frequency_type: 'daily',
    scheduled_days: [0, 1, 2, 3, 4, 5, 6],
  },
];

export const HABIT_COLORS = [
  { name: 'Coral Red', hex: '#FF4D6D', bgClass: 'bg-[#FF4D6D]', textClass: 'text-[#FF4D6D]' },
  { name: 'Sunlight Amber', hex: '#FFB800', bgClass: 'bg-[#FFB800]', textClass: 'text-[#FFB800]' },
  { name: 'Lavender Purple', hex: '#8B5CF6', bgClass: 'bg-[#8B5CF6]', textClass: 'text-[#8B5CF6]' },
  { name: 'Electric Cyan', hex: '#00C2FF', bgClass: 'bg-[#00C2FF]', textClass: 'text-[#00C2FF]' },
  { name: 'Emerald Mint', hex: '#10B981', bgClass: 'bg-[#10B981]', textClass: 'text-[#10B981]' },
  { name: 'Ruby Rose', hex: '#F43F5E', bgClass: 'bg-[#F43F5E]', textClass: 'text-[#F43F5E]' },
  { name: 'Indigo Night', hex: '#6366F1', bgClass: 'bg-[#6366F1]', textClass: 'text-[#6366F1]' },
  { name: 'Sunset Orange', hex: '#F97316', bgClass: 'bg-[#F97316]', textClass: 'text-[#F97316]' },
  { name: 'Teal Forest', hex: '#14B8A6', bgClass: 'bg-[#14B8A6]', textClass: 'text-[#14B8A6]' },
  { name: 'Electric Fuchsia', hex: '#D946EF', bgClass: 'bg-[#D946EF]', textClass: 'text-[#D946EF]' },
];

export const AVAILABLE_ICONS = [
  'Dumbbell',
  'BookOpen',
  'Sparkles',
  'Droplets',
  'Flame',
  'PenTool',
  'Moon',
  'Footprints',
  'Heart',
  'Brain',
  'Coffee',
  'Apple',
  'Sun',
  'Smile',
  'Music',
  'Code',
  'Compass',
  'ShieldCheck',
  'Timer',
  'Zap',
];

export const DAYS_OF_WEEK = [
  { index: 0, short: 'M', full: 'Monday' },
  { index: 1, short: 'T', full: 'Tuesday' },
  { index: 2, short: 'W', full: 'Wednesday' },
  { index: 3, short: 'T', full: 'Thursday' },
  { index: 4, short: 'F', full: 'Friday' },
  { index: 5, short: 'S', full: 'Saturday' },
  { index: 6, short: 'S', full: 'Sunday' },
];

export const MOTIVATIONAL_QUOTES = [
  { text: "Small habits. Big change.", author: "HabitUp" },
  { text: "Discipline today. Freedom tomorrow.", author: "Marcus Aurelius" },
  { text: "Progress, not perfection.", author: "Daily Reminder" },
  { text: "Tiny habits. Massive results.", author: "James Clear" },
  { text: "Don't break the chain!", author: "Consistency Rule" },
  { text: "You are what you repeatedly do.", author: "Aristotle" },
];
