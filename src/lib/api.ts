import axios from 'axios';

const API_BASE_URL = '/api/library';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add a request interceptor to include the access token
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface User {
  user_id: string;
  user_nm: string;
  org_nm: string; // Department
  library_yn: string; // 'Y' or 'N'
  // Add other fields as needed
}

export interface LoginResponse {
  success: boolean;
  accessToken: string;
  message?: string;
}

export interface FacilityInfoParams {
  START_DT_YYYYMMDD: string;
  END_DT_YYYYMMDD: string;
  RES_YYYYMMDD: string;
}

export interface RoomInfoParams {
  START_DT_YYYYMMDD: string;
  END_DT_YYYYMMDD: string;
  ROOM_ID: string;
  RES_YYYYMMDD: string;
}

export interface ReservationParams {
  ROOM_ID: string;
  CREATE_ID: string;
  REMARK: string; // Department name usually
  RES_YYYYMMDD: string;
  RES_HOUR: number;
  ADMIN_YN: string;
}

export interface CancelParams {
  ROOM_ID: string;
  RES_YYYYMMDD: string;
  RES_HOUR: number;
  RES_ID: string;
}

export interface MyReservationParams {
  START_DT: string;
  END_DT: string;
  ROOM_ID?: string;
}

export const libraryApi = {
  login: async (userId: string, userPwd: string): Promise<LoginResponse> => {
    const response = await api.post('/hello/login', { userId, userPwd });
    return response.data.data;
  },

  getAccount: async (): Promise<any> => {
    const response = await api.post('/hello/getAccount');
    return response.data.data;
  },

  getFacilityInfo: async (params: FacilityInfoParams) => {
    const response = await api.post('/work/getFacilityInfo', params);
    return response.data.data;
  },

  getRoom: async (params: RoomInfoParams) => {
    const response = await api.post('/work/getRoom', params);
    return response.data.data;
  },

  getFacilityReservation: async (params: { START_DT: string; END_DT: string; ROOM_ID: string }) => {
    const response = await api.post('/work/getFacilityReservation', params);
    return response.data.data;
  },

  makeReservation: async (params: ReservationParams) => {
    const response = await api.post('/work/makeFacilityreservation', params);
    return response.data.data;
  },

  cancelReservation: async (params: CancelParams) => {
    const response = await api.post('/work/cancelFacilityreservation', params);
    return response.data.data;
  },

  getMyReservation: async (params: MyReservationParams) => {
    const response = await api.post('/work/getMyReservation', params);
    console.log("API getMyReservation raw response:", response.data);
    return response.data; // API returns { success: true, result: [...] } directly
  },
};
