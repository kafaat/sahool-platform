import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Farms from "./pages/Farms";
import Equipment from "./pages/Equipment";
import Alerts from "./pages/Alerts";
import WorkPlanner from "./pages/WorkPlanner";
import LiveMonitoring from "./pages/LiveMonitoring";
import DroneAnalysis from "./pages/DroneAnalysis";
import DiseaseDetection from "./pages/DiseaseDetection";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={LandingPage} />
      <Route path={"/home"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/farms"} component={Farms} />
      <Route path={"/equipment"} component={Equipment} />
      <Route path={"/alerts"} component={Alerts} />
      <Route path={"/work-planner"} component={WorkPlanner} />
      <Route path={"/live-monitoring"} component={LiveMonitoring} />
      <Route path={"/drone-analysis"} component={DroneAnalysis} />
      <Route path={"/disease-detection"} component={DiseaseDetection} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route path="/:rest*" component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
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
