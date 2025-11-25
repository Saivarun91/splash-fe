import { useState, useEffect } from "react"
import { Sparkles, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiService } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { useImageGeneration } from "@/context/ImageGenerationContext"

export function GenerateSection({ project, collectionData, onGenerate, canEdit, isOwner = false }) {
    const [generating, setGenerating] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [selectedModel, setSelectedModel] = useState(null)
    const { token } = useAuth()
    const { setIsGenerating } = useImageGeneration()
    // Get the selected model from backend
    useEffect(() => {
        const loadSelectedModel = async () => {
            if (collectionData?.id) {
                try {
                    const response = await apiService.getAllModels(collectionData.id, token)
                    if (response.success && response.selected_model) {
                        setSelectedModel(response.selected_model.local || response.selected_model.cloud)
                    }
                } catch (err) {
                    console.error('Error loading selected model:', err)
                }
            }
        }
        loadSelectedModel()
    }, [collectionData, token])

    const handleGenerate = async () => {
        if (!collectionData?.id) {
            setError('No collection found')
            return
        }

        const productImages = collectionData?.items?.[0]?.product_images
        if (!productImages || productImages.length === 0) {
            setError('Please upload product images first')
            return
        }

        if (!selectedModel) {
            setError('No model selected. Please generate and save models in Step 2')
            return
        }

        setGenerating(true)
        setIsGenerating(true)
        setError(null)
        setSuccess(null)

        try {
            const response = await apiService.generateProductModelImages(
                collectionData.id, token,
            )

            if (response.success) {
                setSuccess(`Generated ${response.total_generated || 0} images successfully!`)
                if (onGenerate) {
                    await onGenerate({ imagesGenerated: true })
                }
                setTimeout(() => setSuccess(null), 5000)
            } else {
                setError(response.error || 'Failed to generate images')
            }
        } catch (err) {
            console.error('Error generating images:', err)
            setError(err.message || 'Failed to generate images')
        } finally {
            setGenerating(false)
            setIsGenerating(false)
        }
    }
    console.log("canEdit", canEdit);
    const hasProducts = collectionData?.items?.[0]?.product_images?.length > 0
    const hasModelSelected = selectedModel !== null

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between py-6 px-6 bg-[#f9f6f2] rounded-lg">
                <div>
                    <h3 className="font-semibold text-[#1a1a1a] mb-1">Generate Final Images</h3>
                    <p className="text-sm text-[#737373]">
                        Combine products with AI models to create final images
                    </p>
                    {hasProducts && hasModelSelected && (
                        <p className="text-xs text-green-600 mt-1">
                            ✓ Ready to generate ({collectionData.items[0].product_images.length} products × 4 variations each)
                        </p>
                    )}
                </div>
                <Button
                    onClick={handleGenerate}
                    disabled={generating || !hasProducts || !hasModelSelected || !isOwner}
                    className="bg-[#884cff] hover:bg-[#7a3ff0] text-white gap-2"
                    title={isOwner ? "" : "You need Owner role to generate images"}
                >
                    <Sparkles className="w-4 h-4" />
                    {generating ? 'Generating...' : 'Generate Product Images'}
                </Button>
            </div>

            {error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            )}

            {success && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-600 text-sm">✓ {success}</p>
                </div>
            )}

            {generating && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <p className="text-blue-600 text-sm">
                            Generating images... This may take several minutes depending on the number of products.
                        </p>
                    </div>
                </div>
            )}

            {(!hasProducts || !hasModelSelected) && !error && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-700 text-sm">
                        {!hasModelSelected && '⚠️ Please select a model (AI or Real) in Step 2'}
                        {!hasProducts && hasModelSelected && '⚠️ Please upload product images in Step 3'}
                    </p>
                </div>
            )}
        </div>
    )
}
