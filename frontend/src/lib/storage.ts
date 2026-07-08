export type User = {
  id: string;
  name: string;
  grade?: string;
  classNumber?: string;
  studentNumber?: string;
  gender?: string;
};

export type TravelCountryInfo = {
  countryName: string;
  flagImage: string;
  displayName: string;
  area: string;
  population: string;
  language: string;
  capital: string;
  continent: string;
  mapImage: string;
  travelPurpose: string;
  placesToVisit: string;
  localPhrase: string;
  travelTips: string;
  landmark: string;
  foodToTry: string;
  packingList: string;
  cautions: string;
  weatherNote: string;
  freeMemo: string;
};

export type WorkbookRecord = {
  capital: string;
  language: string;
  population: string;
  area: string;
  populationComparison: string;
  areaComparison: string;
  flagImage: string;
  mapImage: string;
  flagObservation: string;
  continent: string;
  mapLocation: string;
  greeting: string;
  researchTopic: string;
  similarityWithKorea: string;
  differenceFromKorea: string;
  question: string;
  sources: string;
};

export type PassportState = {
  user: User | null;
  immigrationCompleted: string[];
  workbookCompleted: string[];
  addedCountries: string[];
  travelInfo: Record<string, TravelCountryInfo>;
  workbookNotes: Record<string, string>;
  workbookRecords: Record<string, WorkbookRecord>;
};

export const defaultState: PassportState = {
  user: null,
  immigrationCompleted: [],
  workbookCompleted: [],
  addedCountries: [],
  travelInfo: {},
  workbookNotes: {},
  workbookRecords: {},
};
