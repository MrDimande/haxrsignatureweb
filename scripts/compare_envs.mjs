import { readFileSync } from "node:fs";

const keyRoot = readFileSync("c:/project-x/haxrsignature/.env.development.local", "utf8");
const keyStage2 = readFileSync("c:/project-x/haxrsignature-stage2/.env.development.local", "utf8");

console.log("Root .env.development.local length:", keyRoot.length);
console.log("Stage2 .env.development.local length:", keyStage2.length);
console.log("Are contents identical?", keyRoot.trim() === keyStage2.trim());
