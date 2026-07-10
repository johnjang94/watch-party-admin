import heroImage from "../image.png";

const demoPhoto = heroImage;

export const demoAdminSession = {
  id: "demo-session",
  firstName: "John",
  lastName: "Jang",
  phoneNumber: "647-553-3499",
  createdAt: "2026-07-09T09:24:00.000Z",
};

export const sampleAllUsers = [
  {
    id: "1",
    firstName: "Mina",
    lastName: "Khan",
    phoneNumber: "+1 (555) 210-8891",
    attendance: "Attending",
    enteredAt: "2026-07-09T09:10:00.000Z",
    registeredAt: "2026-07-09T09:24:00.000Z",
    createdAt: "2026-07-09T09:24:00.000Z",
    avatar: demoPhoto,
  },
  {
    id: "2",
    firstName: "Jordan",
    lastName: "Lee",
    phoneNumber: "+1 (555) 410-2233",
    attendance: "Pending",
    enteredAt: "2026-07-09T08:31:00.000Z",
    registeredAt: "2026-07-09T08:46:00.000Z",
    createdAt: "2026-07-09T08:46:00.000Z",
    avatar: demoPhoto,
  },
  {
    id: "3",
    firstName: "Amara",
    lastName: "Singh",
    phoneNumber: "+1 (555) 677-0009",
    attendance: "Confirmed",
    enteredAt: "2026-07-07T13:05:00.000Z",
    registeredAt: "2026-07-07T13:42:00.000Z",
    createdAt: "2026-07-07T13:42:00.000Z",
    avatar: demoPhoto,
  },
  {
    id: "4",
    firstName: "Noah",
    lastName: "Martinez",
    phoneNumber: "+1 (555) 302-1184",
    attendance: "Waitlist",
    enteredAt: "2026-07-06T20:16:00.000Z",
    registeredAt: "2026-07-06T20:28:00.000Z",
    createdAt: "2026-07-06T20:28:00.000Z",
    avatar: demoPhoto,
  },
];

export const sampleNewUsers = sampleAllUsers.slice(0, 2);

export const sampleInquiries = [
  {
    id: "inq-1",
    customer: "Mina Khan",
    currentAgent: "Agent A",
    status: "New inquiry",
    question: "How do I connect to the watch party?",
    createdAt: "2026-07-09T09:40:00.000Z",
    updatedAt: "2026-07-09T09:44:00.000Z",
    thread: [
      {
        role: "user",
        message: "The FAQ bot could not solve this.",
        createdAt: "2026-07-09T09:40:00.000Z",
      },
      {
        role: "agent",
        message: "I can help you right away.",
        createdAt: "2026-07-09T09:44:00.000Z",
      },
    ],
  },
  {
    id: "inq-2",
    customer: "Jordan Lee",
    currentAgent: "Agent B",
    status: "In progress",
    question: "Can you confirm my registration details?",
    createdAt: "2026-07-09T08:55:00.000Z",
    updatedAt: "2026-07-09T09:02:00.000Z",
    thread: [
      {
        role: "user",
        message: "I already tried the FAQ chat.",
        createdAt: "2026-07-09T08:55:00.000Z",
      },
      {
        role: "agent",
        message: "I am checking the record now.",
        createdAt: "2026-07-09T09:02:00.000Z",
      },
    ],
  },
];
