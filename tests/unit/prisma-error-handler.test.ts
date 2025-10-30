import { describe, it, expect } from 'vitest';
import { Prisma } from '@prisma/client';

/**
 * Tests unitaires pour le gestionnaire d'erreurs Prisma
 * Valide le mapping des erreurs Prisma aux codes HTTP
 */

// Implementation for testing
function handlePrismaError(error: unknown): {
  status: number;
  message: string;
} {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return {
          status: 409,
          message: 'Un enregistrement avec ces données existe déjà'
        };
      
      case 'P2025':
        return {
          status: 404,
          message: 'Enregistrement non trouvé'
        };
      
      case 'P2003':
        return {
          status: 400,
          message: 'Référence invalide'
        };
      
      default:
        return {
          status: 500,
          message: 'Erreur de base de données'
        };
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return {
      status: 503,
      message: 'Service de base de données indisponible'
    };
  }

  return {
    status: 500,
    message: 'Erreur interne du serveur'
  };
}

describe('Prisma Error Handler', () => {
  describe('PrismaClientKnownRequestError', () => {
    it('should handle P2002 unique constraint violation', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: { target: ['email'] }
        }
      );

      const result = handlePrismaError(error);

      expect(result.status).toBe(409);
      expect(result.message).toBe('Un enregistrement avec ces données existe déjà');
    });

    it('should handle P2025 record not found', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '5.0.0',
          meta: {}
        }
      );

      const result = handlePrismaError(error);

      expect(result.status).toBe(404);
      expect(result.message).toBe('Enregistrement non trouvé');
    });

    it('should handle P2003 foreign key constraint violation', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        {
          code: 'P2003',
          clientVersion: '5.0.0',
          meta: { field_name: 'userId' }
        }
      );

      const result = handlePrismaError(error);

      expect(result.status).toBe(400);
      expect(result.message).toBe('Référence invalide');
    });

    it('should handle unknown Prisma error codes', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unknown error',
        {
          code: 'P9999',
          clientVersion: '5.0.0',
          meta: {}
        }
      );

      const result = handlePrismaError(error);

      expect(result.status).toBe(500);
      expect(result.message).toBe('Erreur de base de données');
    });

    it('should handle P2001 record does not exist', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Record does not exist',
        {
          code: 'P2001',
          clientVersion: '5.0.0',
          meta: {}
        }
      );

      const result = handlePrismaError(error);

      expect(result.status).toBe(500);
      expect(result.message).toBe('Erreur de base de données');
    });

    it('should handle P2014 relation violation', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Relation violation',
        {
          code: 'P2014',
          clientVersion: '5.0.0',
          meta: {}
        }
      );

      const result = handlePrismaError(error);

      expect(result.status).toBe(500);
      expect(result.message).toBe('Erreur de base de données');
    });
  });

  describe('PrismaClientInitializationError', () => {
    it('should handle database connection failure', () => {
      const error = new Prisma.PrismaClientInitializationError(
        'Cannot connect to database',
        '5.0.0',
        'P1001'
      );

      const result = handlePrismaError(error);

      expect(result.status).toBe(503);
      expect(result.message).toBe('Service de base de données indisponible');
    });

    it('should handle invalid database URL', () => {
      const error = new Prisma.PrismaClientInitializationError(
        'Invalid database URL',
        '5.0.0',
        'P1013'
      );

      const result = handlePrismaError(error);

      expect(result.status).toBe(503);
      expect(result.message).toBe('Service de base de données indisponible');
    });
  });

  describe('Generic Errors', () => {
    it('should handle standard Error', () => {
      const error = new Error('Generic error');

      const result = handlePrismaError(error);

      expect(result.status).toBe(500);
      expect(result.message).toBe('Erreur interne du serveur');
    });

    it('should handle string errors', () => {
      const error = 'String error';

      const result = handlePrismaError(error);

      expect(result.status).toBe(500);
      expect(result.message).toBe('Erreur interne du serveur');
    });

    it('should handle null error', () => {
      const error = null;

      const result = handlePrismaError(error);

      expect(result.status).toBe(500);
      expect(result.message).toBe('Erreur interne du serveur');
    });

    it('should handle undefined error', () => {
      const error = undefined;

      const result = handlePrismaError(error);

      expect(result.status).toBe(500);
      expect(result.message).toBe('Erreur interne du serveur');
    });

    it('should handle object without proper type', () => {
      const error = { message: 'Custom error' };

      const result = handlePrismaError(error);

      expect(result.status).toBe(500);
      expect(result.message).toBe('Erreur interne du serveur');
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle duplicate email registration', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the fields: (`email`)',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: { target: ['email'] }
        }
      );

      const result = handlePrismaError(error);

      expect(result.status).toBe(409);
      expect(result.message).toContain('existe déjà');
    });

    it('should handle user not found during update', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'An operation failed because it depends on one or more records that were required but not found. Record to update not found.',
        {
          code: 'P2025',
          clientVersion: '5.0.0',
          meta: { cause: 'Record to update not found.' }
        }
      );

      const result = handlePrismaError(error);

      expect(result.status).toBe(404);
      expect(result.message).toBe('Enregistrement non trouvé');
    });

    it('should handle invalid foreign key reference', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed on the field: `userId`',
        {
          code: 'P2003',
          clientVersion: '5.0.0',
          meta: { field_name: 'userId' }
        }
      );

      const result = handlePrismaError(error);

      expect(result.status).toBe(400);
      expect(result.message).toBe('Référence invalide');
    });

    it('should handle database timeout', () => {
      const error = new Prisma.PrismaClientInitializationError(
        'Timed out fetching a new connection from the connection pool',
        '5.0.0',
        'P1008'
      );

      const result = handlePrismaError(error);

      expect(result.status).toBe(503);
      expect(result.message).toBe('Service de base de données indisponible');
    });
  });

  describe('Beta-specific Scenarios', () => {
    it('should handle beta invite code already used', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the fields: (`code`)',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: { target: ['code'] }
        }
      );

      const result = handlePrismaError(error);

      expect(result.status).toBe(409);
    });

    it('should handle subscription record not found', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Record to update not found',
        {
          code: 'P2025',
          clientVersion: '5.0.0',
          meta: {}
        }
      );

      const result = handlePrismaError(error);

      expect(result.status).toBe(404);
    });

    it('should handle invalid user reference in subscription', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        {
          code: 'P2003',
          clientVersion: '5.0.0',
          meta: { field_name: 'userId' }
        }
      );

      const result = handlePrismaError(error);

      expect(result.status).toBe(400);
    });
  });

  describe('Error Message Localization', () => {
    it('should return French error messages', () => {
      const errors = [
        {
          error: new Prisma.PrismaClientKnownRequestError('', {
            code: 'P2002',
            clientVersion: '5.0.0',
            meta: {}
          }),
          expectedMessage: 'Un enregistrement avec ces données existe déjà'
        },
        {
          error: new Prisma.PrismaClientKnownRequestError('', {
            code: 'P2025',
            clientVersion: '5.0.0',
            meta: {}
          }),
          expectedMessage: 'Enregistrement non trouvé'
        },
        {
          error: new Prisma.PrismaClientKnownRequestError('', {
            code: 'P2003',
            clientVersion: '5.0.0',
            meta: {}
          }),
          expectedMessage: 'Référence invalide'
        },
        {
          error: new Prisma.PrismaClientInitializationError('', '5.0.0', 'P1001'),
          expectedMessage: 'Service de base de données indisponible'
        }
      ];

      errors.forEach(({ error, expectedMessage }) => {
        const result = handlePrismaError(error);
        expect(result.message).toBe(expectedMessage);
      });
    });
  });

  describe('HTTP Status Code Mapping', () => {
    it('should map to correct HTTP status codes', () => {
      const mappings = [
        { code: 'P2002', expectedStatus: 409 }, // Conflict
        { code: 'P2025', expectedStatus: 404 }, // Not Found
        { code: 'P2003', expectedStatus: 400 }, // Bad Request
        { code: 'P9999', expectedStatus: 500 }  // Internal Server Error
      ];

      mappings.forEach(({ code, expectedStatus }) => {
        const error = new Prisma.PrismaClientKnownRequestError('', {
          code,
          clientVersion: '5.0.0',
          meta: {}
        });

        const result = handlePrismaError(error);
        expect(result.status).toBe(expectedStatus);
      });
    });

    it('should return 503 for initialization errors', () => {
      const error = new Prisma.PrismaClientInitializationError(
        'Connection failed',
        '5.0.0',
        'P1001'
      );

      const result = handlePrismaError(error);

      expect(result.status).toBe(503);
    });

    it('should return 500 for unknown errors', () => {
      const error = new Error('Unknown error');

      const result = handlePrismaError(error);

      expect(result.status).toBe(500);
    });
  });
});
