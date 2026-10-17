import { fetchServerData } from "./client";
import type { AlertDetailResponse, AlertListItemResponse } from "@/types/api";

export type AlertDetail = AlertDetailResponse;

export async function getAlerts(limit: number = 50): Promise<AlertListItemResponse[]> {
  return fetchServerData<AlertListItemResponse[]>(`/alerts?limit=${limit}`);
}

export async function getAlertById(alertId: string): Promise<AlertDetail> {
  return fetchServerData<AlertDetail>(`/alerts/${alertId}`);
}