"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react"; // Import useEffect

export default function SignInForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For login form submission
  const [error, setError] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // State for initial auth check

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // --- New useEffect for checking auth status on mount ---
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Assume '/api/auth/me' verifies the session cookie and returns user info if logged in
        const response = await fetch("/api/auth/me", {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          credentials: "include", // Important to send session cookies
        });

        if (response.ok) {
          // If the response is OK, the user is already logged in
          const data = await response.json();
          if (data.user) {
            console.log("User already logged in, redirecting to /home");
            router.push("/home");
            // No need to set isCheckingAuth to false, as we are redirecting
            return; // Exit early
          }
        }
        // If response is not ok (e.g., 401 Unauthorized), the user is not logged in.
        // Let the component render the login form.
      } catch (err) {
        console.error("Error checking auth status:", err);
        // Proceed to show login form even if the check fails
      } finally {
        // Only set to false if we *didn't* redirect
        setIsCheckingAuth(false);
      }
    };

    checkAuthStatus();
  }, [router]); // Dependency array includes router

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  };

  // Form validation
  const validateForm = () => {
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (!formData.password) {
      setError("Password is required");
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const requestPayload = {
        email: formData.email,
        password: formData.password,
        rememberMe: isChecked, // Send rememberMe flag if needed by backend
      };

      console.log(
        "Sending login request with payload:",
        JSON.stringify(requestPayload),
      );

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestPayload),
        credentials: "include",
      });

      console.log("Received response with status:", response.status);
      const responseClone = response.clone(); // Clone before reading body

      let data;
      try {
        data = await response.json();
        console.log("Response parsed as JSON:", data);
      } catch (jsonError) {
        const textResponse = await responseClone.text();
        console.error("Failed to parse response as JSON:", jsonError);
        console.error("Raw response:", textResponse);
        throw new Error(
          "Server returned an invalid response format. Please try again later.",
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            `Login failed with status ${response.status}`,
        );
      }

      // Store token only if explicitly requested and provided by backend
      if (isChecked && data.token) {
        localStorage.setItem("auth_token", data.token);
        console.log("Auth token stored in localStorage.");
      } else {
        // Clear any potential old token if not remembering
        localStorage.removeItem("auth_token");
      }

      // Store user data regardless (useful for UI display later)
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        console.log("User data stored in localStorage.");
      }

      console.log("Login successful, redirecting to home page");
      router.push("/home"); // Redirect to the home page
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Optional: Show a loading indicator while checking auth
  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen flex-1 flex-col items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">
          Checking authentication...
        </p>
        {/* You could add a spinner here */}
      </div>
    );
  }

  // Render the form only if not checking auth (and not redirected)
  return (
    <div className="flex w-full flex-1 flex-col lg:w-1/2">
      <div className="mx-auto mb-5 w-full max-w-md sm:pt-10">
        <Link
          href="/" // Link back to landing page perhaps?
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Back to Home {/* Changed from dashboard */}
        </Link>
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="text-title-sm sm:text-title-md mb-2 font-semibold text-gray-800 dark:text-white/90">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign in!
            </p>
          </div>
          <div>
            {/* Social login buttons - keep as is */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
              <button className="inline-flex items-center justify-center gap-3 rounded-lg bg-gray-100 px-7 py-3 text-sm font-normal text-gray-700 transition-colors hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10">
                {/* Google SVG */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18.7511 10.1944C18.7511 9.47495 18.6915 8.94995 18.5626 8.40552H10.1797V11.6527H15.1003C15.0011 12.4597 14.4654 13.675 13.2749 14.4916L13.2582 14.6003L15.9087 16.6126L16.0924 16.6305C17.7788 15.1041 18.7511 12.8583 18.7511 10.1944Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M10.1788 18.75C12.5895 18.75 14.6133 17.9722 16.0915 16.6305L13.274 14.4916C12.5201 15.0068 11.5081 15.3666 10.1788 15.3666C7.81773 15.3666 5.81379 13.8402 5.09944 11.7305L4.99473 11.7392L2.23868 13.8295L2.20264 13.9277C3.67087 16.786 6.68674 18.75 10.1788 18.75Z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.10014 11.7305C4.91165 11.186 4.80257 10.6027 4.80257 9.99992C4.80257 9.3971 4.91165 8.81379 5.09022 8.26935L5.08523 8.1534L2.29464 6.02954L2.20333 6.0721C1.5982 7.25823 1.25098 8.5902 1.25098 9.99992C1.25098 11.4096 1.5982 12.7415 2.20333 13.9277L5.10014 11.7305Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M10.1789 4.63331C11.8554 4.63331 12.9864 5.34303 13.6312 5.93612L16.1511 3.525C14.6035 2.11528 12.5895 1.25 10.1789 1.25C6.68676 1.25 3.67088 3.21387 2.20264 6.07218L5.08953 8.26943C5.81381 6.15972 7.81776 4.63331 10.1789 4.63331Z"
                    fill="#EB4335"
                  />
                </svg>
                Sign in with Google
              </button>
              <button className="inline-flex items-center justify-center gap-3 rounded-lg bg-gray-100 px-7 py-3 text-sm font-normal text-gray-700 transition-colors hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10">
                {/* X SVG */}
                <svg
                  width="21"
                  className="fill-current"
                  height="20"
                  viewBox="0 0 21 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M15.6705 1.875H18.4272L12.4047 8.75833L19.4897 18.125H13.9422L9.59717 12.4442L4.62554 18.125H1.86721L8.30887 10.7625L1.51221 1.875H7.20054L11.128 7.0675L15.6705 1.875ZM14.703 16.475H16.2305L6.37054 3.43833H4.73137L14.703 16.475Z" />
                </svg>
                Sign in with X
              </button>
            </div>
            <div className="relative py-3 sm:py-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white p-2 text-gray-400 sm:px-5 sm:py-2 dark:bg-gray-900">
                  Or
                </span>
              </div>
            </div>

            {/* Display error message if any */}
            {error && (
              <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>{" "}
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    placeholder="info@gmail.com"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    aria-invalid={
                      !!error && error.toLowerCase().includes("email")
                    } // Basic ARIA for accessibility
                    aria-describedby={
                      error && error.toLowerCase().includes("email")
                        ? "email-error"
                        : undefined
                    }
                  />
                  {error && error.toLowerCase().includes("email") && (
                    <p id="email-error" className="mt-1 text-xs text-red-500">
                      {error}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="password">
                    Password <span className="text-red-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      aria-invalid={
                        !!error && error.toLowerCase().includes("password")
                      }
                      aria-describedby={
                        error && error.toLowerCase().includes("password")
                          ? "password-error"
                          : undefined
                      }
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-1/2 right-4 z-30 -translate-y-1/2 cursor-pointer"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                  {error && error.toLowerCase().includes("password") && (
                    <p
                      id="password-error"
                      className="mt-1 text-xs text-red-500"
                    >
                      {error}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="keep-logged-in"
                      checked={isChecked}
                      onChange={setIsChecked}
                    />
                    {/* Associated label with checkbox using htmlFor */}
                    <label
                      htmlFor="keep-logged-in"
                      className="text-theme-sm block cursor-pointer font-normal text-gray-700 dark:text-gray-400"
                    >
                      Keep me logged in
                    </label>
                  </div>
                  <Link
                    href="/reset-password" // Make sure this route exists
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div>
                  <Button
                    className="w-full"
                    size="sm"
                    type="submit"
                    disabled={isLoading}
                    aria-busy={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign in"}
                  </Button>
                </div>
              </div>
            </form>

            {/* Removed the Test API Connection button for cleaner UI */}
            {/* <div className="mt-3"> ... </div> */}

            <div className="mt-5">
              <p className="text-center text-sm font-normal text-gray-700 sm:text-start dark:text-gray-400">
                Don't have an account?{" "}
                <Link
                  href="/signup" // Make sure this route exists
                  className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Important Backend Note ---
// You MUST have an API route like '/api/auth/me' that does the following:
// 1. Receives the request WITH credentials (cookies).
// 2. Verifies the session cookie (or token if you use Authorization headers).
// 3. If the session is valid, it responds with status 200 OK and ideally user data:
//    e.g., `return NextResponse.json({ user: { id: user.id, email: user.email, /* other needed fields */ } });`
// 4. If the session is invalid or missing, it responds with status 401 Unauthorized (or 403 Forbidden).
//    e.g., `return new NextResponse('Unauthorized', { status: 401 });`
