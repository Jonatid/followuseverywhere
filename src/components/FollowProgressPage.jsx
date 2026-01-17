import { useEffect } from "react";
import PropTypes from "prop-types";

function FollowProgressPage({ business, statuses, onNavigate }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onNavigate("success");
    }, 2000);

    return () => clearTimeout(timer);
  }, [onNavigate]);

  return (
    <div className="page">
      <div className="card">
        <p className="eyebrow">Follow Us Everywhere</p>
        <h2>Connecting you to {business.name}…</h2>
        <p className="subtitle">
          We’re opening your apps so you can follow and subscribe.
        </p>
        <ul className="status-list">
          {statuses.map((status) => (
            <li key={status.id} className="status-item">
              <span className="status-platform">{status.label}</span>
              <span className="status-text">{status.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

FollowProgressPage.propTypes = {
  business: PropTypes.shape({
    name: PropTypes.string.isRequired,
  }).isRequired,
  statuses: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
    })
  ).isRequired,
  onNavigate: PropTypes.func.isRequired,
};

export default FollowProgressPage;
