import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { Icon } from "../../components/Icon";
import { formatMoney } from "../../lib/format";
import { EASE } from "../../lib/motion";
import type { RoomType } from "../../types/api";

type RoomCardProps = {
  room: RoomType;
  photo: string;
  branchSlug: string;
  index: number;
};

/** Room highlight card: lifts on hover and zooms its photograph gently. */
export function RoomCard({ room, photo, branchSlug, index }: RoomCardProps) {
  const reduce = useReducedMotion();
  const interactive = room.canBook;
  return (
    <motion.article
      className={`editorial-room room-${index + 1}`}
      transition={{ duration: 0.3, ease: EASE }}
    >
      <div
        className="editorial-room-photo"
        role="img"
        aria-label={room.images?.[0]?.alt ?? room.name}
      >
        {photo && (
          <motion.div
            className="editorial-room-photo-fill"
            style={{ backgroundImage: `url("${photo}")` }}
            initial={false}
            whileHover={reduce || !interactive ? undefined : { scale: 1.05 }}
            transition={{ duration: 0.8, ease: EASE }}
          />
        )}
      </div>
      <div className="editorial-room-copy">
        <h3>{room.name}</h3>
        <p className="room-description">{room.description}</p>
        <div className="room-specs">
          <span className="room-spec"><Icon name="ruler" />{room.sizeM2} m²</span>
          <span className="room-spec"><Icon name="bed" />{room.bed}</span>
          <span className="room-spec"><Icon name="users" />Up to {room.capacity} guests</span>
        </div>
        <div className="editorial-room-footer">
          <div>
            <strong>{formatMoney(room.pricePerNight)}</strong>
            <small>per room, per night · VAT included</small>
            {room.totalPrice != null && (
              <small>
                {formatMoney(room.totalPrice)} for{" "}
                {room.nights ?? 1} night{room.nights === 1 ? "" : "s"} · {room.roomsNeeded} room
                {room.roomsNeeded === 1 ? "" : "s"}
              </small>
            )}
          </div>
          <div className="room-card-actions">
            <Link className="button room-select-cta" to={`/room/${branchSlug}/${room.slug}`}>
              Select room
            </Link>
            {!room.canBook && <span className="unavailable">Unavailable for this stay</span>}
          </div>
        </div>
        {room.amenities?.length > 0 && (
          <p className="room-amenities">
            {room.amenities
              .slice(0, 4)
              .map((amenity) => amenity.name)
              .join(" · ")}
          </p>
        )}
      </div>
    </motion.article>
  );
}
