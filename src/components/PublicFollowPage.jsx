import PropTypes from "prop-types";

function PublicFollowPage({ business, onNavigate }) {
  const handleOpen = (link) => {
    window.open(link.url, "_blank", "noreferrer");
    console.log(`User clicked ${link.platform}`);
  };

  return (
    <div className="page">
      <div className="card">
        <div className="logo">{business.initials}</div>
        <h2>{business.name}</h2>
        <p className="subtitle">{business.tagline}</p>
        <p className="body-text">
          Follow this business everywhere in two taps.
        </p>

        <div className="button-stack">
          {business.socialLinks.map((link) => (
            <button
              key={link.id}
              className="button secondary"
              type="button"
              onClick={() => handleOpen(link)}
            >
              {link.action} on {link.platform}
            </button>
          ))}
        </div>

        <button
          className="button primary large"
          type="button"
          onClick={() => onNavigate("progress")}
        >
          Follow Us Everywhere
        </button>
      </div>
    </div>
  );
}

PublicFollowPage.propTypes = {
  business: PropTypes.shape({
    name: PropTypes.string.isRequired,
    tagline: PropTypes.string.isRequired,
    initials: PropTypes.string.isRequired,
    socialLinks: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        platform: PropTypes.string.isRequired,
        action: PropTypes.string.isRequired,
        url: PropTypes.string.isRequired,
      })
    ).isRequired,
  }).isRequired,
  onNavigate: PropTypes.func.isRequired,
};

export default PublicFollowPage;
