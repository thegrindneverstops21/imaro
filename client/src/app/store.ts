import {
  configureStore,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { Stay, User } from "../types/api";
import { initialStay } from "../lib/staySearch";

// localStorage can throw (private mode, disabled storage), so fail softly.
const local = (key: string, fallback: string) => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

export type GuestDraft = {
  guestName: string; guestEmail: string; guestPhone: string;
  specialRequests: string;
};
const emptyGuestDraft: GuestDraft = {
  guestName: "", guestEmail: "", guestPhone: "", specialRequests: "",
};
type State = { stay: Stay; user: User | null; favorites: string[]; guestDraft: GuestDraft };
const persisted: State = {
  stay: initialStay({
    checkIn: local("imaro.checkIn", ""),
    checkOut: local("imaro.checkOut", ""),
    guests: Number(local("imaro.guests", "2")),
    rooms: Number(local("imaro.rooms", "1")),
  }),
  user: null,
  favorites: [],
  guestDraft: emptyGuestDraft,
};

// A "slice" bundles the state shape with the functions that may change it.
// Redux Toolkit lets us "mutate" state directly here; it copies behind the scenes.
const slice = createSlice({
  name: "app",
  initialState: persisted,
  reducers: {
    setGuestDraft(state, action: PayloadAction<GuestDraft>) {
      state.guestDraft = action.payload;
    },
    clearGuestDraft(state) {
      state.guestDraft = emptyGuestDraft;
    },
    setStay(state, action: PayloadAction<Stay>) {
      state.stay = action.payload;
    },
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
      if (!action.payload) state.favorites = [];
    },
    setFavorites(state, action: PayloadAction<string[]>) {
      state.favorites = action.payload;
    },
    toggleFavorite(state, action: PayloadAction<string>) {
      state.favorites = state.favorites.includes(action.payload)
        ? state.favorites.filter((slug) => slug !== action.payload)
        : [...state.favorites, action.payload];
    },
  },
});
export const { setStay, setUser, setFavorites, toggleFavorite, setGuestDraft, clearGuestDraft } = slice.actions;
export const appReducer = slice.reducer;
export const store = configureStore({ reducer: slice.reducer });

// Runs after every action: mirror the parts we want to remember to localStorage.
let lastSavedStay = store.getState().stay;
store.subscribe(() => {
  const { stay } = store.getState();
  if (stay === lastSavedStay) return;
  lastSavedStay = stay;
  try {
  localStorage.setItem("imaro.checkIn", stay.checkIn);
  localStorage.setItem("imaro.checkOut", stay.checkOut);
  localStorage.setItem("imaro.guests", String(stay.guests));
  localStorage.setItem("imaro.rooms", String(stay.rooms));
  } catch { /* Stay and guest input remain usable when browser storage is unavailable. */ }
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
