
"use client"

import { useState } from "react"
import { Download, ExternalLink, RefreshCw, X, Sparkles, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiService } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

export function ProductImagesDisplay({
    collectionData,
    showRegenerate = false,
    onRegenerateSuccess,
    canEdit = true
}) {
    const [regenerating, setRegenerating] = useState(null)
    const [showPromptModal, setShowPromptModal] = useState(null)
    const [customPrompt, setCustomPrompt] = useState("")
    const [error, setError] = useState(null)
    const [currentVersionMap, setCurrentVersionMap] = useState({})
    const [zoomedImage, setZoomedImage] = useState(null)
    const [useDifferentModel, setUseDifferentModel] = useState(false)
    const [selectedModel, setSelectedModel] = useState(null)
    const [availableModels, setAvailableModels] = useState({ ai_models: [], real_models: [] })
    const { token } = useAuth()
    if (!collectionData?.items?.[0]?.product_images) {
        return (
            <div className="mb-12">
                <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 mb-2 font-medium">No product images found</p>
                    <p className="text-sm text-gray-500">
                        Upload product images in Step 3 to get started
                    </p>
                </div>
            </div>
        )
    }

    const products = collectionData.items[0].product_images

    const handleRegenerate = async (product, generatedImage) => {
        // Validation: If using different model, just need model selection. Otherwise need prompt.
        if (useDifferentModel && !selectedModel) {
            setError("Please select a model for regeneration")
            return
        }

        if (!useDifferentModel && !customPrompt.trim()) {
            setError("Please enter a prompt for regeneration")
            return
        }

        const regKey = `${product.uploaded_image_path}_${generatedImage.local_path}`
        setRegenerating(regKey)
        setError(null)

        try {
            const response = await apiService.regenerateProductModelImage(
                collectionData.id,
                product.uploaded_image_path,
                generatedImage.local_path,
                customPrompt,
                useDifferentModel,
                selectedModel,
                token
            )

            if (response.success) {
                setShowPromptModal(null)
                setCustomPrompt("")
                setUseDifferentModel(false)
                setSelectedModel(null)
                if (onRegenerateSuccess) {
                    onRegenerateSuccess()
                }
            } else {
                setError(response.error || "Failed to regenerate image")
            }
        } catch (err) {
            console.error('Error regenerating image:', err)
            setError(err.message || "Failed to regenerate image")
        } finally {
            setRegenerating(null)
        }
    }

    const openPromptModal = async (product, generatedImage, isRegenerated = false) => {
        setShowPromptModal({ product, generatedImage, isRegenerated })
        // Show empty textarea - the backend will combine with original prompt
        setCustomPrompt("")
        setUseDifferentModel(false)
        setSelectedModel(null)
        setError(null)

        // Load available models
        try {
            const modelsData = await apiService.getAllModels(collectionData.id, token)
            if (modelsData.success) {
                setAvailableModels({
                    ai_models: modelsData.ai_models || [],
                    real_models: modelsData.real_models || []
                })
            }
        } catch (err) {
            console.error('Error loading models:', err)
        }
    }

    const handleEnhance = async (product, generatedImage) => {
        console.log("Enhancing image:", generatedImage.cloud_url)
        setError(null)

        try {
            const response = await apiService.enhanceImage(
                generatedImage.cloud_url,
                collectionData.id,
                product.uploaded_image_path,
                generatedImage.local_path,
                token
            )

            if (response.success) {
                // Refresh the collection data to show the enhanced image
                if (onRegenerateSuccess) {
                    onRegenerateSuccess()
                }
            } else {
                setError(response.error || "Failed to enhance image")
            }
        } catch (err) {
            console.error('Error enhancing image:', err)
            setError(err.message || "Failed to enhance image")
        }
    }

    const downloadImageAsBlob = async (imageUrl, filename) => {
        try {
            // Fetch the image as a blob
            const response = await fetch(imageUrl, {
                mode: 'cors',
                cache: 'no-cache'
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.statusText}`);
            }

            const blob = await response.blob();

            // Create a blob URL
            const blobUrl = window.URL.createObjectURL(blob);

            // Create a temporary link element
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = filename;
            link.style.display = 'none';

            // Append to body, click, and remove
            document.body.appendChild(link);
            link.click();

            // Small delay before cleanup to ensure download starts
            setTimeout(() => {
                link.remove();
                window.URL.revokeObjectURL(blobUrl);
            }, 100);
        } catch (error) {
            console.error('Error downloading image:', error);
            // Fallback: try direct download
            try {
                const link = document.createElement("a");
                link.href = imageUrl;
                link.download = filename;
                link.target = '_blank';
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                setTimeout(() => link.remove(), 100);
            } catch (fallbackError) {
                console.error('Fallback download also failed:', fallbackError);
                // Last resort: open in new tab
                window.open(imageUrl, '_blank');
            }
        }
    };

    const handleDownloadImage = async (imageUrl, imageType, productIndex, imageIndex, versionType = '', versionIndex = null) => {
        // Generate filename
        const imageTypeLabel = imageType?.replace(/_/g, '-') || 'generated';
        let filename = `product-${productIndex}-${imageTypeLabel}-${imageIndex}`;
        
        if (versionType === 'regenerated' && versionIndex !== null) {
            filename += `-regenerated-v${versionIndex + 1}`;
        } else if (versionType === 'enhanced' && versionIndex !== null) {
            filename += `-enhanced-v${versionIndex + 1}`;
        }
        
        filename += '.png';
        
        await downloadImageAsBlob(imageUrl, filename);
    }

    return (
        <div className="mb-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        Generated Product Images
                    </h3>
                    <p className="text-gray-600">
                        {products.length} product{products.length !== 1 ? 's' : ''} • Preview and manage your AI-generated images
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700">AI Generated</span>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                                <X className="w-3 h-3 text-red-600" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-red-700 font-medium">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Products Grid */}
            <div className="space-y-8">
                {products.map((product, productIndex) => {
                    const hasGeneratedImages = product.generated_images && product.generated_images.length > 0

                    return (
                        <div key={productIndex} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                            {/* Product Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                                        <span className="text-white font-semibold text-sm">
                                            {productIndex + 1}
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-900">
                                            Product {productIndex + 1}
                                        </h4>
                                        <p className="text-sm text-gray-500">
                                            {hasGeneratedImages
                                                ? `${product.generated_images.length} generated image${product.generated_images.length !== 1 ? 's' : ''}`
                                                : 'No images generated yet'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Image Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                                {/* Original Product Image */}
                                <div className="md:col-span-1">
                                    <div className="space-y-3">
                                        <div className="relative group">
                                            <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 border-2 border-purple-500 shadow-sm">
                                                <img
                                                    src={product.uploaded_image_url}
                                                    alt={`Product ${productIndex + 1}`}
                                                    className="w-full h-full object-cover cursor-zoom-in transition-transform hover:scale-105"
                                                    onClick={() => setZoomedImage(product.uploaded_image_url)}
                                                />
                                            </div>
                                            <div className="absolute top-3 left-3 bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                                                Original
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-600 text-center font-medium">
                                            Source Image
                                        </p>
                                    </div>
                                </div>

                                {/* Generated Images */}
                                {hasGeneratedImages ? (
                                    <div className="md:col-span-5">
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                            {product.generated_images.map((img, imgIndex) => {
                                                const regKey = `${product.uploaded_image_path}_${img.local_path}`
                                                const totalVersions = 1 + (img.regenerated_images?.length || 0) + (img.enhanced_images?.length || 0)
                                                const currentIndex = currentVersionMap[regKey] || 0

                                                // Determine which image to show based on current index
                                                let imageToShow = img
                                                let versionType = 'original'

                                                if (currentIndex > 0) {
                                                    const regeneratedCount = img.regenerated_images?.length || 0
                                                    if (currentIndex <= regeneratedCount) {
                                                        // Show regenerated image
                                                        imageToShow = img.regenerated_images[currentIndex - 1]
                                                        versionType = 'regenerated'
                                                    } else {
                                                        // Show enhanced image
                                                        const enhancedIndex = currentIndex - regeneratedCount - 1
                                                        imageToShow = img.enhanced_images[enhancedIndex]
                                                        versionType = 'enhanced'
                                                    }
                                                }

                                                const isRegenerating = regenerating === regKey

                                                return (
                                                    <div key={imgIndex} className="group">
                                                        <div className="space-y-3">
                                                            <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm hover:shadow-md transition-all">
                                                                <img
                                                                    src={imageToShow.cloud_url}
                                                                    alt={`${imageToShow.type} ${imgIndex + 1}`}
                                                                    className="w-full h-full object-cover cursor-zoom-in transition-transform hover:scale-105"
                                                                    onClick={() => setZoomedImage(imageToShow.cloud_url)}
                                                                />

                                                                {/* Hover Overlay */}
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                                                                    {/* Top Badge */}
                                                                    <div className="flex justify-between items-start">
                                                                        <div className="bg-black/70 text-white text-xs px-2 py-1 rounded-full capitalize">
                                                                            {currentIndex === 0
                                                                                ? img.type?.replace("_", " ") || "Generated"
                                                                                : versionType === 'enhanced'
                                                                                    ? 'Enhanced'
                                                                                    : `v${currentIndex + 1}`
                                                                            }
                                                                        </div>
                                                                        {totalVersions > 1 && (
                                                                            <div className="flex gap-1 justify-center">
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation()
                                                                                        setCurrentVersionMap((prev) => ({
                                                                                            ...prev,
                                                                                            [regKey]: Math.max(0, currentIndex - 1),
                                                                                        }))
                                                                                    }}
                                                                                    disabled={currentIndex === 0}
                                                                                    className="flex-1 bg-white/90 text-gray-700 text-xs p-1 rounded hover:bg-white transition-all disabled:opacity-40 font-medium"
                                                                                >
                                                                                    ←
                                                                                </button>
                                                                                {totalVersions > 1 && (
                                                                                    <div className="bg-white/20 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                                                                                        {currentIndex + 1}/{totalVersions}
                                                                                    </div>
                                                                                )}
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation()
                                                                                        setCurrentVersionMap((prev) => ({
                                                                                            ...prev,
                                                                                            [regKey]: Math.min(totalVersions - 1, currentIndex + 1),
                                                                                        }))
                                                                                    }}
                                                                                    disabled={currentIndex === totalVersions - 1}
                                                                                    className="flex-1 bg-white/90 text-gray-700 text-xs p-1 rounded hover:bg-white transition-all disabled:opacity-40 font-medium"
                                                                                >
                                                                                    →
                                                                                </button>
                                                                            </div>
                                                                        )}

                                                                    </div>

                                                                    {/* Bottom Actions */}
                                                                    <div className="flex flex-col gap-2">
                                                                        <div className="flex gap-2 justify-center">
                                                                            <Button
                                                                                size="sm"
                                                                                variant="secondary"
                                                                                className="gap-1 text-xs px-2 py-1 h-auto bg-white/90 backdrop-blur-sm hover:bg-white"
                                                                                onClick={() => window.open(imageToShow.cloud_url, "_blank")}
                                                                            >
                                                                                <ExternalLink className="w-3 h-3" /> View
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="secondary"
                                                                                className="gap-1 text-xs px-2 py-1 h-auto bg-white/90 backdrop-blur-sm hover:bg-white"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    // Calculate version index based on current view
                                                                                    let versionIndex = null;
                                                                                    if (currentIndex > 0) {
                                                                                        const regeneratedCount = img.regenerated_images?.length || 0;
                                                                                        if (currentIndex <= regeneratedCount) {
                                                                                            // Regenerated image
                                                                                            versionIndex = currentIndex - 1;
                                                                                        } else {
                                                                                            // Enhanced image
                                                                                            versionIndex = currentIndex - regeneratedCount - 1;
                                                                                        }
                                                                                    }
                                                                                    handleDownloadImage(
                                                                                        imageToShow.cloud_url,
                                                                                        img.type || imageToShow.type,
                                                                                        productIndex + 1,
                                                                                        imgIndex + 1,
                                                                                        versionType,
                                                                                        versionIndex
                                                                                    );
                                                                                }}
                                                                            >
                                                                                <Download className="w-3 h-3" /> Save
                                                                            </Button>
                                                                        </div>

                                                                        {showRegenerate && canEdit && (
                                                                            <div className="flex gap-2 justify-center">
                                                                                <Button
                                                                                    size="sm"
                                                                                    className="bg-purple-600 hover:bg-purple-700 text-white gap-1 text-xs px-2 py-1 h-auto"
                                                                                    onClick={() => handleEnhance(product, imageToShow)}
                                                                                    disabled={isRegenerating}
                                                                                >
                                                                                    {/* <RefreshCw className={`w-3 h-3 ${isRegenerating ? "animate-spin" : ""}`} /> */}
                                                                                    {isRegenerating ? 'Processing...' : 'Enhance'}
                                                                                </Button>
                                                                                <Button
                                                                                    size="sm"
                                                                                    className="bg-purple-600 hover:bg-purple-700 text-white gap-1 text-xs px-2 py-1 h-auto"
                                                                                    onClick={() => openPromptModal(product, imageToShow, currentIndex > 0)}
                                                                                    disabled={isRegenerating}
                                                                                >
                                                                                    {/* <RefreshCw className={`w-3 h-3 ${isRegenerating ? "animate-spin" : ""}`} /> */}
                                                                                    {isRegenerating ? 'Processing...' : 'regenerate'}
                                                                                </Button>

                                                                            </div>
                                                                        )}

                                                                        {/* Version Navigation */}

                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Image Label */}
                                                            <div className="text-center">
                                                                <p className={`text-xs font-medium ${currentIndex === 0
                                                                    ? "text-gray-600"
                                                                    : versionType === 'enhanced'
                                                                        ? "text-blue-600"
                                                                        : "text-green-600"
                                                                    }`}>
                                                                    {currentIndex === 0
                                                                        ? img.type?.replace("_", " ") || "Generated"
                                                                        : versionType === 'enhanced'
                                                                            ? 'Enhanced'
                                                                            : `Regenerated v${currentIndex}`
                                                                    }
                                                                </p>
                                                                {currentIndex > 0 && (
                                                                    <p className={`text-xs ${versionType === 'enhanced' ? 'text-blue-500' : 'text-green-500'}`}>
                                                                        ✓ {versionType === 'enhanced' ? 'Enhanced' : 'Improved'}
                                                                    </p>
                                                                )}

                                                                {/* Model Usage Information */}
                                                                {(() => {
                                                                    // Use Sets to track unique models by their URL/path
                                                                    const uniqueAIModels = new Set();
                                                                    const uniqueRealModels = new Set();

                                                                    // Add original model
                                                                    if (img.model_used?.type) {
                                                                        const modelIdentifier = img.model_used.cloud || img.model_used.local;
                                                                        if (modelIdentifier) {
                                                                            if (img.model_used.type === 'ai') {
                                                                                uniqueAIModels.add(modelIdentifier);
                                                                            } else if (img.model_used.type === 'real') {
                                                                                uniqueRealModels.add(modelIdentifier);
                                                                            }
                                                                        }
                                                                    }

                                                                    // Add regenerated models
                                                                    img.regenerated_images?.forEach(regen => {
                                                                        if (regen.model_used?.type) {
                                                                            const modelIdentifier = regen.model_used.cloud || regen.model_used.local;
                                                                            if (modelIdentifier) {
                                                                                if (regen.model_used.type === 'ai') {
                                                                                    uniqueAIModels.add(modelIdentifier);
                                                                                } else if (regen.model_used.type === 'real') {
                                                                                    uniqueRealModels.add(modelIdentifier);
                                                                                }
                                                                            }
                                                                        }
                                                                    });

                                                                    // Add enhanced models
                                                                    img.enhanced_images?.forEach(enhanced => {
                                                                        if (enhanced.model_used?.type) {
                                                                            const modelIdentifier = enhanced.model_used.cloud || enhanced.model_used.local;
                                                                            if (modelIdentifier) {
                                                                                if (enhanced.model_used.type === 'ai') {
                                                                                    uniqueAIModels.add(modelIdentifier);
                                                                                } else if (enhanced.model_used.type === 'real') {
                                                                                    uniqueRealModels.add(modelIdentifier);
                                                                                }
                                                                            }
                                                                        }
                                                                    });

                                                                    const aiCount = uniqueAIModels.size;
                                                                    const realCount = uniqueRealModels.size;
                                                                    const totalUniqueModels = aiCount + realCount;

                                                                    if (totalUniqueModels > 0) {
                                                                        return (
                                                                            <div className="mt-1 flex items-center justify-center gap-1 flex-wrap">
                                                                                <span className="text-xs text-gray-500">
                                                                                    {totalUniqueModels} {totalUniqueModels === 1 ? 'model' : 'models'}:
                                                                                </span>
                                                                                {aiCount > 0 && (
                                                                                    <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-600 font-medium">
                                                                                        {aiCount} AI
                                                                                    </span>
                                                                                )}
                                                                                {realCount > 0 && (
                                                                                    <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-600 font-medium">
                                                                                        {realCount} Real
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    }
                                                                    return null;
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="md:col-span-5 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-12 bg-gray-50/50">
                                        <div className="text-center">
                                            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                            <p className="text-gray-600 font-medium mb-1">No generated images yet</p>
                                            <p className="text-sm text-gray-500">
                                                Generate images to see them appear here
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Image Zoom Modal */}
            {zoomedImage && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
                    <div className="relative max-w-7xl max-h-[90vh]">
                        <img
                            src={zoomedImage}
                            alt="Zoomed preview"
                            className="max-w-full max-h-[90vh] object-contain rounded-lg"
                        />
                        <button
                            onClick={() => setZoomedImage(null)}
                            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}

            {/* Regenerate Prompt Modal */}
            {showPromptModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    Enhance Image
                                </h3>
                                <p className="text-gray-600 text-sm mt-1">
                                    Use AI to improve your generated image
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowPromptModal(null)
                                    setCustomPrompt("")
                                    setError(null)
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-blue-800 font-medium text-sm">
                                        How enhancement works
                                    </p>
                                    <p className="text-blue-700 text-sm mt-1">
                                        The AI will use your original product image, the original style prompt, and your new modifications
                                        to create an improved version. Just describe what you want to change!
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Original Prompt Display */}
                        {showPromptModal.generatedImage.prompt && (
                            <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
                                <p className="text-sm font-semibold text-purple-900 mb-2">📝 Original Style Prompt:</p>
                                <p className="text-sm text-purple-700 italic">{showPromptModal.generatedImage.prompt}</p>
                                <p className="text-xs text-purple-600 mt-2">
                                    ℹ️ This will be automatically considered along with your new modifications
                                </p>
                            </div>
                        )}

                        {/* Image Preview Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            {/* Original Product */}
                            <div className="text-center">
                                <label className="block text-sm font-semibold text-gray-900 mb-3">
                                    Original Product
                                </label>
                                <div className="border-2 border-purple-500 rounded-xl overflow-hidden shadow-sm">
                                    <img
                                        src={showPromptModal.product.uploaded_image_url}
                                        alt="Original Product"
                                        className="w-full h-48 object-cover"
                                    />
                                </div>
                                <p className="text-xs text-gray-600 mt-2 font-medium">
                                    📦 Source Image
                                </p>
                            </div>

                            {/* Current Generated */}
                            <div className="text-center">
                                <label className="block text-sm font-semibold text-gray-900 mb-3">
                                    Current Version
                                </label>
                                <div className="border-2 border-green-500 rounded-xl overflow-hidden shadow-sm">
                                    <img
                                        src={showPromptModal.generatedImage.cloud_url}
                                        alt="Current Generated"
                                        className="w-full h-48 object-cover"
                                    />
                                </div>
                                <p className="text-xs text-gray-600 mt-2 font-medium capitalize">
                                    🎨 {showPromptModal.generatedImage.type?.replace('_', ' ')}
                                </p>
                            </div>

                            {/* Result Indicator */}
                            <div className="flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mb-3 shadow-lg">
                                        <RefreshCw className="w-8 h-8 text-white" />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-900">
                                        New Enhanced Version
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Based on your instructions
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Current Model Information */}
                        {showPromptModal.generatedImage.model_used && (
                            <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                                <p className="text-sm font-semibold text-blue-900 mb-2">📊 Current Model Information</p>
                                <div className="flex items-center gap-4 text-sm">
                                    <div>
                                        <span className="text-blue-700">Type:</span>{' '}
                                        <span className={`font-medium px-2 py-1 rounded ${showPromptModal.generatedImage.model_used.type === 'ai' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                                            {showPromptModal.generatedImage.model_used.type === 'ai' ? 'AI Model' : 'Real Model'}
                                        </span>
                                    </div>
                                    {showPromptModal.generatedImage.model_used.name && (
                                        <div>
                                            <span className="text-blue-700">Name:</span>{' '}
                                            <span className="font-medium text-blue-900">{showPromptModal.generatedImage.model_used.name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Model Selection Option */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="flex items-center gap-3 mb-3">
                                <input
                                    type="checkbox"
                                    id="useDifferentModel"
                                    checked={useDifferentModel}
                                    onChange={(e) => {
                                        setUseDifferentModel(e.target.checked)
                                        if (!e.target.checked) setSelectedModel(null)
                                    }}
                                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                />
                                <label htmlFor="useDifferentModel" className="text-sm font-semibold text-gray-900 cursor-pointer">
                                    🔄 Try with a different model
                                </label>
                            </div>
                            {useDifferentModel && (
                                <p className="text-xs text-orange-600 mb-3 bg-orange-50 p-2 rounded">
                                    ℹ️ The prompt will be disabled and use the original generated prompt when using a different model
                                </p>
                            )}

                            {useDifferentModel && (
                                <div className="mt-3 space-y-3">
                                    <p className="text-xs text-gray-600 mb-2">
                                        Select a different model to regenerate this image:
                                    </p>

                                    {/* AI Models */}
                                    {availableModels.ai_models.length > 0 && (
                                        <div>
                                            <p className="text-xs font-medium text-gray-700 mb-2">AI Models</p>
                                            <div className="grid grid-cols-4 gap-2">
                                                {availableModels.ai_models.map((model, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setSelectedModel({ type: 'ai', ...model })}
                                                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedModel?.local === model.local
                                                            ? 'border-purple-500 ring-2 ring-purple-300'
                                                            : 'border-gray-200 hover:border-purple-300'
                                                            }`}
                                                    >
                                                        <img
                                                            src={model.cloud}
                                                            alt="AI Model"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        {selectedModel?.local === model.local && (
                                                            <div className="absolute inset-0 bg-purple-600/20 flex items-center justify-center">
                                                                <div className="bg-purple-600 text-white rounded-full p-1">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Real Models */}
                                    {availableModels.real_models.length > 0 && (
                                        <div>
                                            <p className="text-xs font-medium text-gray-700 mb-2">Real Models</p>
                                            <div className="grid grid-cols-4 gap-2">
                                                {availableModels.real_models.map((model, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setSelectedModel({ type: 'real', ...model })}
                                                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedModel?.local === model.local
                                                            ? 'border-green-500 ring-2 ring-green-300'
                                                            : 'border-gray-200 hover:border-green-300'
                                                            }`}
                                                    >
                                                        <img
                                                            src={model.cloud}
                                                            alt="Real Model"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        {selectedModel?.local === model.local && (
                                                            <div className="absolute inset-0 bg-green-600/20 flex items-center justify-center">
                                                                <div className="bg-green-600 text-white rounded-full p-1">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs px-1 py-0.5 text-center truncate">
                                                            {model.name || 'Model'}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {!selectedModel && useDifferentModel && (
                                        <p className="text-xs text-orange-600 mt-2">
                                            ⚠️ Please select a model to use for regeneration
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Prompt Input */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-900 mb-3">
                                {useDifferentModel ? '📝 Using Original Prompt' : '✍️ Your Enhancement Instructions *'}
                            </label>
                            <textarea
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                disabled={useDifferentModel}
                                className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[120px] resize-none text-gray-900 placeholder-gray-500 ${useDifferentModel ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                placeholder={useDifferentModel ? "Using original prompt from generated image..." : "Describe what you want to improve... (e.g., Make the background more vibrant, add soft shadows, change the lighting to golden hour, improve contrast...)"}
                            />
                            <p className="text-xs text-gray-600 mt-2">
                                {useDifferentModel
                                    ? '🔒 Prompt is locked when using a different model. The original prompt will be used automatically.'
                                    : '💬 Be specific about what you want to change or improve in the image'
                                }
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <X className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-red-700 text-sm font-medium">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Example Prompts - Only show when not using different model */}
                        {!useDifferentModel && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <p className="text-xs font-semibold text-gray-900 mb-3">💡 Quick Enhancement Ideas:</p>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        "Make colors more vibrant and saturated",
                                        "Add soft shadows and depth",
                                        "Change lighting to golden sunset",
                                        "Make background more blurred",
                                        "Add more contrast and sharpness",
                                        "Create a more elegant atmosphere",
                                        "Make it look more professional"
                                    ].map((example, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCustomPrompt(example)}
                                            className="text-xs px-3 py-2 bg-white border border-gray-300 rounded-lg hover:border-purple-500 hover:text-purple-600 transition-colors font-medium"
                                        >
                                            {example}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowPromptModal(null)
                                    setCustomPrompt("")
                                    setError(null)
                                }}
                                className="px-6"
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-purple-600 hover:bg-purple-700 text-white px-6"
                                onClick={() => handleRegenerate(showPromptModal.product, showPromptModal.generatedImage)}
                                disabled={
                                    regenerating ||
                                    (useDifferentModel ? !selectedModel : !customPrompt.trim())
                                }
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                {regenerating ? 'Enhancing...' : (useDifferentModel ? 'Generate with New Model' : 'Enhance Image')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
