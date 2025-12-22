import * as fs from 'fs';
import { TranscriptionWord } from './transcribe';

/**
 * Generate ASS (Advanced SubStation Alpha) captions with CapCut-like styling
 * - Yellow/white text with black outline
 * - Word-by-word karaoke highlighting
 * - Animated scale on active word
 */

interface ASSStyle {
  name: string;
  fontName: string;
  fontSize: number;
  primaryColor: string;    // &HAABBGGRR format
  secondaryColor: string;
  outlineColor: string;
  backColor: string;
  bold: boolean;
  italic: boolean;
  borderStyle: number;
  outline: number;
  shadow: number;
  alignment: number;
  marginL: number;
  marginR: number;
  marginV: number;
}

const DEFAULT_STYLE: ASSStyle = {
  name: 'Default',
  fontName: 'Arial Black',
  fontSize: 48,
  primaryColor: '&H00FFFFFF',    // White
  secondaryColor: '&H0000FFFF',  // Yellow (for karaoke highlight)
  outlineColor: '&H00000000',    // Black outline
  backColor: '&H80000000',       // Semi-transparent black
  bold: true,
  italic: false,
  borderStyle: 1,
  outline: 3,
  shadow: 2,
  alignment: 2,   // Bottom center
  marginL: 20,
  marginR: 20,
  marginV: 40,
};

const HIGHLIGHT_STYLE: ASSStyle = {
  ...DEFAULT_STYLE,
  name: 'Highlight',
  primaryColor: '&H0000FFFF',    // Yellow for highlighted word
  fontSize: 52,
};

export async function generateASSCaptions(
  transcription: { text: string; words: TranscriptionWord[] },
  outputPath: string,
  options: { style?: 'karaoke' | 'word-by-word' | 'sentence' } = {}
): Promise<void> {
  const style = options.style || 'word-by-word';
  
  let assContent = generateASSHeader([DEFAULT_STYLE, HIGHLIGHT_STYLE]);
  
  if (style === 'karaoke') {
    assContent += generateKaraokeEvents(transcription.words);
  } else if (style === 'word-by-word') {
    assContent += generateWordByWordEvents(transcription.words);
  } else {
    assContent += generateSentenceEvents(transcription.words);
  }

  await fs.promises.writeFile(outputPath, assContent, 'utf-8');
  console.log(`Generated ASS captions: ${outputPath}`);
}

function generateASSHeader(styles: ASSStyle[]): string {
  let header = `[Script Info]
Title: Huntaze Auto Captions
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.601
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
`;

  for (const style of styles) {
    header += `Style: ${style.name},${style.fontName},${style.fontSize},${style.primaryColor},${style.secondaryColor},${style.outlineColor},${style.backColor},${style.bold ? 1 : 0},${style.italic ? 1 : 0},0,0,100,100,0,0,${style.borderStyle},${style.outline},${style.shadow},${style.alignment},${style.marginL},${style.marginR},${style.marginV},1\n`;
  }

  header += `
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  return header;
}

function generateWordByWordEvents(words: TranscriptionWord[]): string {
  let events = '';
  
  // Group words into chunks of 3-5 for readability
  const chunks = chunkWords(words, 4);
  
  for (const chunk of chunks) {
    if (chunk.length === 0) continue;
    
    const startTime = formatASSTime(chunk[0].startTime);
    const endTime = formatASSTime(chunk[chunk.length - 1].endTime + 0.3);
    
    // Build text with word-by-word highlight timing
    let text = '';
    for (let i = 0; i < chunk.length; i++) {
      const word = chunk[i];
      const duration = Math.round((word.endTime - word.startTime) * 100);
      
      // Karaoke effect: {\k<duration>}word
      text += `{\\k${duration}}${word.word} `;
    }
    
    events += `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${text.trim()}\n`;
  }
  
  return events;
}

function generateKaraokeEvents(words: TranscriptionWord[]): string {
  let events = '';
  
  // Group into lines of ~6-8 words
  const chunks = chunkWords(words, 6);
  
  for (const chunk of chunks) {
    if (chunk.length === 0) continue;
    
    const startTime = formatASSTime(chunk[0].startTime);
    const endTime = formatASSTime(chunk[chunk.length - 1].endTime + 0.5);
    
    // Build karaoke text with fill effect
    let text = '';
    for (const word of chunk) {
      const duration = Math.round((word.endTime - word.startTime) * 100);
      // \kf = karaoke fill (smooth highlight)
      text += `{\\kf${duration}}${word.word} `;
    }
    
    events += `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${text.trim()}\n`;
  }
  
  return events;
}

function generateSentenceEvents(words: TranscriptionWord[]): string {
  let events = '';
  
  // Group by punctuation or time gaps
  const sentences = groupIntoSentences(words);
  
  for (const sentence of sentences) {
    if (sentence.length === 0) continue;
    
    const startTime = formatASSTime(sentence[0].startTime);
    const endTime = formatASSTime(sentence[sentence.length - 1].endTime + 0.5);
    const text = sentence.map(w => w.word).join(' ');
    
    events += `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${text}\n`;
  }
  
  return events;
}

function chunkWords(words: TranscriptionWord[], chunkSize: number): TranscriptionWord[][] {
  const chunks: TranscriptionWord[][] = [];
  
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize));
  }
  
  return chunks;
}

function groupIntoSentences(words: TranscriptionWord[]): TranscriptionWord[][] {
  const sentences: TranscriptionWord[][] = [];
  let current: TranscriptionWord[] = [];
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    current.push(word);
    
    // Check for sentence end (punctuation or long pause)
    const endsWithPunctuation = /[.!?]$/.test(word.word);
    const longPause = i < words.length - 1 && 
      (words[i + 1].startTime - word.endTime) > 0.8;
    const tooLong = current.length >= 12;
    
    if (endsWithPunctuation || longPause || tooLong) {
      sentences.push(current);
      current = [];
    }
  }
  
  if (current.length > 0) {
    sentences.push(current);
  }
  
  return sentences;
}

function formatASSTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const centiseconds = Math.round((seconds % 1) * 100);
  
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
}
