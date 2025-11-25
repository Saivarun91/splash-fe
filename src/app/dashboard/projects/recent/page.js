"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/lib/api';
import {
    Clock,
    Calendar,
    Image as ImageIcon,
    FolderOpen,
    Sparkles,
    RefreshCw,
    Filter,
    Download,
    Eye,
    ArrowLeft,
    Loader2,
    Camera
} from 'lucide-react';
import Link from 'next/link';

export default function ProjectsRecentPage() {
    const { user, token } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeFilter, setTimeFilter] = useState(30); // days
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        if (user && token) {
            fetchRecentHistory();
        }
    }, [user, token, timeFilter]);

    const fetchRecentHistory = async (pageNum = 1, append = false) => {
        try {
            if (pageNum === 1) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }
            setError(null);

            const params = {
                page: pageNum,
                limit: 20,
                days: timeFilter
            };

            const response = await apiService.getRecentProjectHistory(token, params);

            if (response.success) {
                if (append) {
                    setHistory(prev => [...prev, ...response.history]);
                } else {
                    setHistory(response.history);
                }

                setHasMore(response.pagination.page < response.pagination.pages);
                setPage(pageNum);
            } else {
                setError('Failed to load recent history');
            }
        } catch (err) {
            console.error('Error fetching recent history:', err);
            setError('Failed to load recent history');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const loadMore = () => {
        if (!loadingMore && hasMore) {
            fetchRecentHistory(page + 1, true);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown date';

        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)} hours ago`;
        } else if (diffInHours < 48) {
            return 'Yesterday';
        } else {
            return date.toLocaleString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: 'Asia/Kolkata'
            });
        }
    };


    const getImageTypeLabel = (imageType) => {
        const typeMap = {
            'white_background': 'White Background',
            'background_replace': 'Background Replace',
            'model_image': 'Model Image',
            'campaign_image': 'Campaign Shot',
            'regenerated': 'Regenerated',
            'model_with_ornament': 'Model with Ornament',
            'campaign_shot': 'Campaign Shot',
            'real_model': 'Real Model'
        };
        return typeMap[imageType] || imageType;
    };

    const getImageTypeIcon = (imageType) => {
        switch (imageType) {
            case 'white_background':
                return <ImageIcon className="w-4 h-4" />;
            case 'background_replace':
                return <RefreshCw className="w-4 h-4" />;
            case 'model_image':
            case 'model_with_ornament':
            case 'real_model':
                return <Sparkles className="w-4 h-4" />;
            case 'campaign_image':
            case 'campaign_shot':
                return <Camera className="w-4 h-4" />;
            case 'regenerated':
                return <RefreshCw className="w-4 h-4" />;
            default:
                return <ImageIcon className="w-4 h-4" />;
        }
    };

    const getImageTypeColor = (imageType) => {
        switch (imageType) {
            case 'white_background':
                return 'bg-gray-100 text-gray-700';
            case 'background_replace':
                return 'bg-blue-100 text-blue-700';
            case 'model_image':
            case 'model_with_ornament':
            case 'real_model':
                return 'bg-purple-100 text-purple-700';
            case 'campaign_image':
            case 'campaign_shot':
                return 'bg-pink-100 text-pink-700';
            case 'regenerated':
                return 'bg-orange-100 text-orange-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    if (loading && history.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
                <div className="flex items-center justify-center h-64">
                    <div className="flex items-center space-x-2">
                        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                        <span className="text-gray-600">Loading recent history...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
            <div className="p-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <Link
                            href="/dashboard/projects"
                            className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Back to Projects
                        </Link>
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-1 h-12 bg-gradient-to-b from-[#7753ff] to-[#ec4899] rounded-full"></div>
                        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-[#7753ff] via-[#a855f7] to-[#ec4899] bg-clip-text text-transparent">
                            Recent History
                        </h1>
                    </div>
                    <p className="text-[#737373] text-lg ml-4 font-medium">
                        Track your recent project image generation activities
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white/80 backdrop-blur-sm border border-purple-100 rounded-2xl p-6 mb-8 shadow-sm">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Filters:</span>
                        </div>

                        <select
                            value={timeFilter}
                            onChange={(e) => setTimeFilter(Number(e.target.value))}
                            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value={7}>Last 7 days</option>
                            <option value={30}>Last 30 days</option>
                            <option value={90}>Last 90 days</option>
                            <option value={365}>Last year</option>
                        </select>

                        <div className="ml-auto text-sm text-gray-600">
                            {history.length} items found
                        </div>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                {/* History List */}
                {history.length === 0 && !loading ? (
                    <div className="text-center py-12">
                        <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                            <Clock className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">No recent project activity</h3>
                        <p className="text-gray-500 mb-6">
                            You haven&apos;t generated any project images recently. Start creating to see your project history here.
                        </p>
                        <Link
                            href="/dashboard/projects/create"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#7753ff] to-[#a855f7] text-white rounded-lg font-semibold hover:from-[#884cff] hover:to-[#b565f8] transition-all duration-300 shadow-md hover:shadow-lg"
                        >
                            <Sparkles className="w-5 h-5" />
                            Create New Project
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {history.map((item, index) => (
                            <div
                                key={`${item.id}-${index}`}
                                className="bg-white/80 backdrop-blur-sm border border-purple-100 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Image Preview */}
                                    <div className="flex-shrink-0">
                                        <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200 group-hover:border-purple-300 transition-colors">
                                            {item.image_url ? (
                                                <img
                                                    src={item.image_url}
                                                    alt={item.image_type}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}
                                            <div
                                                className="w-full h-full flex items-center justify-center bg-gray-100"
                                                style={{ display: item.image_url ? 'none' : 'flex' }}
                                            >
                                                <ImageIcon className="w-8 h-8 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${getImageTypeColor(item.image_type)}`}>
                                                    {getImageTypeIcon(item.image_type)}
                                                    {getImageTypeLabel(item.image_type)}
                                                </div>
                                                {item.type === 'project_image' && item.project && (
                                                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                                                        <FolderOpen className="w-3 h-3" />
                                                        {item.project.name}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 text-sm text-gray-500">
                                                <Clock className="w-4 h-4" />
                                                {formatDate(item.created_at)}
                                            </div>
                                        </div>

                                        {item.prompt && (
                                            <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                                                {item.prompt}
                                            </p>
                                        )}

                                        {item.original_prompt && item.original_prompt !== item.prompt && (
                                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                                                <p className="text-xs font-medium text-orange-700 mb-1">Original Prompt:</p>
                                                <p className="text-orange-600 text-sm line-clamp-2">
                                                    {item.original_prompt}
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3">
                                            {item.image_url && (
                                                <button
                                                    onClick={() => window.open(item.image_url, '_blank')}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View
                                                </button>
                                            )}

                                            {item.image_url && (
                                                <button
                                                    onClick={() => {
                                                        const link = document.createElement('a');
                                                        link.href = item.image_url;
                                                        link.download = `image-${item.id}.png`;
                                                        link.click();
                                                    }}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Download
                                                </button>
                                            )}

                                            {item.type === 'project_image' && item.project && (
                                                <Link
                                                    href={`/dashboard/projects/${item.project.id}`}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <FolderOpen className="w-4 h-4" />
                                                    View Project
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Load More Button */}
                        {hasMore && (
                            <div className="text-center pt-6">
                                <button
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-purple-200 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 hover:border-purple-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loadingMore ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-5 h-5" />
                                            Load More
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}