import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import routes from "./routes";
import { CssBaseline } from "@mui/material";
import { ToastContainer } from "react-toastify";
import "locales/config";
import AppTheme from "theme/app-theme";
import ForceLightMode from "theme/force-light-mode";

const renderRoutes = (routes: any[]) => {
  return routes.map((route, index) => {
    if (route.routes) {
      return (
        <Route path={route.path} element={<route.component />} key={index}>
          {renderRoutes(route.routes)}
        </Route>
      );
    }
    return (
      <Route path={route.path} element={<route.component />} key={index} />
    );
  });
};

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppTheme>
        <CssBaseline />
        <ForceLightMode />
        <Router>
          <Routes>{renderRoutes(routes)}</Routes>
        </Router>
        <ToastContainer />
      </AppTheme>
    </QueryClientProvider>
  );
}

export default App;
