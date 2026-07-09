import heroImage from "../image.png";

export const sampleNewUsers = [
  {
    id: "1",
    firstName: "Mina",
    lastName: "Khan",
    phoneNumber: "+1 (555) 210-8891",
    attendance: "Attending",
    enteredAt: "2026-07-09 09:10",
    registeredAt: "2026-07-09 09:24",
    avatar: heroImage,
  },
];

export const sampleAllUsers = [
  ...sampleNewUsers,
  {
    id: "2",
    firstName: "Jordan",
    lastName: "Lee",
    phoneNumber: "+1 (555) 410-2233",
    attendance: "Pending",
    enteredAt: "2026-07-07 13:05",
    registeredAt: "2026-07-07 13:42",
    avatar: heroImage,
  },
];

export const sampleInquiries = [
  {
    id: "inq-1",
    customer: "Mina Khan",
    assignedTo: "Agent A",
    question: "How do I connect to the watch party?",
    thread: [
      { role: "user", message: "The FAQ bot could not solve this." },
      { role: "agent", message: "I can help you right away." },
    ],
  },
];
