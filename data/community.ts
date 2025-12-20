export type Community = {
  id: string;
  name: string;
  description: string;
  members: number;
  location: string;
  nextSession: string;
  tags: string[];
  avatar: string;
  avatarColor: string;
};

export type CommunityMessage = {
  id: string;
  groupId: string;
  author: string;
  text: string;
  time: string;
};

export const communities: Community[] = [
  {
    id: "heart-care",
    name: "Heart Care Circle",
    description:
      "Weekly check-ins for blood pressure, heart-healthy meals, and local cardiology talks.",
    members: 482,
    location: "Downtown Clinic Hall",
    nextSession: "Sat, 10:30 AM",
    tags: ["Cardio", "Nutrition"],
    avatar: "HC",
    avatarColor: "bg-[#4D7CFF]",
  },
  {
    id: "diabetes-balance",
    name: "Diabetes Balance",
    description:
      "Live nutrition demos, glucose tracking tips, and peer support for type 1/2.",
    members: 913,
    location: "Medura Hub East",
    nextSession: "Tue, 6:00 PM",
    tags: ["Diabetes", "Lifestyle"],
    avatar: "DB",
    avatarColor: "bg-[#FF8A64]",
  },
  {
    id: "mindful-reset",
    name: "Mindful Reset",
    description:
      "Guided mindfulness, stress relief sessions, and mental wellness checklists.",
    members: 301,
    location: "Community Studio",
    nextSession: "Thu, 7:30 PM",
    tags: ["Mental Health", "Wellness"],
    avatar: "MR",
    avatarColor: "bg-[#59E0FF]",
  },
  {
    id: "parent-care",
    name: "Parent Care Network",
    description:
      "Pediatric care tips, vaccination drives, and seasonal health alerts.",
    members: 639,
    location: "Medura Kids Wing",
    nextSession: "Sun, 9:00 AM",
    tags: ["Pediatrics", "Awareness"],
    avatar: "PC",
    avatarColor: "bg-[#FF8CB1]",
  },
];

export const communityMessages: CommunityMessage[] = [
  {
    id: "msg-1",
    groupId: "heart-care",
    author: "Coach Meera",
    text: "New BP tracking workshop starts this Saturday. Bring your monitor.",
    time: "09:40",
  },
  {
    id: "msg-2",
    groupId: "diabetes-balance",
    author: "Dr. Aman",
    text: "Updated meal guide shared. Check the resources tab for recipes.",
    time: "11:15",
  },
  {
    id: "msg-3",
    groupId: "mindful-reset",
    author: "Host Team",
    text: "Tonight's breathing session begins at 7:30 PM, join early.",
    time: "14:05",
  },
];
