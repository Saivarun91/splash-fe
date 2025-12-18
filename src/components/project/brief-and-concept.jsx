"use client"

import { useState, useEffect } from "react"
import { FileText } from "lucide-react"

export function BriefAndConcept({ onRequestSuggestions, collectionData, suggestionsRequested: parentSuggestionsRequested, canEdit = true, onFormDataChange }) {
    const [description, setDescription] = useState("")
    const [targetAudience, setTargetAudience] = useState("")
    const [campaignSeason, setCampaignSeason] = useState("")
    const [hasDescription, setHasDescription] = useState(false)

    // Load existing data from collectionData
    useEffect(() => {
        if (collectionData?.description) {
            setDescription(collectionData.description)
            setHasDescription(true)
        }
        if (collectionData?.target_audience) {
            setTargetAudience(collectionData.target_audience)
        }
        if (collectionData?.campaign_season) {
            setCampaignSeason(collectionData.campaign_season)
        }
    }, [collectionData?.description, collectionData?.target_audience, collectionData?.campaign_season])

    // Expose form data to parent component
    useEffect(() => {
        if (onFormDataChange) {
            onFormDataChange({
                description,
                targetAudience,
                campaignSeason,
                hasDescription
            })
        }
    }, [description, targetAudience, campaignSeason, hasDescription, onFormDataChange])

    const handleDescriptionChange = (e) => {
        const value = e.target.value
        setDescription(value)
        setHasDescription(value.trim().length > 0)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#e6e6e6] rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[#708090]" />
                </div>
                <div>
                    <h3 className="font-bold text-[#1a1a1a]">Brief & Concept</h3>
                    <p className="text-sm text-[#708090]">Define project vision and upload inspiration</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="space-y-3">
                    <label htmlFor="project-description" className="block text-sm font-medium text-[#1a1a1a]">Project Description <span className="text-[#708090] font-normal">(Optional)</span></label>
                    <textarea
                        id="project-description"
                        value={description}
                        onChange={handleDescriptionChange}
                        placeholder="Enter your project description (optional)..."
                        className="w-full h-32 px-4 py-3 border border-[#e6e6e6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#884cff] focus:border-transparent resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                        disabled={!canEdit}
                    />
                </div>
                <div className="flex justify-center w-full items-center gap-3">

                    <div className="space-y-3 w-1/2">
                        <label htmlFor="target-audience" className="block text-sm font-medium text-[#1a1a1a]">Target Audience</label>
                        <input
                            id="target-audience"
                            type="text"
                            value={targetAudience}
                            onChange={(e) => setTargetAudience(e.target.value)}
                            placeholder="Enter target audience..."
                            className="w-full px-4 py-3 border border-[#e6e6e6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#884cff] focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                            disabled={!canEdit}
                        />
                    </div>

                    <div className="space-y-3 w-1/2">
                        <label htmlFor="campaign-season" className="block text-sm font-medium text-[#1a1a1a]">Campaign Season</label>
                        <input
                            id="campaign-season"
                            type="text"
                            value={campaignSeason}
                            onChange={(e) => setCampaignSeason(e.target.value)}
                            placeholder="Enter campaign season..."
                            className="w-full px-4 py-3 border border-[#e6e6e6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#884cff] focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                            disabled={!canEdit}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
