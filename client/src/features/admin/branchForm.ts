export const BRANCH_FIELDS = [
  { key: "slug", label: "URL slug" },
  { key: "name", label: "Branch name" },
  { key: "description", label: "Description" },
  { key: "address", label: "Street address" },
  { key: "city", label: "City" },
  { key: "lat", label: "Latitude" },
  { key: "lng", label: "Longitude" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "starRating", label: "Star rating" },
  { key: "checkInTime", label: "Check-in time" },
  { key: "checkOutTime", label: "Check-out time" },
] as const;

export type BranchField = (typeof BRANCH_FIELDS)[number]["key"];
export type BranchInput = Record<BranchField, string>;

export const BLANK_BRANCH: BranchInput = {
  slug: "",
  name: "",
  description: "",
  address: "",
  city: "",
  lat: "",
  lng: "",
  phone: "+27 ",
  email: "",
  starRating: "",
  checkInTime: "14:00",
  checkOutTime: "10:00",
};

const NUMBER_FIELDS: BranchField[] = ["lat", "lng", "starRating"];
const TIME_FIELDS: BranchField[] = ["checkInTime", "checkOutTime"];

export function fieldType(key: BranchField): "number" | "time" | "email" | "text" {
  if (NUMBER_FIELDS.includes(key)) return "number";
  if (TIME_FIELDS.includes(key)) return "time";
  return key === "email" ? "email" : "text";
}

export function toBranchPayload(input: BranchInput) {
  return {
    ...input,
    lat: Number(input.lat),
    lng: Number(input.lng),
    starRating: Number(input.starRating),
    isPublished: true,
  };
}

// After a branch is created, keep the shared fields (phone prefix, times, coordinates)
// so staff adding several branches do not retype them.
export const afterCreate = (input: BranchInput): BranchInput => ({
  ...input,
  slug: "",
  name: "",
  description: "",
  address: "",
  city: "",
  email: "",
});