import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <FluentProvider theme={webLightTheme}>
        <App />
      </FluentProvider>
    </BrowserRouter>
  </React.StrictMode >,
);
