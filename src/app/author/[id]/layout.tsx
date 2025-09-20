import { generateMetadata } from './metadata';

// Export the dynamic metadata function
export { generateMetadata };

export default function AuthorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
