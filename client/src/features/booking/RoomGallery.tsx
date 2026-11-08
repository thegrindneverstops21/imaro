import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "../../components/Icon";
import { EASE } from "../../lib/motion";

type RoomImage = { url: string; alt: string };

type RoomGalleryProps = {
  images: RoomImage[];
  roomName: string;
};

/** Room photograph gallery: crossfade between images, arrow-key navigable. */
export function RoomGallery({ images, roomName }: RoomGalleryProps) {
  const [imageIndex, setImageIndex] = useState(0);
  const image = images[imageIndex] ?? images[0];

  const changeImage = (offset: number) =>
    setImageIndex((current) => (current + offset + images.length) % images.length);

  return (
    <div
      className="room-gallery"
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") changeImage(-1);
        if (event.key === "ArrowRight") changeImage(1);
      }}
    >
      <div className="room-detail-image">
        {image ? (
          <AnimatePresence mode="wait" initial={false}>
            <motion.img
              key={image.url}
              className="room-gallery-main"
              src={image.url}
              alt={image.alt || roomName}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: EASE }}
            />
          </AnimatePresence>
        ) : (
          <p>Room photography is not available yet.</p>
        )}
        {images.length > 1 && (
          <div className="room-gallery-controls">
            <button type="button" aria-label="Previous room image" onClick={() => changeImage(-1)}>
              <Icon name="arrowLeft" />
            </button>
            <span aria-live="polite" aria-atomic="true">
              {imageIndex + 1} / {images.length}
            </span>
            <button type="button" aria-label="Next room image" onClick={() => changeImage(1)}>
              <Icon name="arrowRight" />
            </button>
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="room-gallery-thumbnails" aria-label="Room images">
          {images.map((roomImage, index) => (
            <button
              type="button"
              key={roomImage.url}
              className={index === imageIndex ? "active" : ""}
              aria-label={`Show room image ${index + 1}`}
              aria-pressed={index === imageIndex}
              onClick={() => setImageIndex(index)}
            >
              <img src={roomImage.url} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
