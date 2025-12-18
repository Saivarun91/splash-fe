"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Zap, Upload, Palette, Sparkles, Loader2, CheckCircle, AlertCircle, RefreshCw, X, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiService } from "@/lib/api"
import Image from "next/image"
import { useAuth } from "@/context/AuthContext"
import toast from "react-hot-toast"

const PlainBackgroundForm = () => {
    const router = useRouter()
    const [formData, setFormData] = useState({
        image: null,
        prompt: "",
        backgroundColor: "#ffffff",
    })
    const [imagePreview, setImagePreview] = useState(null)
    const [isDragging, setIsDragging] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)
    const { token } = useAuth()
    const [regenerateModal, setRegenerateModal] = useState({
        isOpen: false,
        prompt: '',
        loading: false,
        error: null
    })
    // const handleFileChange = (file) => {
    //     if (file) {
    //         setFormData((prev) => ({ ...prev, image: file }))
    //         const reader = new FileReader()
    //         reader.onloadend = () => {
    //             setImagePreview(reader.result)
    //         }
    //         reader.readAsDataURL(file)
    //     }
    // }

    const handleFileChange = (file) => {
        if (file) {
            setFormData((prev) => ({ ...prev, image: file }));

            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };
    const handleDragOver = (e) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files[0]
        if (file && file.type.startsWith("image/")) {
            handleFileChange(file)
        }
    }

    const handleRegenerate = () => {
        setRegenerateModal({
            isOpen: true,
            prompt: '',
            loading: false,
            error: null
        })
    }

    const submitRegenerate = async () => {
        if (!regenerateModal.prompt.trim()) {
            setRegenerateModal(prev => ({
                ...prev,
                error: 'Please enter a prompt for regeneration'
            }))
            return
        }

        setRegenerateModal(prev => ({ ...prev, loading: true, error: null }))

        try {
            // Only use mongo_id - ornament_id is a Django model ID, not a MongoDB ObjectId
            if (!result.mongo_id) {
                throw new Error('Cannot regenerate: MongoDB ID is missing. Please generate a new image first.')
            }

            const response = await apiService.regenerateImage(
                result.mongo_id,
                regenerateModal.prompt,
                token
            )

            if (response.success) {
                setResult({
                    ...result,
                    generated_image_url: response.generated_image_url,
                    mongo_id: response.mongo_id,
                    prompt: response.combined_prompt
                })

                setRegenerateModal({
                    isOpen: false,
                    prompt: '',
                    loading: false,
                    error: null
                })

                toast.success('Image regenerated successfully!')
            } else {
                throw new Error(response.error || 'Regeneration failed')
            }
        } catch (error) {
            console.error("Error regenerating image:", error)
            setRegenerateModal(prev => ({
                ...prev,
                loading: false,
                error: error.response?.data?.error || error.message || 'Failed to regenerate image'
            }))
        }
    }

    const closeRegenerateModal = () => {
        if (!regenerateModal.loading) {
            setRegenerateModal({
                isOpen: false,
                prompt: '',
                loading: false,
                error: null
            })
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setResult(null)

        if (!formData.image) {
            setError("Please upload an image")
            return
        }

        setIsLoading(true)

        try {
            const formDataToSend = new FormData()

            formDataToSend.append("image", formData.image)
            formDataToSend.append("prompt", formData.prompt)
            formDataToSend.append("background_color", formData.backgroundColor)
            console.log("FormData to send:");
            for (let [key, value] of formDataToSend.entries()) {
                console.log(key, value);
            }

            const response = await apiService.uploadOrnamentWithBackground(formDataToSend, token)
            console.log(response.data)

            if (response.success) {
                setResult(response)
            } else {
                setError(response.error || "Failed to generate image")
            }
        } catch (err) {
            console.error("Error generating image:", err)
            setError(err.message || "An error occurred while generating the image")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#fcfcfc] via-[#f8f7ff] to-[#f5f3ff] p-8">
            {/* Background decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-20 w-60 h-60 bg-gradient-to-r from-[#884cff]/10 to-[#5a2fcf]/10 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex items-center gap-4 mb-12">
                    <div className="p-3 bg-gradient-to-r from-[#884cff] to-[#5a2fcf] rounded-2xl shadow-lg">
                        <Palette className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#1a1a1a] to-[#884cff] bg-clip-text text-transparent">
                            Plain Background
                        </h1>
                        <p className="text-[#737373] mt-2">Create stunning product images with custom backgrounds</p>
                    </div>
                </div>

                {/* Form and Result Container */}
                <div className={`grid grid-cols-1 gap-8 transition-all duration-500 ${result ? 'lg:grid-cols-[4fr_6fr]' : 'lg:grid-cols-[7fr_3fr]'}`}>
                    {/* Form */}
                    <div className="space-y-8 bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Product Image Upload */}
                            <div>
                                <label className="block text-lg font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
                                    <Upload size={20} className="text-[#884cff]" />
                                    Product Image<span className="text-red-500 ml-1">*</span>
                                </label>
                                <div
                                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer ${isDragging
                                        ? "border-[#884cff] bg-[#884cff]/5"
                                        : "border-[#e6e6e6] hover:border-[#884cff] hover:bg-[#884cff]/5"
                                        }`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => document.getElementById("file-input").click()}
                                >
                                    <input
                                        id="file-input"
                                        name="image" // <-- add this
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleFileChange(e.target.files[0])}
                                    />

                                    {imagePreview ? (
                                        <div className="relative w-full h-48">
                                            <Image
                                                src={imagePreview}
                                                alt="Preview"
                                                fill
                                                className="object-contain rounded-lg"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="w-12 h-12 text-[#884cff] mx-auto mb-4" />
                                            <p className="text-[#1a1a1a] font-medium mb-2">Drag & drop your product image</p>
                                            <p className="text-[#737373] text-sm">or click to browse files</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Prompt */}
                            <div>
                                <label className="block text-lg font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
                                    <Sparkles size={20} className="text-[#884cff]" />
                                    Description / Prompt <span className="text-gray-400 text-sm font-normal">(Optional)</span>
                                </label>
                                <Input
                                    type="text"
                                    placeholder="E.g., Remove background and place on white"
                                    value={formData.prompt}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, prompt: e.target.value }))}
                                    className="w-full px-4 py-3 border border-[#e6e6e6] rounded-xl bg-white text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#884cff] focus:border-transparent"
                                />
                            </div>

                            {/* Background Color */}
                            <div>
                                <label className="block text-lg font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#884cff] to-[#5a2fcf]"></div>
                                    Background Color
                                </label>
                                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#f8f7ff] to-[#f5f3ff] rounded-2xl border border-[#e6e6e6]">
                                    <div className="relative">
                                        <input
                                            type="color"
                                            value={formData.backgroundColor}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    backgroundColor: e.target.value,
                                                }))
                                            }
                                            className="w-16 h-16 rounded-2xl cursor-pointer border-2 border-white shadow-lg"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <Input
                                            type="text"
                                            value={formData.backgroundColor}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    backgroundColor: e.target.value,
                                                }))
                                            }
                                            className="w-full px-4 py-3 border border-[#e6e6e6] rounded-xl bg-white text-[#1a1a1a] font-mono focus:outline-none focus:ring-2 focus:ring-[#884cff] focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                    <p className="text-red-700 text-sm">{error}</p>
                                </div>
                            )}

                            {/* Buttons */}
                            <div className="flex items-center justify-between pt-8 border-t border-[#e6e6e6]">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="flex items-center gap-3 px-6 py-3 text-[#884cff] font-semibold hover:bg-[#f0e6ff] rounded-xl transition-all duration-300 hover:scale-105"
                                >
                                    <ChevronLeft size={20} />
                                    Back
                                </button>
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#884cff] to-[#5a2fcf] text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-[#884cff]/25 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Zap size={20} />
                                            Generate Image
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* Result Preview */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
                        <h3 className="text-2xl font-bold text-[#1a1a1a] mb-6 flex items-center gap-2">
                            <CheckCircle className="w-6 h-6 text-[#884cff]" />
                            Result Preview
                        </h3>
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-[400px] text-center">
                                <Loader2 className="w-16 h-16 text-[#884cff] animate-spin mb-4" />
                                <p className="text-[#737373] text-lg">Generating your image...</p>
                                <p className="text-[#737373] text-sm mt-2">This may take a few moments</p>
                            </div>
                        ) : result ? (
                            <div className="space-y-6">
                                <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border-2 border-[#884cff]/20">
                                    <Image
                                        src={result.generated_image_url}
                                        alt="Generated"
                                        fill
                                        className="object-contain bg-gray-50"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                                        <p className="text-green-700 font-semibold">✓ Image generated successfully!</p>
                                        {result.mongo_id && (
                                            <p className="text-green-600 text-xs mt-1">Image ID: {result.mongo_id}</p>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <a
                                            href={result.generated_image_url}
                                            download
                                            className="px-4 py-3 bg-gradient-to-r from-[#884cff] to-[#5a2fcf] text-white rounded-xl font-semibold text-center hover:scale-105 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Download size={16} />
                                            Download
                                        </a>
                                        <button
                                            onClick={handleRegenerate}
                                            className="px-4 py-3 border-2 border-[#884cff] text-[#884cff] rounded-xl font-semibold hover:bg-[#f0e6ff] transition-all flex items-center justify-center gap-2"
                                        >
                                            <RefreshCw size={16} />
                                            Regenerate
                                        </button>
                                        <button
                                            onClick={() => {
                                                setResult(null)
                                                setFormData({
                                                    image: null,
                                                    prompt: "",
                                                    backgroundColor: "#ffffff",
                                                })
                                                setImagePreview(null)
                                            }}
                                            className="px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                                        >
                                            New Image
                                        </button>
                                    </div>
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                        <p className="text-blue-700 text-sm flex items-center gap-2">
                                            <Sparkles className="w-4 h-4" />
                                            Click "Regenerate" to modify this image with new instructions!
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[400px] text-center">
                                <div className="w-24 h-24 bg-gradient-to-br from-[#884cff]/10 to-[#5a2fcf]/10 rounded-full flex items-center justify-center mb-4">
                                    <Sparkles className="w-12 h-12 text-[#884cff]" />
                                </div>
                                <p className="text-[#737373] text-lg">Your generated image will appear here</p>
                                <p className="text-[#737373] text-sm mt-2">Upload an image and click generate to start</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Regenerate Modal */}
            {regenerateModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-3xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-r from-[#884cff] to-[#5a2fcf] rounded-xl">
                                        <RefreshCw className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-[#1a1a1a]">Regenerate Image</h2>
                                        <p className="text-sm text-gray-500">Modify and regenerate this image</p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeRegenerateModal}
                                    disabled={regenerateModal.loading}
                                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    <X className="w-6 h-6 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Current Image */}
                            <div>
                                <p className="text-sm font-semibold text-gray-700 mb-3">Current Image:</p>
                                <div className="relative w-full h-64 rounded-xl overflow-hidden border-2 border-gray-200">
                                    <Image
                                        src={result.generated_image_url}
                                        alt="Current image"
                                        fill
                                        className="object-contain bg-gray-50"
                                    />
                                </div>
                            </div>

                            {/* Original Prompt */}
                            {result.prompt && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-blue-900 mb-2">Original Prompt:</p>
                                    <p className="text-sm text-blue-700">{result.prompt}</p>
                                </div>
                            )}

                            {/* New Prompt Input */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-[#884cff]" />
                                    What would you like to change?
                                </label>
                                <textarea
                                    value={regenerateModal.prompt}
                                    onChange={(e) => setRegenerateModal(prev => ({ ...prev, prompt: e.target.value }))}
                                    placeholder="E.g., 'Add more sparkle and brightness', 'Make it more vibrant', 'Add gold accents'..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#884cff] focus:border-transparent resize-none"
                                    rows="4"
                                    disabled={regenerateModal.loading}
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    💡 Your modification will be applied to regenerate the image
                                </p>
                            </div>

                            {/* Error Message */}
                            {regenerateModal.error && (
                                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <p className="text-red-700 text-sm">{regenerateModal.error}</p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4 border-t border-gray-200">
                                <button
                                    onClick={closeRegenerateModal}
                                    disabled={regenerateModal.loading}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitRegenerate}
                                    disabled={regenerateModal.loading || !regenerateModal.prompt.trim()}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[#884cff] to-[#5a2fcf] text-white rounded-xl font-semibold hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                                >
                                    {regenerateModal.loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Regenerating...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-5 h-5" />
                                            Regenerate Image
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Loading Info */}
                            {regenerateModal.loading && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                    <p className="text-yellow-800 text-sm text-center">
                                        ⏱️ This may take 10-30 seconds. Please wait...
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PlainBackgroundForm
