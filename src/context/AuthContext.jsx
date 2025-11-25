"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiService } from "@/lib/api";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Load saved token & user from localStorage (client-side only)
    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedToken = localStorage.getItem("token");
            const savedUser = localStorage.getItem("user");

            if (savedToken && savedUser) {
                setToken(savedToken);
                setUser(JSON.parse(savedUser));
            }
            setIsLoading(false);
        }
    }, []);

    // LOGIN function
    const login = async (email, password) => {
        try {
            const data = await apiService.login(email, password);

            if (data?.token) {
                setToken(data.token);
                setUser({
                    email: data.user.email,
                    role: data.user.role,

                });

                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));

                toast.success("Login successful");
                router.push("/dashboard");
                return data;
            } else {
                const errorMessage = "Invalid login response";
                toast.error(errorMessage);
                throw new Error(errorMessage);
            }
        } catch (error) {
            // Extract error message from API response if available
            const errorMessage = "Login failed. Please check your credentials.";
            toast.error(errorMessage);
            console.error("Login error:", error);
            throw error; // Re-throw so caller knows login failed
        }
    };

    // LOGOUT function
    const logout = () => {
        // Clear token and user first
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
        toast.success("Logged out successfully");
        // Navigate to login page
        router.push("/login");
    };

    // Context value (only provide once token & user are loaded)
    const value = {
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token,
        isLoading,
    };

    // Wait until loading finishes before rendering children
    if (isLoading) {
        return <div className="text-center py-10">Loading...</div>;
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
