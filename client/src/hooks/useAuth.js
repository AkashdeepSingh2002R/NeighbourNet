import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/users/me');
      return data;
    }
  });
}
