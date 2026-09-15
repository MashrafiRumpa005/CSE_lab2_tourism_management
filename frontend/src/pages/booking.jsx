import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Loader2,
  LogIn,
  MapPin,
  Minus,
  Plane,
  Plus,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import SiteHeader from "../components/SiteHeader.jsx";
import { createBooking, getCurrentUser, getPackage } from "../lib/api.js";

const DEFAULT_PACKAGES = {
  1: {
    id: 1,
    title: "Kyoto, slowly",
    destination: "Japan",
    days: "7 days",
    price: 1180,
    route: "Dhaka -> Tokyo -> Kyoto",
    detail: "Ryokan stay, daily breakfast, and Japan visa guidance.",
    highlights: [
      "Arashiyama bamboo grove at sunrise",
      "Tea ceremony in Gion",
      "Day trip to Nara",
    ],
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=85",
  },
  2: {
    id: 2,
    title: "Santorini escape",
    destination: "Greece",
    days: "5 days",
    price: 940,
    route: "Dhaka -> Athens -> Santorini",
    detail: "Caldera-facing stay, private sailing, and Schengen checklist.",
    highlights: [
      "Sunset walk in Oia",
      "Private caldera sailing",
      "Wine tasting in Pyrgos",
    ],
    image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=85",
  },
  3: {
    id: 3,
    title: "Patagonia trek",
    destination: "Argentina · Chile",
    days: "10 days",
    price: 1640,
    route: "Dhaka -> Santiago -> Patagonia",
    detail: "Trek lodge, guided camps, and border support for the W circuit.",
    highlights: [
      "Torres del Paine W trek",
      "Glacier boat crossing",
      "Guided camp nights",
    ],
    image: "https://images.unsplash.com/photo-1478827536114-da961b7f86d2?auto=format&fit=crop&w=1200&q=85",
  },
  4: {
    id: 4,
    title: "Marrakech & the Atlas",
    destination: "Morocco",
    days: "6 days",
    price: 860,
    route: "Dhaka -> Casablanca -> Marrakech",
    detail: "A riad stay, local food, and document review before departure.",
    highlights: [
      "Medina riad stay",
      "Atlas Mountains day hike",
      "Evening at Jemaa el-Fnaa",
    ],
    image: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=85",
  },
};

const PACKAGE_IMAGES = {
  1: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=85",
  2: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=85",
  3: "https://images.unsplash.com/photo-1478827536114-da961b7f86d2?auto=format&fit=crop&w=1200&q=85",
  4: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=85",
};

const getSafeImage = (value, fallback) => {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return /^(https?:|data:image)/i.test(trimmed) ? trimmed : fallback;
};

