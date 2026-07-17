import { cosineSimilarity, embed, embedMany } from "ai";
import { busAdvisorEmbeddingModel } from "./github-models";

type IndexedPolicy = {
  title: string;
  text: string;
  embedding: number[];
};

const POLICIES = [
  {
    title: "Chính sách hủy vé và hoàn tiền",
    text: `
# CHÍNH SÁCH HỦY VÉ VÀ HOÀN TIỀN
1. Hủy trước 24 giờ khởi hành: Khách hàng được hoàn trả 100% số tiền vé.
2. Hủy trước 12 đến 24 giờ khởi hành: Khách hàng được hoàn trả 50% số tiền vé.
3. Hủy trong vòng 12 giờ trước khi khởi hành: Không được hoàn tiền.
4. Cách thức nhận tiền: Tiền hoàn sẽ được tự động chuyển về tài khoản thẻ/ngân hàng đã dùng để thanh toán trong vòng 3-5 ngày làm việc.
    `
  },
  {
    title: "Hướng dẫn thủ tục lên xe (Check-in)",
    text: `
# HƯỚNG DẪN THỦ TỤC LÊN XE
1. Thời gian có mặt: Hành khách vui lòng có mặt tại trạm/bến xe ít nhất 30 phút trước giờ khởi hành.
2. Kiểm tra thông tin: Xuất trình mã vé (Booking ID) hoặc số điện thoại đặt vé kèm giấy tờ tùy thân có ảnh cho nhân viên phụ xe.
3. Hành lý: Mỗi hành khách được mang theo tối đa 20kg hành lý ký gửi và 1 kiện hành lý xách tay nhỏ gọn.
    `
  }
];

let cachedIndex: {
  createdAt: number;
  items: IndexedPolicy[];
} | null = null;

const INDEX_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function buildPolicyIndex(): Promise<IndexedPolicy[]> {
  const values = POLICIES.map(p => `Tiêu đề: ${p.title}\nNội dung: ${p.text}`);
  
  const { embeddings } = await embedMany({
    model: busAdvisorEmbeddingModel,
    values,
  });

  return POLICIES.map((policy, index) => ({
    ...policy,
    embedding: embeddings[index],
  }));
}

async function getPolicyIndex(): Promise<IndexedPolicy[]> {
  const now = Date.now();

  if (cachedIndex && now - cachedIndex.createdAt < INDEX_TTL_MS) {
    return cachedIndex.items;
  }

  const items = await buildPolicyIndex();

  cachedIndex = {
    createdAt: now,
    items,
  };

  return items;
}

export async function searchPoliciesByRag(
  query: string,
  limit: number = 2
) {
  const index = await getPolicyIndex();

  if (index.length === 0) {
    return [];
  }

  const { embedding: queryEmbedding } = await embed({
    model: busAdvisorEmbeddingModel,
    value: query,
  });

  return index
    .map((item) => ({
      title: item.title,
      text: item.text,
      score: cosineSimilarity(queryEmbedding, item.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
