"use client";

import React from "react";
import { BridgeLauncher } from "@/components/of/BridgeLauncher";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function Client() {
  return (
    <ProtectedRoute requireOnboarding={false}>
      <div className="hz" data-theme="light">
        <main className="hz-main">
        <div className="hz-page" style={{ maxWidth: 720 }}>
          <h1>Connect OnlyFans</h1>
          <div className="hz-card" style={{ marginTop: 12 }}>
            <div className="hz-card__body">
              <p className="hz-muted">Use the mobile app or desktop helper to complete a secure login.</p>
              <div style={{ marginTop: 8 }}>
                <BridgeLauncher variant="hz" />
              </div>
            </div>
          </div>
        </div>
      </main>
      </div>
    </ProtectedRoute>
  );
}

