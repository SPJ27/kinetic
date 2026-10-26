import { runCommand } from "./run-cmd"

export const getStats = async (projectId: string) => {

    // get userId
    // run docker cmd
    // find all projects created by user
    // filter the docker processes by the container name
    // calc
    const res = await runCommand("docker", ["stats", "--no-stream", "--format", "{{json .}}"], {cwd: process.cwd(), projectId, stage: "stats", captureOutput: true } )
    const json = res.stdout?.split("\n").filter(line => line.trim() !== "").map(line => JSON.parse(line)) || []
    
    const totalCpuUsage = json.reduce((acc, curr) => {
        const cpuUsage = parseFloat(curr.CPUPerc.replace("%", ""));
        return acc + cpuUsage;
    }, 0);

    const totalMemoryUsage = json.reduce((acc, curr) => {
        const memoryUsage = parseFloat(curr.MemUsage.split("/")[0].replace("MiB", "").trim());
        return acc + memoryUsage;
    }, 0);

    const totalMemoryLimit = json.reduce((acc, curr) => {
        const memoryLimit = parseFloat(curr.MemUsage.split("/")[1].replace("MiB", "").trim());
        return acc + memoryLimit;
    }, 0);

    console.log("Total CPU Usage:", totalCpuUsage.toFixed(2) + "%");
    console.log("Total Memory Usage:", totalMemoryUsage.toFixed(2) + " MiB");
    console.log("Total Memory Limit:", totalMemoryLimit.toFixed(2) + " GiB");

    return {
        totalCpuUsage: totalCpuUsage.toFixed(2) + "%",
        totalMemoryUsage: totalMemoryUsage.toFixed(2) + " MiB",
        totalMemoryLimit: totalMemoryLimit.toFixed(2) + " GiB",
        containers: json
    }

    
}