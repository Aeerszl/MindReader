// eslint-disable-next-line no-unused-vars
import React from 'react';

const About = () => {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">Hakkında</h1>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-medium text-gray-700 mb-2">Mind Reader Nedir?</h2>
          <p className="text-gray-600">
            Mind Reader, metinlerdeki duygu ve düşünceleri analiz eden yapay zeka destekli 
            bir duygu analizi uygulamasıdır. Kullanıcıların yazdığı metinlerin duygusal 
            içeriğini anlamlandırarak, metinde geçen duyguların görselleştirilmesini sağlar.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-medium text-gray-700 mb-2">Nasıl Çalışır?</h2>
          <p className="text-gray-600">
            Uygulama, gelişmiş doğal dil işleme modelleri kullanarak metindeki duygu 
            ifadelerini tespit eder ve sınıflandırır. Metin Türkçe ise önce İngilizce'ye 
            çevrilir, ardından duygu analizi yapılır ve sonuçlar grafikler halinde gösterilir.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-medium text-gray-700 mb-2">Teknolojiler</h2>
          <ul className="list-disc pl-5 text-gray-600">
            <li>Frontend: React, TailwindCSS, Recharts</li>
            <li>Backend: Node.js, Express</li>
            <li>API: Hugging Face, Google Translate</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default About;
