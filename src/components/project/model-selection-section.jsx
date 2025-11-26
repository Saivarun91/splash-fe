"use client"

import { useState, useEffect, useRef } from "react"
import { Users, Sparkles, CheckCircle, Upload, Image as ImageIcon, X, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiService } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
export function ModelSelectionSection({ project, collectionData, onSave, canEdit = true, onModelSelectionChange }) {
    const [activeTab, setActiveTab] = useState("ai") // 'ai' or 'real'
    const { token } = useAuth()
    // AI Models State
    const [aiModels, setAiModels] = useState([])
    const [generatedModels, setGeneratedModels] = useState([])
    const [generating, setGenerating] = useState(false)

    // Real Models State
    const [realModels, setRealModels] = useState([])
    const [uploadingReal, setUploadingReal] = useState(false)

    // Common State
    const [selectedModel, setSelectedModel] = useState(null)
    console.log(`DEBUG: selectedModel: ${selectedModel}`)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)

    // Load existing models from collection data
    useEffect(() => {
        loadAllModels()
    }, [collectionData])
    const handleDeleteModel = async (model, type) => {
        if (!window.confirm("Are you sure you want to delete this model?")) return

        setLoading(true)
        setError(null)
        setSuccess(null)

        try {
            const response = await apiService.removeModel(collectionData.id, type, model, token)
            if (response.success) {
                await loadAllModels()
                setSuccess("Model deleted successfully!")
            } else {
                setError(response.error || "Failed to delete model.")
            }
        } catch (err) {
            console.error("Error deleting model:", err)
            setError(err.message || "Failed to delete model.")
        } finally {
            setLoading(false)
        }
    }

    const loadAllModels = async () => {
        if (!collectionData?.id) return

        try {
            const response = await apiService.getAllModels(collectionData.id, token)

            if (response.success) {
                setAiModels(response.ai_models || [])
                setRealModels(response.real_models || [])

                // Set selected model if exists
                if (response.selected_model) {
                    // 🧠 Only set selectedModel if none currently chosen
                    // prevents overwriting user's immediate selection
                    setSelectedModel(prev => {
                        if (!prev) {
                            // Notify parent about the loaded model
                            if (onModelSelectionChange) {
                                onModelSelectionChange(response.selected_model)
                            }
                            return response.selected_model
                        }
                        return prev
                    })

                    if (response.selected_model.type === 'real') {
                        setActiveTab('real')
                    }
                }

            }
        } catch (err) {
            console.error('Error loading models:', err)
        }
    }

    const handleGenerateAIModels = async () => {
        if (!collectionData?.id) {
            setError('No collection found')
            return
        }

        setGenerating(true)
        setError(null)
        setSuccess(null)

        try {
            const response = await apiService.generateAIImages(collectionData.id,token)

            if (response.images && response.images.length > 0) {
                // Add newly generated models to the list
                setGeneratedModels(response.images)
                setSuccess(`Generated ${response.images.length} new AI models! Select which ones to keep along with your existing models.`)
            } else {
                setError('No images were generated')
            }
        } catch (err) {
            console.error('Error generating models:', err)
            setError(err.message || 'Failed to generate models')
        } finally {
            setGenerating(false)
        }
    }

    const handleSaveAIModels = async (selectedImages) => {
        if (selectedImages.length === 0) {
            setError('Please select at least one model to save')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const response = await apiService.saveGeneratedImages(
                collectionData.id,
                selectedImages,
                token
            )

            if (response.success) {
                // Reload all models to get the updated list
                await loadAllModels()
                setGeneratedModels([])
                setSuccess('AI models saved successfully!')
            }
        } catch (err) {
            console.error('Error saving models:', err)
            setError(err.message || 'Failed to save models')
        } finally {
            setLoading(false)
        }
    }

    const handleUploadRealModels = async (event) => {
        const files = Array.from(event.target.files)

        if (files.length === 0) return

        setUploadingReal(true)
        setError(null)
        setSuccess(null)

        try {
            const response = await apiService.uploadRealModels(collectionData.id, files, token)

            if (response.success) {
                // Reload all models
                await loadAllModels()
                setSuccess(`${response.count} real model(s) uploaded successfully!`)
            } else {
                setError(response.error || 'Failed to upload models')
            }
        } catch (err) {
            console.error('Error uploading real models:', err)
            setError(err.message || 'Failed to upload real models')
        } finally {
            setUploadingReal(false)
            event.target.value = '' // Reset file input
        }
    }

    const handleSelectModel = (model, type) => {
        console.log(`DEBUG: handleSelectModel: ${model}, ${type}`)
        setError(null)
        setSuccess(null)

        // ✅ Only update local state - no API call
        const newSelectedModel = { ...model, type }
        setSelectedModel(newSelectedModel)

        // Notify parent component about the selection change
        if (onModelSelectionChange) {
            onModelSelectionChange(newSelectedModel)
        }
    }

    const isModelSelected = (model, type) => {
        if (!selectedModel) return false
        if (selectedModel.type !== type) return false

        // ✅ Compare by ID if available
        if (selectedModel.id && model.id) {
            return selectedModel.id === model.id
        }

        // ✅ Fallback: compare Cloudinary/local URLs
        const selectedPath = selectedModel.cloud || selectedModel.local
        const modelPath = model.cloud || model.local

        return selectedPath && modelPath && selectedPath === modelPath
    }


    return (
        <div className="mb-12">
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 animate-fade-in">
                    <p className="text-red-600">{error}</p>
                </div>
            )}

            {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 animate-fade-in">
                    <p className="text-green-600">{success}</p>
                </div>
            )}

            {/* Two Card Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Human Model Preview Card (Real Models) */}
                <div
                    className={`relative bg-white rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${activeTab === 'real'
                        ? 'border-[#884cff] shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                >
                    {/* Selected Badge */}
                    {activeTab === 'real' && (
                        <div className="absolute top-4 right-4 bg-[#884cff] text-white text-xs font-semibold px-3 py-1.5 rounded-md z-10 animate-fade-in shadow-sm">
                            Selected
                        </div>
                    )}

                    {/* Card Header - Clickable to switch tab */}
                    <div
                        onClick={() => setActiveTab('real')}
                        className="p-6 border-b border-gray-100 cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${activeTab === 'real' ? 'bg-[#884cff]' : 'bg-gray-100'
                                }`}>
                                <Users className={`w-5 h-5 transition-colors ${activeTab === 'real' ? 'text-white' : 'text-gray-600'
                                    }`} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900">Human Model Preview</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Upload real model photos for automatic crop, pose detection, and professional guidelines.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6" onClick={(e) => e.stopPropagation()}>
                        <RealModelsTab
                            realModels={realModels}
                            uploading={uploadingReal}
                            loading={loading}
                            selectedModel={selectedModel}
                            onUpload={handleUploadRealModels}
                            onSelect={(model) => handleSelectModel(model, 'real')}
                            isModelSelected={(model) => isModelSelected(model, 'real')}
                            canEdit={canEdit}
                            onDelete={handleDeleteModel}
                        />
                    </div>
                </div>

                {/* AI Model Preview Card */}
                <div
                    className={`relative bg-white rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${activeTab === 'ai'
                        ? 'border-amber-400 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                >
                    {/* Selected Badge */}
                    {activeTab === 'ai' && (
                        <div className="absolute top-4 right-4 bg-amber-400 text-white text-xs font-semibold px-3 py-1.5 rounded-md z-10 animate-fade-in shadow-sm">
                            Selected
                        </div>
                    )}

                    {/* Card Header - Clickable to switch tab */}
                    <div
                        onClick={() => setActiveTab('ai')}
                        className="p-6 border-b border-gray-100 cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${activeTab === 'ai' ? 'bg-amber-400' : 'bg-gray-100'
                                }`}>
                                <Sparkles className={`w-5 h-5 transition-colors ${activeTab === 'ai' ? 'text-white' : 'text-gray-600'
                                    }`} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900">AI Model Preview</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    AI automatically generates diverse models based on your project tone, style, and target audience.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6" onClick={(e) => e.stopPropagation()}>
                        <AIModelsTab
                            aiModels={aiModels}
                            generatedModels={generatedModels}
                            generating={generating}
                            loading={loading}
                            selectedModel={selectedModel}
                            onGenerate={handleGenerateAIModels}
                            onSave={handleSaveAIModels}
                            onSelect={(model) => handleSelectModel(model, 'ai')}
                            isModelSelected={(model) => isModelSelected(model, 'ai')}
                            canEdit={canEdit}
                            onDelete={handleDeleteModel}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

