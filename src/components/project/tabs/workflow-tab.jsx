"use client"

import { useState, useEffect, useCallback } from "react"
import { WorkflowSteps } from "@/components/project/workflow-steps"
import { BriefAndConcept } from "@/components/project/brief-and-concept"
import { ThemesAndBackgrounds } from "@/components/project/themes-and-backgrounds"
import { ColorPalette } from "@/components/project/color-palette"
import { GlobalInstructions } from "@/components/project/global-instructions"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Lock } from "lucide-react"
import { ModelSelectionSection } from "@/components/project/model-selection-section"
import { ProductUploadPage } from "@/components/project/product-upload-page"
import { ImageGrid } from "../Image-grid"
import { GenerateSection } from "../generate-section"
import { apiService } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { canEditProject, isProjectOwner } from "@/lib/permissions"
import { useImageGeneration } from "@/context/ImageGenerationContext"

export function WorkflowTab({ project }) {
    console.log("roject : ", project)
    const [activeStep, setActiveStep] = useState(1)
    const [collectionData, setCollectionData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [successMessage, setSuccessMessage] = useState(null)
    const { token, user } = useAuth()
    const { isGenerating } = useImageGeneration()

    // Check if user can edit
    const canEdit = canEditProject(project, user)
    console.log("can Edit : ", canEdit)
    const userRole = project.userRole
    console.log("userRole : ", userRole)
    // Check if user is owner (for generate button in step 5)
    const isOwner = isProjectOwner(project, user)
    console.log("isOwner : ", isOwner)
    // State for sequential display logic
    const [suggestionsRequested, setSuggestionsRequested] = useState(false)

    // State to track which steps have been saved
    // Step 1 is always accessible, but not necessarily saved
    const [savedSteps, setSavedSteps] = useState(new Set())

    // State to hold current form data from BriefAndConcept
    const [briefFormData, setBriefFormData] = useState({
        description: "",
        targetAudience: "",
        campaignSeason: "",
        hasDescription: false
    })

    // State to hold current selections
    const [currentSelections, setCurrentSelections] = useState({
        themes: [],
        backgrounds: [],
        poses: [],
        locations: [],
        colors: [],
        pickedColors: [],
        colorInstructions: "",
        globalInstructions: ""
    })

    // State to hold uploaded images
    const [uploadedImages, setUploadedImages] = useState({
        themes: [],
        backgrounds: [],
        poses: [],
        locations: [],
        colors: []
    })

    // State to hold selected model from ModelSelectionSection
    const [selectedModel, setSelectedModel] = useState(null)

    // Memoized callback for global instructions change
    const handleGlobalInstructionsChange = useCallback((instructions) => {
        setCurrentSelections(prev => ({ ...prev, globalInstructions: instructions }))
    }, [])

    // Handlers for sequential display logic
    const handleRequestSuggestions = async (description, targetAudience = null, campaignSeason = null) => {
        if (!project?.id) {
            setError('Project not found')
            return
        }

        // Only set suggestionsRequested if description is provided
        if (description && description.trim()) {
            setSuggestionsRequested(true)
        } else {
            setSuggestionsRequested(false)
        }

        setLoading(true)
        setError(null)
        setSuccessMessage(null)

        try {
            // Call the API to update collection (description is optional, will generate suggestions only if description is provided)
            const response = await apiService.updateCollectionDescription(
                project.id,
                description || "",
                null,
                targetAudience,
                campaignSeason
            )

            if (response.success && response.collection) {
                // Update the collection data
                setCollectionData(response.collection)

                if (description && description.trim()) {
                    setSuccessMessage('AI suggestions updated successfully!')
                    console.log('AI suggestions generated/updated successfully:', response.collection.items?.[0])
                } else {
                    setSuccessMessage('Project settings saved successfully!')
                }

                // Mark step 1 as saved only after successful save
                // Step 1 is saved when targetAudience and campaignSeason are saved (description is optional)
                // This will automatically unlock step 2 via isStepUnlocked
                setSavedSteps(prev => new Set([...prev, 1]))

                // Navigate to step 2 (Moodboard Setup)
                setActiveStep(2)

                // Clear success message after 3 seconds
                setTimeout(() => setSuccessMessage(null), 3000)
            } else {
                throw new Error(response.error || 'Failed to save project settings')
            }
        } catch (err) {
            console.error('Error saving project settings:', err)
            setError(err.message)
            setSuggestionsRequested(false)
        } finally {
            setLoading(false)
        }
    }

    // Fetch collection data when project changes
    console.log("suggestionsRequested", suggestionsRequested)
    useEffect(() => {
        const fetchCollectionData = async () => {
            if (project?.collection?.id && token) {
                try {
                    setLoading(true)
                    const data = await apiService.getCollection(project.collection.id, token)
                    setCollectionData(data)

                    // Initialize saved steps based on backend data
                    // Only add steps that are actually saved to the backend
                    const newSavedSteps = new Set()

                    // Check if step 1 is saved (has targetAudience and campaignSeason saved to backend)
                    // Step 2 unlocks ONLY when step 1 is fully saved to backend
                    // Description is optional - only targetAudience and campaignSeason are required
                    const hasDescription = data.description && data.description.trim()
                    const hasTargetAudience = data.target_audience !== undefined && data.target_audience !== null
                    const hasCampaignSeason = data.campaign_season !== undefined && data.campaign_season !== null
                    // Step 1 is saved if targetAudience and campaignSeason are provided (description is optional)
                    const step1Saved = hasTargetAudience && hasCampaignSeason

                    if (step1Saved) {
                        newSavedSteps.add(1) // Step 1 is saved - this will unlock step 2 via isStepUnlocked

                        // Check if we have suggestions already generated (only if description exists)
                        if (hasDescription && data.items && data.items.length > 0) {
                            const item = data.items[0]
                            const hasSuggestions = (
                                (item.suggested_themes && item.suggested_themes.length > 0) ||
                                (item.suggested_backgrounds && item.suggested_backgrounds.length > 0) ||
                                (item.suggested_colors && item.suggested_colors.length > 0)
                            )
                            if (hasSuggestions) {
                                setSuggestionsRequested(true)
                            }
                        } else {
                            // No description means no suggestions
                            setSuggestionsRequested(false)
                        }
                    }

                    // Check if step 2 is saved (has selections saved to backend)
                    // Step 3 unlocks only when step 2 is fully saved
                    if (data.items && data.items.length > 0) {
                        const item = data.items[0]
                        const hasSelections = (
                            (item.selected_themes && item.selected_themes.length > 0) ||
                            (item.selected_backgrounds && item.selected_backgrounds.length > 0) ||
                            (item.selected_colors && item.selected_colors.length > 0) ||
                            (item.global_instructions && item.global_instructions.trim())
                        )
                        if (hasSelections) {
                            newSavedSteps.add(2) // Step 2 is saved - this will unlock step 3 via isStepUnlocked
                        }
                    }

                    // Check if step 3 is saved (has models saved to backend)
                    // Step 4 unlocks only when step 3 is fully saved
                    if (data.items && data.items.length > 0) {
                        const item = data.items[0]
                        if (item.selected_model || (item.uploaded_models && item.uploaded_models.length > 0)) {
                            newSavedSteps.add(3) // Step 3 is saved - this will unlock step 4 via isStepUnlocked
                            // Initialize selectedModel from backend if it exists
                            if (item.selected_model) {
                                setSelectedModel(item.selected_model)
                            }
                        }
                    }

                    // Check if step 4 is saved (has products saved to backend)
                    // Step 5 unlocks only when step 4 is fully saved
                    if (data.items && data.items.length > 0) {
                        const item = data.items[0]
                        if (item.product_images && item.product_images.length > 0) {
                            newSavedSteps.add(4) // Step 4 is saved - this will unlock step 5 via isStepUnlocked
                        }
                    }

                    setSavedSteps(newSavedSteps)
                } catch (err) {
                    // Don't set error for 401 (unauthorized) - user might be logging out
                    if (err.message && !err.message.includes('401')) {
                        console.error('Error fetching collection:', err)
                        setError(err.message)
                    }
                } finally {
                    setLoading(false)
                }
            }
        }

        fetchCollectionData()
    }, [project?.collection?.id, token])

    const handleStepSave = async (stepData) => {
        try {
            setLoading(true)
            setError(null)
            setSuccessMessage(null)

            switch (activeStep) {
                case 1:
                    // Brief & Concept step - save targetAudience and campaignSeason (description is optional)
                    // If description is provided, generate suggestions; otherwise, allow proceeding without suggestions
                    if (!briefFormData.targetAudience || !briefFormData.campaignSeason) {
                        setError('Please enter target audience and campaign season')
                        return
                    }

                    await handleRequestSuggestions(
                        briefFormData.description || "",
                        briefFormData.targetAudience || null,
                        briefFormData.campaignSeason || null
                    )
                    // handleRequestSuggestions already navigates to step 2, so we don't need to do it here
                    return
                case 2:
                    // Moodboard setup step - save selections for themes, backgrounds, poses, locations, and colors
                    // Also generates prompts using Gemini AI
                    if (project?.id && collectionData?.id) {
                        const response = await apiService.updateCollectionSelections(
                            project.id,
                            collectionData.id,
                            currentSelections,
                            uploadedImages
                        )

                        if (response.success) {
                            console.log('Selections saved successfully:', currentSelections)
                            console.log('Generated prompts:', response.generated_prompts)

                            setSuccessMessage(response.message || 'Selections saved and prompts generated successfully!')

                            // Mark step 2 as saved - this will automatically unlock step 3 via isStepUnlocked
                            setSavedSteps(prev => new Set([...prev, 2]))

                            // Refresh collection data after saving
                            const updatedData = await apiService.getCollection(collectionData.id, token)
                            setCollectionData(updatedData)

                            // Clear success message after 3 seconds
                            setTimeout(() => setSuccessMessage(null), 3000)
                        }
                    }
                    break
                case 3:
                    // Model selection step - save the selected model to backend
                    if (selectedModel && collectionData?.id) {
                        try {
                            setLoading(true)
                            const response = await apiService.selectModel(
                                collectionData.id,
                                selectedModel.type,
                                selectedModel
                            )

                            if (response.success) {
                                console.log("✅ Model saved in WorkflowTab:", response.selected_model)
                                // Mark step 3 as saved - this will automatically unlock step 4 via isStepUnlocked
                                setSavedSteps(prev => new Set([...prev, 3]))
                                const updatedData = await apiService.getCollection(collectionData.id, token)
                                setCollectionData(updatedData)
                                setSuccessMessage('Model selected successfully!')
                                setTimeout(() => setSuccessMessage(null), 3000)
                            } else {
                                throw new Error(response.error || 'Failed to save model')
                            }
                        } catch (err) {
                            console.error('Error saving model:', err)
                            setError(err.message || 'Failed to save model')
                            throw err // Re-throw to prevent navigation
                        } finally {
                            setLoading(false)
                        }
                    } else if (stepData.modelsSaved && collectionData?.id) {
                        // Handle case when AI models are saved (from handleSaveAIModels)
                        setSavedSteps(prev => new Set([...prev, 3]))
                        const updatedData = await apiService.getCollection(collectionData.id, token)
                        setCollectionData(updatedData)
                        setSuccessMessage('Models saved successfully!')
                        setTimeout(() => setSuccessMessage(null), 3000)
                    } else if (!selectedModel) {
                        setError('Please select a model before continuing')
                        throw new Error('No model selected')
                    }
                    break
                case 4:
                    // Product upload step - when products are uploaded, they're already saved to backend
                    if (stepData.productsUploaded && collectionData?.id) {
                        // Mark step 4 as saved - this will automatically unlock step 5 via isStepUnlocked
                        setSavedSteps(prev => new Set([...prev, 4]))
                        const updatedData = await apiService.getCollection(collectionData.id, token)
                        setCollectionData(updatedData)
                        setSuccessMessage('Products uploaded successfully!')
                        setTimeout(() => setSuccessMessage(null), 3000)
                        // Don't navigate automatically - let "Save and Continue" button handle navigation
                    }
                    break
                case 5:
                    // Image generation step - refresh data if images were generated
                    if (stepData.imagesGenerated && collectionData?.id) {
                        const updatedData = await apiService.getCollection(collectionData.id, token)
                        setCollectionData(updatedData)
                        setSuccessMessage('Images generated successfully!')
                        setTimeout(() => setSuccessMessage(null), 3000)
                    }
                    break
            }

            setError(null)
        } catch (err) {
            console.error('Error saving step:', err)
            setError(err.message || 'Failed to save')
        } finally {
            setLoading(false)
        }
    }

    const renderStepContent = () => {
        return (
            <>
                {/* Role-based access message */}
                {!canEdit && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 flex items-center gap-3">
                        <Lock className="w-5 h-5 text-amber-600" />
                        <div>
                            <p className="text-amber-800 font-medium">View-Only Access</p>
                            <p className="text-amber-600 text-sm">
                                You have {userRole} access. Only Editors and Owners can make changes to this project.
                            </p>
                        </div>
                    </div>
                )}

                {loading && (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7753ff]"></div>
                        <span className="ml-2">Loading...</span>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <p className="text-red-600">Error: {error}</p>
                    </div>
                )}

                {successMessage && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <p className="text-green-600">✓ {successMessage}</p>
                    </div>
                )}

                {!loading && renderStepComponents()}
            </>
        )
    }

    const renderStepComponents = () => {

        switch (activeStep) {
            case 1:
                // Brief & Concept tab
                return (
                    <BriefAndConcept
                        project={project}
                        collectionData={collectionData}
                        onSave={handleStepSave}
                        onRequestSuggestions={handleRequestSuggestions}
                        suggestionsRequested={suggestionsRequested}
                        canEdit={canEdit}
                        onFormDataChange={setBriefFormData}
                    />
                )
            case 2:
                // Moodboard Setup tab
                // Only show suggestions if description was provided (suggestionsRequested is true)
                const hasDescription = collectionData?.description && collectionData.description.trim()
                const shouldShowSuggestions = suggestionsRequested && hasDescription

                return (
                    <>
                        <ThemesAndBackgrounds
                            project={project}
                            collectionData={collectionData}
                            onSave={handleStepSave}
                            showSuggestions={shouldShowSuggestions}
                            onSelectionsChange={(selections) => setCurrentSelections(prev => ({ ...prev, ...selections }))}
                            onImagesChange={(images) => setUploadedImages(prev => ({ ...prev, ...images }))}
                            canEdit={canEdit}
                        />
                        <ColorPalette
                            project={project}
                            collectionData={collectionData}
                            onSave={handleStepSave}
                            showSuggestions={shouldShowSuggestions}
                            onSelectionsChange={(selections) => setCurrentSelections(prev => ({ ...prev, ...selections }))}
                            onImagesChange={(images) => setUploadedImages(prev => ({ ...prev, colors: images }))}
                            canEdit={canEdit}
                        />

                        <GlobalInstructions
                            project={project}
                            collectionData={collectionData}
                            onSave={handleStepSave}
                            canEdit={canEdit}
                            onInstructionsChange={handleGlobalInstructionsChange}
                        />
                    </>
                )
            case 3:
                // Model Selection tab
                return (
                    <ModelSelectionSection
                        project={project}
                        collectionData={collectionData}
                        onSave={handleStepSave}
                        canEdit={canEdit}
                        onModelSelectionChange={setSelectedModel}
                    />
                )
            case 4:
                // Products Upload tab
                return (
                    <ProductUploadPage
                        project={project}
                        collectionData={collectionData}
                        onSave={handleStepSave}
                        canEdit={canEdit}
                    />
                )
            case 5:
                // Generate and Edit tab
                return (
                    <>
                        <GenerateSection
                            project={project}
                            collectionData={collectionData}
                            onGenerate={handleStepSave}
                            canEdit={canEdit}
                            isOwner={isOwner}
                        />
                        <ImageGrid
                            project={project}
                            collectionData={collectionData}
                            onDataRefresh={(updatedData) => setCollectionData(updatedData)}
                            canEdit={canEdit}
                        />
                    </>
                )
            default:
                return null
        }
    }

    // Function to check if a step is unlocked
    const isStepUnlocked = (stepNumber) => {
        if (stepNumber === 1) return true // Step 1 is always accessible
        // A step is unlocked if the previous step is saved
        // Step 2 unlocks only when step 1 is saved
        // Step 3 unlocks only when step 2 is saved, etc.
        return savedSteps.has(stepNumber - 1)
    }

    // Function to handle step click with locking logic
    const handleStepClick = (stepNumber) => {
        if (isStepUnlocked(stepNumber) && !isGenerating) {
            setActiveStep(stepNumber)
        }
    }

    return (
        <div className="space-y-8">
            <WorkflowSteps
                activeStep={activeStep}
                setActiveStep={handleStepClick}
                savedSteps={savedSteps}
                isStepUnlocked={isStepUnlocked}
                isGenerating={isGenerating}
            />

            {renderStepContent()}

            <div className="flex items-center justify-between pt-8 border-t border-[#e6e6e6]">
                <Button
                    variant="outline"
                    className="gap-2 bg-transparent"
                    onClick={() => !isGenerating && setActiveStep(prev => Math.max(prev - 1, 1))}
                    disabled={loading || isGenerating}
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                </Button>

                <Button
                    className="bg-[#884cff] hover:bg-[#7a3ff0] text-white px-8"
                    onClick={async () => {
                        if (isGenerating) return;
                        try {
                            setError(null) // Clear any previous errors
                            await handleStepSave({})
                            // Only move to next step if we're not on step 1 (step 1 handles navigation in handleRequestSuggestions)
                            if (!error && activeStep !== 1) {
                                // For step 3, the model is saved in handleStepSave, so just navigate
                                if (activeStep === 3 && collectionData?.id) {
                                    try {
                                        const updatedData = await apiService.getCollection(collectionData.id, token)
                                        setCollectionData(updatedData)
                                        const item = updatedData.items?.[0]
                                        const hasModel = item?.selected_model || (item?.uploaded_models && item.uploaded_models.length > 0)
                                        if (hasModel) {
                                            // Step 3 is saved, mark it and navigate to step 4
                                            setSavedSteps(prev => new Set([...prev, 3]))
                                            setActiveStep(4)
                                            return
                                        }
                                    } catch (err) {
                                        console.error('Error checking step 3:', err)
                                    }
                                }
                                if (activeStep === 4 && collectionData?.id) {
                                    try {
                                        const updatedData = await apiService.getCollection(collectionData.id, token)
                                        setCollectionData(updatedData)
                                        const item = updatedData.items?.[0]
                                        const hasProducts = item?.product_images && item.product_images.length > 0
                                        if (hasProducts) {
                                            // Step 4 is saved, mark it and navigate to step 5
                                            setSavedSteps(prev => new Set([...prev, 4]))
                                            setActiveStep(5)
                                            return
                                        }
                                    } catch (err) {
                                        console.error('Error checking step 4:', err)
                                    }
                                }
                                // For other steps, navigate to next unlocked step
                                const nextStep = Math.min(activeStep + 1, 5)
                                if (isStepUnlocked(nextStep)) {
                                    setActiveStep(nextStep)
                                }
                            }
                        } catch (err) {
                            // Error is already set in handleStepSave, just log it
                            console.error('Error in Save and Continue:', err)
                        }
                    }}
                    disabled={loading || !canEdit || isGenerating}
                    title={isGenerating ? "Image generation in progress..." : (canEdit ? "" : "You need Editor or Owner role to save changes")}
                >
                    {loading ? (activeStep === 1 ? 'Generating Suggestions...' : 'Saving...') : 'Save and Continue'}
                </Button>

                <Button
                    variant="ghost"
                    className="text-[#884cff]"
                    onClick={() => {
                        if (isGenerating) return;
                        const nextStep = Math.min(activeStep + 1, 5)
                        if (isStepUnlocked(nextStep)) {
                            setActiveStep(nextStep)
                        }
                    }}
                    disabled={loading || !isStepUnlocked(Math.min(activeStep + 1, 5)) || isGenerating}
                    title={isGenerating ? "Image generation in progress..." : (!isStepUnlocked(Math.min(activeStep + 1, 5)) ? "Complete the current step to unlock the next step" : "")}
                >
                    Next
                </Button>
            </div>
        </div>
    )
}
