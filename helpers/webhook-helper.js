/**
 * Webhook Helper - Captura y verificación de webhooks
 *
 * Usa un servicio como webhook.site para capturar
 * los POSTs que hace el sistema
 */

const axios = require('axios');

class WebhookHelper {
  constructor() {
    this.webhookUrl = process.env.WEBHOOK_TEST_URL || null;
    this.capturedWebhooks = [];
  }

  /**
   * Establece la URL única para este test
   */
  setWebhookUrl(url) {
    this.webhookUrl = url;
  }

  /**
   * Obtiene la URL única para capturar webhooks
   * Requiere webhook.site o similar
   */
  async createWebhookCapture() {
    try {
      // Opción 1: Crear URL única en webhook.site
      const response = await axios.post('https://webhook.site/');
      this.webhookUrl = response.data.url;
      this.webhookId = response.data.uuid;
      console.log(`✓ Webhook created: ${this.webhookUrl}`);
      return this.webhookUrl;
    } catch (error) {
      console.error('Error creating webhook:', error.message);
      return null;
    }
  }

  /**
   * Obtiene los webhooks capturados
   */
  async getCapturedWebhooks() {
    if (!this.webhookId) {
      console.error('No webhook ID set');
      return [];
    }

    try {
      const response = await axios.get(`https://webhook.site/token/${this.webhookId}/requests`);
      const requests = response.data.data || [];
      this.capturedWebhooks = requests.map(req => ({
        id: req.uuid,
        method: req.method,
        url: req.url,
        headers: req.headers || {},
        body: this._parseBody(req.content),
        timestamp: req.created_at,
      }));
      return this.capturedWebhooks;
    } catch (error) {
      console.error('Error fetching webhook requests:', error.message);
      return [];
    }
  }

  /**
   * Busca webhook por contenido
   */
  async findWebhookByContent(searchKey, searchValue) {
    const webhooks = await this.getCapturedWebhooks();
    return webhooks.filter(webhook => {
      const bodyValue = this._getNestedValue(webhook.body, searchKey);
      return bodyValue === searchValue;
    });
  }

  /**
   * Verifica que se recibió el webhook en tiempo esperado
   */
  async verifyWebhookReceived(expectedBody, timeout = 10000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const webhooks = await this.getCapturedWebhooks();

      for (const webhook of webhooks) {
        const matches = this._bodyMatches(webhook.body, expectedBody);
        if (matches) {
          return {
            received: true,
            webhook,
            matchedAt: new Date(),
          };
        }
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return {
      received: false,
      webhook: null,
      matchedAt: null,
    };
  }

  /**
   * Verifica valores específicos en el webhook
   */
  async verifyWebhookData(expectedValues, timeout = 10000) {
    const result = await this.verifyWebhookReceived(expectedValues, timeout);

    if (!result.received) {
      return {
        received: false,
        results: {},
      };
    }

    const webhook = result.webhook;
    const results = {};

    for (const [key, expectedValue] of Object.entries(expectedValues)) {
      const actualValue = this._getNestedValue(webhook.body, key);
      results[key] = {
        expected: expectedValue,
        actual: actualValue,
        passed: actualValue === expectedValue,
      };
    }

    return {
      received: true,
      webhook,
      results,
      allPassed: Object.values(results).every(r => r.passed),
    };
  }

  /**
   * Limpiar webhooks capturados
   */
  async clearWebhooks() {
    if (!this.webhookId) {
      console.error('No webhook ID set');
      return false;
    }

    try {
      await axios.delete(`https://webhook.site/token/${this.webhookId}`);
      this.capturedWebhooks = [];
      console.log('✓ Webhook cleared');
      return true;
    } catch (error) {
      console.error('Error clearing webhook:', error.message);
      return false;
    }
  }

  /**
   * Obtén el último webhook capturado
   */
  async getLatestWebhook() {
    const webhooks = await this.getCapturedWebhooks();
    return webhooks.length > 0 ? webhooks[0] : null;
  }

  /**
   * Verifica método HTTP del webhook
   */
  async verifyWebhookMethod(expectedMethod, timeout = 10000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const webhooks = await this.getCapturedWebhooks();
      const found = webhooks.find(w => w.method === expectedMethod);

      if (found) {
        return {
          found: true,
          webhook: found,
        };
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return {
      found: false,
      webhook: null,
    };
  }

  /**
   * Utilidades privadas
   */

  _parseBody(content) {
    try {
      return JSON.parse(content);
    } catch {
      return { raw: content };
    }
  }

  _getNestedValue(obj, path) {
    if (!obj) return undefined;
    return path.split('.').reduce((current, prop) => {
      return current?.[prop];
    }, obj);
  }

  _bodyMatches(body, expectedBody) {
    for (const [key, value] of Object.entries(expectedBody)) {
      const actualValue = this._getNestedValue(body, key);
      if (actualValue !== value) {
        return false;
      }
    }
    return true;
  }
}

module.exports = new WebhookHelper();