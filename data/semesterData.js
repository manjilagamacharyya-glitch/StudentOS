// data/semesterData.js

export const subjects = {
  OOPS: "Object Oriented Programming using C++",
  DCLD: "Digital Circuit and Logic Design",
  IDC: "Accountancy",
  SEC3: "Internet, Web designing and System Admin",
  AEC3: "Assamese",
  Maths: "Mathematics"
};

export const classRoutine = {
  Monday: [
    { id: 'mon1', time: "10:00", endTime: "11:00", subject: "IDC", room: "Room 1" },
    { id: 'mon2', time: "11:00", endTime: "12:00", subject: "Maths", room: "IT 2 Room" },
    { id: 'mon3', time: "12:00", endTime: "13:00", subject: "DCLD", room: "IT 2 Room" }
  ],
  Tuesday: [
    { id: 'tue1', time: "10:00", endTime: "11:00", subject: "DCLD", room: "IT 2 Room" },
    { id: 'tue2', time: "12:00", endTime: "13:00", subject: "SEC-3", room: "IT Lab" },
    { id: 'tue3', time: "14:00", endTime: "16:00", subject: "OOPS Lab", room: "IT Lab" }
  ],
  Wednesday: [
    { id: 'wed1', time: "09:00", endTime: "10:00", subject: "OOPS", room: "IT 2 Room" },
    { id: 'wed2', time: "10:00", endTime: "11:00", subject: "Maths", room: "IT 2 Room" },
    { id: 'wed3', time: "11:00", endTime: "12:00", subject: "IDC", room: "Room 1" },
    { id: 'wed4', time: "12:00", endTime: "13:00", subject: "DCLD", room: "IT 1 Room" },
    { id: 'wed5', time: "14:00", endTime: "16:00", subject: "SEC-3 Lab", room: "IT Lab" }
  ],
  Thursday: [
    { id: 'thu1', time: "09:00", endTime: "11:00", subject: "OOPS Lab", room: "IT Lab" },
    { id: 'thu2', time: "11:00", endTime: "12:00", subject: "DCLD", room: "IT 2 Room" },
    { id: 'thu3', time: "12:00", endTime: "13:00", subject: "IDC", room: "Room 1" }
  ],
  Friday: [
    { id: 'fri1', time: "09:00", endTime: "10:00", subject: "Maths", room: "IT 2 Room" },
    { id: 'fri2', time: "10:00", endTime: "11:00", subject: "DCLD", room: "IT 2 Room" },
    { id: 'fri3', time: "12:00", endTime: "13:00", subject: "OOPS", room: "IT 2 Room" },
    { id: 'fri4', time: "14:00", endTime: "15:00", subject: "AEC-3", room: "Room 1" }
  ],
  Saturday: [
    { id: 'sat1', time: "09:00", endTime: "11:00", subject: "SEC-3 Lab", room: "IT Lab" },
    { id: 'sat2', time: "11:00", endTime: "12:00", subject: "Maths", room: "IT 2 Room" },
    { id: 'sat3', time: "12:00", endTime: "13:00", subject: "OOPS", room: "IT 2 Room" }
  ],
  Sunday: []
};

/// Add these to data/semesterData.js in the holidayList2026 array
export const holidayList2026 = [
  { date: "2026-01-14", name: "Magh Bihu & Tusu Puja" },
  { date: "2026-01-23", name: "Netaji's Birthday" },
  { date: "2026-01-26", name: "Republic Day" },
  { date: "2026-01-27", name: "Gwthar Bathou San" },
  { date: "2026-01-31", name: "Me-Dam-Me-Phi" },
  { date: "2026-02-01", name: "Bir Chilaray Divas" },
  { date: "2026-03-03", name: "Dol Jatra" },
  { date: "2026-03-21", name: "Id-Ul-Fitr" },
  { date: "2026-04-03", name: "Good Friday" },
  { date: "2026-04-14", name: "Bohag Bihu" },
  { date: "2026-04-15", name: "Bohag Bihu" },
  { date: "2026-04-16", name: "Bohag Bihu" },
  // Continue adding the rest of the list...
];