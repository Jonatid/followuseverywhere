import PropTypes from "prop-types";

function LandingPage({ onNavigate }) {
  return (
    <div className="page">
      <div className="card hero">
        <p className="eyebrow">Business-only follow hub</p>
        <h1>Follow Us Everywhere</h1>
        <p className="subtitle">
          One link to connect customers to all your social pages.
        </p>
        <div className="button-row">
          <button
            className="button primary"
            type="button"
            onClick={() => onNavigate("dashboard")}
          >
            View Business Dashboard
          </button>
          <button
            className="button ghost"
            type="button"
            onClick={() => onNavigate("public")}
          >
            View Public Follow Page (Sample Business)
          </button>
        </div>
      </div>
    </div>
  );
}

LandingPage.propTypes = {
  onNavigate: PropTypes.func.isRequired,
};

export default LandingPage;
