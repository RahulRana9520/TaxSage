// Test OpenRouter API Key
const API_KEY = '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';

async function testOpenRouter() {
  console.log('Testing OpenRouter API...');
  console.log('API Key:', API_KEY.substring(0, 20) + '...');
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'HTTP-Referer': 'https://taxsage.vercel.app',
        'X-Title': 'TaxSage - CA Advisor',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [
          {
            role: 'user',
            content: 'Hello, just testing!'
          }
        ],
        max_tokens: 50,
      }),
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.error('ERROR:', data);
    } else {
      console.log('SUCCESS! Message:', data.choices[0].message.content);
    }
  } catch (error) {
    console.error('Exception:', error.message);
  }
}

testOpenRouter();
