export interface TimezoneOption {
  value: string;
  label: string;
  group: string;
  offset: string;
}

export const POPULAR_TIMEZONES: TimezoneOption[] = [
  // Asia
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST - New Delhi, Mumbai, Calcutta)', group: 'Asia & Middle East', offset: 'UTC+5:30' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (Dubai, Abu Dhabi)', group: 'Asia & Middle East', offset: 'UTC+4:00' },
  { value: 'Asia/Riyadh', label: 'Arabia Standard Time (Riyadh)', group: 'Asia & Middle East', offset: 'UTC+3:00' },
  { value: 'Asia/Karachi', label: 'Pakistan Standard Time (Karachi, Islamabad)', group: 'Asia & Middle East', offset: 'UTC+5:00' },
  { value: 'Asia/Dhaka', label: 'Bangladesh Standard Time (Dhaka)', group: 'Asia & Middle East', offset: 'UTC+6:00' },
  { value: 'Asia/Bangkok', label: 'Indochina Time (Bangkok, Hanoi, Jakarta)', group: 'Asia & Middle East', offset: 'UTC+7:00' },
  { value: 'Asia/Singapore', label: 'Singapore Standard Time (Singapore)', group: 'Asia & Middle East', offset: 'UTC+8:00' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong Time (Hong Kong)', group: 'Asia & Middle East', offset: 'UTC+8:00' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (Beijing, Shanghai)', group: 'Asia & Middle East', offset: 'UTC+8:00' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (Tokyo, Osaka)', group: 'Asia & Middle East', offset: 'UTC+9:00' },
  { value: 'Asia/Seoul', label: 'Korea Standard Time (Seoul)', group: 'Asia & Middle East', offset: 'UTC+9:00' },
  { value: 'Asia/Manila', label: 'Philippine Standard Time (Manila)', group: 'Asia & Middle East', offset: 'UTC+8:00' },
  { value: 'Asia/Jerusalem', label: 'Israel Standard Time (Jerusalem, Tel Aviv)', group: 'Asia & Middle East', offset: 'UTC+2:00' },

  // Americas
  { value: 'America/New_York', label: 'Eastern Time (New York, Miami, Toronto)', group: 'Americas', offset: 'UTC-5:00' },
  { value: 'America/Chicago', label: 'Central Time (Chicago, Dallas, Houston)', group: 'Americas', offset: 'UTC-6:00' },
  { value: 'America/Denver', label: 'Mountain Time (Denver, Phoenix)', group: 'Americas', offset: 'UTC-7:00' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (Los Angeles, San Francisco, Seattle)', group: 'Americas', offset: 'UTC-8:00' },
  { value: 'America/Anchorage', label: 'Alaska Time (Anchorage)', group: 'Americas', offset: 'UTC-9:00' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (Honolulu)', group: 'Americas', offset: 'UTC-10:00' },
  { value: 'America/Sao_Paulo', label: 'Brasilia Time (Sao Paulo, Rio)', group: 'Americas', offset: 'UTC-3:00' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Argentina Time (Buenos Aires)', group: 'Americas', offset: 'UTC-3:00' },
  { value: 'America/Mexico_City', label: 'Central Mexico Time (Mexico City)', group: 'Americas', offset: 'UTC-6:00' },
  { value: 'America/Bogota', label: 'Colombia / Peru Time (Bogota, Lima)', group: 'Americas', offset: 'UTC-5:00' },
  { value: 'America/Vancouver', label: 'Pacific Time (Vancouver)', group: 'Americas', offset: 'UTC-8:00' },

  // Europe
  { value: 'Europe/London', label: 'Greenwich Mean Time (London, Dublin, Lisbon)', group: 'Europe', offset: 'UTC+0:00' },
  { value: 'Europe/Paris', label: 'Central European Time (Paris, Berlin, Rome, Madrid, Amsterdam)', group: 'Europe', offset: 'UTC+1:00' },
  { value: 'Europe/Zurich', label: 'Central European Time (Zurich, Vienna)', group: 'Europe', offset: 'UTC+1:00' },
  { value: 'Europe/Stockholm', label: 'Central European Time (Stockholm, Oslo, Copenhagen)', group: 'Europe', offset: 'UTC+1:00' },
  { value: 'Europe/Athens', label: 'Eastern European Time (Athens, Bucharest, Helsinki)', group: 'Europe', offset: 'UTC+2:00' },
  { value: 'Europe/Istanbul', label: 'Turkey Time (Istanbul)', group: 'Europe', offset: 'UTC+3:00' },
  { value: 'Europe/Moscow', label: 'Moscow Standard Time (Moscow, St. Petersburg)', group: 'Europe', offset: 'UTC+3:00' },

  // Australia & Pacific
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (Sydney, Melbourne, Brisbane)', group: 'Australia & Pacific', offset: 'UTC+10:00' },
  { value: 'Australia/Adelaide', label: 'Australian Central Time (Adelaide)', group: 'Australia & Pacific', offset: 'UTC+9:30' },
  { value: 'Australia/Perth', label: 'Australian Western Time (Perth)', group: 'Australia & Pacific', offset: 'UTC+8:00' },
  { value: 'Pacific/Auckland', label: 'New Zealand Time (Auckland, Wellington)', group: 'Australia & Pacific', offset: 'UTC+12:00' },
  { value: 'Pacific/Fiji', label: 'Fiji Time (Suva)', group: 'Australia & Pacific', offset: 'UTC+12:00' },

  // Africa
  { value: 'Africa/Johannesburg', label: 'South Africa Standard Time (Johannesburg, Cape Town)', group: 'Africa', offset: 'UTC+2:00' },
  { value: 'Africa/Cairo', label: 'Eastern European Time (Cairo)', group: 'Africa', offset: 'UTC+2:00' },
  { value: 'Africa/Nairobi', label: 'East Africa Time (Nairobi)', group: 'Africa', offset: 'UTC+3:00' },
  { value: 'Africa/Lagos', label: 'West Africa Time (Lagos)', group: 'Africa', offset: 'UTC+1:00' },

  // UTC
  { value: 'UTC', label: 'Coordinated Universal Time (UTC / GMT)', group: 'Universal', offset: 'UTC+0:00' },
];

export const getDetectedTimezone = (): string => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz || 'Asia/Kolkata';
  } catch {
    return 'Asia/Kolkata';
  }
};
