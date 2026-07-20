import { apiClient } from "./apiClient";
import { authTokenStore } from "./authToken";

export type AuthUser = {
  id: string;
  username: string;
  name: string;
  schoolName?: string;
  grade?: string;
  classNumber?: string;
  studentNumber?: string;
  gender?: string;
  avatar?: string;
  createdAt?: string;
};

type AuthResponse = {
  token: string;
  user_id: number;
  username: string;
  name: string;
  avatar?: string;
};

type UserInfoResponse = {
  id: number;
  username: string;
  name: string;
  school_name?: string;
  grade?: number;
  class_num?: number;
  student_num?: number;
  gender?: string;
  avatar?: string;
  created_at?: string;
};

export type SignupPayload = {
  schoolName: string;
  grade: string;
  classNumber: string;
  studentNumber: string;
  lastName: string;
  firstName: string;
  gender: string;
  avatar?: string;
};

function toUser(response: AuthResponse | UserInfoResponse): AuthUser {
  const profile = "grade" in response ? response : null;

  return {
    id: String("user_id" in response ? response.user_id : response.id),
    username: response.username,
    name: response.name,
    schoolName: profile?.school_name,
    grade: profile?.grade == null ? undefined : String(profile.grade),
    classNumber: profile?.class_num == null ? undefined : String(profile.class_num),
    studentNumber: profile?.student_num == null ? undefined : String(profile.student_num),
    gender: profile?.gender,
    avatar: response.avatar,
    createdAt: profile?.created_at,
  };
}

export async function login(username: string, password: string) {
  const { data } = await apiClient.post<AuthResponse>("/api/auth/login", { username, password });
  authTokenStore.set(data.token);
  return toUser(data);
}

export async function signup(payload: SignupPayload) {
  const { data } = await apiClient.post<AuthResponse>("/api/auth/signup", {
    school_name: payload.schoolName,
    grade: Number(payload.grade),
    class_num: Number(payload.classNumber),
    student_num: Number(payload.studentNumber),
    last_name: payload.lastName,
    first_name: payload.firstName,
    gender: payload.gender,
    avatar: payload.avatar || null,
  });
  authTokenStore.set(data.token);
  return toUser(data);
}

export async function getMe() {
  const { data } = await apiClient.get<UserInfoResponse>("/api/auth/me");
  return toUser(data);
}

export async function logout() {
  try {
    await apiClient.post("/api/auth/logout");
  } finally {
    authTokenStore.clear();
  }
}
