import { NavigationGuard } from "./components/ui/NavigationGuard";
import { PageErrorBoundary } from "./components/ui/PageErrorBoundary";
import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { createBrowserRouter, RouterProvider, useNavigate } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { HeroUIProvider } from "@heroui/react";
import { store } from "./app/store";
import { App } from "./app/App";
import { FeedbackProvider } from "./components/ui/Feedback";
import "./styles/index.css";
import "./styles/global.css";
import "./styles/account.css";
import "./styles/guest.css";
import "./styles/staff.css";

function AppProviders() {
  const navigate = useNavigate();
  return (
    <MotionConfig reducedMotion="user">
      <HeroUIProvider navigate={navigate}>
        <FeedbackProvider>
          <NavigationGuard><PageErrorBoundary><App /></PageErrorBoundary></NavigationGuard>
        </FeedbackProvider>
      </HeroUIProvider>
    </MotionConfig>
  );
}

const router = createBrowserRouter([{ path: "*", element: <AppProviders /> }]);

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>,
);
