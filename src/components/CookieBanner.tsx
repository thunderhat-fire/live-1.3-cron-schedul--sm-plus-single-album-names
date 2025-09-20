"use client";
import { useState, useEffect } from "react";
import CookieConsent from "react-cookie-consent";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Check if user has already made a choice
    const hasConsent = document.cookie
      .split('; ')
      .find(row => row.startsWith('vinylfundersCookieConsent='));
    
    if (!hasConsent) {
      setIsVisible(true);
    }
  }, []);

  // Don't render anything on server-side or if user has already consented
  if (!isClient || !isVisible) {
    return null;
  }

  return (
    <CookieConsent
      location="bottom"
      buttonText="Accept"
      declineButtonText="Decline"
      enableDeclineButton
      cookieName="vinylfundersCookieConsent"
      style={{ background: "#222" }}
      buttonStyle={{ color: "#fff", background: "#007bff", fontSize: "13px" }}
      declineButtonStyle={{ color: "#fff", background: "#888", fontSize: "13px" }}
      expires={150}
      onAccept={() => {
        setIsVisible(false);
      }}
      onDecline={() => {
        setIsVisible(false);
      }}
    >
      We use cookies to enhance your experience, analyze site usage, and assist in our marketing efforts.{" "}
      <a href="/data-protection" style={{ color: "#4e9ef7", textDecoration: "underline" }}>
        Learn more
      </a>
    </CookieConsent>
  );
}