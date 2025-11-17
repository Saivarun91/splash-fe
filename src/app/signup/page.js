"use client";

import SignupForm from "@/components/signup-form"
import LoginImage from "@/components/login-image"
import Navigation from "@/components/home/Navigation";

export default function SignupPage() {
    return (
        <div className="min-h-screen bg-white">
            <Navigation />
            <main className="pt-20 pb-8 flex items-center justify-center p-4">
                <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Left side - Form */}
                    <SignupForm />

                    {/* Right side - Images */}
                    <div className="hidden lg:block">
                        <LoginImage />
                    </div>
                </div>
            </main>
        </div>
    )
}
