import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, Compass, Mail, UserCircle } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import SiteHeader from "../components/SiteHeader.jsx";
import { getCurrentUser } from "../lib/api.js";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser().then(({ user: currentUser }) => setUser(currentUser)).catch(() => setUser(false)).finally(() => setLoading(false));
  }, []);

  if (!loading && user === false) return <Navigate to="/login" replace />;

  return (
    <div className="profile-page">
      <SiteHeader />
      <main className="profile-main">
        {loading ? <p className="profile-loading">Loading your profile...</p> : (
          <section className="profile-card">
            <Link to="/" className="profile-back"><ArrowLeft size={16} /> Back to home</Link>
            <div className="profile-heading"><div className="profile-avatar"><UserCircle size={42} /></div><div><p className="profile-eyebrow">Your account</p><h1>{user.fullName}</h1><p>Everything you need for your Farflung trips.</p></div></div>
            <div className="profile-details">
              <div><Mail size={18} /><span><b>Email address</b>{user.email}</span></div>
              <div><CalendarDays size={18} /><span><b>Member since</b>{new Date(user.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</span></div>
            </div>
            <div className="profile-actions"><Link to="/destinations">Explore destinations</Link><Link to="/packages">View packages</Link></div>
          </section>
        )}
      </main>
      <footer className="packages-footer"><Link to="/" className="destination-brand"><Compass size={21} /> <span>Farflung</span></Link><span>Thoughtful travel, planned from the first idea to landing.</span></footer>
    </div>
  );
}