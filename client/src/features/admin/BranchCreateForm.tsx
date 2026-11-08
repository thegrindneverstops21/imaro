import { useDraftGuard } from "../../components/ui/NavigationGuard";
import { BranchPhotos } from "./BranchPhotos";
import { useState, type FormEvent } from "react";
import { FieldError, Form } from "../../components/ui/Form";
import {
  BLANK_BRANCH,
  BRANCH_FIELDS,
  branchSlug,
  fieldType,
  type BranchField,
  type BranchInput,
} from "./branchForm";

const limits: Partial<Record<BranchField, number>> = {
  name: 160,
  slug: 100,
  address: 300,
  city: 120,
  phone: 40,
  email: 254,
};

export function BranchCreateForm({
  busy,
  onCreate,
}: {
  busy: boolean;
  onCreate: (input: BranchInput) => Promise<boolean>;
}) {
  const [input, setInput] = useState<BranchInput>({
    ...BLANK_BRANCH,
    images: [],
  });
  const [uploading, setUploading] = useState(false);
  useDraftGuard(input);
  const [slugEdited, setSlugEdited] = useState(false);

  function update(key: BranchField, value: string) {
    if (key === "slug") setSlugEdited(value !== "");
    setInput((current) => ({
      ...current,
      [key]: value,
      ...(key === "name" && !slugEdited ? { slug: branchSlug(value) } : {}),
    }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!uploading) await onCreate(input);
  }

  return (
    <Form
      className="form-grid branch-create-form"
      onSubmit={(event) => void submit(event)}
    >
      <div className="span-two">
        <h3>Property details</h3>
        <p className="small-note">
          Step 1 of 2. Next, add physical rooms and nightly prices.
        </p>
      </div>
      {BRANCH_FIELDS.map(({ key, label }) => (
        <label
          key={key}
          className={
            key === "description" || key === "address" ? "span-two" : ""
          }
        >
          {label}
          {key === "description" ? (
            <textarea
              name={key}
              required
              rows={4}
              value={input[key]}
              onChange={(event) => update(key, event.target.value)}
            />
          ) : key === "starRating" ? (
            <select
              name={key}
              required
              value={input[key]}
              onChange={(event) => update(key, event.target.value)}
            >
              <option value="">Choose a rating</option>
              {[1, 2, 3, 4, 5].map((rating) => (
                <option key={rating} value={rating}>
                  {rating} {rating === 1 ? "star" : "stars"}
                </option>
              ))}
            </select>
          ) : (
            <input
              name={key}
              required
              type={fieldType(key)}
              value={input[key]}
              maxLength={limits[key]}
              min={key === "lat" ? -90 : key === "lng" ? -180 : undefined}
              max={key === "lat" ? 90 : key === "lng" ? 180 : undefined}
              step={key === "lat" || key === "lng" ? "any" : undefined}
              pattern={key === "slug" ? "[a-z0-9]+(?:-[a-z0-9]+)*" : undefined}
              placeholder={key === "slug" ? "imaro-polokwane" : undefined}
              onChange={(event) => update(key, event.target.value)}
            />
          )}
          {key === "slug" && (
            <small>
              For example, imaro-polokwane. Use lowercase letters, numbers and
              hyphens only.
            </small>
          )}
          {(key === "lat" || key === "lng") && (
            <small>
              Right-click the place in Google Maps and copy the numbers.{" "}
              {key === "lat"
                ? "Latitude is the first number (−90 to 90)."
                : "Longitude is the second number (−180 to 180)."}
            </small>
          )}
          <FieldError name={key} />
        </label>
      ))}

      <BranchPhotos
        images={input.images}
        onChange={(images) => setInput((current) => ({ ...current, images }))}
        onBusy={setUploading}
      />
      <label className="span-two">
        Facilities
        <textarea
          name="amenities"
          rows={4}
          value={input.amenities}
          onChange={(event) => {
            const value = event.target.value;
            const names = value
              .split("\n")
              .map((name) => name.trim())
              .filter(Boolean);
            event.target.setCustomValidity(
              names.length > 50 || names.some((name) => name.length > 100)
                ? "Please enter up to 50 facilities, with no more than 100 characters per line."
                : "",
            );
            setInput({ ...input, amenities: value });
          }}
        />
        <small>
          One facility per line, up to 50. Include only facilities this property
          offers; keep each name under 100 characters.
        </small>
        <FieldError name="amenities" />
      </label>
      <label className="span-two">
        Cancellation policy
        <textarea
          name="cancellation"
          rows={4}
          maxLength={5000}
          value={input.cancellation}
          onChange={(event) =>
            setInput({ ...input, cancellation: event.target.value })
          }
        />
        <small>
          Enter the approved policy. This is guest-facing text; it does not
          change the booking system’s cancellation calculations.
        </small>
      </label>
      <label className="span-two">
        House rules
        <textarea
          name="houseRules"
          rows={4}
          maxLength={5000}
          value={input.houseRules}
          onChange={(event) =>
            setInput({ ...input, houseRules: event.target.value })
          }
        />
        <small>Use one rule per line. Leave unknown details blank.</small>
      </label>
      <div className="span-two branch-publish-control">
        <button
          type="button"
          className="branch-publish-switch"
          role="switch"
          aria-checked={input.isPublished}
          aria-labelledby="branch-published-label"
          aria-describedby="branch-published-hint"
          onClick={() =>
            setInput({ ...input, isPublished: !input.isPublished })
          }
        >
          <span aria-hidden="true" />
        </button>
        <span id="branch-published-label">Published</span>
        <small id="branch-published-hint">
          {input.isPublished
            ? "The property details will be public. Guests can book only when rooms and prices are available."
            : "Saved as a draft, hidden from guests. Publish from Branches when setup is complete."}
        </small>
      </div>
      <button className="button span-two" disabled={busy || uploading}>
        {busy ? "Creating branch…" : "Create branch · Add rooms and prices"}
      </button>
    </Form>
  );
}
