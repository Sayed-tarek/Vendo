import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./Router";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import "@/assets/style/variables.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <LanguageProvider>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </LanguageProvider>
);