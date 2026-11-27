import type {
  Arc,
  AuthorAnnouncement,
  Chapter,
  ChapterComment,
  NovelInfo,
  RecommendedStory,
} from '../types';
import {SITE_CONFIG} from './siteConfig';

/**
 * File cầu nối dữ liệu — mọi nội dung tĩnh có thể chỉnh sửa đã được gom gọn
 * về duy nhất file `src/data/siteConfig.ts`.
 */

export const NOVEL_INFO: NovelInfo = {
  title: SITE_CONFIG.storyTitle,
  subtitle: SITE_CONFIG.subtitle,
  author: SITE_CONFIG.authorName,
  genres: SITE_CONFIG.genres,
  statusText: SITE_CONFIG.status,
  updateSchedule: SITE_CONFIG.updateSchedule,
  coverImage: SITE_CONFIG.coverImage,
  bannerImage: SITE_CONFIG.bannerImage,
  tagline: SITE_CONFIG.subtitle,
  synopsis: SITE_CONFIG.synopsis,
};

export const ARCS: Arc[] = SITE_CONFIG.arcs;

export const CHAPTERS: Chapter[] = SITE_CONFIG.chapters;

export const AUTHOR_ANNOUNCEMENT: AuthorAnnouncement = {
  title: SITE_CONFIG.authorNoticeTitle,
  updatedAt: SITE_CONFIG.authorNoticeDate,
  nextReleaseLabel: SITE_CONFIG.updateSchedule,
  nextReleaseTitle: '',
  progressNote: '',
  message: SITE_CONFIG.authorNoticeContent,
};

export const RECOMMENDED_SERIES: RecommendedStory[] = SITE_CONFIG.relatedWorks;

export const INITIAL_COMMENTS: ChapterComment[] = SITE_CONFIG.initialComments;
