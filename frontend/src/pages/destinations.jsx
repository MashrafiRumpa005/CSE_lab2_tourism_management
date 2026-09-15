import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Compass,
  Heart,
  Plane,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import SiteHeader from "../components/SiteHeader.jsx";
import { getDestinations } from "../lib/api.js";

const fallbackDestinations = [
  {
    name: "Kyoto",
    country: "Japan",
    region: "Asia",
    style: "Culture",
    duration: "7 days",
    from: 1180,
    bestFor: "First-time Japan",
    route: "Dhaka → Tokyo → Kyoto",
    visa: "Japan visa guidance",
    blurb: "Temple gardens, lantern-lit lanes, and a slower rhythm at the edge of the Higashiyama hills.",
    image: "destination-image-kyoto",
    highlights: ["Arashiyama sunrise", "Tea ceremony in Gion", "Nara day trip"],
  },
  {
    name: "Santorini",
    country: "Greece",
    region: "Europe",
    style: "Beach",
    duration: "5 days",
    from: 940,
    bestFor: "Couples and slow days",
    route: "Dhaka → Athens → Santorini",
    visa: "Schengen checklist",
    blurb: "Whitewashed cliffs, caldera views, and a coastline built for long sunsets and unhurried mornings.",
    image: "destination-image-santorini",
    highlights: ["Oia sunset walk", "Private sailing", "Pyrgos wine tasting"],
  },
  {
    name: "Patagonia",
    country: "Argentina · Chile",
    region: "Americas",
    style: "Adventure",
    duration: "10 days",
    from: 1640,
    bestFor: "Serious hikers",
    route: "Dhaka → Santiago → Patagonia",
    visa: "Border support included",
    blurb: "Glacier trails, granite towers, and wide-open silence at the edge of the map.",
    image: "destination-image-patagonia",
    highlights: ["Torres del Paine W trek", "Glacier boat crossing", "Guided camp nights"],
  },
  {
    name: "Marrakech",
    country: "Morocco",
    region: "Africa",
    style: "Culture",
    duration: "6 days",
    from: 860,
    bestFor: "Food and markets",
    route: "Dhaka → Casablanca → Marrakech",
    visa: "Document review included",
    blurb: "Souks, riads, and the Atlas Mountains rising just beyond the city walls.",
    image: "destination-image-marrakech",
    highlights: ["Medina riad stay", "Atlas Mountains hike", "Jemaa el-Fnaa evening"],
  },
  {
    name: "Bali",
    country: "Indonesia",
    region: "Asia",
    style: "Wellness",
    duration: "6 days",
    from: 720,
    bestFor: "A restorative reset",
    route: "Dhaka → Singapore → Bali",
    visa: "Entry guidance included",
    blurb: "Rice terraces, warm water, and a generous pace for resetting body and mind.",
    image: "destination-image-bali",
    highlights: ["Ubud wellness stay", "Water temple visit", "Private cooking class"],
  },
  {
    name: "Istanbul",
    country: "Türkiye",
    region: "Europe",
    style: "Food",
    duration: "5 days",
    from: 680,
    bestFor: "A long weekend",
    route: "Dhaka → Istanbul",
    visa: "e-Visa guidance included",
    blurb: "Two continents, layered history, and a food scene that rewards every detour.",
    image: "destination-image-istanbul",
    highlights: ["Bosphorus cruise", "Old city walking tour", "Local food trail"],
  },
];

const regions = ["All regions", "Asia", "Europe", "Americas", "Africa"];
const styles = ["All styles", "Culture", "Beach", "Adventure", "Wellness", "Food"];

