export const getTodayDateString = () => {
  const date = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const formatFirestoreDate = (value) => {
  if (!value) return "";

  // Firestore Timestamp
  if (typeof value.toDate === "function") {
    return value.toDate().toLocaleDateString();
  }

  // ISO string or JS Date
  return new Date(value).toLocaleDateString();
};