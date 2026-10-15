import { ToneType } from '../types';

export interface ToneItem {
  id: ToneType;
  title: string;
  desc: string;
  icon: string;
}

export const TONES_LIST: ToneItem[] = [
  { id: 'polite', title: 'Lịch sự & Trang trọng', desc: 'Email đối tác, thư từ trang trọng', icon: '🎩' },
  { id: 'professional', title: 'Chuyên nghiệp & Công sở', desc: 'Báo cáo kỹ thuật, trao đổi công việc', icon: '💼' },
  { id: 'friendly', title: 'Thân thiện & Tự nhiên', desc: 'Trò chuyện đồng nghiệp, chat nhóm', icon: '🤝' },
  { id: 'concise', title: 'Ngắn gọn & Trực diện', desc: 'Rút ngắn câu từ, loại bỏ từ thừa', icon: '⚡' },
  { id: 'translate_explain', title: 'Dịch & Giải thích chi tiết', desc: 'Dịch 2 chiều kèm ngữ pháp & từ vựng', icon: '📖' },
];
