"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiService } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
export default function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const router = useRouter();
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const handleSignIn = async (e) => {
        e.preventDefault();
        // Handle sign in logic
        setLoading(true);
        setMessage(""); // Clear previous messages
        console.log("Sign in with:", { email, password });
        try {
            await login(email, password);
            // Navigation is handled in AuthContext.login on success
        } catch (err) {

            setMessage("Login failed. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = () => {
        // Handle Google sign in logic
        console.log("Sign in with Google");
    };

    return (
        <div className="w-full max-w-md">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-[#0c1421] mb-2">Login</h1>
                <p className="text-lg text-[#313957]">
                    Stay connected with us to see magic
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSignIn} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                    <label
                        htmlFor="email"
                        className="block text-sm font-semibold text-[#0c1421]"
                    >
                        Email
                    </label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="Example@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-[#f3f9fa] border border-[#e6e6e6] rounded-lg text-[#313957] placeholder:text-[#737373] focus:outline-none focus:ring-2 focus:ring-[#5533ff]"
                    />
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                    <label
                        htmlFor="password"
                        className="block text-sm font-semibold text-[#0c1421]"
                    >
                        Password
                    </label>
                    <Input
                        id="password"
                        type="password"
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-[#f3f9fa] border border-[#e6e6e6] rounded-lg text-[#313957] placeholder:text-[#737373] focus:outline-none focus:ring-2 focus:ring-[#5533ff]"
                    />
                </div>

                {/* Forgot Password Link */}
                <div className="text-right">
                    <a
                        href="#"
                        className="text-sm font-medium text-[#5533ff] hover:opacity-80 transition-opacity"
                    >
                        Forgot Password?
                    </a>
                </div>

                {/* Error Message */}
                {message && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{message}</p>
                    </div>
                )}

                {/* Sign In Button */}
                <Button
                    type="submit"
                    className="w-full py-3 bg-[#5533ff] hover:bg-[#4422dd] text-white font-semibold rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                >
                    {loading ? "Signing in..." : "Sign in"}
                </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-px bg-[#e6e6e6]"></div>
                <span className="text-sm text-[#737373]">Or</span>
                <div className="flex-1 h-px bg-[#e6e6e6]"></div>
            </div>

            {/* Google Sign In */}
            <button
                onClick={handleGoogleSignIn}
                className="w-full py-3 px-4 bg-[#f3f9fa] border border-[#e6e6e6] rounded-lg flex items-center justify-center gap-3 hover:bg-[#f7fbff] transition-colors"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <text x="0" y="20" fontSize="20" fill="#4285f4">
                        G
                    </text>
                </svg>
                <span className="text-sm font-medium text-[#0c1421]">
                    Sign in with Google
                </span>
            </button>

            {/* Sign Up Link */}
            <div className="mt-8 text-center">
                <p className="text-sm text-[#313957]">
                    Don&apos;t you have an account?{" "}
                    <Link href="/signup" className="font-semibold text-[#5533ff] hover:opacity-80">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
