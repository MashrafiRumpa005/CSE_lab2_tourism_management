import { useEffect, useState } from "react";
import { BarChart3, Check, Edit3, Map, Package, Plus, ShieldCheck, Star, Trash2, Users, X } from "lucide-react";
import SiteHeader from "../components/SiteHeader.jsx";
import {
  createAdminDestination, createAdminPackage, deleteAdminDestination, deleteAdminPackage, deleteAdminReview,
  getAdminBookings, getAdminDashboard, getAdminDestinations, getAdminReviews, updateAdminBooking,
  updateAdminDestination, updateAdminPackage, updateAdminReview,
} from "../lib/api.js";

const emptyDestination = { name: "", country: "", region: "Asia", style: "Culture", duration: "", description: "", image: "" };
const emptyPackage = { title: "", destination: "", days: "", price: "", route: "", detail: "", highlights: "", image: "" };

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  if (!file) {
    resolve("");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result ?? ""));
  reader.onerror = () => reject(new Error("Could not read the selected file."));
  reader.readAsDataURL(file);
});

function Metric({ icon: Icon, label, value }) { return <div className="admin-metric"><Icon size={19} /><span>{label}</span><strong>{value}</strong></div>; }
function Field({ label, name, value, onChange, type = "text", wide = false }) { return <label className={wide ? "admin-field admin-field-wide" : "admin-field"}><span>{label}</span>{wide ? <textarea name={name} value={value} onChange={onChange} rows="3" required /> : <input name={name} value={value} onChange={onChange} type={type} required />}</label>; }

