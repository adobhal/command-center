/**
 * AI Client Configuration
 * Supports OpenAI and Anthropic APIs
 */

import OpenAI from 'openai';

export type AIProvider = 'openai' | 'anthropic';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}

export class AIClient {
  private client: OpenAI | null = null;
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
    this.initialize();
  }

  private initialize() {
    if (this.config.provider === 'openai') {
      this.client = new OpenAI({
        apiKey: this.config.apiKey,
      });
    } else {
      throw new Error('Anthropic provider not yet implemented');
    }
  }

  /**
   * Get the OpenAI client instance
   */
  getClient(): OpenAI {
    if (!this.client) {
      throw new Error('AI client not initialized');
    }
    return this.client;
  }

  /**
   * Get the default model
   */
  getModel(): string {
    return this.config.model || 'gpt-4o-mini';
  }

  /**
   * Create a chat completion
   */
  async chat(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>) {
    if (!this.client) {
      throw new Error('AI client not initialized');
    }

    return this.client.chat.completions.create({
      model: this.getModel(),
      messages,
      temperature: 0.3, // Lower temperature for more consistent results
    });
  }

  /**
   * Create embeddings
   */
  async createEmbedding(text: string): Promise<number[]> {
    if (!this.client) {
      throw new Error('AI client not initialized');
    }

    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0].embedding;
  }
}

/**
 * Get AI client instance from environment variables
 */
export function getAIClient(): AIClient {
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (openaiKey) {
    return new AIClient({
      provider: 'openai',
      apiKey: openaiKey,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    });
  }

  if (anthropicKey) {
    throw new Error('Anthropic provider not yet implemented');
  }

  throw new Error('No AI API key configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY');
}
