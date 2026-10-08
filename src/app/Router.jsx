import { createBrowserRouter } from "react-router-dom";
import MainLayout from "@/components/layouts/MainLayout";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import HomePage from "@/modules/Home/Index";
import Index from "@/auth";
import Register from "@/auth/Register";
import Login from "@/auth/Login";
import ForgotPassword from "@/auth/ForgotPassword";
import VerifyOtp from "@/auth/VerifyOtp";
import ResetPassword from "@/auth/ResetPassword";
import ProfilePage from "@/modules/Profile/Index";
import { ProtectedRoute } from "@/components/layouts/ProtectedRoute";
import DashboardOverview from "@/modules/Dashboard/Overview";
import DashboardUsers from "@/modules/Dashboard/Users";
import DashboardProducts from "@/modules/Dashboard/Products";
import DashboardEditProduct from "@/modules/Dashboard/EditProduct";
import DashboardOrders from "@/modules/Dashboard/Orders";
import DashboardOrderDetails from "@/modules/Dashboard/OrderDetails";
import DashboardCategories from "@/modules/Dashboard/Categories";
import DashboardColorsSizes from "@/modules/Dashboard/ColorsSizes";
import DashboardReviews from "@/modules/Dashboard/Reviews";
import DashboardReviewDetails from "@/modules/Dashboard/ReviewDetails";
import DashboardSettings from "@/modules/Dashboard/Settings";

import CartPage from "@/modules/Cart/Index";
import WishlistPage from "@/modules/Wishlist/Index";
import ProductsPage from "@/modules/Products/Index";
import ProductDetails from "@/modules/Products/components/ProductDetails";
import CheckoutPage from "@/modules/Checkout/Index";
import OrderSuccessPage from "@/modules/Checkout/OrderSuccess";
import App from "./App";

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      // Public Main Website routes
      {
        element: <MainLayout />,
        children: [
          {
            path: "/",
        element: <HomePage />,
      },
      {
        path: "/products",
        element: <ProductsPage />,
      },
      {
        path: "/products/:id",
        element: <ProductDetails />,
      },
      {
        path: "/shop",
        element: <ProductsPage />,
      },
      {
        path: "/cart",
        element: <CartPage />,
      },
      {
        path: "/wishlist",
        element: <WishlistPage />,
      },
      // Authenticated Storefront Flow (Profile, Checkout)
      {
        element: <ProtectedRoute redirectPath="/login" />,
        children: [
          {
            path: "/profile",
            element: <ProfilePage />,
          },
          {
            path: "/checkout",
            element: <CheckoutPage />,
          },
          {
            path: "/order-success",
            element: <OrderSuccessPage />,
          },
        ],
      },
    ],
  },
  // Auth routes
  {
    path: "/auth-hub",
    element: <Index />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/verify-otp",
    element: <VerifyOtp />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
  // Admin-Only Role-Protected Dashboard route tree
  {
    element: <ProtectedRoute requiredRole="admin" redirectPath="/login" roleRedirectPath="/" />,
    children: [
      {
        path: "/dashboard",
        element: <DashboardLayout />,
        children: [
          {
            index: true,
            element: <DashboardOverview />,
          },
          {
            path: "users",
            element: <DashboardUsers />,
          },
          {
            path: "products",
            element: <DashboardProducts />,
          },
          {
            path: "products/create",
            element: <DashboardProducts />,
          },
          {
            path: "products/edit/:id",
            element: <DashboardEditProduct />,
          },
          {
            path: "orders",
            element: <DashboardOrders />,
          },
          {
            path: "orders/:id",
            element: <DashboardOrderDetails />,
          },
          {
            path: "categories",
            element: <DashboardCategories />,
          },
          {
            path: "colors-sizes",
            element: <DashboardColorsSizes />,
          },
          {
            path: "reviews",
            element: <DashboardReviews />,
          },
          {
            path: "reviews/:id",
            element: <DashboardReviewDetails />,
          },
          {
            path: "settings",
            element: <DashboardSettings />,
          },
        ],
      },
    ],
  },
    ],
  },
]);

export default router;