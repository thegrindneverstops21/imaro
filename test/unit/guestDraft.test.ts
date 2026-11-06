import { describe, expect, it } from "vitest";
import { appReducer, setGuestDraft, clearGuestDraft, setStay } from "../../client/src/app/store";

describe("guest details draft", () => {
  it("keeps guest input when the selected stay changes", () => {
    let state = appReducer(undefined, setGuestDraft({ guestName: "Test Guest", guestEmail: "guest@example.com", guestPhone: "+27123456789", specialRequests: "Late arrival" }));
    state = appReducer(state, setStay({ checkIn: "2027-01-01", checkOut: "2027-01-03", guests: 2, rooms: 1 }));
    expect(state.guestDraft.guestName).toBe("Test Guest");
    expect(state.guestDraft.specialRequests).toBe("Late arrival");
  });
  it("clears personal input when the booking hold is created", () => {
    const state = appReducer(undefined, setGuestDraft({ guestName: "Test Guest", guestEmail: "guest@example.com", guestPhone: "12345", specialRequests: "" }));
    expect(appReducer(state, clearGuestDraft()).guestDraft).toEqual({ guestName: "", guestEmail: "", guestPhone: "", specialRequests: "" });
  });
});
