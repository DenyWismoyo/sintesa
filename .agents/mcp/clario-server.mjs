#!/usr/bin/env node
import readline from 'readline';

/**
 * Clario Cloud Model Context Protocol (MCP) Server
 * Compatible with Antigravity IDE & Antigravity 2.0
 */

const API_KEY = process.env.CLARIO_API_KEY || '';
const PRIMARY_URL = process.env.CLARIO_BASE_URL || 'https://clario.apicloud.my.id/v1';
const BACKUP_URL = process.env.CLARIO_BACKUP_BASE_URL || '';

async function sendClarioRequest(endpoint, payload) {
  const urls = [PRIMARY_URL];
  if (BACKUP_URL && BACKUP_URL !== PRIMARY_URL) {
    urls.push(BACKUP_URL);
  }
  let lastErr = null;

  for (const url of urls) {
    try {
      console.error(`[Clario MCP] Requesting ${url}${endpoint} (model: ${payload.model})...`);
      const t0 = Date.now();
      const res = await fetch(`${url}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(60000)
      });

      console.error(`[Clario MCP] Status: ${res.status} (${Date.now() - t0}ms)`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const json = await res.json();
      console.error(`[Clario MCP] Received response successfully.`);
      return json;
    } catch (e) {
      console.error(`[Clario MCP] Error on ${url}: ${e.message}`);
      lastErr = e;
    }
  }

  throw lastErr || new Error('All Clario endpoints unreachable');
}

async function sendClarioChatWithFallback(messages, requestedModel = 'clario/qwen3.8-27b', options = {}) {
  const candidateModels = Array.from(new Set([
    requestedModel,
    'clario/qwen3.8-27b',
    'clario/deepseek-v4-flash',
    'clario/glm-5.3-flash'
  ]));

  let lastError = null;
  for (const model of candidateModels) {
    try {
      const data = await sendClarioRequest('/chat/completions', {
        model,
        messages,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.max_tokens ?? 1500
      });
      if (data.choices?.[0]?.message?.content) {
        return { content: data.choices[0].message.content, model };
      }
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('All candidate Clario models failed: ' + (lastError?.message || 'unknown'));
}

const TOOLS = [
  {
    name: 'clario_chat',
    description: 'Ask Clario Cloud AI models anything: general chat, business advice, summaries, and answering questions.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'User prompt or question' },
        model: {
          type: 'string',
          description: 'Model ID (e.g. clario/qwen3.8-27b, clario/deepseek-v4-flash, clario/glm-5.3-flash)',
          default: 'clario/qwen3.8-27b'
        },
        system_prompt: { type: 'string', description: 'Optional system instructions' }
      },
      required: ['prompt']
    }
  },
  {
    name: 'clario_code_expert',
    description: 'Solve programming, debugging, architecture, refactoring, and code review tasks using Clario DeepSeek Reasoning.',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string', description: 'Coding task or question' },
        code_context: { type: 'string', description: 'Code snippet, file content, or error trace' },
        language: { type: 'string', description: 'Language (typescript, python, go, etc.)' }
      },
      required: ['task']
    }
  },
  {
    name: 'clario_generate_image',
    description: 'Generate high quality images or banners using Clario Flux 2 Pro.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Detailed visual prompt for image generation' },
        size: {
          type: 'string',
          enum: ['1024x1024', '1792x1024', '1024x1792'],
          default: '1024x1024'
        }
      },
      required: ['prompt']
    }
  }
];

function sendJsonRpc(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  let request;
  try {
    request = JSON.parse(trimmed);
  } catch {
    return;
  }

  const { id, method, params } = request;

  try {
    if (method === 'initialize') {
      sendJsonRpc({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: {
            name: 'clario-mcp-server',
            version: '1.0.0'
          }
        }
      });
      return;
    }

    if (method === 'notifications/initialized') {
      // Notification, no reply needed
      return;
    }

    if (method === 'tools/list') {
      sendJsonRpc({
        jsonrpc: '2.0',
        id,
        result: { tools: TOOLS }
      });
      return;
    }

    if (method === 'tools/call') {
      const toolName = params?.name;
      const args = params?.arguments || {};

      if (toolName === 'clario_chat') {
        const messages = [];
        if (args.system_prompt) {
          messages.push({ role: 'system', content: args.system_prompt });
        }
        messages.push({ role: 'user', content: args.prompt });

        const model = args.model || 'clario/qwen3.8-27b';
        const result = await sendClarioChatWithFallback(messages, model, {
          temperature: 0.3,
          max_tokens: 1200
        });

        sendJsonRpc({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: result.content || '[No response]' }]
          }
        });
        return;
      }

      if (toolName === 'clario_code_expert') {
        const systemPrompt = 'You are an elite software architect and senior code reviewer. Provide concise, clean, production-grade solutions with explanations.';
        let userContent = args.task;
        if (args.code_context) {
          userContent += `\n\nCODE CONTEXT:\n\`\`\`${args.language || ''}\n${args.code_context}\n\`\`\``;
        }

        const result = await sendClarioChatWithFallback([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ], 'clario/deepseek-v4-flash', {
          temperature: 0.1,
          max_tokens: 2048
        });

        sendJsonRpc({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: result.content || '[No response]' }]
          }
        });
        return;
      }

      if (toolName === 'clario_generate_image') {
        const data = await sendClarioRequest('/images/generations', {
          model: 'clario/flux-2-pro',
          prompt: args.prompt,
          size: args.size || '1024x1024',
          n: 1
        });

        const urls = (data.data || []).map(d => d.url || d.b64_json).join('\n');
        sendJsonRpc({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: urls || 'Image generated successfully.' }]
          }
        });
        return;
      }

      // Unknown tool
      sendJsonRpc({
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Tool '${toolName}' not found.` }
      });
      return;
    }

    // Default unknown method
    if (id !== undefined) {
      sendJsonRpc({
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method '${method}' not supported.` }
      });
    }
  } catch (err) {
    if (id !== undefined) {
      sendJsonRpc({
        jsonrpc: '2.0',
        id,
        error: { code: -32000, message: err.message || 'Internal MCP server error' }
      });
    }
  }
});
