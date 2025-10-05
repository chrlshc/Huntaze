type Opts = { directValueEnv?: string; secretNameEnv?: string }

export async function getSecretFromEnv(opts: Opts): Promise<string | undefined> {
  const { directValueEnv, secretNameEnv } = opts
  if (directValueEnv && process.env[directValueEnv]) return process.env[directValueEnv]
  if (secretNameEnv && process.env[secretNameEnv]) return process.env[secretNameEnv]
  return undefined
}

