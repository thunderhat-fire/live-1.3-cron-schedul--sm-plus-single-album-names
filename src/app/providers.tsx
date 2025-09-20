"use client";

import { SessionProvider } from "next-auth/react";
import { Session } from "next-auth";
import { FC, ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
  session?: Session | null;
}

const Providers: FC<ProvidersProps> = ({ children, session = null }) => {
  return <SessionProvider session={session}>{children}</SessionProvider>;
};

export default Providers; 