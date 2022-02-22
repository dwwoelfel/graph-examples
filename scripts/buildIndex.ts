import sqllite, { Database } from "better-sqlite3";
import fs from "fs";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkFrontmatter from "remark-frontmatter";
import remarkStringify from "remark-stringify";
import { parse as parseYaml } from "yaml";
import { parse } from "graphql";

console.log(JSON.stringify(process.env, null, 2));
console.log(
  'TOKEN',
  Buffer.from(process.env.ONEGRAPH_AUTHLIFY_TOKEN).toString('base64'),
);

const schema = /* sql */ `
create table query (
  operationName text primary key,
  body text,
  doc text,
  services json -- text[]
);

create table query_join_service (
  operationName text references query (operationName),
  service text
);
`;

export function initDb(db: Database) {
  db.exec(schema);
}

async function loadExamples(db: Database) {
  const saveQuery = db.prepare(
    "insert into query (operationName, body, doc, services) values ($operationName, $body, $doc, $services)"
  );
  const saveQueryJoinService = db.prepare(
    "insert into query_join_service (operationName, service) values ($operationName, $service)"
  );

  for (const fileName of fs.readdirSync("./examples")) {
    const file = fs.readFileSync(`./examples/${fileName}`, {
      encoding: "utf8",
    });

    let mdTree = null;

    await unified()
      .use(remarkParse)
      .use(remarkStringify)
      .use(remarkFrontmatter, ["yaml"])
      .use(() => (tree) => {
        mdTree = tree;
      })
      .process(file);

    if (!mdTree) {
      throw new Error("Unable to parse " + fileName);
    }

    const [yamlNode, queryNode] = mdTree.children;

    if (yamlNode?.type !== "yaml" && queryNode.type !== "code") {
      throw new Error("Invalid markdown file " + fileName);
    }

    const config = parseYaml(yamlNode.value);
    const query = queryNode.value;
    try {
      parse(query);
    } catch (e) {
      throw new Error("Invalid markdown file, invalid query " + fileName);
    }
    const { operationName, doc, services } = config;

    if (!operationName || !services) {
      throw new Error(
        "Invalid markdown file, missing operationName or services " + fileName
      );
    }

    saveQuery.run({
      operationName,
      body: query,
      doc,
      services: JSON.stringify(services),
    });

    for (const service of services) {
      saveQueryJoinService.run({ operationName, service });
    }
  }
}

function persistDb(db: Database) {
  fs.writeFileSync(
    "./netlify/functions/db.json",
    JSON.stringify({ db: db.serialize().toString("base64") })
  );
}

export async function buildIndex() {
  const db = sqllite(":memory:");
  initDb(db);
  await loadExamples(db);
  console.log(
    "loaded %s examples, %s",
    db.prepare("select count(*) as count from query").get().count,
    JSON.stringify(db.prepare("select operationName from query").all())
  );
  persistDb(db);
}

if (require.main === module) {
  buildIndex();
}
