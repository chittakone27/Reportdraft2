// App.jsx
import React, { useEffect } from "react";
import OrgUnitReport from "./reports/OrgUnitReport";
import "./reports/OrgUnitTree/OrgUnitTree.css";

const App = () => {
  // Expand DHIS2 page width (safe version)
  useEffect(() => {
    const intervalId = setInterval(() => {
      const appRoot = parent?.document?.getElementById("dhis2-app-root");

      if (appRoot) {
        try {
          appRoot.children[0].children[1].children[0].children[0].children[0]
            .children[0].children[0].children[0].style.width = "100%";
        } catch (e) {
          console.warn("DHIS2 DOM changed, cannot resize layout");
        }

        clearInterval(intervalId);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
      <div>
        <OrgUnitReport />
      </div>
  );
};

export default App;
