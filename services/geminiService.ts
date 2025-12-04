
import { GoogleGenAI, Chat, Content } from "@google/genai";
import { Message, SavedModel } from "../types";

const DEFAULT_API_KEY = process.env.API_KEY || '';

type ApiProvider = 'google' | 'openai';

export class GeminiService {
  private chatSession: Chat | null = null;
  private client: GoogleGenAI | null = null;
  private apiKey: string = DEFAULT_API_KEY;
  private baseUrl: string = '';
  private provider: ApiProvider = 'google';
  
  // OpenRouter/OpenAI specific state (manual history management)
  private manualHistory: any[] = [];
  private systemInstruction: string = '';
  private currentModel: string = 'gemini-2.5-flash';

  constructor() {
    this.updateConfig(this.apiKey, '');
  }

  /**
   * Updates the API configuration and detects provider
   */
  updateConfig(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey || DEFAULT_API_KEY;
    this.baseUrl = baseUrl || '';

    // Detect Provider
    if (this.baseUrl.includes('openrouter') || this.baseUrl.includes('v1')) {
      this.provider = 'openai';
      this.client = null;
      this.chatSession = null;
    } else {
      this.provider = 'google';
      const config: any = { apiKey: this.apiKey };
      if (this.baseUrl) {
        config.baseUrl = this.baseUrl;
      }
      this.client = new GoogleGenAI(config);
    }
  }

