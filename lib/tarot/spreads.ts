import type { LocalizedText, TarotSpread, TarotSpreadPosition } from './types.ts';

const t = (vi: string, en: string): LocalizedText => ({ vi, en });
const position = (
  id: string,
  vi: string,
  en: string,
  descriptionVi: string,
  descriptionEn: string
): TarotSpreadPosition => ({ id, name: t(vi, en), description: t(descriptionVi, descriptionEn) });

export const tarotSpreads: TarotSpread[] = [
  {
    id: 'single',
    name: t('Một lá', 'Single card'),
    description: t('Một thông điệp trọng tâm cho hiện tại.', 'One focused message for the present moment.'),
    positions: [position('single-1', 'Thông điệp', 'Guidance', 'Điều quan trọng nhất cần nhìn thấy lúc này.', 'The central message to notice now.')]
  },
  {
    id: 'three-card',
    name: t('Quá khứ · Hiện tại · Tương lai', 'Past · Present · Future'),
    description: t('Nhìn lại tiến trình và xu hướng nếu bạn tiếp tục con đường hiện tại.', 'See the story so far and the likely direction of the current path.'),
    positions: [
      position('three-1', 'Quá khứ', 'Past', 'Ảnh hưởng đã tạo nên tình huống hiện tại.', 'What shaped the present situation.'),
      position('three-2', 'Hiện tại', 'Present', 'Năng lượng và thử thách chính lúc này.', 'The central energy and challenge now.'),
      position('three-3', 'Tương lai gần', 'Near future', 'Xu hướng có thể hình thành từ lựa chọn hiện tại.', 'The direction suggested by current choices.')
    ]
  },
  {
    id: 'two-options',
    name: t('Hai lựa chọn', 'Two options'),
    description: t('So sánh hai hướng đi mà không tước quyền quyết định của bạn.', 'Compare two paths without taking the decision away from you.'),
    positions: [
      position('two-options-1', 'Tình huống hiện tại', 'Current situation', 'Điều thực sự nằm sau lựa chọn này.', 'What sits underneath this choice.'),
      position('two-options-2', 'Tiến trình A', 'Option A process', 'Trải nghiệm và thử thách trên con đường A.', 'The experience and challenge of path A.'),
      position('two-options-3', 'Kết quả A', 'Option A outcome', 'Xu hướng kết quả của con đường A.', 'The likely direction of path A.'),
      position('two-options-4', 'Tiến trình B', 'Option B process', 'Trải nghiệm và thử thách trên con đường B.', 'The experience and challenge of path B.'),
      position('two-options-5', 'Kết quả B', 'Option B outcome', 'Xu hướng kết quả của con đường B.', 'The likely direction of path B.')
    ]
  },
  {
    id: 'relationship',
    name: t('Mối quan hệ', 'Relationship'),
    description: t('Khám phá hai phía, sự kết nối, thử thách và tiềm năng.', 'Explore both sides, the bond, the challenge and its potential.'),
    positions: [
      position('relationship-1', 'Năng lượng của bạn', 'Your energy', 'Cảm xúc và thái độ của bạn trong mối quan hệ.', 'Your feelings and stance in the relationship.'),
      position('relationship-2', 'Năng lượng đối phương', "The other's energy", 'Năng lượng được phản chiếu từ phía còn lại, không phải khẳng định suy nghĩ riêng tư.', 'The energy reflected by the other side, not a factual claim about private thoughts.'),
      position('relationship-3', 'Sự kết nối', 'The connection', 'Mẫu tương tác hiện tại giữa hai người.', 'The current pattern between both people.'),
      position('relationship-4', 'Thử thách', 'The challenge', 'Điều cần được nhìn nhận hoặc chữa lành.', 'What needs attention or repair.'),
      position('relationship-5', 'Tiềm năng', 'Potential', 'Hướng phát triển nếu hai bên tiếp tục như hiện tại.', 'The direction if both sides continue as they are.')
    ]
  },
  {
    id: 'timeline',
    name: t('Dòng thời gian', 'Timeline'),
    description: t('Tìm gốc rễ, tiến trình và hành động phù hợp.', 'Trace the roots, direction and useful next action.'),
    positions: [
      position('timeline-1', 'Gốc rễ', 'Root cause', 'Nguyên nhân sâu hơn của vấn đề.', 'The deeper root of the situation.'),
      position('timeline-2', 'Ảnh hưởng quá khứ', 'Past influence', 'Cách trải nghiệm cũ vẫn đang tác động.', 'How earlier experiences still influence events.'),
      position('timeline-3', 'Hiện tại', 'Present', 'Nút thắt hoặc cơ hội ở thời điểm này.', 'The current knot or opportunity.'),
      position('timeline-4', 'Xu hướng gần', 'Near-term direction', 'Điều có thể phát triển trong thời gian tới.', 'What may develop in the near term.'),
      position('timeline-5', 'Hành động', 'Action', 'Bước đi thiết thực nên cân nhắc.', 'A practical next step to consider.')
    ]
  },
  {
    id: 'celtic-cross',
    name: t('Celtic Cross', 'Celtic Cross'),
    description: t('Góc nhìn toàn cảnh cho một vấn đề phức tạp.', 'A panoramic reading for a complex question.'),
    positions: [
      position('celtic-1', 'Hiện trạng', 'Present', 'Trung tâm của vấn đề.', 'The heart of the matter.'),
      position('celtic-2', 'Thử thách', 'Challenge', 'Lực cản hoặc điều đang giao cắt.', 'The obstacle or crossing influence.'),
      position('celtic-3', 'Nền tảng', 'Foundation', 'Gốc rễ nằm dưới bề mặt.', 'The root beneath the surface.'),
      position('celtic-4', 'Quá khứ', 'Past', 'Điều đang dần rời khỏi tình huống.', 'What is passing out of the situation.'),
      position('celtic-5', 'Khả năng cao nhất', 'Possibility', 'Mục tiêu hoặc tiềm năng có thể hướng tới.', 'The aim or possibility above.'),
      position('celtic-6', 'Tương lai gần', 'Near future', 'Ảnh hưởng sắp bước vào.', 'The influence approaching next.'),
      position('celtic-7', 'Thái độ của bạn', 'Your stance', 'Cách bạn đang nhìn và giữ mình.', 'How you are holding and seeing yourself.'),
      position('celtic-8', 'Môi trường', 'Environment', 'Ảnh hưởng bên ngoài và nguồn hỗ trợ.', 'External influences and available support.'),
      position('celtic-9', 'Hy vọng và nỗi sợ', 'Hopes and fears', 'Mong muốn hoặc lo ngại đang chi phối.', 'The hopes or fears shaping the question.'),
      position('celtic-10', 'Xu hướng kết quả', 'Likely outcome', 'Kết quả có thể xảy ra nếu năng lượng hiện tại tiếp tục.', 'The likely result if present patterns continue.')
    ]
  }
];

const spreadMap = new Map(tarotSpreads.map((spread) => [spread.id, spread]));

export function getTarotSpread(id: string): TarotSpread | undefined {
  return spreadMap.get(id);
}

export function getDefaultTarotSpread(): TarotSpread {
  return spreadMap.get('three-card')!;
}
