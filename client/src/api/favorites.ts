import axios from 'axios';

export const getFavorites = async (userId: string): Promise<string[]> =>
  (await axios.get(`/api/favorites/${userId}`)).data;

export const addFavorite = async (userId: string, itemId: string): Promise<void> => {
  await axios.post('/api/favorites', { userId, itemId });
};

export const removeFavorite = async (userId: string, itemId: string): Promise<void> => {
  await axios.delete('/api/favorites', { data: { userId, itemId } });
};
