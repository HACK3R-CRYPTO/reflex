import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const treasury = deployer.address;
  console.log("Deploying Reflex contracts with:", deployer.address);

  // 1. ReflexToken
  const RFX = await ethers.getContractFactory("ReflexToken");
  const rfx = await RFX.deploy(deployer.address);
  await rfx.waitForDeployment();
  const rfxAddr = await rfx.getAddress();
  console.log("✅ ReflexToken:", rfxAddr);

  // 2. ReflexSwap
  const Swap = await ethers.getContractFactory("ReflexSwap");
  const swap = await Swap.deploy(rfxAddr, deployer.address);
  await swap.waitForDeployment();
  const swapAddr = await swap.getAddress();
  await (await rfx.setMinter(swapAddr, true)).wait();
  console.log("✅ ReflexSwap:", swapAddr);

  // 3. ReflexPass
  const Pass = await ethers.getContractFactory("ReflexPass");
  const pass = await Pass.deploy(rfxAddr, treasury, deployer.address);
  await pass.waitForDeployment();
  const passAddr = await pass.getAddress();
  console.log("✅ ReflexPass:", passAddr);

  // 4. AgentRegistry
  const Registry = await ethers.getContractFactory("AgentRegistry");
  const registry = await Registry.deploy(deployer.address);
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log("✅ AgentRegistry:", registryAddr);

  // 5. ArenaPlatform (contains the native AI)
  const Arena = await ethers.getContractFactory("ArenaPlatform");
  const arena = await Arena.deploy(rfxAddr, passAddr, treasury, deployer.address);
  await arena.waitForDeployment();
  const arenaAddr = await arena.getAddress();
  console.log("✅ ArenaPlatform:", arenaAddr);

  // 6. ReactiveLeaderboard
  const LB = await ethers.getContractFactory("ReactiveLeaderboard");
  const lb = await LB.deploy(deployer.address);
  await lb.waitForDeployment();
  const lbAddr = await lb.getAddress();
  console.log("✅ ReactiveLeaderboard:", lbAddr);

  // 7. ReactiveHandler (Somnia Reactivity on-chain subscriber)
  const Handler = await ethers.getContractFactory("ReactiveHandler");
  const handler = await Handler.deploy(deployer.address);
  await handler.waitForDeployment();
  const handlerAddr = await handler.getAddress();
  await (await handler.setArenaPlatform(arenaAddr)).wait();
  console.log("✅ ReactiveHandler:", handlerAddr);

  // ── Wire permissions ──
  await (await registry.setStatUpdater(arenaAddr, true)).wait();
  await (await arena.setLeaderboard(lbAddr)).wait();
  await (await arena.setAgentRegistry(registryAddr)).wait();
  await (await lb.setAuthorizedCaller(arenaAddr, true)).wait();

  // Register NEXUS (the arena itself is the native AI agent)
  await (await registry.registerOfficial(arenaAddr, "NEXUS", "Native Reactive AI using prevrandao")).wait();

  // Fund house with 1000 RFX for prize pool
  await (await rfx.approve(arenaAddr, ethers.parseEther("1000"))).wait();
  await (await arena.fundHouse(ethers.parseEther("1000"))).wait();
  console.log("✅ House funded with 1000 RFX");

  console.log("\n=== Deployment Complete ===");
  console.log("Update your .env with:");
  console.log(`REFLEX_TOKEN_ADDRESS=${rfxAddr}`);
  console.log(`REFLEX_SWAP_ADDRESS=${swapAddr}`);
  console.log(`REFLEX_PASS_ADDRESS=${passAddr}`);
  console.log(`AGENT_REGISTRY_ADDRESS=${registryAddr}`);
  console.log(`ARENA_PLATFORM_ADDRESS=${arenaAddr}`);
  console.log(`REACTIVE_LEADERBOARD_ADDRESS=${lbAddr}`);
  console.log(`REACTIVE_HANDLER_ADDRESS=${handlerAddr}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exitCode = 1;
  });
