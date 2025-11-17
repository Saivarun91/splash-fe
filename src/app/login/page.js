"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import LoginForm from "@/components/login-form"
import LoginImage from "@/components/login-image"
import Navigation from "@/components/home/Navigation";

export default function LoginPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
        // Redirect to dashboard if user is already authenticated
        if (!isLoading && isAuthenticated) {
            router.push("/dashboard");
        }
    }, [isAuthenticated, isLoading, router]);

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <main className="min-h-screen bg-white flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </main>
        );
    }

    // If authenticated, don't render the login page (redirect will happen)
    if (isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-white">
            <Navigation />
            <main className="pt-20 pb-8 flex items-center justify-center p-4">
                <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Left side - Form */}
                    <LoginForm />

                    {/* Right side - Images */}
                    <div className="hidden lg:block">
                        <LoginImage />
                    </div>
                </div>
            </main>
        </div>
    )
}
