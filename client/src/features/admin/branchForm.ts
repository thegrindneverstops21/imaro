export const BRANCH_FIELDS = [
  { key: "name", label: "Branch name" },
  { key: "slug", label: "URL name (slug)" },
  { key: "description", label: "Description" },
  { key: "address", label: "Street address" },
  { key: "city", label: "City" },
  { key: "lat", label: "Map latitude" },
  { key: "lng", label: "Map longitude" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "starRating", label: "Star rating" },
  { key: "checkInTime", label: "Check-in time" },
  { key: "checkOutTime", label: "Check-out time" },
] as const;

export type BranchField = (typeof BRANCH_FIELDS)[number]["key"];
export type BranchInput = Record<BranchField, string> & {
  isPublished: boolean;
  images: { url: string; alt: string }[];
  amenities: string;
  cancellation: string;
  houseRules: string;
};

export const branchSlug = (name: string) => name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100).replace(/-$/, "");

export const BLANK_BRANCH: BranchInput = {
  isPublished: false,
  images: [],
  amenities: "",
  cancellation: "",
  houseRules: "",
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

export function fieldType(key: BranchField): "number" | "time" | "email" | "tel" | "text" {
  if (NUMBER_FIELDS.includes(key)) return "number";
  if (TIME_FIELDS.includes(key)) return "time";
  if (key === "phone") return "tel";
  return key === "email" ? "email" : "text";
}

export function toBranchPayload(input: BranchInput) {
  const { amenities, cancellation, houseRules, ...fields } = input;
  return {
    ...fields,
    slug: input.slug.trim(),
    lat: Number(input.lat),
    lng: Number(input.lng),
    starRating: Number(input.starRating),
    amenities: [...new Set(amenities.split("\n").map((name) => name.trim()).filter(Boolean))],
    policies: [
      { type: "cancellation", title: "Cancellation policy", body: cancellation.trim() },
      { type: "house_rules", title: "House rules", body: houseRules.trim() },
    ].filter((policy) => policy.body),
  };
}

export const afterCreate = (input: BranchInput): BranchInput => ({
  ...input,
  slug: "", name: "", description: "", address: "", city: "", email: "",
  isPublished: false, images: [], amenities: "", cancellation: "", houseRules: "",
});

