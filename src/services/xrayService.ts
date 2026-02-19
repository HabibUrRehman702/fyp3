import apiClient, { ApiResponse, handleApiError } from './api';

export interface AIAnalysis {
  _id: string;
  patientId: string;
  xrayImageUrl: string;
  klGrade: '0' | '1' | '2' | '3' | '4';
  severity: 'Normal' | 'Minimal' | 'Moderate' | 'Severe' | 'Very Severe';
  riskScore: number;
  oaStatus: boolean;
  gradCamUrl?: string;
  recommendations: string[];
  analysisDate: string;
  createdAt: string;
  updatedAt: string;
}

class XRayService {
  // Upload and analyze X-ray
  async analyzeXRay(formData: FormData): Promise<{ analysis: AIAnalysis; message: string }> {
    try {
      const response = await apiClient.post('/api/ai/analyze-xray', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Get all analyses
  async getAnalyses(): Promise<{ analyses: AIAnalysis[] }> {
    try {
      const response = await apiClient.get('/api/ai/analyses');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Get single analysis by ID
  async getAnalysisById(id: string): Promise<{ analysis: AIAnalysis }> {
    try {
      const response = await apiClient.get(`/api/ai/analyses/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export const xrayService = new XRayService();
