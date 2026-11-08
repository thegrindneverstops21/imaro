import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter, useNavigate } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { HeroUIProvider } from "@heroui/react";
import { store } from "./app/store";
import { App } from "./app/App";
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
        <App />
      </HeroUIProvider>
    </MotionConfig>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <AppProviders />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
