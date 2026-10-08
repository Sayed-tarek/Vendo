import { Outlet, ScrollRestoration } from "react-router-dom";
import ScrollToTop from "@/components/layouts/ScrollToTop";

function App() {
  return (
    <>
      <ScrollToTop />
      <ScrollRestoration />
      <Outlet />
    </>
  );
}

export default App;