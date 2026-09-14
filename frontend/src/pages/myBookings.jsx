import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Ban,
  CalendarDays,
  CheckCircle2,
  Compass,
  Loader2,
  LogIn,
  MapPin,
  Plane,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import SiteHeader from "../components/SiteHeader.jsx";
import { cancelBooking, getMyBookings } from "../lib/api.js";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);

  useEffect(() => {
    let ignore = false;

    getMyBookings()
      .then((data) => {
        if (ignore) return;
        const list = Array.isArray(data) ? data : (data?.bookings ?? []);
        setBookings(list);
        setError(null);
      })
      .catch((err) => {
        if (ignore) return;
        if (err.status === 401) {
          setError({
            status: 401,
            message: "Please log in to view your bookings.",
          });
        } else {
          setError({
            status: err.status || 500,
            message: err.message || "Failed to load bookings. Please try again.",
          });
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleCancel = async (bookingId) => {
    setCancellingId(bookingId);
    setActionFeedback(null);

    try {
      const response = await cancelBooking(bookingId);
      setBookings((prev) =>
        prev.map((b) => {
          const bId = b.booking_id ?? b.id;
          if (bId === bookingId) {
            return {
              ...b,
              status: "cancelled",
            };
          }
          return b;
        })
      );
      setConfirmingId(null);
      setActionFeedback({
        type: "success",
        bookingId,
        message: response?.message ?? "Booking cancelled successfully.",
      });
    } catch (err) {
      setActionFeedback({
        type: "error",
        bookingId,
        message: err.message || "Failed to cancel booking. Please try again.",
      });
    } finally {
      setCancellingId(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="my-bookings-page">
      <SiteHeader />

      <main className="my-bookings-main">
        {/* Top Header Strip */}
        <section className="my-bookings-top-strip">
          <div className="my-bookings-inner">
            <p className="home-kicker home-kicker-dark">
              <span /> Your Farflung Journeys
            </p>
            <h1>My Bookings</h1>
            <p className="my-bookings-subtitle">
              Manage and review your confirmed travel reservations departing from Dhaka.
            </p>
          </div>
        </section>

        <div className="my-bookings-inner my-bookings-content">
          {/* Loading State */}
          {loading && (
            <div className="my-bookings-feedback-box">
              <Loader2 className="animate-spin text-[#1e5f58]" size={36} />
              <p>Loading your bookings...</p>
            </div>
          )}

          {/* Unauthenticated State (HTTP 401) */}
          {!loading && error && error.status === 401 && (
            <div className="my-bookings-card-state" role="alert">
              <div className="state-icon-wrap auth-icon-wrap">
                <LogIn size={36} />
              </div>
              <h2>Please log in to view your bookings</h2>
              <p>
                You need to be signed in to see your reservation history and trip details.
              </p>
              <div className="state-actions">
                <Link to="/login" className="home-cta-button">
                  Log in to your account <ArrowRight size={16} />
                </Link>
                <Link to="/signup" className="booking-secondary-link">
                  Don't have an account? Sign up
                </Link>
              </div>
            </div>
          )}

          {/* Generic Error State */}
          {!loading && error && error.status !== 401 && (
            <div className="my-bookings-card-state" role="alert">
              <div className="state-icon-wrap error-icon-wrap">
                <AlertCircle size={36} />
              </div>
              <h2>Unable to load bookings</h2>
              <p>{error.message}</p>
              <div className="state-actions">
                <button
                  type="button"
                  className="home-cta-button"
                  onClick={() => {
                    setLoading(true);
                    setError(null);
                    getMyBookings()
                      .then((data) => {
                        setBookings(Array.isArray(data) ? data : (data?.bookings ?? []));
                      })
                      .catch((err) => {
                        setError({
                          status: err.status || 500,
                          message: err.message || "Failed to load bookings.",
                        });
                      })
                      .finally(() => setLoading(false));
                  }}
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && bookings.length === 0 && (
            <div className="my-bookings-card-state">
              <div className="state-icon-wrap empty-icon-wrap">
                <Compass size={36} />
              </div>
              <h2>No bookings yet</h2>
              <p>Start planning your next trip. Explore our curated packages departing from Dhaka.</p>
              <div className="state-actions">
                <Link to="/packages" className="home-cta-button">
                  Explore available packages <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          )}

          {/* Populated Bookings List */}
          {!loading && !error && bookings.length > 0 && (
            <div className="my-bookings-container">
              <div className="my-bookings-heading-row">
                <span className="bookings-count-label">
                  Showing {bookings.length} confirmed {bookings.length === 1 ? "journey" : "journeys"}
                </span>
                <span className="bookings-guarantee-note">
                  <ShieldCheck size={16} /> Human departure coordination included
                </span>
              </div>

              <div className="my-bookings-grid">
                {bookings.map((booking) => {
                  const bookingId = booking.booking_id ?? booking.id;
                  const packageTitle = booking.package_title || `Package #${booking.package_id}`;
                  const destination = booking.destination || "Destination";
                  const travelDate = booking.travel_date;
                  const travelersCount = booking.travelers_count;
                  const totalPrice = booking.total_price;
                  const status = booking.status || "confirmed";

                  return (
                    <article key={bookingId} className={`my-booking-card ${status === "cancelled" ? "is-cancelled" : ""}`}>
                      <div className="my-booking-header">
                        <div className="booking-reference-badge">
                          <span>Booking ID</span>
                          <strong>#{bookingId}</strong>
                        </div>
                        <span className={`booking-status-pill status-${status}`}>
                          {status === "cancelled" ? <Ban size={13} /> : <CheckCircle2 size={13} />}
                          {status}
                        </span>
                      </div>

                      {actionFeedback && actionFeedback.bookingId === bookingId && (
                        <div className={`booking-card-feedback feedback-${actionFeedback.type}`} role="alert">
                          {actionFeedback.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                          <span>{actionFeedback.message}</span>
                        </div>
                      )}

                      <div className="my-booking-body">
                        <div className="my-booking-destination-tag">
                          <MapPin size={14} /> {destination}
                        </div>
                        <h3 className="my-booking-title">{packageTitle}</h3>

                        <div className="my-booking-details-list">
                          <div className="my-booking-detail-item">
                            <span className="detail-label">
                              <CalendarDays size={15} /> Travel Date
                            </span>
                            <strong className="detail-val">{travelDate}</strong>
                          </div>

                          <div className="my-booking-detail-item">
                            <span className="detail-label">
                              <Users size={15} /> Travelers
                            </span>
                            <strong className="detail-val">
                              {travelersCount} {travelersCount === 1 ? "traveler" : "travelers"}
                            </strong>
                          </div>

                          <div className="my-booking-detail-item">
                            <span className="detail-label">
                              <Plane size={15} /> Departure
                            </span>
                            <strong className="detail-val">Dhaka, Bangladesh</strong>
                          </div>
                        </div>
                      </div>

                      <div className="my-booking-footer">
                        <div className="my-booking-price-wrap">
                          <span className="price-label">
                            Total Price ({status === "cancelled" ? "Cancelled" : "Confirmed"})
                          </span>
                          <strong className={`price-val ${status === "cancelled" ? "price-val-cancelled" : ""}`}>
                            {formatCurrency(totalPrice)}
                          </strong>
                        </div>

                        {status !== "cancelled" && (
                          <div className="my-booking-actions">
                            {confirmingId === bookingId ? (
                              <div className="cancel-confirm-box">
                                <p className="cancel-confirm-text">Cancel reservation?</p>
                                <div className="cancel-confirm-btns">
                                  <button
                                    type="button"
                                    className="btn-cancel-confirm"
                                    disabled={cancellingId === bookingId}
                                    onClick={() => handleCancel(bookingId)}
                                  >
                                    {cancellingId === bookingId ? (
                                      <>
                                        <Loader2 className="animate-spin" size={13} />
                                        <span>Cancelling...</span>
                                      </>
                                    ) : (
                                      "Yes, cancel"
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-cancel-dismiss"
                                    disabled={cancellingId === bookingId}
                                    onClick={() => setConfirmingId(null)}
                                  >
                                    Keep
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="booking-cancel-button"
                                onClick={() => {
                                  setActionFeedback(null);
                                  setConfirmingId(bookingId);
                                }}
                              >
                                <Ban size={13} />
                                <span>Cancel Booking</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
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
