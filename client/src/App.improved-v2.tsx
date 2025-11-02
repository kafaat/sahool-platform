import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// تحسين 1: Lazy Loading للصفحات
// تحميل الصفحات فقط عند الحاجة لتقليل حجم Bundle الأولي
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Farms = lazy(() => import("./pages/Farms"));
const Equipment = lazy(() => import("./pages/Equipment"));
const Alerts = lazy(() => import("./pages/Alerts"));
const WorkPlanner = lazy(() => import("./pages/WorkPlanner"));
const LiveMonitoring = lazy(() => import("./pages/LiveMonitoring"));
const NotFound = lazy(() => import("./pages/NotFound"));

// تحسين 2: مكون Loading مخصص
function PageLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
        <p className="text-gray-600">جاري التحميل...</p>
      </div>
    </div>
  );
}

// تحسين 3: مكون Route مع Suspense
function LazyRoute({ path, component: Component }: { path?: string; component: React.LazyExoticComponent<() => JSX.Element> }) {
  return (
    <Route
      path={path}
      component={() => (
        <Suspense fallback={<PageLoadingFallback />}>
          <Component />
        </Suspense>
      )}
    />
  );
}

function Router() {
  return (
    <Switch>
      <LazyRoute path="/" component={LandingPage} />
      <LazyRoute path="/home" component={Home} />
      <LazyRoute path="/dashboard" component={Dashboard} />
      <LazyRoute path="/farms" component={Farms} />
      <LazyRoute path="/equipment" component={Equipment} />
      <LazyRoute path="/alerts" component={Alerts} />
      <LazyRoute path="/work-planner" component={WorkPlanner} />
      <LazyRoute path="/live-monitoring" component={LiveMonitoring} />
      <LazyRoute path="/404" component={NotFound} />
      <LazyRoute component={NotFound} />
    </Switch>
  );
}

// تحسين 4: Theme Switcher
// يمكن تفعيله بإزالة التعليق من switchable
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable // فعّل هذا لإضافة Dark Mode
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
