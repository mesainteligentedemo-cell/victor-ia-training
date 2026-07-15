/**
 * Supabase Helper - Verificación de datos en tabla tracker_results
 *
 * Se conecta a Supabase y verifica que los datos fueron insertados
 * correctamente en la tabla tracker_results
 */

const { createClient } = require('@supabase/supabase-js');

class SupabaseHelper {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
    this.supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
    this.client = null;
  }

  /**
   * Inicializa el cliente de Supabase
   */
  initialize() {
    if (!this.client) {
      try {
        this.client = createClient(this.supabaseUrl, this.supabaseKey);
        console.log('✓ Supabase client initialized');
        return true;
      } catch (error) {
        console.error('Error initializing Supabase:', error.message);
        return false;
      }
    }
    return true;
  }

  /**
   * Busca un registro por sessionId
   */
  async findBySessionId(sessionId) {
    this.initialize();
    try {
      const { data, error } = await this.client
        .from('tracker_results')
        .select('*')
        .eq('sessionId', sessionId)
        .single();

      if (error) {
        console.error('Error fetching session:', error.message);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error in findBySessionId:', error.message);
      return null;
    }
  }

  /**
   * Busca registros por usuario
   */
  async findByUser(userName) {
    this.initialize();
    try {
      const { data, error } = await this.client
        .from('tracker_results')
        .select('*')
        .eq('user', userName)
        .order('createdAt', { ascending: false });

      if (error) {
        console.error('Error fetching user sessions:', error.message);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error in findByUser:', error.message);
      return [];
    }
  }

  /**
   * Obtiene el registro más reciente de un usuario
   */
  async getLatestSessionForUser(userName) {
    const sessions = await this.findByUser(userName);
    return sessions.length > 0 ? sessions[0] : null;
  }

  /**
   * Verifica que todos los campos esperados existan
   */
  async verifyRequiredFields(sessionId, requiredFields) {
    const record = await this.findBySessionId(sessionId);
    if (!record) {
      return { found: false, missingFields: requiredFields };
    }

    const results = {};
    const missingFields = [];

    for (const field of requiredFields) {
      const value = this._getNestedValue(record, field);
      results[field] = {
        exists: value !== undefined && value !== null,
        value: value,
      };
      if (value === undefined || value === null) {
        missingFields.push(field);
      }
    }

    return {
      found: true,
      results,
      missingFields,
      allFieldsPresent: missingFields.length === 0,
    };
  }

  /**
   * Verifica valores específicos de campos
   */
  async verifyFieldValues(sessionId, expectedValues) {
    const record = await this.findBySessionId(sessionId);
    if (!record) {
      return { found: false, results: {} };
    }

    const results = {};

    for (const [field, expected] of Object.entries(expectedValues)) {
      const actual = this._getNestedValue(record, field);
      results[field] = {
        expected,
        actual,
        passed: actual === expected,
      };
    }

    return {
      found: true,
      results,
      allPassed: Object.values(results).every(r => r.passed),
    };
  }

  /**
   * Verifica el rango de valores numéricos
   */
  async verifyNumericRange(sessionId, fieldRanges) {
    const record = await this.findBySessionId(sessionId);
    if (!record) {
      return { found: false, results: {} };
    }

    const results = {};

    for (const [field, range] of Object.entries(fieldRanges)) {
      const value = this._getNestedValue(record, field);
      const isInRange = value >= range.min && value <= range.max;
      results[field] = {
        value,
        min: range.min,
        max: range.max,
        inRange: isInRange,
      };
    }

    return {
      found: true,
      results,
      allInRange: Object.values(results).every(r => r.inRange),
    };
  }

  /**
   * Verifica que el timestamp esté reciente
   */
  async verifyRecentTimestamp(sessionId, withinSeconds = 60) {
    const record = await this.findBySessionId(sessionId);
    if (!record) {
      return { found: false, recent: false };
    }

    const createdAt = new Date(record.createdAt);
    const now = new Date();
    const diffSeconds = (now - createdAt) / 1000;

    return {
      found: true,
      createdAt,
      now,
      diffSeconds,
      recent: diffSeconds <= withinSeconds,
    };
  }

  /**
   * Cuenta registros para un usuario
   */
  async countSessionsForUser(userName) {
    this.initialize();
    try {
      const { count, error } = await this.client
        .from('tracker_results')
        .select('*', { count: 'exact' })
        .eq('user', userName);

      if (error) {
        console.error('Error counting sessions:', error.message);
        return 0;
      }
      return count || 0;
    } catch (error) {
      console.error('Error in countSessionsForUser:', error.message);
      return 0;
    }
  }

  /**
   * Obtiene el valor de un campo anidado (e.g., "neurociencia.oxitocina")
   */
  _getNestedValue(obj, path) {
    return path.split('.').reduce((current, prop) => {
      return current?.[prop];
    }, obj);
  }

  /**
   * Obtiene todas las conexiones para auditoría
   */
  async getAllSessions(limit = 100) {
    this.initialize();
    try {
      const { data, error } = await this.client
        .from('tracker_results')
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching all sessions:', error.message);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error in getAllSessions:', error.message);
      return [];
    }
  }
}

module.exports = new SupabaseHelper();