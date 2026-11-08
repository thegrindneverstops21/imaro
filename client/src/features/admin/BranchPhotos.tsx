import { useRef, useState } from "react";
import { FieldError } from "../../components/ui/Form";
import { API_URL, message, request } from "../../lib/api";

type Photo = { url: string; alt: string };

export function BranchPhotos({
  images,
  onChange,
  onBusy,
}: {
  images: Photo[];
  onChange: (images: Photo[]) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  async function upload(files: File[]) {
    setError("");
    if (files.length + images.length > 20) {
      setError("You can add up to 20 photos. Please select fewer files.");
      return;
    }
    if (
      files.some(
        (file) =>
          !["image/jpeg", "image/png", "image/webp"].includes(file.type),
      )
    ) {
      setError("Please choose JPEG, PNG or WebP images.");
      return;
    }
    if (files.some((file) => !file.size || file.size > 5 * 1024 * 1024)) {
      setError("Please choose images smaller than 5 MB each.");
      return;
    }
    setUploading(true);
    onBusy(true);
    const updated = [...images];
    try {
      for (const file of files) {
        const result = await request<{ path: string }>("/admin/uploads", {
          method: "POST",
          headers: { "content-type": "application/octet-stream" },
          body: file,
        });
        updated.push({
          url: new URL(result.path, new URL(API_URL, window.location.origin))
            .href,
          alt: "",
        });
        onChange([...updated]);
      }
    } catch (cause) {
      setError(
        `${message(cause)} Any photos already uploaded are kept below; please retry the remaining files.`,
      );
    } finally {
      setUploading(false);
      onBusy(false);
    }
  }

  return (
    <section
      className="span-two branch-content-fields"
      aria-labelledby="branch-photos-title"
    >
      <h3 id="branch-photos-title">Photos</h3>
      <p className="small-note">
        Upload from your device or add an image URL. JPEG, PNG or WebP, up to 5
        MB each and 20 photos. The first photo is the cover. Use photos you have
        permission to share.
      </p>
      <input
        ref={fileInput}
        type="file"
        hidden
        multiple
        accept="image/jpeg,image/png,image/webp"
        aria-label="Choose property photos"
        disabled={uploading || images.length >= 20}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (files.length) void upload(files);
        }}
      />
      <div className="branch-photo-actions">
        <button
          type="button"
          className="button button-quiet"
          disabled={uploading || images.length >= 20}
          onClick={() => fileInput.current?.click()}
        >
          {uploading ? "Uploading photos…" : "Upload from device"}
        </button>
        <button
          type="button"
          className="text-button"
          disabled={uploading || images.length >= 20}
          onClick={() => onChange([...images, { url: "", alt: "" }])}
        >
          Add image URL
        </button>
      </div>
      {uploading && (
        <p role="status">Uploading photos. Please keep this form open.</p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {images.map((image, index) => (
        <div className="branch-photo-row" key={index}>
          <label>
            Image URL
            <input
              name={`image-${index}`}
              type="url"
              pattern="https?://.*"
              required
              maxLength={2048}
              value={image.url}
              placeholder="Enter image URL"
              disabled={uploading}
              onChange={(event) =>
                onChange(
                  images.map((item, i) =>
                    i === index ? { ...item, url: event.target.value } : item,
                  ),
                )
              }
            />
            <FieldError name={`image-${index}`} />
          </label>
          <label>
            Alt text
            <input
              name={`alt-${index}`}
              required
              maxLength={300}
              value={image.alt}
              placeholder="Describe the photo"
              disabled={uploading}
              onChange={(event) =>
                onChange(
                  images.map((item, i) =>
                    i === index ? { ...item, alt: event.target.value } : item,
                  ),
                )
              }
            />
            <FieldError name={`alt-${index}`} />
          </label>
          <button
            type="button"
            className="text-button"
            disabled={uploading}
            aria-label={`Remove photo ${index + 1}`}
            onClick={() => onChange(images.filter((_, i) => i !== index))}
          >
            Remove
          </button>
        </div>
      ))}
    </section>
  );
}
