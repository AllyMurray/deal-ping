#!/usr/bin/env node
/**
 * Migration script: Migrate deals from global to per-channel storage
 *
 * Old format: Deals keyed by dealId only (one record per deal)
 * New format: Deals keyed by channelId + dealId (one record per channel per deal)
 *
 * This migration:
 * 1. Reads all existing deals (old format)
 * 2. For each deal, finds all channels that have that search term configured
 * 3. Creates a new deal record for each matching channel
 * 4. Deletes the old deal record
 */

process.env.TABLE_NAME = process.env.TABLE_NAME || 'hotukdeals';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { getAllConfigs } from '../src/db/repository';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME;

interface OldDealRecord {
  pk: string;
  sk: string;
  dealId: string;
  searchTerm: string;
  title: string;
  link: string;
  price?: string;
  merchant?: string;
  matchDetails?: string;
  filterStatus: string;
  filterReason?: string;
  notified?: boolean;
  timestamp?: number;
  createdAt?: string;
  ttl?: number;
  gsi1pk?: string;
  gsi1sk?: string;
}

interface NewDealRecord extends OldDealRecord {
  channelId: string;
}

async function scanOldDeals(): Promise<OldDealRecord[]> {
  const deals: OldDealRecord[] = [];
  let lastEvaluatedKey: Record<string, unknown> | undefined;

  do {
    const result = await docClient.send(new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'begins_with(pk, :prefix)',
      ExpressionAttributeValues: {
        // Old format used lowercase 'deal#'
        ':prefix': 'deal#',
      },
      ExclusiveStartKey: lastEvaluatedKey,
    }));

    if (result.Items) {
      deals.push(...(result.Items as OldDealRecord[]));
    }
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return deals;
}

async function deleteOldDeal(deal: OldDealRecord): Promise<void> {
  await docClient.send(new DeleteCommand({
    TableName: TABLE_NAME,
    Key: {
      pk: deal.pk,
      sk: deal.sk,
    },
  }));
}

async function createNewDeal(deal: OldDealRecord, channelId: string): Promise<void> {
  const newRecord: NewDealRecord = {
    ...deal,
    channelId,
    // Update keys to new format
    pk: `CHANNEL#${channelId}`,
    sk: `DEAL#${deal.dealId}`,
    // Update GSI keys for new format
    gsi1pk: `CHANNEL#${channelId}#SEARCH#${deal.searchTerm}`,
    gsi1sk: `TS#${deal.timestamp || Date.now()}`,
  };

  // Add entity metadata for ElectroDB
  (newRecord as Record<string, unknown>).__edb_e__ = 'Deal';
  (newRecord as Record<string, unknown>).__edb_v__ = '2';

  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: newRecord,
  }));
}

async function migrate() {
  console.log('Starting deal migration: global -> per-channel\n');

  // Step 1: Get all search term configs to map searchTerm -> channelIds
  console.log('Step 1: Loading search term configurations...');
  const configs = await getAllConfigs();

  // Build map of searchTerm (lowercase) -> channelIds
  const searchTermToChannels = new Map<string, Set<string>>();
  for (const config of configs) {
    const key = config.searchTerm.toLowerCase();
    if (!searchTermToChannels.has(key)) {
      searchTermToChannels.set(key, new Set());
    }
    searchTermToChannels.get(key)!.add(config.channelId);
  }

  console.log(`Found ${configs.length} search term configs across ${searchTermToChannels.size} unique search terms\n`);

  // Step 2: Scan all old deals
  console.log('Step 2: Scanning existing deals...');
  const oldDeals = await scanOldDeals();
  console.log(`Found ${oldDeals.length} deals to migrate\n`);

  if (oldDeals.length === 0) {
    console.log('No deals to migrate. Done!');
    return;
  }

  // Step 3: Process each deal
  console.log('Step 3: Migrating deals...\n');

  let migratedCount = 0;
  let skippedCount = 0;
  let newRecordsCreated = 0;

  for (const deal of oldDeals) {
    // Skip if this is already a new-format record (pk starts with CHANNEL#)
    if (deal.pk.startsWith('CHANNEL#') || deal.channelId) {
      skippedCount++;
      continue;
    }

    const searchTermKey = deal.searchTerm.toLowerCase();
    const channelIds = searchTermToChannels.get(searchTermKey);

    if (!channelIds || channelIds.size === 0) {
      console.log(`  [WARN] No channels found for search term "${deal.searchTerm}" (deal ${deal.dealId})`);
      // Still delete the old record since no channel uses this search term anymore
      await deleteOldDeal(deal);
      migratedCount++;
      continue;
    }

    // Create a new record for each channel
    for (const channelId of channelIds) {
      await createNewDeal(deal, channelId);
      newRecordsCreated++;
    }

    // Delete the old record
    await deleteOldDeal(deal);
    migratedCount++;

    if (migratedCount % 50 === 0) {
      console.log(`  Processed ${migratedCount}/${oldDeals.length} deals...`);
    }
  }

  console.log('\n=== Migration Complete ===');
  console.log(`Deals processed: ${migratedCount}`);
  console.log(`Already migrated (skipped): ${skippedCount}`);
  console.log(`New records created: ${newRecordsCreated}`);
  console.log('\nNote: If a deal matched multiple channels, it now has a record for each channel.');
}

migrate().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
