// test-hf.js - Hugging Face API bağlantı testi
require('dotenv').config();
const axios = require('axios');

// API anahtarını kontrol et
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
console.log('API Key loaded:', HUGGINGFACE_API_KEY ? 'Yes (not showing for security)' : 'No');

// Test edilecek modeller
const MODELS = [
  {
    name: "Helsinki-NLP/opus-mt-tc-big-tr-en",
    url: "https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-tc-big-tr-en",
    testInput: { inputs: "Merhaba dünya" }
  },
  {
    name: "Helsinki-NLP/opus-mt-tr-en",
    url: "https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-tr-en",
    testInput: { inputs: "Merhaba dünya" }
  },
  {
    name: "facebook/nllb-200-distilled-600M",
    url: "https://api-inference.huggingface.co/models/facebook/nllb-200-distilled-600M",
    testInput: { 
      inputs: "Merhaba dünya",
      parameters: { 
        src_lang: "tur_Latn", 
        tgt_lang: "eng_Latn" 
      } 
    }
  },
  {
    name: "cardiffnlp/twitter-roberta-base-sentiment",
    url: "https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment",
    testInput: { inputs: "Hello world" }
  },
  {
    name: "nlptown/bert-base-multilingual-uncased-sentiment",
    url: "https://api-inference.huggingface.co/models/nlptown/bert-base-multilingual-uncased-sentiment",
    testInput: { inputs: "Hello world" }
  }
];

// Her modeli test et
async function testModels() {
  console.log('Testing Hugging Face API connections...');
  
  for (const model of MODELS) {
    console.log(`\nTesting model: ${model.name}`);
    
    try {
      const response = await axios.post(
        model.url,
        model.testInput,
        {
          headers: {
            'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 saniye timeout
        }
      );
      
      console.log('✅ Success! Response:', JSON.stringify(response.data).substring(0, 100) + '...');
    } catch (error) {
      console.error('❌ Error:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
    }
  }
}

// Test işlemini başlat
testModels().then(() => {
  console.log('\nTest completed.');
}).catch(err => {
  console.error('Test failed:', err);
});