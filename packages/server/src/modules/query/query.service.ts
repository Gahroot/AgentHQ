import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../config';
import { AppError } from '../../middleware/error-handler';
import { logger } from '../../middleware/logger';
import { toolDefinitions, executeTool, SourceRecord } from './query.tools';

const SYSTEM_PROMPT = `You are an AI assistant for AgentHQ, a collaboration hub for AI agents. You answer questions about the organization's data by using the provided tools.

Guidelines:
- ALWAYS use tools to fetch real data before answering. Never guess or fabricate data.
- You may call multiple tools in a single turn if needed.
- Common intent mappings:
  - "performers", "top agents", "bottom agents", "rankings" → use re_get_leaderboard
  - "metrics", "volume", "deals", "revenue" → use re_get_metrics
  - "transactions", "deals", "listings" → use re_list_transactions
  - "agents", "who is online", "team" → use list_agents
  - "activity", "what happened", "recent actions" → use query_activity
  - "posts", "updates", "messages" → use list_posts or search_posts
  - "insights", "trends", "recommendations" → use list_insights
  - "channels" → use list_channels
- If the data is insufficient to answer the question, say so honestly.
- Provide concise, direct answers. Use specific numbers and names from the data.
- When ranking or comparing, clearly state the criteria and ordering.`;

export interface QueryResult {
  question: string;
  answer: string;
  sources: SourceRecord[];
}

export const queryService = {
  async answerQuestion(orgId: string, question: string, context?: Record<string, unknown>): Promise<QueryResult> {
    if (!config.anthropic.apiKey) {
      throw new AppError(503, 'QUERY_UNAVAILABLE', 'Query service is not configured. Set ANTHROPIC_API_KEY to enable.');
    }

    const client = new Anthropic({
      apiKey: config.anthropic.apiKey,
      timeout: config.anthropic.timeoutMs,
    });

    const allSources: SourceRecord[] = [];

    const messages: Anthropic.Messages.MessageParam[] = [
      {
        role: 'user',
        content: context
          ? `Context: ${JSON.stringify(context)}\n\nQuestion: ${question}`
          : question,
      },
    ];

    let roundtrips = 0;

    while (roundtrips < config.anthropic.maxToolRoundtrips) {
      let response: Anthropic.Messages.Message;
      try {
        response = await client.messages.create({
          model: config.anthropic.model,
          max_tokens: config.anthropic.maxTokens,
          system: SYSTEM_PROMPT,
          tools: toolDefinitions,
          messages,
        });
      } catch (err) {
        if (err instanceof Anthropic.AuthenticationError) {
          throw new AppError(503, 'QUERY_AUTH_ERROR', 'Failed to authenticate with AI provider.');
        }
        if (err instanceof Anthropic.RateLimitError) {
          throw new AppError(429, 'QUERY_RATE_LIMITED', 'AI provider rate limit exceeded. Try again later.');
        }
        if (err instanceof Anthropic.APIError) {
          logger.error({ err }, 'Anthropic API error');
          throw new AppError(502, 'QUERY_API_ERROR', 'AI provider returned an error.');
        }
        throw err;
      }

      if (response.stop_reason === 'end_turn') {
        const textBlocks = response.content.filter(
          (b): b is Anthropic.Messages.TextBlock => b.type === 'text'
        );
        const answer = textBlocks.map((b) => b.text).join('\n');

        const deduped = deduplicateSources(allSources);
        return { question, answer, sources: deduped };
      }

      if (response.stop_reason === 'tool_use') {
        const toolUseBlocks = response.content.filter(
          (b): b is Anthropic.Messages.ToolUseBlock => b.type === 'tool_use'
        );

        messages.push({ role: 'assistant', content: response.content });

        const toolResults = await Promise.all(
          toolUseBlocks.map(async (block) => {
            try {
              const result = await executeTool(orgId, block.name, block.input as Record<string, unknown>);
              allSources.push(...result.sources);
              return {
                type: 'tool_result' as const,
                tool_use_id: block.id,
                content: JSON.stringify(result.data),
              };
            } catch (err) {
              logger.warn({ err, tool: block.name }, 'Tool execution failed');
              return {
                type: 'tool_result' as const,
                tool_use_id: block.id,
                content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
                is_error: true as const,
              };
            }
          })
        );

        messages.push({ role: 'user', content: toolResults });
        roundtrips++;
        continue;
      }

      // Unexpected stop reason — extract whatever text is available
      const textBlocks = response.content.filter(
        (b): b is Anthropic.Messages.TextBlock => b.type === 'text'
      );
      const answer = textBlocks.map((b) => b.text).join('\n') || 'Unable to generate an answer.';
      return { question, answer, sources: deduplicateSources(allSources) };
    }

    throw new AppError(500, 'QUERY_TIMEOUT', `Query exceeded maximum tool roundtrips (${config.anthropic.maxToolRoundtrips}).`);
  },
};

function deduplicateSources(sources: SourceRecord[]): SourceRecord[] {
  const seen = new Set<string>();
  return sources.filter((s) => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
}
