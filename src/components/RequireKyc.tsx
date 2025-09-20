"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RequireKyc({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session?.user) {
      setChecking(false);
      return;
    }
    
    let isMounted = true;
    fetch("/api/artist/connect-onboarding", { method: "POST" })
      .then(res => res.json())
      .then(data => {
        if (!data.onboardingComplete) {
          if (isMounted) router.replace("/artist/onboarding/refresh");
        } else {
          if (isMounted) setChecking(false);
        }
      })
      .catch(() => {
        if (isMounted) setChecking(false);
      });
    return () => { isMounted = false; };
  }, [session, router, status]);

  if (status === "loading" || (checking && session?.user)) {
    return <div className="py-10 text-center">Checking account status...</div>;
  }

  return <>{children}</>;
} 