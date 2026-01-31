import { prisma } from "@/lib/prisma";

export async function getLatestDatasetPayload(sourceName: string) {
  const source = await prisma.datasetSource.findUnique({
    where: { name: sourceName },
  });

  if (!source) {
    return null;
  }

  return prisma.datasetRecord.findFirst({
    where: { sourceId: source.id },
    orderBy: { createdAt: "desc" },
  });
}
