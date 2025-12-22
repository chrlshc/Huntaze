/**
 * Fan Notes & Context Module
 * 
 * Système de notes sur les fans pour l'IA et les créateurs.
 */

export {
  fanNotesService,
  FanNotesService,
  type FanNote,
  type FanProfile,
  type NoteCategory,
  type NoteSource,
  type CreateNoteInput,
  type UpdateNoteInput,
  type FanNotesFilter,
} from './fan-notes.service';

export {
  enrichFanContext,
  generateEnrichedSystemPrompt,
  extractPotentialNotes,
  type EnrichedFanContext,
} from './fan-context-enricher';
