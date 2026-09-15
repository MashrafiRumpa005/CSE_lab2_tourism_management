import { useEffect, useState } from "react";
import { ArrowRight, Check, Compass, Plane, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import SiteHeader from "../components/SiteHeader.jsx";
import { getPackages } from "../lib/api.js";

const fallbackPackages = [
  { id: 1, title: "Kyoto, slowly", destination: "Japan", days: "7 days", price: 1180, route: "Dhaka -> Tokyo -> Kyoto", detail: "Ryokan stay, daily breakfast, and Japan visa guidance.", highlights: ["Arashiyama bamboo grove at sunrise", "Tea ceremony in Gion", "Day trip to Nara"], image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=85" },
  { id: 2, title: "Santorini escape", destination: "Greece", days: "5 days", price: 940, route: "Dhaka -> Athens -> Santorini", detail: "Caldera-facing stay, private sailing, and Schengen checklist.", highlights: ["Sunset walk in Oia", "Private caldera sailing", "Wine tasting in Pyrgos"], image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=85" },
  { id: 3, title: "Patagonia trek", destination: "Argentina · Chile", days: "10 days", price: 1640, route: "Dhaka -> Santiago -> Patagonia", detail: "Trek lodge, guided camps, and border support for the W circuit.", highlights: ["Torres del Paine W trek", "Glacier boat crossing", "Guided camp nights"], image: "https://images.unsplash.com/photo-1478827536114-da961b7f86d2?auto=format&fit=crop&w=1200&q=85" },
  { id: 4, title: "Marrakech & the Atlas", destination: "Morocco", days: "6 days", price: 860, route: "Dhaka -> Casablanca -> Marrakech", detail: "A riad stay, local food, and document review before departure.", highlights: ["Medina riad stay", "Atlas Mountains day hike", "Evening at Jemaa el-Fnaa"], image: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=85" },
];

const getSafeImage = (value, fallback) => {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return /^(https?:|data:image)/i.test(trimmed) ? trimmed : fallback;
};

const formatCurrency = (amount) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);

export default function PackagesPage() {
  const [packages, setPackages] = useState(fallbackPackages);

  useEffect(() => {
    let ignore = false;
    getPackages()
      .then(({ packages: apiPackages = [] }) => {
        if (ignore) return;
        const mapped = apiPackages.map((pkg) => ({
          ...pkg,
          price: Number(pkg.price),
          image: getSafeImage(pkg.image, "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=85"),
          highlights: Array.isArray(pkg.highlights) ? pkg.highlights : (typeof pkg.highlights === "string" ? JSON.parse(pkg.highlights || "[]") : []),
        }));
        setPackages(mapped.length ? mapped : fallbackPackages);
      })
      .catch(() => {
        if (!ignore) setPackages(fallbackPackages);
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="packages-page">
      <SiteHeader />
      <main>
        <section className="packages-hero">
          <div className="packages-hero-inner">
            <div><p className="home-kicker"><span /> Curated journeys from Dhaka</p><h1>Choose a trip with the important parts already handled.</h1><p>Compare routes, stays, practical support, and starting prices in one calm view.</p></div>
            <div className="packages-hero-aside"><Plane size={21} /><strong>Built around your departure</strong><span>Every package begins in Dhaka, with a clear route and a human planner behind it.</span></div>
          </div>
        </section>
        <section className="packages-content">
          <div className="packages-content-heading"><div><p className="home-kicker home-kicker-dark"><span /> Find your pace</p><h2>Packages worth leaving for</h2></div><p><ShieldCheck size={17} /> Visa guidance and local support included.</p></div>
          <div className="packages-grid">
            {packages.map((item) => (
              <article key={item.id ?? item.title} className="package-detail-card">
                <div className="package-detail-image" style={{ backgroundImage: `url("${getSafeImage(item.image, "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=85")}")` }} />
                <div className="package-detail-top"><span>{item.destination}</span><b>{item.days}</b></div>
                <h3>{item.title}</h3><p className="package-route"><Plane size={15} /> {item.route}</p><p className="package-detail-copy">{item.detail}</p>
                <ul>{(item.highlights || []).map((highlight) => <li key={`${item.id}-${highlight}`}><Check size={15} /> {highlight}</li>)}</ul>
                <div className="package-detail-bottom"><strong>{formatCurrency(Number(item.price))}<small> / person</small></strong><Link to={`/book?packageId=${item.id}`}>Book this trip <ArrowRight size={15} /></Link></div>
              </article>
            ))}
          </div>
        </section>
        <section className="packages-planning"><div><p className="home-kicker home-kicker-dark"><span /> Need a different shape?</p><h2>Tell us how you like to travel.</h2></div><div className="packages-planning-copy"><p><Users size={18} /> Private trips and small groups</p><p><ShieldCheck size={18} /> Practical visa and document support</p><Link to="/signup" className="home-cta-button">Start a conversation <ArrowRight size={16} /></Link></div></section>
      </main>
      <footer className="packages-footer"><Link to="/" className="destination-brand"><Compass size={21} /> <span>Farflung</span></Link><span>Thoughtful travel, planned from the first idea to landing.</span></footer>
    </div>
  );
}