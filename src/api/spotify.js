import axios from 'axios';

const CLIENT_ID = process.env.REACT_APP_CLIENT_ID;
const REDIRECT_URI = process.env.REACT_APP_REDIRECT_URI;
const SCOPES = process.env.REACT_APP_SCOPES;

let accessToken = null;

const apiClient = axios.create({
    baseURL: 'https://api.spotify.com/v1',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(
    (config) => {
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      } else {
        console.error('No access token available');
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

apiClient.interceptors.response.use(
    (response) => response.data,
    (error) => {
        console.error('API Error:', error);
        return Promise.reject(error.response || error.message);
    }
);

export const authenticateUser = () => {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPES}&response_type=token&show_dialog=true`;
    window.location.href = authUrl;
};

export const setToken = (token) => {
    accessToken = token;
}

export const getToken = () => {
  return accessToken;
}

export const fetchUser = () => apiClient.get('/me');
export const fetchFollowedArtists = () => apiClient.get('/me/following?type=artist&limit=50');
export const fetchFollowedArtistsCursor = (cursor) => apiClient.get(`/me/following?type=artist&limit=50&after=${cursor}`);
export const fetchArtistAlbums = (artistId) => apiClient.get(`/artists/${artistId}/albums?include_groups=album,single&market=US&limit=50`)