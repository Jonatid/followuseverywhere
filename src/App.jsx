import { useState } from "react";
import LandingPage from "./components/LandingPage.jsx";
import BusinessDashboard from "./components/BusinessDashboard.jsx";
import PublicFollowPage from "./components/PublicFollowPage.jsx";
import FollowProgressPage from "./components/FollowProgressPage.jsx";
import FollowSuccessPage from "./components/FollowSuccessPage.jsx";
import { business, followEverywhereStatuses } from "./data/mockData.js";

const screens = {
  landing: LandingPage,
  dashboard: BusinessDashboard,
  public: PublicFollowPage,
  progress: FollowProgressPage,
  success: FollowSuccessPage,
};

function App() {
  const [currentScreen, setCurrentScreen] = useState("landing");

  const ScreenComponent = screens[currentScreen];

  return (
    <main className="app">
      <ScreenComponent
        business={business}
        statuses={followEverywhereStatuses}
        onNavigate={setCurrentScreen}
      />
    </main>
  );
}

export default App;
