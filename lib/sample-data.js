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
    barcode: "48291",
    checkedInAt: "2026-07-11T03:00:00.000Z",
    firstName: "Mina",
    lastName: "Khan",
    phoneNumber: "+1 (555) 210-8891",
    attendance: "Attending",
    rsvp: "Going",
    enteredAt: "2026-07-09T09:10:00.000Z",
    registeredAt: "2026-07-09T09:24:00.000Z",
    createdAt: "2026-07-09T09:24:00.000Z",
    avatar: demoPhoto,
    survey: {
      howDidYouKnow: "Friends",
      referredBy: "Sara",
      dietaryRestrictions: "None",
      resident: "Yes",
      submittedAt: "2026-07-09T10:02:00.000Z",
    },
  },
  {
    id: "2",
    barcode: "27460",
    firstName: "Jordan",
    lastName: "Lee",
    phoneNumber: "+1 (555) 410-2233",
    attendance: "Pending",
    rsvp: "maybe",
    enteredAt: "2026-07-09T08:31:00.000Z",
    registeredAt: "2026-07-09T08:46:00.000Z",
    createdAt: "2026-07-09T08:46:00.000Z",
    avatar: demoPhoto,
    survey: {
      howDidYouKnow: "Instagram",
      referredBy: "",
      dietaryRestrictions: "Vegetarian",
      resident: "No",
      submittedAt: "2026-07-09T09:12:00.000Z",
    },
  },
  {
    id: "3",
    barcode: "91345",
    firstName: "Amara",
    lastName: "Singh",
    phoneNumber: "+1 (555) 677-0009",
    attendance: "Confirmed",
    rsvp: "not going",
    enteredAt: "2026-07-07T13:05:00.000Z",
    registeredAt: "2026-07-07T13:42:00.000Z",
    createdAt: "2026-07-07T13:42:00.000Z",
    avatar: demoPhoto,
    survey: null,
  },
  {
    id: "4",
    barcode: "65012",
    firstName: "Noah",
    lastName: "Martinez",
    phoneNumber: "+1 (555) 302-1184",
    attendance: "Waitlist",
    rsvp: "Going",
    enteredAt: "2026-07-06T20:16:00.000Z",
    registeredAt: "2026-07-06T20:28:00.000Z",
    createdAt: "2026-07-06T20:28:00.000Z",
    avatar: demoPhoto,
    survey: {
      howDidYouKnow: "Eventbrite",
      referredBy: "",
      dietaryRestrictions: "Nut allergy",
      resident: "Yes",
      submittedAt: "2026-07-06T21:14:00.000Z",
    },
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
        message: "The support chatbot could not solve this.",
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
        message: "I already tried the support chat.",
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