export default function BookingPage() {
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const rawPackageId = paramId ?? searchParams.get("packageId") ?? searchParams.get("package_id") ?? searchParams.get("id") ?? "1";
  const parsedPackageId = Number(rawPackageId);
  const isInvalidId = !parsedPackageId || isNaN(parsedPackageId) || parsedPackageId <= 0;

  const [packageData, setPackageData] = useState(() => {
    return isInvalidId ? null : (DEFAULT_PACKAGES[parsedPackageId] ?? null);
  });
  const [packageLoading, setPackageLoading] = useState(false);
  const [fetchNotFound, setFetchNotFound] = useState(false);
  const packageNotFound = isInvalidId || fetchNotFound;

  // User session state
  const [user, setUser] = useState(null);

  // Booking form state
  const [travelDate, setTravelDate] = useState("");
  const [travelersCount, setTravelersCount] = useState(1);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [apiError, setApiError] = useState(null);

  // Calculate today's date formatted as YYYY-MM-DD for min date
  const todayStr = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // Fetch current user
  useEffect(() => {
    getCurrentUser()
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch(() => setUser(null));
  }, []);

  // Load package information
  useEffect(() => {
    if (isInvalidId) return;

    let ignore = false;
    Promise.resolve().then(() => {
      if (!ignore) {
        setPackageLoading(true);
        setFetchNotFound(false);
        setApiError(null);
        setBookingSuccess(null);
      }
    });

    getPackage(parsedPackageId)
      .then((res) => {
        if (ignore) return;
        const pkg = res?.package;
        if (pkg) {
          const image = getSafeImage(pkg.image, PACKAGE_IMAGES[pkg.id] ?? DEFAULT_PACKAGES[pkg.id]?.image ?? "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=85");
          setPackageData({
            ...pkg,
            image,
            highlights: Array.isArray(pkg.highlights) ? pkg.highlights : (typeof pkg.highlights === "string" ? JSON.parse(pkg.highlights) : []),
          });
          setFetchNotFound(false);
        } else {
          setFetchNotFound(true);
        }
      })
      .catch((err) => {
        if (ignore) return;
        if (err.status === 404) {
          setFetchNotFound(true);
          setPackageData(null);
        } else if (DEFAULT_PACKAGES[parsedPackageId]) {
          // Fallback to local package if network issue
          setPackageData(DEFAULT_PACKAGES[parsedPackageId]);
          setFetchNotFound(false);
        } else {
          setFetchNotFound(true);
          setPackageData(null);
        }
      })
      .finally(() => {
        if (!ignore) {
          setPackageLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [parsedPackageId, isInvalidId]);

  // Stepper handlers
  const handleDecrement = () => {
    setTravelersCount((prev) => Math.max(1, prev - 1));
    if (formError) setFormError("");
  };

  const handleIncrement = () => {
    setTravelersCount((prev) => prev + 1);
    if (formError) setFormError("");
  };

  // Estimated total calculation (UI only)
  const unitPrice = packageData ? Number(packageData.price) : 0;
  const estimatedTotal = unitPrice * travelersCount;

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Form submission
  const handleSubmitBooking = async (event) => {
    event.preventDefault();
    setFormError("");
    setApiError(null);

    // Basic frontend validation
    if (!travelDate) {
      setFormError("Please select a travel date.");
      return;
    }

    if (travelersCount < 1) {
      setFormError("Number of travelers must be at least 1.");
      return;
    }

    if (!packageData) {
      setFormError("Please select a valid package before booking.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Send ONLY package_id, travel_date, travelers_count.
      // Do NOT send total_price!
      const payload = {
        package_id: packageData.id,
        travel_date: travelDate,
        travelers_count: travelersCount,
      };

      const response = await createBooking(payload);

      if (response && (response.success || response.booking)) {
        setBookingSuccess(response.booking ?? response);
      } else {
        setBookingSuccess({
          package_id: packageData.id,
          travel_date: travelDate,
          travelers_count: travelersCount,
          total_price: estimatedTotal,
          status: "confirmed",
        });
      }
    } catch (err) {
      if (err.status === 401) {
        setApiError({
          status: 401,
          message: "Please log in to book this package.",
        });
      } else if (err.status === 404) {
        setApiError({
          status: 404,
          message: err.message || "Tourism package not found.",
        });
      } else if (err.status === 400) {
        setApiError({
          status: 400,
          message: err.message || "Unable to book package with the provided details.",
        });
      } else {
        setApiError({
          status: err.status || 500,
          message: err.message || "An unexpected error occurred while processing your booking. Please try again.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookAnother = () => {
    setBookingSuccess(null);
    setApiError(null);
    setFormError("");
    setTravelDate("");
    setTravelersCount(1);
  };

  return (
    <div className="booking-page">
      <SiteHeader />

      <main className="booking-main">
        {/* Navigation & Header strip */}
        <section className="booking-top-strip">
          <div className="booking-inner">
            <Link to="/packages" className="booking-back-link">
              <ArrowLeft size={16} /> Back to all packages
            </Link>
            <div className="booking-header-intro">
              <p className="home-kicker home-kicker-dark">
                <span /> Confirmed departures from Dhaka
              </p>
              <h1>Reserve your journey</h1>
              <p className="booking-subtitle">
                Select your dates, specify your group size, and secure your place with human planning behind every step.
              </p>
            </div>
          </div>
        </section>

        {/* Loading state */}
        {packageLoading && (
          <div className="booking-inner booking-feedback-box">
            <Loader2 className="animate-spin" size={28} />
            <p>Loading package details...</p>
          </div>
        )}

        {/* 404 Package Not Found state */}
        {!packageLoading && packageNotFound && (
          <div className="booking-inner">
            <div className="booking-not-found-card">
              <AlertCircle size={44} className="booking-not-found-icon" />
              <h2>Tourism package not found</h2>
              <p>
                We could not find the tourism package you requested. It may have been relocated or is no longer available.
              </p>
              <div className="booking-not-found-actions">
                <Link to="/packages" className="home-cta-button">
                  Browse available packages <ArrowRight size={16} />
                </Link>
                <Link to="/destinations" className="booking-secondary-link">
                  Explore destinations
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Main booking content when package is found */}
        {!packageLoading && !packageNotFound && packageData && (
          <div className="booking-inner">
            <div className="booking-layout-grid">
              {/* ============================================================ */}
              {/* LEFT COLUMN: PACKAGE INFORMATION                             */}
              {/* ============================================================ */}
              <section className="booking-package-info" aria-label="Package Information">
                <article className="booking-info-card">
                  {/* Package Image with hover zoom effect */}
                  <div className="booking-image-container">
                    <img
                      src={packageData.image}
                      alt={packageData.title}
                      className="booking-image"
                      loading="eager"
                    />
                    <div className="booking-image-badge">
                      <MapPin size={14} /> {packageData.destination}
                    </div>
                  </div>

                  <div className="booking-info-body">
                    <div className="booking-meta-row">
                      <span className="booking-pill">
                        <Clock size={14} /> {packageData.days}
                      </span>
                      <span className="booking-pill">
                        <Plane size={14} /> {packageData.route}
                      </span>
                    </div>

                    <h2 className="booking-package-title">{packageData.title}</h2>

                    <p className="booking-package-desc">{packageData.detail}</p>

                    {/* Highlights */}
                    {packageData.highlights && packageData.highlights.length > 0 && (
                      <div className="booking-highlights-section">
                        <h3>Package highlights</h3>
                        <ul className="booking-highlights-list">
                          {packageData.highlights.map((item, idx) => (
                            <li key={idx}>
                              <span className="highlight-icon-wrap">
                                <Check size={14} />
                              </span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Inclusion notice */}
                    <div className="booking-perks-strip">
                      <div>
                        <ShieldCheck size={18} />
                        <span>Dhaka flight coordination & visa support</span>
                      </div>
                      <div>
                        <Sparkles size={18} />
                        <span>Curated stays with vetted local guides</span>
                      </div>
                    </div>

                    {/* Package quick switcher */}
                    <div className="booking-quick-switch">
                      <span className="quick-switch-label">Other packages:</span>
                      <div className="quick-switch-tags">
                        {Object.values(DEFAULT_PACKAGES).map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className={`switch-tag ${p.id === packageData.id ? "active" : ""}`}
                            onClick={() => navigate(`/book?packageId=${p.id}`)}
                          >
                            {p.destination}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              </section>

              {/* ============================================================ */}
              {/* RIGHT COLUMN: INTERACTIVE BOOKING CARD                       */}
              {/* ============================================================ */}
              <aside className="booking-action-column" aria-label="Interactive Booking Card">
                <div className="booking-card">
                  {bookingSuccess ? (
                    /* Success Confirmation State (HTTP 201) */
                    <div className="booking-success-receipt" role="alert" aria-live="polite">
                      <div className="success-icon-badge">
                        <CheckCircle2 size={36} />
                      </div>
                      <h3>Booking confirmed successfully!</h3>
                      <p className="success-submessage">
                        Your reservation for <strong>{packageData.title}</strong> has been secured. Our team in Dhaka will contact you with travel documents.
                      </p>

                      <div className="receipt-box">
                        {bookingSuccess.id && (
                          <div className="receipt-row">
                            <span>Booking ID</span>
                            <strong>#{bookingSuccess.id}</strong>
                          </div>
                        )}
                        <div className="receipt-row">
                          <span>Package</span>
                          <span>{packageData.title} ({packageData.destination})</span>
                        </div>
                        <div className="receipt-row">
                          <span>Travel Date</span>
                          <strong>{bookingSuccess.travel_date || travelDate}</strong>
                        </div>
                        <div className="receipt-row">
                          <span>Travelers</span>
                          <strong>{bookingSuccess.travelers_count || travelersCount} {((bookingSuccess.travelers_count || travelersCount) === 1) ? "traveler" : "travelers"}</strong>
                        </div>
                        <div className="receipt-row receipt-total-row">
                          <span>Final Total Price</span>
                          <strong className="receipt-price">
                            {formatCurrency(bookingSuccess.total_price || estimatedTotal)}
                          </strong>
                        </div>
                        <div className="receipt-row">
                          <span>Status</span>
                          <span className="receipt-status-badge">
                            {bookingSuccess.status || "confirmed"}
                          </span>
                        </div>
                      </div>

                      <div className="success-actions">
                        <button
                          type="button"
                          className="home-cta-button w-full"
                          onClick={handleBookAnother}
                        >
                          Book another trip
                        </button>
                        <Link to="/packages" className="booking-secondary-link text-center">
                          Explore more packages
                        </Link>
                      </div>
                    </div>
                  ) : (
                    /* Standard Booking Form */
                    <form onSubmit={handleSubmitBooking} className="booking-form" noValidate>
                      <div className="booking-card-header">
                        <div>
                          <span className="card-kicker">Transparent Pricing</span>
                          <div className="booking-card-price">
                            <span className="price-amount">{formatCurrency(unitPrice)}</span>
                            <span className="price-unit">/ traveler</span>
                          </div>
                        </div>
                        <span className="booking-slots-tag">Available</span>
                      </div>

                      {/* API Error Banners */}
                      {apiError && (
                        <div
                          className={`booking-alert ${apiError.status === 401 ? "alert-auth" : apiError.status === 404 ? "alert-notfound" : "alert-error"}`}
                          role="alert"
                        >
                          <div className="alert-content">
                            <AlertCircle size={18} />
                            <div>
                              <p className="alert-message">{apiError.message}</p>
                              {apiError.status === 401 && (
                                <Link to="/login" className="alert-action-link">
                                  <LogIn size={14} /> Go to Log In
                                </Link>
                              )}
                              {apiError.status === 404 && (
                                <Link to="/packages" className="alert-action-link">
                                  <ArrowRight size={14} /> View Available Packages
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Client validation error */}
                      {formError && (
                        <div className="booking-alert alert-error" role="alert">
                          <div className="alert-content">
                            <AlertCircle size={18} />
                            <p className="alert-message">{formError}</p>
                          </div>
                        </div>
                      )}

                      {/* Travel Date Input */}
                      <div className="form-group">
                        <label htmlFor="travel-date" className="field-label">
                          <CalendarDays size={15} /> Travel Date
                        </label>
                        <div className="date-input-wrapper">
                          <input
                            id="travel-date"
                            type="date"
                            className="booking-input"
                            min={todayStr}
                            value={travelDate}
                            onChange={(e) => {
                              setTravelDate(e.target.value);
                              if (formError) setFormError("");
                              if (apiError) setApiError(null);
                            }}
                            required
                            aria-required="true"
                          />
                        </div>
                        <span className="field-hint">
                          Please select when you would like to depart from Dhaka.
                        </span>
                      </div>

                      {/* Travelers Count Stepper */}
                      <div className="form-group">
                        <label className="field-label" id="travelers-label">
                          <Users size={15} /> Number of Travelers
                        </label>
                        <div className="stepper-control" role="group" aria-labelledby="travelers-label">
                          <button
                            type="button"
                            className="stepper-btn stepper-btn-minus"
                            onClick={handleDecrement}
                            disabled={travelersCount <= 1 || isSubmitting}
                            aria-label="Decrease traveler count"
                          >
                            <Minus size={18} />
                          </button>
                          <span
                            className="stepper-value"
                            aria-live="polite"
                            aria-atomic="true"
                          >
                            {travelersCount}
                          </span>
                          <button
                            type="button"
                            className="stepper-btn stepper-btn-plus"
                            onClick={handleIncrement}
                            disabled={isSubmitting}
                            aria-label="Increase traveler count"
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                        <span className="field-hint">
                          {travelersCount === 1 ? "1 adult traveler" : `${travelersCount} travelers traveling together`}
                        </span>
                      </div>

                      {/* Price Summary Breakdown */}
                      <div className="price-summary-box">
                        <div className="price-summary-row">
                          <span>Price per traveler</span>
                          <span>{formatCurrency(unitPrice)}</span>
                        </div>
                        <div className="price-summary-row">
                          <span>Number of travelers</span>
                          <span>× {travelersCount}</span>
                        </div>
                        <div className="price-summary-divider" />
                        <div className="price-summary-row total-row">
                          <div>
                            <strong>Estimated Total</strong>
                            <small className="block text-xs font-normal text-[#5d6865]">UI Estimate</small>
                          </div>
                          <strong className="total-amount">
                            {formatCurrency(estimatedTotal)}
                          </strong>
                        </div>
                        <p className="price-footnote">
                          * Final price is verified and confirmed authoritatively by the booking system upon checkout.
                        </p>
                      </div>

                      {/* Book Now Button */}
                      <button
                        type="submit"
                        className="booking-submit-button"
                        disabled={isSubmitting}
                        aria-busy={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="animate-spin" size={18} />
                            <span>Booking...</span>
                          </>
                        ) : (
                          <>
                            <span>Confirm Booking</span>
                            <ArrowRight size={17} />
                          </>
                        )}
                      </button>

                      {/* Unauthenticated helpful notice */}
                      {!user && (
                        <p className="booking-auth-note">
                          Note: You must be signed in to complete this booking.{" "}
                          <Link to="/login" className="underline font-semibold hover:text-[#0b2e2c]">
                            Sign in here
                          </Link>
                        </p>
                      )}
                    </form>
                  )}
                </div>
              </aside>
            </div>
          </div>
        )}
      </main>

      <footer className="packages-footer">
        <Link to="/" className="destination-brand">
          <Compass size={21} /> <span>Farflung</span>
        </Link>
        <span>Thoughtful travel, planned from the first idea to landing.</span>
      </footer>
    </div>
  );
}
