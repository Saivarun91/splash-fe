"use client";

import {
    Clock,
    FileText,
    CheckCircle,
    Zap,
    Search,
    Eye,
    Download,
    Plus,
    Trash2,
    Image as ImageIcon,
    FolderKanban,
    MoreVertical,
    BarChart3
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { apiService } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Dashboard() {
    const { token } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("All");
    console.log("projects", projects)
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setLoading(true);
                const response = await apiService.getProjects(token);
                const projectsData = response.projects || [];
                setProjects(projectsData);
            } catch (err) {
                console.error("Error fetching projects:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchProjects();
    }, [token]);

    const handleDeleteProject = async (projectId) => {
        if (!confirm("Are you sure you want to delete this project?")) return;
        try {
            await apiService.deleteProject(projectId, token);
            setProjects((prev) => prev.filter((p) => p.id !== projectId));
        } catch (err) {
            console.error("Error deleting project:", err);
            toast.error("Failed to delete project. Please try again.");
        }
    };

    // Format time ago
    const getTimeAgo = (dateString) => {
        if (!dateString) return "Unknown";
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInHours < 1) {
            return "Just now";
        } else if (diffInHours < 24) {
            return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
        } else if (diffInDays === 1) {
            return "1 day ago";
        } else {
            return `${diffInDays} days ago`;
        }
    };

    // --- Filter logic for Tabs + Search ---
    const filteredProjects = projects.filter((project) => {
        const matchesSearch = project.name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase());

        const matchesTab =
            activeTab === "All" ||
            (activeTab === "In Progress" && project.status === "progress") ||
            (activeTab === "Completed" && project.status === "completed") ||
            (activeTab === "Draft" && project.status === "draft");

        return matchesSearch && matchesTab;
    });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading projects...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
                    <h2 className="text-xl font-bold text-red-700 mb-2">
                        Error Loading Projects
                    </h2>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 text-gray-900">
            <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fade-in">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-1">Projects</h1>
                        <p className="text-gray-600">Organize full campaign photoshoots with multiple products</p>
                    </div>
                    <Link href="/dashboard/projects/create">
                        <button className="bg-[linear-gradient(135deg,hsl(250,70%,60%),hsl(260,75%,65%))] text-white font-medium px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Create New Project
                        </button>
                    </Link>
                </div>

                {/* Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 placeholder-gray-500 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    />
                </div>

                {/* Tabs */}
                <div className="flex gap-3 border-b border-gray-200">
                    {["All", "In Progress", "Completed"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2.5 text-sm font-medium rounded-t-md transition-all duration-200
                    ${activeTab === tab
                                    ? "text-indigo-600 border-b-2 border-indigo-600 bg-white shadow-sm"
                                    : "text-gray-500 hover:text-indigo-500 hover:bg-white/60"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Projects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    {filteredProjects.map((project) => {
                        const statusText = project.status === "progress"
                            ? "In Progress"
                            : project.status === "completed"
                                ? "Completed"
                                : "Draft";

                        const statusBgColor = project.status === "progress"
                            ? "bg-orange-100 text-yellow-500"
                            : project.status === "completed"
                                ? "bg-[#884cff] text-white"
                                : "bg-gray-100 text-gray-800";

                        const updatedAt = project.updated_at || project.created_at;
                        const imageCount = project.total_images || project.collection?.items?.[0]?.product_images?.length || 0;
                        const collaborators = project.team_members || [];

                        return (
                            <Link
                                key={project.id}
                                href={`/dashboard/projects/${project.id}`}
                                className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300 relative block cursor-pointer"
                            >
                                {/* Top Right Menu */}
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleDeleteProject(project.id);
                                    }}
                                    className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition z-10"
                                >
                                    <MoreVertical className="w-5 h-5" />
                                </button>

                                {/* Folder Icon */}
                                <div className="w-12 h-12 rounded-xl bg-[#884cff] flex items-center justify-center mb-4">
                                    <BarChart3 className="w-6 h-6 text-white" />
                                </div>

                                {/* Project Title */}
                                <h3 className="text-lg font-bold text-[#1a1a1a] mb-3">
                                    {project.name}
                                </h3>

                                {/* Status Badge */}
                                <div className="mb-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBgColor}`}>
                                        {statusText}
                                    </span>
                                </div>

                                {/* Images and Updated Time */}
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm text-[#333333]">
                                        {imageCount} {imageCount === 1 ? 'image' : 'images'}
                                    </span>
                                    <span className="text-sm text-[#666666]">
                                        Updated {getTimeAgo(updatedAt)}
                                    </span>
                                </div>

                                {/* Collaborators and Open Button */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-1.5">
                                        {collaborators.length > 0 ? (
                                            <>
                                                {collaborators.slice(0, 3).map((member, i) => (
                                                    <div
                                                        key={i}
                                                        className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-medium text-purple-700 border-2 border-white"
                                                    >
                                                        {member.full_name?.[0]?.toUpperCase() || 'A'}
                                                    </div>
                                                ))}
                                                {collaborators.length > 3 && (
                                                    <span className="text-xs text-gray-500 ml-1">
                                                        +{collaborators.length - 3}
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-medium text-purple-700 border-2 border-white">
                                                A
                                            </div>
                                        )}
                                    </div>
                                    <span
                                        className="text-sm font-medium text-[#884cff] hover:text-[#6d3dd1] transition"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        Open
                                    </span>
                                </div>
                            </Link>
                        );
                    })}

                    {/* Create New Card */}
                    <Link
                        href="/dashboard/projects/create"
                        className="border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-purple-50/30 hover:border-purple-400 hover:bg-purple-50/50 transition"
                    >
                        <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                            <Plus className="w-8 h-8 text-[#884cff]" />
                        </div>
                        <h3 className="font-bold text-[#1a1a1a] mb-2">Create New Project</h3>
                        <p className="text-sm text-gray-600 max-w-[240px] leading-relaxed">
                            Start a new campaign photoshoot with multiple products and themes
                        </p>
                    </Link>
                </div>

                {/* Empty State */}
                {filteredProjects.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search size={24} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {searchQuery ? "No projects found" : "No projects yet"}
                        </h3>
                        <p className="text-gray-600 mb-4">
                            {searchQuery
                                ? "Try adjusting your search terms."
                                : "Create your first project to get started."}
                        </p>
                        {!searchQuery && (
                            <Link href="/dashboard/projects/create">
                                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition">
                                    Create Project
                                </button>
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

}
