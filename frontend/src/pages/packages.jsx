import { ArrowRight, Check, Compass, Plane, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import SiteHeader from "../components/SiteHeader.jsx";

const packages = [
  { id: 1, title: "Kyoto, slowly", destination: "Japan", days: "7 days", price: "$1,180", route: "Dhaka -> Tokyo -> Kyoto", detail: "Ryokan stay, daily breakfast, and Japan visa guidance.", highlights: ["Arashiyama bamboo grove at sunrise", "Tea ceremony in Gion", "Day trip to Nara"] },
  { id: 2, title: "Santorini escape", destination: "Greece", days: "5 days", price: "$940", route: "Dhaka -> Athens -> Santorini", detail: "Caldera-facing stay, private sailing, and Schengen checklist.", highlights: ["Sunset walk in Oia", "Private caldera sailing", "Wine tasting in Pyrgos"] },
  { id: 3, title: "Patagonia trek", destination: "Argentina · Chile", days: "10 days", price: "$1,640", route: "Dhaka -> Santiago -> Patagonia", detail: "Trek lodge, guided camps, and border support for the W circuit.", highlights: ["Torres del Paine W trek", "Glacier boat crossing", "Guided camp nights"] },
  { id: 4, title: "Marrakech & the Atlas", destination: "Morocco", days: "6 days", price: "$860", route: "Dhaka -> Casablanca -> Marrakech", detail: "A riad stay, local food, and document review before departure.", highlights: ["Medina riad stay", "Atlas Mountains day hike", "Evening at Jemaa el-Fnaa"] },
];


export default function PackagesPage() {
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
              <article key={item.title} className="package-detail-card">
                <div className="package-detail-top"><span>{item.destination}</span><b>{item.days}</b></div>
                <h3>{item.title}</h3><p className="package-route"><Plane size={15} /> {item.route}</p><p className="package-detail-copy">{item.detail}</p>
                <ul>{item.highlights.map((highlight) => <li key={highlight}><Check size={15} /> {highlight}</li>)}</ul>
                <div className="package-detail-bottom"><strong>{item.price}<small> / person</small></strong><Link to={`/book?packageId=${item.id}`}>Book this trip <ArrowRight size={15} /></Link></div>
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