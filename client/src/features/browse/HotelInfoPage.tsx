import { Link, useSearchParams } from "react-router-dom";
import { displayBrand } from "../../lib/format";
import type { Branch } from "../../types/api";
import { BookingLoading } from "../booking/BookingLoading";
import {
  InformationAside,
  SECTION_TITLES,
  SectionContent,
  type Section,
} from "./InformationSections";
import { useBranchInformation } from "./useBranchInfo";

const SECTIONS = Object.keys(SECTION_TITLES) as Section[];
const NO_INFORMATION = "No hotel information is available yet. Please check again later.";

type HeadingProps = {
  section: Section;
  branches: Branch[];
  selected: string;
  loading: boolean;
  onSelect: (slug: string) => void;
};

function InformationHeading({ section, branches, selected, loading, onSelect }: HeadingProps) {
  return (
    <div className="information-heading">
      <div>
        <h1>{SECTION_TITLES[section]}</h1>
        <p>Choose your location for hotel information and help with your stay.</p>
      </div>
      <label>
        Hotel location
        <select
          value={selected}
          disabled={loading}
          onChange={(event) => onSelect(event.target.value)}
        >
          {!selected && <option value="">Choose a location</option>}
          {branches.map((item) => (
            <option key={item.slug} value={item.slug}>
              {displayBrand(item.name)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

type NavProps = { section: Section; query: string };

function InformationNav({ section, query }: NavProps) {
  return (
    <nav className="information-nav" aria-label="Hotel information">
      {SECTIONS.map((item) => (
        <Link
          key={item}
          aria-current={item === section ? "page" : undefined}
          to={`/${item}${query}`}
        >
          {SECTION_TITLES[item]}
        </Link>
      ))}
    </nav>
  );
}

export function HotelInfoPage({ section }: { section: Section }) {
  const [params, setParams] = useSearchParams();
  const { branches, branch, loading, error, reload } = useBranchInformation(
    params.get("branch") ?? "",
  );
  const query = branch ? `?branch=${encodeURIComponent(branch.slug)}` : "";

  return (
    <section className="page-shell guest-checkout hotel-information">
      <InformationHeading
        section={section}
        branches={branches}
        selected={branch?.slug ?? ""}
        loading={loading}
        onSelect={(slug) => setParams({ branch: slug })}
      />
      <InformationNav section={section} query={query} />
      {loading && <BookingLoading embedded label="Loading hotel information…" />}
      {error && (
        <p className="form-error" role="alert">
          {error}{" "}
          <button type="button" className="text-button" onClick={reload}>
            Try again
          </button>
        </p>
      )}
      {!loading && !error && !branch && <p>{NO_INFORMATION}</p>}
      {branch && (
        <div className="information-layout">
          <div>
            <SectionContent section={section} branch={branch} />
          </div>
          <InformationAside branch={branch} query={query} />
        </div>
      )}
    </section>
  );
}