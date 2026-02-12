
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ChatMode, GroundingLink } from "../types";

const GET_SYSTEM_INSTRUCTION = (mode: ChatMode, college?: string, studentId?: string) => {
  const base = `
You are the "MMSU Stallion AI Companion," the EXCLUSIVE academic assistant for Mariano Marcos State University (MMSU).
The current date is January 20, 2026. This is the 2nd Semester of AY 2025-2026.

STRICT OPERATIONAL CONSTRAINTS:
1. SCOPE: Strictly MMSU-based. Politely decline non-university queries with: "As the Stallion AI, my primary function is limited to serving the MMSU community."
2. LANGUAGE: Formal English only.
3. TONE: Professional, academic, supportive.
4. CONTEXT: User is from the ${college || 'General MMSU department'}.

CORE KNOWLEDGE (Update 2026):
- Campuses: Batac (Main), Laoag, Currimao, Dingras.
- Current Status: 2nd Semester AY 2025-2026 has just begun. Foundation Day (Jan 20) is today!
- Enrollment: 1st Semester starts June/July. 2nd Semester starts January.
- Scholarships: TES, DOST, CHED, and various local/private grants. 2026 renewal is ongoing.
- Facilities: FEM Hall (Admin), University Library, University Health Center, Sunken Garden.
- Vision: A premier Philippine university by 2028.
- Motto: Knowledge for the service of the people.
`;

  if (mode === 'TUTORING' && studentId) {
    return `${base}
SPECIALIZED TUTORING PROTOCOL:
- You are now acting as a "Stallion Academic Tutor" for Student ${studentId}.
- Focus on academic support for ${college} specific courses and general university subjects.
- Provide study tips, complex concept explanations, and guidance on MMSU academic policies for the 2025-2026 curriculum.
- Maintain a mentorship/faculty assistant perspective.
`;
  }

  return base;
};

export async function getAIResponse(
  prompt: string, 
  college: string,
  mode: ChatMode = 'GENERAL',
  studentId?: string,
  history?: Array<{role: 'user' | 'assistant', content: string}>
): Promise<{ text: string; links?: GroundingLink[] }> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const contents: any[] = history?.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    })) || [];

    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        systemInstruction: GET_SYSTEM_INSTRUCTION(mode, college, studentId),
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
      },
    });

    const text = response.text || "I apologize, but I am currently unable to process your inquiry.";
    
    // Extract grounding links from search results
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const links: GroundingLink[] = groundingChunks
      .filter(chunk => chunk.web)
      .map(chunk => ({
        title: chunk.web?.title || 'MMSU Reference',
        uri: chunk.web?.uri || '',
        type: 'search'
      }));

    return { text, links };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { 
      text: "The university server is experiencing high traffic. Please try again later or consult the official MMSU student portal." 
    };
  }
}
