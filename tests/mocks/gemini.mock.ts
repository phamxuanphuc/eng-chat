import { ChatMessage, TranslateExplainResult } from '../../src/types';

export const mockChatContext: ChatMessage[] = [
  { sender: 'Alice', text: 'Can you please review the PR when you are free?' },
  { sender: 'Bob', text: 'Sure, I am on it right now.' },
  { sender: 'Alice', text: 'Did you find any issues with the payment gateway?' },
];

export const mockGeminiResponseText =
  'I have reviewed the payment gateway implementation and it looks solid.';

export const mockTranslateExplainResult: TranslateExplainResult = {
  translation: 'Tôi đã xem xét việc triển khai cổng thanh toán và nó rất ổn định.',
  explanation: {
    vocabulary: [
      { word: 'implementation', meaning: 'sự triển khai, thi hành' },
      { word: 'solid', meaning: 'vững chắc, ổn định' },
    ],
    grammar: 'Sử dụng thì hiện tại hoàn thành "have reviewed" để chỉ hành động vừa mới hoàn thành.',
    nuances: 'Từ "solid" mang sắc thái khen ngợi tự nhiên trong môi trường công nghệ.',
  },
};

export const mockGeminiSuccessRawResponse = {
  candidates: [
    {
      content: {
        parts: [
          {
            text: mockGeminiResponseText,
          },
        ],
      },
    },
  ],
};

export const mockGeminiJsonRawResponse = {
  candidates: [
    {
      content: {
        parts: [
          {
            text: JSON.stringify(mockTranslateExplainResult),
          },
        ],
      },
    },
  ],
};
