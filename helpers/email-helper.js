/**
 * Email Helper - Verificación de emails usando Mailhog API
 *
 * Mailhog captura emails en desarrollo sin enviarlos realmente
 * API: http://localhost:8025/api/
 */

const axios = require('axios');
const { TIMEOUTS, RETRIES } = require('./test-constants');

const MAILHOG_API_URL = 'http://localhost:8025/api';

class EmailHelper {
  /**
   * Obtiene todos los emails capturados por Mailhog
   */
  async getAllEmails() {
    try {
      const response = await axios.get(`${MAILHOG_API_URL}/v2/messages`);
      return response.data.items || [];
    } catch (error) {
      console.error('Error fetching emails from Mailhog:', error.message);
      return [];
    }
  }

  /**
   * Busca email por destinatario
   */
  async getEmailsByTo(recipient) {
    const emails = await this.getAllEmails();
    return emails.filter(email => {
      const to = email.To || [];
      return to.some(t => t.Mailbox && t.Mailbox.includes(recipient.split('@')[0]));
    });
  }

  /**
   * Busca email por asunto
   */
  async getEmailsBySubject(subjectPart) {
    const emails = await this.getAllEmails();
    return emails.filter(email => {
      const subject = email.Content?.Headers?.Subject?.[0] || '';
      return subject.toLowerCase().includes(subjectPart.toLowerCase());
    });
  }

  /**
   * Obtiene el email más reciente para un destinatario
   */
  async getLatestEmailTo(recipient) {
    const emails = await this.getEmailsByTo(recipient);
    return emails.length > 0 ? emails[0] : null;
  }

  /**
   * Verifica que un email llegó a los destinatarios esperados
   * dentro del timeout especificado
   */
  async verifyEmailDelivery(expectedRecipients, timeout = TIMEOUTS.EMAIL_DELIVERY) {
    const startTime = Date.now();
    const results = {};

    for (const recipient of expectedRecipients) {
      let found = false;
      while (Date.now() - startTime < timeout) {
        const emails = await this.getEmailsByTo(recipient);
        if (emails.length > 0) {
          found = true;
          results[recipient] = { delivered: true, timestamp: new Date() };
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      if (!found) {
        results[recipient] = { delivered: false, timestamp: null };
      }
    }

    return results;
  }

  /**
   * Verifica contenido del email
   */
  async verifyEmailContent(email, checks) {
    const results = {};

    // Verificar asunto
    if (checks.subject) {
      const subject = email.Content?.Headers?.Subject?.[0] || '';
      results.subject = {
        expected: checks.subject,
        actual: subject,
        passed: typeof checks.subject === 'string'
          ? subject.includes(checks.subject)
          : checks.subject.some(s => subject.includes(s)),
      };
    }

    // Verificar contenido HTML
    if (checks.bodyContains) {
      const html = email.Content?.Body || '';
      const bodyChecks = Array.isArray(checks.bodyContains)
        ? checks.bodyContains
        : [checks.bodyContains];

      results.bodyContains = {};
      for (const check of bodyChecks) {
        results.bodyContains[check] = html.includes(check);
      }
    }

    // Verificar campos específicos (JSON en email)
    if (checks.jsonFields) {
      const html = email.Content?.Body || '';
      results.jsonFields = {};
      for (const [field, expected] of Object.entries(checks.jsonFields)) {
        const regex = new RegExp(`"${field}"\\s*:\\s*["\d]([^",}]+)`, 'i');
        const match = html.match(regex);
        results.jsonFields[field] = {
          expected,
          found: match ? match[1] : null,
          passed: match ? match[1].toString() === expected.toString() : false,
        };
      }
    }

    return results;
  }

  /**
   * Verifica que el email tiene adjunto PDF
   */
  async verifyEmailAttachment(email, filename = null) {
    const mimeparts = email.MIME?.Parts || [];
    const hasPDF = mimeparts.some(part => {
      const contentType = part.Headers?.['Content-Type']?.[0] || '';
      if (!contentType.includes('application/pdf')) return false;
      if (filename) {
        const disposition = part.Headers?.['Content-Disposition']?.[0] || '';
        return disposition.includes(filename);
      }
      return true;
    });
    return hasPDF;
  }

  /**
   * Limpia todos los emails de Mailhog
   */
  async clearAllEmails() {
    try {
      await axios.delete(`${MAILHOG_API_URL}/v1/messages`);
      console.log('✓ Mailhog limpiado');
      return true;
    } catch (error) {
      console.error('Error clearing Mailhog:', error.message);
      return false;
    }
  }

  /**
   * Obtiene estadísticas de emails
   */
  async getEmailStats() {
    try {
      const response = await axios.get(`${MAILHOG_API_URL}/v2/messages`);
      const items = response.data.items || [];
      return {
        total: response.data.total || items.length,
        count: items.length,
        unread: items.filter(e => !e.Read).length,
      };
    } catch (error) {
      console.error('Error getting email stats:', error.message);
      return { total: 0, count: 0, unread: 0 };
    }
  }
}

module.exports = new EmailHelper();