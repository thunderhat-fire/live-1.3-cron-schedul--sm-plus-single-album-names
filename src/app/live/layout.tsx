import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Streaming - Plus Members Only',
  description: 'Connect with your fans through live streaming, exclusively for Plus members.',
};

export default function LiveStreamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 