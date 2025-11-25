"use client"

import { useState } from "react"
import { ChevronLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { apiService } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
const CreateProjectPage = () => {
    const [projectName, setProjectName] = useState("")
    const [description, setDescription] = useState("")
    // const [category, setCategory] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const router = useRouter()
    const { token } = useAuth()
    const handleCreateProject = async () => {
        if (!projectName.trim()) {
            setError("Project name is required")
            return
        }

        if (!description.trim()) {
            setError("Description is required")
            return
        }

        try {
            setLoading(true)
            setError(null)

            const projectData = {
                name: projectName.trim(),
                about: description.trim(),

            }
            const response = await apiService.createProject(projectData, token)
            console.log(response)
            router.push(`/dashboard/projects/${response.id}`)
        } catch (err) {
            console.error('Error creating project:', err)
            setError(err.message || 'Failed to create project. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleBack = () => {
        router.push("/dashboard/projects")
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 text-gray-900">
            <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleBack}
                            disabled={loading}
                            className="w-10 h-10 rounded-lg bg-[#884cff] flex items-center justify-center text-white hover:bg-[#7a3ff0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold mb-1">Create New Project</h1>
                            <p className="text-gray-600">Organize full campaign photoshoots with multiple products</p>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-600">{error}</p>
                    </div>
                )}

                {/* Form Card */}
                <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                    <div className="max-w-2xl space-y-8">
                        {/* Project Name Field */}
                        <div>
                            <label htmlFor="projectName" className="block text-lg font-semibold text-gray-900 mb-3">
                                Project Name<span className="text-red-500">*</span>
                            </label>
                            <input
                                id="projectName"
                                type="text"
                                placeholder="Enter your project name"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-500 rounded-lg bg-white text-gray-900 placeholder-gray-500 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                disabled={loading}
                            />
                        </div>

                        {/* Description Field */}
                        <div>
                            <label htmlFor="description" className="block text-lg font-semibold text-gray-900 mb-3">
                                Description<span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="description"
                                placeholder="Brief description of the product or collection"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={6}
                                className="w-full px-4 py-3 border border-gray-500 rounded-lg bg-white text-gray-900 placeholder-gray-500 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
                                disabled={loading}
                            />
                        </div>

                        {/* Category Field */}
                        {/* <div>
                            <label className="block text-lg font-semibold text-gray-900 mb-3">
                                Category
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition appearance-none cursor-pointer"
                                disabled={loading}
                            >
                                <option value="">Select Category (Optional)</option>
                                <option value="fashion">Fashion</option>
                                <option value="jewelry">Jewelry</option>
                                <option value="accessories">Accessories</option>
                                <option value="home">Home & Living</option>
                                <option value="beauty">Beauty & Cosmetics</option>
                                <option value="electronics">Electronics</option>
                                <option value="other">Other</option>
                            </select>
                        </div> */}
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-4">
                    <button
                        className="flex items-center gap-2 px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors font-medium"
                        onClick={handleBack}
                        disabled={loading}
                    >
                        <ChevronLeft size={20} />
                        <span>Back</span>
                    </button>

                    <Button
                        onClick={handleCreateProject}
                        disabled={loading || !projectName.trim() || !description.trim()}
                        className="bg-[linear-gradient(135deg,hsl(250,70%,60%),hsl(260,75%,65%))] text-white font-medium px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Creating...
                            </>
                        ) : (
                            'Create Project'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default CreateProjectPage