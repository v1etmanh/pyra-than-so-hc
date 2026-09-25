import { readFileSync } from 'node:fs';

async function testAgentRoute() {
  const url = 'http://localhost:3000/api/chat/agent'; // hoặc port 3200? Hãy xem port đang chạy
  const body = {
    message: "Hôm nay tôi cảm thấy hơi mệt, lá bài nói lên điều gì?",
    decision: {
      mode: 'single',
      intent: 'general',
      needsTarot: true,
      spreadId: 'single',
      cardCount: 1,
      targetIndicators: ['walksOfLife', 'soul']
    },
    profiles: [
      { fullName: 'Nguyễn Văn A', birthDate: '1995-10-24', gender: 'male' }
    ],
    indicators: {
      profile1: [{ key: 'walksOfLife', name: 'Đường đời', value: 7 }]
    },
    tarotCards: [
      {
        card: {
          id: 'magician',
          nameVi: 'Nhà Ảo Thuật',
          nameEn: 'The Magician',
          meaningUpright: 'Sức mạnh ý chí, sáng tạo, hành động.',
          meaningReversed: 'Năng lực đang bị phân tán hoặc sử dụng chưa đúng mục đích.'
        },
        isReversed: true,
        position: { nameVi: 'Thông điệp Trực Giác' }
      }
    ]
  };

  for (const port of [3000, 3200, 3001]) {
    try {
      console.log(`Trying http://localhost:${port}/api/chat/agent...`);
      const res = await fetch(`http://localhost:${port}/api/chat/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      console.log(`Port ${port} status:`, res.status);
      const data = await res.json();
      console.log(`Response on port ${port}:`, JSON.stringify(data, null, 2));
      return;
    } catch (e) {
      console.log(`Port ${port} failed:`, e.message);
    }
  }
}

testAgentRoute().catch(console.error);
