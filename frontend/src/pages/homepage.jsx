import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Compass, MapPin, Search, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import SiteHeader from "../components/SiteHeader.jsx";
import { getPackages } from "../lib/api.js";

const fallbackImages = [
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1478827536114-da961b7f86d2?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=900&q=85",
];

const fallbackDestinations = [
  { name: "Kyoto", country: "Japan", days: "7 days", price: "$1,180", image: fallbackImages[0] },
  { name: "Santorini", country: "Greece", days: "5 days", price: "$940", image: fallbackImages[1] },
  { name: "Patagonia", country: "Argentina · Chile", days: "10 days", price: "$1,640", image: fallbackImages[2] },
  { name: "Marrakech", country: "Morocco", days: "6 days", price: "$860", image: fallbackImages[3] },
];

const getSafeImageUrl = (value, fallback) => {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (/^https?:\/\//i.test(trimmed) || /^data:image\//i.test(trimmed)) return trimmed;
  return fallback;
};

function HeroSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    navigate(query.trim() ? `/destinations?search=${encodeURIComponent(query.trim())}` : "/destinations");
  };

  return (
    <form className="home-search" onSubmit={handleSubmit}>
      <div className="home-search-field">
        <MapPin size={18} />
        <label htmlFor="home-destination">Where are you going?</label>
        <input id="home-destination" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a destination" />
      </div>
      <div className="home-search-field home-search-date">
        <CalendarDays size={18} />
        <label htmlFor="home-date">When?</label>
        <input id="home-date" type="text" placeholder="Choose your dates" />
      </div>
      <button type="submit" className="home-search-submit"><Search size={17} /> Search trips</button>
    </form>
  );
}

function Hero() {
  return (
    <section className="home-hero">
      <div className="home-hero-inner">
        <div className="home-hero-copy">
          <p className="home-kicker"><span /> Travel, thoughtfully planned</p>
          <h1>Go somewhere that stays with you.</h1>
          <p className="home-hero-description">Find considered trips from Dhaka, with the route, stay, and practical details worked out before you leave.</p>
          <HeroSearch />
          <div className="home-hero-note"><ShieldCheck size={16} /> Real routes, clear prices, human support.</div>
        </div>
        <div className="home-hero-photo" role="img" aria-label="A mountain landscape at golden hour">
          <div className="home-hero-photo-caption"><span>Featured this month</span><strong>Patagonia, wide open</strong><small>10 days · from $1,640</small></div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  return (
    <section className="home-trust" aria-label="Farflung travel statistics">
      <div><strong>12,400+</strong><span>trips booked</span></div>
      <div><strong>86</strong><span>countries covered</span></div>
      <div><strong>4.8 / 5</strong><span>average trip rating</span></div>
      <div><strong>24/7</strong><span>support while away</span></div>
    </section>
  );
}

function Destinations() {
  const [featuredDestinations, setFeaturedDestinations] = useState(fallbackDestinations);

  useEffect(() => {
    let ignore = false;
    getPackages()
      .then(({ packages: apiPackages = [] }) => {
        if (ignore) return;
        const mapped = apiPackages.slice(0, 4).map((pkg, index) => ({
          name: pkg.title,
          country: pkg.destination,
          days: pkg.days,
          price: `$${Number(pkg.price).toLocaleString("en-US")}`,
          image: getSafeImageUrl(pkg.image, fallbackImages[index % fallbackImages.length]),
        }));
        setFeaturedDestinations(mapped.length ? mapped : fallbackDestinations);
      })
      .catch(() => {
        if (!ignore) setFeaturedDestinations(fallbackDestinations);
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <section className="home-section home-destinations" id="destinations">
      <div className="home-section-heading">
        <div><p className="home-kicker home-kicker-dark"><span /> Start with a feeling</p><h2>Where do you want to wake up?</h2></div>
        <Link to="/destinations" className="home-text-link">Explore all destinations <ArrowRight size={16} /></Link>
      </div>
      <div className="home-destination-grid">
        {featuredDestinations.map((destination, index) => (
          <Link key={`${destination.name}-${index}`} to="/destinations" className={`home-destination-card ${index === 0 ? "is-featured" : ""}`} style={{ backgroundImage: `linear-gradient(180deg, rgba(11,46,44,0.02) 28%, rgba(11,46,44,0.88) 100%), url(${destination.image})` }}>
            <div className="home-destination-card-copy"><span>{destination.country}</span><h3>{destination.name}</h3><small>{destination.days} · from {destination.price}</small></div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="home-footer">
      <div className="home-footer-brand"><Compass size={23} /><strong>Farflung</strong><p>A calmer way to plan and manage your trips, from first idea to landing.</p></div>
      <div className="home-footer-links"><Link to="/destinations">Destinations</Link><Link to="/packages">Packages</Link><Link to="/signup">Create an account</Link></div>
      <div className="home-footer-bottom"><span>© {new Date().getFullYear()} Farflung Tourism Management System</span><span>Departing from Dhaka, Bangladesh</span></div>
    </footer>
  );
}

export default function TourismHomepage() {
  return (
    <div className="home-page">
      <SiteHeader />
      <main>
        <Hero />
        <TrustBar />
        <Destinations />
        <section className="home-cta"><div><p className="home-kicker home-kicker-dark"><span /> Your next trip starts here</p><h2>Bring the idea. We will help with the rest.</h2></div><Link to="/signup" className="home-cta-button">Start planning <ArrowRight size={17} /></Link></section>
      </main>
      <Footer />
    </div>
  );
}
