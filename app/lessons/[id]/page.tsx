import { LessonDetailPageClient } from "@/src/components/lesson-detail-client";

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lessonId = Number(id);

  return <LessonDetailPageClient id={lessonId} />;
}
