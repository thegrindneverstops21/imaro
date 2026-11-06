import type { CancellationOutcome } from "./cancellation";

export interface CreateBookingInput {
  branchSlug: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests?: string | undefined;
}

export interface RoomOffer {
  branchId: number;
  roomTypeId: number;
  pricePerNight: number;
  capacity: number;
}

export interface FreeRoomSearch {
  branchId: number;
  roomTypeId: number;
  checkIn: string;
  checkOut: string;
  limit: number;
}

export interface NewBooking {
  reference: string;
  branchId: number;
  userId: number | null;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  specialRequests: string | null;
  accessTokenHash: string;
  totalAmount: number;
  holdExpiresAt: Date;
}

export interface BookingRoomsInsert {
  bookingId: number;
  roomIds: number[];
  pricePerNight: number;
  checkIn: string;
  checkOut: string;
}

export interface BookingRow {
  amountPaid?: number;
  specialRequests?: string | null;
  id: number;
  reference: string;
  userId: number | null;
  branchSlug: string;
  branchName: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  holdExpiresAt: Date | null;
  accessTokenHash: string;
  createdAt: Date;
}

export interface RoomSummary {
  roomType: string;
  rooms: number;
  pricePerNight: number;
}

// Proof of the right to see a booking: its manage token and/or the signed-in owner. `manageToken` is the secret emailed to the guest (like a booking password); `userId` is set when the guest is signed in.
export interface BookingAccess {
  token: string | undefined;
  userId: number | null;
}

export interface CreatedBooking {
  amountPaid: number;
  balanceDue: number;
  reference: string;
  manageToken: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  vatIncluded: number;
  currency: string;
  nights: number;
  roomsBooked: number;
  holdExpiresAt: string;
}

export interface BookingView {
  amountPaid: number;
  balanceDue: number;
  reference: string;
  status: string;
  paymentStatus: string;
  branch: { slug: string; name: string };
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalAmount: number;
  vatIncluded: number;
  holdExpiresAt: string | null;
  guest: { name: string; email: string; phone: string };
  rooms: RoomSummary[];
  cancellation: CancellationOutcome | null;
}

export interface CancelResult {
  reference: string;
  status: string;
  paymentStatus: string;
  cancellation: CancellationOutcome;
}

export interface PaymentResult {
  reference: string;
  status: string;
  paymentStatus: string;
  simulated: boolean;
}

export interface PaymentInsert {
  bookingId: number;
  amount: number;
}

export interface BookingListItem {
  amountPaid: number;
  balanceDue: number;
  reference: string;
  status: string;
  paymentStatus: string;
  branchName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  createdAt: Date;
}

export interface BookingFilters {
  search?: string | undefined;
  dateFrom?: string | undefined;
  dateTo?: string | undefined;
  status?: string | undefined;
  paymentStatus?: string | undefined;
  branchId?: number | undefined;
  limit: number;
  offset: number;
}
