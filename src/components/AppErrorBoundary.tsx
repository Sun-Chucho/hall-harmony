import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
    message: "",
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || "The page could not be loaded.",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[AppErrorBoundary] Page crashed", { error, componentStack: info.componentStack });
  }

  private clearCacheAndReload = () => {
    try {
      Object.keys(localStorage)
        .filter((key) => key.startsWith("firestore_") || key.startsWith("kuringe_"))
        .forEach((key) => localStorage.removeItem(key));
    } catch {
      // Reload is still useful even if local storage cleanup is blocked.
    }

    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <section className="w-full max-w-lg rounded-lg border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-foreground">Page recovery</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This page hit a temporary loading error. Reload the app, or clear cached app data if the browser is still holding old data.
          </p>
          {this.state.message ? (
            <p className="mt-4 rounded-md bg-muted p-3 text-xs text-muted-foreground">{this.state.message}</p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-3">
            <Button type="button" onClick={() => window.location.reload()}>
              Reload
            </Button>
            <Button type="button" variant="outline" onClick={this.clearCacheAndReload}>
              Clear cache and reload
            </Button>
          </div>
        </section>
      </main>
    );
  }
}
