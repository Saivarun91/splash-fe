import { ChevronDown, Upload, X } from "lucide-react"
import { MultiSelect } from "@/components/ui/multi-select"
import { Button } from "@/components/ui/button"
import { ColorPicker } from "@/components/ui/color-picker"
import { useState, useEffect, useRef } from "react"
import { apiService } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

export function ColorPalette({ showSuggestions = false, collectionData, project, onSave, onSelectionsChange, onImagesChange, canEdit = true }) {
    const { token } = useAuth()
    const [selectedColors, setSelectedColors] = useState([])
    const [pickedColors, setPickedColors] = useState([])
    const [colorInstructions, setColorInstructions] = useState("")
    const [uploadedImages, setUploadedImages] = useState([])
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef(null)

    // Get suggestions and selections from collection data
    const item = collectionData?.items?.[0]
    const aiColorSuggestions = (item?.suggested_colors || []).slice(0, 10)
    
    // Debug: Log suggestions to help troubleshoot
    useEffect(() => {
        if (item) {
            console.log('Color Palette - Collection item:', item)
            console.log('Color Palette - Suggested colors:', item.suggested_colors)
            console.log('Color Palette - AI Color Suggestions:', aiColorSuggestions)
            console.log('Color Palette - Show Suggestions prop:', showSuggestions)
        }
    }, [item, aiColorSuggestions, showSuggestions])

    // Load existing selections and uploaded images when collection data changes
    useEffect(() => {
        if (item) {
            setSelectedColors(item.selected_colors || [])
            setPickedColors(item.picked_colors || [])
            setColorInstructions(item.color_instructions || "")

            // Load existing uploaded color images from server
            const existingImages = (item.uploaded_color_images || []).map(img => ({
                id: img.id || Date.now() + Math.random(),
                local_path: img.local_path,
                cloud_url: img.cloud_url,
                original_filename: img.original_filename,
                uploaded_by: img.uploaded_by,
                uploaded_at: img.uploaded_at,
                file_size: img.file_size,
                category: img.category,
                url: img.cloud_url,
                name: img.original_filename,
                isFromServer: true // Flag to indicate this image was loaded from server
            }))

            setUploadedImages(existingImages)
            console.log('Loaded existing color images from server:', existingImages)
        }
    }, [item])

    const toggleSelection = (color) => {
        if (selectedColors.includes(color)) {
            setSelectedColors(selectedColors.filter(item => item !== color))
        } else {
            setSelectedColors([...selectedColors, color])
        }
    }

    // Handle file upload - now uploads immediately to server
    const handleFileUpload = async (files) => {
        if (!files || files.length === 0) return
        if (!project?.id || !collectionData?.id) {
            console.error('Missing project or collection data')
            return
        }

        setUploading(true)

        try {
            // Upload to server immediately
            const response = await apiService.uploadWorkflowImage(
                project.id,
                collectionData.id,
                'color',
                Array.from(files),
                token
            )

            if (response.success) {
                // Add the uploaded images to local state
                const newImages = response.uploaded_images.map(img => ({
                    id: img.id || Date.now() + Math.random(),
                    local_path: img.local_path,
                    cloud_url: img.cloud_url,
                    original_filename: img.original_filename,
                    uploaded_by: img.uploaded_by,
                    uploaded_at: img.uploaded_at,
                    file_size: img.file_size,
                    category: img.category,
                    url: img.cloud_url, // Use cloud URL for display
                    name: img.original_filename,
                    isFromServer: false // Flag to indicate this image was just uploaded
                }))

                setUploadedImages(prev => [...prev, ...newImages])
                console.log(`Successfully uploaded ${newImages.length} color images`)
            } else {
                console.error('Upload failed:', response.error)
            }
        } catch (error) {
            console.error('Error uploading images:', error)
        } finally {
            setUploading(false)
        }
    }

    // Remove uploaded image
    const removeUploadedImage = async (imageId) => {
        if (!project?.id || !collectionData?.id) {
            console.error('Missing project or collection data')
            return
        }

        // Find the image to get its cloud_url
        const image = uploadedImages.find(img => img.id === imageId)
        if (!image) {
            console.error('Image not found in local state')
            return
        }

        try {
            const response = await apiService.removeWorkflowImage(
                project.id,
                collectionData.id,
                imageId,
                'colors',
                token,
                image.cloud_url || image.url
            )

            if (response.success) {
                // Remove from local state
                setUploadedImages(prev => prev.filter(img => img.id !== imageId))
                
                // Refresh collection data
                const updatedData = await apiService.getCollection(collectionData.id, token)
                if (updatedData && onSave) {
                    await onSave({ imagesUpdated: true })
                }
            } else {
                console.error('Failed to remove image:', response.error)
            }
        } catch (error) {
            console.error('Error removing image:', error)
        }
    }

    // Handle file input change
    const handleFileInputChange = async (event) => {
        const files = event.target.files
        await handleFileUpload(files)
        // Reset the input
        event.target.value = ''
    }

    // Trigger file input
    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click()
        }
    }

    // Export selections through a getter function
    const getSelections = () => ({
        colors: selectedColors,
        pickedColors: pickedColors,
        colorInstructions: colorInstructions
    })

    // Notify parent of selection changes
    useEffect(() => {
        if (onSelectionsChange) {
            onSelectionsChange(getSelections())
        }
    }, [selectedColors, pickedColors, colorInstructions])

    // Notify parent of image changes
    useEffect(() => {
        if (onImagesChange) {
            onImagesChange(uploadedImages)
        }
    }, [uploadedImages])

    return (
        <div className="space-y-4">
            <h3 className="font-bold text-[#1a1a1a] text-lg">Color Palette</h3>

            <div className="flex gap-6">
                {/* AI Suggested Color Palettes Section - 50% width */}
                <div className="flex-1 w-2/3 space-y-3">
                    {aiColorSuggestions.length > 0 ? (
                        <>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                                <p className="text-blue-600 text-sm text-center font-medium">AI Suggested Color Palettes</p>
                            </div>
                            <MultiSelect
                                options={aiColorSuggestions}
                                selected={selectedColors}
                                onChange={(newSelection) => setSelectedColors(newSelection)}
                                placeholder="Select color palettes..."
                                disabled={!canEdit}
                            />
                        </>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-3 py-2 border border-[#e6e6e6] rounded-lg bg-gray-50">
                                <div className="w-4 h-4 border border-[#708090] rounded"></div>
                                <span className="text-sm text-[#708090] flex-1">AI Suggested Color Palettes</span>
                                <ChevronDown className="w-4 h-4 text-[#708090]" />
                            </div>
                            {showSuggestions && (
                                <p className="text-xs text-[#708090] text-center italic">
                                    Generate suggestions in Step 1 to see AI color palette recommendations
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Color Picker Section - 50% width */}
                <div className="flex-1 w-1/2 space-y-3">
                    <p className="text-sm text-[#708090]">Or pick specific colors:</p>
                    <ColorPicker
                        selectedColors={pickedColors}
                        onColorsChange={setPickedColors}
                        disabled={!canEdit}
                    />

                    {/* Display picked colors */}
                    {pickedColors.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs text-[#708090]">
                                {pickedColors.length} color(s) selected
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {pickedColors.map((color, index) => (
                                    <div key={index} className="relative group">
                                        <div
                                            className="w-8 h-8 rounded border border-gray-300"
                                            style={{
                                                background: color.includes('gradient') ? color : undefined,
                                                backgroundColor: color.includes('gradient') ? 'transparent' : color
                                            }}
                                            title={color}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
