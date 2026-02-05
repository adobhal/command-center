/**
 * AI-Enhanced Transaction Matching
 * Uses ML to improve matching accuracy
 */

import { getAIClient } from './client';
import { MatchCandidate } from '../reconciliation/types';
import { logger } from '@/lib/shared/utils/logger';

export interface AIMatchEnhancement {
  confidence: number;
  reasoning: string;
  suggestedMatch: boolean;
  riskFactors: string[];
}

export class AIMatchingEnhancer {
  private aiClient: ReturnType<typeof getAIClient>;

  constructor() {
    this.aiClient = getAIClient();
  }

  /**
   * Enhance match confidence using AI
   */
  async enhanceMatch(
    bankTx: {
      description: string;
      amount: number;
      date: Date;
      referenceNumber?: string;
    },
    qbTx: {
      description: string;
      amount: number;
      date: Date;
      referenceNumber?: string;
    },
    baseConfidence: number
  ): Promise<AIMatchEnhancement> {
    try {
      const prompt = this.buildMatchingPrompt(bankTx, qbTx, baseConfidence);

      const response = await this.aiClient.chat([
        {
          role: 'system',
          content: `You are a financial reconciliation expert. Analyze transaction matches and provide confidence scores and reasoning.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ]);

      const content = response.choices[0]?.message?.content || '';
      return this.parseAIResponse(content, baseConfidence);
    } catch (error) {
      logger.error('AI matching enhancement failed', { error });
      // Fallback to base confidence
      return {
        confidence: baseConfidence,
        reasoning: 'AI analysis unavailable',
        suggestedMatch: baseConfidence >= 0.7,
        riskFactors: [],
      };
    }
  }

  /**
   * Build prompt for AI matching analysis
   */
  private buildMatchingPrompt(
    bankTx: any,
    qbTx: any,
    baseConfidence: number
  ): string {
    return `Analyze if these two transactions are likely the same transaction:

Bank Transaction:
- Description: ${bankTx.description || 'N/A'}
- Amount: $${bankTx.amount.toFixed(2)}
- Date: ${bankTx.date.toISOString().split('T')[0]}
- Reference: ${bankTx.referenceNumber || 'N/A'}

QuickBooks Transaction:
- Description: ${qbTx.description || 'N/A'}
- Amount: $${qbTx.amount.toFixed(2)}
- Date: ${qbTx.date.toISOString().split('T')[0]}
- Reference: ${qbTx.referenceNumber || 'N/A'}

Base Confidence Score: ${(baseConfidence * 100).toFixed(0)}%

Provide your analysis in JSON format:
{
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation",
  "suggestedMatch": true/false,
  "riskFactors": ["list of concerns if any"]
}`;
  }

  /**
   * Parse AI response
   */
  private parseAIResponse(content: string, fallbackConfidence: number): AIMatchEnhancement {
    try {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          confidence: Math.max(0, Math.min(1, parsed.confidence || fallbackConfidence)),
          reasoning: parsed.reasoning || 'AI analysis completed',
          suggestedMatch: parsed.suggestedMatch !== false,
          riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors : [],
        };
      }
    } catch (error) {
      logger.warn('Failed to parse AI response', { error, content });
    }

    // Fallback
    return {
      confidence: fallbackConfidence,
      reasoning: 'Could not parse AI response',
      suggestedMatch: fallbackConfidence >= 0.7,
      riskFactors: [],
    };
  }

  /**
   * Batch enhance multiple matches
   */
  async enhanceMatches(
    matches: MatchCandidate[],
    bankTransactions: any[],
    qbTransactions: any[]
  ): Promise<MatchCandidate[]> {
    const enhanced: MatchCandidate[] = [];

    // Process in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < matches.length; i += batchSize) {
      const batch = matches.slice(i, i + batchSize);

      const enhancements = await Promise.all(
        batch.map(async (match) => {
          const bankTx = bankTransactions.find((t) => t.id === match.bankTransactionId);
          const qbTx = qbTransactions.find((t) => t.id === match.transactionId);

          if (!bankTx || !qbTx) {
            return match;
          }

          const enhancement = await this.enhanceMatch(
            {
              description: bankTx.description || '',
              amount: parseFloat(bankTx.amount),
              date: new Date(bankTx.transactionDate),
              referenceNumber: bankTx.referenceNumber,
            },
            {
              description: qbTx.description || '',
              amount: parseFloat(qbTx.amount),
              date: new Date(qbTx.transactionDate),
              referenceNumber: qbTx.referenceNumber,
            },
            match.confidence
          );

          return {
            ...match,
            confidence: enhancement.confidence,
            matchReasons: [
              ...match.matchReasons,
              `AI: ${enhancement.reasoning}`,
              ...(enhancement.riskFactors.length > 0
                ? [`Risks: ${enhancement.riskFactors.join(', ')}`]
                : []),
            ],
          };
        })
      );

      enhanced.push(...enhancements);

      // Rate limiting - wait between batches
      if (i + batchSize < matches.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return enhanced;
  }

  /**
   * Calculate semantic similarity using embeddings
   */
  async calculateSemanticSimilarity(text1: string, text2: string): Promise<number> {
    try {
      const [embedding1, embedding2] = await Promise.all([
        this.aiClient.createEmbedding(text1),
        this.aiClient.createEmbedding(text2),
      ]);

      return this.cosineSimilarity(embedding1, embedding2);
    } catch (error) {
      logger.error('Semantic similarity calculation failed', { error });
      return 0;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