  /**
   * Initializes a chat session with specific character instructions and history
   */
  async startChat(systemInstruction: string, history: Message[], model: string = 'gemini-2.5-flash') {
    this.currentModel = model;
    this.systemInstruction = systemInstruction;

    if (this.provider === 'google' && this.client) {
      // Google SDK Mode
      const formattedHistory: Content[] = history.map(msg => {
        // If it's a memory node, format it as a user note to context
        const text = msg.isMemory 
          ? `[System Note: The following is a summary of the previous conversation to provide context: ${msg.text}]` 
          : msg.text;
          
        return {
          role: msg.role === 'model' && !msg.isMemory ? 'model' : 'user', // Treat memory as user input for context
          parts: [{ text: text }]
        };
      });

      this.chatSession = this.client.chats.create({
        model: model,
        history: formattedHistory,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.9,
          topK: 64,
          topP: 0.95,
        },
      });
    } else {
      // OpenRouter/OpenAI Mode - Prepare history
      this.manualHistory = history.map(msg => {
         const text = msg.isMemory 
          ? `[System Note: Previous conversation summary: ${msg.text}]` 
          : msg.text;

         return {
            role: msg.role === 'model' && !msg.isMemory ? 'assistant' : 'user',
            content: text
         };
      });
    }
  }

  /**
   * Sends a message and returns a stream of text chunks
   */
  async *sendMessageStream(message: string): AsyncGenerator<string, void, unknown> {
    if (this.provider === 'google') {
      // --- Google SDK Path ---
      if (!this.chatSession) throw new Error("Chat session not initialized");

      try {
        const result = await this.chatSession.sendMessageStream({ message });
        for await (const chunk of result) {
          if (chunk.text) {
            yield chunk.text;
          }
        }
      } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
      }
    } else {
      // --- OpenRouter / OpenAI Path ---
      try {
        // Construct full messages array: System -> History -> New Message
        const messages = [
          { role: 'system', content: this.systemInstruction },
          ...this.manualHistory,
          { role: 'user', content: message }
        ];

        // Append user message to local history immediately (optimistic)
        this.manualHistory.push({ role: 'user', content: message });

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            // OpenRouter specific headers
            'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
            'X-Title': 'AI Qing'
          },
          body: JSON.stringify({
            model: this.currentModel,
            messages: messages,
            stream: true,
            temperature: 0.9,
          })
        });

        if (!response.ok) {
          const err = await response.text();
          throw new Error(`API Error ${response.status}: ${err}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = '';
        let fullResponse = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const dataStr = trimmed.slice(6);
              if (dataStr === '[DONE]') continue;

              try {
                const data = JSON.parse(dataStr);
                const content = data.choices?.[0]?.delta?.content || '';
                if (content) {
                  fullResponse += content;
                  yield content;
                }
              } catch (e) {
                // Ignore parse errors for partial chunks
              }
            }
          }
        }
        
        // Append model response to history
        this.manualHistory.push({ role: 'assistant', content: fullResponse });

      } catch (error) {
        console.error("OpenRouter API Error:", error);
        throw error;
      }
    }
  }

  /**
   * Generates suggested user replies based on the context
   */
  async generateReplySuggestions(characterName: string, lastMessageText: string): Promise<string[]> {
    const prompt = `
      Context: The user is roleplaying with a character named "${characterName}".
      The character just said: "${lastMessageText}".
      Task: Generate 3 short, distinct, and natural responses.
      Format: Return ONLY the 3 sentences separated by pipes (|). Example: A|B|C.
    `;

    try {
      let text = '';
      
      if (this.provider === 'google' && this.client) {
        const response = await this.client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: { parts: [{ text: prompt }] }
        });
        text = response.text || '';
      } else {
        // OpenRouter suggestion generation
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
            'X-Title': 'AI Qing'
          },
          body: JSON.stringify({
            model: this.currentModel, // Use current model or a cheap one
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7
          })
        });
        const data = await response.json();
        text = data.choices?.[0]?.message?.content || '';
      }

      if (!text) return [];
      return text.split('|').map(s => s.trim()).filter(s => s.length > 0).slice(0, 3);

    } catch (error) {
      console.warn("Failed to generate suggestions", error);
      return [];
    }
  }

  /**
   * Summarizes a list of messages into a concise paragraph
   */
  async summarizeMessages(messages: Message[], characterName: string): Promise<string> {
    const transcript = messages.map(m => {
        const speaker = m.role === 'user' ? 'User' : characterName;
        const content = m.isMemory ? `(Previous Summary: ${m.text})` : m.text;
        return `${speaker}: ${content}`;
    }).join('\n');

    const prompt = `Summarize the following conversation between User and ${characterName} into a concise paragraph (under 200 words). Capture key events, emotional progress, and important facts.
    
    Conversation:
    ${transcript}`;

    try {
       let summary = '';
       if (this.provider === 'google' && this.client) {
          const response = await this.client.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: { parts: [{ text: prompt }] }
          });
          summary = response.text || '';
       } else {
          const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`,
              'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
              'X-Title': 'AI Qing'
            },
            body: JSON.stringify({
              model: this.currentModel,
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.5
            })
          });
          const data = await response.json();
          summary = data.choices?.[0]?.message?.content || '';
       }
       return summary.trim();
    } catch (e) {
        console.error("Summarization failed", e);
        return "";
    }
  }

  /**
   * Generates a character portrait image using AI
   */
  async generateImage(prompt: string): Promise<string> {
    // Current implementation defaults to Google for image generation as it's specific
    // OpenRouter image gen API might differ. 
    // Fallback to Google if possible or throw if in OpenRouter mode without correct model support
    
    if (this.provider === 'openai') {
       // TODO: Implement OpenAI DALL-E or OpenRouter image generation if needed
       throw new Error("AI Drawing is currently optimized for Google Gemini models.");
    }

    try {
      if (!this.client) throw new Error("Client not initialized");
      
      const enhancedPrompt = `A high quality, detailed anime style character portrait of: ${prompt}. Vertical aspect ratio, standing pose, white or simple background.`;
      const response = await this.client.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: enhancedPrompt }] }
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          }
        }
      }
      throw new Error("No image data returned from API");
    } catch (error) {
      console.error("Image Generation Error:", error);
      throw error;
    }
  }

  /**
   * Lists available models from the API
   */
  async listModels(): Promise<SavedModel[]> {
    try {
      if (this.provider === 'google' && this.client) {
        const response = await this.client.models.list();
        const models: SavedModel[] = [];
        for await (const m of response) {
          if (m.name && (m.name.includes('gemini') || m.name.includes('veo') || m.name.includes('imagen'))) {
              const name = m.name.replace('models/', '');
              models.push({
                  name: name,
                  displayName: m.displayName || name
              });
          }
        }
        return models;
      } else {
        // OpenRouter / OpenAI List
        // Note: Standard OpenAI endpoint is GET /models
        const url = this.baseUrl.endsWith('/') ? `${this.baseUrl}models` : `${this.baseUrl}/models`;
        
        const response = await fetch(url, {
            headers: { 
              'Authorization': `Bearer ${this.apiKey}`,
              'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
              'X-Title': 'AI Qing' // Changed from AI卿
            }
        });
        
        if (!response.ok) throw new Error("Failed to fetch models from OpenRouter/API");
        
        const data = await response.json();
        const models: SavedModel[] = [];
        
        if (data.data && Array.isArray(data.data)) {
            data.data.forEach((m: any) => {
                // Filter for reasonable chat models to avoid spamming the list
                const id = m.id;
                models.push({
                    name: id,
                    displayName: m.name || id
                });
            });
        }
        return models;
      }
    } catch (error) {
      console.error("Failed to list models:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
