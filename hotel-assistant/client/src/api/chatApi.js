const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function sendMessage(message, history = [], conversationId = '') {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, conversationId }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.reply || `Server error: ${response.status}`);
  }

  return response.json();
}