function DestinationCard({ destination, favorite, onFavorite, onSelect }) {
  const renderImage = (src) => {
    if (typeof src === "string" && /^(https?:|data:image)/i.test(src.trim())) {
      return { backgroundImage: `url("${src}")` };
    }
    return { backgroundImage: undefined };
  };

  return (
    <article className="destination-card">
      <button
        type="button"
        className="destination-card-image"
        onClick={() => onSelect(destination)}
        aria-label={`View ${destination.name} details`}
      >
        <div className={typeof destination.image === "string" && /^(https?:|data:image)/i.test(destination.image.trim()) ? "destination-image custom-image" : `destination-image ${destination.image}`} style={renderImage(destination.image)} />
        <span className="destination-card-region">{destination.region}</span>
      </button>
      <div className="destination-card-body">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="destination-card-country">{destination.country}</p>
            <h2>{destination.name}</h2>
          </div>
          <button
            type="button"
            className={`favorite-button ${favorite ? "is-favorite" : ""}`}
            onClick={() => onFavorite(destination.name)}
            aria-label={`${favorite ? "Remove" : "Save"} ${destination.name}`}
          >
            <Heart size={17} fill={favorite ? "currentColor" : "none"} />
          </button>
        </div>
        <p className="destination-card-blurb">{destination.blurb}</p>
        <div className="destination-card-meta">
          <span><CalendarDays size={14} /> {destination.duration}</span>
          <span><Users size={14} /> {destination.bestFor}</span>
        </div>
        <div className="destination-card-footer">
          <p>From <strong>${destination.from}</strong> <span>/ person</span></p>
          <button type="button" className="text-button" onClick={() => onSelect(destination)}>
            View details <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </article>
  );
}

function DetailPanel({ destination, onClose }) {
  const renderImage = (src) => {
    if (typeof src === "string" && /^(https?:|data:image)/i.test(src.trim())) {
      return { backgroundImage: `url("${src}")` };
    }
    return { backgroundImage: undefined };
  };

  return (
    <div className="destination-detail-backdrop" role="presentation" onClick={onClose}>
      <aside className="destination-detail" role="dialog" aria-modal="true" aria-label={`${destination.name} destination details`} onClick={(event) => event.stopPropagation()}>
        <button type="button" className="detail-close" onClick={onClose} aria-label="Close destination details">
          <X size={20} />
        </button>
        <div className={typeof destination.image === "string" && /^(https?:|data:image)/i.test(destination.image.trim()) ? "detail-image destination-image custom-image" : `detail-image destination-image ${destination.image}`} style={renderImage(destination.image)} />
        <div className="detail-content">
          <p className="eyebrow">{destination.region} · from Dhaka</p>
          <h2>{destination.name}</h2>
          <p className="detail-country">{destination.country} · {destination.duration}</p>
          <p className="detail-blurb">{destination.blurb}</p>
          <div className="detail-route"><Plane size={17} /> {destination.route}</div>
          <div className="detail-route"><ShieldCheck size={17} /> {destination.visa}</div>
          <h3>Built into the journey</h3>
          <ul>
            {destination.highlights.map((highlight) => <li key={highlight}><Check size={15} /> {highlight}</li>)}
          </ul>
          <Link to="/signup" className="detail-cta">Start planning <ArrowRight size={16} /></Link>
        </div>
      </aside>
    </div>
  );
}

