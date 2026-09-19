async function test() {
  const payload = {
    message: "tôi muốn biết năm 2026 sự nghiệp có khởi sắc không",
    decision: {
      mode: "single",
      intent: "general",
      needsTarot: true,
      spreadId: "single",
      cardCount: 1,
      targetIndicators: ["walksOfLife", "yearIndividual"],
      thoughtProcess: "Tiểu Linh Miêu kết nối năng lượng trực giác và rút 1 lá Tarot dẫn lối cho câu hỏi của bạn."
    },
    profiles: [
      { fullName: "Nguyen Van An", birthDate: "1995-08-20", gender: "male" }
    ],
    tarotCards: [
      {
        card: {
          id: "the-magician",
          name: "The Magician",
          nameVi: "Pháp Sư",
          arcana: "major",
          number: 1,
          keywords: ["Ý chí", "Hành động", "Biến đổi"],
          uprightSummary: "Biến mọi ý tưởng thành hiện thực nhờ công cụ có sẵn."
        },
        isUpright: true,
        positionNameVi: "Thông điệp trọng tâm"
      }
    ]
  };

  const res = await fetch("http://localhost:3200/api/chat/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  console.log("Status:", res.status);
  console.log("OK:", data.ok);
  if (data.ok) {
    console.log("Reply:\n", data.data.replyText);
    console.log("Indicators1:\n", JSON.stringify(data.data.cardPayload.indicators1, null, 2));
  } else {
    console.error("Error:", data.error);
  }
}

test().catch(console.error);
