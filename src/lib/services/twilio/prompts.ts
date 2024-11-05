export const TWILIO_RESPONSE_PROMPT = `Generate a concise, personalized response to this constituent message.
Keep the response under 160 characters (SMS limit).

Consider:
- The specific issue they raised
- Their tone and formality level
- The urgency of their concern

Response must include:
1. Acknowledgment of specific issue
2. Confirmation of receipt
3. Brief next step or action
4. Professional closing

Style:
- Professional but warm
- Specific to their concern
- No political promises
- No generic language

Example format:
"Thank you for raising [specific issue]. We've received your message and will [specific action]. We appreciate your [specific contribution/concern]."`;