// AI Models Tab Component
function AIModelsTab({
    aiModels,
    generatedModels,
    generating,
    loading,
    selectedModel,
    onGenerate,
    onSave,
    onSelect,
    isModelSelected,
    canEdit = true,
    onDelete,
}) {
    const [tempSelectedModels, setTempSelectedModels] = useState([])

    // When new models are generated or saved models change, pre-select all saved models
    useEffect(() => {
        if (generatedModels.length > 0) {
            // Pre-select all existing saved models
            const savedUrls = aiModels.map(model => model.cloud || model.local)
            setTempSelectedModels(savedUrls)
        }
    }, [generatedModels.length, aiModels])

    const toggleTempSelection = (imageUrl) => {
        setTempSelectedModels(prev =>
            prev.includes(imageUrl)
                ? prev.filter(url => url !== imageUrl)
                : [...prev, imageUrl]
        )
    }

    const handleSaveClick = () => {
        onSave(tempSelectedModels)
        setTempSelectedModels([])
    }

    const allGeneratedUrls = generatedModels
    const hasSavedModels = aiModels.length > 0
    const hasGeneratedModels = generatedModels.length > 0

    return (
        <div className="space-y-6">
            {/* Generate Button */}
            <div>
                <Button
                    onClick={onGenerate}
                    disabled={generating || !canEdit}
                    className="w-full bg-amber-400 hover:bg-amber-500 text-white gap-2 transition-all duration-200 disabled:opacity-50"
                    title={canEdit ? "" : "You need Editor or Owner role to generate models"}
                >
                    <Sparkles className="w-4 h-4" />
                    {generating ? 'Generating...' : 'Generate AI Models'}
                </Button>
            </div>

            {generating && (
                <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-400 mx-auto mb-3"></div>
                        <p className="text-sm text-gray-600">Generating AI models... This may take a minute</p>
                    </div>
                </div>
            )}

            {/* Show all models (existing + newly generated) with save option when new models are generated */}
            {hasGeneratedModels && !generating && (
                <div className="space-y-4 animate-fade-in">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-amber-800 text-xs">
                            💡 <strong>Select which models to keep:</strong> Your existing saved models are pre-selected.
                            Click to add new models or deselect existing ones.
                        </p>
                    </div>

                    {/* Existing Saved Models */}
                    {hasSavedModels && (
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-gray-700">
                                Your Existing Models
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {aiModels.map((model, index) => {
                                    const imageUrl = model.cloud || model.local
                                    const isSelected = tempSelectedModels.includes(imageUrl)

                                    return (
                                        <div
                                            key={`existing-${index}`}
                                            onClick={() => canEdit && toggleTempSelection(imageUrl)}
                                            className={`group relative border-2 rounded-lg overflow-hidden transition-all cursor-pointer ${isSelected
                                                ? 'border-amber-400 shadow-lg'
                                                : 'border-gray-200 hover:border-amber-400/50'
                                                }`}
                                        >
                                            {/* Image */}
                                            <img
                                                src={imageUrl}
                                                alt={`Existing Model ${index + 1}`}
                                                className="w-full h-40 object-cover group-hover:scale-[1.03] transition-transform duration-300"
                                            />

                                            {/* Selected checkmark */}
                                            {isSelected && (
                                                <div className="absolute top-2 right-2 bg-amber-400 rounded-full p-1 shadow-md z-10">
                                                    <CheckCircle className="w-4 h-4 text-white" />
                                                </div>
                                            )}

                                            {/* 🗑 Delete button (hover only) */}
                                            {canEdit && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onDelete(model, "ai")
                                                    }}
                                                    className="
                        absolute top-2 left-2
                        bg-gradient-to-r from-red-500 to-red-700
                        text-white rounded-full p-1.5
                        opacity-0 group-hover:opacity-100
                        transition-all duration-300 ease-in-out
                        hover:scale-110 shadow-lg
                        z-10
                    "
                                                    title='Remove model'
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}

                                            {/* Hover overlay with View and Select buttons */}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        window.open(imageUrl, '_blank')
                                                    }}
                                                    className="bg-white hover:bg-gray-100 text-amber-500 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all hover:scale-105"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    View
                                                </button>
                                                {canEdit && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            toggleTempSelection(imageUrl)
                                                        }}
                                                        className="bg-amber-400 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all hover:scale-105"
                                                    >
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                        {isSelected ? 'Deselect' : 'Select'}
                                                    </button>
                                                )}
                                            </div>

                                            {/* "Existing" badge (moved down slightly to avoid overlap) */}
                                            <div className="absolute bottom-2 left-2 bg-green-600/90 text-white text-xs px-2 py-1 rounded shadow z-10">
                                                Existing
                                            </div>
                                        </div>
                                    )
                                })}


                            </div>
                        </div>
                    )}

                    {/* Newly Generated Models */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-700">
                            Newly Generated Models
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {allGeneratedUrls.map((imageUrl, index) => {
                                const isSelected = tempSelectedModels.includes(imageUrl)
                                return (
                                    <div
                                        key={`new-${index}`}
                                        onClick={() => canEdit && toggleTempSelection(imageUrl)}
                                        className={`group relative border-2 rounded-lg overflow-hidden transition-all cursor-pointer ${isSelected
                                            ? 'border-amber-400 shadow-lg'
                                            : 'border-gray-200 hover:border-amber-400/50'
                                            }`}
                                    >
                                        <img
                                            src={imageUrl}
                                            alt={`New Model ${index + 1}`}
                                            className="w-full h-40 object-cover"
                                        />
                                        {isSelected && (
                                            <div className="absolute top-2 right-2 bg-amber-400 rounded-full p-1 z-10 shadow-md">
                                                <CheckCircle className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                        <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded z-10">
                                            New
                                        </div>
                                        {/* Hover overlay with View and Select buttons */}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    window.open(imageUrl, '_blank')
                                                }}
                                                className="bg-white hover:bg-gray-100 text-amber-500 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all hover:scale-105"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                View
                                            </button>
                                            {canEdit && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        toggleTempSelection(imageUrl)
                                                    }}
                                                    className="bg-amber-400 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all hover:scale-105"
                                                >
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    {isSelected ? 'Deselect' : 'Select'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <Button
                        onClick={handleSaveClick}
                        disabled={loading || tempSelectedModels.length === 0 || !canEdit}
                        className="w-full bg-amber-400 hover:bg-amber-500 text-white transition-all duration-200 disabled:opacity-50"
                        title={canEdit ? "" : "You need Editor or Owner role to save models"}
                    >
                        {loading ? 'Saving...' : `Save Selected Models (${tempSelectedModels.length} total)`}
                    </Button>
                </div>
            )}

            {/* Show saved AI models */}
            {hasSavedModels && !hasGeneratedModels && (
                <div className="space-y-4 animate-fade-in">
                    <h4 className="text-sm font-semibold text-gray-700">Your AI Models</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {aiModels.map((model, index) => {
                            const imageUrl = model.cloud || model.local
                            const selected = isModelSelected(model)
                            console.log("selected ai model : ", selected)

                            return (
                                <div
                                    key={index}
                                    onClick={() => canEdit && onSelect(model)}
                                    className={`group relative border-2 rounded-lg overflow-hidden transition-all cursor-pointer ${selected
                                        ? 'border-amber-400 shadow-lg ring-2 ring-amber-400 ring-offset-1'
                                        : 'border-gray-200 hover:border-amber-400/50'
                                        }`}
                                >
                                    <img
                                        src={imageUrl}
                                        alt={`AI Model ${index + 1}`}
                                        className="w-full h-40 object-cover"
                                    />
                                    {selected && (
                                        <div className="absolute top-2 right-2 bg-amber-400 rounded-full p-1 shadow-md z-10">
                                            <CheckCircle className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                    {/* Hover overlay with View and Select buttons */}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                window.open(imageUrl, '_blank')
                                            }}
                                            className="bg-white hover:bg-gray-100 text-amber-500 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all hover:scale-105"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            View
                                        </button>
                                        {canEdit && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onSelect(model)
                                                }}
                                                className="bg-amber-400 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all hover:scale-105"
                                            >
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                Select
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {!generating && !hasSavedModels && !hasGeneratedModels && (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                    <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 mb-2">No AI models generated yet</p>
                    <p className="text-xs text-gray-400">
                        Click "Generate AI Models" to create model images
                    </p>
                </div>
            )}
        </div>
    )
}

// Real Models Tab Component
function RealModelsTab({
    realModels,
    uploading,
    loading,
    selectedModel,
    onUpload,
    onSelect,
    isModelSelected,
    canEdit = true,
    onDelete,
}) {
    const hasModels = realModels.length > 0
    const fileInputRef = useRef(null)

    const handleButtonClick = () => {
        if (!uploading && canEdit && fileInputRef.current) {
            fileInputRef.current.click()
        }
    }

    return (
        <div className="space-y-6">
            {/* Upload Model Photo Section */}
            <div className="space-y-4">
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Upload Model Photo</h4>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={onUpload}
                        disabled={uploading || !canEdit}
                        className="hidden"
                        style={{ display: 'none' }}
                    />
                    <button
                        onClick={handleButtonClick}
                        disabled={uploading || !canEdit}
                        className="w-full bg-gray-100 hover:bg-gray-200 border-2 border-dashed border-gray-300 rounded-lg px-6 py-4 flex flex-col items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={canEdit ? "" : "You need Editor or Owner role to upload models"}
                    >
                        <Upload className="w-5 h-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">
                            {uploading ? 'Uploading...' : 'Upload Model Photo'}
                        </span>
                        <span className="text-xs text-gray-500">
                            JPG, PNG, or HEIC
                        </span>
                        <span className="text-xs text-gray-500">
                            Max 10MB
                        </span>
                    </button>
                </div>

                {/* Upload Guidelines */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Upload Guidelines</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-start gap-2">
                            <span className="text-[#884cff] mt-0.5">•</span>
                            <span>High-resolution images (minimum 1200px width)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-[#884cff] mt-0.5">•</span>
                            <span>Well-lit with clear facial features</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-[#884cff] mt-0.5">•</span>
                            <span>Full body or upper body shots preferred</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-[#884cff] mt-0.5">•</span>
                            <span>Neutral background for best results</span>
                        </li>
                    </ul>
                </div>
            </div>

            {uploading && (
                <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#884cff] mx-auto mb-3"></div>
                        <p className="text-sm text-gray-600">Uploading models...</p>
                    </div>
                </div>
            )}

            {hasModels && !uploading && (
                <div className="space-y-4 animate-fade-in">
                    <h4 className="text-sm font-semibold text-gray-700">Your Uploaded Models</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {realModels.map((model, index) => {
                            const imageUrl = model.cloud || model.local
                            const selected = isModelSelected(model)

                            return (
                                <div
                                    key={index}
                                    className={`group relative border-2 rounded-lg overflow-hidden transition-all cursor-pointer ${selected
                                        ? 'border-[#884cff] shadow-lg ring-2 ring-[#884cff] ring-offset-1'
                                        : 'border-gray-200 hover:border-[#884cff]/50'
                                        }`}
                                    onClick={() => canEdit && onSelect(model)}
                                >
                                    {/* Model image */}
                                    <img
                                        src={imageUrl}
                                        alt={`Real Model ${index + 1}`}
                                        className="w-full h-40 object-cover group-hover:scale-[1.03] transition-transform duration-300"
                                    />

                                    {/* Selected checkmark */}
                                    {selected && (
                                        <div className="absolute top-2 right-2 bg-[#884cff] rounded-full p-1 z-10 shadow-md">
                                            <CheckCircle className="w-4 h-4 text-white" />
                                        </div>
                                    )}

                                    {/* Delete button (hover only) */}
                                    {canEdit && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onDelete(model, "real")
                                            }}
                                            className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md hover:shadow-lg transform hover:scale-110 z-10"
                                            title="Remove model"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}

                                    {/* Hover overlay with View button */}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                window.open(imageUrl, '_blank')
                                            }}
                                            className="bg-white hover:bg-gray-100 text-[#884cff] px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all hover:scale-105"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            View
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {!uploading && !hasModels && (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No models uploaded yet</p>
                </div>
            )}
        </div>
    )
}
