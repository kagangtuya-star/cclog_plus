const DEFAULT_BASE_URL =
  "https://firestore.googleapis.com/v1/projects/ccfolia-160aa/databases/(default)/documents/rooms/";
const DEFAULT_MESSAGES_QUERY = "/messages/?pageSize=300";

const { VITE_FIREBASE_BASE_URL, VITE_MESSAGES_QUERY } = import.meta.env;

export const FIREBASE_BASE_URL = VITE_FIREBASE_BASE_URL || DEFAULT_BASE_URL;
export const MESSAGES_QUERY = VITE_MESSAGES_QUERY || DEFAULT_MESSAGES_QUERY;
