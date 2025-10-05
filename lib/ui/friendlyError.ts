export type FriendlyError = {
  title: string
  description?: string
  retry?: boolean
  supportId?: string
}

export function toFriendlyError(res: Response, body?: any): FriendlyError {
  const rid = res.headers.get('x-request-id') ?? body?.requestId ?? body?.rid
  const supportId = rid ? `#${rid}` : undefined

  switch (res.status) {
    case 400:
      return { title: 'Demande incomplète ou invalide.', retry: false, supportId }
    case 401:
      return { title: 'Vous devez vous connecter.', retry: false, supportId }
    case 403:
      return { title: 'Action non autorisée.', retry: false, supportId }
    case 404:
      return { title: 'Introuvable.', retry: false, supportId }
    case 413:
      return { title: 'Fichier trop volumineux.', retry: false, supportId }
    case 429:
      return { title: 'Trop de requêtes. Réessayez dans un instant.', retry: true, supportId }
    default:
      if (res.status >= 500) return { title: 'Un problème est survenu de notre côté. Réessayez.', retry: true, supportId }
      return { title: "Impossible d’effectuer l’action.", retry: true, supportId }
  }
}

