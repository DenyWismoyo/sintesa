// src/data/jobs/masterJobs.ts
import { JobListing } from '@/types/job.types';

/**
 * Seluruh data lowongan kini ditarik murni secara real-time dari internet
 * (RapidAPI JSearch) dan disimpan ke database Firestore / snapshot.
 * Tidak ada lagi data lowongan dummy yang di-hardcode di dalam kode program.
 */
export const MASTER_JOBS: JobListing[] = [];
