"use client"

import { useState, useEffect, useRef } from "react"
import { Upload, X, CheckCircle, Image as ImageIcon, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiService } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { HierarchicalOrnamentSelect } from "./hierarchical-ornament-select"

export function ProductUploadPage({ project, collectionData, onSave, canEdit = true }) {
    const [selectedFiles, setSelectedFiles] = useState([])
    const [fileOrnamentTypes, setFileOrnamentTypes] = useState({}) // Map file index to ornament type
    const [filePreviews, setFilePreviews] = useState({}) // Map file index to preview URL
    const [uploadedProducts, setUploadedProducts] = useState([])
    const [uploading, setUploading] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState(null)
    const fileInputRef = useRef(null)
    const { token } = useAuth()

    // Load existing product images from collection data
    useEffect(() => {
        if (collectionData?.items?.[0]?.product_images) {
            const existing = collectionData.items[0].product_images
            setUploadedProducts(existing)
        }
    }, [collectionData])

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files)
        if (files.length > 0) {
            const newFiles = [...selectedFiles, ...files]
            setSelectedFiles(newFiles)

            // Create previews for new files
            const newPreviews = { ...filePreviews }
            files.forEach((file, fileIndex) => {
                const actualIndex = selectedFiles.length + fileIndex
                const previewUrl = URL.createObjectURL(file)
                newPreviews[actualIndex] = previewUrl
            })
            setFilePreviews(newPreviews)
        }
        // Reset file input to allow selecting the same file again
        e.target.value = ''
    }

    const handleRemoveFile = (index) => {
        // Clean up preview URL
        if (filePreviews[index]) {
            URL.revokeObjectURL(filePreviews[index])
        }

        // Remove file and reindex everything
        setSelectedFiles(prev => {
            const newFiles = prev.filter((_, i) => i !== index)
            return newFiles
        })

        // Reindex previews and ornament types
        setFilePreviews(prev => {
            const newPreviews = {}
            Object.keys(prev).forEach(key => {
                const keyNum = parseInt(key)
                if (keyNum < index) {
                    newPreviews[keyNum] = prev[key]
                } else if (keyNum > index) {
                    newPreviews[keyNum - 1] = prev[key]
                }
                // Skip the deleted index
            })
            return newPreviews
        })

        setFileOrnamentTypes(prev => {
            const newTypes = {}
            Object.keys(prev).forEach(key => {
                const keyNum = parseInt(key)
                if (keyNum < index) {
                    newTypes[keyNum] = prev[key]
                } else if (keyNum > index) {
                    newTypes[keyNum - 1] = prev[key]
                }
                // Skip the deleted index
            })
            return newTypes
        })
    }

    const handleOrnamentTypeChange = (fileIndex, ornamentType) => {
        setFileOrnamentTypes(prev => ({
            ...prev,
            [fileIndex]: ornamentType
        }))
    }

    // Clean up preview URLs on unmount
    useEffect(() => {
        return () => {
            Object.values(filePreviews).forEach(url => {
                if (url) URL.revokeObjectURL(url)
            })
        }
    }, [filePreviews])

    const handleDeleteProduct = async (product) => {
        if (!window.confirm("Are you sure you want to delete this product image?")) return

        setDeleting(true)
        setError(null)

        try {
            const response = await apiService.deleteProductImage(
                collectionData.id,
                product.uploaded_image_url,
                product.uploaded_image_path,
                token
            )

            if (response.success) {
                // Refresh collection data to get updated products
                const updatedCollection = await apiService.getCollection(collectionData.id, token)
                if (updatedCollection.items?.[0]?.product_images) {
                    setUploadedProducts(updatedCollection.items[0].product_images)
                }
                // Notify parent component
                if (onSave) {
                    await onSave({ productsUpdated: true })
                }
            } else {
                setError(response.error || "Failed to delete product image.")
            }
        } catch (err) {
            console.error("Error deleting product image:", err)
            setError(err.message || "Failed to delete product image.")
        } finally {
            setDeleting(false)
        }
    }

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            setError('Please select at least one image')
            return
        }

        if (!collectionData?.id) {
            setError('No collection found')
            return
        }

        // Check if all files have ornament types selected
        const missingTypes = selectedFiles.filter((_, index) => !fileOrnamentTypes[index])
        if (missingTypes.length > 0) {
            setError('Please select ornament type for all files')
            return
        }

        setUploading(true)
        setError(null)

        try {
            // Prepare ornament types array matching the files order
            const ornamentTypes = selectedFiles.map((_, index) => fileOrnamentTypes[index] || '')

            const response = await apiService.uploadProductImages(
                collectionData.id,
                selectedFiles,
                ornamentTypes,
                token
            )

            if (response.success) {
                // Clean up preview URLs
                Object.values(filePreviews).forEach(url => {
                    if (url) URL.revokeObjectURL(url)
                })

                // Refresh collection data to get uploaded products
                const updatedCollection = await apiService.getCollection(collectionData.id, token)
                if (updatedCollection.items?.[0]?.product_images) {
                    setUploadedProducts(updatedCollection.items[0].product_images)
                }

                setSelectedFiles([])
                setFilePreviews({})
                setFileOrnamentTypes({})
                if (onSave) {
                    await onSave({ productsUploaded: true })
                }
            } else {
                setError(response.error || 'Failed to upload products')
            }
        } catch (err) {
            console.error('Error uploading products:', err)
            setError(err.message || 'Failed to upload products')
        } finally {
            setUploading(false)
        }
    }

    const hasProducts = uploadedProducts.length > 0
    const hasSelectedFiles = selectedFiles.length > 0

    return (
        <div className="mb-12">
            <div className="flex items-start gap-3 mb-6">
                <div className="w-10 h-10 bg-[#e6e6e6] rounded-lg flex items-center justify-center">
                    <Upload className="w-5 h-5 text-[#708090]" />
                </div>
                <div>
                    <h3 className="font-bold text-[#1a1a1a] text-2xl">Product Upload</h3>
                    <p className="text-sm text-[#708090] mt-1">Upload product images with white or transparent background</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-red-600">{error}</p>
                </div>
            )}

            {/* Upload Area */}
            <div className="border-2 border-dashed border-[#b0bec5] rounded-lg p-8 mb-6">
                <div className="text-center">
                    <Upload className="w-16 h-16 text-[#708090] mx-auto mb-4" />
                    <h4 className="font-semibold text-[#1a1a1a] mb-2">Upload Product Images</h4>
                    <p className="text-sm text-[#708090] mb-4">
                        Select one or more product images (PNG, JPG)
                    </p>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={!canEdit}
                    />

                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        className="mb-4"
                        disabled={!canEdit}
                        title={canEdit ? "" : "You need Editor or Owner role to upload products"}
                    >
                        Choose Files
                    </Button>

                    {hasSelectedFiles && (
                        <div className="mt-6">
                            <p className="text-sm font-medium text-[#1a1a1a] mb-4">Selected Files Preview:</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                                {selectedFiles.map((file, index) => (
                                    <div
                                        key={index}
                                        className="bg-white border border-[#e6e6e6] rounded-lg p-3 space-y-3 relative group hover:border-[#884cff]/50 transition-all"
                                    >
                                        {/* Remove Button */}
                                        <button
                                            onClick={() => handleRemoveFile(index)}
                                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-700 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                            disabled={!canEdit}
                                            title="Remove file"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>

                                        {/* File Preview - At Top */}
                                        <div className="w-full aspect-square bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                                            {filePreviews[index] ? (
                                                <img
                                                    src={filePreviews[index]}
                                                    alt={file.name}
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ImageIcon className="w-8 h-8 text-gray-400" />
                                                </div>
                                            )}
                                        </div>

                                        {/* File Name - Below Preview */}
                                        <div>
                                            <p className="text-xs font-medium text-[#1a1a1a] truncate" title={file.name}>
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-[#708090] mt-0.5">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>

                                        {/* Ornament Type Selection - Below File Name */}
                                        <div>
                                            <label className="block text-xs font-medium text-[#1a1a1a] mb-1.5">
                                                Ornament Type <span className="text-red-500">*</span>
                                            </label>
                                            <HierarchicalOrnamentSelect
                                                selectedType={fileOrnamentTypes[index] || ''}
                                                onTypeChange={(type) => handleOrnamentTypeChange(index, type)}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Button
                                onClick={handleUpload}
                                disabled={uploading || !canEdit || selectedFiles.some((_, index) => !fileOrnamentTypes[index])}
                                className="bg-[#884cff] hover:bg-[#7a3ff0] text-white w-full"
                                title={canEdit ? "" : "You need Editor or Owner role to upload products"}
                            >
                                {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} Image(s)`}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Uploaded Products Display */}
            {hasProducts && (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <h4 className="font-semibold text-[#1a1a1a]">
                            Uploaded Products ({uploadedProducts.length})
                        </h4>
                    </div>

                    <div className="grid grid-cols-4 gap-6">
                        {uploadedProducts.map((product, index) => (
                            <div
                                key={index}
                                className="group relative border-2 border-[#e6e6e6] rounded-lg overflow-hidden hover:border-[#884cff]/50 transition-all"
                            >
                                <img
                                    src={product.uploaded_image_url}
                                    alt={`Product ${index + 1}`}
                                    className="w-full h-24 object-contain bg-white"
                                />
                                {canEdit && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDeleteProduct(product)
                                        }}
                                        className="absolute top-2 left-2 bg-red-500 hover:bg-red-700 text-white rounded-full p-1.5 transition-all duration-300 ease-in-out hover:scale-110 shadow-lg z-10"
                                        title="Delete product image"
                                        disabled={deleting || uploading}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                                {/* Hover overlay with View button */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            window.open(product.uploaded_image_url, '_blank')
                                        }}
                                        className="bg-white hover:bg-gray-100 text-[#884cff] px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all hover:scale-105"
                                    >
                                        <Eye className="w-4 h-4" />
                                        View
                                    </button>
                                </div>
                                <div className="p-3 bg-gray-50">
                                    <p className="text-sm font-medium text-[#1a1a1a]">Product {index + 1}</p>
                                    {product.ornament_type && (
                                        <p className="text-xs text-[#884cff] mt-1 font-medium">
                                            {product.ornament_type}
                                        </p>
                                    )}
                                    <p className="text-xs text-[#708090] mt-1">
                                        {product.generated_images?.length || 0} variations generated
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!hasProducts && !hasSelectedFiles && (
                <div className="text-center py-12 border-2 border-dashed border-[#e6e6e6] rounded-lg">
                    <ImageIcon className="w-16 h-16 text-[#708090] mx-auto mb-4" />
                    <p className="text-[#708090] mb-4">No products uploaded yet</p>
                    <p className="text-sm text-[#708090]">Click "Choose Files" to upload product images</p>
                </div>
            )}
        </div>
    )
}
