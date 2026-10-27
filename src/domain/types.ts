export interface Stay {
  checkIn?: string | undefined;
  checkOut?: string | undefined;
  guests: number;
  rooms: number;
}

export interface DatedStay extends Stay {
  checkIn: string;
  checkOut: string;
}

export interface BranchFilters extends Stay {
  roomType?: string | undefined;
  city?: string | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
}

export interface ImageRow {
  url: string;
  alt: string;
}

export interface NamedIconRow {
  name: string;
  icon: string | null;
}

export interface PolicyRow {
  type: string;
  title: string;
  body: string;
}

export interface BranchRow {
  id: number;
  slug: string;
  name: string;
  description: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  phone: string;
  email: string;
  starRating: number;
  checkInTime: string;
  checkOutTime: string;
}

export interface BranchSummaryRow {
  slug: string;
  name: string;
  city: string;
  address: string;
  starRating: number;
  lat: number;
  lng: number;
  imageUrl: string | null;
  imageAlt: string | null;
  fromPrice: number;
}

export interface RoomTypeAvailabilityRow {
  roomTypeId: number;
  slug: string;
  name: string;
  tag: string | null;
  description: string;
  bed: string;
  sizeM2: number;
  capacity: number;
  pricePerNight: number;
  availableRooms: number;
}

export interface RoomTypeImageRow extends ImageRow {
  roomTypeId: number;
}

export interface RoomTypeAmenityRow extends NamedIconRow {
  roomTypeId: number;
}

export interface RoomTypeDetails {
  images: ImageRow[];
  amenities: NamedIconRow[];
}

export interface StayQuote {
  nights: number;
  totalPrice: number;
  vatIncluded: number;
}

export interface RoomTypeView
  extends RoomTypeAvailabilityRow, RoomTypeDetails, Partial<StayQuote> {
  roomsNeeded: number;
  canBook: boolean;
}

export interface BranchDetail extends BranchRow {
  images: ImageRow[];
  amenities: NamedIconRow[];
  policies: PolicyRow[];
  roomTypes: RoomTypeView[];
}

export interface Availability {
  branch: { slug: string; name: string };
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  rooms: number;
  roomTypes: RoomTypeView[];
}
