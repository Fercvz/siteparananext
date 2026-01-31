import { prisma } from "@/lib/prisma";

export async function getCampaignData() {
  const aggregates = await prisma.campaignAggregate.findMany();

  if (aggregates.length) {
    return aggregates.reduce((acc, row) => {
      acc[row.cityId] = { votes: row.votes, money: row.money };
      return acc;
    }, {} as Record<string, { votes: number; money: number }>);
  }

  const [votes, investments] = await Promise.all([
    prisma.vote.groupBy({
      by: ["cityId"],
      _sum: { votes: true },
    }),
    prisma.investment.groupBy({
      by: ["cityId"],
      _sum: { value: true },
    }),
  ]);

  const map: Record<string, { votes: number; money: number }> = {};

  votes.forEach((row) => {
    map[row.cityId] = {
      votes: row._sum.votes || 0,
      money: 0,
    };
  });

  investments.forEach((row) => {
    if (!map[row.cityId]) {
      map[row.cityId] = { votes: 0, money: 0 };
    }
    map[row.cityId].money = row._sum.value || 0;
  });

  return map;
}
