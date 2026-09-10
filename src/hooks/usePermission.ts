import { useAuth } from '@/lib/AuthContext';
import { canPerformAction, Permission } from '@/config/roles';

export function usePermission(action: Permission) {
  const { role } = useAuth();
  
  // Mengembalikan true jika role saat ini diizinkan melakukan aksi tersebut
  return canPerformAction(role, action);
}