export default function AdminPage() {
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState({ metrics: {}, bookings: [], destinations: [], packages: [], reviews: [] });
  const [destinationForm, setDestinationForm] = useState(null);
  const [packageForm, setPackageForm] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [dashboard, destinations, bookings, reviews] = await Promise.all([getAdminDashboard(), getAdminDestinations(), getAdminBookings(), getAdminReviews()]);
      const packages = (await fetch("/api/packages").then((res) => res.json())).packages ?? [];
      setData({ metrics: dashboard.metrics ?? {}, bookings: bookings.bookings ?? [], destinations: destinations.destinations ?? [], packages, reviews: reviews.reviews ?? [] });
      setError("");
    } catch (err) { setError(err.message); }
  };
  useEffect(() => { load(); }, []);

  const saveDestination = async (event) => {
    event.preventDefault();
    try {
      const payload = { ...destinationForm, from_price: 0, image: destinationForm.image ?? "" };
      destinationForm.id ? await updateAdminDestination(destinationForm.id, payload) : await createAdminDestination(payload);
      setDestinationForm(null);
      setMessage("Destination saved.");
      load();
    } catch (err) { setError(err.message); }
  };
  const savePackage = async (event) => {
    event.preventDefault();
    try {
      const payload = { ...packageForm, price: Number(packageForm.price), image: packageForm.image ?? "" };
      packageForm.id ? await updateAdminPackage(packageForm.id, payload) : await createAdminPackage(payload);
      setPackageForm(null);
      setMessage("Package saved.");
      load();
    } catch (err) { setError(err.message); }
  };
  const remove = async (action, id) => { try { await action(id); setMessage("Change saved."); load(); } catch (err) { setError(err.message); } };

  return <div className="admin-page"><SiteHeader /><main className="admin-main">
    <div className="admin-heading"><div><p className="home-kicker home-kicker-dark"><span /> Operations console</p><h1>Admin dashboard</h1><p>Keep the catalog, departures, and traveler feedback moving in one place.</p></div><span className="admin-secure"><ShieldCheck size={16} /> Admin access</span></div>
    {error && <div className="admin-alert error">{error}</div>}{message && <div className="admin-alert success">{message}</div>}
    <nav className="admin-tabs" aria-label="Admin sections">{[["overview", BarChart3, "Overview"], ["destinations", Map, "Destinations"], ["packages", Package, "Packages"], ["bookings", Users, "Bookings"], ["reviews", Star, "Reviews"]].map(([key, Icon, label]) => <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}><Icon size={16} /> {label}</button>)}</nav>
    {tab === "overview" && <section className="admin-section"><div className="admin-metrics"><Metric icon={Users} label="Travelers" value={data.metrics.travelers ?? 0} /><Metric icon={Package} label="Packages" value={data.metrics.packages ?? 0} /><Metric icon={Map} label="Destinations" value={data.metrics.destinations ?? 0} /><Metric icon={BarChart3} label="Revenue" value={`$${Number(data.metrics.revenue ?? 0).toLocaleString()}`} /></div><h2>Recent bookings</h2><BookingTable bookings={data.bookings} onStatus={(id, status) => updateAdminBooking(id, status).then(load)} /></section>}
    {tab === "destinations" && <section className="admin-section"><SectionTitle title="Destination catalog" onAdd={() => setDestinationForm(emptyDestination)} />{destinationForm && <form className="admin-editor" onSubmit={saveDestination}>{Object.entries(destinationForm).filter(([key]) => key !== "id" && key !== "from_price" && key !== "image").map(([key, value]) => <Field key={key} label={key.replace("_", " ")} name={key} value={value} onChange={(e) => setDestinationForm({ ...destinationForm, [key]: e.target.value })} wide={key === "description"} type="text" />)}<label className="admin-field"><span>Photo</span><input type="file" accept="image/*" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; const dataUrl = await readFileAsDataUrl(file); setDestinationForm((current) => ({ ...current, image: dataUrl })); }} /></label>{destinationForm.image && <div className="admin-image-preview"><img src={destinationForm.image} alt="Destination preview" /></div>}<p className="admin-hint">Starting price is automatic from the lowest package for this destination.</p><EditorActions onCancel={() => setDestinationForm(null)} /></form>}<div className="admin-table-wrap"><table><thead><tr><th>Place</th><th>Region</th><th>Style</th><th>From</th><th /></tr></thead><tbody>{data.destinations.map((item) => <tr key={item.id}><td><strong>{item.name}</strong><small>{item.country}</small></td><td>{item.region}</td><td>{item.style}</td><td>{item.from_price ? `$${Number(item.from_price).toLocaleString()}` : "Auto"}</td><td className="admin-actions"><button onClick={() => setDestinationForm({ ...item, from_price: 0, image: item.image ?? "" })} aria-label="Edit destination"><Edit3 size={15} /></button><button onClick={() => remove(deleteAdminDestination, item.id)} aria-label="Delete destination"><Trash2 size={15} /></button></td></tr>)}</tbody></table></div></section>}
    {tab === "packages" && <section className="admin-section"><SectionTitle title="Package catalog" onAdd={() => setPackageForm(emptyPackage)} />{packageForm && <form className="admin-editor" onSubmit={savePackage}>{Object.entries(packageForm).filter(([key]) => key !== "id" && key !== "image").map(([key, value]) => <Field key={key} label={key.replace("_", " ")} name={key} value={value} onChange={(e) => setPackageForm({ ...packageForm, [key]: e.target.value })} wide={key === "detail" || key === "highlights"} type={key === "price" ? "number" : "text"} />)}<label className="admin-field"><span>Photo</span><input type="file" accept="image/*" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; const dataUrl = await readFileAsDataUrl(file); setPackageForm((current) => ({ ...current, image: dataUrl })); }} /></label>{packageForm.image && <div className="admin-image-preview"><img src={packageForm.image} alt="Package preview" /></div>}<EditorActions onCancel={() => setPackageForm(null)} /></form>}<div className="admin-table-wrap"><table><thead><tr><th>Package</th><th>Destination</th><th>Duration</th><th>Price</th><th /></tr></thead><tbody>{data.packages.map((item) => <tr key={item.id}><td><strong>{item.title}</strong><small>{item.route}</small></td><td>{item.destination}</td><td>{item.days}</td><td>${item.price}</td><td className="admin-actions"><button onClick={() => setPackageForm({ ...item, highlights: item.highlights?.join?.("\n") ?? "", image: item.image ?? "" })} aria-label="Edit package"><Edit3 size={15} /></button><button onClick={() => remove(deleteAdminPackage, item.id)} aria-label="Delete package"><Trash2 size={15} /></button></td></tr>)}</tbody></table></div></section>}
    {tab === "bookings" && <section className="admin-section"><SectionTitle title="Booking operations" /><BookingTable bookings={data.bookings} onStatus={(id, status) => updateAdminBooking(id, status).then(load)} /></section>}
    {tab === "reviews" && <section className="admin-section"><SectionTitle title="Review moderation" /><div className="admin-review-list">{data.reviews.map((review) => <article key={review.id} className="admin-review"><div><strong>{review.package_title}</strong><small>{review.full_name} · {"★".repeat(review.rating)} · {review.status}</small><p>{review.comment}</p></div><div className="admin-actions"><button onClick={() => updateAdminReview(review.id, review.status === "published" ? "hidden" : "published").then(load)}>{review.status === "published" ? "Hide" : "Publish"}</button><button onClick={() => remove(deleteAdminReview, review.id)} aria-label="Delete review"><Trash2 size={15} /></button></div></article>)}</div></section>}
  </main></div>;
}

function SectionTitle({ title, onAdd }) { return <div className="admin-section-title"><h2>{title}</h2>{onAdd && <button className="admin-add" onClick={onAdd}><Plus size={16} /> Add new</button>}</div>; }
function EditorActions({ onCancel }) { return <div className="admin-editor-actions"><button type="button" onClick={onCancel}><X size={15} /> Cancel</button><button className="admin-add" type="submit"><Check size={15} /> Save</button></div>; }
function BookingTable({ bookings, onStatus }) { return <div className="admin-table-wrap"><table><thead><tr><th>Traveler</th><th>Package</th><th>Date</th><th>Total</th><th>Status</th></tr></thead><tbody>{bookings.map((item) => <tr key={item.id}><td><strong>{item.full_name}</strong><small>{item.email}</small></td><td>{item.package_title}</td><td>{item.travel_date}</td><td>${item.total_price}</td><td><select value={item.status} onChange={(e) => onStatus(item.id, e.target.value)}><option>confirmed</option><option>completed</option><option>cancelled</option></select></td></tr>)}</tbody></table>{bookings.length === 0 && <p className="admin-empty">No bookings yet.</p>}</div>; }
