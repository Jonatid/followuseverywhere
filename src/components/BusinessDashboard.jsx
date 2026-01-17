import { useState } from "react";
import PropTypes from "prop-types";

function BusinessDashboard({ business, onNavigate }) {
  const [links, setLinks] = useState(business.socialLinks);
  const [editingId, setEditingId] = useState(null);
  const [draftUrl, setDraftUrl] = useState("");

  const followLink = `https://followuseverywhere.app/${business.slug}`;

  const handleEdit = (link) => {
    setEditingId(link.id);
    setDraftUrl(link.url);
  };

  const handleSave = (id) => {
    setLinks((prev) =>
      prev.map((link) => (link.id === id ? { ...link, url: draftUrl } : link))
    );
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setDraftUrl("");
  };

  return (
    <div className="page">
      <div className="card">
        <div className="header-row">
          <div>
            <p className="eyebrow">Business Dashboard</p>
            <h2>{business.name}</h2>
            <p className="subtitle">{business.tagline}</p>
          </div>
          <button
            className="button ghost"
            type="button"
            onClick={() => onNavigate("public")}
          >
            Preview Public Follow Page
          </button>
        </div>

        <div className="follow-link">
          <div>
            <p className="label">Your Follow Us Everywhere link</p>
            <p className="link-text">{followLink}</p>
          </div>
          <button
            className="button primary"
            type="button"
            onClick={() => window.alert("Link copied!")}
          >
            Copy Link
          </button>
        </div>

        <div className="section">
          <h3>Social Profiles</h3>
          <ul className="list">
            {links.map((link) => (
              <li key={link.id} className="list-item">
                <div>
                  <p className="platform">{link.platform}</p>
                  {editingId === link.id ? (
                    <input
                      className="input"
                      type="url"
                      value={draftUrl}
                      onChange={(event) => setDraftUrl(event.target.value)}
                    />
                  ) : (
                    <p className="url-text">{link.url}</p>
                  )}
                </div>
                <div className="button-row">
                  {editingId === link.id ? (
                    <>
                      <button
                        className="button primary"
                        type="button"
                        onClick={() => handleSave(link.id)}
                      >
                        Save
                      </button>
                      <button
                        className="button ghost"
                        type="button"
                        onClick={handleCancel}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      className="button ghost"
                      type="button"
                      onClick={() => handleEdit(link)}
                    >
                      Edit
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

BusinessDashboard.propTypes = {
  business: PropTypes.shape({
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    tagline: PropTypes.string.isRequired,
    socialLinks: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        platform: PropTypes.string.isRequired,
        url: PropTypes.string.isRequired,
      })
    ).isRequired,
  }).isRequired,
  onNavigate: PropTypes.func.isRequired,
};

export default BusinessDashboard;
