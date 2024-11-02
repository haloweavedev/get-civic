'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="p-6 m-4">
          <h2 className="text-xl font-bold mb-4">Something went wrong</h2>
          <p className="text-red-500 mb-4">{this.state.error?.message}</p>
          <Button
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </Button>
        </Card>
      );
    }

    return this.props.children;
  }
}