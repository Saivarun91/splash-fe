// API service layer for communicating with Django backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
import axios from 'axios';
import { generateEnhancedPrompt, generateEnhancedCampaignPrompt } from './ornamentRules';

class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    // Prepare headers object but DO NOT auto-set Content-Type yet
    const headers = {
        ...(options.headers || {})
    };

    const config = {
        ...options,
        headers
    };

    // Auto-add JSON content-type ONLY if the body is a plain JSON string
    const isJSONBody =
        config.body &&
        typeof config.body === "string" &&
        !headers["Content-Type"] &&
        !config.body instanceof FormData;

    if (isJSONBody) {
        headers["Content-Type"] = "application/json";
    }

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            if (response.status === 401) {
                if (typeof window !== "undefined" && !localStorage.getItem("token")) {
                    return null;
                }
            }

            // Extract backend error message
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData?.error) errorMessage = errorData.error;
                else if (errorData?.message) errorMessage = errorData.message;
            } catch { }

            const error = new Error(errorMessage);
            error.status = response.status;
            throw error;
        }

        // Some endpoints return empty body
        const text = await response.text();
        try {
            return text ? JSON.parse(text) : {};
        } catch {
            return text;
        }
    } catch (error) {
        if (
            error.message &&
            error.message.includes("401") &&
            typeof window !== "undefined" &&
            !localStorage.getItem("token")
        ) {
            return null;
        }

        console.error("API request failed:", error);
        throw error;
    }
}


    // HTTP method shortcuts
    async get(endpoint, options = {}) {
        const { params, ...requestOptions } = options;
        let url = endpoint;

        // Handle query parameters
        if (params) {
            const searchParams = new URLSearchParams();
            for (const key of Object.keys(params)) {
                if (params[key] !== undefined && params[key] !== null) {
                    searchParams.append(key, params[key]);
                }
            }
            const queryString = searchParams.toString();
            if (queryString) {
                url += (endpoint.includes('?') ? '&' : '?') + queryString;
            }
        }

        return this.request(url, { ...requestOptions, method: 'GET' });
    }

    async post(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async put(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }

    // User endpoints   
    async login(email, password) {
        console.log('API URL', this.baseURL);
        return this.request('/api/login/', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });
    }

    async register(full_name, username, email, password) {
        console.log(full_name, username, email, password)
        return this.request('/api/register/', {
            method: 'POST',
            body: JSON.stringify({ full_name, username, email, password }),
        })
    }

    async getUserProfile(token) {
        return this.request('/api/profile/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async updateUserProfile(profileData, token) {
        return this.request('/api/profile/update/', {
            method: 'PUT',
            body: JSON.stringify(profileData),
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    // Project endpoints
    async getProjects(token) {
        console.log('Getting projects with token:', token);
        return this.request('/probackendapp/api/projects/', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }

    async getProject(projectId, token) {
        return this.request(`/probackendapp/api/projects/${projectId}/`, {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async createProject(projectData, token) {
        return this.request('/probackendapp/api/projects/create/', {
            method: 'POST',
            body: JSON.stringify(projectData),
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async updateProject(projectId, projectData, token) {
        return this.request(`/probackendapp/api/projects/${projectId}/update/`, {
            method: 'PUT',
            body: JSON.stringify(projectData),
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async updateProjectStatus(projectId, status, token) {
        return this.request(`/probackendapp/api/projects/${projectId}/update/`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async deleteProject(projectId, token) {
        return this.request(`/probackendapp/api/projects/${projectId}/delete/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    // Collection endpoints
    async getCollection(collectionId, token) {
        return this.request(`/probackendapp/api/collections/${collectionId}/`, {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        }

        );
    }

    async updateCollectionDescription(projectId, description, uploadedImage, targetAudience = null, campaignSeason = null) {
        // If there's an uploaded image, use FormData
        if (uploadedImage) {
            const formData = new FormData();
            formData.append('description', description);
            formData.append('uploaded_image', uploadedImage);
            if (targetAudience) {
                formData.append('target_audience', targetAudience);
            }
            if (campaignSeason) {
                formData.append('campaign_season', campaignSeason);
            }

            return fetch(`${this.baseURL}/probackendapp/api/projects/${projectId}/setup/description/`, {
                method: 'POST',
                body: formData,
            }).then(response => response.json());
        }

        // Otherwise, use JSON
        const requestData = { description };
        if (targetAudience) {
            requestData.target_audience = targetAudience;
        }
        if (campaignSeason) {
            requestData.campaign_season = campaignSeason;
        }
        return this.request(`/probackendapp/api/projects/${projectId}/setup/description/`, {
            method: 'POST',
            body: JSON.stringify(requestData),
        });
    }

    async removeWorkflowImage(projectId, collectionId, imageId, category, token, cloudUrl = null) {
        return this.request(`/probackendapp/api/projects/${projectId}/collections/${collectionId}/remove-workflow-image/`, {
            method: 'DELETE',
            body: JSON.stringify({
                image_id: imageId,
                cloud_url: cloudUrl,
                category: category
            }),
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async uploadWorkflowImage(projectId, collectionId, category, images, token) {
        const formData = new FormData();
        formData.append('category', category);

        for (const image of images) {
            formData.append('images', image);
        }

        console.log('Uploading workflow image:', {
            projectId,
            collectionId,
            category,
            imageCount: images.length,
            token: token ? 'present' : 'missing'
        });

        return fetch(`${this.baseURL}/probackendapp/api/projects/${projectId}/collections/${collectionId}/upload-workflow-image/`, {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        }).then(response => {
            console.log('Upload response status:', response.status);
            if (!response.ok) {
                return response.text().then(text => {
                    console.error('Upload failed:', text);
                    throw new Error(`Upload failed: ${response.status} ${text}`);
                });
            }
            return response.json();
        });
    }

    async updateCollectionSelections(projectId, collectionId, selections, uploadedImages = {}) {
        // If there are uploaded images, use FormData
        if (Object.keys(uploadedImages).some(category => uploadedImages[category].length > 0)) {
            const formData = new FormData();

            // Add selections as JSON
            formData.append('selections', JSON.stringify(selections));

            // Add uploaded images for each category
            Object.keys(uploadedImages).forEach(category => {
                uploadedImages[category].forEach((image, index) => {
                    formData.append(`uploaded_${category}_images`, image.file);
                });
            });

            return fetch(`${this.baseURL}/probackendapp/api/projects/${projectId}/collections/${collectionId}/select/`, {
                method: 'POST',
                body: formData,
            }).then(response => response.json());
        }

        // Otherwise, use JSON
        return this.request(`/probackendapp/api/projects/${projectId}/collections/${collectionId}/select/`, {
            method: 'POST',
            body: JSON.stringify(selections),
        });
    }
    async enhanceImage(imageUrl, collectionId, productImagePath, generatedImagePath, token) {
        return this.request(`/probackendapp/api/image/enhance/`, {
            method: 'POST',
            body: JSON.stringify({
                image_url: imageUrl,
                collection_id: collectionId,
                product_image_path: productImagePath,
                generated_image_path: generatedImagePath
            }),
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }

    // AI Image Generation endpoints
    async generateAIImages(collectionId, token, onProgress = null) {
        // Start the Celery task
        const startResponse = await this.request(`/probackendapp/api/collections/${collectionId}/generate-images/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });

        if (!startResponse.success || !startResponse.task_id) {
            throw new Error(startResponse.error || 'Failed to start AI image generation');
        }

        const taskId = startResponse.task_id;

        // Poll for task completion
        return new Promise((resolve, reject) => {
            const pollInterval = setInterval(async () => {
                try {
                    const statusResponse = await this.getTaskStatus(taskId, token);

                    if (onProgress) {
                        onProgress(statusResponse);
                    }

                    if (statusResponse.status === 'SUCCESS') {
                        clearInterval(pollInterval);
                        // Return the result from the task
                        // statusResponse.result contains {success, images, saved_images, total_generated}
                        const result = statusResponse.result || {};
                        resolve({
                            images: result.images || [],
                            saved_images: result.saved_images || [],
                            success: result.success !== false,
                            total_generated: result.total_generated || 0
                        });
                    } else if (statusResponse.status === 'FAILURE' || statusResponse.status === 'REVOKED') {
                        clearInterval(pollInterval);
                        const errorMsg = statusResponse.error ||
                            (typeof statusResponse.result === 'string' ? statusResponse.result : 'Task failed');
                        reject(new Error(errorMsg));
                    }
                    // If status is PENDING or STARTED, continue polling
                } catch (error) {
                    clearInterval(pollInterval);
                    reject(error);
                }
            }, 2000); // Poll every 2 seconds

            // Set a timeout (e.g., 10 minutes)
            setTimeout(() => {
                clearInterval(pollInterval);
                reject(new Error('Task timeout: AI image generation took too long'));
            }, 600000); // 10 minutes timeout
        });
    }

    async saveGeneratedImages(collectionId, selectedImages, token) {
        return this.request(`/probackendapp/api/collections/${collectionId}/save-images/`, {
            method: 'POST',
            body: JSON.stringify({ images: selectedImages }),
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }

    // Product Image endpoints
    async uploadProductImages(collectionId, images, ornamentTypes, token) {
        const formData = new FormData();
        for (const image of images) {
            formData.append('images', image);
        }
        // Append ornament types as JSON array
        if (ornamentTypes && ornamentTypes.length > 0) {
            formData.append('ornament_types', JSON.stringify(ornamentTypes));
        }

        return fetch(`${this.baseURL}/probackendapp/api/collections/${collectionId}/upload-products/`, {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        }).then(response => response.json());
    }

    async deleteProductImage(collectionId, productImageUrl, productImagePath, token) {
        return this.request(`/probackendapp/api/collections/${collectionId}/products/`, {
            method: 'DELETE',
            body: JSON.stringify({
                product_image_url: productImageUrl,
                product_image_path: productImagePath
            }),
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }

    async generateProductModelImages(collectionId, token) {
        return this.request(`/probackendapp/api/collections/${collectionId}/generate-all-product-model-images/`, {
            method: 'POST',
            body: JSON.stringify({}),
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    
    async getTaskStatus(taskId, token) {
        return this.request(`/probackendapp/api/task-status/${taskId}/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async generateProductModelImagesWithPolling(collectionId, token, onProgress = null) {
        // Start the Celery task
        const startResponse = await this.generateProductModelImages(collectionId, token);

        if (!startResponse.success || !startResponse.task_id) {
            throw new Error(startResponse.error || 'Failed to start image generation');
        }

        const taskId = startResponse.task_id;

        // Poll for task completion
        return new Promise((resolve, reject) => {
            const pollInterval = setInterval(async () => {
                try {
                    const statusResponse = await this.getTaskStatus(taskId, token);

                    if (onProgress) {
                        onProgress(statusResponse);
                    }

                    if (statusResponse.status === 'SUCCESS') {
                        clearInterval(pollInterval);
                        // Return the result from the task
                        // statusResponse.result contains {success, message, total_generated}
                        const result = statusResponse.result || {};
                        resolve({
                            success: result.success !== false, // Default to true if not explicitly false
                            message: result.message,
                            total_generated: result.total_generated,
                            task_id: taskId
                        });
                    } else if (statusResponse.status === 'FAILURE' || statusResponse.status === 'REVOKED') {
                        clearInterval(pollInterval);
                        const errorMsg = statusResponse.error ||
                            (typeof statusResponse.result === 'string' ? statusResponse.result : 'Task failed');
                        reject(new Error(errorMsg));
                    }
                    // If status is PENDING or STARTED, continue polling
                } catch (error) {
                    clearInterval(pollInterval);
                    reject(error);
                }
            }, 2000); // Poll every 2 seconds

            // Set a timeout (e.g., 10 minutes)
            setTimeout(() => {
                clearInterval(pollInterval);
                reject(new Error('Task timeout: Image generation took too long'));
            }, 600000); // 10 minutes timeout
        });
    }

    async generateSingleProductModelImages(collectionId, productImageUrl, productImagePath, token) {
        return this.request(`/probackendapp/api/collections/${collectionId}/generate-product-model-images/`, {
            method: 'POST',
            body: JSON.stringify({
                // product_image_url: productImageUrl,
                // product_image_path: productImagePath
                product_url: productImageUrl 
            }),
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async regenerateProductModelImage(collectionId, productImagePath, generatedImagePath, prompt, useDifferentModel = false, newModel = null, token) {
        return this.request(`/probackendapp/api/collections/${collectionId}/regenerate/`, {
            method: 'POST',
            body: JSON.stringify({
                product_image_path: productImagePath,
                generated_image_path: generatedImagePath,
                prompt: prompt,
                use_different_model: useDifferentModel,
                new_model: newModel,
            }),
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    // Model Management endpoints
    async uploadRealModels(collectionId, images, token) {
        const formData = new FormData();
        for (const image of images) {
            formData.append('images', image);
        }

        return fetch(`${this.baseURL}/probackendapp/api/collections/${collectionId}/upload-real-models/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
            body: formData,
        }).then(response => response.json());
    }

    async getAllModels(collectionId, token) {
        return this.request(`/probackendapp/api/collections/${collectionId}/get-all-models/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async selectModel(collectionId, modelType, modelData) {
        return this.request(`/probackendapp/api/collections/${collectionId}/select-model/`, {
            method: 'POST',
            body: JSON.stringify({
                type: modelType,
                model: modelData,
            }),
        });
    }

    // Collaboration endpoints
    async inviteUser(projectId, email, role, token) {
        return this.request(`/probackendapp/api/${projectId}/invite`, {
            method: 'POST',
            body: JSON.stringify({ email, role }),
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async acceptInvite(projectId, token) {
        return this.request(`/probackendapp/api/${projectId}/accept-invite`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async listInvites(projectId, token) {
        return this.request(`/probackendapp/api/${projectId}/invites`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async getAvailableUsers(projectId, token) {
        return this.request(`/probackendapp/api/${projectId}/available-users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async updateMemberRole(projectId, userId, role, token) {
        return this.request(`/probackendapp/api/${projectId}/update-member-role`, {
            method: 'POST',
            body: JSON.stringify({ user_id: userId, role }),
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    // Global invite endpoints (for dashboard)
    async getAllInvites(token) {
        return this.request(`/probackendapp/api/invites/all`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async acceptInviteById(inviteId, token) {
        return this.request(`/probackendapp/api/invites/${inviteId}/accept`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async rejectInvite(inviteId, token) {
        return this.request(`/probackendapp/api/invites/${inviteId}/reject`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    // Role and Permission endpoints
    async getUserRole(projectId, token) {
        return this.request(`/probackendapp/api/projects/${projectId}/user-role/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }
    async removeModel(collectionId, type, model, token) {
        return this.request(`/probackendapp/api/collections/${collectionId}/models/`, {
            method: 'DELETE',
            body: JSON.stringify({ type, model }),
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }


    // Model usage statistics
    async getModelUsageStats(collectionId, token) {
        return this.request(`/probackendapp/api/collections/${collectionId}/model-usage-stats/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    // Image Generation endpoints (imgbackendapp)
    async uploadOrnamentWithBackground(formData, token) {
        const response = await axios.post(`${this.baseURL}/image/`, formData, {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            }
        });
        return response.data;
    }

    async changeBackground(formData, token) {
        const response = await axios.post(`${this.baseURL}/image/change_background/`, formData, {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            }
        });
        return response.data;
    }

    async generateModelWithOrnament(formData, token) {
        // Extract ornament type and measurements from formData
        const ornamentType = formData.get('ornament_type');
        const ornamentMeasurements = formData.get('ornament_measurements');
        const basePrompt = formData.get('prompt') || 'Generate an AI model wearing this ornament';

        // Generate enhanced prompt with fitting rules
        let enhancedPrompt = basePrompt;
        if (ornamentType) {
            try {
                const measurements = ornamentMeasurements ? JSON.parse(ornamentMeasurements) : {};
                enhancedPrompt = generateEnhancedPrompt(basePrompt, ornamentType, measurements);
            } catch (error) {
                console.warn('Failed to parse ornament measurements:', error);
                enhancedPrompt = generateEnhancedPrompt(basePrompt, ornamentType, {});
            }
        }

        // Update the prompt in formData
        formData.set('prompt', enhancedPrompt);

        const response = await axios.post(`${this.baseURL}/image/generate-model/`, formData, {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            }
        });
        return response.data;
    }

    async generateRealModelWithOrnament(formData, token) {
        // Extract ornament type and measurements from formData
        const ornamentType = formData.get('ornament_type');
        const ornamentMeasurements = formData.get('ornament_measurements');
        const basePrompt = formData.get('prompt') || 'Generate realistic image with model wearing ornament';

        // Generate enhanced prompt with fitting rules
        let enhancedPrompt = basePrompt;
        if (ornamentType) {
            try {
                const measurements = ornamentMeasurements ? JSON.parse(ornamentMeasurements) : {};
                enhancedPrompt = generateEnhancedPrompt(basePrompt, ornamentType, measurements);
            } catch (error) {
                console.warn('Failed to parse ornament measurements:', error);
                enhancedPrompt = generateEnhancedPrompt(basePrompt, ornamentType, {});
            }
        }

        // Update the prompt in formData
        formData.set('prompt', enhancedPrompt);

        const response = await axios.post(`${this.baseURL}/image/generate-real-model/`, formData, {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            }
        });
        return response.data;
    }

    async generateCampaignShot(formData, token) {
        // Extract ornament names and base prompt from formData
        const ornamentNames = formData.getAll('ornament_names');
        const basePrompt = formData.get('prompt') || 'Generate campaign shot with multiple ornaments';

        // Generate enhanced prompt with fitting rules for multiple ornaments
        let enhancedPrompt = basePrompt;
        if (ornamentNames && ornamentNames.length > 0) {
            // For campaign shots, we'll use the ornament names as types
            // This is a simplified approach - in a real scenario, you might want to
            // pass ornament types separately
            enhancedPrompt = generateEnhancedCampaignPrompt(basePrompt, ornamentNames, []);
        }

        // Update the prompt in formData
        formData.set('prompt', enhancedPrompt);

        const response = await axios.post(`${this.baseURL}/image/generate-campaign-shot/`, formData, {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            }
        });
        return response.data;
    }

    // Regeneration endpoints
    async regenerateImage(imageId, prompt, token) {
        // Validate MongoDB ObjectId format (24 hex characters)
        if (!imageId || typeof imageId !== 'string') {
            throw new Error('Invalid image ID: image_id is required and must be a string');
        }

        // MongoDB ObjectId must be exactly 24 hex characters
        const objectIdPattern = /^[0-9a-fA-F]{24}$/;
        if (!objectIdPattern.test(imageId)) {
            throw new Error(`Invalid image ID: '${imageId}' is not a valid MongoDB ObjectId. It must be a 24-character hex string. Please ensure you are using mongo_id, not ornament_id.`);
        }

        const formData = new FormData();
        formData.append('image_id', imageId);
        formData.append('prompt', prompt);

        const response = await axios.post(
            `${this.baseURL}/image/regenerate/`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${token || ''}`,
                }
            }
        );
        return response.data;
    }

    async getUserImages(type = null, page = 1, limit = 20) {
        const token = localStorage.getItem('token');
        const params = { page, limit };
        if (type) {
            params.type = type;
        }

        const response = await axios.get(
            `${this.baseURL}/image/user-images/`,
            {
                params,
                headers: {
                    'Authorization': `Bearer ${token || ''}`,
                }
            }
        );
        return response.data;
    }

    // Recent History endpoints
    async getRecentHistory(token, params = {}) {
        return this.get('/probackendapp/api/recent/history/', {
            params,
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async getRecentProjects(token, params = {}) {
        return this.get('/probackendapp/api/recent/projects/', {
            params,
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async getRecentProjectHistory(token, params = {}) {
        return this.get('/probackendapp/api/recent/project-history/', {
            params,
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async getRecentImages(token, limit = 5) {
        return this.get('/probackendapp/api/recent/images/', {
            params: { limit },
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async getCollectionHistory(collectionId, token) {
        return this.get(`/probackendapp/api/collections/${collectionId}/history/`, {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    // Prompt Master endpoints
    async getPrompts(token) {
        return this.get('/probackendapp/api/prompts/', {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async getPrompt(promptId, token) {
        return this.get(`/probackendapp/api/prompts/${promptId}/`, {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async createPrompt(promptData, token) {
        return this.post('/probackendapp/api/prompts/create/', promptData, {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async updatePrompt(promptId, promptData, token) {
        return this.put(`/probackendapp/api/prompts/${promptId}/update/`, promptData, {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async deletePrompt(promptId, token) {
        return this.delete(`/probackendapp/api/prompts/${promptId}/delete/`, {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async getPromptByKey(promptKey, token) {
        return this.get(`/probackendapp/api/prompts/key/${promptKey}/`, {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async initializePrompts(token) {
        return this.post('/probackendapp/api/prompts/initialize/', {}, {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }
}

// Configure axios to add token to all requests
axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token && config.url.includes('/imgbackendapp/')) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const apiService = new ApiService();
export default apiService;
