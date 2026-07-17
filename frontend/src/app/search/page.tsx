import { Metadata } from 'next';
import SearchClient from './SearchClient';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
  { searchParams }: Props
): Promise<Metadata> {
  const params = await searchParams;
  const origin = params.origin as string || '';
  const destination = params.destination as string || '';
  const dateStr = params.departureDate as string || '';
  
  if (origin && destination) {
    let dateFormatted = dateStr;
    if (dateStr) {
      try {
        dateFormatted = new Date(dateStr).toLocaleDateString('vi-VN');
      } catch (e) {}
    }
    const dateText = dateFormatted ? ` ngày ${dateFormatted}` : '';
    return {
      title: `Vé xe ${origin} đi ${destination}${dateText} | Hệ thống đặt vé`,
      description: `Tìm và đặt vé xe khách từ ${origin} đi ${destination}${dateText} với giá tốt nhất, nhiều lựa chọn nhà xe và loại xe.`,
    };
  }
  
  return {
    title: 'Tìm kiếm chuyến đi | Hệ thống đặt vé',
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  return <SearchClient initialParams={params} />;
}
