import { apiClient } from "./apiClient";

export type UserCountryDto = {
  id: number;
  country_id: number;
  name: string;
  flag_image_url?: string;
  capital?: string;
  continent_name?: string;
  immigration_passed: boolean;
  immigration_passed_at?: string;
  added_at?: string;
};

export type ImmigrationStatusDto = {
  country_id: number;
  user_country_id?: number;
  immigration_passed: boolean;
  immigration_score?: number;
  immigration_completed_at?: string;
  immigration_retry_available_at?: string;
  retry_blocked: boolean;
  retry_remaining_seconds: number;
  already_passed: boolean;
  message: string;
};

export async function getUserCountries() {
  const { data } = await apiClient.get<UserCountryDto[]>("/api/user-countries");
  return data;
}

export async function addUserCountry(countryId: number) {
  const { data } = await apiClient.post("/api/user-countries", { country_id: countryId });
  return data;
}

export async function passImmigration(userCountryId: number) {
  const { data } = await apiClient.patch(`/api/user-countries/${userCountryId}/immigration`);
  return data;
}

export async function getImmigrationStatus(countryId: number) {
  const { data } = await apiClient.get<ImmigrationStatusDto>(`/api/immigration/${countryId}`);
  return data;
}

export async function submitImmigration(countryId: number, score: number) {
  const { data } = await apiClient.post<ImmigrationStatusDto>(`/api/immigration/${countryId}/submit`, { score });
  return data;
}
