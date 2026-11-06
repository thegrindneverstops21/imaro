import { Link } from "react-router-dom";
import { displayBrand } from "../../lib/format";
import type { Branch } from "../../types/api";

export type Section = "hotel" | "stay-information" | "contact";

export const SECTION_TITLES: Record<Section, string> = {
  hotel: "Our hotel",
  "stay-information": "Before you arrive",
  contact: "Contact the hotel",
};

const DINING_NOTE =
  "Dining hours and menus have not been published here. Contact the hotel for current information.";
const NO_DETAILS = "Hotel details will be added here when available.";
const NO_POLICIES =
  "Policies have not been published for this location. Please confirm them with the hotel before booking.";
const NO_CONTACT = "Contact details have not been published for this location.";
const MAPS_SEARCH = "https://www.google.com/maps/search/?api=1&query=";

const clock = (time: string) => time.slice(0, 5);
const phoneHref = (phone: string) => `tel:${phone.replace(/[^+\d]/g, "")}`;

function HotelPhoto({ branch }: { branch: Branch }) {
  const photo = branch.images?.[0];
  if (!photo) return null;
  return (
    <figure className="hotel-information-photo">
      <img
        src={photo.url}
        alt={photo.alt || displayBrand(branch.name)}
        width="1200"
        height="800"
      />
      <figcaption>Illustrative imagery</figcaption>
    </figure>
  );
}

function HotelSection({ branch }: { branch: Branch }) {
  return (
    <>
      <HotelPhoto branch={branch} />
      <h2>{displayBrand(branch.name)}</h2>
      <p>
        {branch.description ? displayBrand(branch.description) : NO_DETAILS}
      </p>
      {!!branch.amenities?.length && (
        <>
          <h2>At the hotel</h2>
          <ul className="information-amenities">
            {branch.amenities.map((item) => (
              <li key={item.name}>{item.name}</li>
            ))}
          </ul>
        </>
      )}
      <h2>Dining</h2>
      <p>{DINING_NOTE}</p>
    </>
  );
}

function StaySection({ branch }: { branch: Branch }) {
  const policies = branch.policies ?? [];
  return (
    <>
      <h2>{displayBrand(branch.name)}</h2>
      <p>
        Read the hotel’s supplied policies before booking. Contact the hotel
        about any requirements that are not covered below.
      </p>
      <div className="checkout-policies">
        {policies.length ? (
          policies.map((policy) => (
            <details key={`${policy.type}-${policy.title}`} open>
              <summary>{policy.title}</summary>
              <p>{displayBrand(policy.body)}</p>
            </details>
          ))
        ) : (
          <p>{NO_POLICIES}</p>
        )}
      </div>
    </>
  );
}

function ContactLinks({ branch }: { branch: Branch }) {
  const { phone, email } = branch;
  if (!phone && !email) return <p>{NO_CONTACT}</p>;
  return (
    <div className="contact-links">
      {phone && <a href={phoneHref(phone)}>{phone}</a>}
      {email && <a href={`mailto:${email}`}>{email}</a>}
    </div>
  );
}

function ContactSection({ branch }: { branch: Branch }) {
  const place = encodeURIComponent(`${branch.address}, ${branch.city}`);
  return (
    <>
      <h2>{displayBrand(branch.name)}</h2>
      <p>
        For arrival arrangements, accessibility requirements or questions about
        an existing reservation, contact your selected hotel.
      </p>
      <address>
        {branch.address}
        <br />
        {branch.city}
      </address>
      <ContactLinks branch={branch} />
      <a
        className="text-button"
        href={`${MAPS_SEARCH}${place}`}
        target="_blank"
        rel="noreferrer"
      >
        View address in Google Maps (opens a new tab)
      </a>
    </>
  );
}

type ContentProps = { section: Section; branch: Branch };

export function SectionContent({ section, branch }: ContentProps) {
  if (section === "hotel") return <HotelSection branch={branch} />;
  if (section === "stay-information") return <StaySection branch={branch} />;
  return <ContactSection branch={branch} />;
}

type AsideProps = { branch: Branch; query: string };

export function InformationAside({ branch, query }: AsideProps) {
  return (
    <aside className="information-aside">
      <h2>Your stay in {branch.city}</h2>
      <p>{branch.address}</p>
      {branch.checkInTime && <p>Check in from {clock(branch.checkInTime)}</p>}
      {branch.checkOutTime && <p>Check out by {clock(branch.checkOutTime)}</p>}
      <Link className="button" to={`/rooms${query}`}>
        Choose a room
      </Link>
      <Link className="text-button" to="/manage">
        Manage an existing booking
      </Link>
    </aside>
  );
}
