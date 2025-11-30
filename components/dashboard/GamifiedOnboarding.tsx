'use client';

import React from 'react';
import styles from './GamifiedOnboarding.module.css';
import { Button } from "@/components/ui/button";

interface GamifiedOnboardingProps {
  userName: string;
  hasConnectedAccounts: boolean;
  onConnectAccount: () => void;
  onCreateContent: () => void;
}

export function GamifiedOnboarding({
  userName,
  hasConnectedAccounts,
  onConnectAccount,
  onCreateContent,
}: GamifiedOnboardingProps) {
  return (
    <div className={styles.container}>
      <h1 className={styles.greeting}>
        Bonjour {userName}, prêt à faire décoller ton audience?
      </h1>
      
      <div className={styles.onboardingGrid}>
        {/* Connect Account Card */}
        <div className={styles.actionCard}>
          <div className={styles.cardIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path
                d="M17 8l4 4m0 0l-4 4m4-4H3"
                stroke="var(--color-indigo)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3 className={styles.cardTitle}>Connecter un compte</h3>
          <p className={styles.cardDescription}>
            Connecte tes réseaux sociaux pour commencer à gérer ton audience
          </p>
          <div className={styles.platformLogos}>
            <div className={styles.logoBlurred} data-platform="instagram" />
            <div className={styles.logoBlurred} data-platform="tiktok" />
            <div className={styles.logoBlurred} data-platform="youtube" />
          </div>
          <Button variant="primary" onClick={onConnectAccount} disabled={hasConnectedAccounts}>
  {hasConnectedAccounts ? 'Compte connecté ✓' : 'Connecter maintenant'}
</Button>
        </div>

        {/* Latest Stats Card */}
        <div className={styles.actionCard}>
          <div className={styles.cardIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                stroke="var(--color-indigo)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3 className={styles.cardTitle}>Tes statistiques</h3>
          <p className={styles.cardDescription}>
            Visualise ta croissance potentielle et tes performances
          </p>
          <div className={styles.statsVisualization}>
            <svg viewBox="0 0 200 100" className={styles.growthCurve}>
              <defs>
                <linearGradient id="growthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--color-indigo)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="var(--color-indigo)" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              <path
                d="M 0 80 Q 50 60, 100 40 T 200 10"
                stroke="url(#growthGradient)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
              <circle cx="200" cy="10" r="4" fill="var(--color-indigo)" />
            </svg>
            <p className={styles.potentialText}>Potentiel de croissance</p>
          </div>
        </div>

        {/* Create Content Card */}
        <div className={styles.actionCard}>
          <div className={`${styles.cardIcon} ${styles.pulsingIcon}`}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 4v16m8-8H4"
                stroke="var(--color-indigo)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3 className={styles.cardTitle}>Créer du contenu</h3>
          <p className={styles.cardDescription}>
            Lance-toi et crée ton premier contenu pour engager ton audience
          </p>
          <Button variant="primary" onClick={onCreateContent}>
  Commencer à créer
</Button>
        </div>
      </div>
    </div>
  );
}
