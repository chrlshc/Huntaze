import { spawn } from 'child_process';
import path from 'path';

export type SocialPlatform = 'instagram' | 'tiktok' | 'reddit';

export interface SocialPublishJob {
  platform: SocialPlatform;
  contentId?: string;
  content: {
    title?: string;
    description?: string;
    mediaUrls: string[];
    tags?: string[];
    caption?: string;
    contentType?: string;
    isNsfw?: boolean;
  };
  caption?: string;
  tags?: string[];
  isNsfw?: boolean;
  subreddit?: string;
  title?: string;
  options?: Record<string, unknown>;
}

export interface AutomationResult {
  ok: boolean;
  platform?: string;
  postId?: string;
  contentId?: string;
  error?: string;
}

export async function runMultiPlatformAutomation(job: SocialPublishJob): Promise<AutomationResult> {
  const pythonBin = process.env.HUNTAZE_PYTHON_BIN || 'python3';
  const scriptPath = path.resolve(process.cwd(), 'automation/multi_platform_traffic.py');
  const payloadB64 = Buffer.from(JSON.stringify(job), 'utf8').toString('base64');

  return new Promise<AutomationResult>((resolve, reject) => {
    const child = spawn(
      pythonBin,
      [scriptPath, '--job-b64', payloadB64],
      {
        env: { ...process.env, HUNTAZE_AUTOMATION_SILENT: '1' },
      }
    );

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    child.stdout.on('data', (data) => stdoutChunks.push(Buffer.from(data)));
    child.stderr.on('data', (data) => stderrChunks.push(Buffer.from(data)));
    child.on('error', (error) => reject(error));

    child.on('close', (code) => {
      const stdout = Buffer.concat(stdoutChunks).toString('utf8').trim();
      const stderr = Buffer.concat(stderrChunks).toString('utf8').trim();
      const lines = stdout.split('\n').filter(Boolean);
      const payload = lines.length ? lines[lines.length - 1] : '{}';

      let parsed: AutomationResult;
      try {
        parsed = JSON.parse(payload) as AutomationResult;
      } catch (parseError) {
        reject(new Error(`Failed to parse automation output: ${payload}\n${stderr}`));
        return;
      }

      if (code !== 0 || !parsed.ok) {
        const errorMessage = parsed.error || `automation exited with code ${code}`;
        reject(new Error(`${errorMessage}${stderr ? `\n${stderr}` : ''}`));
        return;
      }

      resolve(parsed);
    });
  });
}
