import { fetchServerData } from "./client";

export interface SurveyPayload {
  student_id: string;
  q01: number; q02: number; q03: number; q04: number;
  q05: number; q06: number; q07: number; q08: number;
  q09: number; q10: number; q11: number; q12: number;
}

export interface SurveySummary {
  total_respondents: number;
  mean_dimension_1: number | null;
  mean_dimension_2: number | null;
  mean_dimension_3: number | null;
  global_mean: number | null;
}

export async function submitSurvey(data: SurveyPayload): Promise<{ id: string }> {
  return fetchServerData<{ id: string }>("/surveys", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getSurveysSummary(): Promise<SurveySummary> {
  return fetchServerData<SurveySummary>("/surveys/summary");
}