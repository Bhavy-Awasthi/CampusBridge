const fetch = require('node-fetch');
async function test() {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_GROQ_API_KEY_HERE'
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: 'hello' }],
      temperature: 0.7,
      max_tokens: 500
    })
  });
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Body:', text);
}
test();
