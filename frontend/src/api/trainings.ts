import { api } from './client';
import type { TrainingDetail, TrainingSummary, TrainingPage } from '../types';

export async function fetchTrainings(): Promise<TrainingSummary[]> {
  const res = await api.get('/trainings');
  return res.data.trainings as TrainingSummary[];
}

export async function fetchTraining(id: string): Promise<TrainingDetail> {
  const res = await api.get(`/trainings/${id}`);
  return res.data.training as TrainingDetail;
}

export async function createTraining(input: {
  title: string;
  subtitle?: string;
}): Promise<TrainingSummary> {
  const res = await api.post('/trainings', input);
  return res.data.training as TrainingSummary;
}

export async function updateTraining(
  id: string,
  input: { title?: string; subtitle?: string | null; active?: boolean; sort_order?: number },
): Promise<void> {
  await api.patch(`/trainings/${id}`, input);
}

export async function deleteTraining(id: string): Promise<void> {
  await api.delete(`/trainings/${id}`);
}

export async function uploadPages(id: string, files: File[]): Promise<TrainingPage[]> {
  const form = new FormData();
  files.forEach((f) => form.append('pages', f));
  const res = await api.post(`/trainings/${id}/pages`, form);
  return res.data.pages as TrainingPage[];
}

export async function reorderPages(id: string, order: string[]): Promise<TrainingPage[]> {
  const res = await api.patch(`/trainings/${id}/pages/reorder`, { order });
  return res.data.pages as TrainingPage[];
}

export async function deletePage(id: string, pageId: string): Promise<TrainingPage[]> {
  const res = await api.delete(`/trainings/${id}/pages/${pageId}`);
  return res.data.pages as TrainingPage[];
}
