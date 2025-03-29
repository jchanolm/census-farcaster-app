import neo4j from 'neo4j-driver';

// Create driver instance
const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USER || 'neo4j',
    process.env.NEO4J_PASS || ''
  )
);

// Function to run Cypher queries
export async function runQuery(cypher: string, params = {}) {
  const session = driver.session();
  try {
    const result = await session.run(cypher, params);
    return result.records;
  } finally {
    await session.close();
  }
}

// Close driver on app shutdown
export async function closeDriver() {
  await driver.close();
}