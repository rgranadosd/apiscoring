// SPDX-FileCopyrightText: 2023 Industria de Diseño Textil S.A. INDITEX
//
// SPDX-License-Identifier: Apache-2.0

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { IntlProvider } from "react-intl";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import { theme, messages, CertificationPage, VSCodeDataProvider, FilesPage } from "../apiscoringviewer/src";
import { WebDataProvider } from "../apiscoringviewer/src/certification/web-data-provider";
import Layout from "./src/components/layout";
import { useEffect, useState } from 'react';

console.log("React app starting...");

function ServiceChecker() {
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = () => {
      fetch('http://localhost:8080/health')
        .then((res) => {
          if (!res.ok) throw new Error('No disponible');
          if (!cancelled) setShowToast(false);
        })
        .catch(() => {
          if (!cancelled) setShowToast(true);
        });
    };
    check();
    const interval = setInterval(check, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (!showToast) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: '#f56565',
      color: 'white',
      padding: '12px 16px',
      borderRadius: '6px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      maxWidth: '300px',
      fontSize: '14px',
      fontWeight: '500',
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
        ⚠️ Servicio no disponible
      </div>
      <div style={{ fontSize: '12px', opacity: 0.9 }}>
        El servicio de certificación no está disponible
      </div>
      <button
        onClick={() => setShowToast(false)}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          fontSize: '16px',
        }}
      >
        ×
      </button>
    </div>
  );
}

console.log("About to render React app...");

const rootElement = document.getElementById("root")!;
console.log("Root element found:", rootElement);

const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <MantineProvider theme={theme} withGlobalStyles withNormalizeCSS>
      <ServiceChecker />
      <IntlProvider locale="en" messages={messages.en}>
        <Router basename={process.env.PUBLIC_URL}>
          <Layout>
            <Switch>
              <Route
                exact
                path="/"
                render={() => (
                  <CertificationPage DataProvider={VSCodeDataProvider} />
                )}
              />
              <Route path="/files" component={FilesPage} />
            </Switch>
          </Layout>
        </Router>
      </IntlProvider>
    </MantineProvider>
  </StrictMode>
);

console.log("React app rendered!");
