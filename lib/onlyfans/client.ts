// lib/onlyfans/client.ts
import axios, { AxiosInstance } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { prisma } from '@/lib/prisma';
import { safeDecrypt } from '@/lib/security/crypto';

// Proxy résidentiel (Format: http://user:pass@host:port)
const PROXY_URL = process.env.ONLYFANS_PROXY_URL;

// Token public OnlyFans - TODO: Move to env var
const OF_APP_TOKEN = process.env.OF_APP_TOKEN || '33d57ade8c02dbc5a333db99ff9ae26a';

export interface OnlyFansSession {
  isValid: boolean;
  username?: string;
  displayName?: string;
  userId?: string;
  error?: string;
}

export async function getOnlyFansClient(userId: string): Promise<AxiosInstance> {
  // 1. Récupérer les identifiants de l'user en DB
  const user = await prisma.users.findUnique({
    where: { id: parseInt(userId, 10) },
    select: { of_cookies: true, of_user_agent: true },
  });

  if (!user || !user.of_cookies || !user.of_user_agent) {
    throw new Error("L'utilisateur n'a pas connecté son compte OnlyFans.");
  }

  // 🛡️ SÉCURITÉ: Déchiffrer les cookies stockés
  const decryptedCookies = safeDecrypt(user.of_cookies);

  // 2. Configurer le Proxy Agent (masque l'IP serveur)
  const httpsAgent = PROXY_URL ? new HttpsProxyAgent(PROXY_URL) : undefined;

  // 3. Créer l'instance Axios configurée
  const client = axios.create({
    baseURL: 'https://onlyfans.com',
    httpsAgent,
    headers: {
      'User-Agent': user.of_user_agent,
      Cookie: decryptedCookies,
      Accept: 'application/json, text/plain, */*',
      'App-Token': OF_APP_TOKEN,
      'x-bc': '', // Token browser (souvent inclus dans les cookies)
    },
  });

  return client;
}

// Vérifier si la session est toujours valide
export async function checkSessionStatus(userId: string): Promise<OnlyFansSession> {
  try {
    const client = await getOnlyFansClient(userId);

    // Appel à l'API "Me" pour voir qui est connecté
    const response = await client.get('/api2/v2/users/me');

    return {
      isValid: true,
      username: response.data.username,
      displayName: response.data.name,
      userId: response.data.id?.toString(),
    };
  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number }; message?: string };
    console.error(`Erreur session User ${userId}:`, axiosError.response?.status);
    
    // Si 401 ou 403, la session a expiré
    return {
      isValid: false,
      error: axiosError.message || 'Session invalide',
    };
  }
}
