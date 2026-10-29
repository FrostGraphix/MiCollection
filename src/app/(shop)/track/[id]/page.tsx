import { redirect } from 'next/navigation';

export default function TrackByIdPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { email?: string; phone?: string };
}) {
  const query = new URLSearchParams();
  if (params.id) query.set('id', params.id);
  if (searchParams?.email) query.set('email', searchParams.email);
  if (searchParams?.phone) query.set('phone', searchParams.phone);

  redirect(`/track?${query.toString()}`);
}
