import PropTypes from "prop-types";

function FollowSuccessPage({ business, onNavigate }) {
  return (
    <div className="page">
      <div className="card success">
        <div className="success-icon">✅</div>
        <h2>Success!</h2>
        <p className="subtitle">
          You’re now connected to {business.name} on the platforms you chose.
        </p>
        <button
          className="button primary"
          type="button"
          onClick={() => onNavigate("public")}
        >
          Back to Follow Page
        </button>
      </div>
    </div>
  );
}

FollowSuccessPage.propTypes = {
  business: PropTypes.shape({
    name: PropTypes.string.isRequired,
  }).isRequired,
  onNavigate: PropTypes.func.isRequired,
};

export default FollowSuccessPage;
