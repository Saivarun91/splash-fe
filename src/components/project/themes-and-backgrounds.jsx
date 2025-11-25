import { ChevronDown, Upload, X, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MultiSelect } from "@/components/ui/multi-select"
import { useState, useEffect, useRef } from "react"
import { apiService } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

export function ThemesAndBackgrounds({ showSuggestions = false, collectionData, project, onSave, onSelectionsChange, onImagesChange, canEdit = true }) {
    const { token } = useAuth()
    const [selectedThemes, setSelectedThemes] = useState([])
    const [selectedBackgrounds, setSelectedBackgrounds] = useState([])
    const [selectedPoses, setSelectedPoses] = useState([])
    const [selectedLocations, setSelectedLocations] = useState([])

    // State for uploaded images (now includes server-stored images)
    const [uploadedImages, setUploadedImages] = useState({
        themes: [],
        backgrounds: [],
        poses: [],
        locations: []
    })

    // State for upload progress
    const [uploading, setUploading] = useState({
        themes: false,
        backgrounds: false,
        poses: false,
        locations: false
    })

    // File input refs
    const fileInputRefs = {
        themes: useRef(null),
        backgrounds: useRef(null),
        poses: useRef(null),
        locations: useRef(null)
    }

    // Export selections through a getter function
    const getSelections = () => ({
        themes: selectedThemes,
        backgrounds: selectedBackgrounds,
        poses: selectedPoses,
        locations: selectedLocations
    })

    // Notify parent of selection changes
    useEffect(() => {
        if (onSelectionsChange) {
            onSelectionsChange(getSelections())
        }
    }, [selectedThemes, selectedBackgrounds, selectedPoses, selectedLocations])

    // Notify parent of image changes
    useEffect(() => {
        if (onImagesChange) {
            onImagesChange(uploadedImages)
        }
    }, [uploadedImages])

    // Get suggestions and selections from collection data
    const item = collectionData?.items?.[0]
    console.log("items : ", item)
    const aiSuggestions = {
        themes: (item?.suggested_themes || []).slice(0, 10),
        backgrounds: (item?.suggested_backgrounds || []).slice(0, 10),
        poses: (item?.suggested_poses || []).slice(0, 10),
        locations: (item?.suggested_locations || []).slice(0, 10)
    }

    // Load existing selections and uploaded images when collection data changes
    useEffect(() => {
        if (item) {
            setSelectedThemes(item.selected_themes || [])
            setSelectedBackgrounds(item.selected_backgrounds || [])
            setSelectedPoses(item.selected_poses || [])
            setSelectedLocations(item.selected_locations || [])

            // Load existing uploaded images from server
            const existingImages = {
                themes: (item.uploaded_theme_images || []).map(img => ({
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
                })),
                backgrounds: (item.uploaded_background_images || []).map(img => ({
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
                    isFromServer: true
                })),
                poses: (item.uploaded_pose_images || []).map(img => ({
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
                    isFromServer: true
                })),
                locations: (item.uploaded_location_images || []).map(img => ({
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
                    isFromServer: true
                }))
            }

            setUploadedImages(existingImages)
            console.log('Loaded existing images from server:', existingImages)
        }
    }, [item])

    const toggleSelection = (category, value) => {
        let setter, current
        switch (category) {
            case 'themes':
                setter = setSelectedThemes
                current = selectedThemes
                break
            case 'backgrounds':
                setter = setSelectedBackgrounds
                current = selectedBackgrounds
                break
            case 'poses':
                setter = setSelectedPoses
                current = selectedPoses
                break
            case 'locations':
                setter = setSelectedLocations
                current = selectedLocations
                break
            default:
                return
        }

        if (current.includes(value)) {
            setter(current.filter(item => item !== value))
        } else {
            setter([...current, value])
        }
    }

    // Handle file upload - now uploads immediately to server
    const handleFileUpload = async (category, files) => {
        if (!files || files.length === 0) return
        if (!project?.id || !collectionData?.id) {
            console.error('Missing project or collection data')
            return
        }

        setUploading(prev => ({ ...prev, [category]: true }))

        try {
            // Upload to server immediately
            const response = await apiService.uploadWorkflowImage(
                project.id,
                collectionData.id,
                category,
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

                setUploadedImages(prev => ({
                    ...prev,
                    [category]: [...prev[category], ...newImages]
                }))

                console.log(`Successfully uploaded ${newImages.length} ${category} images`)
            } else {
                console.error('Upload failed:', response.error)
            }
        } catch (error) {
            console.error('Error uploading images:', error)
        } finally {
            setUploading(prev => ({ ...prev, [category]: false }))
        }
    }

    // Remove uploaded image
    const removeUploadedImage = async (category, imageId) => {
        if (!project?.id || !collectionData?.id) {
            console.error('Missing project or collection data')
            return
        }

        // Find the image to get its cloud_url
        const image = uploadedImages[category]?.find(img => img.id === imageId)
        if (!image) {
            console.error('Image not found in local state')
            return
        }

        try {
            const response = await apiService.removeWorkflowImage(
                project.id,
                collectionData.id,
                imageId,
                category,
                token,
                image.cloud_url || image.url
            )

            if (response.success) {
                // Remove from local state
                setUploadedImages(prev => ({
                    ...prev,
                    [category]: prev[category].filter(img => img.id !== imageId)
                }))
                
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
    const handleFileInputChange = async (category, event) => {
        const files = event.target.files
        await handleFileUpload(category, files)
        // Reset the input
        event.target.value = ''
    }

    // Trigger file input
    const triggerFileInput = (category) => {
        if (fileInputRefs[category].current) {
            fileInputRefs[category].current.click()
        }
    }

    return (
        <div className="grid grid-cols-2 gap-6">
            {/* Themes */}
            <div className="border-2 border-dashed border-[#b0bec5] rounded-lg p-6 space-y-4">
                <div>
                    <h3 className="font-bold text-[#1a1a1a] mb-1">Themes</h3>
                    <p className="text-sm text-[#708090]">Define project vision and upload inspiration</p>
                </div>

                {showSuggestions && aiSuggestions.themes.length > 0 ? (
                    <div className="space-y-3">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                            <p className="text-blue-600 text-sm font-medium">AI Suggested Themes</p>
                        </div>
                        <MultiSelect
                            options={aiSuggestions.themes}
                            selected={selectedThemes}
                            onChange={(newSelection) => setSelectedThemes(newSelection)}
                            placeholder="Select themes..."
                            disabled={!canEdit}
                        />
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 px-3 py-2 border border-[#e6e6e6] rounded-lg bg-gray-50">
                            <div className="w-4 h-4 border border-[#708090] rounded"></div>
                            <span className="text-sm text-[#708090] flex-1">AI Suggested Themes</span>
                            <ChevronDown className="w-4 h-4 text-[#708090]" />
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    <p className="text-sm text-[#708090] text-center">Or</p>

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRefs.themes}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileInputChange('themes', e)}
                        className="hidden"
                        disabled={!canEdit}
                    />

                    <Button
                        variant="outline"
                        className="w-full bg-transparent"
                        disabled={!canEdit || uploading.themes}
                        onClick={() => triggerFileInput('themes')}
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading.themes ? 'Uploading...' : 'Choose files'}
                    </Button>

                    {/* Uploaded images preview */}
                    {uploadedImages.themes.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs text-[#708090]">
                                {uploadedImages.themes.length} file(s) selected
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {uploadedImages.themes.map((image) => (
                                    <div key={image.id} className="relative group">
                                        <img
                                            src={image.url}
                                            alt={image.name}
                                            className="w-full h-16 object-cover rounded border"
                                        />
                                        <button
                                            onClick={() => removeUploadedImage('themes', image.id)}
                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            disabled={!canEdit}
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Backgrounds */}
            <div className="border-2 border-dashed border-[#b0bec5] rounded-lg p-6 space-y-4">
                <div>
                    <h3 className="font-bold text-[#1a1a1a] mb-1">Backgrounds</h3>
                    <p className="text-sm text-[#708090]">Define project vision and upload inspiration</p>
                </div>

                {showSuggestions && aiSuggestions.backgrounds.length > 0 ? (
                    <div className="space-y-3">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                            <p className="text-blue-600 text-sm font-medium">AI Suggested Backgrounds</p>
                        </div>
                        <MultiSelect
                            options={aiSuggestions.backgrounds}
                            selected={selectedBackgrounds}
                            onChange={(newSelection) => setSelectedBackgrounds(newSelection)}
                            placeholder="Select backgrounds..."
                            disabled={!canEdit}
                        />
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 px-3 py-2 border border-[#e6e6e6] rounded-lg bg-gray-50">
                            <div className="w-4 h-4 border border-[#708090] rounded"></div>
                            <span className="text-sm text-[#708090] flex-1">AI Suggested Backgrounds</span>
                            <ChevronDown className="w-4 h-4 text-[#708090]" />
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    <p className="text-sm text-[#708090] text-center">Or</p>

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRefs.backgrounds}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileInputChange('backgrounds', e)}
                        className="hidden"
                        disabled={!canEdit}
                    />

                    <Button
                        variant="outline"
                        className="w-full bg-transparent"
                        disabled={!canEdit || uploading.backgrounds}
                        onClick={() => triggerFileInput('backgrounds')}
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading.backgrounds ? 'Uploading...' : 'Choose files'}
                    </Button>

                    {/* Uploaded images preview */}
                    {uploadedImages.backgrounds.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs text-[#708090]">
                                {uploadedImages.backgrounds.length} file(s) selected
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {uploadedImages.backgrounds.map((image) => (
                                    <div key={image.id} className="relative group">
                                        <img
                                            src={image.url}
                                            alt={image.name}
                                            className="w-full h-16 object-cover rounded border"
                                        />
                                        <button
                                            onClick={() => removeUploadedImage('backgrounds', image.id)}
                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            disabled={!canEdit}
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sample Poses */}
            <div className="border-2 border-dashed border-[#b0bec5] rounded-lg p-6 space-y-4">
                <div>
                    <h3 className="font-bold text-[#1a1a1a] mb-1">Sample Poses</h3>
                    <p className="text-sm text-[#708090]">Define project vision and upload inspiration</p>
                </div>

                {showSuggestions && aiSuggestions.poses.length > 0 ? (
                    <div className="space-y-3">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                            <p className="text-blue-600 text-sm font-medium">AI Suggested Poses</p>
                        </div>
                        <MultiSelect
                            options={aiSuggestions.poses}
                            selected={selectedPoses}
                            onChange={(newSelection) => setSelectedPoses(newSelection)}
                            placeholder="Select poses..."
                            disabled={!canEdit}
                        />
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 px-3 py-2 border border-[#e6e6e6] rounded-lg bg-gray-50">
                            <div className="w-4 h-4 border border-[#708090] rounded"></div>
                            <span className="text-sm text-[#708090] flex-1">AI Suggested Poses</span>
                            <ChevronDown className="w-4 h-4 text-[#708090]" />
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    <p className="text-sm text-[#708090] text-center">Or</p>

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRefs.poses}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileInputChange('poses', e)}
                        className="hidden"
                        disabled={!canEdit}
                    />

                    <Button
                        variant="outline"
                        className="w-full bg-transparent"
                        disabled={!canEdit || uploading.poses}
                        onClick={() => triggerFileInput('poses')}
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading.poses ? 'Uploading...' : 'Choose files'}
                    </Button>

                    {/* Uploaded images preview */}
                    {uploadedImages.poses.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs text-[#708090]">
                                {uploadedImages.poses.length} file(s) selected
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {uploadedImages.poses.map((image) => (
                                    <div key={image.id} className="relative group">
                                        <img
                                            src={image.url}
                                            alt={image.name}
                                            className="w-full h-16 object-cover rounded border"
                                        />
                                        <button
                                            onClick={() => removeUploadedImage('poses', image.id)}
                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            disabled={!canEdit}
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Location Inspiration */}
            <div className="border-2 border-dashed border-[#b0bec5] rounded-lg p-6 space-y-4">
                <div>
                    <h3 className="font-bold text-[#1a1a1a] mb-1">Location Inspiration</h3>
                    <p className="text-sm text-[#708090]">Define project vision and upload inspiration</p>
                </div>

                {showSuggestions && aiSuggestions.locations.length > 0 ? (
                    <div className="space-y-3">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                            <p className="text-blue-600 text-sm font-medium">AI Suggested Locations</p>
                        </div>
                        <MultiSelect
                            options={aiSuggestions.locations}
                            selected={selectedLocations}
                            onChange={(newSelection) => setSelectedLocations(newSelection)}
                            placeholder="Select locations..."
                            disabled={!canEdit}
                        />
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 px-3 py-2 border border-[#e6e6e6] rounded-lg bg-gray-50">
                            <div className="w-4 h-4 border border-[#708090] rounded"></div>
                            <span className="text-sm text-[#708090] flex-1">AI Suggested Locations</span>
                            <ChevronDown className="w-4 h-4 text-[#708090]" />
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    <p className="text-sm text-[#708090] text-center">Or</p>

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRefs.locations}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileInputChange('locations', e)}
                        className="hidden"
                        disabled={!canEdit}
                    />

                    <Button
                        variant="outline"
                        className="w-full bg-transparent"
                        disabled={!canEdit || uploading.locations}
                        onClick={() => triggerFileInput('locations')}
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading.locations ? 'Uploading...' : 'Choose files'}
                    </Button>

                    {/* Uploaded images preview */}
                    {uploadedImages.locations.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs text-[#708090]">
                                {uploadedImages.locations.length} file(s) selected
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {uploadedImages.locations.map((image) => (
                                    <div key={image.id} className="relative group">
                                        <img
                                            src={image.url}
                                            alt={image.name}
                                            className="w-full h-16 object-cover rounded border"
                                        />
                                        <button
                                            onClick={() => removeUploadedImage('locations', image.id)}
                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            disabled={!canEdit}
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
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
