import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import type { 
  AuthResponse, 
  LoginDto, 
  RegisterDto, 
  UpdateProfileDto, 
  ChangePasswordDto, 
  DeleteAccountDto, 
  UserProfile,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyResetTokenResponse,
} from '@/types/api';

export const authKeys = {
  all: ['auth'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
};

// Login mutation
export function useLogin() {
  const { login } = useAuthStore();

  return useMutation({
    mutationFn: async (data: LoginDto) => {
      return apiClient.post<AuthResponse>('/auth/login', data);
    },
    onSuccess: (response) => {
      login(response.user, response.accessToken, response.refreshToken);
    },
  });
}

// Register mutation
export function useRegister() {
  const { login } = useAuthStore();

  return useMutation({
    mutationFn: async (data: RegisterDto) => {
      return apiClient.post<AuthResponse>('/auth/register', data);
    },
    onSuccess: (response) => {
      login(response.user, response.accessToken, response.refreshToken);
    },
  });
}

// Logout mutation
export function useLogout() {
  const { logout, refreshToken } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    },
    onSettled: () => {
      logout();
      queryClient.clear();
    },
  });
}

// Get current profile
export function useProfile() {
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);

  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: async () => {
      return apiClient.get<UserProfile>('/auth/profile');
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Update profile mutation
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuthStore();

  return useMutation({
    mutationFn: async (data: UpdateProfileDto) => {
      return apiClient.patch<UserProfile>('/auth/profile', data);
    },
    onSuccess: (response) => {
      // Update the profile in cache
      queryClient.invalidateQueries({ queryKey: authKeys.profile() });
      // Update the user in auth store
      const name = [response.firstName, response.lastName].filter(Boolean).join(' ') || response.email;
      updateUser({ name });
    },
  });
}

// Change password mutation
export function useChangePassword() {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ChangePasswordDto) => {
      await apiClient.post('/auth/change-password', data);
    },
    onSuccess: () => {
      // Password changed, all sessions are revoked on backend
      // We keep the current session but could force re-login if needed
    },
  });
}

// Delete account mutation
export function useDeleteAccount() {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DeleteAccountDto) => {
      await apiClient.delete('/auth/account', { data });
    },
    onSuccess: () => {
      logout();
      queryClient.clear();
    },
  });
}

// Forgot password mutation
export function useForgotPassword() {
  return useMutation({
    mutationFn: async (data: ForgotPasswordDto) => {
      await apiClient.post('/auth/forgot-password', data);
    },
  });
}

// Verify reset token
export function useVerifyResetToken(token: string | null) {
  return useQuery({
    queryKey: ['auth', 'verify-reset-token', token],
    queryFn: async () => {
      if (!token) return { valid: false };
      return apiClient.post<VerifyResetTokenResponse>('/auth/verify-reset-token', { token });
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}

// Reset password mutation
export function useResetPassword() {
  return useMutation({
    mutationFn: async (data: ResetPasswordDto) => {
      await apiClient.post('/auth/reset-password', data);
    },
  });
}
