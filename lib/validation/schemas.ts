import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export const registerSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Please confirm your password" }),
  username: z.string().min(3, { message: "Username must be at least 3 characters" }).max(30),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const movieSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  originalTitle: z.string().optional(),
  overview: z.string().min(10, "Overview must be at least 10 characters"),
  posterUrl: z.string().url("Valid poster URL is required"),
  backdropUrl: z.string().url("Valid backdrop URL is required"),
  trailerUrl: z.string().url("Valid trailer URL is required").optional().or(z.literal('')),
  releaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD"),
  releaseYear: z.coerce.number().int().min(1900).max(2100),
  runtimeMinutes: z.coerce.number().int().min(1),
  rating: z.coerce.number().min(0).max(10),
  voteCount: z.coerce.number().int().default(0),
  country: z.string().default("US"),
  director: z.string().optional(),
  genres: z.array(z.string()).min(1, "Select at least one genre"),
  isFeatured: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  contentRights: z.enum(['licensed', 'public_domain', 'owner_uploaded', 'authorized_external', 'pending_review']),
});

export const videoSourceSchema = z.object({
  language: z.enum(['English', 'Hindi', 'Tamil', 'Telugu', 'Spanish', 'French', 'Other']),
  videoUrl: z.string().url("Valid video stream URL is required"),
  streamType: z.enum(['HLS', 'MP4', 'DASH']),
  quality: z.enum(['Auto', '480p', '720p', '1080p', '4K']),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  contentRights: z.enum(['licensed', 'public_domain', 'owner_uploaded', 'authorized_external', 'pending_review']).default('licensed'),
});

export const subtitleSchema = z.object({
  language: z.string().min(1, "Language is required"),
  label: z.string().min(1, "Label is required"),
  subtitleUrl: z.string().min(1, "Valid subtitle URL or path is required"),
  format: z.enum(['vtt', 'srt']),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const adSettingSchema = z.object({
  placement: z.enum(['pre_roll', 'top_banner', 'sidebar', 'under_player', 'footer']),
  isEnabled: z.boolean().default(true),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  ctaText: z.string().default("Learn More"),
  destinationUrl: z.string().url("Valid destination URL is required").optional().or(z.literal('')),
  mediaUrl: z.string().url("Valid image/video media URL is required").optional().or(z.literal('')),
  mediaType: z.enum(['image', 'video', 'custom_html']).default('image'),
  customHtml: z.string().optional(),
  durationSeconds: z.coerce.number().int().min(0).default(15),
  canSkipAfterSeconds: z.coerce.number().int().min(0).default(5),
});

export const searchSchema = z.object({
  q: z.string().optional().default(""),
  genre: z.string().optional(),
  language: z.string().optional(),
  year: z.coerce.number().optional(),
  rating: z.coerce.number().optional(),
  sort: z.enum(['popularity', 'latest', 'rating', 'title']).optional().default('popularity'),
  page: z.coerce.number().int().min(1).default(1),
});
