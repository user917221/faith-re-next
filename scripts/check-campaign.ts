import { getCampaignContext } from "@/lib/campaign";

async function main() {
  const ctx = await getCampaignContext();
  console.log("CAMPAIGN:", ctx.campaign.name, "| threat", ctx.campaign.threatLevel, "| morale", ctx.campaign.partyMorale, "| quests", ctx.campaign.questsActive);
  console.log("SESSION:", ctx.session.number, "| elapsed", ctx.session.elapsedSeconds, "s | running", ctx.session.running);
  console.log("CAMPAIGNS COUNT:", ctx.campaigns.length);
  process.exit(0);
}
main().catch((e) => {
  console.error("ERR", e);
  process.exit(1);
});