export default function DestinationsPage() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("search") ?? "");
  const [region, setRegion] = useState("All regions");
  const [style, setStyle] = useState("All styles");
  const [favorites, setFavorites] = useState([]);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [destinations, setDestinations] = useState(fallbackDestinations);

  useEffect(() => {
    let ignore = false;
    getDestinations()
      .then(({ destinations: apiDestinations = [] }) => {
        if (ignore) return;
        const mapped = apiDestinations.map((destination) => ({
          name: destination.name,
          country: destination.country,
          region: destination.region || "Asia",
          style: destination.style || "Culture",
          duration: destination.duration || "5 days",
          from: Number(destination.from_price ?? destination.from ?? 0),
          bestFor: destination.bestFor || `${destination.style || "Curated"} getaway`,
          route: destination.route || `Dhaka → ${destination.name}`,
          visa: destination.visa || "Travel guidance included",
          blurb: destination.description || destination.blurb || `${destination.name} is one of our popular destinations for travelers from Dhaka.`,
          image: typeof destination.image === "string" && destination.image.trim() ? destination.image : `destination-image-${destination.name.toLowerCase().replace(/\s+/g, "-")}`,
          highlights: Array.isArray(destination.highlights) ? destination.highlights : (typeof destination.highlights === "string" ? JSON.parse(destination.highlights || "[]") : ["Curated route", "Flexible planning", "Travel support"]),
        }));
        setDestinations(mapped.length ? mapped : fallbackDestinations);
      })
      .catch(() => {
        if (!ignore) setDestinations(fallbackDestinations);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const filteredDestinations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return destinations.filter((destination) => {
      const matchesQuery = !normalizedQuery || `${destination.name} ${destination.country} ${destination.style}`.toLowerCase().includes(normalizedQuery);
      const matchesRegion = region === "All regions" || destination.region === region;
      const matchesStyle = style === "All styles" || destination.style === style;
      return matchesQuery && matchesRegion && matchesStyle;
    });
  }, [query, region, style, destinations]);

  const toggleFavorite = (name) => {
    setFavorites((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
  };

  return (
    <div className="destination-page">
      <SiteHeader />

      <main>
        <section className="destination-hero">
          <div className="destination-hero-pattern" />
          <div className="destination-hero-inner">
            <Link to="/" className="back-link"><ArrowLeft size={15} /> Back to home</Link>
            <p className="eyebrow">Your next chapter starts here</p>
            <h1>Find a place that feels<br className="hidden sm:block" /> worth the journey.</h1>
            <p>Thoughtful itineraries, practical visa guidance, and local support for travelers starting from Bangladesh.</p>
            <div className="destination-search-wrap">
              <Search size={19} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Kyoto, beach, culture..." aria-label="Search destinations" />
              <span>{filteredDestinations.length} places</span>
            </div>
          </div>
        </section>

        <section id="browse" className="destination-browse">
          <div className="destination-browse-top">
            <div>
              <p className="eyebrow">Curated for Dhaka departures</p>
              <h2>Choose your direction</h2>
            </div>
            <div className="saved-count"><Heart size={16} /> {favorites.length} saved {favorites.length === 1 ? "place" : "places"}</div>
          </div>
          <div className="filter-bar">
            <div className="filter-label"><SlidersHorizontal size={16} /> Filter by</div>
            <div className="filter-group" aria-label="Filter by region">
              {regions.map((item) => <button key={item} type="button" className={region === item ? "selected" : ""} onClick={() => setRegion(item)}>{item}</button>)}
            </div>
            <div className="filter-group" aria-label="Filter by travel style">
              {styles.map((item) => <button key={item} type="button" className={style === item ? "selected" : ""} onClick={() => setStyle(item)}>{item}</button>)}
            </div>
          </div>
          {filteredDestinations.length > 0 ? (
            <div className="destination-grid">
              {filteredDestinations.map((destination) => <DestinationCard key={destination.name} destination={destination} favorite={favorites.includes(destination.name)} onFavorite={toggleFavorite} onSelect={setSelectedDestination} />)}
            </div>
          ) : (
            <div className="destination-empty"><h3>No places match that search.</h3><p>Try another destination or clear one of the filters.</p><button type="button" onClick={() => { setQuery(""); setRegion("All regions"); setStyle("All styles"); }}>Clear filters</button></div>
          )}
        </section>

        <section id="planning" className="planning-strip">
          <div><p className="eyebrow">Planning from Bangladesh</p><h2>More clarity before you book.</h2><p>Every Farflung destination includes a route from Dhaka, a realistic starting price, and guidance for the documents you will need.</p></div>
          <div className="planning-points"><span><Plane size={18} /> Route planning from Dhaka</span><span><ShieldCheck size={18} /> Visa and document checklist</span><span><Users size={18} /> Private and small-group options</span></div>
          <Link to="/signup" className="planning-link">Create a trip shortlist <ArrowRight size={16} /></Link>
        </section>
      </main>

      <footer className="destination-footer"><Link to="/" className="destination-brand"><Compass size={21} /> <span>Farflung</span></Link><span>Thoughtful travel, planned from the first idea to landing.</span></footer>
      {selectedDestination && <DetailPanel destination={selectedDestination} onClose={() => setSelectedDestination(null)} />}
    </div>
  );
}
