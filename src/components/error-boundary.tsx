// src/components/error-boundary.tsx
'use client';

import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    console.error('Component error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const errorMessage =
        this.state.error?.message || 'An unknown error occurred.';
      const errorDetails =
        this.state.errorInfo?.componentStack || 'No additional details available.';

      return (
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-600 mb-4">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-semibold">Something went wrong</h3>
          </div>
          <p className="text-sm text-red-600 mb-2">{errorMessage}</p>
          <pre className="text-xs text-red-500 mb-4 overflow-auto max-h-48">
            {errorDetails}
          </pre>
          <Button
            onClick={this.handleRetry}
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Try again
          </Button>
        </Card>
      );
    }

    return this.props.children;
  }
}