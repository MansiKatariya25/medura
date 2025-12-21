export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  description: string;
  category: string;
  reviews?: string;
  image: string;
  pricePerMinute?: number;
  availabilityDays?: string[];
  availabilitySlots?: { day: string; start: string; end: string; date?: string }[];
};
