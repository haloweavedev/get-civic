import { ErrorBoundary } from '@/components/error-boundary';

export default function EmailSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}