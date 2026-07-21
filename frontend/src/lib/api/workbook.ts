import type { WorkbookRecord } from "@/lib/storage";
import { apiClient } from "./apiClient";

type WorkbookResponse = {
  id?: number;
  country_id: number;
  capital?: string;
  language?: string;
  population?: string;
  area?: string;
  population_comparison?: string;
  area_comparison?: string;
  flag_image?: string;
  map_image?: string;
  flag_observation?: string;
  continent?: string;
  map_location?: string;
  greeting?: string;
  research_topic?: string;
  similarity_with_korea?: string;
  difference_from_korea?: string;
  question?: string;
  sources?: string;
  completed?: number;
  completed_at?: string;
};

function toRecord(data: WorkbookResponse): WorkbookRecord {
  return {
    capital: data.capital ?? "",
    language: data.language ?? "",
    population: data.population ?? "",
    area: data.area ?? "",
    populationComparison: data.population_comparison ?? "",
    areaComparison: data.area_comparison ?? "",
    flagImage: data.flag_image ?? "",
    mapImage: data.map_image ?? "",
    flagObservation: data.flag_observation ?? "",
    continent: data.continent ?? "",
    mapLocation: data.map_location ?? "",
    greeting: data.greeting ?? "",
    researchTopic: data.research_topic ?? "",
    similarityWithKorea: data.similarity_with_korea ?? "",
    differenceFromKorea: data.difference_from_korea ?? "",
    question: data.question ?? "",
    sources: data.sources ?? "",
  };
}

function toPayload(record: WorkbookRecord) {
  return {
    capital: record.capital,
    language: record.language,
    population: record.population,
    area: record.area,
    population_comparison: record.populationComparison,
    area_comparison: record.areaComparison,
    flag_image: record.flagImage,
    map_image: record.mapImage,
    flag_observation: record.flagObservation,
    continent: record.continent,
    map_location: record.mapLocation,
    greeting: record.greeting,
    research_topic: record.researchTopic,
    similarity_with_korea: record.similarityWithKorea,
    difference_from_korea: record.differenceFromKorea,
    question: record.question,
    sources: record.sources,
  };
}

export async function getWorkbook(countryId: number) {
  const { data } = await apiClient.get<WorkbookResponse>(`/api/workbooks/${countryId}`);
  return { record: toRecord(data), completed: data.completed === 1 };
}

export async function getCompletedWorkbookCountryIds() {
  const { data } = await apiClient.get<number[]>("/api/workbooks/completed-country-ids");
  return data;
}

export async function saveWorkbook(countryId: number, record: WorkbookRecord) {
  const { data } = await apiClient.patch<WorkbookResponse>(`/api/workbooks/${countryId}`, toPayload(record));
  return { record: toRecord(data), completed: data.completed === 1 };
}

export async function completeWorkbook(countryId: number) {
  const { data } = await apiClient.patch<{ workbook: WorkbookResponse; stamp_created: boolean }>(`/api/workbooks/${countryId}/complete`);
  return { record: toRecord(data.workbook), stampCreated: data.stamp_created };
}
