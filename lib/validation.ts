import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const updateProfileSchema = z.object({
  dob: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  bloodGroup: z.string().optional(),
  address: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
